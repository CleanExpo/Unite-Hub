/**
 * A/B Visual Testing Service
 * Phase 70: Define and manage visual A/B tests for campaign assets
 */

import { AssetSpec } from '../campaign/visualCampaignEngine';
import { METHOD_REGISTRY } from '../methods/catalog';

export interface VisualABTest {
  test_id: string;
  campaign_id: string;
  asset_id: string;
  test_name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  started_at: string | null;
  completed_at: string | null;

  // Variants
  control: VisualVariant;
  variations: VisualVariant[];

  // Configuration
  traffic_split: number[]; // e.g., [50, 50] for 50/50 split
  min_sample_size: number;
  confidence_threshold: number; // e.g., 0.95 for 95% confidence

  // Results
  winner: string | null;
  lift: number | null;
  statistical_significance: number | null;
}

export interface VisualVariant {
  variant_id: string;
  variant_name: string;
  is_control: boolean;

  // Visual modifications
  modifications: VisualModification[];

  // Tracking
  impressions: number;
  engagements: number;
  clicks: number;
  conversions: number;

  // Calculated metrics
  engagement_rate: number | null;
  ctr: number | null;
  conversion_rate: number | null;
}

export interface VisualModification {
  type: ModificationType;
  attribute: string;
  control_value: string;
  variant_value: string;
}

export type ModificationType =
  | 'colorway'
  | 'typography'
  | 'layout'
  | 'framing'
  | 'cta_style'
  | 'image_treatment'
  | 'text_emphasis'
  | 'spacing';

export interface TestSuggestion {
  suggestion_id: string;
  asset_id: string;
  test_type: ModificationType;
  rationale: string;
  potential_impact: 'high' | 'medium' | 'low';
  confidence: number;
  modifications: VisualModification[];
}

/**
 * Create an A/B test for an asset
 */
