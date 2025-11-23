/**
 * Creative Performance Signals
 * Phase 70: Read real performance data and normalize into per-asset/campaign metrics
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface CreativePerformanceMetrics {
  asset_id: string;
  campaign_id: string;
  method_id: string;
  channel: string;
  impressions: number | null;
  engagement_rate: number | null;
  click_through_rate: number | null;
  completion_rate: number | null;
  saves: number | null;
  shares: number | null;
  comments: number | null;
  data_quality: 'sufficient' | 'partial' | 'insufficient_data';
  last_updated: string;
}

export interface CampaignPerformanceSummary {
  campaign_id: string;
  campaign_name: string;
  total_assets: number;
  active_channels: string[];
  overall_engagement_rate: number | null;
  overall_ctr: number | null;
  top_performing_asset: string | null;
  underperforming_assets: string[];
  data_quality: 'sufficient' | 'partial' | 'insufficient_data';
  period_start: string;
  period_end: string;
}

export interface ChannelPerformanceSnapshot {
  channel: string;
  impressions: number;
  engagement_rate: number | null;
  ctr: number | null;
  asset_count: number;
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
}

export interface MethodPerformanceRecord {
  method_id: string;
  usage_count: number;
  avg_engagement_rate: number | null;
  avg_ctr: number | null;
  best_channel: string | null;
  worst_channel: string | null;
  last_used: string | null;
}

/**
 * Fetch performance metrics for a specific asset
 */
