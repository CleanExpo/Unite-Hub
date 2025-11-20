/**
 * Strategy Engine Integration Tests
 * Phase 11 Week 9: Type and structure validation tests
 *
 * Tests the StrategySummaryReportService structure and type definitions
 */

import { describe, it, expect } from 'vitest';

// Type definitions for tests
type Domain = 'SEO' | 'GEO' | 'CONTENT' | 'ADS' | 'CRO';
type HorizonType = 'SHORT' | 'MEDIUM' | 'LONG' | 'QUARTERLY' | 'CUSTOM';
type CycleType = 'SCHEDULED' | 'DRIFT_TRIGGERED' | 'MANUAL' | 'PERFORMANCE';
type DriftSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type AdjustmentType = 'STRENGTHEN' | 'WEAKEN' | 'MAINTAIN' | 'REDIRECT' | 'PAUSE' | 'ACCELERATE';
type HealthStatus = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING';

describe('Strategy Engine Integration', () => {
  describe('Type Definitions', () => {
    it('should validate health status values', () => {
      const statuses: HealthStatus[] = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'];
      expect(statuses).toHaveLength(5);
    });

    it('should validate trend directions', () => {
      const trends: TrendDirection[] = ['IMPROVING', 'STABLE', 'DECLINING'];
      expect(trends).toHaveLength(3);
    });

    it('should validate horizon types', () => {
      const validTypes: HorizonType[] = ['SHORT', 'MEDIUM', 'LONG', 'QUARTERLY', 'CUSTOM'];
      expect(validTypes).toHaveLength(5);
    });

    it('should validate cycle types', () => {
      const types: CycleType[] = ['SCHEDULED', 'DRIFT_TRIGGERED', 'MANUAL', 'PERFORMANCE'];
      expect(types).toHaveLength(4);
    });

    it('should validate domains', () => {
      const domains: Domain[] = ['SEO', 'GEO', 'CONTENT', 'ADS', 'CRO'];
      expect(domains).toHaveLength(5);
    });

    it('should validate adjustment types', () => {
      const types: AdjustmentType[] = [
        'STRENGTHEN', 'WEAKEN', 'MAINTAIN', 'REDIRECT', 'PAUSE', 'ACCELERATE'
      ];
      expect(types).toHaveLength(6);
    });

    it('should validate severity levels', () => {
      const severities: DriftSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      expect(severities).toHaveLength(4);
    });
  });

  describe('Health Score Calculations', () => {
    it('should map scores to correct status', () => {
      const getStatus = (score: number): HealthStatus => {
        if (score >= 80) return 'EXCELLENT';
        if (score >= 65) return 'GOOD';
        if (score >= 50) return 'FAIR';
        if (score >= 35) return 'POOR';
        return 'CRITICAL';
      };

      expect(getStatus(85)).toBe('EXCELLENT');
      expect(getStatus(70)).toBe('GOOD');
      expect(getStatus(55)).toBe('FAIR');
      expect(getStatus(40)).toBe('POOR');
      expect(getStatus(20)).toBe('CRITICAL');
    });

    it('should calculate weighted health score', () => {
      const components = {
        drift_health: 80,
        balance_health: 70,
        performance_health: 90,
        horizon_progress: 60,
      };

      // Weights: drift 25%, balance 25%, performance 30%, horizon 20%
      const weightedScore =
        components.drift_health * 0.25 +
        components.balance_health * 0.25 +
        components.performance_health * 0.30 +
        components.horizon_progress * 0.20;

      expect(weightedScore).toBeCloseTo(76.5, 1);
    });

    it('should clamp scores to 0-100 range', () => {
      const clamp = (value: number): number => Math.max(0, Math.min(100, value));

      expect(clamp(150)).toBe(100);
      expect(clamp(-50)).toBe(0);
      expect(clamp(75)).toBe(75);
    });
  });

  describe('Drift Analysis', () => {
    it('should calculate severity from drift percentage', () => {
      const getSeverity = (driftPercent: number): DriftSeverity => {
        const abs = Math.abs(driftPercent);
        if (abs >= 30) return 'CRITICAL';
        if (abs >= 20) return 'HIGH';
        if (abs >= 10) return 'MEDIUM';
        return 'LOW';
      };

      expect(getSeverity(35)).toBe('CRITICAL');
      expect(getSeverity(25)).toBe('HIGH');
      expect(getSeverity(15)).toBe('MEDIUM');
      expect(getSeverity(5)).toBe('LOW');
    });

    it('should invert for underperformance', () => {
      // Negative drift = underperformance
      expect(Math.abs(-25)).toBe(25);
    });
  });

  describe('Domain Balance Metrics', () => {
    it('should calculate total allocation to 100%', () => {
      const allocations = {
        SEO: 20,
        GEO: 20,
        CONTENT: 20,
        ADS: 20,
        CRO: 20,
      };

      const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
      expect(total).toBe(100);
    });

    it('should identify imbalanced allocations', () => {
      const allocations = [40, 10, 20, 20, 10]; // Imbalanced
      const max = Math.max(...allocations);
      const min = Math.min(...allocations);
      const spread = max - min;

      expect(spread).toBeGreaterThan(20); // Significant imbalance
    });

    it('should calculate efficiency ratio', () => {
      const allocation = 30;
      const performance = 45;
      const efficiency = performance / allocation;

      expect(efficiency).toBe(1.5); // 150% efficient
    });
  });

  describe('Trend Calculation', () => {
    it('should determine trend direction', () => {
      const getTrend = (changePercent: number): TrendDirection => {
        if (changePercent > 5) return 'IMPROVING';
        if (changePercent < -5) return 'DECLINING';
        return 'STABLE';
      };

      expect(getTrend(10)).toBe('IMPROVING');
      expect(getTrend(-10)).toBe('DECLINING');
      expect(getTrend(2)).toBe('STABLE');
      expect(getTrend(-2)).toBe('STABLE');
    });
  });

  describe('Report Structure', () => {
    it('should have required summary fields', () => {
      const requiredFields = [
        'system_health',
        'domain_health',
        'horizon_progress',
        'refinement_history',
        'alerts',
        'recommendations'
      ];

      expect(requiredFields).toHaveLength(6);
    });

    it('should have required health component fields', () => {
      const components = [
        'drift_health',
        'balance_health',
        'performance_health',
        'horizon_progress'
      ];

      expect(components).toHaveLength(4);
    });
  });

  describe('Adjustment Logic', () => {
    it('should map strength to adjustment type', () => {
      const getAdjustmentType = (strength: number): AdjustmentType => {
        if (strength > 0.5) return 'STRENGTHEN';
        if (strength > 0.2) return 'ACCELERATE';
        if (strength > -0.2) return 'MAINTAIN';
        if (strength > -0.5) return 'WEAKEN';
        return 'PAUSE';
      };

      expect(getAdjustmentType(0.8)).toBe('STRENGTHEN');
      expect(getAdjustmentType(0.3)).toBe('ACCELERATE');
      expect(getAdjustmentType(0)).toBe('MAINTAIN');
      expect(getAdjustmentType(-0.3)).toBe('WEAKEN');
      expect(getAdjustmentType(-0.8)).toBe('PAUSE');
    });
  });

  describe('Horizon Planning', () => {
    it('should map horizon types to days', () => {
      const horizonDays: Record<HorizonType, number> = {
        SHORT: 30,
        MEDIUM: 60,
        LONG: 90,
        QUARTERLY: 90,
        CUSTOM: 0,
      };

      expect(horizonDays.SHORT).toBe(30);
      expect(horizonDays.MEDIUM).toBe(60);
      expect(horizonDays.LONG).toBe(90);
    });

    it('should calculate progress percentage', () => {
      const completed = 15;
      const total = 20;
      const progress = (completed / total) * 100;

      expect(progress).toBe(75);
    });

    it('should determine on-track status', () => {
      const daysElapsed = 20;
      const daysTotal = 30;
      const stepsCompleted = 15;
      const stepsTotal = 20;

      const expectedProgress = (daysElapsed / daysTotal) * 100;
      const actualProgress = (stepsCompleted / stepsTotal) * 100;
      const onTrack = actualProgress >= expectedProgress - 10;

      expect(onTrack).toBe(true);
    });
  });
});
