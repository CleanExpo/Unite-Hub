import { describe, it, expect } from 'vitest';
import {
  createSpan,
  recordSpanEvent,
  finalizeSpan,
  traceAsync,
  traceSync,
  generateSpanId,
  instrumentHttpRequest,
  recordHttpResponse,
  instrumentDatabaseQuery,
  recordDatabaseResult,
  getSpanContext,
  createCorrelationId,
  formatSpan,
  exportSpan,
} from '@/lib/tracing/instrumentation-utilities';
import {
  createTraceContext,
  runWithTraceContext,
} from '@/lib/tracing/trace-context';

describe('Instrumentation Utilities - Phase 6.8 Step 3', () => {
  describe('QUALITY GATE 1: Span Creation', () => {
    it('should create span with valid ID format', () => {
      const span = createSpan({ operationName: 'test_op' });
      expect(span.spanId).toMatch(/^[0-9a-f]{16}$/);
      expect(span.operationName).toBe('test_op');
      expect(span.status).toBe('pending');
    });

    it('should link to parent span from trace context', async () => {
      const context = createTraceContext();
      await runWithTraceContext(context, () => {
        const span = createSpan({ operationName: 'child' });
        expect(span.parentSpanId).toBe(context.spanId);
      });
    });

    it('should include service name in attributes', () => {
      const span = createSpan({ operationName: 'test' });
      expect(span.attributes['service.name']).toBe('unite-hub');
    });
  });

  describe('QUALITY GATE 2: Async Span Tracking', () => {
    it('should track async operation success', async () => {
      const result = await traceAsync(
        async () => 'success',
        { operationName: 'async_op' }
      );
      expect(result).toBe('success');
    });

    it('should handle async operation errors', async () => {
      await expect(
        traceAsync(
          async () => {
 throw new Error('async error'); 
},
          { operationName: 'failing_op', recordError: true }
        )
      ).rejects.toThrow('async error');
    });
  });

  describe('QUALITY GATE 3: Sync Span Tracking', () => {
    it('should track sync operation success', () => {
      const result = traceSync(
        () => 'sync_result',
        { operationName: 'sync_op' }
      );
      expect(result).toBe('sync_result');
    });

    it('should handle sync operation errors', () => {
      expect(() => {
        traceSync(
          () => {
 throw new Error('sync error'); 
},
          { operationName: 'failing_sync', recordError: true }
        );
      }).toThrow('sync error');
    });
  });

  describe('QUALITY GATE 4: HTTP Instrumentation', () => {
    it('should instrument HTTP request', () => {
      const context = createTraceContext();
      runWithTraceContext(context, () => {
        const { span, headers } = instrumentHttpRequest('GET', '/api/test');
        expect(span.method).toBe('GET');
        expect(span.url).toBe('/api/test');
        expect(headers['traceparent']).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
      });
    });

    it('should record HTTP response', () => {
      const span = {
        spanId: generateSpanId(),
        operationName: 'http.request',
        method: 'GET',
        url: '/api/test',
        startTime: Date.now(),
        status: 'pending',
        attributes: {},
        events: [],
      };
      const finalized = recordHttpResponse(span, 200, 1024);
      expect(finalized.statusCode).toBe(200);
      expect(finalized.contentLength).toBe(1024);
      expect(finalized.status).toBe('success');
    });
  });

  describe('QUALITY GATE 5: Database Instrumentation', () => {
    it('should instrument database query', () => {
      const span = instrumentDatabaseQuery(
        'postgres',
        'unite_hub',
        'SELECT * FROM contacts WHERE id = ?',
        1
      );
      expect(span.dbSystem).toBe('postgres');
      expect(span.dbName).toBe('unite_hub');
      expect(span.statement).toContain('SELECT');
    });

    it('should record query results', () => {
      const span = instrumentDatabaseQuery('postgres', 'db', 'INSERT INTO contacts VALUES (...)', 3);
      const finalized = recordDatabaseResult(span, 1, 0);
      expect(finalized.rowsAffected).toBe(1);
      expect(finalized.status).toBe('success');
    });

    it('should record query errors', () => {
      const span = instrumentDatabaseQuery('postgres', 'db', 'SELECT invalid', 0);
      const error = new Error('syntax error');
      const finalized = recordDatabaseResult(span, 0, 0, error);
      expect(finalized.status).toBe('error');
      expect(finalized.error).toBeDefined();
    });
  });

  describe('QUALITY GATE 6: Span Events and Correlation', () => {
    it('should record span events', () => {
      const span = createSpan({ operationName: 'event_test' });
      recordSpanEvent(span, 'event_one', { key: 'value' });
      expect(span.events.length).toBe(1);
      expect(span.events[0].name).toBe('event_one');
    });

    it('should generate correlation IDs', () => {
      const context = createTraceContext();
      runWithTraceContext(context, () => {
        const correlationId = createCorrelationId();
        expect(correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{8}$/);
      });
    });

    it('should get span context from trace', async () => {
      const context = createTraceContext();
      await runWithTraceContext(context, () => {
        const spanContext = getSpanContext();
        expect(spanContext.traceId).toBe(context.traceId);
      });
    });
  });

  describe('QUALITY GATE 7: Span Export and Formatting', () => {
    it('should format span for logging', () => {
      const span = createSpan({ operationName: 'format_test' });
      const finalized = finalizeSpan(span, 'success');
      const formatted = formatSpan(finalized);
      expect(formatted).toContain('[SUCCESS]');
      expect(formatted).toContain('format_test');
    });

    it('should export span with all data', () => {
      const span = createSpan({ operationName: 'export_test' });
      const finalized = finalizeSpan(span, 'success');
      const exported = exportSpan(finalized);
      expect(exported.spanId).toBeDefined();
      expect(exported.operationName).toBe('export_test');
    });

    it('should export error information', () => {
      const span = createSpan({ operationName: 'error_export' });
      const testError = new Error('test error');
      const errorSpan = finalizeSpan(span, 'error', testError);
      const exported = exportSpan(errorSpan);
      expect(exported.error?.message).toBe('test error');
      expect(exported.status).toBe('error');
    });
  });

  describe('QUALITY GATE 8: Span ID Generation', () => {
    it('should generate unique span IDs', () => {
      const id1 = generateSpanId();
      const id2 = generateSpanId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[0-9a-f]{16}$/);
    });
  });
});
