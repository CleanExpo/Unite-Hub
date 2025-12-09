/**
 * Synthex Revenue Service
 *
 * Handles revenue attribution by journey stage and channel.
 * Tracks revenue events, generates summaries, and provides
 * attribution analysis.
 *
 * Phase: B15 - Revenue Attribution by Journey Stage
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// ============================================
// Types
// ============================================

export type JourneyStage =
  | 'awareness'
  | 'consideration'
  | 'decision'
  | 'retention'
  | 'advocacy';

export type Channel =
  | 'email'
  | 'organic'
  | 'paid'
  | 'referral'
  | 'direct'
  | 'social'
  | 'affiliate'
  | 'other';

export type TouchpointType =
  | 'first_touch'
  | 'last_touch'
  | 'linear'
  | 'time_decay'
  | 'position_based';

export type EventType =
  | 'conversion'
  | 'refund'
  | 'upsell'
  | 'subscription'
  | 'renewal';

export interface RevenueEvent {
  id: string;
  tenantId: string;
  contactId: string | null;
  campaignId: string | null;
  journeyId: string | null;
  channel: Channel;
  stage: JourneyStage | null;
  touchpointType: TouchpointType | null;
  amount: number;
  currency: string;
  eventType: EventType;
  orderId: string | null;
  productSku: string | null;
  productName: string | null;
  quantity: number;
  metadata: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface RevenueEventInput {
  tenantId: string;
  contactId?: string;
  campaignId?: string;
  journeyId?: string;
  channel: Channel;
  stage?: JourneyStage;
  touchpointType?: TouchpointType;
  amount: number;
  currency?: string;
  eventType?: EventType;
  orderId?: string;
  productSku?: string;
  productName?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

export interface StageRevenue {
  stage: string;
  channel: string | null;
  revenue: number;
  refunds: number;
  netRevenue: number;
  conversions: number;
  avgOrderValue: number | null;
  date: string;
}

export interface StageSummary {
  stage: string;
  revenue: number;
  conversions: number;
  avgOrderValue: number;
  percentOfTotal: number;
}

export interface ChannelAttribution {
  channel: string;
  totalRevenue: number;
  totalConversions: number;
  firstTouchConversions: number;
  lastTouchConversions: number;
  assistedConversions: number;
  cost: number;
  roas: number | null;
  cac: number | null;
}

export interface DateRange {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

// ============================================
// Revenue Events
// ============================================

export async function recordRevenueEvent(
  input: RevenueEventInput
): Promise<ServiceResult<RevenueEvent>> {
  try {
    const payload = {
      tenant_id: input.tenantId,
      contact_id: input.contactId || null,
      campaign_id: input.campaignId || null,
      journey_id: input.journeyId || null,
      channel: input.channel,
      stage: input.stage || null,
      touchpoint_type: input.touchpointType || 'last_touch',
      amount: input.amount,
      currency: input.currency || 'AUD',
      event_type: input.eventType || 'conversion',
      order_id: input.orderId || null,
      product_sku: input.productSku || null,
      product_name: input.productName || null,
      quantity: input.quantity || 1,
      metadata: input.metadata || {},
      occurred_at: input.occurredAt || new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('synthex_revenue_events')
      .insert(payload)
      .select()
      .single();

    if (error) {
throw error;
}

    // Update daily aggregates
    await updateDailyAggregates(
      input.tenantId,
      new Date(payload.occurred_at).toISOString().split('T')[0],
      input.stage || 'unknown',
      input.channel,
      input.amount,
      input.eventType === 'refund' ? input.amount : 0
    );

    return { data: mapEventFromDb(data), error: null };
  } catch (error) {
    console.error('[revenueService.recordRevenueEvent] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function listRevenueEvents(
  tenantId: string,
  options?: DateRange & {
    contactId?: string;
    journeyId?: string;
    channel?: Channel;
    stage?: JourneyStage;
    limit?: number;
    offset?: number;
  }
): Promise<ServiceResult<RevenueEvent[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_revenue_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('occurred_at', { ascending: false });

    if (options?.from) {
      query = query.gte('occurred_at', options.from);
    }
    if (options?.to) {
      query = query.lte('occurred_at', options.to + 'T23:59:59Z');
    }
    if (options?.contactId) {
      query = query.eq('contact_id', options.contactId);
    }
    if (options?.journeyId) {
      query = query.eq('journey_id', options.journeyId);
    }
    if (options?.channel) {
      query = query.eq('channel', options.channel);
    }
    if (options?.stage) {
      query = query.eq('stage', options.stage);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
throw error;
}

    const events = (data || []).map(mapEventFromDb);
    return { data: events, error: null };
  } catch (error) {
    console.error('[revenueService.listRevenueEvents] Error:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================
// Stage Summary
// ============================================

export async function getStageSummary(
  tenantId: string,
  options?: DateRange & { cohortId?: string }
): Promise<ServiceResult<StageSummary[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_stage_revenue_daily')
      .select('stage, channel, revenue, refunds, net_revenue, conversions, avg_order_value, date')
      .eq('tenant_id', tenantId);

    if (options?.from) {
      query = query.gte('date', options.from);
    }
    if (options?.to) {
      query = query.lte('date', options.to);
    }
    if (options?.cohortId) {
      query = query.eq('cohort_id', options.cohortId);
    }

    const { data, error } = await query;

    if (error) {
throw error;
}

    // Aggregate by stage
    const byStage: Record<string, { revenue: number; conversions: number; orders: number }> = {};

    for (const row of data || []) {
      const key = row.stage || 'unknown';
      if (!byStage[key]) {
        byStage[key] = { revenue: 0, conversions: 0, orders: 0 };
      }
      byStage[key].revenue += Number(row.net_revenue || row.revenue || 0);
      byStage[key].conversions += Number(row.conversions || 0);
      byStage[key].orders += row.avg_order_value ? 1 : 0;
    }

    const totalRevenue = Object.values(byStage).reduce((sum, s) => sum + s.revenue, 0);

    const summaries: StageSummary[] = Object.entries(byStage).map(([stage, stats]) => ({
      stage,
      revenue: stats.revenue,
      conversions: stats.conversions,
      avgOrderValue: stats.conversions > 0 ? stats.revenue / stats.conversions : 0,
      percentOfTotal: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0,
    }));

    // Sort by revenue descending
    summaries.sort((a, b) => b.revenue - a.revenue);

    return { data: summaries, error: null };
  } catch (error) {
    console.error('[revenueService.getStageSummary] Error:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================
// Channel Attribution
// ============================================

export async function getChannelAttribution(
  tenantId: string,
  options?: DateRange
): Promise<ServiceResult<ChannelAttribution[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_channel_attribution')
      .select('*')
      .eq('tenant_id', tenantId);

    if (options?.from) {
      query = query.gte('period_start', options.from);
    }
    if (options?.to) {
      query = query.lte('period_end', options.to);
    }

    const { data, error } = await query;

    if (error) {
throw error;
}

    // Aggregate by channel
    const byChannel: Record<string, ChannelAttribution> = {};

    for (const row of data || []) {
      const ch = row.channel;
      if (!byChannel[ch]) {
        byChannel[ch] = {
          channel: ch,
          totalRevenue: 0,
          totalConversions: 0,
          firstTouchConversions: 0,
          lastTouchConversions: 0,
          assistedConversions: 0,
          cost: 0,
          roas: null,
          cac: null,
        };
      }
      byChannel[ch].totalRevenue += Number(row.total_revenue || 0);
      byChannel[ch].totalConversions += Number(row.total_conversions || 0);
      byChannel[ch].firstTouchConversions += Number(row.first_touch_conversions || 0);
      byChannel[ch].lastTouchConversions += Number(row.last_touch_conversions || 0);
      byChannel[ch].assistedConversions += Number(row.assisted_conversions || 0);
      byChannel[ch].cost += Number(row.cost || 0);
    }

    // Calculate ROAS and CAC
    const attributions = Object.values(byChannel).map((attr) => {
      if (attr.cost > 0) {
        attr.roas = attr.totalRevenue / attr.cost;
        attr.cac = attr.totalConversions > 0 ? attr.cost / attr.totalConversions : null;
      }
      return attr;
    });

    // Sort by revenue
    attributions.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return { data: attributions, error: null };
  } catch (error) {
    console.error('[revenueService.getChannelAttribution] Error:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================
// Overall Stats
// ============================================

export async function getRevenueStats(
  tenantId: string,
  options?: DateRange
): Promise<ServiceResult<{
  totalRevenue: number;
  totalConversions: number;
  avgOrderValue: number;
  topStage: string | null;
  topChannel: string | null;
}>> {
  try {
    const [stageResult, eventsResult] = await Promise.all([
      getStageSummary(tenantId, options),
      listRevenueEvents(tenantId, { ...options, limit: 1000 }),
    ]);

    if (stageResult.error) {
throw stageResult.error;
}

    const stages = stageResult.data || [];
    const events = eventsResult.data || [];

    const totalRevenue = stages.reduce((sum, s) => sum + s.revenue, 0);
    const totalConversions = stages.reduce((sum, s) => sum + s.conversions, 0);

    // Count channels
    const channelCounts: Record<string, number> = {};
    for (const event of events) {
      channelCounts[event.channel] = (channelCounts[event.channel] || 0) + event.amount;
    }

    const topChannel = Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topStage = stages[0]?.stage || null;

    return {
      data: {
        totalRevenue,
        totalConversions,
        avgOrderValue: totalConversions > 0 ? totalRevenue / totalConversions : 0,
        topStage,
        topChannel,
      },
      error: null,
    };
  } catch (error) {
    console.error('[revenueService.getRevenueStats] Error:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================
// Helpers
// ============================================

async function updateDailyAggregates(
  tenantId: string,
  date: string,
  stage: string,
  channel: string,
  revenue: number,
  refund: number
): Promise<void> {
  try {
    // Check if exists
    const { data: existing } = await supabaseAdmin
      .from('synthex_stage_revenue_daily')
      .select('id, revenue, refunds, net_revenue, conversions')
      .eq('tenant_id', tenantId)
      .eq('date', date)
      .eq('stage', stage)
      .eq('channel', channel)
      .single();

    if (existing) {
      // Update existing
      const newRevenue = Number(existing.revenue) + revenue;
      const newRefunds = Number(existing.refunds) + refund;
      const newConversions = Number(existing.conversions) + 1;

      await supabaseAdmin
        .from('synthex_stage_revenue_daily')
        .update({
          revenue: newRevenue,
          refunds: newRefunds,
          net_revenue: newRevenue - newRefunds,
          conversions: newConversions,
          avg_order_value: newConversions > 0 ? (newRevenue - newRefunds) / newConversions : 0,
        })
        .eq('id', existing.id);
    } else {
      // Insert new
      await supabaseAdmin.from('synthex_stage_revenue_daily').insert({
        tenant_id: tenantId,
        date,
        stage,
        channel,
        revenue,
        refunds: refund,
        net_revenue: revenue - refund,
        conversions: 1,
        avg_order_value: revenue - refund,
      });
    }
  } catch (error) {
    console.error('[revenueService.updateDailyAggregates] Error:', error);
    // Don't throw - this is a background update
  }
}

function mapEventFromDb(row: Record<string, unknown>): RevenueEvent {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    contactId: row.contact_id as string | null,
    campaignId: row.campaign_id as string | null,
    journeyId: row.journey_id as string | null,
    channel: row.channel as Channel,
    stage: row.stage as JourneyStage | null,
    touchpointType: row.touchpoint_type as TouchpointType | null,
    amount: Number(row.amount),
    currency: row.currency as string,
    eventType: row.event_type as EventType,
    orderId: row.order_id as string | null,
    productSku: row.product_sku as string | null,
    productName: row.product_name as string | null,
    quantity: row.quantity as number,
    metadata: row.metadata as Record<string, unknown>,
    occurredAt: row.occurred_at as string,
    createdAt: row.created_at as string,
  };
}