export function createVisualABTest(
  campaignId: string,
  asset: AssetSpec,
  testName: string,
  modifications: VisualModification[]
): VisualABTest {
  const testId = `abtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const control: VisualVariant = {
    variant_id: `${testId}_control`,
    variant_name: 'Control',
    is_control: true,
    modifications: [],
    impressions: 0,
    engagements: 0,
    clicks: 0,
    conversions: 0,
    engagement_rate: null,
    ctr: null,
    conversion_rate: null,
  };

  const variation: VisualVariant = {
    variant_id: `${testId}_variation_a`,
    variant_name: 'Variation A',
    is_control: false,
    modifications,
    impressions: 0,
    engagements: 0,
    clicks: 0,
    conversions: 0,
    engagement_rate: null,
    ctr: null,
    conversion_rate: null,
  };

  return {
    test_id: testId,
    campaign_id: campaignId,
    asset_id: asset.asset_id,
    test_name: testName,
    status: 'draft',
    created_at: now,
    started_at: null,
    completed_at: null,
    control,
    variations: [variation],
    traffic_split: [50, 50],
    min_sample_size: 100,
    confidence_threshold: 0.95,
    winner: null,
    lift: null,
    statistical_significance: null,
  };
}

/**
 * Generate test suggestions for an asset
 */
export function generateTestSuggestions(
  asset: AssetSpec,
  channel: string
): TestSuggestion[] {
  const suggestions: TestSuggestion[] = [];

  // CTA style test for conversion-focused assets
  if (asset.priority === 'critical' || asset.priority === 'high') {
    suggestions.push({
      suggestion_id: `suggest_cta_${asset.asset_id}`,
      asset_id: asset.asset_id,
      test_type: 'cta_style',
      rationale: 'CTA style significantly impacts click-through rates',
      potential_impact: 'high',
      confidence: 0.8,
      modifications: [
        {
          type: 'cta_style',
          attribute: 'button_style',
          control_value: 'solid',
          variant_value: 'gradient',
        },
      ],
    });
  }

  // Colorway test for brand assets
  if (asset.category === 'hero' || asset.category === 'brand_panel') {
    suggestions.push({
      suggestion_id: `suggest_color_${asset.asset_id}`,
      asset_id: asset.asset_id,
      test_type: 'colorway',
      rationale: 'Color variations can affect emotional response and engagement',
      potential_impact: 'medium',
      confidence: 0.7,
      modifications: [
        {
          type: 'colorway',
          attribute: 'primary_color',
          control_value: 'brand_primary',
          variant_value: 'brand_secondary',
        },
      ],
    });
  }

  // Typography test for text-heavy content
  if (asset.category === 'social_set' || asset.category === 'carousel') {
    suggestions.push({
      suggestion_id: `suggest_typo_${asset.asset_id}`,
      asset_id: asset.asset_id,
      test_type: 'typography',
      rationale: 'Font weight and style affect readability and emphasis',
      potential_impact: 'medium',
      confidence: 0.6,
      modifications: [
        {
          type: 'typography',
          attribute: 'headline_weight',
          control_value: 'bold',
          variant_value: 'extra_bold',
        },
      ],
    });
  }

  // Framing test for thumbnails
  if (asset.category === 'thumbnail') {
    suggestions.push({
      suggestion_id: `suggest_frame_${asset.asset_id}`,
      asset_id: asset.asset_id,
      test_type: 'framing',
      rationale: 'Thumbnail framing directly impacts click-through rate',
      potential_impact: 'high',
      confidence: 0.85,
      modifications: [
        {
          type: 'framing',
          attribute: 'composition',
          control_value: 'centered',
          variant_value: 'rule_of_thirds',
        },
      ],
    });
  }

  // Layout test for feeds
  if (['instagram', 'facebook', 'linkedin'].includes(channel)) {
    suggestions.push({
      suggestion_id: `suggest_layout_${asset.asset_id}`,
      asset_id: asset.asset_id,
      test_type: 'layout',
      rationale: 'Layout affects visual hierarchy and information processing',
      potential_impact: 'medium',
      confidence: 0.65,
      modifications: [
        {
          type: 'layout',
          attribute: 'text_position',
          control_value: 'top',
          variant_value: 'bottom',
        },
      ],
    });
  }

  return suggestions.slice(0, 3);
}

/**
 * Record an event for a test variant
 */
export function recordTestEvent(
  test: VisualABTest,
  variantId: string,
  eventType: 'impression' | 'engagement' | 'click' | 'conversion'
): VisualABTest {
  const updatedVariations = test.variations.map(v => {
    if (v.variant_id === variantId) {
      const updated = { ...v };
      switch (eventType) {
        case 'impression':
          updated.impressions++;
          break;
        case 'engagement':
          updated.engagements++;
          break;
        case 'click':
          updated.clicks++;
          break;
        case 'conversion':
          updated.conversions++;
          break;
      }
      // Recalculate rates
      if (updated.impressions > 0) {
        updated.engagement_rate = updated.engagements / updated.impressions;
        updated.ctr = updated.clicks / updated.impressions;
      }
      if (updated.clicks > 0) {
        updated.conversion_rate = updated.conversions / updated.clicks;
      }
      return updated;
    }
    return v;
  });

  // Update control if needed
  let updatedControl = test.control;
  if (test.control.variant_id === variantId) {
    updatedControl = { ...test.control };
    switch (eventType) {
      case 'impression':
        updatedControl.impressions++;
        break;
      case 'engagement':
        updatedControl.engagements++;
        break;
      case 'click':
        updatedControl.clicks++;
        break;
      case 'conversion':
        updatedControl.conversions++;
        break;
    }
    if (updatedControl.impressions > 0) {
      updatedControl.engagement_rate = updatedControl.engagements / updatedControl.impressions;
      updatedControl.ctr = updatedControl.clicks / updatedControl.impressions;
    }
    if (updatedControl.clicks > 0) {
      updatedControl.conversion_rate = updatedControl.conversions / updatedControl.clicks;
    }
  }

  return {
    ...test,
    control: updatedControl,
    variations: updatedVariations,
  };
}

/**
 * Evaluate test results and determine winner
 */
export function evaluateTestResults(test: VisualABTest): VisualABTest {
  const allVariants = [test.control, ...test.variations];

  // Check if minimum sample size reached
  const totalImpressions = allVariants.reduce((sum, v) => sum + v.impressions, 0);
  if (totalImpressions < test.min_sample_size * allVariants.length) {
    return test; // Not enough data
  }

  // Calculate statistical significance (simplified z-test)
  const control = test.control;
  const variation = test.variations[0];

  if (!control || !variation) return test;

  const controlRate = control.engagement_rate || 0;
  const variationRate = variation.engagement_rate || 0;

  // Pooled proportion
  const pooledEngagements = control.engagements + variation.engagements;
  const pooledImpressions = control.impressions + variation.impressions;
  const pooledRate = pooledImpressions > 0 ? pooledEngagements / pooledImpressions : 0;

  // Standard error
  const se = Math.sqrt(
    pooledRate * (1 - pooledRate) * (
      1 / Math.max(control.impressions, 1) +
      1 / Math.max(variation.impressions, 1)
    )
  );

  // Z-score
  const zScore = se > 0 ? (variationRate - controlRate) / se : 0;

  // Convert to significance (simplified)
  const significance = Math.min(0.99, Math.abs(zScore) / 3);

  // Determine winner
  let winner: string | null = null;
  let lift: number | null = null;

  if (significance >= test.confidence_threshold) {
    if (variationRate > controlRate) {
      winner = variation.variant_id;
      lift = controlRate > 0 ? (variationRate - controlRate) / controlRate : 0;
    } else {
      winner = control.variant_id;
      lift = variationRate > 0 ? (controlRate - variationRate) / variationRate : 0;
    }
  }

  return {
    ...test,
    winner,
    lift,
    statistical_significance: significance,
    status: winner ? 'completed' : test.status,
    completed_at: winner ? new Date().toISOString() : null,
  };
}

/**
 * Get test summary for reporting
 */
export function getTestSummary(test: VisualABTest): {
  test_id: string;
  status: string;
  total_impressions: number;
  control_rate: number;
  best_variation_rate: number;
  lift_percent: number | null;
  confidence: number | null;
  recommendation: string;
} {
  const allVariants = [test.control, ...test.variations];
  const totalImpressions = allVariants.reduce((sum, v) => sum + v.impressions, 0);

  const controlRate = test.control.engagement_rate || 0;
  const variationRates = test.variations.map(v => v.engagement_rate || 0);
  const bestVariationRate = Math.max(...variationRates, 0);

  let recommendation: string;
  if (test.winner === test.control.variant_id) {
    recommendation = 'Keep control - it outperforms variations';
  } else if (test.winner) {
    recommendation = `Implement ${test.variations.find(v => v.variant_id === test.winner)?.variant_name || 'winning variation'}`;
  } else if (totalImpressions < test.min_sample_size * allVariants.length) {
    recommendation = 'Continue test - need more data';
  } else {
    recommendation = 'No clear winner - consider new variations';
  }

  return {
    test_id: test.test_id,
    status: test.status,
    total_impressions: totalImpressions,
    control_rate: controlRate,
    best_variation_rate: bestVariationRate,
    lift_percent: test.lift !== null ? test.lift * 100 : null,
    confidence: test.statistical_significance,
    recommendation,
  };
}

export default {
  createVisualABTest,
  generateTestSuggestions,
  recordTestEvent,
  evaluateTestResults,
  getTestSummary,
};
