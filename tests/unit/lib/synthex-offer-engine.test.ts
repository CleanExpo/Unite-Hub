/**
 * Synthex Offer Engine Unit Tests
 *
 * Tests for pure/synchronous functions in the offer engine:
 * - Plan lookups and validation
 * - Visual capability checks
 * - Model support verification
 * - Quota calculations
 * - Price formatting
 * - Industry presets
 */

import { describe, it, expect, vi } from 'vitest';

// Mock supabase before importing the module
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

import {
  getPlan,
  getAllPlans,
  getVisualCapabilities,
  supportsVisualModel,
  getGraphicsQuota,
  getVideoQuota,
  getBrandKitQuota,
  hasAIDesignerAccess,
  getVideoFeatures,
  formatPrice,
  isValidPlanOfferCombination,
  getIndustryPreset,
  getAllIndustries,
  getRecommendedPlanForIndustry,
  getVisualGenerationSummary,
  PLANS,
  OFFER_TIERS,
} from '@/lib/synthex/synthexOfferEngine';

describe('Plan Lookups', () => {
  it('should return plan by code', () => {
    const launch = getPlan('launch');
    expect(launch).not.toBeNull();
    expect(launch!.code).toBe('launch');
    expect(launch!.basePrice).toBe(49);
  });

  it('should return null for invalid plan code', () => {
    const invalid = getPlan('enterprise');
    expect(invalid).toBeNull();
  });

  it('should return all plans', () => {
    const plans = getAllPlans();
    expect(plans).toHaveLength(3);
    expect(plans.map(p => p.code)).toEqual(
      expect.arrayContaining(['launch', 'growth', 'scale'])
    );
  });

  it('should have correct features per plan', () => {
    const launch = getPlan('launch')!;
    const growth = getPlan('growth')!;
    const scale = getPlan('scale')!;

    expect(launch.jobsPerMonth).toBe(8);
    expect(growth.jobsPerMonth).toBe(25);
    expect(scale.jobsPerMonth).toBe(-1); // Unlimited
  });

  it('should define agent access per plan', () => {
    const launch = getPlan('launch')!;
    const scale = getPlan('scale')!;

    expect(launch.agentAccess).toContain('content_agent');
    expect(launch.agentAccess).not.toContain('business_brain');
    expect(scale.agentAccess).toContain('business_brain');
  });
});

describe('Visual Capabilities', () => {
  it('should return capabilities for valid plan', () => {
    const caps = getVisualCapabilities('growth');
    expect(caps).not.toBeNull();
    expect(caps!.graphicsPerMonth).toBe(50);
    expect(caps!.videosPerMonth).toBe(10);
  });

  it('should return null for invalid plan', () => {
    expect(getVisualCapabilities('invalid')).toBeNull();
  });

  it('should report unlimited for scale plan', () => {
    const caps = getVisualCapabilities('scale');
    expect(caps!.graphicsPerMonth).toBe(-1);
    expect(caps!.videosPerMonth).toBe(-1);
    expect(caps!.brandKitsPerMonth).toBe(-1);
  });

  it('should restrict launch plan capabilities', () => {
    const caps = getVisualCapabilities('launch');
    expect(caps!.graphicsPerMonth).toBe(10);
    expect(caps!.videosPerMonth).toBe(2);
    expect(caps!.brandKitsPerMonth).toBe(1);
  });
});

describe('Model Support', () => {
  it('should check model support per plan', () => {
    expect(supportsVisualModel('launch', 'gemini_3_pro')).toBe(true);
    expect(supportsVisualModel('launch', 'nano_banana_2')).toBe(true);
    expect(supportsVisualModel('launch', 'dalle_3')).toBe(false);
    expect(supportsVisualModel('launch', 'veo3')).toBe(false);
  });

  it('should support all models on growth plan', () => {
    expect(supportsVisualModel('growth', 'gemini_3_pro')).toBe(true);
    expect(supportsVisualModel('growth', 'dalle_3')).toBe(true);
    expect(supportsVisualModel('growth', 'veo3')).toBe(true);
  });

  it('should support imagen2 only on scale', () => {
    expect(supportsVisualModel('launch', 'imagen2')).toBe(false);
    expect(supportsVisualModel('growth', 'imagen2')).toBe(false);
    expect(supportsVisualModel('scale', 'imagen2')).toBe(true);
  });

  it('should return false for invalid plan', () => {
    expect(supportsVisualModel('invalid', 'gemini_3_pro')).toBe(false);
  });
});

describe('Quota Functions', () => {
  it('should return graphics quota per plan', () => {
    expect(getGraphicsQuota('launch')).toBe(10);
    expect(getGraphicsQuota('growth')).toBe(50);
    expect(getGraphicsQuota('scale')).toBe(-1);
  });

  it('should return video quota per plan', () => {
    expect(getVideoQuota('launch')).toBe(2);
    expect(getVideoQuota('growth')).toBe(10);
    expect(getVideoQuota('scale')).toBe(-1);
  });

  it('should return brand kit quota per plan', () => {
    expect(getBrandKitQuota('launch')).toBe(1);
    expect(getBrandKitQuota('growth')).toBe(3);
    expect(getBrandKitQuota('scale')).toBe(-1);
  });

  it('should return 0 for invalid plan', () => {
    expect(getGraphicsQuota('invalid')).toBe(0);
    expect(getVideoQuota('invalid')).toBe(0);
    expect(getBrandKitQuota('invalid')).toBe(0);
  });
});

