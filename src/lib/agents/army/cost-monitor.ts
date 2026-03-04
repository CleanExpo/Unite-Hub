/**
 * Agent Army — Cost Monitoring + Auto-Throttle
 *
 * Tracks cumulative API spend from army_runs.cost_usd and enforces a
 * configurable daily budget cap. Non-urgent agents are paused when the
 * budget is exceeded; urgent agents always execute.
 *
 * Budget env var: ARMY_DAILY_BUDGET_USD (default: 10.00 AUD equivalent ~$6.50 USD)
 *
 * UNI-1450: Cost monitoring + auto-throttle
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CostSummary {
  todayUsd:  number;
  weekUsd:   number;
  monthUsd:  number;
  todayAud:  number;
  weekAud:   number;
  monthAud:  number;
  runCount:  number;
}

export interface ThrottleResult {
  throttled: boolean;
  reason?:   string;
  todayCost: number;
  budget:    number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** AUD/USD approximate conversion rate. Replace with live FX call if required. */
const AUD_TO_USD_RATE = 0.645;

function getDailyBudgetUsd(): number {
  const envVal = parseFloat(process.env.ARMY_DAILY_BUDGET_USD ?? '');
  if (!isNaN(envVal) && envVal > 0) return envVal;
  // Default: $10 AUD converted to USD
  return Math.round(10.0 * AUD_TO_USD_RATE * 100) / 100;
}

// ---------------------------------------------------------------------------
// Cost summary
// ---------------------------------------------------------------------------

/**
 * Returns cumulative cost totals for today, this week, and this month.
 * Optionally filters by workspaceId — omit to get global totals.
 */
export async function getCostSummary(
  supabase: SupabaseClient,
  workspaceId?: string,
): Promise<CostSummary> {
  const now        = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let query = supabase
    .from('army_runs')
    .select('cost_usd, created_at')
    .eq('status', 'completed')
    .gte('created_at', monthStart.toISOString());

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[army/cost-monitor] getCostSummary error:', error.message);
    return {
      todayUsd: 0, weekUsd: 0, monthUsd: 0,
      todayAud: 0, weekAud: 0, monthAud: 0,
      runCount: 0,
    };
  }

  let todayUsd  = 0;
  let weekUsd   = 0;
  let monthUsd  = 0;
  let runCount  = 0;

  for (const row of data ?? []) {
    const usd = Number(row.cost_usd) || 0;
    const d   = new Date(row.created_at as string);
    monthUsd += usd;
    runCount += 1;
    if (d >= weekStart)  weekUsd  += usd;
    if (d >= todayStart) todayUsd += usd;
  }

  // AUD conversion: 1 USD ≈ 1.55 AUD
  const usdToAud = 1 / AUD_TO_USD_RATE;

  return {
    todayUsd:  Math.round(todayUsd  * 10_000) / 10_000,
    weekUsd:   Math.round(weekUsd   * 10_000) / 10_000,
    monthUsd:  Math.round(monthUsd  * 10_000) / 10_000,
    todayAud:  Math.round(todayUsd  * usdToAud * 10_000) / 10_000,
    weekAud:   Math.round(weekUsd   * usdToAud * 10_000) / 10_000,
    monthAud:  Math.round(monthUsd  * usdToAud * 10_000) / 10_000,
    runCount,
  };
}

// ---------------------------------------------------------------------------
// Budget throttle check
// ---------------------------------------------------------------------------

/**
 * Checks whether today's cumulative spend has exceeded the daily budget.
 *
 * Returns `{ throttled: true }` when over budget so the execute route can
 * return HTTP 429 for non-urgent agents.
 *
 * Urgent agents (hourly monitors, review flaggers) bypass this check in the
 * execute route — only non-urgent agents are paused.
 */
export async function checkBudgetThrottle(
  supabase: SupabaseClient,
  workspaceId?: string,
): Promise<ThrottleResult> {
  const budget    = getDailyBudgetUsd();
  const summary   = await getCostSummary(supabase, workspaceId);
  const todayCost = summary.todayUsd;

  if (todayCost >= budget) {
    return {
      throttled: true,
      reason:    `Daily budget of $${budget.toFixed(2)} USD (~$${(budget / AUD_TO_USD_RATE).toFixed(2)} AUD) ` +
                 `exceeded. Today's spend: $${todayCost.toFixed(4)} USD. ` +
                 `Non-urgent agents are paused until midnight AEST.`,
      todayCost,
      budget,
    };
  }

  return {
    throttled: false,
    todayCost,
    budget,
  };
}
