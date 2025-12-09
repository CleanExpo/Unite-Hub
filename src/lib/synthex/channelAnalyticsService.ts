/**
 * Channel Analytics Service for Synthex
 * Phase: B8 - Real-Time Channel Analytics + Multi-Channel Dashboard
 *
 * Provides real-time channel event tracking and daily analytics aggregation.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// Types
export type ChannelType = 'email' | 'sms' | 'social' | 'push' | 'webhook' | 'web' | 'other';
export type ChannelEventType = 'send' | 'delivery' | 'open' | 'click' | 'conversion' | 'bounce' | 'unsubscribe' | 'complaint' | 'reply';

export interface ChannelEvent {
  tenantId: string;
  brandId?: string;
  campaignId?: string;
  channel: ChannelType;
  eventType: ChannelEventType;
  count?: number;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}

export interface DailySummary {
  stats_date: string;
  channel: string;
  sends: number;
  deliveries: number;
  opens: number;
  clicks: number;
  conversions: number;
  bounces: number;
}

export interface ChannelTotals {
  channel: string;
  total_events: number;
  total_sends: number;
  total_opens: number;
  total_clicks: number;
  total_conversions: number;
}

export interface ChannelDailyStats {
  id: string;
  tenant_id: string;
  brand_id: string | null;
  stats_date: string;
  channel: string;
  sends: number;
  deliveries: number;
  opens: number;
  clicks: number;
  conversions: number;
  bounces: number;
  unsubscribes: number;
  complaints: number;
  replies: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  bounce_rate: number;
  total_revenue: number;
}

/**
 * Record a channel event
 */
