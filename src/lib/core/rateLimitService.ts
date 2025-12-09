/**
 * Rate Limiting & Abuse Detection Service (Phase E14)
 *
 * Protect API endpoints from abuse and excessive usage
 * Hybrid approach: in-memory burst cache + database persistence
 *
 * @module rateLimitService
 */

import { supabaseAdmin } from "@/lib/supabase";

export type RateLimitWindow = "second" | "minute" | "hour" | "day";

export interface RateLimitConfig {
  id: string;
  tenant_id: string | null;
  route_pattern: string;
  limit_count: number;
  time_window: RateLimitWindow;
  enabled: boolean;
  description: string | null;
}

export interface RateLimitCheck {
  allowed: boolean;
  limit: number | null;
  current: number;
  window: RateLimitWindow | null;
  reset_at?: string;
  reason?: string;
}

export interface AbuseFlag {
  id: string;
  tenant_id: string;
  user_id: string;
  route: string;
  reason: string;
  severity: string;
  status: string;
  event_count: number;
  created_at: string;
}

// In-memory cache for burst protection (process-level)
interface BurstCacheEntry {
  count: number;
  windowStart: number;
}

const burstCache = new Map<string, BurstCacheEntry>();
const BURST_CACHE_CLEANUP_INTERVAL = 60000; // 1 minute

// Cleanup old burst cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of burstCache.entries()) {
    if (now - entry.windowStart > 60000) {
      // 1 minute stale
      burstCache.delete(key);
    }
  }
}, BURST_CACHE_CLEANUP_INTERVAL);

/**
 * Check rate limit and consume if allowed
 *
 * @param tenantId - Tenant UUID
 * @param userId - User UUID
 * @param route - API route pattern
 * @returns Rate limit check result
 */
export async function checkAndConsume(
  tenantId: string,
  userId: string,
  route: string
): Promise<RateLimitCheck> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    // Burst cache check (in-memory, fast)
    const burstKey = `${tenantId}:${userId}:${route}`;
    const burstEntry = burstCache.get(burstKey);
    const now = Date.now();

    if (burstEntry) {
      // Check if within 1-second burst window
      if (now - burstEntry.windowStart < 1000) {
        if (burstEntry.count >= 5) {
          // 5 requests/second burst limit
          return {
            allowed: false,
            limit: 5,
            current: burstEntry.count,
            window: "second",
            reason: "Burst limit exceeded (5 req/sec)",
          };
        }
        burstEntry.count++;
      } else {
        // Reset burst window
        burstEntry.count = 1;
        burstEntry.windowStart = now;
      }
    } else {
      // Initialize burst cache
      burstCache.set(burstKey, { count: 1, windowStart: now });
    }

    // Database rate limit check (slower, but accurate)
    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_route: route,
    });

    if (error) {
      console.error("[RateLimit] Error checking limit:", error);
      // Fail open (allow on error)
      return { allowed: true, limit: null, current: 0, window: null };
    }

    const result = data as RateLimitCheck;

    // Record usage event (async, non-blocking)
    recordUsageEventAsync(tenantId, userId, route).catch((err) =>
      console.error("[RateLimit] Failed to record usage:", err)
    );

    // Auto-flag abuse if limit exceeded
    if (!result.allowed) {
      flagAbuseAsync(
        tenantId,
        userId,
        route,
        `Rate limit exceeded: ${result.current}/${result.limit} in ${result.window}`,
        "medium"
      ).catch((err) => console.error("[RateLimit] Failed to flag abuse:", err));
    }

    return result;
  } catch (err) {
    console.error("[RateLimit] Exception in checkAndConsume:", err);
    // Fail open
    return { allowed: true, limit: null, current: 0, window: null };
  }
}

/**
 * Record usage event (non-blocking)
 *
 * @param tenantId - Tenant UUID
 * @param userId - User UUID
 * @param route - API route
 * @param method - HTTP method
 * @param statusCode - Response status
 */
async function recordUsageEventAsync(
  tenantId: string,
  userId: string,
  route: string,
  method: string = "POST",
  statusCode: number = 200
): Promise<void> {
  try {
    await supabaseAdmin.rpc("record_usage_event", {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_route: route,
      p_method: method,
      p_status_code: statusCode,
    });
  } catch (err) {
    console.error("[RateLimit] Error recording usage event:", err);
  }
}

/**
 * Flag abuse (non-blocking)
 *
 * @param tenantId - Tenant UUID
 * @param userId - User UUID
 * @param route - API route
 * @param reason - Abuse reason
 * @param severity - Severity level
 */
async function flagAbuseAsync(
  tenantId: string,
  userId: string,
  route: string,
  reason: string,
  severity: string = "medium"
): Promise<void> {
  try {
    await supabaseAdmin.rpc("flag_abuse", {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_route: route,
      p_reason: reason,
      p_severity: severity,
    });
  } catch (err) {
    console.error("[RateLimit] Error flagging abuse:", err);
  }
}

