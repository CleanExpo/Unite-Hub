import { createMessage, parseJSONResponse } from '@/lib/claude/client';
import { createClient } from '@/lib/supabase/server';
import { assertAiFeatureEnabled, checkDailyQuota } from '@/lib/guardian/ai/aiConfig';

/**
 * Guardian AI Explainability Hub (H09)
 *
 * Generates AI-powered explanations for Guardian objects.
 * Explains WHY alerts fired, incidents occurred, risk scores changed, etc.
 *
 * Design Principles:
 * - Privacy-friendly: Aggregated context only (no raw payloads, no PII)
 * - Feature attribution: Identifies contributing factors with weights
 * - Type-safe: Validated responses
 * - Advisory: Explains but doesn't change configurations
 * - Governed: Respects H05 toggles and quotas
 */

export type GuardianEntityType =
  | 'alert'
  | 'incident'
  | 'correlation_cluster'
  | 'anomaly_score'
  | 'predictive_score'
  | 'risk_snapshot';

export interface GuardianExplainabilityRequest {
  tenantId: string;
  entityType: GuardianEntityType;
  entityId: string;
  contextWindowHours?: number;
  createdBy?: string;
}

export interface GuardianFeatureAttribution {
  name: string;
  weight: number;
  direction?: 'increases' | 'decreases';
  category?: string;
}

export interface GuardianExplainabilityResult {
  summaryMarkdown: string;
  featureAttributions: GuardianFeatureAttribution[];
  contextWindow?: {
    start?: string;
    end?: string;
  };
  explanationType: 'local' | 'trend' | 'mixed';
}

/**
 * Load context for entity (privacy-friendly)
 */
async function loadEntityContext(
  tenantId: string,
  entityType: GuardianEntityType,
  entityId: string,
  windowHours: number
): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  switch (entityType) {
    case 'alert':
      // Load alert + surrounding context
      const { data: alert } = await supabase
        .from('guardian_alert_events')
        .select('id, rule_id, severity, source, message, created_at')
        .eq('id', entityId)
        .eq('tenant_id', tenantId)
        .single();

      if (!alert) return {};

      // Get surrounding alerts from same rule
      const { data: relatedAlerts } = await supabase
        .from('guardian_alert_events')
        .select('severity, created_at')
        .eq('tenant_id', tenantId)
        .eq('rule_id', (alert as any).rule_id)
        .gte('created_at', windowStart.toISOString())
        .limit(50);

      return {
        alert: {
          id: alert.id,
          ruleId: (alert as any).rule_id,
          severity: (alert as any).severity,
          source: (alert as any).source,
        },
        relatedAlerts: {
          count: relatedAlerts?.length ?? 0,
          severities: relatedAlerts?.map((a: any) => a.severity) ?? [],
        },
      };

    case 'incident':
      const { data: incident } = await supabase
        .from('incidents')
        .select('id, severity, status, created_at')
        .eq('id', entityId)
        .eq('tenant_id', tenantId)
        .single();

      if (!incident) return {};

      return {
        incident: {
          id: incident.id,
          severity: (incident as any).severity,
          status: (incident as any).status,
        },
      };

    case 'anomaly_score':
      const { data: anomaly } = await supabase
        .from('guardian_anomaly_scores')
        .select('anomaly_score, confidence, explanation, window_start, window_end')
        .eq('id', entityId)
        .eq('tenant_id', tenantId)
        .single();

      if (!anomaly) return {};

      return {
        anomaly: {
          score: Number((anomaly as any).anomaly_score),
          confidence: Number((anomaly as any).confidence),
          explanation: (anomaly as any).explanation,
        },
      };

    case 'risk_snapshot':
      const { data: risk } = await supabase
        .from('guardian_risk_scores')
        .select('date, score, breakdown')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })
        .limit(7);

      if (!risk || risk.length === 0) return {};

      return {
        risk: {
          current: Number((risk[0] as any).score),
          trend: risk.length >= 2 ? Number((risk[0] as any).score) - Number((risk[1] as any).score) : null,
          history: risk.map((r: any) => ({ date: r.date, score: Number(r.score) })),
        },
      };

    default:
      return {};
  }
}

