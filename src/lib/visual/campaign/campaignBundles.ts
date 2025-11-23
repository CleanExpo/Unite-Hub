/**
 * Campaign Bundles
 * Phase 69: Asset bundle definitions for different campaign types
 */

import { CampaignChannel } from './channelProfiles';
import { CampaignGoal } from './visualCampaignEngine';

export interface BundleTemplate {
  id: string;
  name: string;
  description: string;
  goal: CampaignGoal;
  recommended_channels: CampaignChannel[];
  asset_structure: BundleAssetStructure;
  estimated_assets: number;
  min_budget_tier: 'starter' | 'growth' | 'premium' | 'enterprise';
  typical_timeline_days: number;
  best_for: string[];
}

export interface BundleAssetStructure {
  hero: HeroAssetConfig;
  variants: VariantConfig[];
  social_set: SocialSetConfig;
  supporting: SupportingAssetConfig[];
}

export interface HeroAssetConfig {
  required: boolean;
  formats: string[];
  motion_preferred: boolean;
}

export interface VariantConfig {
  type: 'horizontal' | 'vertical' | 'square';
  aspect_ratio: string;
  required: boolean;
}

export interface SocialSetConfig {
  feed_posts: number;
  stories: number;
  reels: number;
  carousels: number;
}

export interface SupportingAssetConfig {
  type: string;
  category: string;
  count: number;
  required: boolean;
}

