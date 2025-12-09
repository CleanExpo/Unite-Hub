/**
 * Reactive Creative Engine
 * Phase 70: Adapt campaign and method selection based on historical performance
 */

import { CampaignBrief, CampaignBundle, createCampaignBundle, AssetSpec } from '../campaign/visualCampaignEngine';
import { METHOD_REGISTRY, getMethodsByCategory, filterMethods } from '../methods/catalog';
import { MethodMetadata } from '../methods/metadata';
import {
  getMethodPerformanceRecords,
  getChannelPerformanceSnapshots,
  MethodPerformanceRecord,
  ChannelPerformanceSnapshot,
} from './creativePerformanceSignals';
import {
  mapCampaignToFeedback,
  MethodInsight,
  ChannelFeedback,
} from './creativeFeedbackMapper';

export type ReactiveMode = 'conservative' | 'balanced' | 'exploratory';

export interface ReactiveConfig {
  mode: ReactiveMode;
  workspaceId: string;
  maxExperimentalMethods?: number;
  minConfidenceThreshold?: number;
  favorHighPerformers?: boolean;
}

export interface ReactiveBundle extends CampaignBundle {
  reactive_mode: ReactiveMode;
  method_adjustments: MethodAdjustment[];
  channel_adjustments: ChannelAdjustment[];
  confidence_score: number;
  suggested_experiments: SuggestedExperiment[];
}

export interface MethodAdjustment {
  method_id: string;
  original_rank: number;
  adjusted_rank: number;
  reason: string;
}

export interface ChannelAdjustment {
  channel: string;
  budget_modifier: number; // 0.5 = reduce by half, 1.5 = increase by 50%
  reason: string;
}

export interface SuggestedExperiment {
  experiment_id: string;
  type: 'ab_test' | 'new_method' | 'channel_expansion';
  description: string;
  confidence: 'high' | 'medium' | 'low';
  potential_impact: 'high' | 'medium' | 'low';
}

/**
 * Create an adaptive campaign bundle using historical performance data
 */
export async function createReactiveCampaignBundle(
  brief: CampaignBrief,
  config: ReactiveConfig
): Promise<ReactiveBundle> {
  // Fetch historical performance data
  const methodRecords = await getMethodPerformanceRecords(config.workspaceId);
  const channelSnapshots = await getChannelPerformanceSnapshots(config.workspaceId);

  // Create base bundle
  const baseBundle = createCampaignBundle(brief);

  // Apply reactive adjustments
  const methodAdjustments = calculateMethodAdjustments(
    baseBundle,
    methodRecords,
    config
  );

  const channelAdjustments = calculateChannelAdjustments(
    brief.channels,
    channelSnapshots,
    config
  );

  // Adjust assets based on performance data
  const adjustedBundle = applyMethodAdjustments(baseBundle, methodAdjustments, methodRecords);

  // Generate experiment suggestions
  const experiments = generateExperimentSuggestions(
    brief,
    methodRecords,
    channelSnapshots,
    config
  );

  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore(methodRecords, channelSnapshots, brief);

  return {
    ...adjustedBundle,
    reactive_mode: config.mode,
    method_adjustments: methodAdjustments,
    channel_adjustments: channelAdjustments,
    confidence_score: confidenceScore,
    suggested_experiments: experiments,
  };
}

/**
 * Get method recommendations based on performance
 */
export function getReactiveMethodRecommendations(
  category: string,
  channel: string,
  methodRecords: MethodPerformanceRecord[],
  mode: ReactiveMode
): MethodMetadata[] {
  const categoryMethods = getMethodsByCategory(category as any);

  // Score methods based on performance
  const scored = categoryMethods.map(method => {
    const record = methodRecords.find(r => r.method_id === method.id);
    let score = 50; // baseline

    if (record) {
      // Performance score
      if (record.avg_engagement_rate !== null) {
        if (record.avg_engagement_rate >= 0.03) {
score += 30;
} else if (record.avg_engagement_rate >= 0.015) {
score += 15;
} else if (record.avg_engagement_rate < 0.005) {
score -= 20;
}
      }

      // Channel fit
      if (record.best_channel === channel) {
score += 20;
}
      if (record.worst_channel === channel) {
score -= 15;
}

      // Recency bonus
      if (record.last_used) {
        const daysSinceUse = (Date.now() - new Date(record.last_used).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUse < 7) {
score += 5;
} else if (daysSinceUse > 30) {
score -= 5;
}
      }

      // Usage experience
      if (record.usage_count > 10) {
score += 5;
}
    } else {
      // Untested method
      if (mode === 'exploratory') {
score += 10;
} else if (mode === 'conservative') {
score -= 20;
}
    }

    return { method, score };
  });

  // Sort and filter based on mode
  scored.sort((a, b) => b.score - a.score);

  switch (mode) {
    case 'conservative':
      // Only return proven performers
      return scored
        .filter(s => s.score >= 60)
        .map(s => s.method);

    case 'exploratory':
      // Mix high performers with some untested
      const proven = scored.filter(s => s.score >= 50).slice(0, 5);
      const experimental = scored.filter(s => s.score < 50).slice(0, 3);
      return [...proven, ...experimental].map(s => s.method);

    case 'balanced':
    default:
      // Standard sorting
      return scored.map(s => s.method);
  }
}

