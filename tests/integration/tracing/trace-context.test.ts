/**
 * Trace Context Management Integration Tests
 *
 * Test Suite for Phase 6.8 Step 2: AsyncLocalStorage context management
 *
 * QUALITY GATES:
 * 1. Context created with valid OpenTelemetry format IDs
 * 2. Context isolated across async boundaries
 * 3. Baggage propagation works correctly
 * 4. W3C Trace Context headers format correctly
 * 5. Nested async operations preserve context
 */

/* eslint-disable no-undef */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTraceContext,
  runWithTraceContext,
  runWithTraceContextSync,
  getTraceContext,
  addBaggage,
  getBaggage,
  getAllBaggage,
  formatTraceContext,
  getTraceHeaders,
  parseTraceHeaders,
  getTraceContextHealth,
  type TraceContext,
} from '@/lib/tracing/trace-context';

describe('Trace Context Management - Phase 6.8 Step 2', () => {
  describe('QUALITY GATE 1: Context Creation with Valid IDs', () => {
    it('should create context with valid OpenTelemetry format IDs', () => {
      const context = createTraceContext();

      // Trace ID: 32 hex characters
      expect(context.traceId).toMatch(/^[0-9a-f]{32}$/);

      // Span ID: 16 hex characters
      expect(context.spanId).toMatch(/^[0-9a-f]{16}$/);

      // Request ID: UUID format
      expect(context.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should allow overriding context values', () => {
      const custom = createTraceContext({
        traceId: '0'.repeat(32),
        spanId: '1'.repeat(16),
        requestId: '00000000-0000-0000-0000-000000000000',
      });

      expect(custom.traceId).toBe('0'.repeat(32));
      expect(custom.spanId).toBe('1'.repeat(16));
      expect(custom.requestId).toBe('00000000-0000-0000-0000-000000000000');
    });

    it('should include createdAt timestamp', () => {
      const before = Date.now();
      const context = createTraceContext();
      const after = Date.now();

      expect(context.createdAt).toBeGreaterThanOrEqual(before);
      expect(context.createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe('QUALITY GATE 2: Context Isolation Across Async Boundaries', () => {
    it('should provide context within runWithTraceContext block', async () => {
      const context = createTraceContext();

      await runWithTraceContext(context, async () => {
        const activeContext = getTraceContext();
        expect(activeContext).toEqual(context);
      });
    });

    it('should return undefined context outside runWithTraceContext', () => {
      const context = getTraceContext();
      expect(context).toBeUndefined();
    });

    it('should isolate context between parallel operations', async () => {
      const context1 = createTraceContext({ requestId: 'req-1' });
      const context2 = createTraceContext({ requestId: 'req-2' });

      const results: Array<string> = [];

      await Promise.all([
        runWithTraceContext(context1, async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          const ctx = getTraceContext();
          results.push(ctx?.requestId || 'NONE');
        }),
        runWithTraceContext(context2, async () => {
          const ctx = getTraceContext();
          results.push(ctx?.requestId || 'NONE');
        }),
      ]);

      // Both operations should have their own context
      expect(results.sort()).toEqual(['req-1', 'req-2'].sort());
    });
  });

  describe('QUALITY GATE 3: Baggage Propagation', () => {
    it('should add and retrieve baggage', async () => {
      const context = createTraceContext();

      await runWithTraceContext(context, async () => {
        addBaggage('userId', '123');
        addBaggage('tenantId', 'acme');

        expect(getBaggage('userId')).toBe('123');
        expect(getBaggage('tenantId')).toBe('acme');
      });
    });

    it('should return all baggage', async () => {
      const context = createTraceContext({
        baggage: { existing: 'value' },
      });

      await runWithTraceContext(context, async () => {
        addBaggage('new', 'data');

        const all = getAllBaggage();
        expect(all).toEqual({
          existing: 'value',
          new: 'data',
        });
      });
    });

    it('should propagate baggage through nested async operations', async () => {
      const context = createTraceContext();

      await runWithTraceContext(context, async () => {
        addBaggage('level1', 'value1');

        await new Promise((resolve) => setTimeout(resolve, 5));

        addBaggage('level2', 'value2');

        const all = getAllBaggage();
        expect(all).toEqual({
          level1: 'value1',
          level2: 'value2',
        });
      });
    });
  });

  describe('QUALITY GATE 4: W3C Trace Context Headers', () => {
    it('should format traceparent header correctly', async () => {
      const context = createTraceContext({
        traceId: 'a'.repeat(32),
        spanId: 'b'.repeat(16),
      });

      await runWithTraceContext(context, () => {
        const headers = getTraceHeaders();

        // Format: version-traceId-spanId-flags
        expect(headers['traceparent']).toBe(
          `00-${'a'.repeat(32)}-${'b'.repeat(16)}-01`
        );
        expect(headers['x-request-id']).toBe(context.requestId);
      });
    });

    it('should include baggage in headers', async () => {
      const context = createTraceContext();

      await runWithTraceContext(context, async () => {
        addBaggage('userId', '123');
        addBaggage('tier', 'premium');

        const headers = getTraceHeaders();

        expect(headers['baggage']).toContain('userId=123');
        expect(headers['baggage']).toContain('tier=premium');
      });
    });

    it('should handle special characters in baggage', async () => {
      const context = createTraceContext();

      await runWithTraceContext(context, async () => {
        addBaggage('email', 'user@example.com');
        addBaggage('path', '/api/users?id=123');

        const headers = getTraceHeaders();
        const baggage = headers['baggage'];

        expect(baggage).toContain('email=user%40example.com');
        expect(baggage).toContain('path=%2Fapi%2Fusers%3Fid%3D123');
      });
    });
  });

  describe('QUALITY GATE 5: Trace Header Parsing', () => {
    it('should parse valid W3C traceparent header', () => {
      const headers = {
        traceparent: `00-${'a'.repeat(32)}-${'b'.repeat(16)}-01`,
      };

      const context = parseTraceHeaders(headers);

      expect(context.traceId).toBe('a'.repeat(32));
      expect(context.spanId).toBe('b'.repeat(16));
    });

    it('should parse baggage from headers', () => {
      const headers = {
        baggage: 'userId=456,tier=free',
      };

      const context = parseTraceHeaders(headers);

      expect(context.baggage).toEqual({
        userId: '456',
        tier: 'free',
      });
    });

    it('should decode special characters in baggage', () => {
      const headers = {
        baggage: 'email=user%40example.com',
      };

      const context = parseTraceHeaders(headers);

      expect(context.baggage?.email).toBe('user@example.com');
    });

    it('should handle invalid traceparent gracefully', () => {
      const headers = {
        traceparent: 'invalid-format',
      };

      const context = parseTraceHeaders(headers);

      expect(context.traceId).toBeUndefined();
      expect(context.spanId).toBeUndefined();
      expect(context.requestId).toBeDefined();
    });
  });

  describe('QUALITY GATE 6: Nested Async Operations', () => {
    it('should preserve context in nested promises', async () => {
      const context = createTraceContext({ requestId: 'nested-test' });

      await runWithTraceContext(context, async () => {
        // Outer level
        const outer = getTraceContext();
        expect(outer?.requestId).toBe('nested-test');

        // Nested Promise
        await Promise.resolve().then(() => {
          const inner = getTraceContext();
          expect(inner?.requestId).toBe('nested-test');
        });

        // After nested promise
        const afterNested = getTraceContext();
        expect(afterNested?.requestId).toBe('nested-test');
      });
    });

    it('should preserve context through setTimeout', async () => {
      const context = createTraceContext({ requestId: 'timeout-test' });

      await runWithTraceContext(context, async () => {
        await new Promise((resolve) => {
          setTimeout(() => {
            const timedContext = getTraceContext();
            expect(timedContext?.requestId).toBe('timeout-test');
            resolve(null);
          }, 5);
        });
      });
    });
  });

  describe('QUALITY GATE 7: Formatting and Health', () => {
    it('should format trace context for logging', async () => {
      const context = createTraceContext();

      await runWithTraceContext(context, () => {
        const formatted = formatTraceContext();

        expect(formatted).toContain('traceId=');
        expect(formatted).toContain('spanId=');
        expect(formatted).toContain('requestId=');
      });
    });

    it('should return NO_TRACE_CONTEXT when none active', () => {
      const formatted = formatTraceContext();
      expect(formatted).toBe('NO_TRACE_CONTEXT');
    });

    it('should report health status', async () => {
      const context = createTraceContext();

      // Outside context
      let health = getTraceContextHealth();
      expect(health.active).toBe(false);
      expect(health.context).toBeUndefined();

      // Inside context
      await runWithTraceContext(context, () => {
        health = getTraceContextHealth();
        expect(health.active).toBe(true);
        expect(health.context).toEqual(context);
      });
    });
  });

  describe('QUALITY GATE 8: Sync Operations', () => {
    it('should support synchronous context operations', () => {
      const context = createTraceContext();

      const result = runWithTraceContextSync(context, () => {
        const activeContext = getTraceContext();
        return activeContext?.requestId;
      });

      expect(result).toBe(context.requestId);
    });
  });
});
