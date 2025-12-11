/**
 * Guardian X02: Network Anomaly Patterns Tests
 *
 * Test coverage for baseline model, benchmark builder, and anomaly detection.
 */

import { describe, it, expect } from 'vitest';
import {
  computeZScore,
  classifyAnomaly,
  severityToScore,
  shouldPersistAnomaly,
  type GuardianNetworkBaselineInput,
} from '@/lib/guardian/network/baselineModel';

describe('Guardian X02: Network Anomaly Patterns', () => {
  describe('Baseline Model', () => {
    it('should compute z-score correctly', () => {
      const zScore = computeZScore(100, 50, 10);
      expect(zScore).toBe(5); // (100-50)/10 = 5
    });

    it('should handle undefined stddev', () => {
      const zScore = computeZScore(100, 50, 0);
      expect(zScore).toBeUndefined();
    });

    it('should classify elevated anomaly (high)', () => {
      const input: GuardianNetworkBaselineInput = {
        tenantMetricValue: 150,
        cohortStats: {
          p50: 100,
          mean: 100,
          stddev: 10,
          sampleSize: 42,
          cohortKey: 'global',
        },
      };

      const result = classifyAnomaly(input);

      expect(result.anomalyType).toBe('elevated');
      expect(result.severity).toBe('high');
      expect(result.deltaRatio).toBe(0.5); // (150-100)/100
    });

    it('should classify elevated anomaly (critical)', () => {
      const input: GuardianNetworkBaselineInput = {
        tenantMetricValue: 300,
        cohortStats: {
          p50: 100,
          mean: 100,
          stddev: 10,
          sampleSize: 42,
          cohortKey: 'global',
        },
      };

      const result = classifyAnomaly(input);

      expect(result.anomalyType).toBe('elevated');
      expect(result.severity).toBe('critical');
      expect(result.deltaRatio).toBe(2); // (300-100)/100
    });

    it('should classify suppressed anomaly', () => {
      const input: GuardianNetworkBaselineInput = {
        tenantMetricValue: 40,
        cohortStats: {
          p50: 100,
          sampleSize: 42,
          cohortKey: 'global',
        },
      };

      const result = classifyAnomaly(input);

      expect(result.anomalyType).toBe('suppressed');
      expect(result.severity).toBe('medium');
      expect(result.deltaRatio).toBe(-0.6); // (40-100)/100
    });

    it('should classify no anomaly', () => {
      const input: GuardianNetworkBaselineInput = {
        tenantMetricValue: 105,
        cohortStats: {
          p50: 100,
          sampleSize: 42,
          cohortKey: 'global',
        },
      };

      const result = classifyAnomaly(input);

      expect(result.anomalyType).toBe('none');
      expect(result.severity).toBe('none');
    });

    it('should compute severity scores', () => {
      expect(severityToScore('critical')).toBe(4);
      expect(severityToScore('high')).toBe(3);
      expect(severityToScore('medium')).toBe(2);
      expect(severityToScore('low')).toBe(1);
      expect(severityToScore('none')).toBe(0);
    });

    it('should filter by minimum severity', () => {
      expect(shouldPersistAnomaly('critical', 'high')).toBe(true);
      expect(shouldPersistAnomaly('high', 'high')).toBe(true);
      expect(shouldPersistAnomaly('medium', 'high')).toBe(false);
      expect(shouldPersistAnomaly('none', 'high')).toBe(false);
    });

    it('should persist all anomalies when no min severity', () => {
      expect(shouldPersistAnomaly('low')).toBe(true);
      expect(shouldPersistAnomaly('critical')).toBe(true);
    });

    it('should never persist none severity', () => {
      expect(shouldPersistAnomaly('none')).toBe(false);
    });

    it('should generate explanations', () => {
      const input: GuardianNetworkBaselineInput = {
        tenantMetricValue: 250,
        cohortStats: {
          p50: 100,
          mean: 100,
          stddev: 10,
          sampleSize: 42,
          cohortKey: 'region:apac',
        },
      };

      const result = classifyAnomaly(input);

      expect(result.explanation).toBeDefined();
      expect(result.explanation).toContain('region:apac');
      expect(result.explanation).toContain('150'); // 150% above
    });
  });

  describe('Privacy Guarantees', () => {
    it('should not expose individual tenant identifiers', () => {
      const input: GuardianNetworkBaselineInput = {
        tenantMetricValue: 100,
        cohortStats: {
          p50: 50,
          sampleSize: 10,
          cohortKey: 'global', // Only anonymous cohort key
        },
      };

      const result = classifyAnomaly(input);

      // Result contains no tenant IDs, only aggregated cohort stats
      expect(result.explanation).not.toContain('tenant-');
      expect(result.explanation).not.toContain('workspace-');
    });

    it('should use only aggregated cohort statistics', () => {
      const input: GuardianNetworkBaselineInput = {
        tenantMetricValue: 100,
        cohortStats: {
          p50: 80,
          p90: 120,
          mean: 85,
          stddev: 15,
          sampleSize: 50,
          cohortKey: 'size:medium',
        },
      };

      const result = classifyAnomaly(input);

      // Uses aggregated stats; no individual metrics
      expect(result.zScore).toBeDefined(); // Computed from mean/stddev
      expect(result.deltaRatio).toBeDefined(); // Computed from p50
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-value metrics', () => {
      const input: GuardianNetworkBaselineInput = {
        tenantMetricValue: 0,
        cohortStats: {
          p50: 50,
          sampleSize: 10,
          cohortKey: 'global',
        },
      };

      const result = classifyAnomaly(input);

      expect(result.anomalyType).toBe('suppressed');
      expect(result.severity).toBe('medium');
    });

    it('should handle very large values', () => {
      const input: GuardianNetworkBaselineInput = {
        tenantMetricValue: 1e6,
        cohortStats: {
          p50: 100,
          mean: 100,
          stddev: 10,
          sampleSize: 42,
          cohortKey: 'global',
        },
      };

      const result = classifyAnomaly(input);

      expect(result.anomalyType).toBe('elevated');
      expect(result.severity).toBe('critical');
    });

    it('should handle missing cohort stats gracefully', () => {
      const input: GuardianNetworkBaselineInput = {
        tenantMetricValue: 100,
        cohortStats: {
          sampleSize: 5,
          cohortKey: 'global',
          // No p50, mean, stddev
        },
      };

      const result = classifyAnomaly(input);

      // Falls back to no classification
      expect(result.anomalyType).toBe('none');
      expect(result.zScore).toBeUndefined();
      expect(result.deltaRatio).toBeUndefined();
    });

    it('should handle small sample sizes', () => {
      const input: GuardianNetworkBaselineInput = {
        tenantMetricValue: 100,
        cohortStats: {
          p50: 50,
          sampleSize: 1, // Minimal cohort
          cohortKey: 'global',
        },
      };

      const result = classifyAnomaly(input);

      // Still classifies; sample_size filtering happens at persistence layer
      expect(result.anomalyType).toBe('elevated');
    });
  });
});
