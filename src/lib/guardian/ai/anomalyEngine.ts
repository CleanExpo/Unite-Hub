import { createMessage, parseJSONResponse } from '@/lib/claude/client';
import { createClient } from '@/lib/supabase/server';
import { assertAiFeatureEnabled, checkDailyQuota } from '@/lib/guardian/ai/aiConfig';

/**
 * Guardian AI Anomaly Detection Engine (H02)
 *
 * Uses Claude Sonnet 4.5 to analyze recent alert/incident patterns and detect anomalies.
 * Reuses existing Anthropic client from lib/claude/client.ts.
 *
 * Algorithm:
 * 1. Fetch recent Guardian activity (alerts, incidents, correlations)
 * 2. Aggregate into privacy-friendly metrics (counts, severities, timing)
 * 3. Send to Claude Sonnet 4.5 with structured prompt
 * 4. Parse JSON response (anomaly_score, confidence, explanation)
 * 5. Return structured anomaly result
 *
 * Design Principles:
 * - Privacy-friendly: Only aggregated metrics in prompts (no raw logs, no PII)
 * - Deterministic: Same input → similar output
 * - Type-safe: Validated JSON responses
 * - Graceful degradation: Returns error if AI unavailable
 */

export interface GuardianAnomalyDetectionInput {
  tenantId: string;
  windowHours?: number; // Default: 24
}

export interface GuardianAnomalyDetectionOutput {
  anomaly_score: number; // 0-1 (0=normal, 1=highly anomalous)
  confidence: number; // 0-1 (AI confidence in detection)
  contributing: {
    alerts: string[]; // Alert event IDs
    incidents: string[]; // Incident IDs
  };
  explanation: string; // Human-readable explanation
  window_start: string;
  window_end: string;
}

interface ActivityMetrics {
  alertsCount: number;
  incidentsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  openIncidentsCount: number;
  correlationClustersCount: number;
  uniqueRulesTriggered: number;
  latestRiskScore?: number;
}

/**
 * Fetch recent Guardian activity metrics (privacy-friendly aggregation)
 */
async function fetchRecentActivityMetrics(
  tenantId: string,
  windowHours: number
): Promise<{ metrics: ActivityMetrics; alertIds: string[]; incidentIds: string[] }> {
  const supabase = await createClient();

  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - windowHours * 60 * 60 * 1000);

  // Fetch alerts, incidents, correlations in parallel
  const [alertsResult, incidentsResult, clustersResult, riskResult] = await Promise.all([
    supabase
      .from('guardian_alert_events')
      .select('id, severity')
      .eq('tenant_id', tenantId)
      .gte('created_at', windowStart.toISOString()),

    supabase
      .from('incidents')
      .select('id, severity, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', windowStart.toISOString()),

    supabase
      .from('guardian_correlation_clusters')
      .select('id')
      .eq('tenant_id', tenantId)
      .gte('last_seen', windowStart.toISOString()),

    supabase
      .from('guardian_risk_scores')
      .select('score')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .limit(1),
  ]);

  if (alertsResult.error) throw alertsResult.error;
  if (incidentsResult.error) throw incidentsResult.error;
  // Clusters and risk may not exist - graceful handling
  const alerts = alertsResult.data ?? [];
  const incidents = incidentsResult.data ?? [];
  const clusters = clustersResult.data ?? [];
  const latestRisk = riskResult.data?.[0];

  // Aggregate metrics (privacy-friendly: no raw data)
  const metrics: ActivityMetrics = {
    alertsCount: alerts.length,
    incidentsCount: incidents.length,
    criticalCount: [...alerts, ...incidents].filter((e: any) => e.severity === 'critical').length,
    highCount: [...alerts, ...incidents].filter((e: any) => e.severity === 'high').length,
    mediumCount: [...alerts, ...incidents].filter((e: any) => e.severity === 'medium').length,
    lowCount: [...alerts, ...incidents].filter((e: any) => e.severity === 'low').length,
    openIncidentsCount: incidents.filter((i: any) => i.status !== 'resolved').length,
    correlationClustersCount: clusters.length,
    uniqueRulesTriggered: 0, // Could aggregate if needed
    latestRiskScore: latestRisk ? Number((latestRisk as any).score) : undefined,
  };

  const alertIds = alerts.map((a: any) => a.id);
  const incidentIds = incidents.map((i: any) => i.id);

  return { metrics, alertIds, incidentIds };
}

/**
 * Generate anomaly detection using AI
 */
