/**
 * UsageMeteringService
 * Phase 12 Week 5-6: Usage tracking, metering, and limit enforcement
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export type EventCategory =
  | 'ai_request'
  | 'email_sent'
  | 'contact_created'
  | 'storage'
  | 'report_generated'
  | 'campaign_step'
  | 'api_call';

export type CounterType =
  | 'emails'
  | 'ai_requests'
  | 'contacts'
  | 'reports'
  | 'campaigns'
  | 'workspaces'
  | 'storage'
  | 'api_calls';

export type LimitBehavior = 'warn' | 'block' | 'overage';

export interface UsageEvent {
  id: string;
  org_id: string;
  workspace_id?: string;
  user_id?: string;
  event_type: string;
  event_category: EventCategory;
  quantity: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UsageCounter {
  id: string;
  org_id: string;
  counter_type: CounterType;
  period_start: string;
  period_end: string;
  count: number;
  limit_value: number | null;
  warning_sent: boolean;
  limit_reached: boolean;
}

export interface UsageCheckResult {
  current_usage: number;
  limit_value: number | null;
  percentage_used: number;
  is_within_limit: boolean;
  is_warning: boolean;
  is_unlimited: boolean;
}

export interface UsageSummary {
  emails: UsageCheckResult;
  ai_requests: UsageCheckResult;
  contacts: UsageCheckResult;
  reports: UsageCheckResult;
  campaigns: UsageCheckResult;
  storage: UsageCheckResult;
}

export class UsageMeteringService {
  // Counter type to event category mapping
  private counterToCategory: Record<CounterType, EventCategory> = {
    emails: 'email_sent',
    ai_requests: 'ai_request',
    contacts: 'contact_created',
    reports: 'report_generated',
    campaigns: 'campaign_step',
    workspaces: 'storage',
    storage: 'storage',
    api_calls: 'api_call',
  };

  /**
   * Track a usage event
   */
  async trackEvent(
    orgId: string,
    eventType: string,
    category: EventCategory,
    quantity: number = 1,
    metadata: Record<string, any> = {},
    workspaceId?: string,
    userId?: string
  ): Promise<UsageEvent> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('usage_events')
      .insert({
        org_id: orgId,
        workspace_id: workspaceId,
        user_id: userId,
        event_type: eventType,
        event_category: category,
        quantity,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking usage event:', error);
      throw new Error('Failed to track usage event');
    }

    // Update counter
    await this.incrementCounter(orgId, this.categoryToCounter(category), quantity);

    return data;
  }

  /**
   * Increment a usage counter
   */
  async incrementCounter(
    orgId: string,
    counterType: CounterType,
    amount: number = 1
  ): Promise<number> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase.rpc('increment_usage', {
      p_org_id: orgId,
      p_counter_type: counterType,
      p_amount: amount,
    });

    if (error) {
      console.error('Error incrementing counter:', error);
      throw new Error('Failed to increment usage counter');
    }

    return data;
  }

  /**
   * Check usage against limit
   */
  async checkLimit(
    orgId: string,
    counterType: CounterType
  ): Promise<UsageCheckResult> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase.rpc('check_usage_limit', {
      p_org_id: orgId,
      p_counter_type: counterType,
    });

    if (error) {
      console.error('Error checking limit:', error);
      throw new Error('Failed to check usage limit');
    }

    const result = data?.[0] || {
      current_usage: 0,
      limit_value: null,
      percentage_used: 0,
      is_within_limit: true,
      is_warning: false,
    };

    return {
      ...result,
      is_unlimited: result.limit_value === null || result.limit_value === -1,
    };
  }

  /**
   * Get current usage for a counter
   */
  async getCurrentUsage(orgId: string, counterType: CounterType): Promise<number> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase.rpc('get_current_usage', {
      p_org_id: orgId,
      p_counter_type: counterType,
    });

    if (error) {
      console.error('Error getting current usage:', error);
      throw new Error('Failed to get current usage');
    }

    return data || 0;
  }

  /**
   * Get complete usage summary for organization
   */
  async getUsageSummary(orgId: string): Promise<UsageSummary> {
    const [emails, ai_requests, contacts, reports, campaigns, storage] = await Promise.all([
      this.checkLimit(orgId, 'emails'),
      this.checkLimit(orgId, 'ai_requests'),
      this.checkLimit(orgId, 'contacts'),
      this.checkLimit(orgId, 'reports'),
      this.checkLimit(orgId, 'campaigns'),
      this.checkLimit(orgId, 'storage'),
    ]);

    return {
      emails,
      ai_requests,
      contacts,
      reports,
      campaigns,
      storage,
    };
  }

  /**
   * Check if action is allowed based on limits
   */
  async canPerformAction(
    orgId: string,
    counterType: CounterType,
    behavior: LimitBehavior = 'block'
  ): Promise<{ allowed: boolean; reason?: string; overage_charge?: number }> {
    const check = await this.checkLimit(orgId, counterType);

    if (check.is_unlimited || check.is_within_limit) {
      return { allowed: true };
    }

    switch (behavior) {
      case 'warn':
        // Allow but warn
        return {
          allowed: true,
          reason: `Warning: ${counterType} usage at ${check.percentage_used.toFixed(0)}% of limit`,
        };

      case 'overage':
        // Allow with overage charge
        const overageRate = this.getOverageRate(counterType);
        return {
          allowed: true,
          reason: `Overage charge will apply: ${overageRate}/unit`,
          overage_charge: overageRate,
        };

      case 'block':
      default:
        return {
          allowed: false,
          reason: `${counterType} limit reached (${check.current_usage}/${check.limit_value})`,
        };
    }
  }

  /**
   * Get usage events for organization
   */
  async getUsageEvents(
    orgId: string,
    options: {
      category?: EventCategory;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<UsageEvent[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('usage_events')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (options.category) {
      query = query.eq('event_category', options.category);
    }

    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching usage events:', error);
      throw new Error('Failed to fetch usage events');
    }

    return data || [];
  }

  /**
   * Get usage breakdown by category
   */
  async getUsageBreakdown(
    orgId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<EventCategory, number>> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('usage_events')
      .select('event_category, quantity')
      .eq('org_id', orgId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Error fetching usage breakdown:', error);
      throw new Error('Failed to fetch usage breakdown');
    }

    const breakdown: Record<EventCategory, number> = {
      ai_request: 0,
      email_sent: 0,
      contact_created: 0,
      storage: 0,
      report_generated: 0,
      campaign_step: 0,
      api_call: 0,
    };

    (data || []).forEach((event) => {
      breakdown[event.event_category as EventCategory] += event.quantity;
    });

    return breakdown;
  }

  /**
   * Reset counters for new billing period
   */
  async resetCountersForNewPeriod(
    orgId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Mark old counters as complete
    await supabase
      .from('metering_counters')
      .update({ updated_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .lt('period_end', periodStart.toISOString());

    // Note: New counters are created automatically by increment_usage function
  }

  /**
   * Track overage
   */
  async trackOverage(
    orgId: string,
    overageType: CounterType,
    quantity: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const unitPrice = this.getOverageRate(overageType);
    const totalCharge = quantity * unitPrice;

    // Get subscription ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('org_id', orgId)
      .single();

    await supabase.from('plan_overages').insert({
      org_id: orgId,
      subscription_id: subscription?.id,
      overage_type: overageType,
      quantity,
      unit_price: unitPrice,
      total_charge: totalCharge,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    });
  }

  /**
   * Get overages for billing period
   */
  async getOverages(
    orgId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{ type: string; quantity: number; charge: number }[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('plan_overages')
      .select('overage_type, quantity, total_charge')
      .eq('org_id', orgId)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())
      .eq('invoiced', false);

    if (error) {
      console.error('Error fetching overages:', error);
      throw new Error('Failed to fetch overages');
    }

    return (data || []).map((o) => ({
      type: o.overage_type,
      quantity: o.quantity,
      charge: o.total_charge,
    }));
  }

  // Private helper methods

  private categoryToCounter(category: EventCategory): CounterType {
    const mapping: Record<EventCategory, CounterType> = {
      email_sent: 'emails',
      ai_request: 'ai_requests',
      contact_created: 'contacts',
      report_generated: 'reports',
      campaign_step: 'campaigns',
      storage: 'storage',
      api_call: 'api_calls',
    };
    return mapping[category];
  }

  private getOverageRate(counterType: CounterType): number {
    const rates: Record<CounterType, number> = {
      emails: 0.001,        // $0.001 per email
      ai_requests: 0.01,    // $0.01 per AI request
      contacts: 0.005,      // $0.005 per contact
      reports: 0.05,        // $0.05 per report
      campaigns: 1.0,       // $1.00 per campaign
      workspaces: 5.0,      // $5.00 per workspace
      storage: 0.10,        // $0.10 per GB
      api_calls: 0.0001,    // $0.0001 per API call
    };
    return rates[counterType];
  }
}

// Export singleton instance
export const usageMeteringService = new UsageMeteringService();

// Convenience functions for common operations
export async function trackAIRequest(
  orgId: string,
  model: string,
  tokens: number,
  workspaceId?: string,
  userId?: string
): Promise<void> {
  await usageMeteringService.trackEvent(
    orgId,
    `ai_${model}`,
    'ai_request',
    1,
    { model, tokens },
    workspaceId,
    userId
  );
}

export async function trackEmailSent(
  orgId: string,
  emailType: string,
  workspaceId?: string,
  userId?: string
): Promise<void> {
  await usageMeteringService.trackEvent(
    orgId,
    `email_${emailType}`,
    'email_sent',
    1,
    { type: emailType },
    workspaceId,
    userId
  );
}

export async function trackContactCreated(
  orgId: string,
  workspaceId?: string,
  userId?: string
): Promise<void> {
  await usageMeteringService.trackEvent(
    orgId,
    'contact_created',
    'contact_created',
    1,
    {},
    workspaceId,
    userId
  );
}

export async function trackReportGenerated(
  orgId: string,
  reportType: string,
  workspaceId?: string,
  userId?: string
): Promise<void> {
  await usageMeteringService.trackEvent(
    orgId,
    `report_${reportType}`,
    'report_generated',
    1,
    { type: reportType },
    workspaceId,
    userId
  );
}

export async function checkAndEnforce(
  orgId: string,
  counterType: CounterType,
  behavior: LimitBehavior = 'block'
): Promise<void> {
  const result = await usageMeteringService.canPerformAction(orgId, counterType, behavior);

  if (!result.allowed) {
    throw new Error(result.reason || `${counterType} limit exceeded`);
  }

  if (result.reason) {
    console.warn(result.reason);
  }
}
