/**
 * Rate Limit Middleware
 *
 * Applies rate limiting to API routes with database integration.
 * Combines in-memory rate limiting with persistent logging and overrides.
 *
 * @module api/_middleware/rate-limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit as checkMemoryRateLimit } from '@/core/security/rate-limiter';
import {
  getClientIp,
  isIpBlocked,
  getRateLimitOverride,
  logRequest,
} from '@/lib/services/rate-limit-service';
import type { RateLimitTier } from '@/core/security/types';
import { RATE_LIMIT_CONFIGS, SECURITY_ERROR_CODES } from '@/core/security/types';
import { getUser } from '@/lib/supabase/server';

/**
 * Endpoint-based rate limit tier mapping
 */
const ENDPOINT_TIER_MAP: Array<{ pattern: RegExp; tier: RateLimitTier }> = [
  // Public endpoints (10/min)
  { pattern: /^\/api\/health/, tier: 'public' },
  { pattern: /^\/api\/deployment-check/, tier: 'public' },

  // Webhook endpoints (1000/min)
  { pattern: /^\/api\/webhooks\//, tier: 'webhook' },
  { pattern: /^\/api\/email\/webhook/, tier: 'webhook' },

  // Auth endpoints (public tier for login protection)
  { pattern: /^\/api\/auth\//, tier: 'public' },

  // AI agent endpoints (200/min for internal use)
  { pattern: /^\/api\/agent\//, tier: 'agent' },
  { pattern: /^\/api\/agents\//, tier: 'agent' },

  // Admin endpoints (500/min)
  { pattern: /^\/api\/admin\//, tier: 'admin' },

  // Synthex client endpoints (50/min)
  { pattern: /^\/api\/client\//, tier: 'client' },
  { pattern: /^\/api\/synthex\//, tier: 'client' },

  // Staff endpoints (100/min)
  { pattern: /^\/api\/staff\//, tier: 'staff' },

  // Default for all other API routes
  { pattern: /^\/api\//, tier: 'client' },
];

/**
 * Get rate limit tier for an endpoint
 */
function getTierForEndpoint(pathname: string): RateLimitTier {
  for (const { pattern, tier } of ENDPOINT_TIER_MAP) {
    if (pattern.test(pathname)) {
      return tier;
    }
  }

  return 'client'; // Default tier
}

/**
 * Apply rate limiting to a request
 *
 * Process:
 * 1. Check if IP is blocked
 * 2. Check for custom overrides
 * 3. Apply in-memory rate limiting
 * 4. Log to database
 * 5. Return response with rate limit headers
 *
 * @param request - Next.js request
 * @param tier - Optional tier override
 * @returns NextResponse or null if allowed
 */
export async function applyRateLimit(
  request: NextRequest,
  tier?: RateLimitTier
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Determine tier
  const effectiveTier = tier || getTierForEndpoint(pathname);

  // Get client identification
  const ip = getClientIp(request.headers);
  const user = await getUser();
  const userId = user?.id || null;

  // 1. Check if IP is blocked (fast fail)
  const blocked = await isIpBlocked(ip);
  if (blocked) {
    const response = NextResponse.json(
      {
        error: {
          code: SECURITY_ERROR_CODES.IP_BLOCKED,
          message: 'Your IP address has been blocked. Please contact support.',
        },
      },
      { status: 403 }
    );

    // Log the blocked request
    await logRequest(
      ip,
      userId,
      pathname,
      effectiveTier,
      false,
      0,
      new Date(Date.now() + 3600000),
      method,
      403
    );

    return response;
  }

  // 2. Check for custom override
  const clientKey = userId || ip;
  const override = await getRateLimitOverride(clientKey, pathname);

  // If override exists, we would apply custom limits here
  // For now, we proceed with standard in-memory limiting
  // TODO: Integrate override limits into rate limiter

  // 3. Apply in-memory rate limiting
  const rateLimitResult = checkMemoryRateLimit(request, effectiveTier);

  // 4. Log to database (async, don't wait)
  const resetAt = new Date(rateLimitResult.reset);
  logRequest(
    ip,
    userId,
    pathname,
    effectiveTier,
    rateLimitResult.allowed,
    rateLimitResult.remaining,
    resetAt,
    method
  ).catch((error) => {
    console.error('Failed to log rate limit event:', error);
  });

  // 5. If rate limit exceeded, return 429 response
  if (!rateLimitResult.allowed) {
    const config = RATE_LIMIT_CONFIGS[effectiveTier];

    const response = NextResponse.json(
      {
        error: {
          code: SECURITY_ERROR_CODES.RATE_LIMITED,
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
          tier: effectiveTier,
          limit: config.maxRequests,
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.reset),
          'Retry-After': String(rateLimitResult.retryAfter || 60),
          'X-RateLimit-Tier': effectiveTier,
        },
      }
    );

    return response;
  }

  // Request allowed - caller should add headers to their response
  return null;
}

/**
 * Get rate limit headers for a successful response
 */
export function getRateLimitHeaders(
  tier: RateLimitTier,
  remaining: number,
  reset: number
): Record<string, string> {
  const config = RATE_LIMIT_CONFIGS[tier];

  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(reset),
    'X-RateLimit-Tier': tier,
  };
}

/**
 * Middleware wrapper that applies rate limiting
 *
 * @param handler - API handler function
 * @param tier - Optional tier override
 * @returns Wrapped handler with rate limiting
 *
 * @example
 * ```typescript
 * export const POST = withRateLimitMiddleware(
 *   async (request) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   },
 *   'staff' // Optional: override default tier
 * );
 * ```
 */
export function withRateLimitMiddleware<T extends (request: NextRequest) => Promise<NextResponse>>(
  handler: T,
  tier?: RateLimitTier
): T {
  return (async (request: NextRequest) => {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request, tier);

    // If rate limit exceeded, return error response
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Call the actual handler
    const response = await handler(request);

    // Add rate limit headers to successful response
    const pathname = request.nextUrl.pathname;
    const effectiveTier = tier || getTierForEndpoint(pathname);
    const config = RATE_LIMIT_CONFIGS[effectiveTier];

    // Get current rate limit status
    const rateLimitResult = checkMemoryRateLimit(request, effectiveTier);
    const headers = getRateLimitHeaders(
      effectiveTier,
      rateLimitResult.remaining,
      rateLimitResult.reset
    );

    // Add headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }) as T;
}
