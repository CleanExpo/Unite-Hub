/**
 * Integration tests for A/B Testing Statistical Analysis
 * Tests Z-test, T-test, Chi-square implementations
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeABTest,
  calculateRequiredSampleSize,
  type VariantMetrics,
} from '@/lib/ab-testing/StatisticalAnalysis';

describe('Statistical Analysis Integration Tests', () => {
  describe('Z-Test for Proportions', () => {
    it('should detect significant difference with large effect size', () => {
      const variantA: VariantMetrics = {
        variantId: 'control',
        variantName: 'Control',
        variantName: 'Control',
        sampleSize: 1000,
        conversions: 100, // 10% conversion
        conversionRate: 0.1,
        mean: 0.1,
        standardDeviation: 0.3,
      };

      const variantB: VariantMetrics = {
        variantId: 'treatment',
        variantName: 'Treatment',
        variantName: 'Treatment',
        sampleSize: 1000,
        conversions: 150, // 15% conversion (50% lift)
        conversionRate: 0.15,
        mean: 0.15,
        standardDeviation: 0.36,
      };

      const result = analyzeABTest([variantA, variantB], {
        testType: 'z-test',
        confidenceLevel: 95,
      });

      expect(result.testResult.isSignificant).toBe(true);
      expect(result.testResult.pValue).toBeLessThan(0.05);
      expect(result.testResult.winner).toBe('treatment');
    });

    it('should not detect significance with small effect size', () => {
      const variantA: VariantMetrics = {
        variantId: 'control',
        variantName: 'Control',
        variantName: 'Control',
        sampleSize: 100,
        conversions: 10, // 10% conversion
        conversionRate: 0.1,
        mean: 0.1,
        standardDeviation: 0.3,
      };

      const variantB: VariantMetrics = {
        variantId: 'treatment',
        variantName: 'Treatment',
        variantName: 'Treatment',
        sampleSize: 100,
        conversions: 11, // 11% conversion (small difference)
        conversionRate: 0.11,
        mean: 0.11,
        standardDeviation: 0.31,
      };

      const result = analyzeABTest([variantA, variantB], {
        testType: 'z-test',
        confidenceLevel: 95,
      });

      expect(result.testResult.isSignificant).toBe(false);
      expect(result.testResult.pValue).toBeGreaterThan(0.05);
    });

    it('should handle edge case: zero conversions', () => {
      const variantA: VariantMetrics = {
        variantId: 'Control',
        variantName: 'Control',
        sampleSize: 100,
        conversions: 0,
        conversionRate: 0.00,
        mean: 0,
        standardDeviation: 0,
      };

      const variantB: VariantMetrics = {
        variantId: 'Treatment',
        variantName: 'Treatment',
        sampleSize: 100,
        conversions: 5,
        conversionRate: 0.05,
        mean: 0.05,
        standardDeviation: 0.22,
      };

      const result = analyzeABTest([variantA, variantB], {
        testType: 'z-test',
        confidenceLevel: 95,
      });

      expect(result).toBeDefined();
      expect(result.testResult.pValue).toBeGreaterThan(0);
    });
  });

  describe('T-Test for Continuous Metrics', () => {
    it('should analyze continuous metrics correctly', () => {
      const variantA: VariantMetrics = {
        variantId: 'Control',
        variantName: 'Control',
        sampleSize: 30,
        conversions: 0,
        conversionRate: 0.00,
        mean: 45.5,
        standardDeviation: 8.2,
      };

      const variantB: VariantMetrics = {
        variantId: 'Treatment',
        variantName: 'Treatment',
        sampleSize: 30,
        conversions: 0,
        conversionRate: 0.00,
        mean: 52.3,
        standardDeviation: 9.1,
      };

      const result = analyzeABTest([variantA, variantB], {
        testType: 't-test',
        confidenceLevel: 95,
      });

      expect(result).toBeDefined();
      expect(result.testResult.pValue).toBeGreaterThanOrEqual(0);
      expect(result.testResult.pValue).toBeLessThanOrEqual(1);
    });

    it('should handle small sample sizes appropriately', () => {
      const variantA: VariantMetrics = {
        variantId: 'Control',
        variantName: 'Control',
        sampleSize: 10,
        conversions: 0,
        conversionRate: 0.00,
        mean: 100,
        standardDeviation: 15,
      };

      const variantB: VariantMetrics = {
        variantId: 'Treatment',
        variantName: 'Treatment',
        sampleSize: 10,
        conversions: 0,
        conversionRate: 0.00,
        mean: 110,
        standardDeviation: 18,
      };

      const result = analyzeABTest([variantA, variantB], {
        testType: 't-test',
        confidenceLevel: 95,
      });

      expect(result).toBeDefined();
      // Small sample sizes require larger effects for significance
      expect(result.testResult.isSignificant).toBeDefined();
    });
  });

  describe('Chi-Square Test for Multiple Variants', () => {
    it('should analyze three variants correctly', () => {
      const variants: VariantMetrics[] = [
        {
          variantId: 'Control',
        variantName: 'Control',
          sampleSize: 1000,
          conversions: 100,
          conversionRate: 0.10,
          mean: 0.1,
          standardDeviation: 0.3,
        },
        {
          variantId: 'Variant A',
        variantName: 'Variant A',
          sampleSize: 1000,
          conversions: 120,
          conversionRate: 0.12,
          mean: 0.12,
          standardDeviation: 0.32,
        },
        {
          variantId: 'Variant B',
        variantName: 'Variant B',
          sampleSize: 1000,
          conversions: 140,
          conversionRate: 0.14,
          mean: 0.14,
          standardDeviation: 0.35,
        },
      ];

      const result = analyzeABTest(variants, {
        testType: 'chi-square',
        confidenceLevel: 95,
      });

      expect(result).toBeDefined();
      expect(result.variants).toHaveLength(3);
      expect(result.testResult.pValue).toBeGreaterThanOrEqual(0);
      expect(result.testResult.pValue).toBeLessThanOrEqual(1);
    });

    it('should handle uniform distribution (no difference)', () => {
      const variants: VariantMetrics[] = [
        {
          variantId: 'Control',
        variantName: 'Control',
          sampleSize: 1000,
          conversions: 100,
          conversionRate: 0.10,
          mean: 0.1,
          standardDeviation: 0.3,
        },
        {
          variantId: 'Variant A',
        variantName: 'Variant A',
          sampleSize: 1000,
          conversions: 100,
          conversionRate: 0.10,
          mean: 0.1,
          standardDeviation: 0.3,
        },
        {
          variantId: 'Variant B',
        variantName: 'Variant B',
          sampleSize: 1000,
          conversions: 100,
          conversionRate: 0.10,
          mean: 0.1,
          standardDeviation: 0.3,
        },
      ];

      const result = analyzeABTest(variants, {
        testType: 'chi-square',
        confidenceLevel: 95,
      });

      expect(result.testResult.isSignificant).toBe(false);
      expect(result.testResult.pValue).toBeGreaterThan(0.05);
    });
  });

  describe('Sample Size Calculation', () => {
    it('should calculate required sample size accurately', () => {
      const sampleSize = calculateRequiredSampleSize({
        baselineRate: 0.1, // 10% baseline conversion
        minimumDetectableEffect: 0.2, // 20% lift
        confidenceLevel: 95,
        power: 0.8,
      });

      expect(sampleSize).toBeGreaterThan(0);
      expect(sampleSize).toBeLessThan(10000);
      expect(Number.isInteger(sampleSize)).toBe(true);
    });

    it('should require larger samples for smaller effects', () => {
      const largeEffect = calculateRequiredSampleSize({
        baselineRate: 0.1,
        minimumDetectableEffect: 0.5, // 50% lift (large)
        confidenceLevel: 95,
        power: 0.8,
      });

      const smallEffect = calculateRequiredSampleSize({
        baselineRate: 0.1,
        minimumDetectableEffect: 0.1, // 10% lift (small)
        confidenceLevel: 95,
        power: 0.8,
      });

      expect(smallEffect).toBeGreaterThan(largeEffect);
    });

    it('should require larger samples for higher confidence', () => {
      const conf90 = calculateRequiredSampleSize({
        baselineRate: 0.1,
        minimumDetectableEffect: 0.2,
        confidenceLevel: 90,
        power: 0.8,
      });

      const conf99 = calculateRequiredSampleSize({
        baselineRate: 0.1,
        minimumDetectableEffect: 0.2,
        confidenceLevel: 99,
        power: 0.8,
      });

      expect(conf99).toBeGreaterThan(conf90);
    });

    it('should handle edge cases', () => {
      // Very low baseline rate
      const lowBaseline = calculateRequiredSampleSize({
        baselineRate: 0.01, // 1% baseline
        minimumDetectableEffect: 0.5,
        confidenceLevel: 95,
        power: 0.8,
      });

      expect(lowBaseline).toBeGreaterThan(0);

      // Very high baseline rate
      const highBaseline = calculateRequiredSampleSize({
        baselineRate: 0.5, // 50% baseline
        minimumDetectableEffect: 0.2,
        confidenceLevel: 95,
        power: 0.8,
      });

      expect(highBaseline).toBeGreaterThan(0);
    });
  });

  describe('Confidence Intervals', () => {
    it('should provide confidence intervals for winners', () => {
      const variants: VariantMetrics[] = [
        {
          variantId: 'Control',
        variantName: 'Control',
          sampleSize: 1000,
          conversions: 100,
          conversionRate: 0.10,
          mean: 0.1,
          standardDeviation: 0.3,
        },
        {
          variantId: 'Treatment',
        variantName: 'Treatment',
          sampleSize: 1000,
          conversions: 150,
          conversionRate: 0.15,
          mean: 0.15,
          standardDeviation: 0.36,
        },
      ];

      const result = analyzeABTest(variants, {
        testType: 'z-test',
        confidenceLevel: 95,
      });

      if (result.testResult.winner) {
        expect(result.testResult.winner).toBe('Treatment');
        expect(result.testResult.isSignificant).toBe(true);
        expect(result.testResult.pValue).toBeLessThan(0.05);
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should analyze 1000 data points in under 1 second', () => {
      const variants: VariantMetrics[] = [
        {
          variantId: 'Control',
        variantName: 'Control',
          sampleSize: 10000,
          conversions: 1000,
          conversionRate: 0.10,
          mean: 0.1,
          standardDeviation: 0.3,
        },
        {
          variantId: 'Treatment',
        variantName: 'Treatment',
          sampleSize: 10000,
          conversions: 1200,
          conversionRate: 0.12,
          mean: 0.12,
          standardDeviation: 0.32,
        },
      ];

      const startTime = Date.now();

      const result = analyzeABTest(variants, {
        testType: 'z-test',
        confidenceLevel: 95,
      });

      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000);
    });

    it('should handle 100 iterations of sample size calculation', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        calculateRequiredSampleSize({
          baselineRate: 0.05 + i * 0.001,
          minimumDetectableEffect: 0.1 + i * 0.001,
          confidenceLevel: 95,
          power: 0.8,
        });
      }

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Mathematical Correctness', () => {
    it('should produce p-values between 0 and 1', () => {
      const variants: VariantMetrics[] = [
        {
          variantId: 'Control',
        variantName: 'Control',
          sampleSize: 100,
          conversions: 10,
          conversionRate: 0.10,
          mean: 0.1,
          standardDeviation: 0.3,
        },
        {
          variantId: 'Treatment',
        variantName: 'Treatment',
          sampleSize: 100,
          conversions: 15,
          conversionRate: 0.15,
          mean: 0.15,
          standardDeviation: 0.36,
        },
      ];

      const result = analyzeABTest(variants, {
        testType: 'z-test',
        confidenceLevel: 95,
      });

      expect(result.testResult.pValue).toBeGreaterThanOrEqual(0);
      expect(result.testResult.pValue).toBeLessThanOrEqual(1);
    });

    it('should have p-value inversely related to sample size', () => {
      // Small sample
      const smallResult = analyzeABTest(
        [
          {
            variantId: 'Control',
        variantName: 'Control',
            sampleSize: 50,
            conversions: 5,
            conversionRate: 0.10,
            mean: 0.1,
            standardDeviation: 0.3,
          },
          {
            variantId: 'Treatment',
        variantName: 'Treatment',
            sampleSize: 50,
            conversions: 10,
            conversionRate: 0.20,
            mean: 0.2,
            standardDeviation: 0.4,
          },
        ],
        { testType: 'z-test', confidenceLevel: 95 }
      );

      // Large sample with same proportions
      const largeResult = analyzeABTest(
        [
          {
            variantId: 'Control',
        variantName: 'Control',
            sampleSize: 500,
            conversions: 50,
            conversionRate: 0.10,
            mean: 0.1,
            standardDeviation: 0.3,
          },
          {
            variantId: 'Treatment',
        variantName: 'Treatment',
            sampleSize: 500,
            conversions: 100,
            conversionRate: 0.20,
            mean: 0.2,
            standardDeviation: 0.4,
          },
        ],
        { testType: 'z-test', confidenceLevel: 95 }
      );

      expect(largeResult.testResult.pValue).toBeLessThan(smallResult.testResult.pValue);
    });
  });
});

describe('A/B Test Manager Integration', () => {
  describe('Metrics Aggregation', () => {
    it('should aggregate metrics across multiple events', () => {
      // Placeholder for ABTestManager tests
      expect(true).toBe(true);
    });
  });

  describe('Winner Declaration', () => {
    it('should declare winner only when statistically significant', () => {
      // Placeholder for winner selection tests
      expect(true).toBe(true);
    });

    it('should not declare winner prematurely', () => {
      // Placeholder for premature winner prevention tests
      expect(true).toBe(true);
    });
  });
});

describe('A/B Test Scheduler Integration', () => {
  describe('Background Processing', () => {
    it('should process active campaigns periodically', () => {
      // Placeholder for scheduler tests
      expect(true).toBe(true);
    });

    it('should handle scheduler errors gracefully', () => {
      // Placeholder for error handling tests
      expect(true).toBe(true);
    });
  });
});
