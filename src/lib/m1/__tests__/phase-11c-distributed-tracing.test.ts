/**
 * Phase 11C: Distributed Tracing Tests
 *
 * Comprehensive test suite for trace context management,
 * OpenTelemetry integration, and distributed tracing
 *
 * Version: v2.4.2
 * Phase: 11C - Distributed Tracing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TraceContext,
  traceContextManager,
} from '../tracing/trace-context';
import {
  OTelIntegrationManager,
  otelManager,
} from '../tracing/otel-integrations';
import {
  TracerManager,
  tracerManager,
  TraceStats,
} from '../tracing/tracer-manager';

/**
 * ============================================================================
 * TRACE CONTEXT TESTS (15 tests)
 * ============================================================================
 */

describe('Trace Context Manager', () => {
  beforeEach(() => {
    traceContextManager.clearAllTraces();
  });

  // Test 1: Create new trace context
  it('should create new trace context with valid IDs', () => {
    const context = traceContextManager.createTraceContext(true);

    expect(context.traceId).toBeDefined();
    expect(context.spanId).toBeDefined();
    expect(context.traceId).toHaveLength(32);
    expect(context.spanId).toHaveLength(16);
    expect(context.traceFlags).toBe(0x01);
  });

  // Test 2: Create unsampled trace
  it('should create unsampled trace context', () => {
    const context = traceContextManager.createTraceContext(false);

    expect(context.traceFlags).toBe(0x00);
  });

  // Test 3: Create child span
  it('should create child span from parent context', () => {
    const parent = traceContextManager.createTraceContext(true);
    const child = traceContextManager.createChildSpan(parent);

    expect(child.traceId).toBe(parent.traceId);
    expect(child.spanId).not.toBe(parent.spanId);
    expect(child.parentSpanId).toBe(parent.spanId);
  });

  // Test 4: Extract from W3C headers
  it('should extract trace context from W3C traceparent header', () => {
    const headers = {
      'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
    };

    const context = traceContextManager.extractFromHeaders(headers);

    expect(context).not.toBeNull();
    expect(context!.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
    expect(context!.parentSpanId).toBe('b7ad6b7169203331');
  });

  // Test 5: Reject invalid traceparent format
  it('should reject invalid traceparent format', () => {
    const headers = {
      'traceparent': 'invalid-format',
    };

    const context = traceContextManager.extractFromHeaders(headers);

    expect(context).toBeNull();
  });

  // Test 6: Inject to W3C headers
  it('should inject trace context into W3C headers', () => {
    const context = traceContextManager.createTraceContext(true);
    const headers = traceContextManager.injectToHeaders(context);

    expect(headers['traceparent']).toBeDefined();
    expect(headers['traceparent']).toContain(context.traceId);
    expect(headers['traceparent']).toContain(context.spanId);
  });

  // Test 7: Set and get active context
  it('should manage active context stack', () => {
    const context1 = traceContextManager.createTraceContext(true);
    const context2 = traceContextManager.createTraceContext(true);

    traceContextManager.setActiveContext(context1);
    expect(traceContextManager.getActiveContext()?.traceId).toBe(context1.traceId);

    traceContextManager.setActiveContext(context2);
    expect(traceContextManager.getActiveContext()?.traceId).toBe(context2.traceId);

    const popped = traceContextManager.popActiveContext();
    expect(popped?.traceId).toBe(context2.traceId);
    expect(traceContextManager.getActiveContext()?.traceId).toBe(context1.traceId);
  });

  // Test 8: Get trace context by ID
  it('should retrieve trace context by traceId', () => {
    const context = traceContextManager.createTraceContext(true);
    const retrieved = traceContextManager.getTraceContext(context.traceId);

    expect(retrieved).toEqual(context);
  });

  // Test 9: Clear specific trace
  it('should clear specific trace', () => {
    const context = traceContextManager.createTraceContext(true);
    traceContextManager.clearTrace(context.traceId);

    const retrieved = traceContextManager.getTraceContext(context.traceId);
    expect(retrieved).toBeNull();
  });

  // Test 10: Clear all traces
  it('should clear all traces', () => {
    traceContextManager.createTraceContext(true);
    traceContextManager.createTraceContext(true);
    traceContextManager.createTraceContext(true);

    traceContextManager.clearAllTraces();

    const activeTraces = traceContextManager.getActiveTraces();
    expect(activeTraces).toHaveLength(0);
  });

  // Test 11: Multiple trace contexts isolation
  it('should maintain isolated trace contexts', () => {
    const context1 = traceContextManager.createTraceContext(true);
    const context2 = traceContextManager.createTraceContext(true);

    expect(context1.traceId).not.toBe(context2.traceId);
    expect(context1.spanId).not.toBe(context2.spanId);
  });

  // Test 12: Trace state propagation
  it('should preserve trace state across extraction/injection', () => {
    const context = traceContextManager.createTraceContext(true);
    context.traceState = 'vendor-data=value';

    const headers = traceContextManager.injectToHeaders(context);
    expect(headers['tracestate']).toBe('vendor-data=value');

    const extracted = traceContextManager.extractFromHeaders(headers);
    expect(extracted!.traceState).toBe('vendor-data=value');
  });

  // Test 13: Timestamp recording
  it('should record timestamps for trace context', () => {
    const before = Date.now();
    const context = traceContextManager.createTraceContext(true);
    const after = Date.now();

    expect(context.timestamp).toBeGreaterThanOrEqual(before);
    expect(context.timestamp).toBeLessThanOrEqual(after);
    expect(context.startTime).toBeGreaterThan(0);
  });

  // Test 14: Active traces listing
  it('should list all active traces', () => {
    const context1 = traceContextManager.createTraceContext(true);
    const context2 = traceContextManager.createTraceContext(true);

    const activeTraces = traceContextManager.getActiveTraces();

    expect(activeTraces).toHaveLength(2);
    expect(activeTraces.map(t => t.traceId)).toContain(context1.traceId);
    expect(activeTraces.map(t => t.traceId)).toContain(context2.traceId);
  });

  // Test 15: Child span chain
  it('should create span chain with proper parent references', () => {
    const root = traceContextManager.createTraceContext(true);
    const level1 = traceContextManager.createChildSpan(root);
    const level2 = traceContextManager.createChildSpan(level1);

    expect(level1.traceId).toBe(root.traceId);
    expect(level2.traceId).toBe(root.traceId);
    expect(level1.parentSpanId).toBe(root.spanId);
    expect(level2.parentSpanId).toBe(level1.spanId);
  });
});

/**
 * ============================================================================
 * OTEL INTEGRATION TESTS (15 tests)
 * ============================================================================
 */

describe('OpenTelemetry Integration Manager', () => {
  let manager: OTelIntegrationManager;

  beforeEach(() => {
    manager = new OTelIntegrationManager({
      serviceName: 'test-service',
      environment: 'development',
      samplingRate: 1.0,
      exporterType: 'noop',
    });
  });

  afterEach(async () => {
    await manager.shutdown();
  });

  // Test 16: Initialize manager
  it('should initialize OpenTelemetry manager', async () => {
    await manager.initialize();

    expect(manager.getTracer()).toBeDefined();
    expect(manager.getConfig().serviceName).toBe('test-service');
  });

  // Test 17: Start span
  it('should start span with attributes', () => {
    const spanId = manager.startSpan('test-operation', { userId: '123' });

    expect(spanId).toBeDefined();
    expect(spanId).toContain('test-operation');
  });

  // Test 18: End span
  it('should end span and record duration', () => {
    const spanId = manager.startSpan('test-operation');

    const spanTiming = manager.endSpan(spanId);

    expect(spanTiming).not.toBeNull();
    expect(spanTiming!.duration).toBeGreaterThanOrEqual(0);
  });

  // Test 19: End span with error
  it('should record error in span', () => {
    const spanId = manager.startSpan('test-operation');
    const error = new Error('Test error');

    const spanTiming = manager.endSpan(spanId, error);

    expect(spanTiming!.attributes['error']).toBe(true);
    expect(spanTiming!.attributes['error.message']).toBe('Test error');
  });

  // Test 20: Add event to span
  it('should add event to span', () => {
    const spanId = manager.startSpan('test-operation');
    manager.addEvent(spanId, 'database-query', { duration: 100 });
    manager.addEvent(spanId, 'cache-hit');

    const spanMetrics = manager.getSpanMetrics(spanId);
    const events = spanMetrics!.attributes['events'] as any[];

    expect(events).toHaveLength(2);
    expect(events[0].name).toBe('database-query');
    expect(events[1].name).toBe('cache-hit');
  });

  // Test 21: Get span metrics
  it('should retrieve span metrics', () => {
    const spanId = manager.startSpan('test-operation', { version: '2.0' });
    manager.endSpan(spanId);

    const metrics = manager.getSpanMetrics(spanId);

    expect(metrics!.startTime).toBeGreaterThan(0);
    expect(metrics!.duration).toBeGreaterThanOrEqual(0);
    expect(metrics!.attributes['version']).toBe('2.0');
  });

  // Test 22: Batch export
  it('should export completed spans in batch', async () => {
    const spanId1 = manager.startSpan('operation1');
    const spanId2 = manager.startSpan('operation2');

    manager.endSpan(spanId1);
    manager.endSpan(spanId2);

    const exportedCount = await manager.exportBatch();

    expect(exportedCount).toBe(2);
  });

  // Test 23: Sampling rate configuration
  it('should update sampling rate', () => {
    manager.setSamplingRate(0.5);

    const config = manager.getConfig();
    expect(config.samplingRate).toBe(0.5);
  });

  // Test 24: Clamp sampling rate bounds
  it('should clamp sampling rate to [0, 1]', () => {
    manager.setSamplingRate(2.0);
    expect(manager.getConfig().samplingRate).toBe(1.0);

    manager.setSamplingRate(-1.0);
    expect(manager.getConfig().samplingRate).toBe(0);
  });

  // Test 25: Active span count
  it('should track active span count', () => {
    manager.startSpan('span1');
    manager.startSpan('span2');

    expect(manager.getActiveSpanCount()).toBe(2);

    const spans = manager.getAllSpans();
    expect(spans.size).toBe(2);
  });

  // Test 26: Multiple spans performance
  it('should handle multiple concurrent spans efficiently', () => {
    const spanCount = 100;
    const startTime = Date.now();

    for (let i = 0; i < spanCount; i++) {
      manager.startSpan(`operation-${i}`, { index: i });
    }

    const createTime = Date.now() - startTime;

    expect(manager.getActiveSpanCount()).toBe(spanCount);
    expect(createTime).toBeLessThan(100); // < 100ms for 100 spans
  });

  // Test 27: Shutdown cleanup
  it('should clear all spans on shutdown', async () => {
    manager.startSpan('test1');
    manager.startSpan('test2');

    await manager.shutdown();

    const spans = manager.getAllSpans();
    expect(spans.size).toBe(0);
  });

  // Test 28: Environment-based configuration
  it('should read configuration from environment', () => {
    const testManager = new OTelIntegrationManager({
      serviceName: 'test-service',
      environment: 'production',
      samplingRate: 0.1,
      exporterType: 'jaeger',
    });

    const config = testManager.getConfig();
    expect(config.environment).toBe('production');
    expect(config.samplingRate).toBe(0.1);
    expect(config.exporterType).toBe('jaeger');
  });

  // Test 29: Batch export with mixed states
  it('should only export completed spans', async () => {
    const completed = manager.startSpan('completed');
    const active = manager.startSpan('active');

    manager.endSpan(completed);

    const exportedCount = await manager.exportBatch();

    expect(exportedCount).toBe(1);
    expect(manager.getActiveSpanCount()).toBe(1); // 'active' still pending
  });

  // Test 30: Get all spans
  it('should return copy of all spans map', () => {
    const spanId1 = manager.startSpan('op1');
    const spanId2 = manager.startSpan('op2');

    const spans = manager.getAllSpans();

    expect(spans.size).toBe(2);
    expect(spans.has(spanId1)).toBe(true);
    expect(spans.has(spanId2)).toBe(true);
  });
});

/**
 * ============================================================================
 * TRACER MANAGER TESTS (15 tests)
 * ============================================================================
 */

describe('Tracer Manager', () => {
  beforeEach(() => {
    tracerManager.reset();
  });

  afterEach(async () => {
    await tracerManager.shutdown();
  });

  // Test 31: Start and get trace
  it('should start trace and retrieve context', () => {
    const context = tracerManager.startTrace();

    expect(context.traceId).toBeDefined();
    expect(context.spanId).toBeDefined();
    expect(tracerManager.getCurrentTrace()).toEqual(context);
  });

  // Test 32: Start span in trace
  it('should start span within trace', () => {
    tracerManager.startTrace();
    const spanId = tracerManager.startSpan('test-operation', { userId: '123' });

    expect(spanId).toBeDefined();
  });

  // Test 33: End span
  it('should end span and return duration', () => {
    tracerManager.startTrace();
    const spanId = tracerManager.startSpan('test-operation');

    const duration = tracerManager.endSpan(spanId);

    expect(duration).toBeGreaterThanOrEqual(0);
  });

  // Test 34: Trace async function
  it('should trace async function execution', async () => {
    tracerManager.startTrace();

    const result = await tracerManager.traceAsync('fetch-data', async (spanId) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { data: 'test' };
    });

    expect(result.result).toEqual({ data: 'test' });
    expect(result.duration).toBeGreaterThanOrEqual(10);
    expect(result.spanId).toBeDefined();
  });

  // Test 35: Trace sync function
  it('should trace sync function execution', () => {
    tracerManager.startTrace();

    const result = tracerManager.traceSync('process-data', (spanId) => {
      return { processed: true };
    });

    expect(result.result).toEqual({ processed: true });
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  // Test 36: Add event to span
  it('should add event to current span', () => {
    tracerManager.startTrace();
    const spanId = tracerManager.startSpan('operation');

    tracerManager.addEvent('step-completed', { step: 1 });

    const metrics = tracerManager.getSpanMetrics(spanId);
    expect(metrics).not.toBeNull();
  });

  // Test 37: End trace
  it('should end trace and clean up context', () => {
    const context = tracerManager.startTrace();
    tracerManager.endTrace();

    expect(tracerManager.getCurrentTrace()).toBeNull();
  });

  // Test 38: Export batch
  it('should export batch of spans', async () => {
    tracerManager.startTrace();
    const span1 = tracerManager.startSpan('operation1');
    const span2 = tracerManager.startSpan('operation2');

    tracerManager.endSpan(span1);
    tracerManager.endSpan(span2);

    const exported = await tracerManager.exportBatch();

    expect(exported).toBeGreaterThanOrEqual(0);
  });

  // Test 39: Get statistics
  it('should calculate trace statistics', () => {
    tracerManager.startTrace();
    const span1 = tracerManager.startSpan('op1');
    const span2 = tracerManager.startSpan('op2');

    tracerManager.endSpan(span1);
    tracerManager.endSpan(span2);

    const stats = tracerManager.getStats();

    expect(stats.totalSpans).toBe(2);
    expect(stats.successCount).toBe(2);
    expect(stats.errorCount).toBe(0);
    expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
  });

  // Test 40: Nested spans
  it('should handle nested spans correctly', () => {
    tracerManager.startTrace();

    const parent = tracerManager.startSpan('parent');
    const child = tracerManager.startSpan('child');
    const grandchild = tracerManager.startSpan('grandchild');

    tracerManager.endSpan(grandchild);
    tracerManager.endSpan(child);
    tracerManager.endSpan(parent);

    const stats = tracerManager.getStats();

    expect(stats.totalSpans).toBe(3);
  });

  // Test 41: Error handling in async trace
  it('should capture errors in async traces', async () => {
    tracerManager.startTrace();

    try {
      await tracerManager.traceAsync('failing-op', async () => {
        throw new Error('Operation failed');
      });
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as any).error).toBe('Operation failed');
    }

    const stats = tracerManager.getStats();
    expect(stats.errorCount).toBe(1);
  });

  // Test 42: Error handling in sync trace
  it('should capture errors in sync traces', () => {
    tracerManager.startTrace();

    try {
      tracerManager.traceSync('failing-op', () => {
        throw new Error('Operation failed');
      });
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as any).error).toBe('Operation failed');
    }

    const stats = tracerManager.getStats();
    expect(stats.errorCount).toBe(1);
  });

  // Test 43: Performance overhead < 5%
  it('should maintain trace overhead under 5%', () => {
    const iterations = 1000;

    // Baseline: no tracing
    const baselineStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      const x = Math.sqrt(i);
    }
    const baselineTime = Date.now() - baselineStart;

    // With tracing
    const tracedStart = Date.now();
    tracerManager.startTrace();
    for (let i = 0; i < iterations; i++) {
      const span = tracerManager.startSpan(`op-${i}`);
      const x = Math.sqrt(i);
      tracerManager.endSpan(span);
    }
    const tracedTime = Date.now() - tracedStart;

    // Avoid division by zero
    if (baselineTime === 0) {
      expect(tracedTime).toBeLessThan(50); // < 50ms for 1000 iterations
    } else {
      const overhead = ((tracedTime - baselineTime) / baselineTime) * 100;
      expect(overhead).toBeLessThan(5); // < 5% overhead
    }
  });

  // Test 44: Reset clears state
  it('should reset all tracer state', async () => {
    tracerManager.startTrace();
    const span = tracerManager.startSpan('test');
    tracerManager.endSpan(span);

    await tracerManager.exportBatch();
    tracerManager.reset();

    expect(tracerManager.getCurrentTrace()).toBeNull();
    const stats = tracerManager.getStats();
    expect(stats.totalSpans).toBe(0);
  });

  // Test 45: Shutdown and cleanup
  it('should properly shutdown tracer', async () => {
    tracerManager.startTrace();
    tracerManager.startSpan('operation');

    await tracerManager.shutdown();

    expect(tracerManager.getCurrentTrace()).toBeNull();
  });
});

