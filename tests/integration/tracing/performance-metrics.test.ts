/**
 * Performance Metrics Collection Tests
 *
 * Comprehensive test suite for performance metrics with 5 quality gates
 */

 

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PerformanceMetricsCollector,
  initializePerformanceMetrics,
  getPerformanceMetrics,
  recordOperation,
  getMetricsSnapshot,
  getHealthScore,
  resetPerformanceMetrics,
} from '@/lib/tracing/performance-metrics';

describe('PerformanceMetricsCollector - Phase 6.8 Step 7', () => {
  beforeEach(() => {
    resetPerformanceMetrics();
  });

  afterEach(() => {
    resetPerformanceMetrics();
  });

  describe('QUALITY GATE 1: Histogram Accuracy', () => {
    it('should accurately calculate percentiles', () => {
      const collector = getPerformanceMetrics();

      // Record latencies: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
      for (let i = 1; i <= 10; i++) {
        collector.recordOperation('http.request', i * 10, true);
      }

      const snapshot = collector.getSnapshot();
      const httpMetrics = snapshot.operations['http.request'];

      expect(httpMetrics).toBeDefined();
      if (httpMetrics) {
        const p50 = httpMetrics.latency.percentiles[50];
        const p95 = httpMetrics.latency.percentiles[95];
        const p99 = httpMetrics.latency.percentiles[99];

        // P50 should be around 50
        expect(p50).toBeGreaterThan(40);
        expect(p50).toBeLessThan(60);

        // P95 should be around 95
        expect(p95).toBeGreaterThan(85);

        // P99 should be >= P95
        expect(p99).toBeGreaterThanOrEqual(p95);
      }
    });

    it('should calculate mean correctly', () => {
      const collector = getPerformanceMetrics();

      // Record: 10, 20, 30 (mean = 20)
      collector.recordOperation('db.query', 10, true);
      collector.recordOperation('db.query', 20, true);
      collector.recordOperation('db.query', 30, true);

      const snapshot = collector.getSnapshot();
      const dbMetrics = snapshot.operations['db.query'];

      expect(dbMetrics).toBeDefined();
      if (dbMetrics) {
        expect(dbMetrics.latency.mean).toBeCloseTo(20, 1);
      }
    });

    it('should calculate standard deviation', () => {
      const collector = getPerformanceMetrics();

      // Record: 10, 20, 30, 40, 50 (stdDev ~15.81)
      for (let i = 1; i <= 5; i++) {
        collector.recordOperation('cache.hit', i * 10, true);
      }

      const snapshot = collector.getSnapshot();
      const cacheMetrics = snapshot.operations['cache.hit'];

      expect(cacheMetrics).toBeDefined();
      if (cacheMetrics) {
        expect(cacheMetrics.latency.stdDev).toBeGreaterThan(0);
        expect(cacheMetrics.latency.stdDev).toBeLessThan(20);
      }
    });

    it('should track min and max latencies', () => {
      const collector = getPerformanceMetrics();

      collector.recordOperation('auth.login', 50, true);
      collector.recordOperation('auth.login', 150, true);
      collector.recordOperation('auth.login', 100, true);

      const snapshot = collector.getSnapshot();
      const authMetrics = snapshot.operations['auth.login'];

      expect(authMetrics).toBeDefined();
      if (authMetrics) {
        expect(authMetrics.latency.min).toBe(50);
        expect(authMetrics.latency.max).toBe(150);
      }
    });
  });

  describe('QUALITY GATE 2: Bounded Memory', () => {
    it('should limit histogram size to prevent memory leaks', () => {
      const collector = getPerformanceMetrics();

      // Record 2000 operations (max size is 1000)
      for (let i = 0; i < 2000; i++) {
        collector.recordOperation('memory.test', Math.random() * 100, true);
      }

      const snapshot = collector.getSnapshot();
      const metrics = snapshot.operations['memory.test'];

      expect(metrics).toBeDefined();
      if (metrics) {
        // Count should be at most 1000
        expect(metrics.latency.count).toBeLessThanOrEqual(1000);
      }
    });

    it('should maintain accuracy with bounded samples', () => {
      const collector = getPerformanceMetrics();

      // Record with distinct patterns
      for (let i = 0; i < 500; i++) {
        collector.recordOperation('bounded.test', 10 + (i % 100), true);
      }

      const snapshot = collector.getSnapshot();
      const metrics = snapshot.operations['bounded.test'];

      expect(metrics).toBeDefined();
      if (metrics) {
        expect(metrics.latency.mean).toBeGreaterThan(50);
        expect(metrics.latency.mean).toBeLessThan(110);
      }
    });
  });

  describe('QUALITY GATE 3: Operation Tracking', () => {
    it('should track multiple operation types', () => {
      const collector = getPerformanceMetrics();

      collector.recordOperation('http.request', 100, true);
      collector.recordOperation('db.query', 200, true);
      collector.recordOperation('cache.hit', 10, true);

      const snapshot = collector.getSnapshot();

      expect(Object.keys(snapshot.operations).length).toBe(3);
      expect(snapshot.operations['http.request']).toBeDefined();
      expect(snapshot.operations['db.query']).toBeDefined();
      expect(snapshot.operations['cache.hit']).toBeDefined();
    });

    it('should increment operation count', () => {
      const collector = getPerformanceMetrics();

      collector.recordOperation('test.op', 50, true);
      collector.recordOperation('test.op', 60, true);
      collector.recordOperation('test.op', 70, true);

      const snapshot = collector.getSnapshot();
      const metrics = snapshot.operations['test.op'];

      expect(metrics).toBeDefined();
      if (metrics) {
        expect(metrics.count).toBe(3);
      }
    });

    it('should track error count and rate', () => {
      const collector = getPerformanceMetrics();

      // 7 successes, 3 failures
      for (let i = 0; i < 7; i++) {
        collector.recordOperation('error.test', 100, true);
      }
      for (let i = 0; i < 3; i++) {
        collector.recordOperation('error.test', 200, false);
      }

      const snapshot = collector.getSnapshot();
      const metrics = snapshot.operations['error.test'];

      expect(metrics).toBeDefined();
      if (metrics) {
        expect(metrics.count).toBe(10);
        expect(metrics.errorCount).toBe(3);
        expect(metrics.errorRate).toBeCloseTo(0.3, 1);
      }
    });
  });

  describe('QUALITY GATE 4: Health Score Calculation', () => {
    it('should calculate health score from 0-100', () => {
      const collector = getPerformanceMetrics();

      // Record some operations
      for (let i = 0; i < 10; i++) {
        collector.recordOperation('health.test', 100, true);
      }

      const health = collector.calculateHealthScore();

      expect(health.overall).toBeGreaterThanOrEqual(0);
      expect(health.overall).toBeLessThanOrEqual(100);
      expect(health.errorRate).toBeGreaterThanOrEqual(0);
      expect(health.latencyHealth).toBeGreaterThanOrEqual(0);
      expect(health.latencyHealth).toBeLessThanOrEqual(100);
      expect(health.resourceHealth).toBeGreaterThanOrEqual(0);
      expect(health.resourceHealth).toBeLessThanOrEqual(100);
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should reduce score for high error rates', () => {
      const collector = getPerformanceMetrics();

      // All failures
      for (let i = 0; i < 10; i++) {
        collector.recordOperation('error.heavy', 50, false);
      }

      const health = collector.calculateHealthScore();

      // High error rate should lower score significantly
      expect(health.overall).toBeLessThan(90);
      expect(health.errorRate).toBeCloseTo(100, -1);
    });

    it('should reduce score for high latencies', () => {
      const collector = getPerformanceMetrics();

      // High latency operations
      for (let i = 0; i < 5; i++) {
        collector.recordOperation('slow.op', 2000, true);
      }

      const health = collector.calculateHealthScore();

      // High latency should reduce latencyHealth score
      expect(health.latencyHealth).toBeLessThan(85);
    });

    it('should provide recommendations for problems', () => {
      const collector = getPerformanceMetrics();

      // Record high error rate
      for (let i = 0; i < 10; i++) {
        collector.recordOperation('bad.op', 50, i < 8 ? true : false);
      }

      // Record high latency
      for (let i = 0; i < 5; i++) {
        collector.recordOperation('slow.op', 1500, true);
      }

      const health = collector.calculateHealthScore();

      expect(health.recommendations.length).toBeGreaterThan(0);
      expect(health.recommendations.some((r) => r.includes('latency') || r.includes('error'))).toBe(
        true
      );
    });
  });

  describe('QUALITY GATE 5: Never Throws', () => {
    it('should not throw when recording operations', () => {
      const collector = getPerformanceMetrics();

      expect(() => {
        collector.recordOperation('test.op', 100, true);
        collector.recordOperation('test.op', 200, false);
        collector.recordOperation('test.op', 150, true);
      }).not.toThrow();
    });

    it('should not throw when calculating health', () => {
      const collector = getPerformanceMetrics();

      collector.recordOperation('test', 50, true);

      expect(() => {
        const health = collector.calculateHealthScore();
        expect(health).toBeDefined();
      }).not.toThrow();
    });

    it('should not throw when getting snapshot with no data', () => {
      const collector = getPerformanceMetrics();

      expect(() => {
        const snapshot = collector.getSnapshot();
        expect(snapshot).toBeDefined();
        expect(Object.keys(snapshot.operations).length).toBe(0);
      }).not.toThrow();
    });

    it('should handle extreme values gracefully', () => {
      const collector = getPerformanceMetrics();

      expect(() => {
        collector.recordOperation('extreme.1', 0, true);
        collector.recordOperation('extreme.2', 999999, true);
        collector.recordOperation('extreme.3', Number.MAX_SAFE_INTEGER / 1000, true);
      }).not.toThrow();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const collector1 = getPerformanceMetrics();
      const collector2 = getPerformanceMetrics();

      expect(collector1).toBe(collector2);
    });

    it('should initialize if not exists', () => {
      resetPerformanceMetrics();

      const collector = initializePerformanceMetrics();
      expect(collector).toBeDefined();
      expect(collector).toBeInstanceOf(PerformanceMetricsCollector);
    });
  });

  describe('Global Helper Functions', () => {
    it('should record operation via global function', () => {
      recordOperation('global.test', 100, true);
      recordOperation('global.test', 200, false);

      const snapshot = getMetricsSnapshot();
      const metrics = snapshot.operations['global.test'];

      expect(metrics).toBeDefined();
      if (metrics) {
        expect(metrics.count).toBe(2);
        expect(metrics.errorCount).toBe(1);
      }
    });

    it('should get health score via global function', () => {
      recordOperation('health.check', 100, true);

      const health = getHealthScore();

      expect(health).toBeDefined();
      expect(health.overall).toBeGreaterThanOrEqual(0);
      expect(health.overall).toBeLessThanOrEqual(100);
    });

    it('should get snapshot via global function', () => {
      recordOperation('snapshot.test', 100, true);

      const snapshot = getMetricsSnapshot();

      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(snapshot.health).toBeDefined();
      expect(snapshot.resourceUsage).toBeDefined();
    });
  });

  describe('Uptime Tracking', () => {
    it('should track uptime correctly', () => {
      const collector = getPerformanceMetrics();
      const snapshot1 = collector.getSnapshot();

      expect(snapshot1.uptime).toBeGreaterThanOrEqual(0);

      // Wait a bit and check again
      const snapshot2 = collector.getSnapshot();
      expect(snapshot2.uptime).toBeGreaterThanOrEqual(snapshot1.uptime);
    });

    it('should include uptime in health score', () => {
      const collector = getPerformanceMetrics();
      const health = collector.calculateHealthScore();

      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Resource Usage Tracking', () => {
    it('should report memory usage', () => {
      const collector = getPerformanceMetrics();
      const snapshot = collector.getSnapshot();

      expect(snapshot.resourceUsage).toBeDefined();
      expect(snapshot.resourceUsage.memoryMb).toBeGreaterThan(0);
      expect(snapshot.resourceUsage.memoryMb).toBeLessThan(10000);
    });

    it('should estimate active operations', () => {
      const collector = getPerformanceMetrics();

      // Record recent operations
      collector.recordOperation('active.op', 100, true);
      collector.recordOperation('active.op', 200, true);

      const snapshot = collector.getSnapshot();

      expect(snapshot.resourceUsage.activeOperations).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Operation Metrics Access', () => {
    it('should retrieve specific operation metrics', () => {
      const collector = getPerformanceMetrics();

      collector.recordOperation('retrieve.test', 100, true);
      collector.recordOperation('retrieve.test', 150, true);

      const metrics = collector.getOperationMetrics('retrieve.test');

      expect(metrics).toBeDefined();
      if (metrics) {
        expect(metrics.count).toBe(2);
        expect(metrics.name).toBe('retrieve.test');
      }
    });

    it('should return undefined for nonexistent operation', () => {
      const collector = getPerformanceMetrics();

      const metrics = collector.getOperationMetrics('nonexistent.op');

      expect(metrics).toBeUndefined();
    });

    it('should list all operation names', () => {
      const collector = getPerformanceMetrics();

      collector.recordOperation('op1', 100, true);
      collector.recordOperation('op2', 200, true);
      collector.recordOperation('op3', 150, true);

      const names = collector.getOperationNames();

      expect(names.length).toBe(3);
      expect(names).toContain('op1');
      expect(names).toContain('op2');
      expect(names).toContain('op3');
    });
  });

  describe('Percentile Distribution', () => {
    it('should calculate correct percentile sequence', () => {
      const collector = getPerformanceMetrics();

      // Record 100 distinct values
      for (let i = 1; i <= 100; i++) {
        collector.recordOperation('percentiles.test', i, true);
      }

      const snapshot = collector.getSnapshot();
      const metrics = snapshot.operations['percentiles.test'];

      expect(metrics).toBeDefined();
      if (metrics) {
        const { percentiles } = metrics.latency;

        // P50 < P75 < P90 < P95 < P99
        expect(percentiles[50]).toBeLessThan(percentiles[75]);
        expect(percentiles[75]).toBeLessThan(percentiles[90]);
        expect(percentiles[90]).toBeLessThan(percentiles[95]);
        expect(percentiles[95]).toBeLessThan(percentiles[99]);
      }
    });
  });

  describe('Reset Functionality', () => {
    it('should clear all metrics on reset', () => {
      const collector = getPerformanceMetrics();

      collector.recordOperation('reset.test', 100, true);
      collector.recordOperation('reset.test', 200, true);

      let snapshot = collector.getSnapshot();
      expect(Object.keys(snapshot.operations).length).toBeGreaterThan(0);

      collector.reset();

      snapshot = collector.getSnapshot();
      expect(Object.keys(snapshot.operations).length).toBe(0);
    });

    it('should reset uptime on reset', () => {
      const collector = getPerformanceMetrics();

      const snapshot1 = collector.getSnapshot();
      const uptime1 = snapshot1.uptime;

      // Record operation to ensure time difference
      collector.recordOperation('delay.test', 100, true);

      collector.reset();

      const snapshot2 = collector.getSnapshot();
      const uptime2 = snapshot2.uptime;

      // New uptime should be less than or equal to previous (reset clears start time)
      expect(uptime2).toBeLessThanOrEqual(uptime1);
    });
  });
});
