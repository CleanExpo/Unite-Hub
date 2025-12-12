/**
 * H04: Incident Triage AI Helper
 * Optional AI-powered narrative generation for incident triage
 * Governance-gated: respects Z10 aiUsagePolicy
 *
 * Generates advisory text from aggregate features only.
 * Falls back to deterministic narrative if AI disabled.
 */

import { Anthropic } from '@anthropic-ai/sdk';
import { IncidentFeatures } from './incidentFeatureBuilder';
import { IncidentScore } from './incidentScoringModel';
import { getSupabaseServer } from '@/lib/supabase';

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000; // 60 seconds

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

/**
 * Check if AI is allowed for incident triage (via Z10 governance)
 */
export async function isAiAllowedForIncidentTriage(tenantId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseServer();

    // Query Z10 governance flags
    const { data, error } = await supabase
      .from('guardian_meta_feature_flags')
      .select('ai_usage_policy')
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      // Z10 absent or query failed; default to disabled (secure)
      return false;
    }

    const aiPolicy = (data as any).ai_usage_policy;
    // Allow if policy is 'enabled' or 'advisory'
    return aiPolicy === 'enabled' || aiPolicy === 'advisory';
  } catch {
    // Default to disabled on error
    return false;
  }
}

export interface IncidentTriageNarrative {
  summary: string; // One-line summary
  likelyDrivers: string[]; // Top 3 problem areas
  nextSteps: string[]; // Recommended actions
  confidence: number; // 0..1
}

/**
 * Generate AI-assisted triage narrative (if allowed)
 */
export async function generateIncidentTriageNarrative(
  tenantId: string,
  features: IncidentFeatures,
  score: IncidentScore
): Promise<IncidentTriageNarrative> {
  const aiAllowed = await isAiAllowedForIncidentTriage(tenantId);

  if (!aiAllowed) {
    return getDeterministicTriageNarrative(features, score);
  }

  try {
    const client = getAnthropicClient();

    // Build safe prompt with aggregate data only
    const featuresStr = Object.entries(features)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    const prompt = `You are an incident triage assistant. Based only on the following aggregate signals (no raw data, no PII), provide brief triage guidance.

AGGREGATE SIGNALS:
${featuresStr}

HEURISTIC SCORE: ${score.score}/100 (band: ${score.band})
SCORE RATIONALE: ${score.rationale}

Respond in JSON format:
{
  "summary": "One-line summary (max 100 chars)",
  "likelyDrivers": ["driver 1", "driver 2", "driver 3"],
  "nextSteps": ["step 1", "step 2", "step 3"],
  "confidence": 0.85
}

Guidelines:
- Refer to metrics by name only (alert_count_24h, risk_delta_24h, etc.), never by value
- Suggest next steps (monitor, investigate pattern, escalate, etc.)
- Estimate confidence (0..1) based on signal clarity
- Keep response brief and actionable
- Do NOT include email addresses, IP addresses, secrets, or free-form incident details`;

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

    // Extract text response
    const responseText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('');

    // Parse JSON
    const parsed = JSON.parse(responseText);

    // Validate output
    if (!parsed.summary || !Array.isArray(parsed.likelyDrivers) || !Array.isArray(parsed.nextSteps)) {
      throw new Error('Invalid AI response structure');
    }

    return {
      summary: String(parsed.summary).slice(0, 100),
      likelyDrivers: (parsed.likelyDrivers as string[]).slice(0, 3),
      nextSteps: (parsed.nextSteps as string[]).slice(0, 3),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7)),
    };
  } catch {
    // On AI error, fall back to deterministic
    return getDeterministicTriageNarrative(features, score);
  }
}

/**
 * Deterministic triage narrative (no AI)
 */
export function getDeterministicTriageNarrative(
  features: IncidentFeatures,
  score: IncidentScore
): IncidentTriageNarrative {
  const drivers: string[] = [];

  if (features.alert_count_1h > 10) {
    drivers.push('high alert rate in last hour');
  }
  if (features.risk_delta_24h > 20) {
    drivers.push('risk score deteriorating');
  }
  if (features.correlation_cluster_count > 5) {
    drivers.push('many correlated events');
  }
  if (features.notification_failure_rate > 0.3) {
    drivers.push('notification delivery issues');
  }
  if (features.reopen_count > 2) {
    drivers.push('incident reopened multiple times');
  }

  const summary =
    score.band === 'critical'
      ? 'Critical: Requires immediate attention'
      : score.band === 'high'
        ? 'High: Investigate and prioritize'
        : score.band === 'medium'
          ? 'Medium: Monitor and triage'
          : 'Low: Standard handling';

  const nextSteps: string[] = [];
  if (score.band === 'critical') {
    nextSteps.push('Escalate to on-call team');
    nextSteps.push('Review alert cascade');
    nextSteps.push('Prepare incident response');
  } else if (score.band === 'high') {
    nextSteps.push('Assign to queue and review');
    nextSteps.push('Check for related patterns');
    nextSteps.push('Set escalation watch');
  } else {
    nextSteps.push('Add to standard triage queue');
    nextSteps.push('Monitor for worsening');
    nextSteps.push('Update status as needed');
  }

  return {
    summary,
    likelyDrivers: drivers.length > 0 ? drivers.slice(0, 3) : ['standard incident'],
    nextSteps,
    confidence: 1.0, // Deterministic = full confidence
  };
}
