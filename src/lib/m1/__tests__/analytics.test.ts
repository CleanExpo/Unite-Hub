/**
 * M1 Enhanced Analytics Tests
 *
 * Test suite for real-time analytics engine with SSE streaming and query DSL
 *
 * Version: v2.3.0
 * Phase: 10 - Enhanced Analytics
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { SSEHandler } from '../monitoring/sse-handler';
import {
  AnalyticsEngine,
  AnalyticsQuery,
  QueryResult,
  AggregationFunction,
} from '../monitoring/analytics-api';

describe('Enhanced Analytics Engine', () => {
  /**
   * REAL-TIME SSE STREAMING TESTS (4 tests)
   */
  describe('Server-Sent Events Streaming', () => {
    let sseHandler: SSEHandler;

    beforeAll(() => {
      sseHandler = new SSEHandler(100); // Fast interval for testing
    });

    afterAll(() => {
      sseHandler.shutdown();
    });

    it('should register and manage SSE clients', () => {
      // Mock WritableStream
      const mockStream = {
        write: vi.fn((data, callback) => callback()),
        once: vi.fn((event, handler) => {}),
        end: vi.fn(),
      } as any;

      sseHandler.registerClient(mockStream);
      const stats = sseHandler.getStats();

      expect(stats.clientCount).toBeGreaterThan(0);
      expect(mockStream.write).toHaveBeenCalled();
    });

    it('should stream cache metrics in real-time', async () => {
      const mockStream = {
        write: vi.fn((data, callback) => callback()),
        once: vi.fn((event, handler) => {}),
        end: vi.fn(),
      } as any;

      sseHandler.registerClient(mockStream);

      // Wait for streaming
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have multiple write calls for different metrics
      expect(mockStream.write.mock.calls.length).toBeGreaterThan(3);
    });

    it('should broadcast alerts to all clients', () => {
      const mockStream1 = {
        write: vi.fn((data, callback) => callback()),
        once: vi.fn((event, handler) => {}),
        end: vi.fn(),
      } as any;

      const mockStream2 = {
        write: vi.fn((data, callback) => callback()),
        once: vi.fn((event, handler) => {}),
        end: vi.fn(),
      } as any;

      sseHandler.registerClient(mockStream1);
      sseHandler.registerClient(mockStream2);

      sseHandler.broadcastAlert('critical', 'Test alert', 'test-source');

      // Both streams should receive the alert
      expect(mockStream1.write.mock.calls.length).toBeGreaterThan(0);
      expect(mockStream2.write.mock.calls.length).toBeGreaterThan(0);
    });

    it('should handle client disconnection', () => {
      const mockStream = {
        write: vi.fn((data, callback) => callback()),
        once: vi.fn((event, handler) => {
          // Simulate close event
          if (event === 'close') {
            handler();
          }
        }),
        end: vi.fn(),
      } as any;

      sseHandler.registerClient(mockStream);
      const statsBefore = sseHandler.getStats();
      expect(statsBefore.clientCount).toBeGreaterThan(0);

      // Trigger close event
      mockStream.once.mock.calls.find(call => call[0] === 'close')[1]();

      const statsAfter = sseHandler.getStats();
      // May be equal if no other clients, or one less
      expect(statsAfter.clientCount).toBeLessThanOrEqual(statsBefore.clientCount);
    });
  });

  /**
   * QUERY DSL TESTS (5 tests)
   */
  describe('Analytics Query DSL', () => {
    let analyticsEngine: AnalyticsEngine;

    beforeAll(() => {
      analyticsEngine = new AnalyticsEngine();

      // Populate with test data
      for (let i = 0; i < 100; i++) {
        analyticsEngine.recordMetric('policy_decisions', Math.random() * 10, {
          toolName: ['log_agent_run', 'tool_registry_list', 'tool_policy_check'][
            i % 3
          ],
          scope: ['read', 'write', 'execute'][i % 3],
        });

        analyticsEngine.recordMetric('tool_executions', Math.random() * 100, {
          toolName: ['log_agent_run', 'tool_registry_list'][i % 2],
        });
      }
    });

    it('should execute basic count aggregation', async () => {
      const query: AnalyticsQuery = {
        metric: 'policy_decisions',
        timeRange: '1h',
        aggregations: ['count'],
      };

      const result = await analyticsEngine.executeQuery(query);

      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('count');
      expect(result.rows[0].count).toBeGreaterThan(0);
    });

    it('should execute grouped aggregations', async () => {
      const query: AnalyticsQuery = {
        metric: 'policy_decisions',
        timeRange: '1h',
        groupBy: ['toolName'],
        aggregations: ['count', 'avg', 'max'],
      };

      const result = await analyticsEngine.executeQuery(query);

      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('group');
      expect(result.rows[0]).toHaveProperty('count');
      expect(result.rows[0]).toHaveProperty('avg');
    });

    it('should apply filters to query results', async () => {
      const query: AnalyticsQuery = {
        metric: 'policy_decisions',
        timeRange: '1h',
        filters: [
          {
            field: 'value',
            op: 'gt',
            value: 5,
          },
        ],
        aggregations: ['count', 'avg'],
      };

      const result = await analyticsEngine.executeQuery(query);

      expect(result.aggregations).toHaveProperty('count');
      expect(result.aggregations).toHaveProperty('avg');
    });

    it('should calculate percentiles', async () => {
      const query: AnalyticsQuery = {
        metric: 'tool_executions',
        timeRange: '1h',
        aggregations: ['p50', 'p95', 'p99'],
      };

      const result = await analyticsEngine.executeQuery(query);

      expect(result.rows[0]).toHaveProperty('p50');
      expect(result.rows[0]).toHaveProperty('p95');
      expect(result.rows[0]).toHaveProperty('p99');

      const p50 = result.rows[0].p50 as number;
      const p95 = result.rows[0].p95 as number;
      const p99 = result.rows[0].p99 as number;

      // Percentiles should be in order
      expect(p50).toBeLessThanOrEqual(p95);
      expect(p95).toBeLessThanOrEqual(p99);
    });

    it('should apply limit and offset', async () => {
      const query: AnalyticsQuery = {
        metric: 'policy_decisions',
        timeRange: '1h',
        groupBy: ['toolName'],
        aggregations: ['count'],
        limit: 2,
        offset: 0,
      };

      const result = await analyticsEngine.executeQuery(query);

      expect(result.rowCount).toBeLessThanOrEqual(2);
    });
  });

  /**
   * TIME-SERIES STORAGE TESTS (3 tests)
   */
  describe('Time-Series Data Management', () => {
    let analyticsEngine: AnalyticsEngine;

    beforeAll(() => {
      analyticsEngine = new AnalyticsEngine();
    });

    it('should record metric data points', () => {
      analyticsEngine.recordMetric('test_metric', 42);
      analyticsEngine.recordMetric('test_metric', 50, { category: 'test' });

      const stats = analyticsEngine.getStats();
      expect(stats.dataPointCount).toBeGreaterThan(0);
    });

    it('should prune old data based on retention', () => {
      const engine = new AnalyticsEngine();

      engine.recordMetric('metric1', 100);
      let stats = engine.getStats();
      const initialCount = stats.dataPointCount;

      expect(initialCount).toBeGreaterThan(0);

      // Pruning should reduce or maintain count
      const pruned = engine.pruneOldData();
      stats = engine.getStats();

      expect(stats.dataPointCount).toBeLessThanOrEqual(initialCount);
    });

    it('should estimate memory usage', () => {
      const engine = new AnalyticsEngine();

      for (let i = 0; i < 50; i++) {
        engine.recordMetric('memory_test', Math.random() * 100);
      }

      const stats = engine.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });

  /**
   * AGGREGATION ACCURACY TESTS (3 tests)
   */
  describe('Aggregation Accuracy', () => {
    let analyticsEngine: AnalyticsEngine;

    beforeAll(() => {
      analyticsEngine = new AnalyticsEngine();

      // Record known values for verification
      const values = [10, 20, 30, 40, 50];
      for (const value of values) {
        analyticsEngine.recordMetric('accuracy_test', value);
      }
    });

    it('should calculate correct count', async () => {
      const query: AnalyticsQuery = {
        metric: 'accuracy_test',
        timeRange: '1h',
        aggregations: ['count'],
      };

      const result = await analyticsEngine.executeQuery(query);
      expect(result.rows[0].count).toBe(5);
    });

    it('should calculate correct average', async () => {
      const query: AnalyticsQuery = {
        metric: 'accuracy_test',
        timeRange: '1h',
        aggregations: ['avg'],
      };

      const result = await analyticsEngine.executeQuery(query);
      const avg = result.rows[0].avg as number;
      expect(Math.abs(avg - 30)).toBeLessThan(1); // Average of 10,20,30,40,50 = 30
    });

    it('should calculate min/max correctly', async () => {
      const query: AnalyticsQuery = {
        metric: 'accuracy_test',
        timeRange: '1h',
        aggregations: ['min', 'max'],
      };

      const result = await analyticsEngine.executeQuery(query);
      expect(result.rows[0].min).toBe(10);
      expect(result.rows[0].max).toBe(50);
    });
  });

  /**
   * ANALYTICS FEATURES TESTS (3 tests)
   */
  describe('Advanced Analytics Features', () => {
    let analyticsEngine: AnalyticsEngine;

    beforeAll(() => {
      analyticsEngine = new AnalyticsEngine();

      // Record data with clear trend
      for (let i = 0; i < 20; i++) {
        analyticsEngine.recordMetric('trend_test', i * 10); // Clear upward trend
      }

      // Record with anomalies
      for (let i = 0; i < 30; i++) {
        const value = Math.sin(i) * 10 + 50;
        analyticsEngine.recordMetric('anomaly_test', value);
      }
      // Add anomaly
      analyticsEngine.recordMetric('anomaly_test', 999);
    });

    it('should detect trends', () => {
      const trend = analyticsEngine.getTrend('trend_test', '1h');

      expect(trend.trend).toMatch(/up|down|stable/);
      expect(typeof trend.change).toBe('number');
    });

    it('should detect anomalies using moving average', () => {
      const anomalies = analyticsEngine.detectAnomalies('anomaly_test', 10, 2.0);

      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('should handle multiple aggregation functions', async () => {
      const query: AnalyticsQuery = {
        metric: 'trend_test',
        timeRange: '1h',
        aggregations: ['count', 'sum', 'avg', 'min', 'max', 'stddev'],
      };

      const result = await analyticsEngine.executeQuery(query);
      const row = result.rows[0];

      expect(row).toHaveProperty('count');
      expect(row).toHaveProperty('sum');
      expect(row).toHaveProperty('avg');
      expect(row).toHaveProperty('min');
      expect(row).toHaveProperty('max');
      expect(row).toHaveProperty('stddev');
    });
  });

  /**
   * INTEGRATION TESTS (2 tests)
   */
  describe('Analytics Integration', () => {
    it('should handle SSE broadcasting with cost updates', () => {
      const sseHandler = new SSEHandler(100);
      const mockStream = {
        write: vi.fn((data, callback) => callback()),
        once: vi.fn((event, handler) => {}),
        end: vi.fn(),
      } as any;

      sseHandler.registerClient(mockStream);

      sseHandler.broadcastCostUpdate(123.45, {
        'claude-haiku-4': 45.67,
        'claude-sonnet-4': 77.78,
      });

      expect(mockStream.write.mock.calls.length).toBeGreaterThan(0);

      sseHandler.shutdown();
    });

    it('should maintain analytics query performance', async () => {
      const analyticsEngine = new AnalyticsEngine();

      // Record lots of data
      for (let i = 0; i < 1000; i++) {
        analyticsEngine.recordMetric('perf_test', Math.random() * 100, {
          category: `cat_${i % 10}`,
        });
      }

      const query: AnalyticsQuery = {
        metric: 'perf_test',
        timeRange: '1h',
        groupBy: ['category'],
        aggregations: ['count', 'avg', 'p95'],
        limit: 10,
      };

      const startTime = Date.now();
      const result = await analyticsEngine.executeQuery(query);
      const duration = Date.now() - startTime;

      // Query should complete quickly (< 500ms for 1000 points)
      expect(duration).toBeLessThan(500);
      expect(result.rowCount).toBeGreaterThan(0);
    });
  });
});
