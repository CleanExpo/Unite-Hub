import { createMessage, parseJSONResponse } from '@/lib/claude/client';
import { createClient } from '@/lib/supabase/server';
import { assertAiFeatureEnabled, checkDailyQuota } from '@/lib/guardian/ai/aiConfig';

/**
 * Guardian AI Investigation Console (H08)
 *
 * Natural-language query interface for Guardian data.
 * Translates questions into data queries, invokes AI for narrative answers.
 *
 * Design Principles:
 * - Deterministic query patterns (no AI-generated SQL)
 * - Privacy-friendly (aggregated data only)
 * - Session-based (multi-turn conversations)
 * - Type-safe (validated responses)
 * - Governed (respects H05 toggles and quotas)
 */

export interface GuardianInvestigationTurn {
  sequenceIndex: number;
  question: string;
  answerMarkdown: string;
  answerSummary: string | null;
  answerType: string;
}

export interface GuardianInvestigationQuestion {
  tenantId: string;
  sessionId: string;
  question: string;
  previousContext?: GuardianInvestigationTurn[];
  createdBy?: string;
}

export interface GuardianInvestigationAnswer {
  answerMarkdown: string;
  answerSummary: string;
  answerType: 'trend' | 'outage' | 'risk' | 'anomaly' | 'predictive' | 'rules' | 'correlation' | 'mixed' | 'generic';
  keyEntities: Record<string, unknown>;
  keyTimeWindow: {
    start?: string;
    end?: string;
    inferred?: boolean;
  };
}

/**
 * Classify question intent (deterministic keyword matching)
 */
