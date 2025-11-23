/**
 * Visual Learning Profiles
 * Phase 70: Track method usage and performance patterns per workspace
 */

import { MethodPerformanceRecord } from './creativePerformanceSignals';
import { MethodMetadata } from '../methods/metadata';
import { METHOD_REGISTRY } from '../methods/catalog';

export interface LearningProfile {
  workspace_id: string;
  profile_id: string;
  created_at: string;
  updated_at: string;

  // Preferred patterns
  preferred_methods: PreferredMethod[];
  preferred_channels: PreferredChannel[];
  preferred_styles: PreferredStyle[];

  // Performance baselines
  baseline_engagement_rate: number;
  baseline_ctr: number;

  // Learning insights
  insights: LearningInsight[];

  // Adaptation state
  adaptation_level: 'new' | 'learning' | 'adapted' | 'optimized';
  total_assets_generated: number;
  total_data_points: number;
}

export interface PreferredMethod {
  method_id: string;
  category: string;
  usage_count: number;
  avg_performance: number;
  confidence: number;
  first_used: string;
  last_used: string;
}

export interface PreferredChannel {
  channel: string;
  usage_count: number;
  avg_engagement: number;
  best_method: string | null;
  worst_method: string | null;
}

export interface PreferredStyle {
  style_attribute: string;
  preferred_value: string;
  confidence: number;
  derived_from: string[];
}

export interface LearningInsight {
  insight_id: string;
  type: 'pattern' | 'opportunity' | 'warning' | 'suggestion';
  title: string;
  description: string;
  confidence: number;
  created_at: string;
  actions: string[];
}

/**
 * Build learning profile from performance records
 */
export function buildLearningProfile(
  workspaceId: string,
  methodRecords: MethodPerformanceRecord[]
): LearningProfile {
  const profileId = `profile_${workspaceId}_${Date.now()}`;
  const now = new Date().toISOString();

  // Calculate preferred methods
  const preferredMethods = methodRecords
    .filter(r => r.usage_count > 0 && r.avg_engagement_rate !== null)
    .sort((a, b) => (b.avg_engagement_rate || 0) - (a.avg_engagement_rate || 0))
    .slice(0, 15)
    .map(r => {
      const method = METHOD_REGISTRY.get(r.method_id);
      return {
        method_id: r.method_id,
        category: method?.category || 'unknown',
        usage_count: r.usage_count,
        avg_performance: r.avg_engagement_rate || 0,
        confidence: Math.min(r.usage_count / 10, 1),
        first_used: r.last_used || now,
        last_used: r.last_used || now,
      };
    });

  // Calculate preferred channels
  const channelMap = new Map<string, { usage: number; total: number; count: number; methods: string[] }>();

  for (const record of methodRecords) {
    if (record.best_channel) {
      const ch = record.best_channel;
      if (!channelMap.has(ch)) {
        channelMap.set(ch, { usage: 0, total: 0, count: 0, methods: [] });
      }
      const data = channelMap.get(ch)!;
      data.usage += record.usage_count;
      data.total += (record.avg_engagement_rate || 0) * record.usage_count;
      data.count += record.usage_count;
      data.methods.push(record.method_id);
    }
  }

  const preferredChannels: PreferredChannel[] = Array.from(channelMap.entries())
    .map(([channel, data]) => ({
      channel,
      usage_count: data.usage,
      avg_engagement: data.count > 0 ? data.total / data.count : 0,
      best_method: data.methods[0] || null,
      worst_method: null,
    }))
    .sort((a, b) => b.usage_count - a.usage_count);

  // Calculate baselines
  const totalUsage = methodRecords.reduce((sum, r) => sum + r.usage_count, 0);
  const weightedEngagement = methodRecords.reduce(
    (sum, r) => sum + (r.avg_engagement_rate || 0) * r.usage_count,
    0
  );
  const weightedCtr = methodRecords.reduce(
    (sum, r) => sum + (r.avg_ctr || 0) * r.usage_count,
    0
  );

  const baselineEngagement = totalUsage > 0 ? weightedEngagement / totalUsage : 0;
  const baselineCtr = totalUsage > 0 ? weightedCtr / totalUsage : 0;

  // Derive preferred styles
  const preferredStyles = derivePreferredStyles(preferredMethods);

  // Generate insights
  const insights = generateLearningInsights(
    methodRecords,
    preferredMethods,
    preferredChannels,
    baselineEngagement
  );

  // Determine adaptation level
  let adaptationLevel: LearningProfile['adaptation_level'];
  if (totalUsage < 10) adaptationLevel = 'new';
  else if (totalUsage < 50) adaptationLevel = 'learning';
  else if (totalUsage < 200) adaptationLevel = 'adapted';
  else adaptationLevel = 'optimized';

  return {
    workspace_id: workspaceId,
    profile_id: profileId,
    created_at: now,
    updated_at: now,
    preferred_methods: preferredMethods,
    preferred_channels: preferredChannels,
    preferred_styles: preferredStyles,
    baseline_engagement_rate: baselineEngagement,
    baseline_ctr: baselineCtr,
    insights,
    adaptation_level: adaptationLevel,
    total_assets_generated: totalUsage,
    total_data_points: methodRecords.length,
  };
}

/**
 * Get method recommendations based on learning profile
 */
