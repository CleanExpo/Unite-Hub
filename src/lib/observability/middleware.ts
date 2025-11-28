/**
 * Observability Middleware
 *
 * Wraps API route handlers with automatic metrics collection,
 * error handling, and logging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { mlDetector, startTiming, RequestMetrics } from './mlDetector';
import { authenticateRequest } from '@/lib/api-helpers';

// ============================================
// TYPES
// ============================================

export interface ObservabilityOptions {
  // Skip authentication check (for public routes)
  skipAuth?: boolean;
  // Custom route name (defaults to request path)
  routeName?: string;
  // Enable detailed error logging
  verboseErrors?: boolean;
}

export type RouteHandler = (
  req: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse | Response>;

export type AuthenticatedRouteHandler = (
  req: NextRequest,
  context: {
    params?: Record<string, string>;
    user: { id: string; email?: string };
    supabase: any;
  }
) => Promise<NextResponse | Response>;

// ============================================
// MIDDLEWARE WRAPPER
// ============================================

/**
 * Wrap an API route handler with observability and authentication
 *
 * @example
 * // In your API route file:
 * import { withObservability } from '@/lib/observability/middleware';
 *
 * export const GET = withObservability(async (req, { user, supabase }) => {
 *   // Your route logic here
 *   return NextResponse.json({ data });
 * }, { routeName: '/api/contacts' });
 */
export function withObservability(
  handler: AuthenticatedRouteHandler,
  options: ObservabilityOptions = {}
): RouteHandler {
  return async (req: NextRequest, context?: { params?: Record<string, string> }) => {
    const routePath = options.routeName || req.nextUrl.pathname;
    const method = req.method;
    const startTime = Date.now();

    let userId: string | undefined;
    let workspaceId: string | undefined;

    try {
      // Authenticate if required
      let user: { id: string; email?: string } | null = null;
      let supabase: any = null;

      if (!options.skipAuth) {
        const authResult = await authenticateRequest(req);

        if (authResult.error) {
          recordMetric(routePath, method, 401, Date.now() - startTime, workspaceId, userId);
          return authResult.error;
        }

        user = authResult.user;
        supabase = authResult.supabase;
        userId = user?.id;

        // Try to extract workspaceId from request
        workspaceId = extractWorkspaceId(req);
      }

      // Call the actual handler
      const response = await handler(req, {
        params: context?.params,
        user: user!,
        supabase,
      });

      // Record success metric
      recordMetric(routePath, method, response.status, Date.now() - startTime, workspaceId, userId);

      return response;
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const err = error as Error;

      // Log error
      console.error(`[${method}] ${routePath} failed:`, err.message);
      if (options.verboseErrors) {
        console.error(err.stack);
      }

      // Record error metric
      recordMetric(routePath, method, 500, latencyMs, workspaceId, userId, err);

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Lightweight wrapper for routes that just need metrics (no auth changes)
 */
export function withMetrics(
  handler: RouteHandler,
  routeName?: string
): RouteHandler {
  return async (req: NextRequest, context?: { params?: Record<string, string> }) => {
    const routePath = routeName || req.nextUrl.pathname;
    const method = req.method;
    const timing = startTiming(routePath, method);

    try {
      const response = await handler(req, context);
      timing.end(response.status);
      return response;
    } catch (error) {
      timing.end(500, error as Error);
      throw error;
    }
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractWorkspaceId(req: NextRequest): string | undefined {
  // Try query params first
  const queryWorkspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (queryWorkspaceId) return queryWorkspaceId;

  // Try to parse from body (for POST/PUT/PATCH)
  // Note: We can't read body here without consuming it, so skip for now
  return undefined;
}

function recordMetric(
  routePath: string,
  method: string,
  statusCode: number,
  latencyMs: number,
  workspaceId?: string,
  userId?: string,
  error?: Error
): void {
  mlDetector.recordRequest({
    routePath,
    method,
    statusCode,
    latencyMs,
    workspaceId,
    userId,
    timestamp: new Date(),
    errorMessage: error?.message,
    errorStack: error?.stack,
  });
}

// ============================================
// ERROR RESPONSE HELPERS
// ============================================

export function badRequest(message: string, details?: any): NextResponse {
  return NextResponse.json(
    { error: 'Bad Request', message, details },
    { status: 400 }
  );
}

export function unauthorized(message = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized', message },
    { status: 401 }
  );
}

export function forbidden(message = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { error: 'Forbidden', message },
    { status: 403 }
  );
}

export function notFound(message = 'Not Found'): NextResponse {
  return NextResponse.json(
    { error: 'Not Found', message },
    { status: 404 }
  );
}

export function serverError(message = 'Internal Server Error'): NextResponse {
  return NextResponse.json(
    { error: 'Internal Server Error', message },
    { status: 500 }
  );
}

// ============================================
// SUCCESS RESPONSE HELPERS
// ============================================

export function ok<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 200 });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
