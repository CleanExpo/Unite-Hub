/**
 * Tier-Aware Report Composition Engine
 * Phase 89C: Extends report composition with subscription tier support
 */

import {
  buildClientReport,
  buildFounderReport,
  ComposedReport,
  ReportCompositionConfig,
  ReportSection,
} from './reportCompositionEngine';
import {
  SubscriptionTier,
  getTierFeatures,
  getTierRefreshFrequency,
  canAccessAdvancedReporting,
} from '@/lib/config/tier-config';
import { getTierConfig } from '@/lib/middleware/tier-gating';
import logger from '@/lib/logger';

export interface TierAwareReportConfig extends ReportCompositionConfig {
  subscription_tier: SubscriptionTier;
  include_phase89_sections?: boolean;
}

export interface TierAwareComposedReport extends ComposedReport {
  subscription_tier: SubscriptionTier;
  tier_restrictions?: {
    feature: string;
    reason: string;
    required_tier: SubscriptionTier;
  }[];
  refresh_schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    next_refresh: string;
  };
  data_retention_days: number;
}

/**
 * Phase 89 Sections that are tier-gated
 */
const PHASE89_SECTIONS = [
  {
    id: 'keyword_intelligence',
    title: 'Keyword Intelligence & Gap Analysis',
    minTier: 'pro' as SubscriptionTier,
    dataSource: 'keyword_intelligence',
  },
  {
    id: 'competitive_analysis',
    title: 'Competitive Benchmarking',
    minTier: 'pro' as SubscriptionTier,
    dataSource: 'competitive_analysis',
  },
  {
    id: 'social_media_insights',
    title: '7-Platform Social Media Analytics',
    minTier: 'starter' as SubscriptionTier,
    dataSource: 'social_media',
  },
  {
    id: 'youtube_intelligence',
    title: 'YouTube Channel Intelligence',
    minTier: 'pro' as SubscriptionTier,
    dataSource: 'youtube_analytics',
  },
  {
    id: 'opportunity_matrix',
    title: 'Impact × Effort Opportunity Matrix',
    minTier: 'pro' as SubscriptionTier,
    dataSource: 'opportunities',
  },
  {
    id: 'geo_grid_ranking',
    title: 'Geo Grid Ranking Analysis',
    minTier: 'pro' as SubscriptionTier,
    dataSource: 'geo_grid',
  },
  {
    id: 'local_rank_tracking',
    title: 'Local Rank Tracking',
    minTier: 'enterprise' as SubscriptionTier,
    dataSource: 'local_rank',
  },
];

/**
 * Build a tier-aware client report
 */
export function buildTierAwareClientReport(config: TierAwareReportConfig): TierAwareComposedReport {
  logger.info('[TierAwareReport] Building report', {
    clientId: config.client_id,
    tier: config.subscription_tier,
    includePhase89: config.include_phase89_sections,
  });

  // Start with base report
  const baseReport = buildClientReport(config);

  // Get tier features
  const tierFeatures = getTierFeatures(config.subscription_tier);
  const tierConfig = getTierConfig(config.subscription_tier);

  // Get Phase 89 sections if requested and accessible
  const phase89Sections = config.include_phase89_sections ? getAccessiblePhase89Sections(config.subscription_tier) : [];

  // Build tier-specific sections
  const tierSections: ReportSection[] = [];
  const tierRestrictions: TierAwareComposedReport['tier_restrictions'] = [];

  // Add accessible Phase 89 sections
  for (const phaseSection of PHASE89_SECTIONS) {
    const hasAccess = canAccessTier(config.subscription_tier, phaseSection.minTier);

    if (!hasAccess) {
      tierRestrictions.push({
        feature: phaseSection.id,
        reason: `Requires ${phaseSection.minTier} subscription`,
        required_tier: phaseSection.minTier,
      });
      continue;
    }

    if (phase89Sections.some((s) => s.id === phaseSection.id)) {
      tierSections.push(createPhase89Section(phaseSection, config.subscription_tier));
    }
  }

  // Limit sections based on tier
  const maxSections = tierConfig.reportSections;
  const allSections = [...baseReport.sections, ...tierSections].slice(0, maxSections);

  // Calculate next refresh time
  const now = new Date();
  const refreshFrequency = getTierRefreshFrequency(config.subscription_tier);
  const nextRefresh = calculateNextRefresh(now, refreshFrequency);

  return {
    ...baseReport,
    sections: allSections,
    subscription_tier: config.subscription_tier,
    tier_restrictions: tierRestrictions.length > 0 ? tierRestrictions : undefined,
    refresh_schedule: {
      frequency: refreshFrequency,
      next_refresh: nextRefresh.toISOString(),
    },
    data_retention_days: tierFeatures.dataRetention,
  };
}

