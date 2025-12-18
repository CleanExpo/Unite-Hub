/**
 * M1 Tracer Manager
 *
 * High-level orchestration for distributed tracing
 * Manages span lifecycle, context propagation, and performance monitoring
 *
 * Version: v2.4.2
 * Phase: 11C - Distributed Tracing
 */

import { TraceContext, traceContextManager, SpanAttributes } from './trace-context';
import { otelManager, OTelConfig, SpanTiming } from './otel-integrations';

/**
 * Traced operation result
 */
export interface TracedResult<T> {
  result: T;
  spanId: string;
  duration: number;
  attributes: Record<string, unknown>;
}

/**
 * Trace statistics
 */
export interface TraceStats {
  totalSpans: number;
  activeSpans: number;
  totalDuration: number;
  averageDuration: number;
  slowestSpan: { name: string; duration: number } | null;
  fastestSpan: { name: string; duration: number } | null;
  errorCount: number;
  successCount: number;
}

/**
 * Tracer Manager - High-level tracing API
 */
export class TracerManager {
  private traceContext: TraceContext | null = null;
  private spanStack: string[] = [];
  private spanMetrics: Map<string, SpanTiming[]> = new Map();
  private errorSpans: Set<string> = new Set();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize tracer manager
   */
  private async initialize(): Promise<void> {
    await otelManager.initialize();
  }

  /**
   * Start a new trace
   */
  startTrace(): TraceContext {
    const context = traceContextManager.createTraceContext(true);
    this.traceContext = context;
    traceContextManager.setActiveContext(context);
    return context;
  }

  /**
   * Get current trace context
   */
  getCurrentTrace(): TraceContext | null {
    return this.traceContext;
  }

  /**
   * End current trace
   */
  endTrace(): void {
    if (this.traceContext) {
      traceContextManager.clearTrace(this.traceContext.traceId);
      this.traceContext = null;
    }
  }

  /**
   * Start a child span within trace
   */
  startSpan(
    spanName: string,
    attributes?: SpanAttributes
  ): string {
    if (!this.traceContext) {
      this.startTrace();
    }

    const spanId = otelManager.startSpan(spanName, {
      trace_id: this.traceContext?.traceId,
      parent_span: this.spanStack.length > 0 ? this.spanStack[this.spanStack.length - 1] : null,
      ...attributes,
    });

    this.spanStack.push(spanId);

    // Record for metrics
    if (!this.spanMetrics.has(spanName)) {
      this.spanMetrics.set(spanName, []);
    }

    return spanId;
  }

  /**
   * End current span
   */
  endSpan(spanId: string, error?: Error | null): number {
    const spanTiming = otelManager.endSpan(spanId, error);

    if (error) {
      this.errorSpans.add(spanId);
    }

    if (this.spanStack.length > 0 && this.spanStack[this.spanStack.length - 1] === spanId) {
      this.spanStack.pop();
    }

    return spanTiming?.duration || 0;
  }

  /**
   * Add event to current span
   */
  addEvent(eventName: string, attributes?: Record<string, unknown>): void {
    if (this.spanStack.length > 0) {
      const currentSpanId = this.spanStack[this.spanStack.length - 1];
      otelManager.addEvent(currentSpanId, eventName, attributes);
    }
  }

  /**
   * Wrap async function with tracing
   */
  async traceAsync<T>(
    spanName: string,
    fn: (spanId: string) => Promise<T>,
    attributes?: SpanAttributes
  ): Promise<TracedResult<T>> {
    const spanId = this.startSpan(spanName, attributes);
    const startTime = Date.now();

    try {
      const result = await fn(spanId);
      const duration = Date.now() - startTime;

      this.endSpan(spanId);
      return {
        result,
        spanId,
        duration,
        attributes: attributes || {},
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.endSpan(spanId, error instanceof Error ? error : new Error(String(error)));

      throw {
        result: null,
        spanId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        attributes: attributes || {},
      };
    }
  }

  /**
   * Wrap sync function with tracing
   */
  traceSync<T>(
    spanName: string,
    fn: (spanId: string) => T,
    attributes?: SpanAttributes
  ): TracedResult<T> {
    const spanId = this.startSpan(spanName, attributes);
    const startTime = Date.now();

    try {
      const result = fn(spanId);
      const duration = Date.now() - startTime;

      this.endSpan(spanId);
      return {
        result,
        spanId,
        duration,
        attributes: attributes || {},
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.endSpan(spanId, error instanceof Error ? error : new Error(String(error)));

      throw {
        result: null,
        spanId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        attributes: attributes || {},
      };
    }
  }

  /**
   * Get span metrics
   */
  getSpanMetrics(spanId: string): SpanTiming | null {
    return otelManager.getSpanMetrics(spanId);
  }

  /**
   * Export current batch of spans
   */
  async exportBatch(): Promise<number> {
    return otelManager.exportBatch();
  }

  /**
   * Get trace statistics
   */
  getStats(): TraceStats {
    const spans = otelManager.getAllSpans();
    const durations = Array.from(spans.values())
      .filter(s => s.duration !== undefined)
      .map(s => s.duration as number);

    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = durations.length > 0 ? totalDuration / durations.length : 0;

    let slowestSpan: { name: string; duration: number } | null = null;
    let fastestSpan: { name: string; duration: number } | null = null;

    if (durations.length > 0) {
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      for (const [spanId, spanTiming] of spans) {
        if (spanTiming.duration === maxDuration && !slowestSpan) {
          slowestSpan = {
            name: spanId.split('-')[0],
            duration: maxDuration,
          };
        }
        if (spanTiming.duration === minDuration && !fastestSpan) {
          fastestSpan = {
            name: spanId.split('-')[0],
            duration: minDuration,
          };
        }
      }
    }

    return {
      totalSpans: spans.size,
      activeSpans: otelManager.getActiveSpanCount(),
      totalDuration,
      averageDuration,
      slowestSpan,
      fastestSpan,
      errorCount: this.errorSpans.size,
      successCount: spans.size - this.errorSpans.size,
    };
  }

  /**
   * Reset tracer state
   */
  reset(): void {
    this.traceContext = null;
    this.spanStack = [];
    this.spanMetrics.clear();
    this.errorSpans.clear();
    // Also clear OTel manager spans
    otelManager.getAllSpans().clear?.();
  }

  /**
   * Shutdown tracer
   */
  async shutdown(): Promise<void> {
    await this.exportBatch();
    await otelManager.shutdown();
    this.reset();
  }
}

// Export singleton
export const tracerManager = new TracerManager();
