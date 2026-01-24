/**
 * Analytics Engine for Synthex
 * Phase: B7 - Synthex Advanced Analytics + Attribution Engine
 *
 * Combines data from delivery, attribution, and engagement for comprehensive analytics.
 * Uses Claude for AI-powered insights generation.
 *
 * @deprecated MIGRATING TO STANDALONE SYNTHEX
 * This service is being extracted to: github.com/CleanExpo/Synthex
 * New location: lib/services/analytics/analyticsEngine.ts
 *
 * DO NOT add new features here. All new development should happen in Synthex repo.
 * This file will be removed once Unite-Hub fully delegates to Synthex via webhooks.
 *
 * Migration date: 2026-01-24
 * Target removal: After Synthex V1 launch
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getEngagementSummary } from './attributionService';

// Lazy-load Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

// Types
export interface CombinedAnalytics {
  deliveries: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    byChannel: Record<string, number>;
  };
  attribution: {
    total: number;
    byEventType: Record<string, number>;
    byChannel: Record<string, number>;
    totalRevenue: number;
  };
  engagement: {
    cold: number;
    warming: number;
    warm: number;
    hot: number;
    champion: number;
    total: number;
  };
  campaigns: {
    active: number;
    completed: number;
    scheduled: number;
    total: number;
  };
}

export interface AnalyticsInsight {
  type: 'opportunity' | 'warning' | 'pattern' | 'recommendation' | 'trend';
  category: 'delivery' | 'engagement' | 'campaign' | 'revenue' | 'channel';
  title: string;
  description: string;
  priority: number;
  confidence: number;
  actionItems?: string[];
  metrics?: Record<string, number>;
}

/**
 * Get combined analytics for a tenant
 */