/**
 * Build a tier-aware founder report
 */
export function buildTierAwareFounderReport(config: TierAwareReportConfig): TierAwareComposedReport {
  logger.info('[TierAwareReport] Building founder report', {
    tier: config.subscription_tier,
  });

  const baseReport = buildFounderReport(config);

  // Add same tier-aware enhancements
  // Future: use tierConfig for additional tier-specific report customization
  const tierFeatures = getTierFeatures(config.subscription_tier);
  const now = new Date();
  const refreshFrequency = getTierRefreshFrequency(config.subscription_tier);
  const nextRefresh = calculateNextRefresh(now, refreshFrequency);

  return {
    ...baseReport,
    subscription_tier: config.subscription_tier,
    refresh_schedule: {
      frequency: refreshFrequency,
      next_refresh: nextRefresh.toISOString(),
    },
    data_retention_days: tierFeatures.dataRetention,
  };
}

/**
 * Get Phase 89 sections accessible to a tier
 */
function getAccessiblePhase89Sections(tier: SubscriptionTier): typeof PHASE89_SECTIONS {
  return PHASE89_SECTIONS.filter((section) => canAccessTier(tier, section.minTier));
}

/**
 * Check if a user tier can access a required tier
 */
function canAccessTier(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    starter: 1,
    pro: 2,
    enterprise: 3,
  };

  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
}

/**
 * Create a Phase 89 report section
 */
function createPhase89Section(section: (typeof PHASE89_SECTIONS)[0], tier: SubscriptionTier): ReportSection {
  return {
    section_id: section.id,
    title: section.title,
    description: `Premium intelligence powered by Phase 89 (${tier} tier access)`,
    blocks: [
      {
        block_id: `${section.id}_intro`,
        type: 'text',
        content: {
          text: `This section provides ${section.title.toLowerCase()} data from our Phase 89 intelligence suite.`,
        },
      },
      {
        block_id: `${section.id}_data`,
        type: 'callout',
        content: {
          variant: 'info',
          title: 'Data Source',
          message: `Data provided by ${section.dataSource} service`,
        },
      },
    ],
    data_status: 'partial',
  };
}

/**
 * Calculate next refresh time based on frequency
 */
function calculateNextRefresh(from: Date, frequency: 'daily' | 'weekly' | 'monthly'): Date {
  const next = new Date(from);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next;
}

/**
 * Get report upgrade recommendations
 */
export function getUpgradeRecommendations(
  report: TierAwareComposedReport
): Array<{ feature: string; requiredTier: SubscriptionTier; benefit: string }> {
  if (!report.tier_restrictions || report.tier_restrictions.length === 0) {
    return [];
  }

  return report.tier_restrictions.map((restriction) => ({
    feature: restriction.feature,
    requiredTier: restriction.required_tier,
    benefit: getFeatureBenefit(restriction.feature, restriction.required_tier),
  }));
}

/**
 * Get benefit description for a feature
 */
function getFeatureBenefit(feature: string, tier: SubscriptionTier): string {
  const benefits: Record<string, Record<SubscriptionTier, string>> = {
    keyword_intelligence: {
      starter: '',
      pro: 'Identify keyword gaps and opportunities to outrank competitors',
      enterprise: 'Advanced opportunity scoring and phased action planning',
    },
    competitive_analysis: {
      starter: '',
      pro: 'Benchmark your metrics against top competitors',
      enterprise: 'Deep competitive intelligence with market positioning',
    },
    youtube_intelligence: {
      starter: '',
      pro: 'Track YouTube channel health and growth',
      enterprise: 'Advanced analytics with audience insights',
    },
    opportunity_matrix: {
      starter: '',
      pro: 'Visualize high-impact opportunities on impact/effort matrix',
      enterprise: 'Detailed action plans with resource requirements',
    },
    geo_grid_ranking: {
      starter: '',
      pro: 'See GMB rankings across geospatial grid (10km radius)',
      enterprise: 'Advanced local SEO tracking and heatmaps',
    },
    local_rank_tracking: {
      starter: '',
      pro: '',
      enterprise: 'Real-time local ranking updates and competitive alerts',
    },
  };

  return benefits[feature]?.[tier] || 'Premium feature';
}

/**
 * Validate report configuration for tier
 */
export function validateTierConfig(config: TierAwareReportConfig): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const tierConfig = getTierConfig(config.subscription_tier);

  if (config.include_phase89_sections && !canAccessAdvancedReporting(config.subscription_tier)) {
    warnings.push(
      `Phase 89 sections requested but ${config.subscription_tier} tier only supports ${tierConfig.reportSections} sections`
    );
  }

  return {
    valid: true,
    warnings,
  };
}
