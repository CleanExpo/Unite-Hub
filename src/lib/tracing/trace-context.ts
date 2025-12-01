/**
 * Trace Context Management with AsyncLocalStorage
 *
 * Manages request-scoped trace context across async boundaries in Node.js
 *
 * Features:
 * - Request context isolation (traceId, spanId, baggage)
 * - Automatic context propagation through async/await
 * - No manual context passing required
 * - Compatible with OpenTelemetry SDK
 *
 * @module lib/tracing/trace-context
 */

 

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

/**
 * Trace context data stored per-request
 */
export interface TraceContext {
  /**
   * Unique trace ID (follows OpenTelemetry format)
   * Format: 32 hex characters
   */
  traceId: string;

  /**
   * Parent span ID for this context
   * Format: 16 hex characters
   */
  spanId: string;

  /**
   * Request ID for debugging and correlation
   * UUID format
   */
  requestId: string;

  /**
   * Baggage: arbitrary key-value pairs propagated with trace
   * Useful for adding business context (userId, tenantId, etc.)
   */
  baggage: Record<string, string>;

  /**
   * Timestamp when context was created
   */
  createdAt: number;

  /**
   * Workspace ID for multi-tenant isolation
   */
  workspaceId?: string;

  /**
   * User ID for request attribution
   */
  userId?: string;
}

/**
 * AsyncLocalStorage instance for trace context
 * Automatically isolates context per async execution context
 */
const traceContextStorage = new AsyncLocalStorage<TraceContext>();

/**
 * Generate OpenTelemetry-format trace ID (32 hex characters)
 */
function generateTraceId(): string {
  // Convert UUID to OpenTelemetry format (remove hyphens, left-pad with zeros)
  const uuid = randomUUID().replace(/-/g, '');
  return uuid.padStart(32, '0');
}

/**
 * Generate OpenTelemetry-format span ID (16 hex characters)
 */
function generateSpanId(): string {
  // Generate 8 random bytes = 16 hex characters
  return randomUUID().replace(/-/g, '').substring(0, 16);
}

/**
 * Create new trace context for a request
 *
 * QUALITY GATE: Must generate valid OpenTelemetry-format IDs
 */
export function createTraceContext(overrides?: Partial<TraceContext>): TraceContext {
  return {
    traceId: overrides?.traceId || generateTraceId(),
    spanId: overrides?.spanId || generateSpanId(),
    requestId: overrides?.requestId || randomUUID(),
    baggage: overrides?.baggage || {},
    createdAt: Date.now(),
    workspaceId: overrides?.workspaceId,
    userId: overrides?.userId,
  };
}

/**
 * Run function within a trace context
 *
 * All async operations within fn will have access to the context
 * via getTraceContext()
 *
 * QUALITY GATE: Context must be available to nested async operations
 */
export async function runWithTraceContext<T>(
  context: TraceContext,
  fn: () => Promise<T>
): Promise<T> {
  return traceContextStorage.run(context, fn);
}

/**
 * Run synchronous function within a trace context
 */
export function runWithTraceContextSync<T>(
  context: TraceContext,
  fn: () => T
): T {
  return traceContextStorage.run(context, fn) as T;
}

/**
 * Get current trace context
 *
 * Returns null if no context is active
 * Safe to call from any async function within a runWithTraceContext block
 *
 * QUALITY GATE: Must return context in nested async operations
 */
export function getTraceContext(): TraceContext | undefined {
  return traceContextStorage.getStore();
}

/**
 * Add baggage to current trace context
 *
 * Baggage is propagated across async boundaries
 * Useful for adding business context (userId, tenantId, etc.)
 */
export function addBaggage(key: string, value: string): void {
  const context = getTraceContext();
  if (context) {
    context.baggage[key] = value;
  }
}

/**
 * Get baggage value from current trace context
 */
export function getBaggage(key: string): string | undefined {
  const context = getTraceContext();
  return context?.baggage[key];
}

/**
 * Get all baggage from current trace context
 */
export function getAllBaggage(): Record<string, string> {
  const context = getTraceContext();
  return context?.baggage || {};
}

/**
 * Helper to format trace context for logging
 * Output: "traceId=... spanId=... requestId=..."
 */
export function formatTraceContext(): string {
  const context = getTraceContext();
  if (!context) {
    return 'NO_TRACE_CONTEXT';
  }

  return `traceId=${context.traceId.substring(0, 8)}... spanId=${context.spanId.substring(0, 8)}... requestId=${context.requestId.substring(0, 8)}...`;
}

/**
 * Get correlation headers for propagating trace context to other services
 *
 * Returns W3C Trace Context headers for HTTP propagation
 * See: https://www.w3.org/TR/trace-context/
 */
export function getTraceHeaders(): Record<string, string> {
  const context = getTraceContext();
  if (!context) {
    return {};
  }

  // W3C Trace Context format:
  // traceparent: version-traceId-spanId-flags
  // version: 00
  // flags: 01 = sampled
  const traceparent = `00-${context.traceId}-${context.spanId}-01`;

  // Add baggage headers
  const baggageHeader = Object.entries(context.baggage)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join(',');

  const headers: Record<string, string> = {
    'traceparent': traceparent,
    'x-request-id': context.requestId,
  };

  if (baggageHeader) {
    headers['baggage'] = baggageHeader;
  }

  return headers;
}

/**
 * Parse W3C Trace Context from incoming headers
 * Useful for propagating traces across service boundaries
 */
export function parseTraceHeaders(headers: Record<string, string>): Partial<TraceContext> {
  const traceparent = headers['traceparent'] || '';
  const parts = traceparent.split('-');

  const context: Partial<TraceContext> = {
    requestId: headers['x-request-id'] || randomUUID(),
  };

  if (parts.length === 4) {
    context.traceId = parts[1];
    context.spanId = parts[2];
  }

  // Parse baggage
  if (headers['baggage']) {
    context.baggage = {};
    const baggageItems = headers['baggage'].split(',');
    for (const item of baggageItems) {
      const [key, value] = item.split('=');
      if (key && value) {
        context.baggage[key] = decodeURIComponent(value);
      }
    }
  }

  return context;
}

/**
 * Health check for trace context system
 */
export function getTraceContextHealth(): {
  active: boolean;
  context?: TraceContext;
} {
  const context = getTraceContext();
  return {
    active: !!context,
    context,
  };
}
