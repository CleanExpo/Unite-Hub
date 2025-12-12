/**
 * H03: AI Correlation Refinement Advisor
 * Uses Anthropic Claude Sonnet to propose refined correlation tuning suggestions
 * Governance-gated: respects Z10 ai_usage_policy
 * All outputs validated for safety and PII-free content
 */

import Anthropic from '@anthropic-ai/sdk';
import { CorrelationSignalsResult } from './correlationSignals';
import { validateCorrelationRecommendation } from './heuristicCorrelationRefiner';
import { isAiEnabled } from './metaGovernanceHelper';

export interface AiCorrelationRecommendation {
  title: string;
  rationale: string;
  confidence: number;
  recommendation_type: string;
  target: Record<string, unknown>;
  recommendation: Record<string, unknown>;
  signals: Record<string, unknown>;
}

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000; // 60 seconds

/**
 * Get or create lazy-initialized Anthropic client
 */
function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

/**
 * Check if AI is allowed for correlation advisor
 */
export async function isAiAllowedForCorrelationAdvisor(tenantId: string): Promise<boolean> {
  try {
    return await isAiEnabled(tenantId);
  } catch (error) {
    console.warn('[H03 AI Advisor] Failed to check governance, defaulting to disabled:', error);
    return false;
  }
}

/**
 * Generate AI-powered correlation recommendations from aggregate signals
 * Only called if AI is allowed by governance
 */
export async function generateAiCorrelationRecommendations(
  tenantId: string,
  signals: CorrelationSignalsResult
): Promise<AiCorrelationRecommendation[]> {
  try {
    // Check governance gating first
    const aiAllowed = await isAiAllowedForCorrelationAdvisor(tenantId);
    if (!aiAllowed) {
      console.info('[H03 AI Advisor] AI disabled by governance, skipping AI recommendations');
      return [];
    }

    // Prepare aggregate-only prompt (no PII, no raw data)
    const promptText = `You are analyzing correlation cluster patterns in a system monitoring solution.

TASK: Suggest refinements to correlation clustering parameters based on aggregate statistics.

AGGREGATE SIGNALS (PII-free summary only):
${JSON.stringify(
  {
    total_clusters: signals.summary.total_clusters,
    median_cluster_size: signals.summary.median_cluster_size,
    p95_cluster_size: signals.summary.p95_cluster_size,
    median_duration_minutes: signals.summary.median_duration_minutes,
    p95_duration_minutes: signals.summary.p95_duration_minutes,
    percent_with_incident: signals.summary.percent_clusters_with_incident,
    avg_density: signals.summary.avg_density,
    sample_clusters_count: Math.min(5, signals.clusters.length),
  },
  null,
  2
)}

Generate 2-3 specific, actionable recommendations for refining correlation parameters.
Focus on: time_window_minutes, min_links, max_cluster_duration_minutes, link_weight_min, noise_filter_rules.

STRICT REQUIREMENTS:
- Each recommendation is JSON with fields: title, rationale, confidence (0-1), recommendation_type (merge_split|threshold_tune|link_weight|time_window|noise_filter), target (cluster_ids array or scope: global), recommendation (safe param names only), signals (metrics used).
- NO promises about incident reduction or guarantees.
- NO secrets, API keys, or credentials.
- NO raw alert/incident payloads or PII.
- NO unknown parameter names in recommendation.
- target.scope must be 'single', 'multiple', or 'global'.
- Allowed recommendation params: time_window_minutes_delta, min_links_delta, max_cluster_duration_minutes_delta, link_weight_min_delta, noise_filter_rules, reason.

Return JSON array only. Example:
[
  {
    "title": "Increase Time Window for Better Correlation",
    "rationale": "...",
    "confidence": 0.7,
    "recommendation_type": "time_window",
    "target": { "scope": "global" },
    "recommendation": { "time_window_minutes_delta": 10, "reason": "improve related event correlation" },
    "signals": { "median_duration_minutes": 45, ... }
  }
]`;

    // Call Claude Sonnet
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: promptText,
        },
      ],
    });

    // Extract text from response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const text = content.text;

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in Claude response');
    }

    const recommendations = JSON.parse(jsonMatch[0]) as any[];

    // Validate each recommendation
    const validated: AiCorrelationRecommendation[] = [];
    const warnings: string[] = [];

    for (const rec of recommendations) {
      const validation = validateCorrelationRecommendation(rec);
      if (!validation.valid) {
        warnings.push(`Invalid recommendation: ${validation.errors.join('; ')}`);
        continue;
      }

      validated.push(rec as AiCorrelationRecommendation);
    }

    if (warnings.length > 0) {
      console.warn('[H03 AI Advisor] Validation warnings:', warnings);
    }

    return validated;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[H03 AI Advisor] Failed to generate AI recommendations:', errorMsg);
    // Return empty array on error; heuristics will provide fallback
    return [];
  }
}

/**
 * Merge heuristic and AI recommendations with deduplication
 */
export function mergeRecommendations(
  heuristic: any[],
  ai: AiCorrelationRecommendation[]
): any[] {
  // Dedupe by recommendation_type + target scope
  const seen = new Set<string>();
  const merged: any[] = [];

  const all = [...heuristic, ...ai];
  for (const rec of all) {
    const key = `${rec.recommendation_type}|${rec.target.scope || 'unknown'}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(rec);
    }
  }

  // Sort by confidence descending
  merged.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  return merged;
}
