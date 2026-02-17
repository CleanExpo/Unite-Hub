/**
 * @deprecated Use `@/lib/rate-limit` instead. This file is superseded by the
 * consolidated Redis-backed rate limiter (UNI-204). Will be removed in a future release.
 *
 * Rate Limiter for Auth Middleware
 *
 * Source: docs/abacus/auth-map.json
 * Purpose: Protect API endpoints from abuse
 */

// In-memory store (consider Redis for production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  requests: number; // Max requests
  window: number; // Time window in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// Default limits by endpoint type
export const RATE_LIMITS = {
  default: { requests: 100, window: 60 }, // 100/min
  auth: { requests: 10, window: 60 }, // 10/min for auth endpoints
  ai: { requests: 20, window: 60 }, // 20/min for AI endpoints
  email: { requests: 50, window: 60 }, // 50/min for email
  webhook: { requests: 1000, window: 60 }, // 1000/min for webhooks
} as const;

/**
 * Check rate limit for a key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.default
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.window * 1000;

  // Get or create entry
  let entry = requestCounts.get(key);

  if (!entry || now >= entry.resetTime) {
    // Create new window
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    requestCounts.set(key, entry);

    return {
      allowed: true,
      remaining: config.requests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  if (entry.count > config.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get rate limit key from request
 */
export function getRateLimitKey(
  userId?: string,
  ip?: string,
  endpoint?: string
): string {
  const parts = [
    userId || "anonymous",
    ip || "unknown",
    endpoint || "default",
  ];
  return parts.join(":");
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (now >= entry.resetTime) {
      requestCounts.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  };
}
