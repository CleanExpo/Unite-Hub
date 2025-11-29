/**
 * Rate Limit Service
 *
 * Connects the in-memory rate limiter to the database for:
 * - Persistent rate limit logging
 * - IP blocking
 * - Custom rate limit overrides
 * - Analytics and monitoring
 *
 * @module lib/services/rate-limit-service
 */

import { createClient } from '@/lib/supabase/server';
import type { RateLimitTier } from '@/core/security/types';

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  retryAfter?: number;
  tier: RateLimitTier;
  isOverride?: boolean;
}

/**
 * Rate limit override
 */
interface RateLimitOverride {
  max_requests: number;
  window_seconds: number;
  tier: RateLimitTier;
}

/**
 * Extract IP address from request headers
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Check if an IP is blocked
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('is_ip_blocked', { ip_param: ip });

    if (error) {
      console.error('Error checking blocked IP:', error);
      return false; // Fail open - don't block on error
    }

    return data === true;
  } catch (error) {
    console.error('Exception checking blocked IP:', error);
    return false; // Fail open
  }
}

/**
 * Get rate limit override for a client/endpoint
 */
export async function getRateLimitOverride(
  clientKey: string,
  endpoint: string,
  workspaceId?: string
): Promise<RateLimitOverride | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('get_rate_limit_override', {
        client_key_param: clientKey,
        endpoint_param: endpoint,
        workspace_id_param: workspaceId || null,
      });

    if (error) {
      console.error('Error getting rate limit override:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0] as RateLimitOverride;
  } catch (error) {
    console.error('Exception getting rate limit override:', error);
    return null;
  }
}

/**
 * Log rate limit event to database
 */
export async function logRateLimitEvent(
  clientKey: string,
  endpoint: string,
  tier: RateLimitTier,
  allowed: boolean,
  remaining: number,
  resetAt: Date,
  requestMethod?: string,
  statusCode?: number
): Promise<void> {
  try {
    const supabase = await createClient();

    // Use RPC function for logging
    const { error } = await supabase.rpc('log_rate_limit', {
      client_key_param: clientKey,
      endpoint_param: endpoint,
      tier_param: tier,
      allowed_param: allowed,
      remaining_param: remaining,
      reset_at_param: resetAt.toISOString(),
      method_param: requestMethod || null,
      status_param: statusCode || null,
    });

    if (error) {
      console.error('Error logging rate limit event:', error);
    }
  } catch (error) {
    console.error('Exception logging rate limit event:', error);
  }
}

/**
 * Check rate limit with database integration
 *
 * @param ip - Client IP address
 * @param userId - User ID (if authenticated)
 * @param endpoint - API endpoint path
 * @param tier - Rate limit tier
 * @param workspaceId - Workspace ID (if applicable)
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  ip: string,
  userId: string | null,
  endpoint: string,
  tier: RateLimitTier,
  workspaceId?: string
): Promise<RateLimitCheckResult> {
  // 1. Check if IP is blocked
  const blocked = await isIpBlocked(ip);
  if (blocked) {
    return {
      allowed: false,
      remaining: 0,
      reset: Date.now() + 3600000, // 1 hour
      retryAfter: 3600,
      tier,
    };
  }

  // 2. Check for rate limit override
  const clientKey = userId || ip;
  const override = await getRateLimitOverride(clientKey, endpoint, workspaceId);

  if (override) {
    // Use override limits
    // Note: The in-memory rate limiter will use default configs,
    // so we just return the override info here
    // In a full implementation, we'd need to apply the override to the actual limiter
    return {
      allowed: true, // Override found - let the in-memory limiter handle it with custom config
      remaining: override.max_requests,
      reset: Date.now() + (override.window_seconds * 1000),
      tier: override.tier,
      isOverride: true,
    };
  }

  // 3. No override - use default tier limits
  return {
    allowed: true, // Let in-memory limiter handle the actual check
    remaining: 0, // Will be filled by in-memory limiter
    reset: Date.now() + 60000, // 1 minute default
    tier,
  };
}

/**
 * Log request to database
 * Should be called after the in-memory rate limiter has made its decision
 *
 * @param ip - Client IP address
 * @param userId - User ID (if authenticated)
 * @param endpoint - API endpoint path
 * @param tier - Rate limit tier
 * @param allowed - Whether request was allowed
 * @param remaining - Remaining requests in window
 * @param resetAt - When the limit resets
 * @param method - HTTP method
 * @param statusCode - Response status code
 */
export async function logRequest(
  ip: string,
  userId: string | null,
  endpoint: string,
  tier: RateLimitTier,
  allowed: boolean,
  remaining: number,
  resetAt: Date,
  method?: string,
  statusCode?: number
): Promise<void> {
  const clientKey = userId || ip;
  await logRateLimitEvent(
    clientKey,
    endpoint,
    tier,
    allowed,
    remaining,
    resetAt,
    method,
    statusCode
  );
}

/**
 * Block an IP address
 *
 * @param ip - IP address to block
 * @param reason - Reason for blocking
 * @param blockedBy - User ID of admin who blocked the IP
 * @param duration - Duration in seconds (null = permanent)
 */
export async function blockIp(
  ip: string,
  reason: string,
  blockedBy: string,
  duration?: number
): Promise<void> {
  try {
    const supabase = await createClient();

    const blockedUntil = duration
      ? new Date(Date.now() + duration * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('blocked_ips')
      .insert({
        ip_address: ip,
        reason,
        blocked_by: blockedBy,
        blocked_until: blockedUntil,
      });

    if (error) {
      console.error('Error blocking IP:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception blocking IP:', error);
    throw error;
  }
}

/**
 * Unblock an IP address
 */
export async function unblockIp(ip: string): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('blocked_ips')
      .delete()
      .eq('ip_address', ip);

    if (error) {
      console.error('Error unblocking IP:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception unblocking IP:', error);
    throw error;
  }
}

/**
 * Create a rate limit override
 */
export async function createRateLimitOverride(
  override: {
    clientKey?: string;
    endpointPattern?: string;
    workspaceId?: string;
    tier?: RateLimitTier;
    maxRequests: number;
    windowSeconds?: number;
    reason?: string;
    expiresAt?: Date;
    createdBy?: string;
  }
): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('rate_limit_overrides')
      .insert({
        client_key: override.clientKey || null,
        endpoint_pattern: override.endpointPattern || null,
        workspace_id: override.workspaceId || null,
        tier: override.tier || null,
        max_requests: override.maxRequests,
        window_seconds: override.windowSeconds || 60,
        reason: override.reason || null,
        expires_at: override.expiresAt?.toISOString() || null,
        created_by: override.createdBy || null,
      });

    if (error) {
      console.error('Error creating rate limit override:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exception creating rate limit override:', error);
    throw error;
  }
}

/**
 * Get rate limit analytics
 */
export async function getRateLimitAnalytics(
  startDate?: Date,
  endDate?: Date,
  tier?: RateLimitTier,
  endpoint?: string
): Promise<any[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('rate_limit_analytics')
      .select('*')
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate.toISOString().split('T')[0]);
    }

    if (endDate) {
      query = query.lte('date', endDate.toISOString().split('T')[0]);
    }

    if (tier) {
      query = query.eq('tier', tier);
    }

    if (endpoint) {
      query = query.eq('endpoint', endpoint);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting rate limit analytics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception getting rate limit analytics:', error);
    return [];
  }
}
