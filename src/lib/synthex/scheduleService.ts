/**
 * Schedule Service
 *
 * Manages campaign scheduling, queuing, and execution tracking.
 *
 * Phase: B5 - Synthex Campaign Scheduling
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

export interface ScheduleStep {
  stepIndex: number;
  sendAt: Date | string;
  recipientCount?: number;
}

export interface CreateScheduleParams {
  campaignId: string;
  tenantId: string;
  brandId?: string | null;
  userId: string;
  steps: ScheduleStep[];
  timezone?: string;
}

export interface Schedule {
  id: string;
  campaign_id: string;
  tenant_id: string;
  brand_id: string | null;
  user_id: string;
  step_index: number;
  send_at: string;
  timezone: string;
  status: 'pending' | 'queued' | 'sending' | 'sent' | 'failed' | 'cancelled';
  sent_at: string | null;
  error_message: string | null;
  retry_count: number;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsRecord {
  id: string;
  campaign_id: string;
  tenant_id: string;
  analytics_date: string;
  emails_sent: number;
  emails_delivered: number;
  emails_bounced: number;
  emails_opened: number;
  unique_opens: number;
  emails_clicked: number;
  unique_clicks: number;
  unsubscribes: number;
  spam_reports: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  revenue_generated: number;
  conversions: number;
}

/**
 * Create schedule entries for campaign steps
 */
export async function createSchedule(params: CreateScheduleParams): Promise<{
  data: Schedule[] | null;
  error: Error | null;
}> {
  const { campaignId, tenantId, brandId, userId, steps, timezone = 'UTC' } = params;

  try {
    const records = steps.map((step) => ({
      campaign_id: campaignId,
      tenant_id: tenantId,
      brand_id: brandId || null,
      user_id: userId,
      step_index: step.stepIndex,
      send_at: typeof step.sendAt === 'string' ? step.sendAt : step.sendAt.toISOString(),
      timezone,
      recipient_count: step.recipientCount || 0,
      status: 'pending',
    }));

    const { data, error } = await supabaseAdmin
      .from('synthex_campaign_schedule')
      .insert(records)
      .select();

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[scheduleService.createSchedule] Error:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Failed to create schedule') };
  }
}

/**
 * Get schedules for a campaign
 */
export async function getSchedulesByCampaign(
  campaignId: string
): Promise<{ data: Schedule[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_campaign_schedule')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('step_index', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[scheduleService.getSchedulesByCampaign] Error:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Failed to get schedules') };
  }
}

/**
 * List all schedules for a tenant
 */
export async function listSchedules(
  tenantId: string,
  userId: string,
  options: {
    status?: string;
    limit?: number;
    upcoming?: boolean;
  } = {}
): Promise<{ data: Schedule[] | null; error: Error | null }> {
  try {
    let query = supabaseAdmin
      .from('synthex_campaign_schedule')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.upcoming) {
      query = query
        .gte('send_at', new Date().toISOString())
        .eq('status', 'pending');
    }

    query = query.order('send_at', { ascending: true });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[scheduleService.listSchedules] Error:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Failed to list schedules') };
  }
}

/**
 * Update schedule status
 */
export async function updateScheduleStatus(
  scheduleId: string,
  status: Schedule['status'],
  metadata?: {
    sentAt?: string;
    errorMessage?: string;
    sentCount?: number;
    failedCount?: number;
  }
): Promise<{ data: Schedule | null; error: Error | null }> {
  try {
    const updateData: Record<string, unknown> = { status };

    if (metadata?.sentAt) updateData.sent_at = metadata.sentAt;
    if (metadata?.errorMessage) updateData.error_message = metadata.errorMessage;
    if (typeof metadata?.sentCount === 'number') updateData.sent_count = metadata.sentCount;
    if (typeof metadata?.failedCount === 'number') updateData.failed_count = metadata.failedCount;

    if (status === 'failed') {
      // Increment retry count on failure
      const { data: current } = await supabaseAdmin
        .from('synthex_campaign_schedule')
        .select('retry_count, max_retries')
        .eq('id', scheduleId)
        .single();

      if (current && current.retry_count < current.max_retries) {
        updateData.retry_count = current.retry_count + 1;
        updateData.next_retry_at = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min delay
        updateData.status = 'pending'; // Reset to pending for retry
      }
    }

    const { data, error } = await supabaseAdmin
      .from('synthex_campaign_schedule')
      .update(updateData)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[scheduleService.updateScheduleStatus] Error:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Failed to update schedule') };
  }
}

