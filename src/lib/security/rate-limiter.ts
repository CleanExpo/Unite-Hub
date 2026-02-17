/**
 * @deprecated Use `@/lib/rate-limit` instead. This file is superseded by the
 * consolidated Redis-backed rate limiter (UNI-204). Will be removed in a future release.
 *
 * Rate Limiter — In-Memory Sliding Window
 *
 * Provides per-IP rate limiting for API routes with configurable
 * windows and limits. Uses a sliding window counter approach.
 *
 * Usage:
 *   import { rateLimit, authRateLimit } from '@/lib/security/rate-limiter';
 *
 *   // In an API route:
 *   const result = rateLimit(request);
 *   if (!result.allowed) {
 *     return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 *   }
 *
 * @module lib/security/rate-limiter
 */

import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests per window */
  maxRequests: number;
  /** Key prefix for namespacing */
  prefix: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// In-Memory Store
// ---------------------------------------------------------------------------

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now - entry.windowStart > windowMs * 2) {
      store.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Core Rate Limit Function
// ---------------------------------------------------------------------------

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  cleanup(config.windowMs);

  const fullKey = `${config.prefix}:${key}`;
  const entry = store.get(fullKey);

  if (!entry || now - entry.windowStart >= config.windowMs) {
    // New window
    store.set(fullKey, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
      limit: config.maxRequests,
    };
  }

  // Existing window
  entry.count++;

  const allowed = entry.count <= config.maxRequests;
  const resetAt = entry.windowStart + config.windowMs;

  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt,
    limit: config.maxRequests,
  };
}

// ---------------------------------------------------------------------------
// Pre-configured Rate Limiters
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10),
  prefix: 'rl',
};

const AUTH_CONFIG: RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
  maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX ?? '10', 10),
  prefix: 'auth',
};

const AI_CONFIG: RateLimitConfig = {
  windowMs: 60000,
  maxRequests: 30,
  prefix: 'ai',
};

/**
 * General API rate limiting (100 req/min default).
 */
export function rateLimit(request: NextRequest): RateLimitResult {
  return checkRateLimit(getClientIP(request), DEFAULT_CONFIG);
}

/**
 * Auth endpoint rate limiting (10 req/min default).
 * Stricter to prevent brute-force attacks.
 */
export function authRateLimit(request: NextRequest): RateLimitResult {
  return checkRateLimit(getClientIP(request), AUTH_CONFIG);
}

/**
 * AI endpoint rate limiting (30 req/min).
 */
export function aiRateLimit(request: NextRequest): RateLimitResult {
  return checkRateLimit(getClientIP(request), AI_CONFIG);
}

/**
 * Custom rate limiter factory.
 */
export function createRateLimiter(config: Partial<RateLimitConfig>) {
  const merged: RateLimitConfig = { ...DEFAULT_CONFIG, ...config };
  return (request: NextRequest): RateLimitResult => {
    return checkRateLimit(getClientIP(request), merged);
  };
}

// ---------------------------------------------------------------------------
// Middleware Helper
// ---------------------------------------------------------------------------

/**
 * Apply rate limiting and return 429 response if exceeded.
 * Returns null if allowed (caller should proceed).
 */
export function withRateLimit(
  request: NextRequest,
  limiter: (req: NextRequest) => RateLimitResult = rateLimit
): NextResponse | null {
  const result = limiter(request);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(
            Math.ceil((result.resetAt - Date.now()) / 1000)
          ),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

/**
 * Add rate limit headers to an existing response.
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set(
    'X-RateLimit-Reset',
    String(Math.ceil(result.resetAt / 1000))
  );
  return response;
}