export async function recordChannelEvent(
  event: ChannelEvent
): Promise<{ data: { id: string } | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_channel_events')
      .insert({
        tenant_id: event.tenantId,
        brand_id: event.brandId || null,
        campaign_id: event.campaignId || null,
        channel: event.channel,
        event_type: event.eventType,
        count: event.count || 1,
        metadata: event.metadata || {},
        occurred_at: event.occurredAt?.toISOString() || new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
throw new Error(error.message);
}
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Record multiple channel events in batch
 */
export async function recordChannelEvents(
  events: ChannelEvent[]
): Promise<{ data: { count: number } | null; error: Error | null }> {
  try {
    const rows = events.map((event) => ({
      tenant_id: event.tenantId,
      brand_id: event.brandId || null,
      campaign_id: event.campaignId || null,
      channel: event.channel,
      event_type: event.eventType,
      count: event.count || 1,
      metadata: event.metadata || {},
      occurred_at: event.occurredAt?.toISOString() || new Date().toISOString(),
    }));

    const { data, error } = await supabaseAdmin
      .from('synthex_channel_events')
      .insert(rows)
      .select('id');

    if (error) {
throw new Error(error.message);
}
    return { data: { count: data?.length || 0 }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get raw channel events for a tenant
 */
export async function getChannelEvents(
  tenantId: string,
  options: {
    channel?: ChannelType;
    eventType?: ChannelEventType;
    days?: number;
    limit?: number;
  } = {}
): Promise<{ data: Array<Record<string, unknown>> | null; error: Error | null }> {
  try {
    const days = options.days || 30;
    const limit = options.limit || 1000;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabaseAdmin
      .from('synthex_channel_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('occurred_at', startDate.toISOString())
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (options.channel) {
      query = query.eq('channel', options.channel);
    }

    if (options.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    const { data, error } = await query;
    if (error) {
throw new Error(error.message);
}
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get daily channel summary using the SQL function
 */
export async function getDailySummary(
  tenantId: string,
  days: number = 30
): Promise<{ data: DailySummary[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin.rpc('synthex_daily_channel_summary', {
      p_tenant_id: tenantId,
      p_days: days,
    });

    if (error) {
throw new Error(error.message);
}
    return { data: data as DailySummary[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get channel totals using the SQL function
 */
export async function getChannelTotals(
  tenantId: string,
  days: number = 30
): Promise<{ data: ChannelTotals[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin.rpc('synthex_channel_totals', {
      p_tenant_id: tenantId,
      p_days: days,
    });

    if (error) {
throw new Error(error.message);
}
    return { data: data as ChannelTotals[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get pre-aggregated daily stats from the daily stats table
 */
export async function getDailyStats(
  tenantId: string,
  options: {
    channel?: ChannelType;
    days?: number;
  } = {}
): Promise<{ data: ChannelDailyStats[] | null; error: Error | null }> {
  try {
    const days = options.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabaseAdmin
      .from('synthex_channel_daily_stats')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('stats_date', startDate.toISOString().split('T')[0])
      .order('stats_date', { ascending: true });

    if (options.channel) {
      query = query.eq('channel', options.channel);
    }

    const { data, error } = await query;
    if (error) {
throw new Error(error.message);
}
    return { data: data as ChannelDailyStats[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Transform daily summary for chart display (pivots data by channel)
 */
export function transformForLineChart(
  summary: DailySummary[]
): Array<{
  date: string;
  email: number;
  sms: number;
  social: number;
  push: number;
  web: number;
}> {
  // Group by date
  const byDate = new Map<string, Record<string, number>>();

  for (const row of summary) {
    const existing = byDate.get(row.stats_date) || {
      email: 0,
      sms: 0,
      social: 0,
      push: 0,
      web: 0,
      webhook: 0,
      other: 0,
    };
    existing[row.channel] = row.sends + row.opens + row.clicks;
    byDate.set(row.stats_date, existing);
  }

  // Convert to array
  return Array.from(byDate.entries())
    .map(([date, channels]) => ({
      date,
      email: channels.email || 0,
      sms: channels.sms || 0,
      social: channels.social || 0,
      push: channels.push || 0,
      web: channels.web || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Transform channel totals for bar chart display
 */
export function transformForBarChart(
  totals: ChannelTotals[]
): Array<{
  channel: string;
  total: number;
  sends: number;
  opens: number;
  clicks: number;
  conversions: number;
}> {
  return totals.map((t) => ({
    channel: t.channel.charAt(0).toUpperCase() + t.channel.slice(1),
    total: Number(t.total_events),
    sends: Number(t.total_sends),
    opens: Number(t.total_opens),
    clicks: Number(t.total_clicks),
    conversions: Number(t.total_conversions),
  }));
}

/**
 * Get real-time analytics overview
 */
export async function getRealTimeOverview(
  tenantId: string,
  options: { days?: number } = {}
): Promise<{
  data: {
    dailySummary: DailySummary[];
    channelTotals: ChannelTotals[];
    lineChartData: ReturnType<typeof transformForLineChart>;
    barChartData: ReturnType<typeof transformForBarChart>;
  } | null;
  error: Error | null;
}> {
  try {
    const days = options.days || 30;

    // Fetch both summaries in parallel
    const [summaryResult, totalsResult] = await Promise.all([
      getDailySummary(tenantId, days),
      getChannelTotals(tenantId, days),
    ]);

    if (summaryResult.error) {
throw summaryResult.error;
}
    if (totalsResult.error) {
throw totalsResult.error;
}

    const dailySummary = summaryResult.data || [];
    const channelTotals = totalsResult.data || [];

    return {
      data: {
        dailySummary,
        channelTotals,
        lineChartData: transformForLineChart(dailySummary),
        barChartData: transformForBarChart(channelTotals),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Trigger daily stats aggregation (for manual runs or testing)
 */
export async function triggerDailyAggregation(
  date?: Date
): Promise<{ data: { count: number } | null; error: Error | null }> {
  try {
    const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin.rpc('synthex_aggregate_daily_stats', {
      p_date: dateStr,
    });

    if (error) {
throw new Error(error.message);
}
    return { data: { count: data as number }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}
