/**
 * Loyalty Credits Engine
 * Manages credit issuance, redemption, cap enforcement, and event tracking
 * Part of v1_1_05: Loyalty & Referral Pivot Engine
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface LoyaltyCreditRow {
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  monthly_cap: number;
  monthly_earned: number;
  workspace_id: string;
}

export interface LoyaltyBalance {
  balance: bigint;
  lifetimeEarned: bigint;
  lifetimeRedeemed: bigint;
  monthlyCap: bigint;
  monthlyEarned: bigint;
  monthlyRemaining: bigint;
  canEarnMore: boolean;
}

export interface CreditIssuanceResult {
  success: boolean;
  amountIssued?: bigint;
  newBalance?: bigint;
  monthlyRemaining?: bigint;
  capped?: boolean;
  message?: string;
  reason?: string;
}

export interface CreditRedemptionResult {
  success: boolean;
  amountRedeemed?: bigint;
  newBalance?: bigint;
  lifetimeRedeemed?: bigint;
  message?: string;
  reason?: string;
}

interface TransactionDetails {
  referralCodeId?: string;
  rewardId?: string;
  taskId?: string;
  referralEventId?: string;
  customMessage?: string;
}

/**
 * Issue credits to a user (service role only)
 * Enforces monthly caps and returns detailed result
 */
export async function issueCredits(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string,
  amount: bigint,
  transactionType: string,
  details?: TransactionDetails
): Promise<CreditIssuanceResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc(
      'issue_loyalty_credits',
      {
        p_workspace_id: workspaceId,
        p_user_id: userId,
        p_amount: amount,
        p_transaction_type: transactionType,
        p_related_entity_type: details?.referralCodeId ? 'referral_code' :
                               details?.rewardId ? 'reward' :
                               details?.taskId ? 'task' :
                               details?.referralEventId ? 'referral_event' : null,
        p_related_entity_id: details?.referralCodeId ||
                            details?.rewardId ||
                            details?.taskId ||
                            details?.referralEventId || null,
        p_details: details ? { ...details } : null,
      }
    );

    if (error) {
      console.error('[loyaltyEngine] Issue credits failed:', error);
      return {
        success: false,
        reason: 'database_error',
        message: error.message,
      };
    }

    return {
      success: data.success,
      amountIssued: BigInt(data.amount_issued || 0),
      newBalance: BigInt(data.new_balance || 0),
      monthlyRemaining: BigInt(data.monthly_remaining || 0),
      capped: data.capped || false,
      message: data.capped ? 'Credits capped to monthly limit' : 'Credits issued successfully',
    };
  } catch (error) {
    console.error('[loyaltyEngine] Unexpected error:', error);
    return {
      success: false,
      reason: 'internal_error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Redeem credits for a reward
 */
export async function redeemCredits(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string,
  amount: bigint,
  rewardId?: string
): Promise<CreditRedemptionResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc(
      'redeem_loyalty_credits',
      {
        p_workspace_id: workspaceId,
        p_user_id: userId,
        p_amount: amount,
        p_reward_id: rewardId || null,
      }
    );

    if (error) {
      console.error('[loyaltyEngine] Redeem credits failed:', error);
      return {
        success: false,
        reason: data?.reason || 'database_error',
        message: data?.message || error.message,
      };
    }

    return {
      success: data.success,
      amountRedeemed: BigInt(data.amount_redeemed || 0),
      newBalance: BigInt(data.new_balance || 0),
      lifetimeRedeemed: BigInt(data.lifetime_redeemed || 0),
      message: 'Credits redeemed successfully',
    };
  } catch (error) {
    console.error('[loyaltyEngine] Unexpected error:', error);
    return {
      success: false,
      reason: 'internal_error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current credit balance for a user
 */
export async function getBalance(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string
): Promise<LoyaltyBalance | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('loyalty_credits')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[loyaltyEngine] Get balance failed:', error);
      return null;
    }

    if (!data) {
      return {
        balance: 0n,
        lifetimeEarned: 0n,
        lifetimeRedeemed: 0n,
        monthlyCap: 5000n,
        monthlyEarned: 0n,
        monthlyRemaining: 5000n,
        canEarnMore: true,
      };
    }

    return {
      balance: BigInt(data.balance),
      lifetimeEarned: BigInt(data.lifetime_earned),
      lifetimeRedeemed: BigInt(data.lifetime_redeemed),
      monthlyCap: BigInt(data.monthly_cap),
      monthlyEarned: BigInt(data.monthly_earned),
      monthlyRemaining: BigInt(data.monthly_cap) - BigInt(data.monthly_earned),
      canEarnMore: BigInt(data.monthly_earned) < BigInt(data.monthly_cap),
    };
  } catch (error) {
    console.error('[loyaltyEngine] Unexpected error:', error);
    return null;
  }
}

