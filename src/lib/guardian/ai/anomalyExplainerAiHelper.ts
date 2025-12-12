/**
 * H02 AI Anomaly Explainer
 *
 * Generates short, cautious AI explanations for anomalies.
 * Governance-gated: respects Z10 ai_usage_policy.
 * All explanations use only aggregate data (no PII, no raw payloads).
 */

import Anthropic from '@anthropic-ai/sdk';
import { getTenantGovernanceFlags } from './metaGovernanceHelper';

let anthropicClient: Anthropic | null = null;
let clientTimestamp = 0;
const CLIENT_TTL = 60000; // 60 seconds

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - clientTimestamp > CLIENT_TTL) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    clientTimestamp = now;
  }
  return anthropicClient;
}

/**
 * Check if AI is allowed for anomaly explanations
 */
export async function isAiAllowedForAnomalyExplainer(tenantId: string): Promise<boolean> {
  try {
    const flags = await getTenantGovernanceFlags(tenantId);
    return flags.aiUsagePolicy === 'enabled';
  } catch {
    // Fallback: AI disabled if Z10 absent or error
    return false;
  }
}

export interface AnomalyExplanation {
  explanation: string;
  possibleCauses: string[];
  nextSteps: string[];
  relatedRuleIdea?: any;
}

/**
 * Generate AI explanation for an anomaly
 * Returns deterministic explanation if AI disabled
 */
export async function explainAnomaly(
  tenantId: string,
  event: {
    detector_id: string;
    detector_name?: string;
    observed_value: number;
    expected_value: number;
    score: number;
    severity: string;
    summary: string;
    details: Record<string, any>;
  },
  detector: {
    name: string;
    metric_key: string;
    method: string;
    threshold: number;
  },
  baselineStats: any
): Promise<AnomalyExplanation> {
  const aiAllowed = await isAiAllowedForAnomalyExplainer(tenantId);

  if (!aiAllowed) {
    return getDeterministicExplanation(event, detector);
  }

  try {
    return await generateAiExplanation(event, detector, baselineStats);
  } catch (err) {
    console.error('AI explanation failed, falling back to deterministic:', err);
    return getDeterministicExplanation(event, detector);
  }
}

/**
 * Deterministic explanation (no AI)
 */
function getDeterministicExplanation(
  event: any,
  detector: any
): AnomalyExplanation {
  const deviationPercent = (
    ((event.observed_value - event.expected_value) / event.expected_value) *
    100
  ).toFixed(1);

  const explanation =
    event.severity === 'critical'
      ? `Critical anomaly detected: ${detector.metric_key} has deviated significantly from expected baseline.`
      : event.severity === 'high'
        ? `High severity anomaly: ${detector.metric_key} is above typical behavior.`
        : `Anomaly detected: ${detector.metric_key} exceeded baseline by ${Math.abs(Number(deviationPercent))}%.`;

  const possibleCauses = getPossibleCauses(detector.metric_key);
  const nextSteps = getNextSteps(detector.metric_key, event.severity);

  return {
    explanation,
    possibleCauses,
    nextSteps,
    relatedRuleIdea: null,
  };
}

/**
 * Generate AI explanation using Claude
 */
async function generateAiExplanation(
  event: any,
  detector: any,
  baselineStats: any
): Promise<AnomalyExplanation> {
  const client = getAnthropicClient();

  const prompt = buildAnomalyExplanationPrompt(event, detector, baselineStats);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Parse response (expect JSON)
  try {
    const parsed = JSON.parse(content.text);
    return {
      explanation: parsed.explanation || getDeterministicExplanation(event, detector).explanation,
      possibleCauses: parsed.possibleCauses || [],
      nextSteps: parsed.nextSteps || [],
      relatedRuleIdea: parsed.relatedRuleIdea || null,
    };
  } catch (err) {
    console.error('Failed to parse AI response as JSON:', err);
    throw err;
  }
}

/**
 * Build prompt for Claude
 */
function buildAnomalyExplanationPrompt(
  event: any,
  detector: any,
  baselineStats: any
): string {
  const prompt = `You are an anomaly explanation assistant for Guardian observability system.
Given an anomaly event, provide a short explanation, possible causes, and next steps.

IMPORTANT CONSTRAINTS:
- Use only aggregate data (counts, rates, percentiles) - no raw payloads or PII
- Be cautious and avoid making promises about root cause
- Suggest only advisory actions (no auto-fixes or external notifications)
- Keep explanations to 1-2 sentences max
- Return valid JSON

ANOMALY EVENT:
- Detector: ${detector.name}
- Metric: ${detector.metric_key}
- Severity: ${event.severity}
- Observed Value: ${event.observed_value}
- Expected Value: ${event.expected_value}
- Score: ${event.score}
- Summary: ${event.summary}
- Details: ${JSON.stringify(event.details || {})}

BASELINE STATS:
- Method: ${detector.method}
- Threshold: ${detector.threshold}
- Stats: ${JSON.stringify(baselineStats || {})}

RESPONSE:
Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "explanation": "Short cautious explanation of the anomaly",
  "possibleCauses": ["cause1", "cause2"],
  "nextSteps": ["step1", "step2"],
  "relatedRuleIdea": null
}`;

  return prompt;
}

/**
 * Get deterministic possible causes by metric
 */
function getPossibleCauses(metricKey: string): string[] {
  switch (metricKey) {
    case 'alerts_total':
      return [
        'Increased inbound traffic or workload',
        'Change in alert rule configurations',
        'Integration or instrumentation issue',
        'Real incident or service degradation',
      ];

    case 'incidents_total':
      return [
        'Multiple correlated issues detected',
        'Increased alert severity threshold',
        'System health degradation',
        'Deployment or configuration change',
      ];

    case 'correlation_clusters':
      return [
        'Related failures across multiple systems',
        'Correlated alerts from shared dependency',
        'Cascade failure propagating',
        'Data quality or aggregation issue',
      ];

    case 'notif_fail_rate':
      return [
        'Notification channel connectivity issue',
        'Configuration or credential problem',
        'Rate limiting on external service',
        'Destination endpoint down or unreachable',
      ];

    case 'risk_p95':
      return [
        'High-risk anomalies in observed metrics',
        'Security or compliance threat detected',
        'System resilience degraded',
        'Critical resource exhaustion',
      ];

    case 'insights_activity_24h':
      return [
        'Increased system activity or request volume',
        'Change in user behavior or usage patterns',
        'Background job or maintenance activity',
        'Integration or scheduled task execution',
      ];

    default:
      return ['Metric exceeded baseline expectations'];
  }
}

/**
 * Get deterministic next steps by metric and severity
 */
function getNextSteps(metricKey: string, severity: string): string[] {
  const steps: string[] = [
    'Review the anomaly event details in the Anomaly Detection console',
    'Check related Guardian logs and timeline',
  ];

  if (severity === 'critical' || severity === 'high') {
    steps.push('Consider acknowledging this event as in-progress investigation');
  }

  if (metricKey === 'alerts_total' || metricKey === 'incidents_total') {
    steps.push('Review recent rule changes or deployment activity');
  }

  if (metricKey === 'notif_fail_rate') {
    steps.push('Verify notification channel configuration and connectivity');
  }

  if (metricKey === 'correlation_clusters') {
    steps.push('Drill into correlation analysis for related alerts');
  }

  steps.push('Optionally generate an advisory rule from this anomaly');

  return steps;
}
