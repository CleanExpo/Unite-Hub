/**
 * Consolidated Rate Limiting — Redis-backed with in-memory fallback
 *
 * Uses rate-limiter-flexible for production-grade rate limiting.
 * Redis backend in production, RateLimiterMemory fallback in development.
 *
 * Tier configuration:
 *   public:        20 req/min   (unauthenticated endpoints)
 *   free:          60 req/min   (authenticated default — apiRateLimit)
 *   ai_endpoint:   10 req/min   (aiAgentRateLimit)
 *   auth_endpoint: 10 req/min   (strictRateLimit)
 *   webhook:     1000 req/min
 *   email:         50 req/hour
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  RateLimiterRedis,
  RateLimiterMemory,
  RateLimiterRes,
} from 'rate-limiter-flexible';
import { getRedisClient } from './redis';

// ---------------------------------------------------------------------------
// Tier Configuration
// ---------------------------------------------------------------------------

export const RATE_LIMIT_TIERS = {
  public: { points: 20, duration: 60, keyPrefix: 'rl:public' },
  free: { points: 60, duration: 60, keyPrefix: 'rl:free' },
  ai_endpoint: { points: 10, duration: 60, keyPrefix: 'rl:ai' },
  auth_endpoint: { points: 10, duration: 60, keyPrefix: 'rl:auth' },
  webhook: { points: 1000, duration: 60, keyPrefix: 'rl:webhook' },
  email: { points: 50, duration: 3600, keyPrefix: 'rl:email' },
} as const;

export type RateLimitTierName = keyof typeof RATE_LIMIT_TIERS;

// ---------------------------------------------------------------------------
// Limiter Initialization (lazy singleton)
// ---------------------------------------------------------------------------

type LimiterMap = Record<RateLimitTierName, RateLimiterRedis | RateLimiterMemory>;

let limiters: LimiterMap | null = null;

function buildMemoryLimiters(): LimiterMap {
  return Object.fromEntries(
    Object.entries(RATE_LIMIT_TIERS).map(([name, { keyPrefix: _kp, ...rest }]) => [
      name,
      new RateLimiterMemory(rest),
    ])
  ) as unknown as LimiterMap;
}

function getLimiters(): LimiterMap {
  if (limiters) return limiters;

  const hasRedis = !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL);

  try {
    if (hasRedis) {
      const redis = getRedisClient();
      limiters = Object.fromEntries(
        Object.entries(RATE_LIMIT_TIERS).map(([name, config]) => [
          name,
          new RateLimiterRedis({ storeClient: redis, ...config }),
        ])
      ) as unknown as LimiterMap;
    } else {
      console.warn('⚠️  No Redis URL — rate limiting uses in-memory fallback');
      limiters = buildMemoryLimiters();
    }
  } catch (err) {
    console.error('❌ Rate limiter init failed, falling back to memory:', err);
    limiters = buildMemoryLimiters();
  }

  return limiters;
}

// ---------------------------------------------------------------------------
// IP Extraction
// ---------------------------------------------------------------------------

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

// ---------------------------------------------------------------------------
// Core: consume a rate-limit point and return 429 or null
// ---------------------------------------------------------------------------

async function consumeRateLimit(
  req: NextRequest,
  tierName: RateLimitTierName,
  keyOverride?: string,
  message = 'Too many requests, please try again later',
): Promise<NextResponse | null> {
  const tier = RATE_LIMIT_TIERS[tierName];
  const limiter = getLimiters()[tierName];
  const key = keyOverride || getClientIp(req);

  try {
    await limiter.consume(key);
    return null; // Allowed
  } catch (rlError: unknown) {
    // rate-limiter-flexible throws a RateLimiterRes on rejection
    const msBeforeNext =
      rlError instanceof RateLimiterRes
        ? rlError.msBeforeNext
        : (rlError as any)?.msBeforeNext ?? 60_000;
    const retryAfter = Math.ceil(msBeforeNext / 1000);

    return NextResponse.json(
      { error: message, retryAfter },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(tier.points),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(
            Date.now() + msBeforeNext
          ).toISOString(),
        },
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Public API — all 6 exports preserved
// ---------------------------------------------------------------------------

interface RateLimitConfig {
  windowMs?: number;
  max?: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: NextRequest) => string;
}

/**
 * Generic rate limiter (free tier — 60 req/min).
 * Accepts an optional config for backwards compatibility.
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = {},
): Promise<NextResponse | null> {
  const key = config.keyGenerator ? config.keyGenerator(req) : undefined;
  return consumeRateLimit(req, 'free', key, config.message);
}

/**
 * Standard API rate limiter — 60 req/min (free tier)
 */
export async function apiRateLimit(
  req: NextRequest,
): Promise<NextResponse | null> {
  return consumeRateLimit(
    req,
    'free',
    undefined,
    'Too many requests, please slow down',
  );
}

/**
 * Strict rate limiter for auth endpoints — 10 req/min
 */
export async function strictRateLimit(
  req: NextRequest,
): Promise<NextResponse | null> {
  return consumeRateLimit(
    req,
    'auth_endpoint',
    undefined,
    'Too many attempts, please try again later',
  );
}

/**
 * Public endpoint rate limiter — 20 req/min
 */
export async function publicRateLimit(
  req: NextRequest,
): Promise<NextResponse | null> {
  return consumeRateLimit(req, 'public');
}

/**
 * AI agent rate limiter — 10 req/min
 */
export async function aiAgentRateLimit(
  req: NextRequest,
): Promise<NextResponse | null> {
  return consumeRateLimit(
    req,
    'ai_endpoint',
    undefined,
    'Too many AI requests, please wait before trying again',
  );
}

/**
 * Per-user rate limiter factory — 60 req/min scoped to userId
 */
export function createUserRateLimit(userId: string) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    return consumeRateLimit(req, 'free', `user:${userId}`);
  };
}