/**
 * Calculate adjustments needed for methods in bundle
 */
function calculateMethodAdjustments(
  bundle: CampaignBundle,
  methodRecords: MethodPerformanceRecord[],
  config: ReactiveConfig
): MethodAdjustment[] {
  const adjustments: MethodAdjustment[] = [];
  const allAssets = [bundle.hero_asset, ...bundle.supporting_assets];

  for (let i = 0; i < allAssets.length; i++) {
    const asset = allAssets[i];
    const record = methodRecords.find(r => r.method_id === asset.method_id);

    if (!record) {
continue;
}

    let adjustment = 0;
    let reason = '';

    // Check performance
    if (record.avg_engagement_rate !== null) {
      if (record.avg_engagement_rate >= 0.03) {
        adjustment = -2; // Move up in priority
        reason = 'High-performing method';
      } else if (record.avg_engagement_rate < 0.005) {
        if (config.mode === 'conservative') {
          adjustment = 5; // Move down significantly
          reason = 'Underperforming method (conservative mode)';
        } else {
          adjustment = 2;
          reason = 'Below-average performance';
        }
      }
    }

    if (adjustment !== 0) {
      adjustments.push({
        method_id: asset.method_id,
        original_rank: i + 1,
        adjusted_rank: i + 1 + adjustment,
        reason,
      });
    }
  }

  return adjustments;
}

/**
 * Calculate budget adjustments for channels
 */
function calculateChannelAdjustments(
  channels: string[],
  snapshots: ChannelPerformanceSnapshot[],
  config: ReactiveConfig
): ChannelAdjustment[] {
  const adjustments: ChannelAdjustment[] = [];

  for (const channel of channels) {
    const snapshot = snapshots.find(s => s.channel === channel);
    if (!snapshot) {
continue;
}

    let modifier = 1.0;
    let reason = '';

    const engRate = snapshot.engagement_rate || 0;

    // Performance-based adjustment
    if (engRate >= 0.03) {
      modifier = 1.3;
      reason = 'High engagement rate';
    } else if (engRate >= 0.015) {
      modifier = 1.1;
      reason = 'Above-average engagement';
    } else if (engRate < 0.005) {
      modifier = config.mode === 'conservative' ? 0.5 : 0.8;
      reason = 'Low engagement rate';
    }

    // Trend adjustment
    if (snapshot.trend === 'improving') {
      modifier *= 1.1;
      reason += ' + improving trend';
    } else if (snapshot.trend === 'declining') {
      modifier *= 0.9;
      reason += ' + declining trend';
    }

    if (modifier !== 1.0) {
      adjustments.push({
        channel,
        budget_modifier: modifier,
        reason: reason.trim(),
      });
    }
  }

  return adjustments;
}

/**
 * Apply method adjustments to bundle assets
 */
function applyMethodAdjustments(
  bundle: CampaignBundle,
  adjustments: MethodAdjustment[],
  methodRecords: MethodPerformanceRecord[]
): CampaignBundle {
  // For severe underperformers, suggest replacements
  const replacements: Map<string, string> = new Map();

  for (const adjustment of adjustments) {
    if (adjustment.adjusted_rank - adjustment.original_rank >= 4) {
      // Find a better method in same category
      const originalAsset = [bundle.hero_asset, ...bundle.supporting_assets]
        .find(a => a.method_id === adjustment.method_id);

      if (originalAsset) {
        const alternatives = getReactiveMethodRecommendations(
          originalAsset.category,
          bundle.channel_assets[0]?.channel || 'instagram',
          methodRecords,
          'balanced'
        );

        if (alternatives.length > 0 && alternatives[0].id !== adjustment.method_id) {
          replacements.set(adjustment.method_id, alternatives[0].id);
        }
      }
    }
  }

  // Apply replacements
  if (replacements.size > 0) {
    const updatedSupportingAssets = bundle.supporting_assets.map(asset => {
      const replacement = replacements.get(asset.method_id);
      if (replacement) {
        const newMethod = METHOD_REGISTRY.get(replacement);
        if (newMethod) {
          return {
            ...asset,
            method_id: newMethod.id,
            method_name: newMethod.name,
            estimated_time_seconds: newMethod.estimated_time_seconds,
            cost_tier: newMethod.cost_tier,
          };
        }
      }
      return asset;
    });

    return {
      ...bundle,
      supporting_assets: updatedSupportingAssets,
    };
  }

  return bundle;
}

/**
 * Generate experiment suggestions based on data gaps and opportunities
 */
