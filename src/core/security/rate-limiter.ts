/**
 * @deprecated Use `@/lib/rate-limit` instead. This file is superseded by the
 * consolidated Redis-backed rate limiter (UNI-204). Will be removed in a future release.
 *
 * Rate Limiter
 *
 * Implements tiered rate limiting for API routes.
 * Uses in-memory store for development, Redis for production.
 *
 * @module core/security/rate-limiter
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  RateLimitTier,
  RateLimitConfig,
  RateLimitResult,
  RATE_LIMIT_CONFIGS,
  SECURITY_ERROR_CODES,
} from './types';

/**
 * In-memory rate limit store
 * For development/single-instance deployments
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetAt < now) {
        memoryStore.delete(key);
      }
    }
  }, 60 * 1000); // Clean every minute
}

/**
 * Stop cleanup (for testing)
 */
export function stopCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * Get rate limit key from request
 *
 * @param request - Next.js request
 * @param config - Rate limit config
 * @returns Rate limit key
 */
function getRateLimitKey(request: NextRequest, config: RateLimitConfig): string {
  // Get client identifier (IP address)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  // Include tier in key to separate limits
  const prefix = config.keyPrefix || `rate:${config.tier}`;

  return `${prefix}:${ip}`;
}

/**
 * Check rate limit using in-memory store
 *
 * @param key - Rate limit key
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
function checkMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const entry = memoryStore.get(key);

  // No entry or expired - allow and create new entry
  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      reset: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      reset: entry.resetAt,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  memoryStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetAt,
  };
}

/**
 * Check rate limit for a request
 *
 * @param request - Next.js request
 * @param tier - Rate limit tier to apply
 * @returns Rate limit result
 */
export function checkRateLimit(
  request: NextRequest,
  tier: RateLimitTier = 'client'
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[tier];
  const key = getRateLimitKey(request, config);

  // Use memory store (can be extended to use Redis)
  return checkMemoryRateLimit(key, config);
}

/**
 * Rate limit middleware (curried)
 *
 * @param tier - Rate limit tier
 * @returns Function that wraps a handler with rate limiting
 *
 * @example
 * // Curried usage (preferred)
 * export const POST = withRateLimit('staff')(async (request) => {
 *   // Handler with 100/min rate limit
 * });
 *
 * // Or inline
 * export const POST = withRateLimit('staff')(withWorkspace(async (ctx) => {
 *   // Combined workspace + rate limit
 * }));
 */
export function withRateLimit(tier: RateLimitTier) {
  return function <T extends (...args: any[]) => Promise<NextResponse>>(handler: T): T {
    return (async (...args: Parameters<T>) => {
      const request = args[0] as NextRequest;
      const result = checkRateLimit(request, tier);

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: {
              code: SECURITY_ERROR_CODES.RATE_LIMITED,
              message: 'Too many requests. Please try again later.',
              retryAfter: result.retryAfter,
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(RATE_LIMIT_CONFIGS[tier].maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(result.reset),
              'Retry-After': String(result.retryAfter),
            },
          }
        );
      }

      const response = await handler(...args);

      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_CONFIGS[tier].maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      response.headers.set('X-RateLimit-Reset', String(result.reset));

      return response;
    }) as T;
  };
}

/**
 * Create rate limiter for specific tier
 *
 * @param tier - Rate limit tier
 * @returns Rate limit check function
 */
export function createRateLimiter(tier: RateLimitTier) {
  return (request: NextRequest) => checkRateLimit(request, tier);
}

/**
 * Reset rate limit for a key (for testing)
 */
export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  memoryStore.clear();
}
