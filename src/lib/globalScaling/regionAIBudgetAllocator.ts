/**
 * Region AI Budget Allocator
 * Phase 92: Manage AI budget allocation and spending per region
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { BudgetCheckResult } from './globalScalingTypes';

/**
 * Allocate daily budget to a region
 * Called at start of each day
 */
export async function allocateDaily(regionId: string): Promise<void> {
  const supabase = await getSupabaseServer();

  // Reset daily spend counter
  await supabase
    .from('region_scaling_state')
    .update({
      ai_spend_today: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('region_id', regionId);

  // Log allocation
  const { data: state } = await supabase
    .from('region_scaling_state')
    .select('ai_budget_monthly')
    .eq('region_id', regionId)
    .single();

  if (state) {
    const dailyBudget = Math.floor(state.ai_budget_monthly / 30);

    await supabase.from('region_budget_transactions').insert({
      region_id: regionId,
      transaction_type: 'allocation',
      amount: dailyBudget,
      balance_after: state.ai_budget_monthly,
      description: 'Daily budget allocation reset',
    });
  }
}

/**
 * Check if region has sufficient budget for an operation
 */
export async function checkBudget(
  regionId: string,
  costEstimate: number
): Promise<BudgetCheckResult> {
  const supabase = await getSupabaseServer();

  const { data: state } = await supabase
    .from('region_scaling_state')
    .select('ai_budget_remaining, scaling_mode')
    .eq('region_id', regionId)
    .single();

  if (!state) {
    return {
      allowed: false,
      remaining: 0,
      requested: costEstimate,
      message: 'Region not found',
    };
  }

  // Check scaling mode restrictions
  if (state.scaling_mode === 'frozen') {
    return {
      allowed: false,
      remaining: state.ai_budget_remaining,
      requested: costEstimate,
      message: 'Region is frozen - no AI operations allowed',
    };
  }

  if (state.scaling_mode === 'throttled' && costEstimate > 100) {
    return {
      allowed: false,
      remaining: state.ai_budget_remaining,
      requested: costEstimate,
      message: 'Region is throttled - large operations not allowed',
    };
  }

  // Check budget
  if (state.ai_budget_remaining < costEstimate) {
    return {
      allowed: false,
      remaining: state.ai_budget_remaining,
      requested: costEstimate,
      message: `Insufficient budget: ${state.ai_budget_remaining} remaining, ${costEstimate} requested`,
    };
  }

  return {
    allowed: true,
    remaining: state.ai_budget_remaining,
    requested: costEstimate,
  };
}

/**
 * Decrement budget after successful operation
 */
export async function decrement(
  regionId: string,
  amount: number,
  options?: {
    agencyId?: string;
    jobType?: string;
    description?: string;
  }
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { data: success } = await supabase.rpc('check_and_decrement_budget', {
    p_region_id: regionId,
    p_amount: amount,
    p_agency_id: options?.agencyId || null,
    p_job_type: options?.jobType || null,
  });

  return success || false;
}

/**
 * Refund budget for failed/cancelled operations
 */
export async function refund(
  regionId: string,
  amount: number,
  reason?: string
): Promise<void> {
  const supabase = await getSupabaseServer();

  // Get current balance
  const { data: state } = await supabase
    .from('region_scaling_state')
    .select('ai_budget_remaining')
    .eq('region_id', regionId)
    .single();

  if (!state) return;

  const newBalance = state.ai_budget_remaining + amount;

  // Update balance
  await supabase
    .from('region_scaling_state')
    .update({
      ai_budget_remaining: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('region_id', regionId);

  // Log refund
  await supabase.from('region_budget_transactions').insert({
    region_id: regionId,
    transaction_type: 'refund',
    amount,
    balance_after: newBalance,
    description: reason || 'Budget refund',
  });
}

/**
 * Get budget usage statistics for a region
 */
export async function getBudgetStats(regionId: string) {
  const supabase = await getSupabaseServer();

  const { data: state } = await supabase
    .from('region_scaling_state')
    .select('ai_budget_monthly, ai_budget_remaining, ai_spend_today')
    .eq('region_id', regionId)
    .single();

  if (!state) {
    return null;
  }

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('region_budget_transactions')
    .select('*')
    .eq('region_id', regionId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get spend by job type this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: spendByType } = await supabase
    .from('region_budget_transactions')
    .select('job_type, amount')
    .eq('region_id', regionId)
    .eq('transaction_type', 'spend')
    .gte('created_at', startOfMonth.toISOString());

  const byJobType: Record<string, number> = {};
  spendByType?.forEach(tx => {
    const type = tx.job_type || 'unknown';
    byJobType[type] = (byJobType[type] || 0) + tx.amount;
  });

  return {
    monthly: state.ai_budget_monthly,
    remaining: state.ai_budget_remaining,
    spentToday: state.ai_spend_today,
    spentThisMonth: state.ai_budget_monthly - state.ai_budget_remaining,
    percentUsed: Math.round(
      ((state.ai_budget_monthly - state.ai_budget_remaining) / state.ai_budget_monthly) * 100
    ),
    recentTransactions: transactions || [],
    spendByJobType: byJobType,
  };
}

/**
 * Set monthly budget for a region
 */
export async function setMonthlyBudget(
  regionId: string,
  budget: number
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase
    .from('region_scaling_state')
    .update({
      ai_budget_monthly: budget,
      updated_at: new Date().toISOString(),
    })
    .eq('region_id', regionId);
}
