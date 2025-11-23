/**
 * Visual Campaign Engine
 * Phase 69: Campaign planning engine that creates asset bundles from briefs
 */

import { CampaignChannel, CHANNEL_PROFILES, getChannelProfile } from './channelProfiles';
import { METHOD_REGISTRY, getMethodById, getMethodsByCategory, filterMethods } from '../methods/catalog';
import { MethodMetadata, BrandPersonality, IndustryTag } from '../methods/metadata';

export interface CampaignBrief {
  campaign_id: string;
  campaign_name: string;
  industry: IndustryTag;
  goal: CampaignGoal;
  main_offer: string;
  tone: BrandPersonality;
  channels: CampaignChannel[];
  budget_tier: 'starter' | 'growth' | 'premium' | 'enterprise';
  timeline_days: number;
  brand_colors?: string[];
  brand_fonts?: string[];
  reference_images?: string[];
  special_requirements?: string[];
}

export type CampaignGoal =
  | 'awareness'
  | 'engagement'
  | 'conversion'
  | 'retention'
  | 'launch'
  | 'seasonal'
  | 'event'
  | 'recruitment';

export interface CampaignBundle {
  bundle_id: string;
  campaign_id: string;
  campaign_name: string;
  created_at: string;
  status: 'planning' | 'generating' | 'review' | 'approved' | 'live';

  // Core assets
  hero_asset: AssetSpec;
  supporting_assets: AssetSpec[];

  // Channel-specific assets
  channel_assets: ChannelAssetGroup[];

  // Metadata
  total_assets: number;
  estimated_cost: number;
  estimated_time_hours: number;
  brand_score?: number;

  // Generation config
  generation_queue: GenerationQueueItem[];
}

export interface AssetSpec {
  asset_id: string;
  method_id: string;
  method_name: string;
  category: string;
  output_type: string;
  dimensions: { width: number; height: number };
  aspect_ratio: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[];
  estimated_time_seconds: number;
  cost_tier: string;
  params: Record<string, unknown>;
}

export interface ChannelAssetGroup {
  channel: CampaignChannel;
  channel_name: string;
  assets: AssetSpec[];
  formats_covered: string[];
  posting_schedule?: PostingSchedule;
}

export interface PostingSchedule {
  frequency: string;
  best_times: string[];
  total_posts: number;
}

export interface GenerationQueueItem {
  queue_id: string;
  asset_id: string;
  method_id: string;
  priority: number;
  status: 'pending' | 'generating' | 'complete' | 'failed';
  retry_count: number;
}

// Campaign goal to method category mapping
const GOAL_CATEGORY_MAP: Record<CampaignGoal, string[]> = {
  awareness: ['hero', 'social_set', 'video', 'animation'],
  engagement: ['social_set', 'carousel', 'animation', 'interactive'],
  conversion: ['hero', 'thumbnail', 'data_viz', 'infographic'],
  retention: ['social_set', 'infographic', 'carousel'],
  launch: ['hero', 'social_set', 'video', 'animation', 'thumbnail'],
  seasonal: ['hero', 'social_set', 'carousel'],
  event: ['hero', 'social_set', 'storyboard', 'video'],
  recruitment: ['hero', 'social_set', 'infographic'],
};

// Budget tier multipliers
const BUDGET_MULTIPLIERS: Record<string, number> = {
  starter: 0.5,
  growth: 1.0,
  premium: 1.5,
  enterprise: 2.5,
};

/**
 * Create a campaign bundle from a brief
 */
