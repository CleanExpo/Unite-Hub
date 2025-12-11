/**
 * Guardian I09: AI Usage Tracker
 *
 * Tracks token usage, estimated costs, and budget state across I-series operations.
 * QA-context only: records aggregate metrics but never raw payloads.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface GuardianAiUsageSummary {
  totalTokens: number;
  calls: number;
  estimatedCostUsd: number;
}

export interface GuardianAiBudgetState {
  state: 'ok' | 'warning' | 'exceeded';
  reason?: string;
}

export interface AiUsageWindow {
  windowId: string;
  state: GuardianAiBudgetState;
  aggregate: GuardianAiUsageSummary;
}

/**
 * Evaluate budget state based on usage and configured limits
 */
function evaluateBudgetState(
  usage: GuardianAiUsageSummary,
  budget?: { maxTokens?: number; maxCostUsd?: number }
): GuardianAiBudgetState {
  if (!budget) {
    return { state: 'ok' };
  }

  // Check for exceeded limits
  if (budget.maxTokens && usage.totalTokens > budget.maxTokens) {
    const pct = ((usage.totalTokens / budget.maxTokens) * 100).toFixed(1);
    return { state: 'exceeded', reason: `${pct}% of token budget used` };
  }

  if (budget.maxCostUsd && usage.estimatedCostUsd > budget.maxCostUsd) {
    const pct = ((usage.estimatedCostUsd / budget.maxCostUsd) * 100).toFixed(1);
    return { state: 'exceeded', reason: `${pct}% of cost budget used` };
  }

  // Check for warning thresholds (80% of limits)
  const tokenWarningThreshold = budget.maxTokens ? 0.8 * budget.maxTokens : undefined;
  const costWarningThreshold = budget.maxCostUsd ? 0.8 * budget.maxCostUsd : undefined;

  if (tokenWarningThreshold && usage.totalTokens > tokenWarningThreshold) {
    const pct = ((usage.totalTokens / budget.maxTokens!) * 100).toFixed(1);
    return { state: 'warning', reason: `${pct}% of token budget used` };
  }

  if (costWarningThreshold && usage.estimatedCostUsd > costWarningThreshold) {
    const pct = ((usage.estimatedCostUsd / budget.maxCostUsd!) * 100).toFixed(1);
    return { state: 'warning', reason: `${pct}% of cost budget used` };
  }

  return { state: 'ok' };
}

/**
 * Track AI usage in a time window and evaluate budget state
 *
 * Upserts a guardian_ai_usage_windows record by aggregating token usage and cost
 * within a specific time window and context. Returns updated window state and aggregate usage.
 */
