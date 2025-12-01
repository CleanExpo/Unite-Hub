/**
 * APM Middleware for Request/Response Tracking
 *
 * This middleware instruments all API requests with:
 * - Request timing and performance monitoring
 * - Error correlation and context capture
 * - User session tracking
 * - Request context propagation
 * - Automatic metrics export to Datadog
 * - Integration with Sentry for error tracking
 *
 * @module middleware/apm-middleware
 */

/* eslint-disable no-undef, no-console, @typescript-eslint/no-unused-vars */


import { NextRequest, NextResponse } from 'next/server';
import { sentryIntegration } from '@/lib/apm/sentry-integration';
import { metricsExporter } from '@/lib/apm/metrics-exporter';

// ============================================================================
// TYPES
// ============================================================================

export interface RequestContext {
  requestId: string;
  method: string;
  path: string;
  timestamp: number;
  userId?: string;
  workspaceId?: string;
  userAgent?: string;
  ip?: string;
}

export interface ResponseContext {
  statusCode: number;
  duration: number;
  error?: Error;
}

// ============================================================================
// REQUEST ID GENERATION
// ============================================================================

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract request ID from headers or generate new one
 */
function getRequestId(req: NextRequest): string {
  const existingId = req.headers.get('x-request-id');
  return existingId || generateRequestId();
}

// ============================================================================
// USER CONTEXT EXTRACTION
// ============================================================================

/**
 * Extract user context from request
 */
function extractUserContext(req: NextRequest): {
  userId?: string;
  workspaceId?: string;
} {
  const authHeader = req.headers.get('authorization');
  const workspaceId = req.nextUrl.searchParams.get('workspaceId') || undefined;

  // Try to extract user ID from authorization header
  let userId: string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    // In production, decode JWT to get user ID
    // For now, we'll just mark as authenticated
    userId = 'authenticated';
  }

  return { userId, workspaceId };
}

// ============================================================================
// REQUEST CONTEXT CREATION
// ============================================================================

/**
 * Create request context for tracking
 */
function createRequestContext(req: NextRequest): RequestContext {
  const { userId, workspaceId } = extractUserContext(req);

  return {
    requestId: getRequestId(req),
    method: req.method,
    path: req.nextUrl.pathname,
    timestamp: Date.now(),
    userId,
    workspaceId,
    userAgent: req.headers.get('user-agent') || undefined,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
  };
}

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

/**
 * Track request performance
 */
function trackRequestPerformance(
  context: RequestContext,
  response: ResponseContext
): void {
  // Export HTTP metrics to Datadog
  metricsExporter.exportHttpMetrics({
    method: context.method,
    path: context.path,
    statusCode: response.statusCode,
    duration: response.duration,
    timestamp: context.timestamp / 1000,
  });

  // Add breadcrumb to Sentry
  if (sentryIntegration.isInitialized()) {
    sentryIntegration.addBreadcrumb({
      type: 'http',
      category: 'request',
      level: response.statusCode >= 400 ? 'error' : 'info',
      message: `${context.method} ${context.path}`,
      data: {
        requestId: context.requestId,
        statusCode: response.statusCode,
        duration: response.duration,
        workspaceId: context.workspaceId,
      },
    });
  }

  // Log slow requests (> 1 second)
  if (response.duration > 1000) {
    console.warn('[APM] Slow request detected:', {
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      duration: response.duration,
      statusCode: response.statusCode,
    });
  }
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Track error with full context
 */
function trackError(context: RequestContext, error: Error): void {
  // Capture exception in Sentry
  if (sentryIntegration.isInitialized()) {
    sentryIntegration.captureException(error, {
      tags: {
        requestId: context.requestId,
        method: context.method,
        path: context.path,
        workspaceId: context.workspaceId || 'unknown',
      },
      extra: {
        timestamp: context.timestamp,
        userId: context.userId,
        userAgent: context.userAgent,
        ip: context.ip,
      },
      level: 'error',
    });
  }

  // Log error
  console.error('[APM] Request error:', {
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    error: error.message,
    stack: error.stack,
  });
}

// ============================================================================
// APM MIDDLEWARE
// ============================================================================

/**
 * APM middleware for Next.js API routes
 * Wraps route handlers with performance tracking and error monitoring
 */
export function withAPMMiddleware<T extends (...args: unknown[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: unknown[]) => {
    const req = args[0] as NextRequest;
    const startTime = Date.now();

    // Create request context
    const context = createRequestContext(req);

    // Set request context in Sentry
    if (sentryIntegration.isInitialized()) {
      sentryIntegration.setContext('request', {
        requestId: context.requestId,
        method: context.method,
        path: context.path,
        workspaceId: context.workspaceId,
      });

      sentryIntegration.setTags({
        requestId: context.requestId,
        method: context.method,
        endpoint: context.path,
      });
    }

    try {
      // Call original handler
      const response = await handler(...args);

      // Calculate duration
      const duration = Date.now() - startTime;

      // Track performance
      trackRequestPerformance(context, {
        statusCode: response.status,
        duration,
      });

      // Add request ID to response headers
      const headers = new Headers(response.headers);
      headers.set('x-request-id', context.requestId);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      // Calculate duration
      const duration = Date.now() - startTime;

      // Track error
      trackError(context, error as Error);

      // Track performance (with error)
      trackRequestPerformance(context, {
        statusCode: 500,
        duration,
        error: error as Error,
      });

      // Re-throw error
      throw error;
    }
  }) as T;
}

/**
 * APM middleware for standard Next.js middleware
 * Tracks all requests passing through middleware
 */
export async function apmMiddleware(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const context = createRequestContext(req);

  // Add request ID to headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-request-id', context.requestId);

  // Create response (pass through)
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Calculate duration
  const duration = Date.now() - startTime;

  // Track performance
  trackRequestPerformance(context, {
    statusCode: response.status,
    duration,
  });

  // Add request ID to response
  response.headers.set('x-request-id', context.requestId);

  return response;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default withAPMMiddleware;