export function getProfileBasedRecommendations(
  profile: LearningProfile,
  category: string,
  channel: string
): { method_id: string; score: number; reason: string }[] {
  const recommendations: { method_id: string; score: number; reason: string }[] = [];

  // Get methods in category
  const categoryMethods = Array.from(METHOD_REGISTRY.values())
    .filter(m => m.category === category);

  for (const method of categoryMethods) {
    let score = 50;
    let reasons: string[] = [];

    // Check if in preferred methods
    const preferred = profile.preferred_methods.find(p => p.method_id === method.id);
    if (preferred) {
      score += 20 + (preferred.confidence * 10);
      reasons.push(`Used ${preferred.usage_count}x with ${(preferred.avg_performance * 100).toFixed(1)}% engagement`);
    }

    // Check channel preference
    const channelPref = profile.preferred_channels.find(c => c.channel === channel);
    if (channelPref && channelPref.best_method === method.id) {
      score += 15;
      reasons.push(`Top performer on ${channel}`);
    }

    // Check style alignment
    for (const style of profile.preferred_styles) {
      if (style.derived_from.includes(method.id)) {
        score += 5;
        reasons.push(`Matches preferred ${style.style_attribute}`);
      }
    }

    // Above baseline bonus
    if (preferred && preferred.avg_performance > profile.baseline_engagement_rate) {
      score += 10;
      reasons.push('Above workspace baseline');
    }

    recommendations.push({
      method_id: method.id,
      score: Math.min(100, score),
      reason: reasons.join('; ') || 'Standard selection',
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Derive style preferences from top methods
 */
function derivePreferredStyles(preferredMethods: PreferredMethod[]): PreferredStyle[] {
  const styles: PreferredStyle[] = [];

  // Analyze categories
  const categoryCount = new Map<string, number>();
  for (const method of preferredMethods) {
    categoryCount.set(method.category, (categoryCount.get(method.category) || 0) + 1);
  }

  const topCategory = Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])[0];

  if (topCategory && topCategory[1] >= 3) {
    styles.push({
      style_attribute: 'content_type',
      preferred_value: topCategory[0],
      confidence: Math.min(topCategory[1] / 5, 1),
      derived_from: preferredMethods
        .filter(m => m.category === topCategory[0])
        .map(m => m.method_id),
    });
  }

  // Analyze complexity preference
  const complexities: number[] = [];
  for (const method of preferredMethods) {
    const metadata = METHOD_REGISTRY.get(method.method_id);
    if (metadata) {
      complexities.push(metadata.complexity);
    }
  }

  if (complexities.length > 3) {
    const avgComplexity = complexities.reduce((a, b) => a + b, 0) / complexities.length;
    const complexityPref = avgComplexity <= 2 ? 'simple'
      : avgComplexity <= 3.5 ? 'moderate'
      : 'complex';

    styles.push({
      style_attribute: 'complexity',
      preferred_value: complexityPref,
      confidence: 0.7,
      derived_from: preferredMethods.slice(0, 5).map(m => m.method_id),
    });
  }

  return styles;
}

/**
 * Generate learning insights from data
 */
function generateLearningInsights(
  methodRecords: MethodPerformanceRecord[],
  preferredMethods: PreferredMethod[],
  preferredChannels: PreferredChannel[],
  baselineEngagement: number
): LearningInsight[] {
  const insights: LearningInsight[] = [];
  const now = new Date().toISOString();

  // Pattern: Strong performer identified
  if (preferredMethods.length > 0 && preferredMethods[0].avg_performance >= 0.04) {
    insights.push({
      insight_id: `insight_pattern_${Date.now()}`,
      type: 'pattern',
      title: 'Top Performer Identified',
      description: `"${preferredMethods[0].method_id}" consistently delivers ${(preferredMethods[0].avg_performance * 100).toFixed(1)}% engagement`,
      confidence: preferredMethods[0].confidence,
      created_at: now,
      actions: ['Use as template for similar campaigns', 'Analyze what makes it effective'],
    });
  }

  // Opportunity: Underutilized channel
  const lowUsageChannels = preferredChannels.filter(c =>
    c.usage_count < 5 && c.avg_engagement > baselineEngagement
  );

  if (lowUsageChannels.length > 0) {
    insights.push({
      insight_id: `insight_opportunity_${Date.now()}`,
      type: 'opportunity',
      title: 'Underutilized Channel',
      description: `${lowUsageChannels[0].channel} shows good engagement but low usage`,
      confidence: 0.6,
      created_at: now,
      actions: ['Increase content for this channel', 'Test more methods here'],
    });
  }

  // Warning: Below baseline methods
  const belowBaseline = methodRecords.filter(r =>
    r.usage_count > 5 && (r.avg_engagement_rate || 0) < baselineEngagement * 0.5
  );

  if (belowBaseline.length > 2) {
    insights.push({
      insight_id: `insight_warning_${Date.now()}`,
      type: 'warning',
      title: 'Underperforming Methods',
      description: `${belowBaseline.length} methods consistently below baseline`,
      confidence: 0.8,
      created_at: now,
      actions: ['Review and potentially retire these methods', 'Test alternatives'],
    });
  }

  // Suggestion: Diversification
  const usedCategories = new Set(preferredMethods.map(m => m.category));
  if (usedCategories.size < 4 && preferredMethods.length > 10) {
    insights.push({
      insight_id: `insight_suggestion_${Date.now()}`,
      type: 'suggestion',
      title: 'Consider Diversification',
      description: 'Creative output focused on few categories',
      confidence: 0.5,
      created_at: now,
      actions: ['Test methods from new categories', 'Expand creative approach'],
    });
  }

  return insights;
}

export default {
  buildLearningProfile,
  getProfileBasedRecommendations,
};
