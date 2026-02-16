/**
 * Referral Tracking Engine
 * Manages referral codes, events, attribution, and fraud detection
 * Part of v1_1_05: Loyalty & Referral Pivot Engine
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface ReferralCodeRow {
  id: string;
  code: string;
  campaign: string;
  times_used: number;
  referrals_accepted: number;
  total_credits_issued: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface ReferralEventRow {
  id: string;
  event_type: string;
  referred_email: string | null;
  fraud_score: number;
  fraud_signals: Record<string, boolean> | null;
  attribution_confidence: string;
  is_valid: boolean;
  created_at: string;
}

interface ReferralAttributionRow {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  status: string;
  referrer_credit_amount: number;
  referred_user_credit_amount: number;
  requires_founder_approval: boolean;
  created_at: string;
}

export interface ReferralCode {
  id: string;
  code: string;
  campaign: string;
  timesUsed: bigint;
  referralsAccepted: bigint;
  totalCreditsIssued: bigint;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface ReferralEvent {
  id: string;
  eventType: string;
  referredEmail?: string;
  fraudScore: number;
  fraudSignals: Record<string, boolean>;
  attributionConfidence: string;
  isValid: boolean;
  createdAt: string;
}

export interface ReferralAttribution {
  id: string;
  referrerId: string;
  referredUserId: string;
  status: string;
  referrerCreditAmount: bigint;
  referredUserCreditAmount: bigint;
  requiresFounderApproval: boolean;
  createdAt: string;
}

/**
 * Generate a unique referral code for a user
 */