/**
 * Generate explanation for Guardian entity
 */
export async function generateExplanation(
  request: GuardianExplainabilityRequest
): Promise<GuardianExplainabilityResult> {
  try {
    // H05: Check if explainability feature is enabled
    await assertAiFeatureEnabled(request.tenantId, 'explainability');

    // H05: Check daily quota
    const quota = await checkDailyQuota(request.tenantId);
    if (quota.exceeded) {
      throw new Error(
        `QUOTA_EXCEEDED: Daily AI call limit reached (${quota.current}/${quota.limit})`
      );
    }

    const windowHours = request.contextWindowHours ?? 24;

    // Load entity context
    const context = await loadEntityContext(
      request.tenantId,
      request.entityType,
      request.entityId,
      windowHours
    );

    // Build AI prompt
    const prompt = buildExplainabilityPrompt(request.entityType, request.entityId, context);

    // Call Claude Sonnet 4.5
    const message = await createMessage(
      [{ role: 'user', content: prompt }],
      buildExplainabilitySystemPrompt(),
      {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1536,
        temperature: 0.3,
      }
    );

    // Parse response
    const response = parseJSONResponse<GuardianExplainabilityResult>(message);

    // Validate
    if (!response.summaryMarkdown || !Array.isArray(response.featureAttributions)) {
      throw new Error('Invalid AI response: missing required fields');
    }

    // Store in database
    const supabase = await createClient();
    await supabase.from('guardian_ai_explanations').insert({
      tenant_id: request.tenantId,
      entity_type: request.entityType,
      entity_id: request.entityId,
      model: 'claude-sonnet-4-5-20250929',
      summary_markdown: response.summaryMarkdown.slice(0, 10000),
      feature_attributions: response.featureAttributions.slice(0, 10),
      context_window: {
        start: new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      created_by: request.createdBy || null,
    });

    console.log('[Guardian H09] Explanation generated:', {
      tenantId: request.tenantId,
      entityType: request.entityType,
      entityId: request.entityId,
    });

    return response;
  } catch (error) {
    console.error('[Guardian H09] Explanation failed:', error);
    throw error;
  }
}

/**
 * Build system prompt for explainability
 */
function buildExplainabilitySystemPrompt(): string {
  return `You are a Guardian explainability expert for SaaS observability platforms.

Your task: Explain WHY a Guardian object looks the way it does using provided context.

Respond ONLY with valid JSON:
{
  "summaryMarkdown": "**Why this happened:**\\n\\nThis alert fired because...",
  "featureAttributions": [
    {"name": "High error rate", "weight": 0.8, "direction": "increases", "category": "alerts"},
    {"name": "Recent deployment", "weight": 0.6, "direction": "increases", "category": "context"}
  ],
  "explanationType": "local",
  "contextWindow": {"start": "2025-12-10T00:00:00Z", "end": "2025-12-11T00:00:00Z"}
}

Guidelines:
- summaryMarkdown: 2-4 paragraphs explaining the entity (use markdown)
- featureAttributions: Top 3-5 contributing factors with weights (0-1)
- weight: 0-1 (1=primary driver, 0=no contribution)
- direction: increases/decreases (how factor affects the entity)
- explanationType: local (specific event), trend (pattern), mixed

Focus on actionable insights operators can use to understand the signal.
No speculation - only explain based on provided data.`;
}

/**
 * Build explainability prompt
 */
function buildExplainabilityPrompt(
  entityType: GuardianEntityType,
  entityId: string,
  context: Record<string, unknown>
): string {
  return `Explain this Guardian ${entityType}:

Entity ID: ${entityId}
Entity Type: ${entityType}

Context Data:
${JSON.stringify(context, null, 2)}

Provide explanation with feature attributions showing what contributed to this signal.
Respond with JSON only (no markdown outside JSON).`;
}
