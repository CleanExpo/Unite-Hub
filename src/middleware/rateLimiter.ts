import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { getRedisClient } from '@/lib/redis';

// Rate limit configurations for different tiers
export const RATE_LIMITS = {
  // Public endpoints (no auth required)
  public: {
    points: 20, // 20 requests
    duration: 60, // per 60 seconds (1 minute)
  },
  // Authenticated users (free tier)
  authenticated: {
    points: 100, // 100 requests
    duration: 60, // per 60 seconds
  },
  // Premium users
  premium: {
    points: 1000, // 1000 requests
    duration: 60, // per 60 seconds
  },
  // AI endpoints (expensive operations)
  ai: {
    points: 10, // 10 requests
    duration: 60, // per 60 seconds
  },
  // Email sending
  email: {
    points: 50, // 50 emails
    duration: 3600, // per hour
  },
};

// Create rate limiters
let rateLimiters: {
  public: RateLimiterRedis | RateLimiterMemory;
  authenticated: RateLimiterRedis | RateLimiterMemory;
  premium: RateLimiterRedis | RateLimiterMemory;
  ai: RateLimiterRedis | RateLimiterMemory;
  email: RateLimiterRedis | RateLimiterMemory;
} | null = null;

function initializeRateLimiters() {
  if (rateLimiters) {
return rateLimiters;
}

  try {
    const redisClient = getRedisClient();
    const useRedis = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

    if (useRedis) {
      // Use Redis-backed rate limiter (production)
      rateLimiters = {
        public: new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: 'rl:public',
          ...RATE_LIMITS.public,
        }),
        authenticated: new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: 'rl:auth',
          ...RATE_LIMITS.authenticated,
        }),
        premium: new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: 'rl:premium',
          ...RATE_LIMITS.premium,
        }),
        ai: new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: 'rl:ai',
          ...RATE_LIMITS.ai,
        }),
        email: new RateLimiterRedis({
          storeClient: redisClient,
          keyPrefix: 'rl:email',
          ...RATE_LIMITS.email,
        }),
      };
    } else {
      // Use in-memory rate limiter (development)
      console.warn('⚠️  Using in-memory rate limiting (not suitable for production)');
      rateLimiters = {
        public: new RateLimiterMemory(RATE_LIMITS.public),
        authenticated: new RateLimiterMemory(RATE_LIMITS.authenticated),
        premium: new RateLimiterMemory(RATE_LIMITS.premium),
        ai: new RateLimiterMemory(RATE_LIMITS.ai),
        email: new RateLimiterMemory(RATE_LIMITS.email),
      };
    }
  } catch (error) {
    console.error('❌ Failed to initialize rate limiters:', error);
    // Fallback to memory-based
    rateLimiters = {
      public: new RateLimiterMemory(RATE_LIMITS.public),
      authenticated: new RateLimiterMemory(RATE_LIMITS.authenticated),
      premium: new RateLimiterMemory(RATE_LIMITS.premium),
      ai: new RateLimiterMemory(RATE_LIMITS.ai),
      email: new RateLimiterMemory(RATE_LIMITS.email),
    };
  }

  return rateLimiters;
}

type RateLimitTier = 'public' | 'authenticated' | 'premium' | 'ai' | 'email';

export interface RateLimitOptions {
  tier?: RateLimitTier;
  userId?: string;
  identifier?: string; // Custom identifier (e.g., email address)
}

/**
 * Rate limiting middleware for API routes
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await rateLimit(req, { tier: 'authenticated', userId: user.id });
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response;
 *   }
 *   // ... your API logic
 * }
 * ```
 */
export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<{ success: boolean; response?: NextResponse; remaining?: number }> {
  const { tier = 'public', userId, identifier } = options;

  // Get rate limiter for this tier
  const limiters = initializeRateLimiters();
  const limiter = limiters[tier];

  // Determine the key for rate limiting
  let key: string;
  if (identifier) {
    key = identifier;
  } else if (userId) {
    key = `user:${userId}`;
  } else {
    // Use IP address for anonymous users
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    key = `ip:${ip}`;
  }

  try {
    const result: RateLimiterRes = await limiter.consume(key);

    // Add rate limit headers
    const headers = {
      'X-RateLimit-Limit': String(RATE_LIMITS[tier].points),
      'X-RateLimit-Remaining': String(result.remainingPoints),
      'X-RateLimit-Reset': String(new Date(Date.now() + result.msBeforeNext).toISOString()),
    };

    return {
      success: true,
      remaining: result.remainingPoints,
    };
  } catch (rateLimitError) {
    if (rateLimitError instanceof Error) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((rateLimitError as any).msBeforeNext / 1000);

      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(RATE_LIMITS[tier].points),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(new Date(Date.now() + (rateLimitError as any).msBeforeNext).toISOString()),
            },
          }
        ),
      };
    }

    // Unknown error - allow request but log
    console.error('❌ Rate limiter error:', rateLimitError);
    return { success: true };
  }
}

/**
 * Helper function to get user tier (for future premium features)
 */
export function getUserTier(user: any): RateLimitTier {
  if (!user) {
return 'public';
}
  if (user.isPremium || user.tier === 'premium') {
return 'premium';
}
  return 'authenticated';
}
