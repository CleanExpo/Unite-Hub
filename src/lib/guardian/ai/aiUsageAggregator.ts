import { createClient } from '@/lib/supabase/server';

/**
 * Guardian AI Usage Aggregator (H05)
 *
 * Aggregates AI usage metrics across all Guardian AI features.
 * Provides observability for quota management and cost tracking.
 *
 * Design Principles:
 * - Defensive queries (handles missing tables gracefully)
 * - Privacy-friendly (no raw prompts/responses)
 * - Tenant-scoped (RLS enforced)
 */

export interface GuardianAiUsageSummary {
  totalAiCalls: number;
  callsByFeature: {
    ruleAssistant: number;
    anomalyDetection: number;
    correlationRefinement: number;
    predictiveScoring: number;
  };
  lastCallAt: string | null;
  errorCount: number;
  approximateTokenUsage: number | null;
}

/**
 * Get AI usage summary for a tenant
 *
 * @param tenantId - Tenant ID
 * @param windowHours - Time window in hours (default: 24)
 * @returns Aggregated usage metrics
 */
export async function getGuardianAiUsageSummary(
  tenantId: string,
  windowHours: number = 24
): Promise<GuardianAiUsageSummary> {
  const supabase = await createClient();
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  // Fetch metrics from all AI tables (defensive - handles missing tables)
  const [
    ruleSuggestionsResult,
    anomalyScoresResult,
    correlationReviewsResult,
  ] = await Promise.all([
    // H01: Rule suggestions
    supabase
      .from('guardian_ai_rule_suggestions')
      .select('created_at, status, prompt_tokens, completion_tokens')
      .eq('tenant_id', tenantId)
      .gte('created_at', since)
      .then((res) => ({ data: res.data ?? [], error: res.error }))
      .catch(() => ({ data: [], error: null })),

    // H02: Anomaly scores
    supabase
      .from('guardian_anomaly_scores')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', since)
      .then((res) => ({ data: res.data ?? [], error: res.error }))
      .catch(() => ({ data: [], error: null })),

    // H03: Correlation reviews
    supabase
      .from('guardian_ai_correlation_reviews')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', since)
      .then((res) => ({ data: res.data ?? [], error: res.error }))
      .catch(() => ({ data: [], error: null })),
  ]);

  const ruleSuggestions = ruleSuggestionsResult.data;
  const anomalyScores = anomalyScoresResult.data;
  const correlationReviews = correlationReviewsResult.data;

  // Count calls by feature
  const callsByFeature = {
    ruleAssistant: ruleSuggestions.length,
    anomalyDetection: anomalyScores.length,
    correlationRefinement: correlationReviews.length,
    predictiveScoring: 0, // H04 - not yet implemented
  };

  const totalAiCalls = Object.values(callsByFeature).reduce((sum, count) => sum + count, 0);

  // Find last call timestamp
  const allTimestamps = [
    ...ruleSuggestions.map((r: any) => r.created_at),
    ...anomalyScores.map((a: any) => a.created_at),
    ...correlationReviews.map((c: any) => c.created_at),
  ].filter(Boolean);

  const lastCallAt =
    allTimestamps.length > 0
      ? allTimestamps.sort().reverse()[0]
      : null;

  // Count errors (from rule suggestions where status tracking exists)
  const errorCount = ruleSuggestions.filter((r: any) => r.status === 'error').length;

  // Approximate token usage (from rule suggestions where token counts exist)
  let approximateTokenUsage: number | null = null;
  const tokensData = ruleSuggestions
    .map((r: any) => ({
      prompt: Number(r.prompt_tokens ?? 0),
      completion: Number(r.completion_tokens ?? 0),
    }))
    .filter((t) => t.prompt > 0 || t.completion > 0);

  if (tokensData.length > 0) {
    approximateTokenUsage = tokensData.reduce(
      (sum, t) => sum + t.prompt + t.completion,
      0
    );
  }

  return {
    totalAiCalls,
    callsByFeature,
    lastCallAt,
    errorCount,
    approximateTokenUsage,
  };
}
