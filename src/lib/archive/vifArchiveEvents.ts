/**
 * VIF Archive Events
 * Phase 79: VIF-specific archive event types and helpers
 */

/**
 * VIF event types for archive
 */
export type VifEventType =
  | 'vif_method_used'
  | 'vif_asset_created'
  | 'vif_asset_refined'
  | 'vif_evolution_step'
  | 'vif_campaign_bundle_created'
  | 'vif_campaign_launched'
  | 'vif_ab_visual_test_started'
  | 'vif_ab_visual_test_concluded'
  | 'vif_visual_high_performer'
  | 'vif_visual_underperformer'
  | 'vif_creative_quality_scored';

/**
 * VIF event display configuration
 */
interface VifEventDisplay {
  icon: string;
  label: string;
  color: string;
  category: string;
}

/**
 * Get display icon for VIF event type
 */
export function getVifEventDisplayIcon(type: VifEventType): string {
  const icons: Record<VifEventType, string> = {
    vif_method_used: 'Wand2',
    vif_asset_created: 'Image',
    vif_asset_refined: 'Sparkles',
    vif_evolution_step: 'GitBranch',
    vif_campaign_bundle_created: 'Package',
    vif_campaign_launched: 'Rocket',
    vif_ab_visual_test_started: 'FlaskConical',
    vif_ab_visual_test_concluded: 'Trophy',
    vif_visual_high_performer: 'TrendingUp',
    vif_visual_underperformer: 'TrendingDown',
    vif_creative_quality_scored: 'Star',
  };
  return icons[type] || 'Image';
}

/**
 * Get display label for VIF event type
 */
export function getVifEventDisplayLabel(type: VifEventType): string {
  const labels: Record<VifEventType, string> = {
    vif_method_used: 'VIF Method',
    vif_asset_created: 'Visual Created',
    vif_asset_refined: 'Visual Refined',
    vif_evolution_step: 'Evolution Step',
    vif_campaign_bundle_created: 'Campaign Bundle',
    vif_campaign_launched: 'Campaign Launched',
    vif_ab_visual_test_started: 'A/B Test Started',
    vif_ab_visual_test_concluded: 'A/B Test Winner',
    vif_visual_high_performer: 'High Performer',
    vif_visual_underperformer: 'Underperformer',
    vif_creative_quality_scored: 'Quality Scored',
  };
  return labels[type] || type;
}

/**
 * Get display color for VIF event type
 */
export function getVifEventDisplayColor(type: VifEventType): string {
  const colors: Record<VifEventType, string> = {
    vif_method_used: 'text-violet-500',
    vif_asset_created: 'text-fuchsia-500',
    vif_asset_refined: 'text-pink-500',
    vif_evolution_step: 'text-purple-500',
    vif_campaign_bundle_created: 'text-indigo-500',
    vif_campaign_launched: 'text-blue-500',
    vif_ab_visual_test_started: 'text-cyan-500',
    vif_ab_visual_test_concluded: 'text-emerald-500',
    vif_visual_high_performer: 'text-green-500',
    vif_visual_underperformer: 'text-orange-500',
    vif_creative_quality_scored: 'text-yellow-500',
  };
  return colors[type] || 'text-muted-foreground';
}

/**
 * Get category for VIF event type
 */
export function getVifEventCategory(type: VifEventType): string {
  return 'visual_intelligence';
}

/**
 * Get full display config for VIF event
 */
export function getVifEventDisplay(type: VifEventType): VifEventDisplay {
  return {
    icon: getVifEventDisplayIcon(type),
    label: getVifEventDisplayLabel(type),
    color: getVifEventDisplayColor(type),
    category: getVifEventCategory(type),
  };
}

/**
 * Calculate default importance score for VIF event
 */
export function calculateVifImportanceScore(
  type: VifEventType,
  context?: {
    isFirst?: boolean;
    qualityGrade?: string;
    significance?: number;
    fitnessDelta?: number;
  }
): number {
  const baseScores: Record<VifEventType, number> = {
    vif_method_used: 40,
    vif_asset_created: 70,
    vif_asset_refined: 75,
    vif_evolution_step: 65,
    vif_campaign_bundle_created: 80,
    vif_campaign_launched: 85,
    vif_ab_visual_test_started: 60,
    vif_ab_visual_test_concluded: 85,
    vif_visual_high_performer: 85,
    vif_visual_underperformer: 55,
    vif_creative_quality_scored: 70,
  };

  let score = baseScores[type] || 50;

  // Adjust based on context
  if (context) {
    // First asset for client is more important
    if (context.isFirst && type === 'vif_asset_created') {
      score = 85;
    }

    // Quality grade adjustments
    if (context.qualityGrade && type === 'vif_creative_quality_scored') {
      if (['A', 'A+', 'A-'].includes(context.qualityGrade)) {
        score = 90;
      } else if (['B', 'B+', 'B-'].includes(context.qualityGrade)) {
        score = 80;
      } else if (['D', 'D+', 'D-', 'F'].includes(context.qualityGrade)) {
        score = 50;
      }
    }

    // High significance A/B test
    if (context.significance && context.significance > 0.95 && type === 'vif_ab_visual_test_concluded') {
      score = 90;
    }

    // Significant evolution improvement
    if (context.fitnessDelta && context.fitnessDelta > 0.2 && type === 'vif_evolution_step') {
      score = 80;
    }

    // Asset refinement with quality improvement
    if (context.fitnessDelta && context.fitnessDelta > 0.15 && type === 'vif_asset_refined') {
      score = 85;
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * VIF-specific details for archive entry
 */
export interface VifArchiveDetails {
  // Method context
  methodId?: string;
  methodName?: string;
  methodCategory?: string;

  // Asset context
  assetId?: string;
  assetType?: string;
  provider?: string;
  qualityScore?: number;
  fitnessDelta?: number;
  originalAssetId?: string;

  // Campaign context
  campaignId?: string;
  campaignName?: string;
  channel?: string;
  bundleTemplate?: string;

  // Test context
  testId?: string;
  variantAId?: string;
  variantBId?: string;
  winnerVariantId?: string;
  significanceLevel?: number;

  // Performance context
  performanceLabel?: 'high_performer' | 'underperformer';
  performanceScore?: number;

  // Quality context
  qualityGrade?: string;
  qualityComponents?: Record<string, number>;

  // General
  isFirst?: boolean;
  summary?: string;
}

/**
 * Check if event type is a VIF event
 */
export function isVifEventType(type: string): type is VifEventType {
  return type.startsWith('vif_');
}

/**
 * Get all VIF event types
 */
export function getAllVifEventTypes(): VifEventType[] {
  return [
    'vif_method_used',
    'vif_asset_created',
    'vif_asset_refined',
    'vif_evolution_step',
    'vif_campaign_bundle_created',
    'vif_campaign_launched',
    'vif_ab_visual_test_started',
    'vif_ab_visual_test_concluded',
    'vif_visual_high_performer',
    'vif_visual_underperformer',
    'vif_creative_quality_scored',
  ];
}

export default {
  getVifEventDisplayIcon,
  getVifEventDisplayLabel,
  getVifEventDisplayColor,
  getVifEventCategory,
  getVifEventDisplay,
  calculateVifImportanceScore,
  isVifEventType,
  getAllVifEventTypes,
};
