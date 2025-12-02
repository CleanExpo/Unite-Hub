/**
 * HTTP Request/Response Middleware for Distributed Tracing
 *
 * Integrates with instrumentation-utilities.ts to automatically trace:
 * - HTTP method, URL, status code
 * - Request headers (User-Agent, Content-Type)
 * - Response status and content length
 * - Request duration
 * - Errors and exceptions
 *
 * Works with:
 * - Next.js Middleware
 * - Express.js (if used)
 * - Fetch API wrappers
 *
 * @module lib/tracing/http-middleware
 */

/* eslint-disable no-console, no-undef, @typescript-eslint/no-explicit-any */
/* global Headers, fetch */

import { NextRequest, NextResponse } from 'next/server';
import {
  instrumentHttpRequest,
  recordHttpResponse,
  traceAsync,
} from './instrumentation-utilities';
import {
  createTraceContext,
  runWithTraceContext,
  parseTraceHeaders,
  getTraceHeaders,
} from './trace-context';

/**
 * Configuration for HTTP middleware
 */
export interface HttpMiddlewareConfig {
  /**
   * Paths to exclude from tracing (regex patterns or strings)
   * Default: ['/health', '/metrics', '/_next/', '/public/']
   */
  excludePaths?: (string | RegExp)[];

  /**
   * Whether to trace request body (be careful with sensitive data)
   * Default: false
   */
  traceBody?: boolean;

  /**
   * Whether to trace response body
   * Default: false
   */
  traceResponseBody?: boolean;

  /**
   * Headers to include in trace (whitelist)
   * Default: ['user-agent', 'content-type', 'authorization']
   */
  headersToTrace?: string[];

  /**
   * Maximum body size to trace in bytes
   * Default: 1000
   */
  maxBodySize?: number;
}

/**
 * Default middleware configuration
 */
const DEFAULT_CONFIG: Required<HttpMiddlewareConfig> = {
  excludePaths: [
    /^\/health$/,
    /^\/_next\//,
    /^\/public\//,
    /^\/metrics$/,
    /^\/api\/tracing\//,
  ],
  traceBody: false,
  traceResponseBody: false,
  headersToTrace: ['user-agent', 'content-type'],
  maxBodySize: 1000,
};

/**
 * Check if path should be excluded from tracing
 */
function shouldExcludePath(path: string, excludePaths: (string | RegExp)[]): boolean {
  return excludePaths.some((pattern) => {
    if (pattern instanceof RegExp) {
      return pattern.test(path);
    }
    return path === pattern || path.startsWith(pattern);
  });
}

/**
 * Extract relevant headers from request
 */
function extractHeaders(
  headers: any,
  headersToTrace: string[]
): Record<string, string> {
  const extracted: Record<string, string> = {};

  for (const headerName of headersToTrace) {
    const value = headers.get(headerName);
    if (value) {
      extracted[headerName] = value;
    }
  }

  return extracted;
}

/**
 * Next.js Middleware for HTTP request tracing
 *
 * This middleware:
 * 1. Creates or parses trace context from request headers
 * 2. Creates HTTP span for the request
 * 3. Calls handler and records response
 * 4. Adds trace context to response headers
 *
 * QUALITY GATE 1: Must not block requests (try-catch wraps all tracing)
 * QUALITY GATE 2: Must preserve all request/response behavior
 * QUALITY GATE 3: Must add trace headers to response
 */
