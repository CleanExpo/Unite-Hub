/**
 * Redis-Based Rate Limiter for Distributed Serverless
 *
 * SECURITY: P2-1 - Migrates rate limiting from in-memory to Redis
 * for proper distributed rate limiting across serverless instances.
 *
 * Uses sliding window algorithm for accurate rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from './redis';

export interface RateLimitConfig {
  /**
   * Time window in seconds
   * @default 60 (1 minute)
   */
  windowSeconds?: number;

  /**
   * Maximum number of requests per window
   * @default 60
   */
  max?: number;

  /**
   * Message to return when rate limit is exceeded
   * @default "Too many requests, please try again later"
   */
  message?: string;

  /**
   * HTTP status code to return when rate limit is exceeded
   * @default 429
   */
  statusCode?: number;

  /**
   * Custom key generator function
   * @default Uses IP address
   */
  keyGenerator?: (req: NextRequest) => string;

  /**
   * Prefix for Redis keys
   * @default "ratelimit"
   */
  prefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Default key generator - uses IP address or a fallback identifier
 */
function defaultKeyGenerator(req: NextRequest): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip'); // Cloudflare
  const vercelIp = req.headers.get('x-vercel-forwarded-for'); // Vercel

  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }

  // Fallback to a hash of headers if no IP available
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return `fallback-${Buffer.from(userAgent).toString('base64').substring(0, 32)}`;
}

/**
 * Check rate limit using Redis sliding window algorithm
 */
async function checkRateLimitRedis(
  key: string,
  config: Required<Pick<RateLimitConfig, 'windowSeconds' | 'max' | 'prefix'>>
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const windowStart = now - windowMs;
  const fullKey = `${config.prefix}:${key}`;

  try {
    // Use a Lua script for atomic sliding window rate limiting
    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local window_start = tonumber(ARGV[2])
      local max_requests = tonumber(ARGV[3])
      local window_seconds = tonumber(ARGV[4])

      -- Remove old entries outside the window
      redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

      -- Count current requests in window
      local current_count = redis.call('ZCARD', key)

      if current_count < max_requests then
        -- Add the new request
        redis.call('ZADD', key, now, now .. '-' .. math.random())
        -- Set TTL on the key
        redis.call('EXPIRE', key, window_seconds + 1)
        return {1, max_requests - current_count - 1, 0}
      else
        -- Get the oldest entry to calculate retry-after
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local retry_after = 0
        if oldest and oldest[2] then
          retry_after = math.ceil((tonumber(oldest[2]) + (window_seconds * 1000) - now) / 1000)
        end
        return {0, 0, retry_after}
      end
    `;

    const result = await redis.eval(
      luaScript,
      1,
      fullKey,
      now.toString(),
      windowStart.toString(),
      config.max.toString(),
      config.windowSeconds.toString()
    ) as [number, number, number];

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetTime: now + windowMs,
      retryAfter: result[2] > 0 ? result[2] : undefined,
    };
  } catch (error) {
    console.error('[RateLimit] Redis error, falling back to allow:', error);
    // Fail open - if Redis is down, allow the request but log the error
    // In production, you might want to fail closed depending on security requirements
    return {
      allowed: true,
      remaining: config.max,
      resetTime: now + windowMs,
    };
  }
}

/**
 * Redis-based rate limiter middleware for Next.js API routes
 *
 * @example
 * import { rateLimitRedis } from '@/lib/rate-limit-redis';
 *
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await rateLimitRedis(req);
 *   if (rateLimitResult) {
 *     return rateLimitResult; // Returns 429 response
 *   }
 *
 *   // Continue with your endpoint logic
 *   return NextResponse.json({ success: true });
 * }
 */
export async function rateLimitRedis(
  req: NextRequest,
  config: RateLimitConfig = {}
): Promise<NextResponse | null> {
  const {
    windowSeconds = 60, // 1 minute
    max = 60,
    message = 'Too many requests, please try again later',
    statusCode = 429,
    keyGenerator = defaultKeyGenerator,
    prefix = 'ratelimit',
  } = config;

  const key = keyGenerator(req);
  const result = await checkRateLimitRedis(key, { windowSeconds, max, prefix });

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: message,
        retryAfter: result.retryAfter,
      },
      {
        status: statusCode,
        headers: {
          'Retry-After': (result.retryAfter || Math.ceil(windowSeconds)).toString(),
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Strict rate limiter for sensitive endpoints (auth, password reset, etc.)
 * 10 requests per 15 minutes
 */
export async function strictRateLimitRedis(
  req: NextRequest
): Promise<NextResponse | null> {
  return rateLimitRedis(req, {
    windowSeconds: 15 * 60, // 15 minutes
    max: 10,
    message: 'Too many attempts, please try again later',
    prefix: 'ratelimit:strict',
  });
}

/**
 * Standard rate limiter for API endpoints
 * 100 requests per 15 minutes
 */
export async function apiRateLimitRedis(
  req: NextRequest
): Promise<NextResponse | null> {
  return rateLimitRedis(req, {
    windowSeconds: 15 * 60, // 15 minutes
    max: 100,
    message: 'Too many requests, please slow down',
    prefix: 'ratelimit:api',
  });
}

/**
 * Lenient rate limiter for public endpoints
 * 300 requests per 15 minutes
 */
export async function publicRateLimitRedis(
  req: NextRequest
): Promise<NextResponse | null> {
  return rateLimitRedis(req, {
    windowSeconds: 15 * 60, // 15 minutes
    max: 300,
    message: 'Too many requests, please try again later',
    prefix: 'ratelimit:public',
  });
}

/**
 * AI agent rate limiter (higher cost operations)
 * 50 requests per 15 minutes
 */
export async function aiAgentRateLimitRedis(
  req: NextRequest
): Promise<NextResponse | null> {
  return rateLimitRedis(req, {
    windowSeconds: 15 * 60, // 15 minutes
    max: 50,
    message: 'Too many AI requests, please wait before trying again',
    prefix: 'ratelimit:ai',
  });
}

/**
 * Custom rate limiter by user ID
 * Useful for authenticated endpoints where you want per-user limits
 */
export function createUserRateLimitRedis(
  userId: string,
  config: Omit<RateLimitConfig, 'keyGenerator'> = {}
) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    return rateLimitRedis(req, {
      windowSeconds: config.windowSeconds || 15 * 60, // 15 minutes
      max: config.max || 100,
      keyGenerator: () => `user:${userId}`,
      prefix: config.prefix || 'ratelimit:user',
      ...config,
    });
  };
}

/**
 * Get rate limit status for a key (useful for debugging)
 */
export async function getRateLimitStatus(
  key: string,
  prefix: string = 'ratelimit'
): Promise<{ count: number; ttl: number } | null> {
  const redis = getRedisClient();
  const fullKey = `${prefix}:${key}`;

  try {
    const [count, ttl] = await Promise.all([
      redis.zcard(fullKey),
      redis.ttl(fullKey),
    ]);

    return {
      count: count as number,
      ttl: ttl as number,
    };
  } catch (error) {
    console.error('[RateLimit] Error getting status:', error);
    return null;
  }
}

/**
 * Reset rate limit for a specific key (admin function)
 */
export async function resetRateLimit(
  key: string,
  prefix: string = 'ratelimit'
): Promise<boolean> {
  const redis = getRedisClient();
  const fullKey = `${prefix}:${key}`;

  try {
    await redis.del(fullKey);
    return true;
  } catch (error) {
    console.error('[RateLimit] Error resetting limit:', error);
    return false;
  }
}