/**
 * Get credit history with optional filtering
 */
export async function getCreditHistory(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string,
  limit: number = 50,
  offset: number = 0,
  transactionType?: string
): Promise<Record<string, unknown>[]> {
  try {
    let query = supabaseAdmin
      .from('loyalty_credit_ledger')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (transactionType) {
      query = query.eq('transaction_type', transactionType);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[loyaltyEngine] Get history failed:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[loyaltyEngine] Unexpected error:', error);
    return [];
  }
}

/**
 * Get monthly credit progress
 */
export async function getMonthlyProgress(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string
): Promise<{
  monthlyCap: bigint;
  monthlyEarned: bigint;
  monthlyRemaining: bigint;
  canEarnMore: boolean;
} | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc(
      'get_loyalty_monthly_progress',
      {
        p_workspace_id: workspaceId,
        p_user_id: userId,
      }
    );

    if (error) {
      console.error('[loyaltyEngine] Get monthly progress failed:', error);
      return null;
    }

    return {
      monthlyCap: BigInt(data.monthly_cap),
      monthlyEarned: BigInt(data.monthly_earned),
      monthlyRemaining: BigInt(data.monthly_remaining),
      canEarnMore: data.can_earn_more,
    };
  } catch (error) {
    console.error('[loyaltyEngine] Unexpected error:', error);
    return null;
  }
}

/**
 * Check if user can earn more credits this month
 */
export async function canEarnMoreCredits(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const progress = await getMonthlyProgress(supabaseAdmin, workspaceId, userId);
  return progress?.canEarnMore ?? false;
}

/**
 * Get workspace-wide loyalty stats (founder only)
 */
export async function getWorkspaceStats(
  supabaseAdmin: SupabaseClient,
  workspaceId: string
): Promise<{
  totalUsersWithCredits: number;
  totalCreditsIssued: bigint;
  totalCreditsRedeemed: bigint;
  averageBalance: bigint;
  topRedeemers: Array<{ userId: string; amount: bigint }>;
} | null> {
  try {
    const { data: credits, error: creditsError } = await supabaseAdmin
      .from('loyalty_credits')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (creditsError) {
      console.error('[loyaltyEngine] Get workspace stats failed:', creditsError);
      return null;
    }

    if (!credits || credits.length === 0) {
      return {
        totalUsersWithCredits: 0,
        totalCreditsIssued: 0n,
        totalCreditsRedeemed: 0n,
        averageBalance: 0n,
        topRedeemers: [],
      };
    }

    const allCredits: LoyaltyCreditRow[] = credits;

    const totalIssued = allCredits.reduce(
      (sum: bigint, c) => sum + BigInt(c.lifetime_earned),
      0n
    );
    const totalRedeemed = allCredits.reduce(
      (sum: bigint, c) => sum + BigInt(c.lifetime_redeemed),
      0n
    );
    const avgBalance = allCredits.length > 0
      ? totalIssued / BigInt(allCredits.length)
      : 0n;

    const topRedeemers = allCredits
      .sort((a, b) => b.lifetime_redeemed - a.lifetime_redeemed)
      .slice(0, 10)
      .map((c) => ({
        userId: c.user_id,
        amount: BigInt(c.lifetime_redeemed),
      }));

    return {
      totalUsersWithCredits: credits.length,
      totalCreditsIssued: totalIssued,
      totalCreditsRedeemed: totalRedeemed,
      averageBalance: avgBalance,
      topRedeemers,
    };
  } catch (error) {
    console.error('[loyaltyEngine] Unexpected error:', error);
    return null;
  }
}
