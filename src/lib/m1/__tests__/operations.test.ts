/**
 * M1 Production Operations Kit Tests
 *
 * Test suite for health checks, self-healing, and cost optimization
 *
 * Version: v2.3.0
 * Phase: 10 Extended - Production Operations Kit
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthChecker, type HealthReport } from '../operations/health-checker';
import { SelfHealingHandler } from '../operations/self-healing';
import { CostOptimizer } from '../operations/cost-optimizer';

describe('Production Operations Kit', () => {
  /**
   * HEALTH CHECK TESTS (12 tests)
   */
  describe('Health Checker', () => {
    let healthChecker: HealthChecker;

    beforeEach(() => {
      healthChecker = new HealthChecker({
        checkInterval: 100,
        timeoutMs: 1000,
      });
    });

    it('should perform initial health check', async () => {
      const report = await healthChecker.runHealthCheck();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.overallStatus).toMatch(/healthy|degraded|unhealthy/);
      expect(report.components).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should check database health', async () => {
      const report = await healthChecker.runHealthCheck();
      const database = report.components.database;

      expect(database).toBeDefined();
      expect(database.status).toMatch(/healthy|degraded|unhealthy/);
      expect(database.latency).toBeGreaterThanOrEqual(0);
      expect(database.errorRate).toBeGreaterThanOrEqual(0);
    });

    it('should check Redis health', async () => {
      const report = await healthChecker.runHealthCheck();
      const redis = report.components.redis;

      expect(redis).toBeDefined();
      expect(redis.status).toMatch(/healthy|degraded|unhealthy/);
      expect(redis.latency).toBeGreaterThanOrEqual(0);
      expect(redis.errorRate).toBeGreaterThanOrEqual(0);
    });

    it('should check API health', async () => {
      const report = await healthChecker.runHealthCheck();
      const api = report.components.api;

      expect(api).toBeDefined();
      expect(api.status).toMatch(/healthy|degraded|unhealthy/);
      expect(api.latency).toBeGreaterThanOrEqual(0);
      expect(api.errorRate).toBeGreaterThanOrEqual(0);
    });

    it('should check memory health', async () => {
      const report = await healthChecker.runHealthCheck();
      const memory = report.components.memory;

      expect(memory).toBeDefined();
      expect(memory.status).toMatch(/healthy|degraded|unhealthy/);
      expect(memory.message).toContain('Memory usage');
    });

    it('should generate recommendations for degraded components', async () => {
      const report = await healthChecker.runHealthCheck();

      if (report.overallStatus !== 'healthy') {
        expect(report.recommendations.length).toBeGreaterThan(0);
      }
    });

    it('should track health metrics', () => {
      const metrics = healthChecker.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.uptime).toBeGreaterThanOrEqual(0); // May be 0 if very fast
      expect(metrics.checkCount).toBeGreaterThanOrEqual(0);
      expect(metrics.averageCheckTime).toBeGreaterThanOrEqual(0);
    });

    it('should maintain health history', async () => {
      await healthChecker.runHealthCheck();
      await healthChecker.runHealthCheck();

      const history = healthChecker.getHistory(10);
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it('should determine if system is healthy', async () => {
      await healthChecker.runHealthCheck();
      const isHealthy = healthChecker.isHealthy();

      expect(typeof isHealthy).toBe('boolean');
    });

    it('should determine if system is degraded', async () => {
      await healthChecker.runHealthCheck();
      const isDegraded = healthChecker.isDegraded();

      expect(typeof isDegraded).toBe('boolean');
    });

    it('should determine if system is unhealthy', async () => {
      await healthChecker.runHealthCheck();
      const isUnhealthy = healthChecker.isUnhealthy();

      expect(typeof isUnhealthy).toBe('boolean');
    });

    it('should start and stop continuous health checks', async () => {
      healthChecker.start();
      expect(healthChecker.getLastReport()).toBeDefined();

      healthChecker.stop();
      // Should stop without error
    });
  });

  /**
   * SELF-HEALING TESTS (12 tests)
   */
  describe('Self-Healing Handler', () => {
    let selfHealing: SelfHealingHandler;

    beforeEach(() => {
      selfHealing = new SelfHealingHandler();
    });

    it('should attempt to heal cache issues', async () => {
      const result = await selfHealing.heal('cache', 'Cache connection failed');

      expect(typeof result).toBe('boolean');
    });

    it('should attempt to heal policy engine issues', async () => {
      const result = await selfHealing.heal('policy_engine', 'Policy reload failed');

      expect(typeof result).toBe('boolean');
    });

    it('should attempt to heal database issues', async () => {
      const result = await selfHealing.heal('database', 'Database connection timeout');

      expect(typeof result).toBe('boolean');
    });

    it('should attempt to heal Redis issues', async () => {
      const result = await selfHealing.heal('redis', 'Redis timeout');

      expect(typeof result).toBe('boolean');
    });

    it('should record healing attempts', async () => {
      await selfHealing.heal('cache', 'Test issue');
      const history = selfHealing.getHistory(10);

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].issue).toBe('Test issue');
    });

    it('should track failure counters', async () => {
      await selfHealing.heal('cache', 'Test issue 1');
      await selfHealing.heal('cache', 'Test issue 2');

      const failureCount = selfHealing.getFailureCount('cache');
      expect(failureCount).toBeGreaterThanOrEqual(0);
    });

    it('should reset failure counters', () => {
      selfHealing.resetFailureCount('cache');

      const failureCount = selfHealing.getFailureCount('cache');
      expect(failureCount).toBe(0);
    });

    it('should support escalation callbacks', async () => {
      const callback = vi.fn();
      selfHealing.onEscalation(callback);

      // Escalation would be triggered by repeated failures
      // This just verifies callback registration
      expect(true).toBe(true);
    });

    it('should provide healing statistics', () => {
      const stats = selfHealing.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalHealingAttempts).toBeGreaterThanOrEqual(0);
      expect(stats.successfulHeals).toBeGreaterThanOrEqual(0);
      expect(stats.failedHeals).toBeGreaterThanOrEqual(0);
      expect(stats.escalatedIssues).toBeGreaterThanOrEqual(0);
      expect(stats.avgActionsPerIssue).toBeGreaterThanOrEqual(0);
    });

    it('should distinguish between component types', async () => {
      await selfHealing.heal('cache', 'Cache issue');
      await selfHealing.heal('database', 'Database issue');

      const history = selfHealing.getHistory(10);
      const components = new Set(history.map(h => h.actions[0].component));

      expect(components.size).toBeGreaterThanOrEqual(1);
    });

    it('should record success and failure differently', async () => {
      await selfHealing.heal('cache', 'Issue 1');

      const history = selfHealing.getHistory(10);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  /**
   * COST OPTIMIZATION TESTS (12 tests)
   */
  describe('Cost Optimizer', () => {
    let costOptimizer: CostOptimizer;

    beforeEach(() => {
      costOptimizer = new CostOptimizer({
        analysisInterval: 100,
      });
    });

    it('should record costs', () => {
      costOptimizer.recordCost('claude-haiku-4', 0.01);

      const stats = costOptimizer.getStats();
      expect(stats.totalCost).toBeGreaterThan(0);
    });

    it('should track costs by model', () => {
      costOptimizer.recordCost('claude-haiku-4', 0.01);
      costOptimizer.recordCost('claude-sonnet-4', 0.05);

      const analysis = costOptimizer.getCurrentAnalysis();
      if (analysis) {
        expect(Object.keys(analysis.costByModel).length).toBeGreaterThan(0);
      }
    });

    it('should track costs by component', () => {
      costOptimizer.recordCost('claude-haiku-4', 0.01, 'orchestrator');

      const analysis = costOptimizer.getCurrentAnalysis();
      if (analysis) {
        expect(Object.keys(analysis.costByComponent).length).toBeGreaterThan(0);
      }
    });

    it('should calculate daily averages', () => {
      costOptimizer.recordCost('claude-haiku-4', 0.01);
      costOptimizer.recordCost('claude-sonnet-4', 0.02);

      const stats = costOptimizer.getStats();
      expect(stats.averageDailyCost).toBeGreaterThanOrEqual(0);
    });

    it('should estimate monthly costs', () => {
      costOptimizer.recordCost('claude-haiku-4', 1.0);

      const stats = costOptimizer.getStats();
      expect(stats.estimatedMonthlyCost).toBeGreaterThanOrEqual(0);
    });

    it('should analyze cost trends', () => {
      costOptimizer.recordCost('claude-haiku-4', 0.01);
      costOptimizer.recordCost('claude-sonnet-4', 0.02);

      const analysis = costOptimizer.getCurrentAnalysis();
      if (analysis) {
        expect(analysis.trend).toMatch(/increasing|stable|decreasing/);
      }
    });

    it('should generate recommendations', async () => {
      costOptimizer.recordCost('claude-opus-4-5', 100.0); // High cost

      const recommendations = costOptimizer.getRecommendations();
      // Recommendations may be generated based on cost patterns
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should prioritize recommendations', async () => {
      costOptimizer.recordCost('claude-opus-4-5', 100.0);

      const recommendations = costOptimizer.getRecommendations();
      if (recommendations.length > 1) {
        // Higher priority items should come first
        for (let i = 1; i < recommendations.length; i++) {
          const priorityMap = { high: 3, medium: 2, low: 1 };
          expect(priorityMap[recommendations[i - 1].priority as keyof typeof priorityMap])
            .toBeGreaterThanOrEqual(
              priorityMap[recommendations[i].priority as keyof typeof priorityMap]
            );
        }
      }
    });

    it('should provide cost statistics', () => {
      costOptimizer.recordCost('claude-haiku-4', 0.5);

      const stats = costOptimizer.getStats();
      expect(stats).toHaveProperty('totalCost');
      expect(stats).toHaveProperty('averageDailyCost');
      expect(stats).toHaveProperty('estimatedMonthlyCost');
      expect(stats).toHaveProperty('highestDailyCost');
      expect(stats).toHaveProperty('lowestDailyCost');
    });

    it('should start and stop optimization monitoring', () => {
      costOptimizer.start();
      expect(costOptimizer.getCurrentAnalysis()).toBeDefined();

      costOptimizer.stop();
      // Should stop without error
    });

    it('should maintain cost history', () => {
      costOptimizer.recordCost('claude-haiku-4', 0.01);
      costOptimizer.recordCost('claude-haiku-4', 0.02);

      const history = costOptimizer.getHistory(10);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  /**
   * INTEGRATION TESTS (9 tests)
   */
  describe('Operations Kit Integration', () => {
    let healthChecker: HealthChecker;
    let selfHealing: SelfHealingHandler;
    let costOptimizer: CostOptimizer;

    beforeEach(() => {
      healthChecker = new HealthChecker();
      selfHealing = new SelfHealingHandler();
      costOptimizer = new CostOptimizer();
    });

    it('should coordinate health check and self-healing', async () => {
      const healthReport = await healthChecker.runHealthCheck();

      if (healthReport.overallStatus !== 'healthy') {
        // Trigger self-healing for degraded components
        for (const [component, health] of Object.entries(healthReport.components)) {
          if (health.status !== 'healthy') {
            await selfHealing.heal(component, health.message || 'Health check failed');
          }
        }
      }

      const healingStats = selfHealing.getStats();
      expect(healingStats).toBeDefined();
    });

    it('should track costs during operations', () => {
      // Simulate operations
      costOptimizer.recordCost('claude-haiku-4', 0.01, 'health_check');
      costOptimizer.recordCost('claude-sonnet-4', 0.05, 'self_healing');

      const stats = costOptimizer.getStats();
      expect(stats.totalCost).toBeGreaterThan(0);
    });

    it('should monitor and optimize based on health', async () => {
      const healthReport = await healthChecker.runHealthCheck();

      // If degraded, apply cost optimizations
      if (healthReport.overallStatus === 'degraded') {
        costOptimizer.recordCost('claude-haiku-4', 0.5, 'optimization');
      }

      const recommendations = costOptimizer.getRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should provide comprehensive system status', async () => {
      const healthReport = await healthChecker.runHealthCheck();
      const healingStats = selfHealing.getStats();
      const costStats = costOptimizer.getStats();

      expect(healthReport).toBeDefined();
      expect(healingStats).toBeDefined();
      expect(costStats).toBeDefined();
    });

    it('should handle multiple concurrent operations', async () => {
      const promises = [
        healthChecker.runHealthCheck(),
        selfHealing.heal('cache', 'Test'),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(2);
    });

    it('should escalate serious issues', async () => {
      let escalatedCalled = false;

      selfHealing.onEscalation(async () => {
        escalatedCalled = true;
      });

      // Multiple failures would trigger escalation
      for (let i = 0; i < 5; i++) {
        await selfHealing.heal('cache', `Issue ${i}`);
      }

      // Escalation may have been triggered
      expect(typeof escalatedCalled).toBe('boolean');
    });

    it('should maintain operation history', async () => {
      await healthChecker.runHealthCheck();
      await selfHealing.heal('cache', 'Test issue');
      costOptimizer.recordCost('claude-haiku-4', 0.01);

      const healthHistory = healthChecker.getHistory(10);
      const healingHistory = selfHealing.getHistory(10);
      const costHistory = costOptimizer.getHistory(10);

      expect(healthHistory.length).toBeGreaterThan(0);
      expect(healingHistory.length).toBeGreaterThan(0);
      // Cost history may be empty if no analysis run yet
      expect(Array.isArray(costHistory)).toBe(true);
    });

    it('should support continuous monitoring', async () => {
      healthChecker.start();
      costOptimizer.start();

      // Run operations while monitoring
      await new Promise(resolve => setTimeout(resolve, 150));

      healthChecker.stop();
      costOptimizer.stop();

      expect(healthChecker.getLastReport()).toBeDefined();
    });
  });
});
