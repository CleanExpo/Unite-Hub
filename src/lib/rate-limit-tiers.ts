/**
 * @deprecated Use `@/lib/rate-limit` instead. This file is superseded by the
 * consolidated Redis-backed rate limiter (UNI-204). Will be removed in a future release.
 *
 * Tier-Based Rate Limiting
 * Enterprise-grade rate limiting with plan-based quotas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface TierLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  aiCallsPerDay: number;
  cost: number; // Cost per request in credits
}

/**
 * Rate limit configuration by plan tier
 */
export const TIER_LIMITS: Record<PlanTier, TierLimits> = {
  free: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 1000,
    aiCallsPerDay: 10,
    cost: 1,
  },
  starter: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
    requestsPerDay: 5000,
    aiCallsPerDay: 100,
    cost: 1,
  },
  professional: {
    requestsPerMinute: 100,
    requestsPerHour: 2000,
    requestsPerDay: 20000,
    aiCallsPerDay: 500,
    cost: 0.5,
  },
  enterprise: {
    requestsPerMinute: 500,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    aiCallsPerDay: 5000,
    cost: 0.25,
  },
};

interface RateLimitResult {
  allowed: boolean;
  response?: NextResponse;
  remaining: {
    minute: number;
    hour: number;
    day: number;
  };
  tier: PlanTier;
}

/**
 * Get user's plan tier from database
 */
async function getUserTier(userId: string): Promise<PlanTier> {
  try {
    const supabase = await getSupabaseServer();
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('plan_tier')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return 'free'; // Default to free tier
    }
    
    return data.plan_tier as PlanTier;
  } catch (error) {
    console.error('[Rate Limit] Failed to fetch user tier:', error);
    return 'free';
  }
}

/**
 * Check tier-based rate limits
 */
export async function checkTierRateLimit(
  req: NextRequest,
  userId: string,
  resourceType: 'api' | 'ai' = 'api'
): Promise<RateLimitResult> {
  const tier = await getUserTier(userId);
  const limits = TIER_LIMITS[tier];
  
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const hour = Math.floor(now / 3600000);
  const day = Math.floor(now / 86400000);
  
  // Keys for different time windows
  const minuteKey = `rate-limit:${userId}:minute:${minute}`;
  const hourKey = `rate-limit:${userId}:hour:${hour}`;
  const dayKey = `rate-limit:${userId}:day:${day}`;
  const aiDayKey = `rate-limit:${userId}:ai:day:${day}`;
  
  // Get counts from Redis (or fallback to in-memory)
  const counts = await getCounts([minuteKey, hourKey, dayKey, aiDayKey]);
  
  // Check limits
  if (counts[minuteKey] >= limits.requestsPerMinute) {
    return {
      allowed: false,
      response: createRateLimitResponse('minute', limits.requestsPerMinute, tier),
      remaining: { minute: 0, hour: 0, day: 0 },
      tier,
    };
  }
  
  if (counts[hourKey] >= limits.requestsPerHour) {
    return {
      allowed: false,
      response: createRateLimitResponse('hour', limits.requestsPerHour, tier),
      remaining: {
        minute: limits.requestsPerMinute - counts[minuteKey],
        hour: 0,
        day: 0,
      },
      tier,
    };
  }
  
  if (counts[dayKey] >= limits.requestsPerDay) {
    return {
      allowed: false,
      response: createRateLimitResponse('day', limits.requestsPerDay, tier),
      remaining: {
        minute: limits.requestsPerMinute - counts[minuteKey],
        hour: limits.requestsPerHour - counts[hourKey],
        day: 0,
      },
      tier,
    };
  }
  
  // Check AI-specific limits
  if (resourceType === 'ai' && counts[aiDayKey] >= limits.aiCallsPerDay) {
    return {
      allowed: false,
      response: createRateLimitResponse('day', limits.aiCallsPerDay, tier, 'AI calls'),
      remaining: {
        minute: limits.requestsPerMinute - counts[minuteKey],
        hour: limits.requestsPerHour - counts[hourKey],
        day: 0,
      },
      tier,
    };
  }
  
  // Increment counters
  await incrementCounts([minuteKey, hourKey, dayKey]);
  if (resourceType === 'ai') {
    await incrementCounts([aiDayKey]);
  }
  
  return {
    allowed: true,
    remaining: {
      minute: limits.requestsPerMinute - counts[minuteKey] - 1,
      hour: limits.requestsPerHour - counts[hourKey] - 1,
      day: limits.requestsPerDay - counts[dayKey] - 1,
    },
    tier,
  };
}

/**
 * Create rate limit error response
 */
function createRateLimitResponse(
  window: 'minute' | 'hour' | 'day',
  limit: number,
  tier: PlanTier,
  resourceType: string = 'requests'
): NextResponse {
  const retryAfter = window === 'minute' ? 60 : window === 'hour' ? 3600 : 86400;
  
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: `Too many ${resourceType}. Please try again in ${retryAfter} seconds.`,
      tier,
      limit,
      window,
      retryAfter,
      upgrade: tier !== 'enterprise' ? 'Upgrade to increase limits' : undefined,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Window': window,
        'X-Plan-Tier': tier,
      },
    }
  );
}

/**
 * Get next tier for upgrade messaging
 */
function getNextTier(current: PlanTier): PlanTier {
  const tiers: PlanTier[] = ['free', 'starter', 'professional', 'enterprise'];
  const currentIndex = tiers.indexOf(current);
  return tiers[Math.min(currentIndex + 1, tiers.length - 1)];
}

/**
 * Get counts from Redis or in-memory store
 */
const memoryStore: Record<string, number> = {};

async function getCounts(keys: string[]): Promise<Record<string, number>> {
  // TODO: Implement Redis connection
  // For now, use in-memory store
  const result: Record<string, number> = {};
  keys.forEach(key => {
    result[key] = memoryStore[key] || 0;
  });
  return result;
}

/**
 * Increment counters
 */
async function incrementCounts(keys: string[]): Promise<void> {
  // TODO: Implement Redis connection with TTL
  keys.forEach(key => {
    memoryStore[key] = (memoryStore[key] || 0) + 1;
  });
}

/**
 * Add rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  const limits = TIER_LIMITS[result.tier];
  
  response.headers.set('X-RateLimit-Limit-Minute', limits.requestsPerMinute.toString());
  response.headers.set('X-RateLimit-Remaining-Minute', result.remaining.minute.toString());
  response.headers.set('X-RateLimit-Limit-Hour', limits.requestsPerHour.toString());
  response.headers.set('X-RateLimit-Remaining-Hour', result.remaining.hour.toString());
  response.headers.set('X-RateLimit-Limit-Day', limits.requestsPerDay.toString());
  response.headers.set('X-RateLimit-Remaining-Day', result.remaining.day.toString());
  response.headers.set('X-Plan-Tier', result.tier);
  
  return response;
}