function classifyQuestionIntent(question: string): {
  type: string;
  timeWindow: { start: Date; end: Date; inferred: boolean };
} {
  const lowerQ = question.toLowerCase();
  const now = new Date();

  // Infer time window from keywords
  let start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default: last 24h
  let end = now;
  let inferred = true;

  if (lowerQ.includes('last 24 hours') || lowerQ.includes('last 24h') || lowerQ.includes('today')) {
    start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (lowerQ.includes('last 7 days') || lowerQ.includes('this week')) {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (lowerQ.includes('last 30 days') || lowerQ.includes('this month')) {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Classify intent based on keywords
  let type = 'generic';
  if (lowerQ.includes('risk') || lowerQ.includes('risk score')) type = 'risk';
  else if (lowerQ.includes('anomaly') || lowerQ.includes('anomalies')) type = 'anomaly';
  else if (lowerQ.includes('correlation') || lowerQ.includes('cluster')) type = 'correlation';
  else if (lowerQ.includes('incident')) type = 'outage';
  else if (lowerQ.includes('alert') || lowerQ.includes('rule')) type = 'rules';
  else if (lowerQ.includes('trend') || lowerQ.includes('increasing') || lowerQ.includes('decreasing'))
    type = 'trend';

  return { type, timeWindow: { start, end, inferred } };
}

/**
 * Query Guardian data based on intent (privacy-friendly aggregation)
 */
async function queryGuardianData(
  tenantId: string,
  intent: { type: string; timeWindow: { start: Date; end: Date } }
): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const startISO = intent.timeWindow.start.toISOString();
  const endISO = intent.timeWindow.end.toISOString();

  const [alertsResult, incidentsResult, riskResult, anomalyResult] = await Promise.all([
    supabase
      .from('guardian_alert_events')
      .select('id, severity, source, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .limit(100)
      .then((res) => ({ data: res.data ?? [] }))
      .catch(() => ({ data: [] })),

    supabase
      .from('incidents')
      .select('id, severity, status, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .limit(50)
      .then((res) => ({ data: res.data ?? [] }))
      .catch(() => ({ data: [] })),

    supabase
      .from('guardian_risk_scores')
      .select('date, score')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .limit(30)
      .then((res) => ({ data: res.data ?? [] }))
      .catch(() => ({ data: [] })),

    supabase
      .from('guardian_anomaly_scores')
      .select('anomaly_score, confidence, explanation, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then((res) => ({ data: res.data ?? [] }))
      .catch(() => ({ data: [] })),
  ]);

  // Aggregate results (privacy-friendly)
  const alerts = alertsResult.data;
  const incidents = incidentsResult.data;
  const riskScores = riskResult.data;
  const anomalyScores = anomalyResult.data;

  return {
    alerts: {
      total: alerts.length,
      bySeverity: {
        critical: alerts.filter((a: any) => a.severity === 'critical').length,
        high: alerts.filter((a: any) => a.severity === 'high').length,
        medium: alerts.filter((a: any) => a.severity === 'medium').length,
        low: alerts.filter((a: any) => a.severity === 'low').length,
      },
      topSources: [...new Set(alerts.map((a: any) => a.source))].slice(0, 5),
    },
    incidents: {
      total: incidents.length,
      open: incidents.filter((i: any) => i.status !== 'resolved').length,
      resolved: incidents.filter((i: any) => i.status === 'resolved').length,
    },
    risk: {
      latest: riskScores[0] ? Number((riskScores[0] as any).score) : null,
      trend: riskScores.length >= 2
        ? Number((riskScores[0] as any).score) - Number((riskScores[1] as any).score)
        : null,
    },
    anomaly: {
      latest: anomalyScores[0]
        ? {
            score: Number((anomalyScores[0] as any).anomaly_score),
            confidence: Number((anomalyScores[0] as any).confidence),
          }
        : null,
    },
  };
}

/**
 * Run investigation question
 */
export async function runInvestigationQuestion(
  input: GuardianInvestigationQuestion
): Promise<GuardianInvestigationAnswer> {
  try {
    // H05: Check if investigation feature is enabled
    await assertAiFeatureEnabled(input.tenantId, 'investigation');

    // H05: Check daily quota
    const quota = await checkDailyQuota(input.tenantId);
    if (quota.exceeded) {
      throw new Error(
        `QUOTA_EXCEEDED: Daily AI call limit reached (${quota.current}/${quota.limit})`
      );
    }

    // Classify question intent
    const intent = classifyQuestionIntent(input.question);

    // Query Guardian data
    const data = await queryGuardianData(input.tenantId, intent);

    // Build AI prompt
    const prompt = buildInvestigationPrompt(input.question, data, input.previousContext);

    // Call Claude Sonnet 4.5
    const message = await createMessage(
      [{ role: 'user', content: prompt }],
      buildInvestigationSystemPrompt(),
      {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        temperature: 0.4,
      }
    );

    // Parse response
    const response = parseJSONResponse<GuardianInvestigationAnswer>(message);

    // Validate
    if (!response.answerMarkdown || !response.answerSummary) {
      throw new Error('Invalid AI response: missing required fields');
    }

    console.log('[Guardian H08] Investigation question answered:', {
      tenantId: input.tenantId,
      sessionId: input.sessionId,
      questionLength: input.question.length,
    });

    return response;
  } catch (error) {
    console.error('[Guardian H08] Investigation failed:', error);
    throw error;
  }
}

/**
 * Build system prompt for investigation
 */
function buildInvestigationSystemPrompt(): string {
  return `You are a Guardian investigation assistant for SaaS observability platforms.

Your task: Answer questions about Guardian activity using provided data context.

Respond ONLY with valid JSON:
{
  "answerMarkdown": "Based on the data, your workspace...",
  "answerSummary": "Brief 1-sentence summary",
  "answerType": "trend",
  "keyEntities": {"alertCount": 45},
  "keyTimeWindow": {"start": "2025-12-10T00:00:00Z", "end": "2025-12-11T00:00:00Z", "inferred": true}
}

Guidelines:
- Use markdown formatting (bold, lists)
- Be concise but informative (2-4 paragraphs)
- Reference specific metrics from data
- Provide actionable insights
- answerType: trend, outage, risk, anomaly, predictive, rules, correlation, mixed, generic

No speculation beyond provided data. No markdown outside JSON.`;
}

/**
 * Build investigation prompt
 */
function buildInvestigationPrompt(
  question: string,
  data: Record<string, unknown>,
  previousContext?: GuardianInvestigationTurn[]
): string {
  const parts = [`Question: ${question}\n`];

  parts.push(`\nGuardian Data Context:\n${JSON.stringify(data, null, 2)}\n`);

  if (previousContext && previousContext.length > 0) {
    parts.push('\nPrevious conversation:');
    for (const turn of previousContext.slice(-3)) {
      // Last 3 turns
      parts.push(`Q: ${turn.question}`);
      parts.push(`A: ${turn.answerSummary || turn.answerMarkdown.slice(0, 100)}`);
    }
  }

  parts.push('\nAnswer the question using the provided data. Respond with JSON only.');

  return parts.join('\n');
}
