/**
 * Instrumentation Utilities for Distributed Tracing
 */

import {
  getTraceContext,
  addBaggage,
} from './trace-context';

export interface Span {
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'success' | 'error' | 'pending';
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
  error?: Error;
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, string | number | boolean>;
}

export interface ExportedSpan {
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'success' | 'error' | 'pending';
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
}

export interface InstrumentationOptions {
  operationName: string;
  attributes?: Record<string, string | number | boolean>;
  recordError?: boolean;
}

export interface HttpSpan extends Span {
  method: string;
  url: string;
  statusCode?: number;
  contentLength?: number;
  userAgent?: string;
}

export interface DatabaseSpan extends Span {
  dbSystem: string;
  dbName: string;
  statement: string;
  rowsAffected?: number;
  resultCount?: number;
}

export function generateSpanId(): string {
  const bytes = Math.random().toString(16).substring(2, 18);
  return bytes.padStart(16, '0').substring(0, 16);
}

export function createSpan(options: InstrumentationOptions): Span {
  const traceContext = getTraceContext();

  return {
    spanId: generateSpanId(),
    parentSpanId: traceContext?.spanId,
    operationName: options.operationName,
    startTime: Date.now(),
    status: 'pending',
    attributes: {
      'service.name': 'unite-hub',
      ...options.attributes,
    },
    events: [],
  };
}

export function recordSpanEvent(
  span: Span,
  eventName: string,
  attributes?: Record<string, string | number | boolean>
): void {
  span.events.push({
    name: eventName,
    timestamp: Date.now(),
    attributes,
  });
}

export function finalizeSpan(
  span: Span,
  status: 'success' | 'error' = 'success',
  error?: Error
): Span {
  const finalized = { ...span };
  finalized.endTime = Date.now();
  finalized.duration = finalized.endTime - finalized.startTime;
  finalized.status = status;
  if (error) {
    finalized.error = error;
  }
  return finalized;
}

export async function traceAsync<T>(
  fn: () => Promise<T>,
  options: InstrumentationOptions
): Promise<T> {
  const span = createSpan(options);
  const context = getTraceContext();

  try {
    if (context) {
      addBaggage('span.id', span.spanId);
      addBaggage('span.operation', options.operationName);
    }

    recordSpanEvent(span, 'operation_start');

    const result = await fn();

    recordSpanEvent(span, 'operation_complete', {
      success: true,
    });

    finalizeSpan(span, 'success');
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    recordSpanEvent(span, 'operation_error', {
      error_message: err.message,
      error_type: err.name,
    });

    finalizeSpan(span, 'error', err);

    if (options.recordError !== false) {
      addBaggage('span.error', err.message);
    }

    throw err;
  }
}

export function traceSync<T>(
  fn: () => T,
  options: InstrumentationOptions
): T {
  const span = createSpan(options);
  const context = getTraceContext();

  try {
    if (context) {
      addBaggage('span.id', span.spanId);
      addBaggage('span.operation', options.operationName);
    }

    recordSpanEvent(span, 'operation_start');

    const result = fn();

    recordSpanEvent(span, 'operation_complete', {
      success: true,
    });

    finalizeSpan(span, 'success');
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    recordSpanEvent(span, 'operation_error', {
      error_message: err.message,
      error_type: err.name,
    });

    finalizeSpan(span, 'error', err);

    if (options.recordError !== false) {
      addBaggage('span.error', err.message);
    }

    throw err;
  }
}

export function instrumentHttpRequest(
  method: string,
  url: string,
  headers: Record<string, string> = {}
): { span: HttpSpan; headers: Record<string, string> } {
  const span = createSpan({
    operationName: 'http.request',
    attributes: {
      'http.method': method,
      'http.url': url,
    },
  }) as HttpSpan;

  span.method = method;
  span.url = url;
  span.userAgent = headers['user-agent'];

  const context = getTraceContext();
  const traceId = context?.traceId || '';
  const reqId = context?.requestId || '';
  const traceHeaders = context
    ? {
        'traceparent': `00-${traceId}-${span.spanId}-01`,
        'x-request-id': reqId,
      }
    : {};

  return {
    span,
    headers: { ...headers, ...traceHeaders },
  };
}

export function recordHttpResponse(
  span: HttpSpan,
  statusCode: number,
  contentLength?: number
): HttpSpan {
  span.statusCode = statusCode;
  span.contentLength = contentLength;

  const status = statusCode >= 200 && statusCode < 300 ? 'success' : 'error';
  const finalized = finalizeSpan(span, status) as HttpSpan;

  recordSpanEvent(finalized, 'http_response', {
    status_code: statusCode,
    content_length: contentLength || 0,
  });

  return finalized;
}

export function instrumentDatabaseQuery(
  dbSystem: string,
  dbName: string,
  statement: string,
  paramCount: number = 0
): DatabaseSpan {
  const span = createSpan({
    operationName: 'db.query',
    attributes: {
      'db.system': dbSystem,
      'db.name': dbName,
      'db.statement_length': statement.length,
      'db.param_count': paramCount,
    },
  }) as DatabaseSpan;

  span.dbSystem = dbSystem;
  span.dbName = dbName;
  span.statement = statement.replace(/\?/g, '?').substring(0, 500);

  recordSpanEvent(span, 'query_start', {
    param_count: paramCount,
  });

  return span;
}

export function recordDatabaseResult(
  span: DatabaseSpan,
  rowsAffected: number = 0,
  resultCount: number = 0,
  error?: Error
): DatabaseSpan {
  span.rowsAffected = rowsAffected;
  span.resultCount = resultCount;

  const status = error ? 'error' : 'success';
  const finalized = finalizeSpan(span, status, error) as DatabaseSpan;

  recordSpanEvent(finalized, 'query_complete', {
    rows_affected: rowsAffected,
    result_count: resultCount,
    duration_ms: finalized.duration || 0,
  });

  return finalized;
}

export function getSpanContext(): {
  traceId?: string;
  currentSpanId?: string;
  parentSpanId?: string;
} {
  const context = getTraceContext();
  if (!context) {
    return {};
  }

  return {
    traceId: context.traceId,
    currentSpanId: context.spanId,
  };
}

export function createCorrelationId(): string {
  const context = getTraceContext();
  if (context) {
    const traceFirst = context.traceId.substring(0, 8);
    const spanFirst = generateSpanId().substring(0, 8);
    return `${traceFirst}-${spanFirst}`;
  }
  return generateSpanId();
}

export function formatSpan(span: Span): string {
  const duration = span.duration || 0;
  const status = span.status.toUpperCase();
  return `[${status}] ${span.operationName} (${duration}ms) | spanId=${span.spanId}`;
}

export function exportSpan(span: Span): ExportedSpan {
  return {
    spanId: span.spanId,
    parentSpanId: span.parentSpanId,
    operationName: span.operationName,
    startTime: span.startTime,
    endTime: span.endTime,
    duration: span.duration,
    status: span.status,
    attributes: span.attributes,
    events: span.events,
    error: span.error ? {
      message: span.error.message,
      name: span.error.name,
      stack: span.error.stack,
    } : undefined,
  };
}