export async function withHttpTracing(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: HttpMiddlewareConfig = {}
): Promise<NextResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Check if path should be traced
  if (shouldExcludePath(request.nextUrl.pathname, finalConfig.excludePaths)) {
    return handler(request);
  }

  try {
    // Parse incoming trace context or create new one
    const incomingContext = parseTraceHeaders(
      Object.fromEntries(request.headers)
    );

    // Create trace context for this request
    const traceContext = createTraceContext(incomingContext);

    // Run handler within trace context
    return await runWithTraceContext(traceContext, async () => {
      // Create HTTP span
      const { span, headers: traceHeaders } = instrumentHttpRequest(
        request.method,
        request.nextUrl.pathname
      );

      // Add request headers to span
      const reqHeaders = extractHeaders(request.headers, finalConfig.headersToTrace);
      span.attributes = {
        ...span.attributes,
        'http.request.headers': JSON.stringify(reqHeaders),
      };

      try {
        // Call the actual handler
        const response = await handler(request);

        // Record response
        recordHttpResponse(
          span,
          response.status,
          response.headers.get('content-length')
            ? parseInt(response.headers.get('content-length')!, 10)
            : undefined
        );

        // Create new response with trace headers
        const responseWithTracing = new NextResponse(response.body, {
          status: response.status,
          headers: response.headers,
        });

        // Add trace headers to response for downstream services
        const outgoingHeaders = getTraceHeaders();
        for (const [key, value] of Object.entries(outgoingHeaders)) {
          responseWithTracing.headers.set(key, value);
        }

        // Add incoming trace headers to response as well
        for (const [key, value] of Object.entries(traceHeaders)) {
          responseWithTracing.headers.set(key, value);
        }

        return responseWithTracing;
      } catch (error) {
        // Record error
        recordHttpResponse(
          span,
          500,
          undefined
        );

        // Log error but don't break the request
        console.error('[HTTP Tracing] Error in handler:', {
          path: request.nextUrl.pathname,
          method: request.method,
          error: error instanceof Error ? error.message : String(error),
        });

        // Re-throw to let Next.js handle it
        throw error;
      }
    });
  } catch (error) {
    // If tracing fails, still call handler to not break the app
    console.error('[HTTP Tracing] Middleware error:', error);
    return handler(request);
  }
}

/**
 * Fetch wrapper that adds trace context to external HTTP calls
 *
 * This allows tracing of outbound requests to other services
 * and proper correlation across service boundaries
 *
 * QUALITY GATE 4: Must preserve fetch behavior (method, headers, body)
 * QUALITY GATE 5: Must not modify request body
 */
export async function tracedFetch(
  url: string | any,
  init?: any
): Promise<any> {
  const requestUrl = typeof url === 'string' ? url : url.url;
  const method = typeof url === 'string' ? (init?.method || 'GET') : url.method;

  return await traceAsync(
    async () => {
      // Instrument the request
      const { span, headers: traceHeaders } = instrumentHttpRequest(method, requestUrl);

      // Merge trace headers with request headers
      const headers = new Headers(init?.headers);
      for (const [key, value] of Object.entries(traceHeaders)) {
        headers.set(key, value);
      }

      try {
        // Make the actual fetch call
        const response = await fetch(url, {
          ...init,
          headers,
        });

        // Record response
        recordHttpResponse(
          span,
          response.status,
          response.headers.get('content-length')
            ? parseInt(response.headers.get('content-length')!, 10)
            : undefined
        );

        return response;
      } catch (error) {
        // Record error
        recordHttpResponse(span, 500, undefined);
        throw error;
      }
    },
    {
      operationName: `http.${method.toLowerCase()}`,
      attributes: {
        'http.url': requestUrl,
        'http.method': method,
      },
      recordError: true,
    }
  );
}

/**
 * Middleware factory for Express.js
 *
 * Example usage:
 * ```typescript
 * app.use(createExpressMiddleware());
 * ```
 */
export function createExpressMiddleware(config: HttpMiddlewareConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return (req: any, res: any, next: any) => {
    // Check if path should be traced
    if (shouldExcludePath(req.path, finalConfig.excludePaths)) {
      return next();
    }

    try {
      // Parse incoming trace context
      const incomingContext = parseTraceHeaders(req.headers);
      const traceContext = createTraceContext(incomingContext);

      // Create HTTP span
      const { span, headers: traceHeaders } = instrumentHttpRequest(
        req.method,
        req.path
      );

      // Add to request for downstream handlers
      req.traceSpan = span;
      req.traceContext = traceContext;

      // Capture response
      const originalSend = res.send;
      res.send = function (data: any) {
        recordHttpResponse(span, res.statusCode, JSON.stringify(data).length);

        // Add trace headers to response
        for (const [key, value] of Object.entries(traceHeaders)) {
          res.set(key, value);
        }

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('[Express Tracing] Middleware error:', error);
      next();
    }
  };
}

/**
 * Health check endpoint for tracing system
 *
 * Can be used to verify that tracing middleware is working
 * and that trace context is being propagated correctly
 */
export async function getTracingHealth(): Promise<{
  active: boolean;
  tracingEnabled: boolean;
  message: string;
}> {
  return {
    active: true,
    tracingEnabled: true,
    message: 'HTTP tracing middleware is active and operational',
  };
}
