/**
 * Rate Limiting Wrapper for API Routes
 *
 * Phase 22: Production Launch Optimization
 * Apply rate limiting to auth and AI endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getRateLimitKey,
  getRateLimitHeaders,
  RateLimitConfig,
  RATE_LIMITS,
} from "@/lib/auth/rate-limiter";
import { logApiRequest } from "@/lib/auth/audit-logger";
import { errors } from "@/lib/api/response";

export interface RateLimitedHandler {
  (req: NextRequest): Promise<NextResponse>;
}

/**
 * Wrap an API handler with rate limiting
 */
export function withRateLimit(
  handler: RateLimitedHandler,
  config: RateLimitConfig = RATE_LIMITS.default,
  options?: {
    audit?: boolean;
    getUserId?: (req: NextRequest) => string | undefined;
    getEndpoint?: (req: NextRequest) => string;
  }
): RateLimitedHandler {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Extract identifiers
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userId = options?.getUserId?.(req);
    const endpoint = options?.getEndpoint?.(req) || req.nextUrl.pathname;

    // Generate rate limit key
    const key = getRateLimitKey(userId, ip, endpoint);

    // Check rate limit
    const result = checkRateLimit(key, config);

    if (!result.allowed) {
      // Log rate limited request
      if (options?.audit) {
        await logApiRequest(userId, endpoint, req.method, undefined, false, "Rate limited");
      }

      // Return 429 with rate limit headers
      const response = errors.rateLimited(`Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`);

      const headers = getRateLimitHeaders(result);
      for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
      }

      return response;
    }

    // Execute handler
    const response = await handler(req);

    // Add rate limit headers to response
    const headers = getRateLimitHeaders(result);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }

    // Audit successful request
    if (options?.audit) {
      await logApiRequest(userId, endpoint, req.method);
    }

    return response;
  };
}

/**
 * Pre-configured rate limiters for common endpoint types
 */
export const rateLimiters = {
  /**
   * Auth endpoints: 10 requests/minute
   */
  auth: (handler: RateLimitedHandler, audit = true) =>
    withRateLimit(handler, RATE_LIMITS.auth, { audit }),

  /**
   * AI/Agent endpoints: 20 requests/minute
   */
  ai: (handler: RateLimitedHandler, audit = true) =>
    withRateLimit(handler, RATE_LIMITS.ai, { audit }),

  /**
   * Email endpoints: 50 requests/minute
   */
  email: (handler: RateLimitedHandler, audit = true) =>
    withRateLimit(handler, RATE_LIMITS.email, { audit }),

  /**
   * Webhook endpoints: 1000 requests/minute
   */
  webhook: (handler: RateLimitedHandler) =>
    withRateLimit(handler, RATE_LIMITS.webhook, { audit: false }),

  /**
   * Default: 100 requests/minute
   */
  default: (handler: RateLimitedHandler, audit = false) =>
    withRateLimit(handler, RATE_LIMITS.default, { audit }),
};

/**
 * Example usage in API route:
 *
 * import { rateLimiters } from '@/lib/api/with-rate-limit';
 *
 * async function handler(req: NextRequest) {
 *   // Your handler logic
 *   return NextResponse.json({ success: true });
 * }
 *
 * export const POST = rateLimiters.ai(handler);
 * export const GET = rateLimiters.default(handler);
 */