export async function trackAiUsageForTenant(
  tenantId: string,
  context: string,
  delta: GuardianAiUsageSummary,
  window: { start: Date; end: Date },
  budget?: { maxTokens?: number; maxCostUsd?: number }
): Promise<AiUsageWindow> {
  const supabase = getSupabaseServer();

  // Try to find existing window
  const { data: existing, error: getError } = await supabase
    .from('guardian_ai_usage_windows')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('context', context)
    .eq('window_start', window.start.toISOString())
    .eq('window_end', window.end.toISOString())
    .single();

  let windowId: string;
  let aggregate: GuardianAiUsageSummary;

  if (getError && getError.code !== 'PGRST116') {
    // PGRST116 = no rows, which is expected for new windows
    throw new Error(`Failed to query AI usage window: ${getError.message}`);
  }

  if (existing) {
    // Update existing window
    const updatedTokens = existing.total_tokens + delta.totalTokens;
    const updatedCalls = existing.total_calls + delta.calls;
    const updatedCost = existing.estimated_cost_usd + delta.estimatedCostUsd;

    const budgetState = evaluateBudgetState(
      { totalTokens: updatedTokens, calls: updatedCalls, estimatedCostUsd: updatedCost },
      budget
    );

    const { error: updateError } = await supabase
      .from('guardian_ai_usage_windows')
      .update({
        total_tokens: updatedTokens,
        total_calls: updatedCalls,
        estimated_cost_usd: updatedCost,
        budget_limit: budget,
        budget_state: budgetState.state,
      })
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(`Failed to update AI usage window: ${updateError.message}`);
    }

    windowId = existing.id;
    aggregate = { totalTokens: updatedTokens, calls: updatedCalls, estimatedCostUsd: updatedCost };
  } else {
    // Create new window
    const budgetState = evaluateBudgetState(delta, budget);

    const { data: newWindow, error: insertError } = await supabase
      .from('guardian_ai_usage_windows')
      .insert({
        tenant_id: tenantId,
        window_start: window.start,
        window_end: window.end,
        context,
        total_tokens: delta.totalTokens,
        total_calls: delta.calls,
        estimated_cost_usd: delta.estimatedCostUsd,
        budget_limit: budget,
        budget_state: budgetState.state,
      })
      .select()
      .single();

    if (insertError || !newWindow) {
      throw new Error(`Failed to create AI usage window: ${insertError?.message || 'Unknown error'}`);
    }

    windowId = newWindow.id;
    aggregate = delta;
  }

  const finalState = evaluateBudgetState(aggregate, budget);

  return {
    windowId,
    state: finalState,
    aggregate,
  };
}

/**
 * Get current AI usage for a context and time window
 */
export async function getAiUsageForWindow(
  tenantId: string,
  context: string,
  windowStart: Date,
  windowEnd: Date
): Promise<GuardianAiUsageSummary | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_ai_usage_windows')
    .select('total_tokens, total_calls, estimated_cost_usd')
    .eq('tenant_id', tenantId)
    .eq('context', context)
    .eq('window_start', windowStart.toISOString())
    .eq('window_end', windowEnd.toISOString())
    .single();

  if (error) {
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    totalTokens: data.total_tokens,
    calls: data.total_calls,
    estimatedCostUsd: data.estimated_cost_usd,
  };
}

/**
 * Get AI usage summary across all contexts for a tenant
 */
export async function getAiUsageSummaryForTenant(
  tenantId: string,
  fromDate: Date,
  toDate: Date
): Promise<
  Array<{
    context: string;
    totalTokens: number;
    totalCalls: number;
    estimatedCostUsd: number;
    budgetState: string;
  }>
> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_ai_usage_windows')
    .select('context, total_tokens, total_calls, estimated_cost_usd, budget_state')
    .eq('tenant_id', tenantId)
    .gte('window_start', fromDate.toISOString())
    .lte('window_end', toDate.toISOString());

  if (error) {
    throw new Error(`Failed to load AI usage summary: ${error.message}`);
  }

  // Aggregate by context
  const aggregated: Record<
    string,
    { totalTokens: number; totalCalls: number; estimatedCostUsd: number; worstState: string }
  > = {};

  (data || []).forEach((row) => {
    if (!aggregated[row.context]) {
      aggregated[row.context] = {
        totalTokens: 0,
        totalCalls: 0,
        estimatedCostUsd: 0,
        worstState: 'ok',
      };
    }

    aggregated[row.context].totalTokens += row.total_tokens;
    aggregated[row.context].totalCalls += row.total_calls;
    aggregated[row.context].estimatedCostUsd += row.estimated_cost_usd;

    // Track worst state
    if (row.budget_state === 'exceeded') {
      aggregated[row.context].worstState = 'exceeded';
    } else if (row.budget_state === 'warning' && aggregated[row.context].worstState === 'ok') {
      aggregated[row.context].worstState = 'warning';
    }
  });

  return Object.entries(aggregated).map(([context, stats]) => ({
    context,
    totalTokens: stats.totalTokens,
    totalCalls: stats.totalCalls,
    estimatedCostUsd: stats.estimatedCostUsd,
    budgetState: stats.worstState,
  }));
}
