import { createMessage, parseJSONResponse } from '@/lib/claude/client';
import { createClient } from '@/lib/supabase/server';
import { assertAiFeatureEnabled, checkDailyQuota } from '@/lib/guardian/ai/aiConfig';

/**
 * Guardian AI Executive Briefing Service (H07)
 *
 * Generates AI-powered executive summaries of Guardian activity.
 * Aggregates signals from risk scores, anomalies, alerts, incidents, and correlations.
 * Produces narrative markdown summaries with key metrics and recommendations.
 *
 * Design Principles:
 * - Privacy-friendly: Aggregated metrics only (no raw event data, no PII)
 * - Actionable: Provides prioritized recommendations
 * - Governed: Respects H05 feature toggles and quotas
 * - Multi-source: Combines risk, anomaly, correlation, predictive signals
 */

export interface GuardianBriefingInput {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: '24h' | '7d' | '30d' | 'custom';
  createdBy?: string;
}

export interface GuardianBriefingRecommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  area: string; // 'alerts', 'incidents', 'risk', 'anomaly', 'correlation'
}

export interface GuardianBriefingResult {
  summaryMarkdown: string;
  keyMetrics: Record<string, unknown>;
  recommendations: GuardianBriefingRecommendation[];
  sourceFeatures: string[];
}

/**
 * Load aggregated context for briefing (privacy-friendly)
 */
async function loadBriefingContext(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ metrics: Record<string, unknown>; sourceFeatures: string[] }> {
  const supabase = await createClient();

  const startISO = periodStart.toISOString();
  const endISO = periodEnd.toISOString();

  const sourceFeatures: string[] = [];

  // Fetch aggregated metrics from Guardian tables
  const [alertsResult, incidentsResult, riskResult, anomalyResult, clustersResult] =
    await Promise.all([
      // Alerts in period
      supabase
        .from('guardian_alert_events')
        .select('severity')
        .eq('tenant_id', tenantId)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .then((res) => ({ data: res.data ?? [], error: res.error }))
        .catch(() => ({ data: [], error: null })),

      // Incidents in period
      supabase
        .from('incidents')
        .select('severity, status')
        .eq('tenant_id', tenantId)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .then((res) => ({ data: res.data ?? [], error: res.error }))
        .catch(() => ({ data: [], error: null })),

      // Latest risk score
      supabase
        .from('guardian_risk_scores')
        .select('date, score, breakdown')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })
        .limit(1)
        .then((res) => ({ data: res.data ?? [], error: res.error }))
        .catch(() => ({ data: [], error: null })),

      // Latest anomaly score
      supabase
        .from('guardian_anomaly_scores')
        .select('anomaly_score, confidence, explanation')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .then((res) => ({ data: res.data ?? [], error: res.error }))
        .catch(() => ({ data: [], error: null })),

      // Correlation clusters in period
      supabase
        .from('guardian_correlation_clusters')
        .select('severity, status')
        .eq('tenant_id', tenantId)
        .gte('last_seen', startISO)
        .lte('last_seen', endISO)
        .then((res) => ({ data: res.data ?? [], error: res.error }))
        .catch(() => ({ data: [], error: null })),
    ]);

  const alerts = alertsResult.data;
  const incidents = incidentsResult.data;
  const risk = riskResult.data[0];
  const anomaly = anomalyResult.data[0];
  const clusters = clustersResult.data;

  // Build aggregated metrics (privacy-friendly)
  const metrics: Record<string, unknown> = {
    periodStart: startISO,
    periodEnd: endISO,
    alerts: {
      total: alerts.length,
      critical: alerts.filter((a: any) => a.severity === 'critical').length,
      high: alerts.filter((a: any) => a.severity === 'high').length,
      medium: alerts.filter((a: any) => a.severity === 'medium').length,
      low: alerts.filter((a: any) => a.severity === 'low').length,
    },
    incidents: {
      total: incidents.length,
      open: incidents.filter((i: any) => i.status !== 'resolved').length,
      resolved: incidents.filter((i: any) => i.status === 'resolved').length,
    },
  };

  if (risk) {
    metrics.risk = {
      score: Number((risk as any).score),
      date: (risk as any).date,
    };
    sourceFeatures.push('risk');
  }

  if (anomaly) {
    metrics.anomaly = {
      score: Number((anomaly as any).anomaly_score),
      confidence: Number((anomaly as any).confidence),
      explanation: (anomaly as any).explanation,
    };
    sourceFeatures.push('anomaly');
  }

  if (clusters.length > 0) {
    metrics.correlation = {
      clusterCount: clusters.length,
      openClusters: clusters.filter((c: any) => c.status === 'open').length,
    };
    sourceFeatures.push('correlation');
  }

  if (alerts.length > 0 || incidents.length > 0) {
    sourceFeatures.push('alerts', 'incidents');
  }

  return { metrics, sourceFeatures };
}

