/**
 * Custom Tracer for Unite-Hub Operations
 * Trace AI operations, database queries, and API calls
 */

import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('unite-hub', '1.0.0');

export interface TraceOptions {
  attributes?: Record<string, string | number | boolean>;
  recordException?: boolean;
}

/**
 * Trace an async operation
 */
export async function traceOperation<T>(
  name: string,
  operation: () => Promise<T>,
  options: TraceOptions = {}
): Promise<T> {
  const span = tracer.startSpan(name);

  if (options.attributes) {
    span.setAttributes(options.attributes);
  }

  try {
    const result = await operation();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    if (options.recordException && error instanceof Error) {
      span.recordException(error);
    }

    throw error;
  } finally {
    span.end();
  }
}

/**
 * Trace AI model calls
 */
export async function traceAIOperation<T>(
  model: string,
  provider: 'anthropic' | 'openrouter' | 'gemini',
  operation: () => Promise<T>,
  metadata?: { tokens?: number; prompt_length?: number }
): Promise<T> {
  return traceOperation(
    'ai.generate',
    operation,
    {
      attributes: {
        'ai.model': model,
        'ai.provider': provider,
        'ai.tokens': metadata?.tokens || 0,
        'ai.prompt_length': metadata?.prompt_length || 0,
      },
      recordException: true,
    }
  );
}

/**
 * Trace database operations
 */
export async function traceDatabase<T>(
  operation: string,
  table: string,
  query: () => Promise<T>
): Promise<T> {
  return traceOperation(
    `db.${operation}.${table}`,
    query,
    {
      attributes: {
        'db.table': table,
        'db.operation': operation,
        'db.system': 'postgresql',
      },
      recordException: true,
    }
  );
}

/**
 * Trace external API calls
 */
export async function traceExternalAPI<T>(
  service: string,
  endpoint: string,
  method: string,
  call: () => Promise<T>
): Promise<T> {
  return traceOperation(
    `api.${service}.${method}`,
    call,
    {
      attributes: {
        'http.service': service,
        'http.endpoint': endpoint,
        'http.method': method,
      },
      recordException: true,
    }
  );
}

/**
 * Add custom attributes to current span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * Record an event in the current span
 */
export function recordSpanEvent(name: string, attributes?: Record<string, string | number | boolean>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}