export async function generateAnomalyDetection(
  input: GuardianAnomalyDetectionInput
): Promise<GuardianAnomalyDetectionOutput> {
  const windowHours = input.windowHours ?? 24;
  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - windowHours * 60 * 60 * 1000);

  const startTime = Date.now();

  try {
    // H05: Check if anomaly detection feature is enabled
    await assertAiFeatureEnabled(input.tenantId, 'anomaly_detection');

    // H05: Check daily quota
    const quota = await checkDailyQuota(input.tenantId);
    if (quota.exceeded) {
      throw new Error(
        `QUOTA_EXCEEDED: Daily AI call limit reached (${quota.current}/${quota.limit})`
      );
    }
    // Fetch aggregated metrics (privacy-friendly)
    const { metrics, alertIds, incidentIds } = await fetchRecentActivityMetrics(
      input.tenantId,
      windowHours
    );

    // Build AI prompt (aggregated metrics only, no raw data)
    const prompt = buildAnomalyDetectionPrompt(metrics, windowHours);

    // Call Claude Sonnet 4.5
    const message = await createMessage(
      [{ role: 'user', content: prompt }],
      buildAnomalySystemPrompt(),
      {
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        temperature: 0.2, // Low temperature for consistent analysis
      }
    );

    // Parse and validate JSON response
    const response = parseJSONResponse<{
      anomaly_score: number;
      confidence: number;
      explanation: string;
    }>(message);

    // Validate response
    if (
      typeof response.anomaly_score !== 'number' ||
      typeof response.confidence !== 'number' ||
      !response.explanation
    ) {
      throw new Error('Invalid AI response: missing required fields');
    }

    if (response.anomaly_score < 0 || response.anomaly_score > 1) {
      throw new Error('Invalid anomaly_score: must be 0-1');
    }

    if (response.confidence < 0 || response.confidence > 1) {
      throw new Error('Invalid confidence: must be 0-1');
    }

    const latency = Date.now() - startTime;

    console.log('[Guardian H02] Anomaly detection complete:', {
      tenantId: input.tenantId,
      anomalyScore: response.anomaly_score,
      confidence: response.confidence,
      latencyMs: latency,
    });

    return {
      anomaly_score: response.anomaly_score,
      confidence: response.confidence,
      contributing: {
        alerts: alertIds.slice(0, 50), // Limit to 50 IDs
        incidents: incidentIds.slice(0, 50),
      },
      explanation: response.explanation,
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('[Guardian H02] Anomaly detection failed:', error);
    throw error;
  }
}

/**
 * Build system prompt for anomaly detection
 */
function buildAnomalySystemPrompt(): string {
  return `You are a Guardian anomaly detection expert for SaaS observability platforms.

Your task: Analyze aggregated Guardian activity metrics and detect anomalies.

Respond ONLY with valid JSON:
{
  "anomaly_score": 0.75,
  "confidence": 0.85,
  "explanation": "High spike in critical alerts (3× baseline) suggests infrastructure issue"
}

Guidelines:
- anomaly_score: 0-1 (0=normal, 1=highly anomalous)
- confidence: 0-1 (how confident you are in the detection)
- explanation: 1-2 sentences explaining the anomaly

Normal patterns:
- Steady low alert count with occasional medium alerts
- Few critical alerts (1-2 per week max)
- Consistent incident resolution rate
- Stable risk score trend

Anomalous patterns:
- Sudden spike in critical/high alerts
- Multiple open incidents simultaneously
- Rapid risk score increase
- Unusual correlation cluster formation
- Off-hours alert spikes`;
}

/**
 * Build prompt from aggregated metrics (privacy-friendly)
 */
function buildAnomalyDetectionPrompt(
  metrics: ActivityMetrics,
  windowHours: number
): string {
  return `Analyze Guardian activity metrics for anomalies (last ${windowHours} hours):

Alerts: ${metrics.alertsCount} total
- Critical: ${metrics.criticalCount}
- High: ${metrics.highCount}
- Medium: ${metrics.mediumCount}
- Low: ${metrics.lowCount}

Incidents: ${metrics.incidentsCount} total
- Open: ${metrics.openIncidentsCount}

Correlation clusters: ${metrics.correlationClustersCount}
${metrics.latestRiskScore !== undefined ? `Latest risk score: ${metrics.latestRiskScore}` : ''}

Detect anomalies and respond with JSON only (no markdown, no extra text).`;
}