/**
 * Generate executive briefing using AI
 */
export async function generateExecutiveBriefing(
  input: GuardianBriefingInput
): Promise<GuardianBriefingResult> {
  const startTime = Date.now();

  try {
    // H05: Check if briefing feature is enabled
    await assertAiFeatureEnabled(input.tenantId, 'briefing');

    // H05: Check daily quota
    const quota = await checkDailyQuota(input.tenantId);
    if (quota.exceeded) {
      throw new Error(
        `QUOTA_EXCEEDED: Daily AI call limit reached (${quota.current}/${quota.limit})`
      );
    }

    // Load aggregated context (privacy-friendly)
    const { metrics, sourceFeatures } = await loadBriefingContext(
      input.tenantId,
      input.periodStart,
      input.periodEnd
    );

    // Build AI prompt
    const prompt = buildBriefingPrompt(metrics, input.periodLabel);

    // Call Claude Sonnet 4.5
    const message = await createMessage(
      [{ role: 'user', content: prompt }],
      buildBriefingSystemPrompt(),
      {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 3072,
        temperature: 0.4, // Moderate for narrative quality
      }
    );

    // Parse and validate JSON response
    const response = parseJSONResponse<{
      summary: string;
      recommendations: GuardianBriefingRecommendation[];
    }>(message);

    // Validate response
    if (!response.summary || !Array.isArray(response.recommendations)) {
      throw new Error('Invalid AI response: missing summary or recommendations');
    }

    const latency = Date.now() - startTime;

    console.log('[Guardian H07] Executive briefing generated:', {
      tenantId: input.tenantId,
      periodLabel: input.periodLabel,
      latencyMs: latency,
      recommendationsCount: response.recommendations.length,
    });

    // Store briefing in database
    const supabase = await createClient();
    await supabase.from('guardian_ai_briefings').insert({
      tenant_id: input.tenantId,
      period_start: input.periodStart.toISOString(),
      period_end: input.periodEnd.toISOString(),
      period_label: input.periodLabel,
      model: 'claude-sonnet-4-5-20250929',
      summary_markdown: response.summary.slice(0, 10000), // Limit size
      key_metrics: metrics,
      recommendations: response.recommendations.slice(0, 10), // Limit count
      source_features: sourceFeatures,
      created_by: input.createdBy || null,
    });

    return {
      summaryMarkdown: response.summary,
      keyMetrics: metrics,
      recommendations: response.recommendations,
      sourceFeatures,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('[Guardian H07] Executive briefing failed:', error);
    throw error;
  }
}

/**
 * Build system prompt for executive briefings
 */
function buildBriefingSystemPrompt(): string {
  return `You are a Guardian executive briefing expert for SaaS observability platforms.

Your task: Analyze Guardian activity metrics and generate an executive-ready briefing.

Respond ONLY with valid JSON:
{
  "summary": "# Executive Summary\\n\\nYour workspace experienced...",
  "recommendations": [
    {
      "title": "Investigate API Error Spike",
      "description": "Critical alerts increased 300% - investigate API infrastructure",
      "priority": "high",
      "area": "alerts"
    }
  ]
}

Guidelines for summary:
- Use markdown formatting (headers, bold, lists)
- 3-7 paragraphs for executives (concise but informative)
- Highlight trends, spikes, improvements
- Provide context (baseline comparisons)
- Professional tone, actionable insights

Guidelines for recommendations:
- 3-5 prioritized recommendations max
- Clear, actionable titles
- Specific next steps in description
- Priority: low/medium/high
- Area: alerts/incidents/risk/anomaly/correlation

No raw data dumps - executive-level narrative only.`;
}

/**
 * Build briefing prompt from aggregated metrics
 */
function buildBriefingPrompt(metrics: Record<string, unknown>, periodLabel: string): string {
  return `Generate Guardian executive briefing for ${periodLabel} period:

**Alerts:**
${JSON.stringify((metrics as any).alerts, null, 2)}

**Incidents:**
${JSON.stringify((metrics as any).incidents, null, 2)}

${(metrics as any).risk ? `**Risk Score:**\n${JSON.stringify((metrics as any).risk, null, 2)}\n` : ''}

${(metrics as any).anomaly ? `**Anomaly Detection:**\n${JSON.stringify((metrics as any).anomaly, null, 2)}\n` : ''}

${(metrics as any).correlation ? `**Correlation Clusters:**\n${JSON.stringify((metrics as any).correlation, null, 2)}\n` : ''}

Provide executive briefing with narrative summary and prioritized recommendations.
Respond with JSON only (no markdown outside JSON).`;
}