/**
 * Cancel a schedule
 */
export async function cancelSchedule(
  scheduleId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabaseAdmin
      .from('synthex_campaign_schedule')
      .update({ status: 'cancelled' })
      .eq('id', scheduleId)
      .in('status', ['pending', 'queued']); // Can only cancel if not already sent

    if (error) throw error;

    return { success: true, error: null };
  } catch (err) {
    console.error('[scheduleService.cancelSchedule] Error:', err);
    return { success: false, error: err instanceof Error ? err : new Error('Failed to cancel schedule') };
  }
}

/**
 * Get pending schedules that are due for sending
 */
export async function getDueSchedules(
  limit: number = 100
): Promise<{ data: Schedule[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_campaign_schedule')
      .select('*')
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString())
      .order('send_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[scheduleService.getDueSchedules] Error:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Failed to get due schedules') };
  }
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(
  campaignId: string,
  options: {
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<{ data: AnalyticsRecord[] | null; error: Error | null }> {
  try {
    let query = supabaseAdmin
      .from('synthex_campaign_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('analytics_date', { ascending: false });

    if (options.startDate) {
      query = query.gte('analytics_date', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('analytics_date', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[scheduleService.getCampaignAnalytics] Error:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Failed to get analytics') };
  }
}

/**
 * Get aggregated analytics for tenant
 */
export async function getTenantAnalyticsSummary(
  tenantId: string,
  days: number = 30
): Promise<{
  data: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    avgOpenRate: number;
    avgClickRate: number;
    totalRevenue: number;
    totalConversions: number;
  } | null;
  error: Error | null;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from('synthex_campaign_analytics')
      .select('emails_sent, emails_opened, emails_clicked, open_rate, click_rate, revenue_generated, conversions')
      .eq('tenant_id', tenantId)
      .gte('analytics_date', startDate.toISOString().split('T')[0]);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        data: {
          totalSent: 0,
          totalOpened: 0,
          totalClicked: 0,
          avgOpenRate: 0,
          avgClickRate: 0,
          totalRevenue: 0,
          totalConversions: 0,
        },
        error: null,
      };
    }

    const summary = data.reduce(
      (acc, record) => ({
        totalSent: acc.totalSent + (record.emails_sent || 0),
        totalOpened: acc.totalOpened + (record.emails_opened || 0),
        totalClicked: acc.totalClicked + (record.emails_clicked || 0),
        totalOpenRate: acc.totalOpenRate + (record.open_rate || 0),
        totalClickRate: acc.totalClickRate + (record.click_rate || 0),
        totalRevenue: acc.totalRevenue + (record.revenue_generated || 0),
        totalConversions: acc.totalConversions + (record.conversions || 0),
      }),
      {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalOpenRate: 0,
        totalClickRate: 0,
        totalRevenue: 0,
        totalConversions: 0,
      }
    );

    return {
      data: {
        totalSent: summary.totalSent,
        totalOpened: summary.totalOpened,
        totalClicked: summary.totalClicked,
        avgOpenRate: data.length > 0 ? summary.totalOpenRate / data.length : 0,
        avgClickRate: data.length > 0 ? summary.totalClickRate / data.length : 0,
        totalRevenue: summary.totalRevenue,
        totalConversions: summary.totalConversions,
      },
      error: null,
    };
  } catch (err) {
    console.error('[scheduleService.getTenantAnalyticsSummary] Error:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Failed to get analytics summary') };
  }
}

/**
 * Record analytics for a campaign send
 */
export async function recordAnalytics(
  campaignId: string,
  tenantId: string,
  metrics: Partial<Omit<AnalyticsRecord, 'id' | 'campaign_id' | 'tenant_id' | 'analytics_date'>>
): Promise<{ data: AnalyticsRecord | null; error: Error | null }> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Upsert - update if exists for today, otherwise insert
    const { data, error } = await supabaseAdmin
      .from('synthex_campaign_analytics')
      .upsert(
        {
          campaign_id: campaignId,
          tenant_id: tenantId,
          analytics_date: today,
          ...metrics,
        },
        {
          onConflict: 'campaign_id,analytics_date',
        }
      )
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[scheduleService.recordAnalytics] Error:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Failed to record analytics') };
  }
}