export async function generateReferralCode(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string,
  campaign: string = 'default'
): Promise<{ success: boolean; code?: string; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin.rpc(
      'generate_referral_code',
      {
        p_workspace_id: workspaceId,
        p_user_id: userId,
        p_campaign: campaign,
      }
    );

    if (error) {
      console.error('[referralEngine] Generate code failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: data.success,
      code: data.code,
      message: data.success ? `Code generated: ${data.code}` : data.message,
    };
  } catch (error) {
    console.error('[referralEngine] Unexpected error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all referral codes for a user
 */
export async function getUserReferralCodes(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string
): Promise<ReferralCode[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('referral_codes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[referralEngine] Get codes failed:', error);
      return [];
    }

    return (data || []).map((code: ReferralCodeRow) => ({
      id: code.id,
      code: code.code,
      campaign: code.campaign,
      timesUsed: BigInt(code.times_used),
      referralsAccepted: BigInt(code.referrals_accepted),
      totalCreditsIssued: BigInt(code.total_credits_issued),
      isActive: code.is_active,
      expiresAt: code.expires_at,
      createdAt: code.created_at,
    }));
  } catch (error) {
    console.error('[referralEngine] Unexpected error:', error);
    return [];
  }
}

/**
 * Record a referral event and calculate fraud score
 */
export async function recordReferralEvent(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  referrerId: string,
  referralCodeId: string,
  eventType: string,
  referredUserId?: string,
  referredEmail?: string
): Promise<{
  success: boolean;
  eventId?: string;
  fraudScore?: number;
  requiresReview?: boolean;
  fraudSignals?: Record<string, boolean>;
  message?: string;
}> {
  try {
    const { data, error } = await supabaseAdmin.rpc(
      'record_referral_event',
      {
        p_workspace_id: workspaceId,
        p_referrer_id: referrerId,
        p_referral_code_id: referralCodeId,
        p_event_type: eventType,
        p_referred_user_id: referredUserId || null,
        p_referred_email: referredEmail || null,
      }
    );

    if (error) {
      console.error('[referralEngine] Record event failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: data.success,
      eventId: data.event_id,
      fraudScore: data.fraud_score,
      requiresReview: data.requires_review,
      fraudSignals: data.fraud_signals,
      message: data.success ? 'Event recorded' : 'Failed to record event',
    };
  } catch (error) {
    console.error('[referralEngine] Unexpected error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get referral events for a user
 */
export async function getReferrerEvents(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  referrerId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ReferralEvent[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('referral_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[referralEngine] Get events failed:', error);
      return [];
    }

    return (data || []).map((event: ReferralEventRow) => ({
      id: event.id,
      eventType: event.event_type,
      referredEmail: event.referred_email,
      fraudScore: event.fraud_score,
      fraudSignals: event.fraud_signals || {},
      attributionConfidence: event.attribution_confidence,
      isValid: event.is_valid,
      createdAt: event.created_at,
    }));
  } catch (error) {
    console.error('[referralEngine] Unexpected error:', error);
    return [];
  }
}

/**
 * Validate and create attribution between referrer and referred user
 */
export async function createAttribution(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  referrerId: string,
  referredUserId: string,
  referralCodeId: string,
  referralEventId?: string
): Promise<{
  success: boolean;
  attributionId?: string;
  requiresFounderApproval?: boolean;
  status?: string;
  message?: string;
}> {
  try {
    const { data, error } = await supabaseAdmin.rpc(
      'validate_referral_attribution',
      {
        p_workspace_id: workspaceId,
        p_referrer_id: referrerId,
        p_referred_user_id: referredUserId,
        p_referral_code_id: referralCodeId,
        p_referral_event_id: referralEventId || null,
      }
    );

    if (error) {
      console.error('[referralEngine] Create attribution failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: data.success,
      attributionId: data.attribution_id,
      requiresFounderApproval: data.requires_founder_approval,
      status: data.status,
      message: data.success ? 'Attribution created' : 'Failed to create attribution',
    };
  } catch (error) {
    console.error('[referralEngine] Unexpected error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get attributions for a referrer
 */
export async function getReferrerAttributions(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  referrerId: string,
  status?: string
): Promise<ReferralAttribution[]> {
  try {
    let query = supabaseAdmin
      .from('referral_attribution')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('referrer_id', referrerId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[referralEngine] Get attributions failed:', error);
      return [];
    }

    return (data || []).map((attr: ReferralAttributionRow) => ({
      id: attr.id,
      referrerId: attr.referrer_id,
      referredUserId: attr.referred_user_id,
      status: attr.status,
      referrerCreditAmount: BigInt(attr.referrer_credit_amount),
      referredUserCreditAmount: BigInt(attr.referred_user_credit_amount),
      requiresFounderApproval: attr.requires_founder_approval,
      createdAt: attr.created_at,
    }));
  } catch (error) {
    console.error('[referralEngine] Unexpected error:', error);
    return [];
  }
}

/**
 * Get pending attributions requiring founder approval
 */
export async function getPendingAttributions(
  supabaseAdmin: SupabaseClient,
  workspaceId: string
): Promise<ReferralAttribution[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('referral_attribution')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .eq('requires_founder_approval', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[referralEngine] Get pending attributions failed:', error);
      return [];
    }

    return (data || []).map((attr: ReferralAttributionRow) => ({
      id: attr.id,
      referrerId: attr.referrer_id,
      referredUserId: attr.referred_user_id,
      status: attr.status,
      referrerCreditAmount: BigInt(attr.referrer_credit_amount),
      referredUserCreditAmount: BigInt(attr.referred_user_credit_amount),
      requiresFounderApproval: attr.requires_founder_approval,
      createdAt: attr.created_at,
    }));
  } catch (error) {
    console.error('[referralEngine] Unexpected error:', error);
    return [];
  }
}

/**
 * Get referral stats for a user
 */
export async function getUserReferralStats(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string
): Promise<{
  totalCodeGenerated: number;
  totalInvitesSent: number;
  totalAccepted: number;
  totalCreditsEarned: bigint;
  pendingApprovals: number;
  fraudAlerts: number;
}> {
  try {
    // Get attributions
    const { data: attributions, error: attrError } = await supabaseAdmin
      .from('referral_attribution')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('referrer_id', userId);

    // Get events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('referral_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('referrer_id', userId);

    // Get codes
    const { data: codes, error: codesError } = await supabaseAdmin
      .from('referral_codes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (attrError || eventsError || codesError) {
      console.error('[referralEngine] Get stats failed');
      return {
        totalCodeGenerated: 0,
        totalInvitesSent: 0,
        totalAccepted: 0,
        totalCreditsEarned: 0n,
        pendingApprovals: 0,
        fraudAlerts: 0,
      };
    }

    const allAttributions: ReferralAttributionRow[] = attributions || [];
    const allEvents: ReferralEventRow[] = events || [];
    const allCodes: ReferralCodeRow[] = codes || [];

    const verified = allAttributions.filter((a) => a.status === 'verified');
    const totalCredits = verified.reduce(
      (sum: bigint, a) => sum + BigInt(a.referrer_credit_amount),
      0n
    );

    const fraudAlerts = allEvents.filter((e) => e.fraud_score >= 70).length;

    return {
      totalCodeGenerated: allCodes.length,
      totalInvitesSent: allEvents.filter((e) => e.event_type === 'invite_sent').length,
      totalAccepted: allAttributions.filter((a) => a.status !== 'rejected').length,
      totalCreditsEarned: totalCredits,
      pendingApprovals: allAttributions.filter((a) =>
        a.status === 'pending' && a.requires_founder_approval
      ).length,
      fraudAlerts,
    };
  } catch (error) {
    console.error('[referralEngine] Unexpected error:', error);
    return {
      totalCodeGenerated: 0,
      totalInvitesSent: 0,
      totalAccepted: 0,
      totalCreditsEarned: 0n,
      pendingApprovals: 0,
      fraudAlerts: 0,
    };
  }
}