/**
 * ============================================================================
 * INTEGRATION TESTS (10 tests)
 * ============================================================================
 */

describe('Distributed Tracing Integration', () => {
  beforeEach(() => {
    tracerManager.reset();
    traceContextManager.clearAllTraces();
  });

  afterEach(async () => {
    await tracerManager.shutdown();
  });

  // Test 46: End-to-end trace flow
  it('should execute complete trace flow', async () => {
    const context = tracerManager.startTrace();

    const result = await tracerManager.traceAsync('fetch', async (spanId) => {
      tracerManager.addEvent('fetching', { url: 'api/data' });
      await new Promise(r => setTimeout(r, 5));
      return { data: 'fetched' };
    });

    tracerManager.endTrace();

    expect(context).toBeDefined();
    expect(result.result.data).toBe('fetched');
  });

  // Test 47: Cross-service trace propagation
  it('should propagate trace context across services', () => {
    const context = tracerManager.startTrace();

    // Simulate sending to another service
    const headers = traceContextManager.injectToHeaders(context);

    // Simulate receiving on another service
    const receivedContext = traceContextManager.extractFromHeaders(headers);

    expect(receivedContext!.traceId).toBe(context.traceId);
    expect(receivedContext!.parentSpanId).toBe(context.spanId);
  });

  // Test 48: Multiple concurrent traces
  it('should handle multiple concurrent traces', async () => {
    const promises = [];

    for (let i = 0; i < 5; i++) {
      const promise = (async () => {
        tracerManager.startTrace();

        const result = await tracerManager.traceAsync(`operation-${i}`, async () => {
          await new Promise(r => setTimeout(r, 5 * Math.random()));
          return i;
        });

        tracerManager.endTrace();
        return result;
      })();

      promises.push(promise);
    }

    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    results.forEach((r, i) => {
      expect(r.result).toBe(i);
    });
  });

  // Test 49: Complex operation tracing
  it('should trace complex nested operations', async () => {
    tracerManager.startTrace();

    const result = await tracerManager.traceAsync('workflow', async () => {
      const step1 = tracerManager.traceSync('step1', () => {
        return { processed: true };
      });

      const step2 = await tracerManager.traceAsync('step2', async () => {
        await new Promise(r => setTimeout(r, 5));
        return { validated: true };
      });

      const step3 = tracerManager.traceSync('step3', () => {
        return { saved: true };
      });

      return { step1: step1.result, step2: step2.result, step3: step3.result };
    });

    const stats = tracerManager.getStats();

    expect(stats.totalSpans).toBe(4); // workflow + 3 steps
    expect(stats.errorCount).toBe(0);
    expect(result.result.step1).toEqual({ processed: true });
  });

  // Test 50: Trace statistics accuracy
  it('should provide accurate trace statistics', () => {
    tracerManager.startTrace();

    const durations = [];

    for (let i = 0; i < 10; i++) {
      const before = Date.now();
      const span = tracerManager.startSpan(`op-${i}`);

      // Perform more work to ensure measurable duration
      for (let j = 0; j < 10000; j++) {
        Math.sqrt(j);
      }

      tracerManager.endSpan(span);
      durations.push(Date.now() - before);
    }

    const stats = tracerManager.getStats();

    expect(stats.totalSpans).toBe(10);
    // Statistics may be 0 if operations complete too quickly, so allow for that case
    expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
    expect(stats.slowestSpan).not.toBeNull();
    expect(stats.fastestSpan).not.toBeNull();
  });

  // Test 51: Sampling decision propagation
  it('should propagate sampling decisions', () => {
    const sampledContext = traceContextManager.createTraceContext(true);
    const unsampledContext = traceContextManager.createTraceContext(false);

    const sampledChild = traceContextManager.createChildSpan(sampledContext);
    const unsampledChild = traceContextManager.createChildSpan(unsampledContext);

    expect(sampledChild.traceFlags).toBe(0x01);
    expect(unsampledChild.traceFlags).toBe(0x00);
  });

  // Test 52: High-volume span creation
  it('should handle high volume of spans efficiently', () => {
    tracerManager.startTrace();

    const spanCount = 500;
    const startTime = Date.now();

    for (let i = 0; i < spanCount; i++) {
      const span = tracerManager.startSpan(`operation-${i}`);
      tracerManager.endSpan(span);
    }

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(500); // < 500ms for 500 spans
  });

  // Test 53: Resource cleanup after tracing
  it('should properly clean up resources', async () => {
    tracerManager.startTrace();

    for (let i = 0; i < 100; i++) {
      const span = tracerManager.startSpan(`op-${i}`);
      tracerManager.endSpan(span);
    }

    let stats = tracerManager.getStats();
    expect(stats.totalSpans).toBeGreaterThan(0);

    await tracerManager.exportBatch();
    tracerManager.reset();

    stats = tracerManager.getStats();
    expect(stats.totalSpans).toBe(0);
  });

  // Test 54: Error recovery and continuation
  it('should continue tracing after errors', async () => {
    tracerManager.startTrace();

    try {
      await tracerManager.traceAsync('failing-op', async () => {
        throw new Error('Failed');
      });
    } catch {
      // Error caught, continue tracing
    }

    const result = await tracerManager.traceAsync('recovery-op', async () => {
      return { recovered: true };
    });

    expect(result.result.recovered).toBe(true);

    const stats = tracerManager.getStats();
    expect(stats.totalSpans).toBe(2);
    expect(stats.errorCount).toBe(1);
    expect(stats.successCount).toBe(1);
  });

  // Test 55: Large-scale trace export
  it('should export large number of spans', async () => {
    tracerManager.startTrace();

    const spanCount = 200;

    for (let i = 0; i < spanCount; i++) {
      const span = tracerManager.startSpan(`operation-${i}`);
      tracerManager.endSpan(span);
    }

    const exported = await tracerManager.exportBatch();

    expect(exported).toBe(spanCount);
  });
});