/**
 * Record abuse flag (manual)
 *
 * @param tenantId - Tenant UUID
 * @param userId - User UUID
 * @param route - API route
 * @param reason - Abuse reason
 * @param severity - Severity level (low, medium, high, critical)
 * @param eventCount - Number of triggering events
 * @returns Flag ID
 */
export async function recordAbuseFlag(
  tenantId: string,
  userId: string,
  route: string,
  reason: string,
  severity: string = "medium",
  eventCount: number = 1
): Promise<string | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("flag_abuse", {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_route: route,
      p_reason: reason,
      p_severity: severity,
      p_event_count: eventCount,
    });

    if (error) {
      console.error("[RateLimit] Error flagging abuse:", error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error("[RateLimit] Exception in recordAbuseFlag:", err);
    return null;
  }
}

/**
 * List rate limit configs
 *
 * @param tenantId - Optional tenant filter
 * @returns Array of rate limit configs
 */
export async function listRateLimits(
  tenantId?: string
): Promise<RateLimitConfig[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    let query = supabaseAdmin
      .from("api_rate_limits")
      .select("*")
      .order("route_pattern");

    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[RateLimit] Error listing limits:", error);
      return [];
    }

    return (data || []) as RateLimitConfig[];
  } catch (err) {
    console.error("[RateLimit] Exception in listRateLimits:", err);
    return [];
  }
}

/**
 * Upsert rate limit config
 *
 * @param config - Rate limit configuration
 * @returns Config ID
 */
export async function upsertRateLimit(config: {
  tenant_id?: string;
  route_pattern: string;
  limit_count: number;
  time_window: RateLimitWindow;
  enabled?: boolean;
  description?: string;
}): Promise<string | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("api_rate_limits")
      .upsert(
        {
          tenant_id: config.tenant_id || null,
          route_pattern: config.route_pattern,
          limit_count: config.limit_count,
          time_window: config.time_window,
          enabled: config.enabled !== undefined ? config.enabled : true,
          description: config.description || null,
        },
        { onConflict: "tenant_id,route_pattern" }
      )
      .select("id")
      .single();

    if (error) {
      console.error("[RateLimit] Error upserting limit:", error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error("[RateLimit] Exception in upsertRateLimit:", err);
    return null;
  }
}

/**
 * List abuse flags
 *
 * @param tenantId - Tenant UUID
 * @param status - Optional status filter
 * @param limit - Max results
 * @returns Array of abuse flags
 */
export async function listAbuseFlags(
  tenantId: string,
  status?: string,
  limit: number = 100
): Promise<AbuseFlag[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    let query = supabaseAdmin
      .from("abuse_flags")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[RateLimit] Error listing flags:", error);
      return [];
    }

    return (data || []) as AbuseFlag[];
  } catch (err) {
    console.error("[RateLimit] Exception in listAbuseFlags:", err);
    return [];
  }
}

/**
 * Resolve abuse flag
 *
 * @param flagId - Flag UUID
 * @param resolvedBy - User resolving the flag
 * @param notes - Resolution notes
 * @returns True if resolved
 */
export async function resolveAbuseFlag(
  flagId: string,
  resolvedBy: string,
  notes?: string
): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    const { error } = await supabaseAdmin
      .from("abuse_flags")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        resolution_notes: notes || null,
      })
      .eq("id", flagId);

    if (error) {
      console.error("[RateLimit] Error resolving flag:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[RateLimit] Exception in resolveAbuseFlag:", err);
    return false;
  }
}

/**
 * Get usage statistics
 *
 * @param tenantId - Tenant UUID
 * @param route - Optional route filter
 * @param hours - Time window in hours
 * @returns Usage stats
 */
export async function getUsageStats(
  tenantId: string,
  route?: string,
  hours: number = 24
): Promise<{
  total_requests: number;
  unique_users: number;
  avg_response_time: number;
}> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - hours);

    let query = supabaseAdmin
      .from("api_usage_events")
      .select("user_id, response_time_ms")
      .eq("tenant_id", tenantId)
      .gte("occurred_at", windowStart.toISOString());

    if (route) {
      query = query.eq("route", route);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[RateLimit] Error fetching usage stats:", error);
      return { total_requests: 0, unique_users: 0, avg_response_time: 0 };
    }

    const totalRequests = data?.length || 0;
    const uniqueUsers = new Set(data?.map((e) => e.user_id)).size;
    const avgResponseTime =
      data && data.length > 0
        ? data.reduce((sum, e) => sum + (e.response_time_ms || 0), 0) /
          data.length
        : 0;

    return {
      total_requests: totalRequests,
      unique_users: uniqueUsers,
      avg_response_time: Math.round(avgResponseTime),
    };
  } catch (err) {
    console.error("[RateLimit] Exception in getUsageStats:", err);
    return { total_requests: 0, unique_users: 0, avg_response_time: 0 };
  }
}