export async function getCombinedAnalytics(
  tenantId: string,
  options: { days?: number } = {}
): Promise<{ data: CombinedAnalytics | null; error: Error | null }> {
  try {
    const days = options.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Fetch delivery stats
    const { data: deliveryData } = await supabaseAdmin
      .from('synthex_delivery_log')
      .select('status, channel')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDateStr);

    // Fetch attribution events
    const { data: attributionData } = await supabaseAdmin
      .from('synthex_attribution')
      .select('event_type, channel, revenue')
      .eq('tenant_id', tenantId)
      .gte('occurred_at', startDateStr);

    // Fetch engagement summary
    const { data: engagementData } = await getEngagementSummary(tenantId);

    // Fetch campaign stats
    const { data: campaignData } = await supabaseAdmin
      .from('synthex_campaigns')
      .select('status')
      .eq('tenant_id', tenantId);

    // Process delivery data
    const deliveries = {
      total: deliveryData?.length || 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      byChannel: {} as Record<string, number>,
    };

    for (const d of deliveryData || []) {
      if (d.status === 'sent' || d.status === 'delivered') {
deliveries.sent++;
}
      if (d.status === 'delivered') {
deliveries.delivered++;
}
      if (d.status === 'opened') {
deliveries.opened++;
}
      if (d.status === 'clicked') {
deliveries.clicked++;
}
      if (d.status === 'failed' || d.status === 'bounced') {
deliveries.failed++;
}
      deliveries.byChannel[d.channel] = (deliveries.byChannel[d.channel] || 0) + 1;
    }

    // Process attribution data
    const attribution = {
      total: attributionData?.length || 0,
      byEventType: {} as Record<string, number>,
      byChannel: {} as Record<string, number>,
      totalRevenue: 0,
    };

    for (const a of attributionData || []) {
      attribution.byEventType[a.event_type] = (attribution.byEventType[a.event_type] || 0) + 1;
      attribution.byChannel[a.channel] = (attribution.byChannel[a.channel] || 0) + 1;
      attribution.totalRevenue += a.revenue || 0;
    }

    // Process campaign data
    const campaigns = {
      active: 0,
      completed: 0,
      scheduled: 0,
      total: campaignData?.length || 0,
    };

    for (const c of campaignData || []) {
      if (c.status === 'active') {
campaigns.active++;
}
      if (c.status === 'completed') {
campaigns.completed++;
}
      if (c.status === 'scheduled') {
campaigns.scheduled++;
}
    }

    return {
      data: {
        deliveries,
        attribution,
        engagement: engagementData || {
          cold: 0,
          warming: 0,
          warm: 0,
          hot: 0,
          champion: 0,
          total: 0,
        },
        campaigns,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Generate AI-powered insights from analytics data
 */
export async function generateAnalyticsInsights(
  tenantId: string,
  analyticsData?: CombinedAnalytics
): Promise<{ data: AnalyticsInsight[] | null; error: Error | null }> {
  try {
    // Get analytics data if not provided
    let data = analyticsData;
    if (!data) {
      const result = await getCombinedAnalytics(tenantId);
      if (result.error || !result.data) {
        throw result.error || new Error('Failed to get analytics data');
      }
      data = result.data;
    }

    const prompt = `Analyze this marketing analytics data and identify patterns, opportunities, warnings, and recommendations. Return a JSON array of insights.

DATA:
${JSON.stringify(data, null, 2)}

Return ONLY a valid JSON array with insights in this format:
[
  {
    "type": "opportunity" | "warning" | "pattern" | "recommendation" | "trend",
    "category": "delivery" | "engagement" | "campaign" | "revenue" | "channel",
    "title": "Short title",
    "description": "Detailed description",
    "priority": 1-5 (1=highest),
    "confidence": 0.0-1.0,
    "actionItems": ["action 1", "action 2"],
    "metrics": {"key": value}
  }
]

Focus on:
1. Delivery performance issues (high bounce/fail rates)
2. Engagement opportunities (cold contacts that could be warmed)
3. Revenue patterns (which channels drive most revenue)
4. Campaign effectiveness (active vs completed campaigns)
5. Channel performance comparisons

Generate 3-5 actionable insights. Return ONLY the JSON array, no other text.`;

    const completion = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = completion.content[0].type === 'text'
      ? completion.content[0].text
      : '';

    // Parse the JSON response
    const insights = JSON.parse(responseText) as AnalyticsInsight[];

    return { data: insights, error: null };
  } catch (err) {
    console.error('[AnalyticsEngine] Error generating insights:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get campaign performance over time
 */
export async function getCampaignPerformance(
  campaignId: string,
  options: { days?: number } = {}
): Promise<{
  data: Array<{
    date: string;
    impressions: number;
    opens: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }> | null;
  error: Error | null;
}> {
  try {
    const days = options.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from('synthex_campaign_performance')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('perf_date', startDate.toISOString().split('T')[0])
      .order('perf_date', { ascending: true });

    if (error) {
throw new Error(error.message);
}

    const result = (data || []).map((row) => ({
      date: row.perf_date,
      impressions: row.impressions || 0,
      opens: row.opens || 0,
      clicks: row.clicks || 0,
      conversions: row.conversions || 0,
      revenue: row.total_revenue || 0,
    }));

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Update campaign performance metrics for today
 */
export async function updateCampaignPerformance(
  tenantId: string,
  campaignId: string,
  metrics: {
    impressions?: number;
    opens?: number;
    clicks?: number;
    conversions?: number;
    unsubscribes?: number;
    bounces?: number;
    revenue?: number;
  }
): Promise<{ error: Error | null }> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if record exists
    const { data: existing } = await supabaseAdmin
      .from('synthex_campaign_performance')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('perf_date', today)
      .single();

    if (existing) {
      // Update existing
      const updates: Record<string, number> = {};
      if (metrics.impressions) {
updates.impressions = (existing.impressions || 0) + metrics.impressions;
}
      if (metrics.opens) {
updates.opens = (existing.opens || 0) + metrics.opens;
}
      if (metrics.clicks) {
updates.clicks = (existing.clicks || 0) + metrics.clicks;
}
      if (metrics.conversions) {
updates.conversions = (existing.conversions || 0) + metrics.conversions;
}
      if (metrics.unsubscribes) {
updates.unsubscribes = (existing.unsubscribes || 0) + metrics.unsubscribes;
}
      if (metrics.bounces) {
updates.bounces = (existing.bounces || 0) + metrics.bounces;
}
      if (metrics.revenue) {
updates.total_revenue = (existing.total_revenue || 0) + metrics.revenue;
}

      // Calculate rates
      const totalSent = (existing.impressions || 0) + (metrics.impressions || 0);
      if (totalSent > 0) {
        updates.open_rate = ((updates.opens || existing.opens || 0) / totalSent) * 100;
        updates.click_rate = ((updates.clicks || existing.clicks || 0) / totalSent) * 100;
        updates.conversion_rate = ((updates.conversions || existing.conversions || 0) / totalSent) * 100;
        updates.bounce_rate = ((updates.bounces || existing.bounces || 0) / totalSent) * 100;
      }

      await supabaseAdmin
        .from('synthex_campaign_performance')
        .update(updates)
        .eq('id', existing.id);
    } else {
      // Insert new
      const totalSent = metrics.impressions || 0;
      await supabaseAdmin.from('synthex_campaign_performance').insert({
        tenant_id: tenantId,
        campaign_id: campaignId,
        perf_date: today,
        impressions: metrics.impressions || 0,
        opens: metrics.opens || 0,
        clicks: metrics.clicks || 0,
        conversions: metrics.conversions || 0,
        unsubscribes: metrics.unsubscribes || 0,
        bounces: metrics.bounces || 0,
        total_revenue: metrics.revenue || 0,
        open_rate: totalSent > 0 ? ((metrics.opens || 0) / totalSent) * 100 : 0,
        click_rate: totalSent > 0 ? ((metrics.clicks || 0) / totalSent) * 100 : 0,
        conversion_rate: totalSent > 0 ? ((metrics.conversions || 0) / totalSent) * 100 : 0,
        bounce_rate: totalSent > 0 ? ((metrics.bounces || 0) / totalSent) * 100 : 0,
      });
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get top performing campaigns
 */
export async function getTopCampaigns(
  tenantId: string,
  options: { limit?: number; metric?: 'opens' | 'clicks' | 'conversions' | 'revenue' } = {}
): Promise<{
  data: Array<{
    campaignId: string;
    campaignName: string;
    totalOpens: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    openRate: number;
    clickRate: number;
  }> | null;
  error: Error | null;
}> {
  try {
    const limit = options.limit || 10;
    const metric = options.metric || 'clicks';

    const orderColumn = {
      opens: 'opens',
      clicks: 'clicks',
      conversions: 'conversions',
      revenue: 'total_revenue',
    }[metric];

    const { data, error } = await supabaseAdmin
      .from('synthex_campaign_performance')
      .select(`
        campaign_id,
        impressions,
        opens,
        clicks,
        conversions,
        total_revenue,
        open_rate,
        click_rate,
        campaign:synthex_campaigns(name)
      `)
      .eq('tenant_id', tenantId)
      .order(orderColumn, { ascending: false })
      .limit(limit);

    if (error) {
throw new Error(error.message);
}

    // Aggregate by campaign
    const campaignMap = new Map<string, {
      campaignId: string;
      campaignName: string;
      totalOpens: number;
      totalClicks: number;
      totalConversions: number;
      totalRevenue: number;
      totalImpressions: number;
    }>();

    for (const row of data || []) {
      const existing = campaignMap.get(row.campaign_id) || {
        campaignId: row.campaign_id,
        campaignName: (row.campaign as { name: string })?.name || 'Unknown',
        totalOpens: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        totalImpressions: 0,
      };

      existing.totalOpens += row.opens || 0;
      existing.totalClicks += row.clicks || 0;
      existing.totalConversions += row.conversions || 0;
      existing.totalRevenue += row.total_revenue || 0;
      existing.totalImpressions += row.impressions || 0;

      campaignMap.set(row.campaign_id, existing);
    }

    const result = Array.from(campaignMap.values()).map((c) => ({
      ...c,
      openRate: c.totalImpressions > 0 ? (c.totalOpens / c.totalImpressions) * 100 : 0,
      clickRate: c.totalImpressions > 0 ? (c.totalClicks / c.totalImpressions) * 100 : 0,
    }));

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get channel comparison analytics
 */
export async function getChannelComparison(
  tenantId: string,
  options: { days?: number } = {}
): Promise<{
  data: Record<string, {
    events: number;
    revenue: number;
    conversions: number;
    engagementScore: number;
  }> | null;
  error: Error | null;
}> {
  try {
    const days = options.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from('synthex_attribution')
      .select('channel, event_type, revenue')
      .eq('tenant_id', tenantId)
      .gte('occurred_at', startDate.toISOString());

    if (error) {
throw new Error(error.message);
}

    const channels: Record<string, {
      events: number;
      revenue: number;
      conversions: number;
      engagementScore: number;
    }> = {};

    for (const event of data || []) {
      if (!channels[event.channel]) {
        channels[event.channel] = {
          events: 0,
          revenue: 0,
          conversions: 0,
          engagementScore: 0,
        };
      }

      channels[event.channel].events++;
      channels[event.channel].revenue += event.revenue || 0;
      if (event.event_type === 'conversion') {
        channels[event.channel].conversions++;
      }
      // Simple engagement scoring based on event type
      const eventScore = {
        impression: 1,
        open: 3,
        click: 5,
        conversion: 20,
        reply: 10,
        unsubscribe: -10,
        bounce: -5,
      }[event.event_type] || 1;
      channels[event.channel].engagementScore += eventScore;
    }

    return { data: channels, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}
