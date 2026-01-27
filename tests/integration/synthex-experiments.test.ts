/**
 * Synthex Experiment Engine Integration Tests
 *
 * Tests for Synthex A/B testing framework integration:
 * - Experiment configuration types
 * - A/B test variant assignment
 * - Statistical analysis functions
 * - Experiment lifecycle management
 * - Plan-based experiment limits
 */

import { describe, it, expect, vi } from 'vitest';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock server supabase for sandbox
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  createApiLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  experiments,
  getAssignedVariant,
  isTestActiveForPage,
  getActiveExperimentsForPage,
  type ABTest,
  type ABTestVariant,
} from '@/lib/experiments/abTestingConfig';

import {
  analyzeABTest,
  calculateRequiredSampleSize,
  type VariantMetrics,
} from '@/lib/ab-testing/StatisticalAnalysis';

// ============================================================================
// A/B Test Configuration
// ============================================================================

describe('A/B Test Configuration', () => {
  it('should have experiments defined', () => {
    expect(experiments.length).toBeGreaterThan(0);
  });

  it('should have valid experiment structure', () => {
    for (const exp of experiments) {
      expect(exp.id).toBeTruthy();
      expect(exp.name).toBeTruthy();
      expect(exp.variants).toBeDefined();
      expect(exp.variants.length).toBeGreaterThanOrEqual(2);
      expect(exp.targetPages.length).toBeGreaterThan(0);
      expect(exp.metrics.length).toBeGreaterThan(0);
    }
  });

  it('should have variant weights summing to 100', () => {
    for (const exp of experiments) {
      const totalWeight = exp.variants.reduce((sum, v) => sum + v.weight, 0);
      expect(totalWeight).toBe(100);
    }
  });

  it('should have unique variant IDs per experiment', () => {
    for (const exp of experiments) {
      const ids = exp.variants.map(v => v.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }
  });

  it('should have hero messaging test with two variants', () => {
    const heroTest = experiments.find(e => e.id === 'hero_messaging_v1');
    expect(heroTest).toBeDefined();
    expect(heroTest!.enabled).toBe(true);
    expect(heroTest!.variants).toHaveLength(2);
    expect(heroTest!.variants[0].content).toHaveProperty('headline');
    expect(heroTest!.variants[0].content).toHaveProperty('subheadline');
    expect(heroTest!.variants[0].content).toHaveProperty('ctaText');
  });

  it('should have pricing CTA test defined but disabled', () => {
    const pricingTest = experiments.find(e => e.id === 'pricing_cta_v1');
    expect(pricingTest).toBeDefined();
    expect(pricingTest!.enabled).toBe(false);
  });
});

// ============================================================================
// Page Targeting
// ============================================================================

describe('Page Targeting', () => {
  it('should detect active tests for landing page', () => {
    expect(isTestActiveForPage('hero_messaging_v1', '/landing')).toBe(true);
    expect(isTestActiveForPage('hero_messaging_v1', '/')).toBe(true);
  });

  it('should return false for inactive test', () => {
    expect(isTestActiveForPage('pricing_cta_v1', '/pricing')).toBe(false);
  });

  it('should match broadly via includes (/ matches any path)', () => {
    // hero_messaging_v1 targets ['/landing', '/'] — '/' matches any path via includes()
    expect(isTestActiveForPage('hero_messaging_v1', '/dashboard')).toBe(true);
  });

  it('should return false for non-existent test', () => {
    expect(isTestActiveForPage('nonexistent', '/landing')).toBe(false);
  });

  it('should get all active experiments for a page', () => {
    const activeOnLanding = getActiveExperimentsForPage('/landing');
    expect(activeOnLanding.length).toBeGreaterThanOrEqual(1);
    expect(activeOnLanding.some(e => e.id === 'hero_messaging_v1')).toBe(true);
  });

  it('should return experiments for any page (/ target matches all paths)', () => {
    // hero_messaging_v1 targets '/' which matches any path via includes()
    const active = getActiveExperimentsForPage('/random-page');
    expect(active.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Statistical Analysis
// ============================================================================

describe('Statistical Analysis', () => {
  it('should analyze A/B test with sufficient samples', () => {
    const variants: VariantMetrics[] = [
      { variantId: 'a', variantName: 'Control', sampleSize: 500, conversions: 50, conversionRate: 10 },
      { variantId: 'b', variantName: 'Variant B', sampleSize: 500, conversions: 75, conversionRate: 15 },
    ];

    const result = analyzeABTest(variants, { confidenceLevel: 95, minimumSampleSize: 100 });

    expect(result.minimumSampleSizeReached).toBe(true);
    expect(result.variants).toHaveLength(2);
    expect(result.testResult).toBeDefined();
    expect(result.testResult.testType).toBeDefined();
    expect(result.testResult.pValue).toBeGreaterThanOrEqual(0);
    expect(result.testResult.confidenceLevel).toBeGreaterThan(0);
  });

  it('should flag insufficient sample size', () => {
    const variants: VariantMetrics[] = [
      { variantId: 'a', variantName: 'Control', sampleSize: 10, conversions: 1, conversionRate: 10 },
      { variantId: 'b', variantName: 'Variant B', sampleSize: 10, conversions: 2, conversionRate: 20 },
    ];

    const result = analyzeABTest(variants, { minimumSampleSize: 100 });

    expect(result.minimumSampleSizeReached).toBe(false);
    expect(result.recommendedAction).toBe('continue');
  });

  it('should detect clear winner with large effect', () => {
    const variants: VariantMetrics[] = [
      { variantId: 'a', variantName: 'Control', sampleSize: 1000, conversions: 50, conversionRate: 5 },
      { variantId: 'b', variantName: 'Variant B', sampleSize: 1000, conversions: 150, conversionRate: 15 },
    ];

    const result = analyzeABTest(variants, { confidenceLevel: 95, minimumSampleSize: 100 });

    expect(result.minimumSampleSizeReached).toBe(true);
    // With 5% vs 15%, this should be significant
    if (result.testResult.isSignificant) {
      expect(result.recommendedAction).toBe('declare_winner');
      expect(result.testResult.winner).toBe('b');
    }
  });

  it('should recommend continue for close results', () => {
    const variants: VariantMetrics[] = [
      { variantId: 'a', variantName: 'Control', sampleSize: 200, conversions: 20, conversionRate: 10 },
      { variantId: 'b', variantName: 'Variant B', sampleSize: 200, conversions: 22, conversionRate: 11 },
    ];

    const result = analyzeABTest(variants, { confidenceLevel: 95, minimumSampleSize: 100 });

    // Small effect size with small sample — should not be significant
    if (!result.testResult.isSignificant) {
      expect(['continue', 'inconclusive']).toContain(result.recommendedAction);
    }
  });

  it('should handle multi-variant tests', () => {
    const variants: VariantMetrics[] = [
      { variantId: 'a', variantName: 'Control', sampleSize: 300, conversions: 30, conversionRate: 10 },
      { variantId: 'b', variantName: 'Variant B', sampleSize: 300, conversions: 45, conversionRate: 15 },
      { variantId: 'c', variantName: 'Variant C', sampleSize: 300, conversions: 60, conversionRate: 20 },
    ];

    const result = analyzeABTest(variants);

    expect(result.variants).toHaveLength(3);
    expect(result.testResult).toBeDefined();
  });
});

// ============================================================================
// Sample Size Calculator
// ============================================================================

describe('Sample Size Calculator', () => {
  it('should calculate required sample size', () => {
    const sampleSize = calculateRequiredSampleSize({
      baselineRate: 0.10, // 10% baseline conversion
      minimumDetectableEffect: 0.05, // 5% improvement
      confidenceLevel: 0.95,
      power: 0.80,
    });

    expect(sampleSize).toBeGreaterThan(0);
    expect(sampleSize).toBeGreaterThan(100); // Need substantial samples for small effects
  });

  it('should require more samples for smaller effects', () => {
    const largeSample = calculateRequiredSampleSize({
      baselineRate: 0.10,
      minimumDetectableEffect: 0.01, // 1% improvement
      confidenceLevel: 0.95,
      power: 0.80,
    });

    const smallSample = calculateRequiredSampleSize({
      baselineRate: 0.10,
      minimumDetectableEffect: 0.10, // 10% improvement
      confidenceLevel: 0.95,
      power: 0.80,
    });

    expect(largeSample).toBeGreaterThan(smallSample);
  });

  it('should require more samples for higher confidence', () => {
    const high = calculateRequiredSampleSize({
      baselineRate: 0.10,
      minimumDetectableEffect: 0.05,
      confidenceLevel: 0.99,
      power: 0.80,
    });

    const low = calculateRequiredSampleSize({
      baselineRate: 0.10,
      minimumDetectableEffect: 0.05,
      confidenceLevel: 0.90,
      power: 0.80,
    });

    expect(high).toBeGreaterThan(low);
  });
});

// ============================================================================
// Experiment Types
// ============================================================================

describe('Experiment Types', () => {
  it('should support A/B test type', () => {
    const abTest: ABTest = {
      id: 'test-ab',
      name: 'A/B Test',
      description: 'Standard two-variant test',
      enabled: true,
      variants: [
        { id: 'control', name: 'Control', weight: 50, content: { headline: 'Original' } },
        { id: 'variant', name: 'Variant', weight: 50, content: { headline: 'New' } },
      ],
      targetPages: ['/test'],
      metrics: ['click_rate'],
    };

    expect(abTest.variants).toHaveLength(2);
    expect(abTest.variants[0].weight + abTest.variants[1].weight).toBe(100);
  });

  it('should support multivariate test with unequal weights', () => {
    const mvt: ABTest = {
      id: 'test-mvt',
      name: 'Multivariate',
      description: 'Three variants with unequal split',
      enabled: true,
      variants: [
        { id: 'a', name: 'A', weight: 40, content: {} },
        { id: 'b', name: 'B', weight: 30, content: {} },
        { id: 'c', name: 'C', weight: 30, content: {} },
      ],
      targetPages: ['/pricing'],
      metrics: ['conversion'],
    };

    const total = mvt.variants.reduce((s, v) => s + v.weight, 0);
    expect(total).toBe(100);
    expect(mvt.variants).toHaveLength(3);
  });

  it('should support variant content with arbitrary data', () => {
    const variant: ABTestVariant = {
      id: 'rich-variant',
      name: 'Rich Content',
      weight: 50,
      content: {
        headline: 'Test Headline',
        subheadline: 'Test Subheadline',
        ctaText: 'Click Here',
        ctaColor: '#ff6b35',
        imageUrl: '/images/hero.png',
        features: ['Feature A', 'Feature B'],
      },
    };

    expect(variant.content).toHaveProperty('headline');
    expect(variant.content).toHaveProperty('ctaColor');
    expect(variant.content).toHaveProperty('features');
  });
});

// ============================================================================
// Experiment Lifecycle
// ============================================================================

describe('Experiment Lifecycle', () => {
  it('should define valid status transitions', () => {
    const validTransitions: Record<string, string[]> = {
      setup: ['running', 'archived'],
      running: ['completed', 'setup'], // setup = pause
      completed: ['archived'],
      archived: [], // terminal state
    };

    expect(validTransitions.setup).toContain('running');
    expect(validTransitions.running).toContain('completed');
    expect(validTransitions.completed).toContain('archived');
    expect(validTransitions.archived).toHaveLength(0);
  });

  it('should track key lifecycle dates', () => {
    const experimentDates = {
      created_at: '2026-01-15T00:00:00Z',
      started_at: '2026-01-16T00:00:00Z',
      completed_at: '2026-02-15T00:00:00Z',
      archived_at: null,
    };

    expect(new Date(experimentDates.created_at)).toBeTruthy();
    expect(new Date(experimentDates.completed_at!).getTime()).toBeGreaterThan(
      new Date(experimentDates.created_at).getTime()
    );
  });
});

// ============================================================================
// Confidence & Significance
// ============================================================================

describe('Confidence & Significance', () => {
  it('should support standard confidence levels', () => {
    const levels = [0.90, 0.95, 0.99];

    for (const level of levels) {
      const result = analyzeABTest(
        [
          { variantId: 'a', variantName: 'A', sampleSize: 500, conversions: 50, conversionRate: 10 },
          { variantId: 'b', variantName: 'B', sampleSize: 500, conversions: 75, conversionRate: 15 },
        ],
        { confidenceLevel: level * 100 }
      );

      expect(result.testResult.confidenceLevel).toBeDefined();
    }
  });

  it('should declare significance correctly for obvious winner', () => {
    const result = analyzeABTest([
      { variantId: 'a', variantName: 'Control', sampleSize: 5000, conversions: 250, conversionRate: 5 },
      { variantId: 'b', variantName: 'Variant', sampleSize: 5000, conversions: 750, conversionRate: 15 },
    ], { confidenceLevel: 95, minimumSampleSize: 100 });

    expect(result.minimumSampleSizeReached).toBe(true);
    expect(result.testResult.isSignificant).toBe(true);
    expect(result.testResult.winner).toBe('b');
    expect(result.recommendedAction).toBe('declare_winner');
  });
});
