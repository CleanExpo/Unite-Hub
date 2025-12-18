/**
 * M1 Trace Context Management
 *
 * Manages distributed trace context propagation across service boundaries
 * Implements W3C Trace Context standard for interoperability
 *
 * Version: v2.4.2
 * Phase: 11C - Distributed Tracing
 */

import { v4 as generateUUID } from 'uuid';

/**
 * Trace context following W3C standard
 */
export interface TraceContext {
  traceId: string;           // 32-char hex: globally unique trace identifier
  spanId: string;            // 16-char hex: current span identifier
  parentSpanId?: string;     // 16-char hex: parent span identifier (optional)
  traceFlags: number;        // 0x01 = sampled, 0x00 = not sampled
  traceState?: string;       // Vendor-specific trace state
  timestamp: number;         // When trace context was created
  startTime: number;         // Performance.now() equivalent for duration tracking
}

/**
 * Span attributes for enriched tracing
 */
export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Trace context manager
 */
export class TraceContextManager {
  private activeContexts: Map<string, TraceContext> = new Map();
  private contextStack: TraceContext[] = [];

  /**
   * Create new trace context
   */
  createTraceContext(sampled: boolean = true): TraceContext {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    const now = Date.now();

    const context: TraceContext = {
      traceId,
      spanId,
      traceFlags: sampled ? 0x01 : 0x00,
      timestamp: now,
      startTime: this.getNanoTimestamp(),
    };

    this.activeContexts.set(traceId, context);
    return context;
  }

  /**
   * Create child span from parent context
   */
  createChildSpan(parentContext: TraceContext): TraceContext {
    const childSpanId = this.generateSpanId();

    const childContext: TraceContext = {
      traceId: parentContext.traceId,
      spanId: childSpanId,
      parentSpanId: parentContext.spanId,
      traceFlags: parentContext.traceFlags,
      traceState: parentContext.traceState,
      timestamp: Date.now(),
      startTime: this.getNanoTimestamp(),
    };

    return childContext;
  }

  /**
   * Extract trace context from HTTP headers (W3C format)
   * Format: traceparent: 00-traceId-spanId-flags
   */
  extractFromHeaders(headers: Record<string, string>): TraceContext | null {
    const traceparent = headers['traceparent'] || headers['w3c-trace-parent'];
    if (!traceparent) {
return null;
}

    try {
      const parts = traceparent.split('-');
      if (parts.length < 4) {
return null;
}

      const [version, traceId, spanId, flags] = parts;

      if (version !== '00') {
return null;
} // Only version 00 supported
      if (traceId.length !== 32 || spanId.length !== 16) {
return null;
}

      const context: TraceContext = {
        traceId,
        spanId: this.generateSpanId(), // Generate new spanId for this service
        parentSpanId: spanId,
        traceFlags: parseInt(flags, 16),
        traceState: headers['tracestate'],
        timestamp: Date.now(),
        startTime: this.getNanoTimestamp(),
      };

      this.activeContexts.set(context.traceId, context);
      return context;
    } catch {
      return null;
    }
  }

  /**
   * Inject trace context into HTTP headers (W3C format)
   */
  injectToHeaders(context: TraceContext): Record<string, string> {
    const traceparent = `00-${context.traceId}-${context.spanId}-${context.traceFlags.toString(16).padStart(2, '0')}`;

    const headers: Record<string, string> = {
      'traceparent': traceparent,
    };

    if (context.traceState) {
      headers['tracestate'] = context.traceState;
    }

    return headers;
  }

  /**
   * Set active context (use in async context if needed)
   */
  setActiveContext(context: TraceContext): void {
    this.contextStack.push(context);
  }

  /**
   * Get active context
   */
  getActiveContext(): TraceContext | null {
    return this.contextStack.length > 0 ? this.contextStack[this.contextStack.length - 1] : null;
  }

  /**
   * Pop active context
   */
  popActiveContext(): TraceContext | null {
    return this.contextStack.pop() || null;
  }

  /**
   * Get trace context by ID
   */
  getTraceContext(traceId: string): TraceContext | null {
    return this.activeContexts.get(traceId) || null;
  }

  /**
   * Clear completed trace
   */
  clearTrace(traceId: string): void {
    this.activeContexts.delete(traceId);
  }

  /**
   * Generate W3C-compliant trace ID (32-char hex)
   */
  private generateTraceId(): string {
    // Generate 16 random bytes, convert to 32-char hex
    const uuid = generateUUID().replace(/-/g, '');
    return uuid.substring(0, 32);
  }

  /**
   * Generate W3C-compliant span ID (16-char hex)
   */
  private generateSpanId(): string {
    // Generate 8 random bytes, convert to 16-char hex
    const uuid = generateUUID().replace(/-/g, '');
    return uuid.substring(0, 16);
  }

  /**
   * Get high-resolution timestamp in nanoseconds
   */
  private getNanoTimestamp(): number {
    // Use performance.now() if available, fallback to Date.now() * 1_000_000
    if (typeof performance !== 'undefined' && performance.now) {
      return Math.floor(performance.now() * 1_000_000); // Convert ms to ns
    }
    return Date.now() * 1_000_000;
  }

  /**
   * Get all active traces
   */
  getActiveTraces(): TraceContext[] {
    return Array.from(this.activeContexts.values());
  }

  /**
   * Clear all traces
   */
  clearAllTraces(): void {
    this.activeContexts.clear();
    this.contextStack = [];
  }
}

// Export singleton
export const traceContextManager = new TraceContextManager();