// Pre-defined bundle templates
export const BUNDLE_TEMPLATES: Record<string, BundleTemplate> = {
  // Launch Campaign Bundle
  product_launch: {
    id: 'product_launch',
    name: 'Product Launch Bundle',
    description: 'Complete asset set for new product or service launches',
    goal: 'launch',
    recommended_channels: ['instagram', 'facebook', 'linkedin', 'youtube', 'email'],
    asset_structure: {
      hero: {
        required: true,
        formats: ['16:9', '1:1', '9:16'],
        motion_preferred: true,
      },
      variants: [
        { type: 'horizontal', aspect_ratio: '16:9', required: true },
        { type: 'vertical', aspect_ratio: '9:16', required: true },
        { type: 'square', aspect_ratio: '1:1', required: true },
      ],
      social_set: {
        feed_posts: 5,
        stories: 3,
        reels: 2,
        carousels: 1,
      },
      supporting: [
        { type: 'thumbnail', category: 'thumbnail', count: 3, required: true },
        { type: 'infographic', category: 'infographic', count: 1, required: false },
        { type: 'email_header', category: 'hero', count: 2, required: true },
      ],
    },
    estimated_assets: 20,
    min_budget_tier: 'growth',
    typical_timeline_days: 14,
    best_for: ['New product releases', 'Feature announcements', 'Brand launches'],
  },

  // Brand Awareness Bundle
  brand_awareness: {
    id: 'brand_awareness',
    name: 'Brand Awareness Bundle',
    description: 'Assets focused on building brand recognition and reach',
    goal: 'awareness',
    recommended_channels: ['instagram', 'facebook', 'tiktok', 'youtube', 'display_ads'],
    asset_structure: {
      hero: {
        required: true,
        formats: ['16:9', '1:1'],
        motion_preferred: true,
      },
      variants: [
        { type: 'horizontal', aspect_ratio: '16:9', required: true },
        { type: 'square', aspect_ratio: '1:1', required: true },
      ],
      social_set: {
        feed_posts: 8,
        stories: 5,
        reels: 3,
        carousels: 2,
      },
      supporting: [
        { type: 'video_ad', category: 'video', count: 2, required: true },
        { type: 'display_ad', category: 'hero', count: 3, required: true },
      ],
    },
    estimated_assets: 25,
    min_budget_tier: 'growth',
    typical_timeline_days: 21,
    best_for: ['New market entry', 'Rebranding', 'Thought leadership'],
  },

  // Engagement Campaign Bundle
  engagement_boost: {
    id: 'engagement_boost',
    name: 'Engagement Boost Bundle',
    description: 'Interactive content to drive likes, comments, and shares',
    goal: 'engagement',
    recommended_channels: ['instagram', 'tiktok', 'facebook', 'twitter'],
    asset_structure: {
      hero: {
        required: true,
        formats: ['1:1', '9:16'],
        motion_preferred: true,
      },
      variants: [
        { type: 'vertical', aspect_ratio: '9:16', required: true },
        { type: 'square', aspect_ratio: '1:1', required: true },
      ],
      social_set: {
        feed_posts: 10,
        stories: 7,
        reels: 5,
        carousels: 3,
      },
      supporting: [
        { type: 'poll_graphic', category: 'social_set', count: 3, required: true },
        { type: 'quiz_slides', category: 'carousel', count: 2, required: false },
      ],
    },
    estimated_assets: 32,
    min_budget_tier: 'premium',
    typical_timeline_days: 14,
    best_for: ['Community building', 'User-generated content campaigns', 'Contests'],
  },

  // Conversion Campaign Bundle
  conversion_drive: {
    id: 'conversion_drive',
    name: 'Conversion Drive Bundle',
    description: 'Assets optimized for clicks, sign-ups, and sales',
    goal: 'conversion',
    recommended_channels: ['facebook', 'instagram', 'google_business', 'email', 'display_ads'],
    asset_structure: {
      hero: {
        required: true,
        formats: ['16:9', '1.91:1'],
        motion_preferred: false,
      },
      variants: [
        { type: 'horizontal', aspect_ratio: '1.91:1', required: true },
        { type: 'square', aspect_ratio: '1:1', required: true },
      ],
      social_set: {
        feed_posts: 6,
        stories: 4,
        reels: 1,
        carousels: 2,
      },
      supporting: [
        { type: 'cta_graphic', category: 'hero', count: 4, required: true },
        { type: 'testimonial', category: 'social_set', count: 3, required: true },
        { type: 'comparison_chart', category: 'data_viz', count: 1, required: false },
      ],
    },
    estimated_assets: 22,
    min_budget_tier: 'growth',
    typical_timeline_days: 10,
    best_for: ['Sales promotions', 'Lead generation', 'E-commerce'],
  },

  // Starter Social Bundle
  starter_social: {
    id: 'starter_social',
    name: 'Starter Social Bundle',
    description: 'Essential social media assets for small businesses',
    goal: 'awareness',
    recommended_channels: ['instagram', 'facebook'],
    asset_structure: {
      hero: {
        required: true,
        formats: ['1:1'],
        motion_preferred: false,
      },
      variants: [
        { type: 'square', aspect_ratio: '1:1', required: true },
      ],
      social_set: {
        feed_posts: 4,
        stories: 2,
        reels: 0,
        carousels: 1,
      },
      supporting: [
        { type: 'profile_pic', category: 'brand_panel', count: 1, required: true },
      ],
    },
    estimated_assets: 8,
    min_budget_tier: 'starter',
    typical_timeline_days: 5,
    best_for: ['Small businesses', 'Solopreneurs', 'Limited budgets'],
  },

  // B2B LinkedIn Bundle
  b2b_linkedin: {
    id: 'b2b_linkedin',
    name: 'B2B LinkedIn Bundle',
    description: 'Professional content for B2B marketing on LinkedIn',
    goal: 'awareness',
    recommended_channels: ['linkedin', 'email', 'web'],
    asset_structure: {
      hero: {
        required: true,
        formats: ['1.91:1', '1:1'],
        motion_preferred: false,
      },
      variants: [
        { type: 'horizontal', aspect_ratio: '1.91:1', required: true },
        { type: 'square', aspect_ratio: '1:1', required: true },
      ],
      social_set: {
        feed_posts: 6,
        stories: 0,
        reels: 0,
        carousels: 3,
      },
      supporting: [
        { type: 'document_slides', category: 'carousel', count: 2, required: true },
        { type: 'infographic', category: 'infographic', count: 2, required: true },
        { type: 'case_study', category: 'data_viz', count: 1, required: false },
      ],
    },
    estimated_assets: 15,
    min_budget_tier: 'growth',
    typical_timeline_days: 10,
    best_for: ['B2B companies', 'Professional services', 'SaaS marketing'],
  },

  // Event Promotion Bundle
  event_promotion: {
    id: 'event_promotion',
    name: 'Event Promotion Bundle',
    description: 'Assets for promoting events, webinars, and conferences',
    goal: 'event',
    recommended_channels: ['instagram', 'facebook', 'linkedin', 'email', 'web'],
    asset_structure: {
      hero: {
        required: true,
        formats: ['16:9', '1:1', '9:16'],
        motion_preferred: true,
      },
      variants: [
        { type: 'horizontal', aspect_ratio: '16:9', required: true },
        { type: 'vertical', aspect_ratio: '9:16', required: true },
        { type: 'square', aspect_ratio: '1:1', required: true },
      ],
      social_set: {
        feed_posts: 6,
        stories: 4,
        reels: 1,
        carousels: 1,
      },
      supporting: [
        { type: 'countdown', category: 'animation', count: 1, required: true },
        { type: 'speaker_cards', category: 'social_set', count: 4, required: false },
        { type: 'agenda', category: 'infographic', count: 1, required: true },
      ],
    },
    estimated_assets: 20,
    min_budget_tier: 'growth',
    typical_timeline_days: 14,
    best_for: ['Webinars', 'Conferences', 'Product launches', 'Live events'],
  },

  // Seasonal Campaign Bundle
  seasonal_campaign: {
    id: 'seasonal_campaign',
    name: 'Seasonal Campaign Bundle',
    description: 'Themed assets for holidays and seasonal promotions',
    goal: 'seasonal',
    recommended_channels: ['instagram', 'facebook', 'pinterest', 'email'],
    asset_structure: {
      hero: {
        required: true,
        formats: ['1:1', '9:16'],
        motion_preferred: true,
      },
      variants: [
        { type: 'vertical', aspect_ratio: '9:16', required: true },
        { type: 'square', aspect_ratio: '1:1', required: true },
      ],
      social_set: {
        feed_posts: 8,
        stories: 6,
        reels: 2,
        carousels: 2,
      },
      supporting: [
        { type: 'gif_animation', category: 'animation', count: 2, required: false },
        { type: 'sale_banner', category: 'hero', count: 3, required: true },
      ],
    },
    estimated_assets: 24,
    min_budget_tier: 'growth',
    typical_timeline_days: 10,
    best_for: ['Holiday sales', 'Back-to-school', 'Summer/Winter campaigns'],
  },

  // YouTube Content Bundle
  youtube_content: {
    id: 'youtube_content',
    name: 'YouTube Content Bundle',
    description: 'Thumbnails and assets for YouTube video marketing',
    goal: 'awareness',
    recommended_channels: ['youtube', 'youtube_shorts'],
    asset_structure: {
      hero: {
        required: true,
        formats: ['16:9'],
        motion_preferred: false,
      },
      variants: [
        { type: 'horizontal', aspect_ratio: '16:9', required: true },
        { type: 'vertical', aspect_ratio: '9:16', required: true },
      ],
      social_set: {
        feed_posts: 0,
        stories: 0,
        reels: 0,
        carousels: 0,
      },
      supporting: [
        { type: 'thumbnail', category: 'thumbnail', count: 10, required: true },
        { type: 'end_screen', category: 'hero', count: 2, required: true },
        { type: 'channel_art', category: 'brand_panel', count: 1, required: true },
      ],
    },
    estimated_assets: 15,
    min_budget_tier: 'growth',
    typical_timeline_days: 7,
    best_for: ['YouTubers', 'Video marketers', 'Educational content'],
  },

  // Enterprise Full-Scale Bundle
  enterprise_full: {
    id: 'enterprise_full',
    name: 'Enterprise Full-Scale Bundle',
    description: 'Comprehensive asset package for enterprise campaigns',
    goal: 'launch',
    recommended_channels: [
      'instagram', 'facebook', 'linkedin', 'youtube', 'twitter',
      'pinterest', 'email', 'web', 'display_ads'
    ],
    asset_structure: {
      hero: {
        required: true,
        formats: ['16:9', '1:1', '9:16', '1.91:1'],
        motion_preferred: true,
      },
      variants: [
        { type: 'horizontal', aspect_ratio: '16:9', required: true },
        { type: 'horizontal', aspect_ratio: '1.91:1', required: true },
        { type: 'vertical', aspect_ratio: '9:16', required: true },
        { type: 'square', aspect_ratio: '1:1', required: true },
      ],
      social_set: {
        feed_posts: 15,
        stories: 10,
        reels: 5,
        carousels: 5,
      },
      supporting: [
        { type: 'video_ad', category: 'video', count: 3, required: true },
        { type: 'display_ad', category: 'hero', count: 6, required: true },
        { type: 'infographic', category: 'infographic', count: 3, required: true },
        { type: 'thumbnail', category: 'thumbnail', count: 5, required: true },
        { type: 'email_template', category: 'hero', count: 4, required: true },
      ],
    },
    estimated_assets: 60,
    min_budget_tier: 'enterprise',
    typical_timeline_days: 30,
    best_for: ['Major launches', 'Rebranding', 'Global campaigns'],
  },
};

