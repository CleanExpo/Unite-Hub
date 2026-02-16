/**
 * Loyalty Archive Bridge
 * Logs all loyalty and referral events to Living Intelligence Archive
 * Part of v1_1_05: Loyalty & Referral Pivot Engine
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface LoyaltyArchiveEvent {
  eventType: string; // 'credit_issued', 'credit_redeemed', 'referral_event', 'attribution_created', 'fraud_detected'
  workspaceId: string;
  userId: string;
  details: Record<string, unknown>;
  timestamp?: string;
}

export interface ReferralArchiveEvent {
  eventType: string; // 'code_generated', 'code_shared', 'code_used', 'fraud_detected', 'attribution_created'
  workspaceId: string;
  referrerId: string;
  referredUserId?: string;
  details: Record<string, unknown>;
  fraudScore?: number;
  timestamp?: string;
}

/**
 * Log a loyalty event to the archive
 */
export async function logLoyaltyEvent(
  supabaseAdmin: SupabaseClient,
  event: LoyaltyArchiveEvent
): Promise<{ success: boolean; eventId?: string; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('aiMemory')
      .insert({
        workspace_id: event.workspaceId,
        user_id: event.userId,
        memory_type: 'loyalty_event',
        event_type: event.eventType,
        title: `Loyalty Event: ${event.eventType}`,
        content: JSON.stringify(event.details),
        metadata: {
          category: 'loyalty_rewards',
          event_type: event.eventType,
          ...event.details,
        },
        created_at: event.timestamp || new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[loyaltyArchiveBridge] Log event failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      eventId: data.id,
      message: 'Event logged to archive',
    };
  } catch (error) {
    console.error('[loyaltyArchiveBridge] Unexpected error:', error);
    // Don't throw - archive logging should not block operations
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log a referral event to the archive
 */
export async function logReferralEvent(
  supabaseAdmin: SupabaseClient,
  event: ReferralArchiveEvent
): Promise<{ success: boolean; eventId?: string; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('aiMemory')
      .insert({
        workspace_id: event.workspaceId,
        user_id: event.referrerId,
        memory_type: 'referral_event',
        event_type: event.eventType,
        title: `Referral Event: ${event.eventType}`,
        content: JSON.stringify({
          ...event.details,
          referredUserId: event.referredUserId,
          fraudScore: event.fraudScore,
        }),
        metadata: {
          category: 'referral_tracking',
          event_type: event.eventType,
          referred_user_id: event.referredUserId,
          fraud_score: event.fraudScore || 0,
          ...event.details,
        },
        created_at: event.timestamp || new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[loyaltyArchiveBridge] Log referral event failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      eventId: data.id,
      message: 'Referral event logged to archive',
    };
  } catch (error) {
    console.error('[loyaltyArchiveBridge] Unexpected error:', error);
    // Don't throw - archive logging should not block operations
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log a fraud detection event
 */
export async function logFraudDetection(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string,
  fraudType: string,
  fraudScore: number,
  details: Record<string, unknown>
): Promise<{ success: boolean; eventId?: string; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('auditLogs')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        action: 'fraud_detection',
        resource_type: 'loyalty_system',
        resource_id: null,
        user_message: `Fraud detection triggered: ${fraudType}`,
        system_action: `Fraud score: ${fraudScore}`,
        metadata: {
          fraud_type: fraudType,
          fraud_score: fraudScore,
          requires_review: fraudScore >= 70,
          details,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[loyaltyArchiveBridge] Log fraud detection failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      eventId: data.id,
      message: `Fraud event logged (score: ${fraudScore})`,
    };
  } catch (error) {
    console.error('[loyaltyArchiveBridge] Unexpected error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log a redemption event
 */
export async function logRedemptionEvent(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string,
  rewardName: string,
  creditAmount: bigint,
  status: string
): Promise<{ success: boolean; eventId?: string; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('aiMemory')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        memory_type: 'reward_redemption',
        event_type: 'reward_redeemed',
        title: `Reward Redeemed: ${rewardName}`,
        content: JSON.stringify({
          reward_name: rewardName,
          credit_amount: Number(creditAmount),
          status,
          timestamp: new Date().toISOString(),
        }),
        metadata: {
          category: 'reward_redemption',
          reward_name: rewardName,
          credit_amount: Number(creditAmount),
          status,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[loyaltyArchiveBridge] Log redemption failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      eventId: data.id,
      message: `Redemption logged: ${rewardName}`,
    };
  } catch (error) {
    console.error('[loyaltyArchiveBridge] Unexpected error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get loyalty event history from archive
 */
export async function getLoyaltyEventHistory(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string,
  eventType?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Record<string, unknown>[]> {
  try {
    let query = supabaseAdmin
      .from('aiMemory')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .eq('memory_type', 'loyalty_event');

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[loyaltyArchiveBridge] Get history failed:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[loyaltyArchiveBridge] Unexpected error:', error);
    return [];
  }
}

/**
 * Get referral event history from archive
 */
export async function getReferralEventHistory(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  userId: string,
  eventType?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Record<string, unknown>[]> {
  try {
    let query = supabaseAdmin
      .from('aiMemory')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .eq('memory_type', 'referral_event');

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[loyaltyArchiveBridge] Get referral history failed:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[loyaltyArchiveBridge] Unexpected error:', error);
    return [];
  }
}

/**
 * Get fraud alerts from audit log
 */
export async function getFraudAlerts(
  supabaseAdmin: SupabaseClient,
  workspaceId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Record<string, unknown>[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('auditLogs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('action', 'fraud_detection')
      .eq('resource_type', 'loyalty_system')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[loyaltyArchiveBridge] Get fraud alerts failed:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[loyaltyArchiveBridge] Unexpected error:', error);
    return [];
  }
}

/**
 * Batch log multiple events
 */
export async function batchLogEvents(
  supabaseAdmin: SupabaseClient,
  events: (LoyaltyArchiveEvent | ReferralArchiveEvent)[]
): Promise<{ success: boolean; logged: number; failed: number; message?: string }> {
  let logged = 0;
  let failed = 0;

  for (const event of events) {
    try {
      if ('referrerId' in event) {
        const result = await logReferralEvent(supabaseAdmin, event as ReferralArchiveEvent);
        if (result.success) logged++;
        else failed++;
      } else {
        const result = await logLoyaltyEvent(supabaseAdmin, event as LoyaltyArchiveEvent);
        if (result.success) logged++;
        else failed++;
      }
    } catch (error) {
      failed++;
    }
  }

  return {
    success: failed === 0,
    logged,
    failed,
    message: `Logged ${logged} events, ${failed} failed`,
  };
}