function generateExperimentSuggestions(
  brief: CampaignBrief,
  methodRecords: MethodPerformanceRecord[],
  channelSnapshots: ChannelPerformanceSnapshot[],
  config: ReactiveConfig
): SuggestedExperiment[] {
  const experiments: SuggestedExperiment[] = [];

  // Find untested but potentially good methods
  const untestedMethods = Array.from(METHOD_REGISTRY.values())
    .filter(m => !methodRecords.find(r => r.method_id === m.id))
    .filter(m => m.industries.includes(brief.industry))
    .slice(0, 3);

  for (const method of untestedMethods) {
    experiments.push({
      experiment_id: `exp_new_${method.id}_${Date.now()}`,
      type: 'new_method',
      description: `Test "${method.name}" - matches industry and hasn't been tried`,
      confidence: 'medium',
      potential_impact: 'medium',
    });
  }

  // Find channels with declining performance that need A/B testing
  const decliningChannels = channelSnapshots.filter(s =>
    s.trend === 'declining' && brief.channels.includes(s.channel as any)
  );

  for (const channel of decliningChannels) {
    experiments.push({
      experiment_id: `exp_ab_${channel.channel}_${Date.now()}`,
      type: 'ab_test',
      description: `A/B test creative approach on ${channel.channel} (declining trend)`,
      confidence: 'high',
      potential_impact: 'high',
    });
  }

  // Suggest channel expansion for unused but relevant channels
  const unusedChannels = ['pinterest', 'reddit', 'podcast'].filter(
    ch => !brief.channels.includes(ch as any)
  );

  if (config.mode === 'exploratory' && unusedChannels.length > 0) {
    experiments.push({
      experiment_id: `exp_expand_${unusedChannels[0]}_${Date.now()}`,
      type: 'channel_expansion',
      description: `Test ${unusedChannels[0]} for potential audience reach`,
      confidence: 'low',
      potential_impact: 'medium',
    });
  }

  return experiments.slice(0, 5);
}

/**
 * Calculate confidence score for reactive recommendations
 */
function calculateConfidenceScore(
  methodRecords: MethodPerformanceRecord[],
  channelSnapshots: ChannelPerformanceSnapshot[],
  brief: CampaignBrief
): number {
  let score = 50; // baseline

  // Data volume bonus
  const totalUsage = methodRecords.reduce((sum, r) => sum + r.usage_count, 0);
  if (totalUsage > 100) {
score += 15;
} else if (totalUsage > 50) {
score += 10;
} else if (totalUsage < 10) {
score -= 15;
}

  // Channel coverage bonus
  const coveredChannels = brief.channels.filter(ch =>
    channelSnapshots.find(s => s.channel === ch)
  ).length;
  const coverage = coveredChannels / brief.channels.length;
  score += coverage * 20;

  // Recency bonus
  const recentRecords = methodRecords.filter(r => {
    if (!r.last_used) {
return false;
}
    const days = (Date.now() - new Date(r.last_used).getTime()) / (1000 * 60 * 60 * 24);
    return days < 30;
  });
  if (recentRecords.length > methodRecords.length * 0.5) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get creative health score for a workspace
 */
export async function getCreativeHealthScore(workspaceId: string): Promise<{
  score: number;
  label: string;
  factors: { name: string; score: number; trend: string }[];
}> {
  const methodRecords = await getMethodPerformanceRecords(workspaceId);
  const channelSnapshots = await getChannelPerformanceSnapshots(workspaceId);

  // Calculate component scores
  const avgEngagement = methodRecords.reduce((sum, r) =>
    sum + (r.avg_engagement_rate || 0), 0
  ) / Math.max(methodRecords.length, 1);

  const engagementScore = avgEngagement >= 0.03 ? 80
    : avgEngagement >= 0.015 ? 60
    : avgEngagement >= 0.005 ? 40 : 20;

  const improvingChannels = channelSnapshots.filter(s => s.trend === 'improving').length;
  const trendScore = improvingChannels > channelSnapshots.length * 0.5 ? 80
    : improvingChannels > 0 ? 60 : 40;

  const diversityScore = methodRecords.length >= 20 ? 80
    : methodRecords.length >= 10 ? 60
    : methodRecords.length >= 5 ? 40 : 20;

  const overall = Math.round((engagementScore + trendScore + diversityScore) / 3);

  return {
    score: overall,
    label: overall >= 70 ? 'Healthy' : overall >= 50 ? 'Moderate' : 'Needs Attention',
    factors: [
      { name: 'Engagement', score: engagementScore, trend: 'stable' },
      { name: 'Trends', score: trendScore, trend: improvingChannels > 0 ? 'up' : 'stable' },
      { name: 'Diversity', score: diversityScore, trend: 'stable' },
    ],
  };
}

export default {
  createReactiveCampaignBundle,
  getReactiveMethodRecommendations,
  getCreativeHealthScore,
};
