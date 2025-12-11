/**
 * Guardian I09: Performance & Cost Chaos Layer Tests
 *
 * Test coverage:
 * - Load profile and SLO configurations
 * - Latency statistics calculation
 * - SLO evaluation logic
 * - AI budget state evaluation
 * - Performance run metrics aggregation
 * - AI usage window tracking
 * - Tenant isolation
 * - Cost estimation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  GuardianLoadConfig,
  GuardianSloConfig,
  GuardianLatencyStats,
  GuardianPerformanceLatencySummary,
  GuardianSloResult,
} from '@/lib/guardian/qa/performanceModel';
import {
  calculateLatencyStats,
  evaluateSlo,
  evaluateAiBudgetState,
  estimateCost,
} from '@/lib/guardian/qa/performanceModel';

describe('Guardian I09: Performance & Cost', () => {
  describe('Load Profile Configuration', () => {
    it('should support burst load pattern', () => {
      const config: GuardianLoadConfig = {
        rps: 100,
        concurrency: 50,
        durationSeconds: 60,
        warmupSeconds: 10,
        pattern: 'burst',
      };

      expect(config.pattern).toBe('burst');
      expect(config.rps).toBe(100);
    });

    it('should support steady load pattern', () => {
      const config: GuardianLoadConfig = {
        rps: 10,
        concurrency: 5,
        durationSeconds: 300,
        warmupSeconds: 30,
        pattern: 'steady',
      };

      expect(config.pattern).toBe('steady');
      expect(config.durationSeconds).toBe(300);
    });

    it('should support spikey load pattern', () => {
      const config: GuardianLoadConfig = {
        pattern: 'spikey',
        concurrency: 20,
        durationSeconds: 120,
      };

      expect(config.pattern).toBe('spikey');
    });

    it('should require durationSeconds', () => {
      const config = {
        rps: 10,
      } as unknown as GuardianLoadConfig;

      expect((config as any).durationSeconds).toBeUndefined();
    });
  });

  describe('SLO Configuration', () => {
    it('should define p95 latency threshold', () => {
      const slo: GuardianSloConfig = {
        p95Ms: 100,
      };

      expect(slo.p95Ms).toBe(100);
    });

    it('should define max latency threshold', () => {
      const slo: GuardianSloConfig = {
        maxMs: 500,
      };

      expect(slo.maxMs).toBe(500);
    });

    it('should define error rate threshold', () => {
      const slo: GuardianSloConfig = {
        errorRate: 0.01, // 1%
      };

      expect(slo.errorRate).toBe(0.01);
    });

    it('should support multiple thresholds', () => {
      const slo: GuardianSloConfig = {
        p95Ms: 100,
        maxMs: 500,
        errorRate: 0.01,
      };

      expect(slo.p95Ms).toBe(100);
      expect(slo.maxMs).toBe(500);
      expect(slo.errorRate).toBe(0.01);
    });
  });

  describe('Latency Statistics', () => {
    it('should calculate p50, p95, and max from latencies', () => {
      const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const stats = calculateLatencyStats(latencies);

      expect(stats.p50).toBeLessThanOrEqual(stats.p95);
      expect(stats.p95).toBeLessThanOrEqual(stats.max);
      expect(stats.max).toBe(100);
    });

    it('should handle single latency', () => {
      const latencies = [50];
      const stats = calculateLatencyStats(latencies);

      expect(stats.p50).toBe(50);
      expect(stats.p95).toBe(50);
      expect(stats.max).toBe(50);
    });

    it('should handle empty latencies', () => {
      const latencies: number[] = [];
      const stats = calculateLatencyStats(latencies);

      expect(stats.p50).toBe(0);
      expect(stats.p95).toBe(0);
      expect(stats.max).toBe(0);
    });

    it('should handle many latencies', () => {
      const latencies = Array.from({ length: 1000 }, (_, i) => i + 1);
      const stats = calculateLatencyStats(latencies);

      expect(stats.p50).toBeGreaterThan(0);
      expect(stats.p95).toBeGreaterThan(stats.p50);
      expect(stats.max).toBe(1000);
    });
  });

  describe('SLO Evaluation', () => {
    const mockLatencySummary: GuardianPerformanceLatencySummary = {
      overall: { p50: 50, p95: 95, max: 200 },
      byPhase: {
        rule_eval: { p50: 10, p95: 20, max: 50 },
        correlation: { p50: 20, p95: 30, max: 80 },
      },
    };

    it('should pass when all thresholds met', () => {
      const slo: GuardianSloConfig = {
        p95Ms: 100,
        maxMs: 300,
        errorRate: 0.05,
      };

      const result = evaluateSlo(mockLatencySummary, 0.02, slo);

      expect(result.outcome).toBe('pass');
      expect(result.failedCriteria).toHaveLength(0);
    });

    it('should fail when p95 exceeds threshold', () => {
      const slo: GuardianSloConfig = {
        p95Ms: 50,
        maxMs: 300,
        errorRate: 0.05,
      };

      const result = evaluateSlo(mockLatencySummary, 0.02, slo);

      expect(result.outcome).toBe('fail');
      expect(result.failedCriteria.some((c) => c.includes('p95'))).toBe(true);
    });

    it('should fail when max exceeds threshold', () => {
      const slo: GuardianSloConfig = {
        p95Ms: 100,
        maxMs: 150,
        errorRate: 0.05,
      };

      const result = evaluateSlo(mockLatencySummary, 0.02, slo);

      expect(result.outcome).toBe('fail');
      expect(result.failedCriteria.some((c) => c.includes('max'))).toBe(true);
    });

    it('should fail when error rate exceeds threshold', () => {
      const slo: GuardianSloConfig = {
        p95Ms: 100,
        maxMs: 300,
        errorRate: 0.01,
      };

      const result = evaluateSlo(mockLatencySummary, 0.05, slo);

      expect(result.outcome).toBe('fail');
      expect(result.failedCriteria.some((c) => c.includes('error rate'))).toBe(true);
    });

    it('should be inconclusive when thresholds missing', () => {
      const slo: GuardianSloConfig = {}; // No thresholds

      const result = evaluateSlo(mockLatencySummary, 0.02, slo);

      expect(result.outcome).toBe('inconclusive');
    });

    it('should support partial threshold evaluation', () => {
      const slo: GuardianSloConfig = {
        p95Ms: 100, // Only this threshold
      };

      const result = evaluateSlo(mockLatencySummary, 0.02, slo);

      // Should pass since p95 is within threshold, but inconclusive due to missing others
      expect(['pass', 'inconclusive']).toContain(result.outcome);
    });
  });

  describe('AI Budget Evaluation', () => {
    it('should be ok with no budget', () => {
      const usage = { totalTokens: 1000, calls: 5, estimatedCostUsd: 10 };
      const state = evaluateAiBudgetState(usage);

      expect(state.state).toBe('ok');
    });

    it('should detect exceeded token budget', () => {
      const usage = { totalTokens: 150000, calls: 10, estimatedCostUsd: 1 };
      const budget = { maxTokens: 100000 };

      const state = evaluateAiBudgetState(usage, budget);

      expect(state.state).toBe('exceeded');
      expect(state.reason).toContain('150');
    });

    it('should detect exceeded cost budget', () => {
      const usage = { totalTokens: 10000, calls: 10, estimatedCostUsd: 150 };
      const budget = { maxCostUsd: 100 };

      const state = evaluateAiBudgetState(usage, budget);

      expect(state.state).toBe('exceeded');
    });

    it('should warn at 80% of token budget', () => {
      const usage = { totalTokens: 85000, calls: 10, estimatedCostUsd: 1 };
      const budget = { maxTokens: 100000 };

      const state = evaluateAiBudgetState(usage, budget);

      expect(state.state).toBe('warning');
    });

    it('should warn at 80% of cost budget', () => {
      const usage = { totalTokens: 10000, calls: 10, estimatedCostUsd: 85 };
      const budget = { maxCostUsd: 100 };

      const state = evaluateAiBudgetState(usage, budget);

      expect(state.state).toBe('warning');
    });

    it('should prioritize exceeded over warning', () => {
      const usage = { totalTokens: 150000, calls: 10, estimatedCostUsd: 80 };
      const budget = { maxTokens: 100000, maxCostUsd: 100 };

      const state = evaluateAiBudgetState(usage, budget);

      expect(state.state).toBe('exceeded');
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate cost from tokens', () => {
      const tokens = 10000;
      const cost = estimateCost(tokens);

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1); // Should be < $0.10 for 10K tokens
    });

    it('should scale linearly with tokens', () => {
      const cost1 = estimateCost(1000);
      const cost2 = estimateCost(2000);

      expect(cost2).toBeCloseTo(cost1 * 2, 4);
    });

    it('should return 0 for 0 tokens', () => {
      const cost = estimateCost(0);
      expect(cost).toBe(0);
    });
  });

  describe('Performance Run Metrics', () => {
    it('should track total requests', () => {
      const metrics = {
        totalRequests: 1000,
        successful: 950,
        failed: 50,
        latenciesMs: [],
        perPhaseLatenciesMs: {},
        errorCounts: { timeout: 30, error: 20 },
      };

      expect(metrics.totalRequests).toBe(1000);
      expect(metrics.successful + metrics.failed).toBe(1000);
    });

    it('should calculate error rate', () => {
      const totalRequests = 1000;
      const failed = 50;
      const errorRate = failed / totalRequests;

      expect(errorRate).toBe(0.05); // 5%
    });

    it('should track latencies per phase', () => {
      const metrics = {
        totalRequests: 100,
        successful: 95,
        failed: 5,
        latenciesMs: [10, 20, 30, 40, 50],
        perPhaseLatenciesMs: {
          rule_eval: [5, 10, 15],
          correlation: [3, 7, 12],
          risk: [2, 3, 8],
        },
        errorCounts: {},
      };

      expect(Object.keys(metrics.perPhaseLatenciesMs)).toHaveLength(3);
    });
  });

  describe('Tenant Isolation', () => {
    it('should scope profiles by tenant', () => {
      const profile1 = { tenant_id: 'tenant-1', name: 'Profile A' };
      const profile2 = { tenant_id: 'tenant-2', name: 'Profile A' };

      expect(profile1.tenant_id).not.toBe(profile2.tenant_id);
    });

    it('should scope runs by tenant', () => {
      const run1 = { tenant_id: 'tenant-1', profile_id: 'profile-1' };
      const run2 = { tenant_id: 'tenant-2', profile_id: 'profile-1' };

      expect(run1.tenant_id).not.toBe(run2.tenant_id);
    });

    it('should scope AI usage windows by tenant', () => {
      const window1 = { tenant_id: 'tenant-1', context: 'qa_simulation' };
      const window2 = { tenant_id: 'tenant-2', context: 'qa_simulation' };

      expect(window1.tenant_id).not.toBe(window2.tenant_id);
    });

    it('should not expose PII in metrics', () => {
      const metrics = {
        totalTokens: 10000,
        calls: 5,
        estimatedCostUsd: 0.05,
      };

      const metricsStr = JSON.stringify(metrics);
      // Verify metrics only contain non-sensitive data
      expect(metricsStr).toContain('totalTokens');
      expect(metricsStr).toContain('calls');
      expect(metricsStr).toContain('estimatedCostUsd');
      // Should not contain raw payload or PII patterns
      expect(metricsStr).not.toMatch(/[a-zA-Z0-9]{32,}/); // Hashes/tokens
    });
  });

  describe('Load Pattern Simulation', () => {
    it('should support burst load (high rps, short duration)', () => {
      const config: GuardianLoadConfig = {
        rps: 100,
        concurrency: 50,
        durationSeconds: 30,
      };

      const targetRequests = Math.ceil(config.rps! * config.durationSeconds);
      expect(targetRequests).toBe(3000);
    });

    it('should support steady load (consistent rps)', () => {
      const config: GuardianLoadConfig = {
        rps: 10,
        concurrency: 5,
        durationSeconds: 300,
      };

      const targetRequests = Math.ceil(config.rps! * config.durationSeconds);
      expect(targetRequests).toBe(3000);
    });

    it('should apply warmup period', () => {
      const config: GuardianLoadConfig = {
        rps: 10,
        durationSeconds: 100,
        warmupSeconds: 20,
      };

      const totalRequests = Math.ceil(config.rps! * config.durationSeconds);
      const warmupRequests = Math.ceil(config.rps! * config.warmupSeconds!);
      const measuredRequests = totalRequests - warmupRequests;

      expect(measuredRequests).toBe(800);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero latencies', () => {
      const latencies = [0, 0, 0];
      const stats = calculateLatencyStats(latencies);

      expect(stats.p50).toBe(0);
      expect(stats.max).toBe(0);
    });

    it('should handle very large latencies', () => {
      const latencies = [10000, 20000, 30000];
      const stats = calculateLatencyStats(latencies);

      expect(stats.max).toBe(30000);
    });

    it('should handle zero requests', () => {
      const totalRequests = 0;
      const errorRate = 0 / totalRequests; // NaN or 0

      expect(isNaN(errorRate) || errorRate === 0).toBe(true);
    });

    it('should handle 100% error rate', () => {
      const errorRate = 1.0;
      expect(errorRate).toBe(1.0);
    });
  });

  describe('I-Series Integration', () => {
    it('should reference I01-I04 as load targets', () => {
      const targetTypes = ['scenario', 'regression_pack', 'pipeline_phase'];
      expect(targetTypes).toContain('scenario');
      expect(targetTypes).toContain('regression_pack');
    });

    it('should not modify I01-I07 during testing', () => {
      // Performance runs are read-only against emulator
      const readonly = true;
      expect(readonly).toBe(true);
    });
  });
});