/**
 * Get bundle template by ID
 */
export function getBundleTemplate(id: string): BundleTemplate | undefined {
  return BUNDLE_TEMPLATES[id];
}

/**
 * Get bundle templates for a specific goal
 */
export function getBundlesByGoal(goal: CampaignGoal): BundleTemplate[] {
  return Object.values(BUNDLE_TEMPLATES).filter(b => b.goal === goal);
}

/**
 * Get bundle templates within a budget tier
 */
export function getBundlesByBudget(
  budgetTier: 'starter' | 'growth' | 'premium' | 'enterprise'
): BundleTemplate[] {
  const tierOrder = ['starter', 'growth', 'premium', 'enterprise'];
  const tierIndex = tierOrder.indexOf(budgetTier);

  return Object.values(BUNDLE_TEMPLATES).filter(b => {
    const bundleTierIndex = tierOrder.indexOf(b.min_budget_tier);
    return bundleTierIndex <= tierIndex;
  });
}

/**
 * Get recommended bundle for a channel set
 */
export function getRecommendedBundle(channels: CampaignChannel[]): BundleTemplate | null {
  let bestMatch: BundleTemplate | null = null;
  let bestScore = 0;

  for (const bundle of Object.values(BUNDLE_TEMPLATES)) {
    const matchCount = channels.filter(c =>
      bundle.recommended_channels.includes(c)
    ).length;
    const score = matchCount / Math.max(channels.length, bundle.recommended_channels.length);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = bundle;
    }
  }

  return bestMatch;
}

/**
 * Calculate total assets in a bundle template
 */
export function calculateBundleAssets(template: BundleTemplate): number {
  const { asset_structure } = template;
  let total = 0;

  // Hero
  if (asset_structure.hero.required) {
    total += asset_structure.hero.formats.length;
  }

  // Variants
  total += asset_structure.variants.filter(v => v.required).length;

  // Social set
  total += asset_structure.social_set.feed_posts;
  total += asset_structure.social_set.stories;
  total += asset_structure.social_set.reels;
  total += asset_structure.social_set.carousels;

  // Supporting
  for (const support of asset_structure.supporting) {
    if (support.required) {
      total += support.count;
    }
  }

  return total;
}

export default BUNDLE_TEMPLATES;