export async function getAssetPerformanceMetrics(
  assetId: string,
  workspaceId: string
): Promise<CreativePerformanceMetrics | null> {
  const supabase = await getSupabaseServer();

  // Query from existing performance/engagement tables
  const { data: engagementData } = await supabase
    .from('engagement_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('asset_id', assetId);

  const { data: productionData } = await supabase
    .from('production_jobs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('asset_id', assetId)
    .single();

  if (!engagementData || engagementData.length === 0) {
    return {
      asset_id: assetId,
      campaign_id: productionData?.campaign_id || 'unknown',
      method_id: productionData?.method_id || 'unknown',
      channel: productionData?.channel || 'unknown',
      impressions: null,
      engagement_rate: null,
      click_through_rate: null,
      completion_rate: null,
      saves: null,
      shares: null,
      comments: null,
      data_quality: 'insufficient_data',
      last_updated: new Date().toISOString(),
    };
  }

  // Aggregate engagement events
  const metrics = aggregateEngagementEvents(engagementData);

  return {
    asset_id: assetId,
    campaign_id: productionData?.campaign_id || 'unknown',
    method_id: productionData?.method_id || 'unknown',
    channel: productionData?.channel || 'unknown',
    ...metrics,
    data_quality: calculateDataQuality(metrics),
    last_updated: new Date().toISOString(),
  };
}

/**
 * Fetch performance summary for a campaign
 */
export async function getCampaignPerformanceSummary(
  campaignId: string,
  workspaceId: string
): Promise<CampaignPerformanceSummary | null> {
  const supabase = await getSupabaseServer();

  // Get campaign info
  const { data: campaign } = await supabase
    .from('visual_campaigns')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return null;
  }

  // Get all assets for campaign
  const { data: assets } = await supabase
    .from('production_jobs')
    .select('asset_id, channel, method_id')
    .eq('workspace_id', workspaceId)
    .eq('campaign_id', campaignId);

  if (!assets || assets.length === 0) {
    return {
      campaign_id: campaignId,
      campaign_name: campaign.name || 'Unknown',
      total_assets: 0,
      active_channels: [],
      overall_engagement_rate: null,
      overall_ctr: null,
      top_performing_asset: null,
      underperforming_assets: [],
      data_quality: 'insufficient_data',
      period_start: campaign.created_at,
      period_end: new Date().toISOString(),
    };
  }

  // Get engagement data for all assets
  const assetIds = assets.map(a => a.asset_id);
  const { data: engagementData } = await supabase
    .from('engagement_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('asset_id', assetIds);

  // Aggregate by asset
  const assetMetrics = aggregateByAsset(engagementData || [], assets);
  const channels = [...new Set(assets.map(a => a.channel))];

  // Find top and underperforming
  const sorted = Object.entries(assetMetrics)
    .filter(([_, m]) => m.engagement_rate !== null)
    .sort((a, b) => (b[1].engagement_rate || 0) - (a[1].engagement_rate || 0));

  const topPerforming = sorted[0]?.[0] || null;
  const underperforming = sorted
    .filter(([_, m]) => (m.engagement_rate || 0) < 0.02)
    .map(([id]) => id);

  // Calculate overall metrics
  const totalImpressions = Object.values(assetMetrics)
    .reduce((sum, m) => sum + (m.impressions || 0), 0);
  const totalEngagements = Object.values(assetMetrics)
    .reduce((sum, m) => sum + (m.engagements || 0), 0);
  const totalClicks = Object.values(assetMetrics)
    .reduce((sum, m) => sum + (m.clicks || 0), 0);

  return {
    campaign_id: campaignId,
    campaign_name: campaign.name || 'Unknown',
    total_assets: assets.length,
    active_channels: channels,
    overall_engagement_rate: totalImpressions > 0
      ? totalEngagements / totalImpressions
      : null,
    overall_ctr: totalImpressions > 0
      ? totalClicks / totalImpressions
      : null,
    top_performing_asset: topPerforming,
    underperforming_assets: underperforming,
    data_quality: totalImpressions > 100 ? 'sufficient' : 'partial',
    period_start: campaign.created_at,
    period_end: new Date().toISOString(),
  };
}

/**
 * Get performance snapshot for all channels
 */
export async function getChannelPerformanceSnapshots(
  workspaceId: string,
  daysBack: number = 30
): Promise<ChannelPerformanceSnapshot[]> {
  const supabase = await getSupabaseServer();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const { data: engagementData } = await supabase
    .from('engagement_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('created_at', startDate.toISOString());

  if (!engagementData || engagementData.length === 0) {
    return [];
  }

  // Group by channel
  const byChannel = new Map<string, any[]>();
  for (const event of engagementData) {
    const channel = event.channel || 'unknown';
    if (!byChannel.has(channel)) {
      byChannel.set(channel, []);
    }
    byChannel.get(channel)!.push(event);
  }

  const snapshots: ChannelPerformanceSnapshot[] = [];

  for (const [channel, events] of byChannel) {
    const impressions = events.filter(e => e.event_type === 'impression').length;
    const engagements = events.filter(e =>
      ['like', 'comment', 'share', 'save'].includes(e.event_type)
    ).length;
    const clicks = events.filter(e => e.event_type === 'click').length;

    snapshots.push({
      channel,
      impressions,
      engagement_rate: impressions > 0 ? engagements / impressions : null,
      ctr: impressions > 0 ? clicks / impressions : null,
      asset_count: new Set(events.map(e => e.asset_id)).size,
      trend: calculateTrend(events, daysBack),
    });
  }

  return snapshots.sort((a, b) => b.impressions - a.impressions);
}

/**
 * Get performance records for methods
 */
export async function getMethodPerformanceRecords(
  workspaceId: string
): Promise<MethodPerformanceRecord[]> {
  const supabase = await getSupabaseServer();

  // Get all production jobs with their methods
  const { data: jobs } = await supabase
    .from('production_jobs')
    .select('asset_id, method_id, channel, created_at')
    .eq('workspace_id', workspaceId);

  if (!jobs || jobs.length === 0) {
    return [];
  }

  // Get engagement for all assets
  const assetIds = jobs.map(j => j.asset_id);
  const { data: engagementData } = await supabase
    .from('engagement_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('asset_id', assetIds);

  // Group by method
  const byMethod = new Map<string, { jobs: any[]; events: any[] }>();

  for (const job of jobs) {
    if (!byMethod.has(job.method_id)) {
      byMethod.set(job.method_id, { jobs: [], events: [] });
    }
    byMethod.get(job.method_id)!.jobs.push(job);
  }

  for (const event of engagementData || []) {
    const job = jobs.find(j => j.asset_id === event.asset_id);
    if (job && byMethod.has(job.method_id)) {
      byMethod.get(job.method_id)!.events.push({ ...event, channel: job.channel });
    }
  }

  // Calculate metrics per method
  const records: MethodPerformanceRecord[] = [];

  for (const [methodId, data] of byMethod) {
    const { jobs: methodJobs, events } = data;

    // Calculate per-channel performance
    const channelPerf = new Map<string, { impressions: number; engagements: number; clicks: number }>();

    for (const event of events) {
      const channel = event.channel || 'unknown';
      if (!channelPerf.has(channel)) {
        channelPerf.set(channel, { impressions: 0, engagements: 0, clicks: 0 });
      }
      const perf = channelPerf.get(channel)!;

      if (event.event_type === 'impression') perf.impressions++;
      if (['like', 'comment', 'share', 'save'].includes(event.event_type)) perf.engagements++;
      if (event.event_type === 'click') perf.clicks++;
    }

    // Find best and worst channels
    let bestChannel: string | null = null;
    let worstChannel: string | null = null;
    let bestRate = -1;
    let worstRate = Infinity;

    for (const [channel, perf] of channelPerf) {
      if (perf.impressions > 10) {
        const rate = perf.engagements / perf.impressions;
        if (rate > bestRate) {
          bestRate = rate;
          bestChannel = channel;
        }
        if (rate < worstRate) {
          worstRate = rate;
          worstChannel = channel;
        }
      }
    }

    // Calculate overall metrics
    const totalImpressions = events.filter(e => e.event_type === 'impression').length;
    const totalEngagements = events.filter(e =>
      ['like', 'comment', 'share', 'save'].includes(e.event_type)
    ).length;
    const totalClicks = events.filter(e => e.event_type === 'click').length;

    const lastJob = methodJobs.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    records.push({
      method_id: methodId,
      usage_count: methodJobs.length,
      avg_engagement_rate: totalImpressions > 0
        ? totalEngagements / totalImpressions
        : null,
      avg_ctr: totalImpressions > 0
        ? totalClicks / totalImpressions
        : null,
      best_channel: bestChannel,
      worst_channel: worstChannel,
      last_used: lastJob?.created_at || null,
    });
  }

  return records.sort((a, b) => b.usage_count - a.usage_count);
}

// Helper functions

function aggregateEngagementEvents(events: any[]): Partial<CreativePerformanceMetrics> {
  const impressions = events.filter(e => e.event_type === 'impression').length;
  const engagements = events.filter(e =>
    ['like', 'comment', 'share', 'save'].includes(e.event_type)
  ).length;
  const clicks = events.filter(e => e.event_type === 'click').length;
  const saves = events.filter(e => e.event_type === 'save').length;
  const shares = events.filter(e => e.event_type === 'share').length;
  const comments = events.filter(e => e.event_type === 'comment').length;
  const completions = events.filter(e => e.event_type === 'completion').length;
  const starts = events.filter(e => e.event_type === 'start').length;

  return {
    impressions: impressions || null,
    engagement_rate: impressions > 0 ? engagements / impressions : null,
    click_through_rate: impressions > 0 ? clicks / impressions : null,
    completion_rate: starts > 0 ? completions / starts : null,
    saves: saves || null,
    shares: shares || null,
    comments: comments || null,
  };
}

function aggregateByAsset(events: any[], assets: any[]): Record<string, any> {
  const result: Record<string, any> = {};

  for (const asset of assets) {
    const assetEvents = events.filter(e => e.asset_id === asset.asset_id);
    const impressions = assetEvents.filter(e => e.event_type === 'impression').length;
    const engagements = assetEvents.filter(e =>
      ['like', 'comment', 'share', 'save'].includes(e.event_type)
    ).length;
    const clicks = assetEvents.filter(e => e.event_type === 'click').length;

    result[asset.asset_id] = {
      impressions,
      engagements,
      clicks,
      engagement_rate: impressions > 0 ? engagements / impressions : null,
    };
  }

  return result;
}

function calculateDataQuality(metrics: Partial<CreativePerformanceMetrics>): 'sufficient' | 'partial' | 'insufficient_data' {
  const hasImpressions = (metrics.impressions || 0) > 0;
  const hasEngagement = metrics.engagement_rate !== null;
  const hasCtr = metrics.click_through_rate !== null;

  if (hasImpressions && (metrics.impressions || 0) > 100 && hasEngagement && hasCtr) {
    return 'sufficient';
  }
  if (hasImpressions) {
    return 'partial';
  }
  return 'insufficient_data';
}

function calculateTrend(
  events: any[],
  daysBack: number
): 'improving' | 'stable' | 'declining' | 'unknown' {
  if (events.length < 10) return 'unknown';

  const midpoint = new Date();
  midpoint.setDate(midpoint.getDate() - daysBack / 2);

  const firstHalf = events.filter(e => new Date(e.created_at) < midpoint);
  const secondHalf = events.filter(e => new Date(e.created_at) >= midpoint);

  if (firstHalf.length < 5 || secondHalf.length < 5) return 'unknown';

  const firstEngRate = calculateEngagementRate(firstHalf);
  const secondEngRate = calculateEngagementRate(secondHalf);

  if (firstEngRate === null || secondEngRate === null) return 'unknown';

  const change = (secondEngRate - firstEngRate) / Math.max(firstEngRate, 0.001);

  if (change > 0.1) return 'improving';
  if (change < -0.1) return 'declining';
  return 'stable';
}

function calculateEngagementRate(events: any[]): number | null {
  const impressions = events.filter(e => e.event_type === 'impression').length;
  const engagements = events.filter(e =>
    ['like', 'comment', 'share', 'save'].includes(e.event_type)
  ).length;

  return impressions > 0 ? engagements / impressions : null;
}

export default {
  getAssetPerformanceMetrics,
  getCampaignPerformanceSummary,
  getChannelPerformanceSnapshots,
  getMethodPerformanceRecords,
};