describe('AI Designer Access', () => {
  it('should deny access for launch plan', () => {
    expect(hasAIDesignerAccess('launch')).toBe(false);
  });

  it('should grant access for growth plan', () => {
    expect(hasAIDesignerAccess('growth')).toBe(true);
  });

  it('should grant access for scale plan', () => {
    expect(hasAIDesignerAccess('scale')).toBe(true);
  });

  it('should deny access for invalid plan', () => {
    expect(hasAIDesignerAccess('invalid')).toBe(false);
  });
});

describe('Video Features', () => {
  it('should return basic features for launch', () => {
    const features = getVideoFeatures('launch');
    expect(features).toContain('basic_editing');
    expect(features).toContain('auto_captions');
    expect(features).not.toContain('advanced_color_grading');
  });

  it('should return advanced features for growth', () => {
    const features = getVideoFeatures('growth');
    expect(features).toContain('transitions');
    expect(features).toContain('effects');
    expect(features).toContain('music_library');
  });

  it('should return all features for scale', () => {
    const features = getVideoFeatures('scale');
    expect(features).toContain('advanced_color_grading');
    expect(features).toContain('custom_animations');
    expect(features).toContain('stock_footage_integration');
    expect(features.length).toBeGreaterThan(5);
  });

  it('should return empty array for invalid plan', () => {
    expect(getVideoFeatures('invalid')).toEqual([]);
  });
});

describe('Price Formatting', () => {
  it('should format price with AUD by default', () => {
    expect(formatPrice(49)).toBe('$49.00 AUD/month');
    expect(formatPrice(129)).toBe('$129.00 AUD/month');
  });

  it('should format price with custom currency', () => {
    expect(formatPrice(49, 'USD')).toBe('$49.00 USD/month');
  });

  it('should format decimal prices', () => {
    expect(formatPrice(64.5)).toBe('$64.50 AUD/month');
  });
});

describe('Plan/Offer Validation', () => {
  it('should validate correct combinations', () => {
    expect(isValidPlanOfferCombination('launch', 'early_founders')).toBe(true);
    expect(isValidPlanOfferCombination('growth', 'growth_wave')).toBe(true);
    expect(isValidPlanOfferCombination('scale', 'standard')).toBe(true);
  });

  it('should reject invalid plan', () => {
    expect(isValidPlanOfferCombination('enterprise', 'standard')).toBe(false);
  });

  it('should reject invalid offer', () => {
    expect(isValidPlanOfferCombination('launch', 'super_deal')).toBe(false);
  });
});

describe('Industry Presets', () => {
  it('should return preset for valid industry', () => {
    const trades = getIndustryPreset('trades');
    expect(trades).not.toBeNull();
    expect(trades!.industry).toBe('trades');
  });

  it('should return null for invalid industry', () => {
    expect(getIndustryPreset('unknown_industry')).toBeNull();
  });

  it('should return all industries', () => {
    const industries = getAllIndustries();
    expect(industries.length).toBeGreaterThan(0);
  });

  it('should recommend plan for industry', () => {
    const plan = getRecommendedPlanForIndustry('trades');
    expect(plan).not.toBeNull();
    expect(plan!.code).toBeTruthy();
  });

  it('should return null recommendation for invalid industry', () => {
    expect(getRecommendedPlanForIndustry('invalid')).toBeNull();
  });
});

describe('Visual Generation Summary', () => {
  it('should return summary for all plans', () => {
    const summary = getVisualGenerationSummary();
    expect(summary).toHaveLength(3);
    expect(summary.map(s => s.planCode)).toEqual(
      expect.arrayContaining(['launch', 'growth', 'scale'])
    );
  });

  it('should include all capability fields', () => {
    const summary = getVisualGenerationSummary();
    const launch = summary.find(s => s.planCode === 'launch')!;

    expect(launch).toHaveProperty('graphicsPerMonth');
    expect(launch).toHaveProperty('videosPerMonth');
    expect(launch).toHaveProperty('brandKitsPerMonth');
    expect(launch).toHaveProperty('aiDesignerAccess');
    expect(launch).toHaveProperty('supportedModels');
  });
});

describe('Offer Tier Definitions', () => {
  it('should define early founders tier', () => {
    expect(OFFER_TIERS.early_founders.discountPercentage).toBe(50);
    expect(OFFER_TIERS.early_founders.limit).toBe(50);
  });

  it('should define growth wave tier', () => {
    expect(OFFER_TIERS.growth_wave.discountPercentage).toBe(25);
    expect(OFFER_TIERS.growth_wave.limit).toBe(200);
  });

  it('should define standard tier with no discount', () => {
    expect(OFFER_TIERS.standard.discountPercentage).toBe(0);
    expect(OFFER_TIERS.standard.limit).toBe(-1); // Unlimited
  });
});