export function createCampaignBundle(brief: CampaignBrief): CampaignBundle {
  const bundleId = `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Select hero method based on industry and tone
  const heroAsset = selectHeroAsset(brief, bundleId);

  // Generate channel-specific assets
  const channelAssets = brief.channels.map(channel =>
    generateChannelAssets(channel, brief, bundleId)
  );

  // Generate supporting assets based on goal
  const supportingAssets = generateSupportingAssets(brief, bundleId);

  // Calculate totals
  const allAssets = [heroAsset, ...supportingAssets, ...channelAssets.flatMap(ca => ca.assets)];
  const totalAssets = allAssets.length;
  const estimatedCost = calculateEstimatedCost(allAssets, brief.budget_tier);
  const estimatedTimeHours = calculateEstimatedTime(allAssets);

  // Build generation queue
  const generationQueue = buildGenerationQueue(allAssets);

  return {
    bundle_id: bundleId,
    campaign_id: brief.campaign_id,
    campaign_name: brief.campaign_name,
    created_at: new Date().toISOString(),
    status: 'planning',
    hero_asset: heroAsset,
    supporting_assets: supportingAssets,
    channel_assets: channelAssets,
    total_assets: totalAssets,
    estimated_cost: estimatedCost,
    estimated_time_hours: estimatedTimeHours,
    generation_queue: generationQueue,
  };
}

/**
 * Select appropriate hero method for campaign
 */
function selectHeroAsset(brief: CampaignBrief, bundleId: string): AssetSpec {
  const heroMethods = getMethodsByCategory('hero');

  // Score methods based on brief fit
  const scoredMethods = heroMethods.map(method => ({
    method,
    score: scoreMethodFit(method, brief),
  })).sort((a, b) => b.score - a.score);

  const selectedMethod = scoredMethods[0]?.method || heroMethods[0];

  return {
    asset_id: `${bundleId}_hero_001`,
    method_id: selectedMethod.id,
    method_name: selectedMethod.name,
    category: selectedMethod.category,
    output_type: selectedMethod.outputs[0],
    dimensions: { width: 1920, height: 1080 },
    aspect_ratio: '16:9',
    priority: 'critical',
    dependencies: [],
    estimated_time_seconds: selectedMethod.estimated_time_seconds,
    cost_tier: selectedMethod.cost_tier,
    params: {
      industry: brief.industry,
      tone: brief.tone,
      main_offer: brief.main_offer,
      brand_colors: brief.brand_colors,
      brand_fonts: brief.brand_fonts,
    },
  };
}

/**
 * Generate assets for a specific channel
 */
function generateChannelAssets(
  channel: CampaignChannel,
  brief: CampaignBrief,
  bundleId: string
): ChannelAssetGroup {
  const profile = getChannelProfile(channel);
  const assets: AssetSpec[] = [];
  const formatsCovered: string[] = [];

  // Get methods that support this channel
  const channelMethods = filterMethods({ channels: [channel] });

  // Add primary format asset
  const primaryFormat = profile.formats.find(f => f.is_primary) || profile.formats[0];
  if (primaryFormat) {
    const primaryMethod = selectBestMethodForFormat(channelMethods, primaryFormat, brief);
    if (primaryMethod) {
      assets.push({
        asset_id: `${bundleId}_${channel}_primary_001`,
        method_id: primaryMethod.id,
        method_name: primaryMethod.name,
        category: primaryMethod.category,
        output_type: primaryMethod.outputs[0],
        dimensions: primaryFormat.dimensions,
        aspect_ratio: primaryFormat.aspect_ratio,
        priority: 'high',
        dependencies: [`${bundleId}_hero_001`],
        estimated_time_seconds: primaryMethod.estimated_time_seconds,
        cost_tier: primaryMethod.cost_tier,
        params: {
          channel,
          format: primaryFormat.id,
          industry: brief.industry,
          tone: brief.tone,
        },
      });
      formatsCovered.push(primaryFormat.id);
    }
  }

  // Add story/reel format if available and budget allows
  const storyFormat = profile.formats.find(f =>
    f.id.includes('story') || f.id.includes('reel') || f.id.includes('short')
  );
  if (storyFormat && brief.budget_tier !== 'starter') {
    const storyMethod = channelMethods.find(m => m.motion_support) || channelMethods[0];
    if (storyMethod) {
      assets.push({
        asset_id: `${bundleId}_${channel}_story_001`,
        method_id: storyMethod.id,
        method_name: storyMethod.name,
        category: storyMethod.category,
        output_type: storyMethod.outputs[0],
        dimensions: storyFormat.dimensions,
        aspect_ratio: storyFormat.aspect_ratio,
        priority: 'medium',
        dependencies: [`${bundleId}_${channel}_primary_001`],
        estimated_time_seconds: storyMethod.estimated_time_seconds,
        cost_tier: storyMethod.cost_tier,
        params: {
          channel,
          format: storyFormat.id,
          max_duration: storyFormat.max_duration_seconds,
          safe_zones: storyFormat.safe_zones,
        },
      });
      formatsCovered.push(storyFormat.id);
    }
  }

  // Add carousel/document format for premium+ budgets
  const carouselFormat = profile.formats.find(f =>
    f.id.includes('carousel') || f.id.includes('document')
  );
  if (carouselFormat && (brief.budget_tier === 'premium' || brief.budget_tier === 'enterprise')) {
    const carouselMethods = getMethodsByCategory('carousel');
    const carouselMethod = carouselMethods[0];
    if (carouselMethod) {
      assets.push({
        asset_id: `${bundleId}_${channel}_carousel_001`,
        method_id: carouselMethod.id,
        method_name: carouselMethod.name,
        category: carouselMethod.category,
        output_type: carouselMethod.outputs[0],
        dimensions: carouselFormat.dimensions,
        aspect_ratio: carouselFormat.aspect_ratio,
        priority: 'medium',
        dependencies: [`${bundleId}_${channel}_primary_001`],
        estimated_time_seconds: carouselMethod.estimated_time_seconds,
        cost_tier: carouselMethod.cost_tier,
        params: {
          channel,
          format: carouselFormat.id,
          slide_count: 5,
        },
      });
      formatsCovered.push(carouselFormat.id);
    }
  }

  return {
    channel,
    channel_name: profile.name,
    assets,
    formats_covered: formatsCovered,
    posting_schedule: {
      frequency: profile.posting_frequency,
      best_times: getBestPostingTimes(channel),
      total_posts: assets.length,
    },
  };
}

/**
 * Generate supporting assets based on campaign goal
 */
function generateSupportingAssets(brief: CampaignBrief, bundleId: string): AssetSpec[] {
  const assets: AssetSpec[] = [];
  const goalCategories = GOAL_CATEGORY_MAP[brief.goal] || ['social_set'];
  const budgetMultiplier = BUDGET_MULTIPLIERS[brief.budget_tier];

  // Add 1-3 supporting assets based on budget
  const supportCount = Math.min(3, Math.ceil(2 * budgetMultiplier));

  for (let i = 0; i < supportCount; i++) {
    const category = goalCategories[i % goalCategories.length];
    const methods = getMethodsByCategory(category as any);

    if (methods.length > 0) {
      const method = methods[Math.floor(Math.random() * methods.length)];
      assets.push({
        asset_id: `${bundleId}_support_${String(i + 1).padStart(3, '0')}`,
        method_id: method.id,
        method_name: method.name,
        category: method.category,
        output_type: method.outputs[0],
        dimensions: { width: 1080, height: 1080 },
        aspect_ratio: '1:1',
        priority: i === 0 ? 'high' : 'medium',
        dependencies: [`${bundleId}_hero_001`],
        estimated_time_seconds: method.estimated_time_seconds,
        cost_tier: method.cost_tier,
        params: {
          industry: brief.industry,
          tone: brief.tone,
          goal: brief.goal,
        },
      });
    }
  }

  return assets;
}

/**
 * Score how well a method fits the brief
 */
function scoreMethodFit(method: MethodMetadata, brief: CampaignBrief): number {
  let score = 0;

  // Industry match
  if (method.industries.includes(brief.industry)) {
    score += 30;
  }

  // Tone/personality match
  if (method.brand_personalities.includes(brief.tone)) {
    score += 25;
  }

  // Channel support
  const channelSupport = brief.channels.filter(c =>
    method.supported_channels.includes(c as any)
  ).length;
  score += channelSupport * 10;

  // Cost tier match with budget
  const costMatch = matchCostToBudget(method.cost_tier, brief.budget_tier);
  score += costMatch * 15;

  return score;
}

/**
 * Match method cost tier to budget
 */
function matchCostToBudget(costTier: string, budgetTier: string): number {
  const costRank = { low: 1, medium: 2, high: 3, premium: 4 };
  const budgetRank = { starter: 1, growth: 2, premium: 3, enterprise: 4 };

  const costVal = costRank[costTier as keyof typeof costRank] || 2;
  const budgetVal = budgetRank[budgetTier as keyof typeof budgetRank] || 2;

  // Prefer methods at or below budget
  if (costVal <= budgetVal) {
    return 1;
  }
  return 0.5;
}

/**
 * Select best method for a specific format
 */
function selectBestMethodForFormat(
  methods: MethodMetadata[],
  format: { supports_motion: boolean; aspect_ratio: string },
  brief: CampaignBrief
): MethodMetadata | null {
  if (methods.length === 0) return null;

  // Filter by motion support if needed
  let filtered = format.supports_motion
    ? methods
    : methods.filter(m => !m.motion_support);

  if (filtered.length === 0) filtered = methods;

  // Score and sort
  return filtered.sort((a, b) =>
    scoreMethodFit(b, brief) - scoreMethodFit(a, brief)
  )[0];
}

/**
 * Calculate estimated cost for all assets
 */
function calculateEstimatedCost(assets: AssetSpec[], budgetTier: string): number {
  const costValues = { low: 5, medium: 15, high: 35, premium: 75 };
  const multiplier = BUDGET_MULTIPLIERS[budgetTier];

  return assets.reduce((total, asset) => {
    const baseCost = costValues[asset.cost_tier as keyof typeof costValues] || 15;
    return total + (baseCost * multiplier);
  }, 0);
}

/**
 * Calculate estimated time in hours
 */
function calculateEstimatedTime(assets: AssetSpec[]): number {
  const totalSeconds = assets.reduce((total, asset) =>
    total + asset.estimated_time_seconds, 0
  );
  return Math.ceil(totalSeconds / 3600 * 10) / 10; // Round to 1 decimal
}

/**
 * Build generation queue with priorities
 */
function buildGenerationQueue(assets: AssetSpec[]): GenerationQueueItem[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  return assets
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .map((asset, index) => ({
      queue_id: `queue_${index + 1}`,
      asset_id: asset.asset_id,
      method_id: asset.method_id,
      priority: index + 1,
      status: 'pending' as const,
      retry_count: 0,
    }));
}

/**
 * Get best posting times for a channel
 */
function getBestPostingTimes(channel: CampaignChannel): string[] {
  const times: Record<string, string[]> = {
    facebook: ['9:00 AM', '1:00 PM', '4:00 PM'],
    instagram: ['11:00 AM', '2:00 PM', '7:00 PM'],
    tiktok: ['7:00 AM', '12:00 PM', '7:00 PM'],
    linkedin: ['7:30 AM', '12:00 PM', '5:00 PM'],
    youtube: ['2:00 PM', '4:00 PM'],
    twitter: ['8:00 AM', '12:00 PM', '6:00 PM'],
    pinterest: ['8:00 PM', '11:00 PM'],
    reddit: ['8:00 AM', '12:00 PM'],
  };

  return times[channel] || ['9:00 AM', '2:00 PM'];
}

/**
 * Estimate brand score for a bundle
 */
export function estimateBrandScore(bundle: CampaignBundle): number {
  // Base score
  let score = 70;

  // Bonus for multiple channels
  score += Math.min(bundle.channel_assets.length * 3, 15);

  // Bonus for format coverage
  const totalFormats = bundle.channel_assets.reduce(
    (sum, ca) => sum + ca.formats_covered.length, 0
  );
  score += Math.min(totalFormats * 2, 10);

  // Penalty for low asset count
  if (bundle.total_assets < 5) {
    score -= 5;
  }

  return Math.min(100, Math.max(0, score));
}

export default createCampaignBundle;
