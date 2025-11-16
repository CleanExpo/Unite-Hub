/**
 * Rate Limiting Utility for Next.js API Routes
 * In-memory rate limiter with configurable windows and limits
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number;

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
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limit data
const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Default key generator - uses IP address or a fallback identifier
 */
function defaultKeyGenerator(req: NextRequest): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a combination of headers if no IP available
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return `fallback-${userAgent.substring(0, 50)}`;
}

/**
 * Rate limiter middleware for Next.js API routes
 *
 * @example
 * // In your API route:
 * import { rateLimit } from '@/lib/rate-limit';
 *
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await rateLimit(req);
 *   if (rateLimitResult) {
 *     return rateLimitResult; // Returns 429 response
 *   }
 *
 *   // Continue with your endpoint logic
 *   return NextResponse.json({ success: true });
 * }
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = {}
): Promise<NextResponse | null> {
  const {
    windowMs = 60000, // 1 minute
    max = 60,
    message = 'Too many requests, please try again later',
    statusCode = 429,
    keyGenerator = defaultKeyGenerator,
  } = config;

  const key = keyGenerator(req);
  const now = Date.now();

  // Initialize or get existing entry
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return null; // Allow request
  }

  // Increment counter
  store[key].count += 1;

  // Check if limit exceeded
  if (store[key].count > max) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);

    return NextResponse.json(
      {
        error: message,
        retryAfter: retryAfter,
      },
      {
        status: statusCode,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': store[key].resetTime.toString(),
        },
      }
    );
  }

  // Request allowed - could optionally add rate limit headers to response
  return null;
}

/**
 * Strict rate limiter for sensitive endpoints (auth, password reset, etc.)
 * 10 requests per 15 minutes
 */
export async function strictRateLimit(
  req: NextRequest
): Promise<NextResponse | null> {
  return rateLimit(req, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many attempts, please try again later',
  });
}

/**
 * Standard rate limiter for API endpoints
 * 100 requests per 15 minutes
 */
export async function apiRateLimit(
  req: NextRequest
): Promise<NextResponse | null> {
  return rateLimit(req, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests, please slow down',
  });
}

/**
 * Lenient rate limiter for public endpoints
 * 300 requests per 15 minutes
 */
export async function publicRateLimit(
  req: NextRequest
): Promise<NextResponse | null> {
  return rateLimit(req, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    message: 'Too many requests, please try again later',
  });
}

/**
 * AI agent rate limiter (higher cost operations)
 * 20 requests per 15 minutes
 */
export async function aiAgentRateLimit(
  req: NextRequest
): Promise<NextResponse | null> {
  return rateLimit(req, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: 'Too many AI requests, please wait before trying again',
  });
}

/**
 * Custom rate limiter by user ID
 * Useful for authenticated endpoints where you want per-user limits
 */
export function createUserRateLimit(userId: string) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    return rateLimit(req, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      keyGenerator: () => `user:${userId}`,
    });
  };
}
