/**
 * Creative Feedback Mapper
 * Phase 70: Convert raw metrics into qualitative labels and actionable tags
 */

import {
  CreativePerformanceMetrics,
  CampaignPerformanceSummary,
  ChannelPerformanceSnapshot,
  MethodPerformanceRecord,
} from './creativePerformanceSignals';

export type PerformanceLabel =
  | 'high_performer'
  | 'solid_performer'
  | 'average'
  | 'underperformer'
  | 'needs_experiment'
  | 'insufficient_data';

export type ChannelTag =
  | 'vertical_reels_strong'
  | 'thumbnail_weak'
  | 'carousel_effective'
  | 'story_underutilized'
  | 'video_high_completion'
  | 'static_outperforming'
  | 'ctr_above_benchmark'
  | 'engagement_below_benchmark'
  | 'saves_high'
  | 'shares_viral';

export interface AssetFeedback {
  asset_id: string;
  performance_label: PerformanceLabel;
  score: number; // 0-100
  tags: ChannelTag[];
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface CampaignFeedback {
  campaign_id: string;
  overall_label: PerformanceLabel;
  overall_score: number;
  channel_breakdown: ChannelFeedback[];
  method_insights: MethodInsight[];
  strategic_recommendations: string[];
}

export interface ChannelFeedback {
  channel: string;
  label: PerformanceLabel;
  score: number;
  tags: ChannelTag[];
  action: 'increase_investment' | 'maintain' | 'reduce' | 'experiment' | 'pause';
}

export interface MethodInsight {
  method_id: string;
  performance_tier: 'top' | 'strong' | 'average' | 'weak' | 'untested';
  best_channels: string[];
  avoid_channels: string[];
  recommendation: string;
}

// Industry benchmarks (these would ideally come from real aggregate data)
const BENCHMARKS = {
  engagement_rate: {
    excellent: 0.06,
    good: 0.03,
    average: 0.015,
    poor: 0.005,
  },
  ctr: {
    excellent: 0.04,
    good: 0.02,
    average: 0.01,
    poor: 0.003,
  },
  completion_rate: {
    excellent: 0.7,
    good: 0.5,
    average: 0.3,
    poor: 0.15,
  },
};

/**
 * Map asset performance metrics to feedback
 */
export function mapAssetToFeedback(
  metrics: CreativePerformanceMetrics
): AssetFeedback {
  if (metrics.data_quality === 'insufficient_data') {
    return {
      asset_id: metrics.asset_id,
      performance_label: 'insufficient_data',
      score: 0,
      tags: [],
      recommendations: ['Gather more data before making decisions'],
      confidence: 'low',
    };
  }

  const engRate = metrics.engagement_rate || 0;
  const ctr = metrics.click_through_rate || 0;
  const completionRate = metrics.completion_rate;

  // Calculate composite score
  let score = 50; // baseline

  // Engagement contribution (40%)
  if (engRate >= BENCHMARKS.engagement_rate.excellent) score += 20;
  else if (engRate >= BENCHMARKS.engagement_rate.good) score += 12;
  else if (engRate >= BENCHMARKS.engagement_rate.average) score += 5;
  else if (engRate < BENCHMARKS.engagement_rate.poor) score -= 15;
  else score -= 5;

  // CTR contribution (30%)
  if (ctr >= BENCHMARKS.ctr.excellent) score += 15;
  else if (ctr >= BENCHMARKS.ctr.good) score += 8;
  else if (ctr >= BENCHMARKS.ctr.average) score += 3;
  else if (ctr < BENCHMARKS.ctr.poor) score -= 10;
  else score -= 3;

  // Completion rate contribution (30%) if available
  if (completionRate !== null) {
    if (completionRate >= BENCHMARKS.completion_rate.excellent) score += 15;
    else if (completionRate >= BENCHMARKS.completion_rate.good) score += 8;
    else if (completionRate >= BENCHMARKS.completion_rate.average) score += 3;
    else if (completionRate < BENCHMARKS.completion_rate.poor) score -= 10;
    else score -= 3;
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine label
  const label = scoreToLabel(score, metrics.data_quality);

  // Generate tags
  const tags = generateAssetTags(metrics);

  // Generate recommendations
  const recommendations = generateAssetRecommendations(metrics, label, tags);

  // Determine confidence
  const impressions = metrics.impressions || 0;
  const confidence = impressions > 500 ? 'high' : impressions > 100 ? 'medium' : 'low';

  return {
    asset_id: metrics.asset_id,
    performance_label: label,
    score,
    tags,
    recommendations,
    confidence,
  };
}

/**
 * Map campaign summary to feedback
 */
export function mapCampaignToFeedback(
  summary: CampaignPerformanceSummary,
  channelSnapshots: ChannelPerformanceSnapshot[],
  methodRecords: MethodPerformanceRecord[]
): CampaignFeedback {
  if (summary.data_quality === 'insufficient_data') {
    return {
      campaign_id: summary.campaign_id,
      overall_label: 'insufficient_data',
      overall_score: 0,
      channel_breakdown: [],
      method_insights: [],
      strategic_recommendations: ['Continue running campaign to gather performance data'],
    };
  }

  // Calculate overall score
  const engRate = summary.overall_engagement_rate || 0;
  const ctr = summary.overall_ctr || 0;

  let score = 50;
  if (engRate >= BENCHMARKS.engagement_rate.good) score += 15;
  else if (engRate < BENCHMARKS.engagement_rate.poor) score -= 15;

  if (ctr >= BENCHMARKS.ctr.good) score += 10;
  else if (ctr < BENCHMARKS.ctr.poor) score -= 10;

  // Bonus for no underperformers
  if (summary.underperforming_assets.length === 0) score += 5;
  // Penalty for many underperformers
  else if (summary.underperforming_assets.length > summary.total_assets * 0.3) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  // Map channel performance
  const channelBreakdown = channelSnapshots
    .filter(snap => summary.active_channels.includes(snap.channel))
    .map(snap => mapChannelToFeedback(snap));

  // Map method insights
  const methodInsights = methodRecords
    .slice(0, 10)
    .map(record => mapMethodToInsight(record));

  // Generate strategic recommendations
  const recommendations = generateStrategicRecommendations(
    summary,
    channelBreakdown,
    methodInsights
  );

  return {
    campaign_id: summary.campaign_id,
    overall_label: scoreToLabel(score, summary.data_quality),
    overall_score: score,
    channel_breakdown: channelBreakdown,
    method_insights: methodInsights,
    strategic_recommendations: recommendations,
  };
}

/**
 * Map channel snapshot to feedback
 */
function mapChannelToFeedback(snapshot: ChannelPerformanceSnapshot): ChannelFeedback {
  const engRate = snapshot.engagement_rate || 0;
  const ctr = snapshot.ctr || 0;

  let score = 50;
  if (engRate >= BENCHMARKS.engagement_rate.good) score += 20;
  else if (engRate < BENCHMARKS.engagement_rate.poor) score -= 20;

  if (ctr >= BENCHMARKS.ctr.good) score += 15;
  else if (ctr < BENCHMARKS.ctr.poor) score -= 15;

  // Trend adjustment
  if (snapshot.trend === 'improving') score += 10;
  else if (snapshot.trend === 'declining') score -= 10;

  score = Math.max(0, Math.min(100, score));

  const label = scoreToLabel(score, snapshot.impressions > 100 ? 'sufficient' : 'partial');
  const tags = generateChannelTags(snapshot);

  // Determine action
  let action: ChannelFeedback['action'];
  if (score >= 75 && snapshot.trend !== 'declining') action = 'increase_investment';
  else if (score >= 60) action = 'maintain';
  else if (score >= 40) action = 'experiment';
  else if (score >= 20) action = 'reduce';
  else action = 'pause';

  return {
    channel: snapshot.channel,
    label,
    score,
    tags,
    action,
  };
}

/**
 * Map method record to insight
 */
function mapMethodToInsight(record: MethodPerformanceRecord): MethodInsight {
  const engRate = record.avg_engagement_rate || 0;

  let tier: MethodInsight['performance_tier'];
  if (record.usage_count === 0) tier = 'untested';
  else if (engRate >= BENCHMARKS.engagement_rate.good) tier = 'top';
  else if (engRate >= BENCHMARKS.engagement_rate.average) tier = 'strong';
  else if (engRate >= BENCHMARKS.engagement_rate.poor) tier = 'average';
  else tier = 'weak';

  const bestChannels = record.best_channel ? [record.best_channel] : [];
  const avoidChannels = record.worst_channel && tier !== 'top'
    ? [record.worst_channel]
    : [];

  let recommendation: string;
  switch (tier) {
    case 'top':
      recommendation = 'Increase usage across campaigns';
      break;
    case 'strong':
      recommendation = 'Continue using in current channels';
      break;
    case 'average':
      recommendation = 'Test variations to improve performance';
      break;
    case 'weak':
      recommendation = 'Consider reducing usage or testing alternatives';
      break;
    case 'untested':
      recommendation = 'Test in small campaign to evaluate';
      break;
  }

  return {
    method_id: record.method_id,
    performance_tier: tier,
    best_channels: bestChannels,
    avoid_channels: avoidChannels,
    recommendation,
  };
}

// Helper functions

function scoreToLabel(
  score: number,
  dataQuality: 'sufficient' | 'partial' | 'insufficient_data'
): PerformanceLabel {
  if (dataQuality === 'insufficient_data') return 'insufficient_data';
  if (dataQuality === 'partial' && score < 60) return 'needs_experiment';

  if (score >= 75) return 'high_performer';
  if (score >= 60) return 'solid_performer';
  if (score >= 40) return 'average';
  return 'underperformer';
}

function generateAssetTags(metrics: CreativePerformanceMetrics): ChannelTag[] {
  const tags: ChannelTag[] = [];

  const engRate = metrics.engagement_rate || 0;
  const ctr = metrics.click_through_rate || 0;
  const completionRate = metrics.completion_rate;
  const saves = metrics.saves || 0;
  const shares = metrics.shares || 0;

  // CTR tags
  if (ctr >= BENCHMARKS.ctr.good) {
    tags.push('ctr_above_benchmark');
  }

  // Engagement tags
  if (engRate < BENCHMARKS.engagement_rate.poor) {
    tags.push('engagement_below_benchmark');
  }

  // Completion tags
  if (completionRate !== null && completionRate >= BENCHMARKS.completion_rate.good) {
    tags.push('video_high_completion');
  }

  // Save/share tags
  if (saves > 10) {
    tags.push('saves_high');
  }
  if (shares > 5) {
    tags.push('shares_viral');
  }

  // Channel-specific tags based on asset type
  if (metrics.channel === 'instagram' || metrics.channel === 'tiktok') {
    if (engRate >= BENCHMARKS.engagement_rate.good) {
      tags.push('vertical_reels_strong');
    }
  }

  if (metrics.channel === 'youtube' && ctr < BENCHMARKS.ctr.poor) {
    tags.push('thumbnail_weak');
  }

  return tags;
}

function generateChannelTags(snapshot: ChannelPerformanceSnapshot): ChannelTag[] {
  const tags: ChannelTag[] = [];

  const engRate = snapshot.engagement_rate || 0;
  const ctr = snapshot.ctr || 0;

  if (ctr >= BENCHMARKS.ctr.good) {
    tags.push('ctr_above_benchmark');
  }

  if (engRate < BENCHMARKS.engagement_rate.poor) {
    tags.push('engagement_below_benchmark');
  }

  if (snapshot.channel === 'instagram' && engRate >= BENCHMARKS.engagement_rate.good) {
    tags.push('vertical_reels_strong');
  }

  if (snapshot.channel === 'linkedin' && engRate >= BENCHMARKS.engagement_rate.average) {
    tags.push('carousel_effective');
  }

  return tags;
}

function generateAssetRecommendations(
  metrics: CreativePerformanceMetrics,
  label: PerformanceLabel,
  tags: ChannelTag[]
): string[] {
  const recommendations: string[] = [];

  if (label === 'high_performer') {
    recommendations.push('Use as template for similar future content');
    if (tags.includes('shares_viral')) {
      recommendations.push('Analyze what made this shareable for replication');
    }
  } else if (label === 'underperformer') {
    if (tags.includes('thumbnail_weak')) {
      recommendations.push('Test alternative thumbnail with higher contrast');
    }
    if (tags.includes('engagement_below_benchmark')) {
      recommendations.push('Consider different hook or opening');
    }
    recommendations.push('Compare with high-performing assets to identify gaps');
  } else if (label === 'needs_experiment') {
    recommendations.push('Run A/B test with variation');
  }

  if (metrics.completion_rate !== null && metrics.completion_rate < 0.3) {
    recommendations.push('Content may be too long; test shorter version');
  }

  return recommendations.slice(0, 3);
}

function generateStrategicRecommendations(
  summary: CampaignPerformanceSummary,
  channelBreakdown: ChannelFeedback[],
  methodInsights: MethodInsight[]
): string[] {
  const recommendations: string[] = [];

  // Channel-based recommendations
  const strongChannels = channelBreakdown.filter(c => c.action === 'increase_investment');
  const weakChannels = channelBreakdown.filter(c => c.action === 'reduce' || c.action === 'pause');

  if (strongChannels.length > 0) {
    recommendations.push(
      `Increase budget allocation for ${strongChannels.map(c => c.channel).join(', ')}`
    );
  }

  if (weakChannels.length > 0) {
    recommendations.push(
      `Review strategy for ${weakChannels.map(c => c.channel).join(', ')}`
    );
  }

  // Method-based recommendations
  const topMethods = methodInsights.filter(m => m.performance_tier === 'top');
  const weakMethods = methodInsights.filter(m => m.performance_tier === 'weak');

  if (topMethods.length > 0) {
    recommendations.push(
      `Prioritize these methods: ${topMethods.map(m => m.method_id).slice(0, 3).join(', ')}`
    );
  }

  if (weakMethods.length > 0 && weakMethods.length > methodInsights.length * 0.3) {
    recommendations.push('Consider refreshing creative approach; many methods underperforming');
  }

  // Underperformer-based recommendations
  if (summary.underperforming_assets.length > 3) {
    recommendations.push(
      `${summary.underperforming_assets.length} assets need attention; review or replace`
    );
  }

  return recommendations.slice(0, 5);
}

export default {
  mapAssetToFeedback,
  mapCampaignToFeedback,
};
