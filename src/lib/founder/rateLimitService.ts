/**
 * Rate Limit Service (Phase E23)
 *
 * Global and tenant-aware rate limiting with abuse prevention
 * Server-side only - never expose to client
 *
 * @module rateLimitService
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type RateLimitScope = "global" | "tenant" | "user" | "ip";
export type RateLimitWindow = "second" | "minute" | "hour" | "day";

export interface RateLimit {
  id: string;
  tenant_id: string | null;
  scope: RateLimitScope;
  identifier: string;
  max_requests: number;
  window_size: number;
  window_type: RateLimitWindow;
  enabled: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RateLimitEvent {
  id: string;
  tenant_id: string | null;
  scope: RateLimitScope;
  identifier: string;
  subject: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number | null;
  remaining: number | null;
  reset_at: string | null;
  current_count?: number;
}

export interface RateLimitStatistics {
  total_events: number;
  unique_subjects: number;
  by_identifier: Array<{ identifier: string; count: number }>;
  recent_events: Array<{
    identifier: string;
    subject: string;
    created_at: string;
  }>;
}

/**
 * Check rate limit for a given identifier and subject
 */
export async function checkRateLimit(
  tenantId: string | null,
  scope: RateLimitScope,
  identifier: string,
  subject: string
): Promise<RateLimitCheckResult> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      p_tenant_id: tenantId,
      p_scope: scope,
      p_identifier: identifier,
      p_subject: subject,
    });

    if (error) {
      console.error("[RateLimit] Error checking rate limit:", error);
      // Fail open - allow request if check fails
      return {
        allowed: true,
        limit: null,
        remaining: null,
        reset_at: null,
      };
    }

    return data as RateLimitCheckResult;
  } catch (err) {
    console.error("[RateLimit] Exception in checkRateLimit:", err);
    // Fail open
    return {
      allowed: true,
      limit: null,
      remaining: null,
      reset_at: null,
    };
  }
}

/**
 * Record rate limit event
 */
export async function recordRateEvent(
  tenantId: string | null,
  scope: RateLimitScope,
  identifier: string,
  subject: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("record_rate_event", {
      p_tenant_id: tenantId,
      p_scope: scope,
      p_identifier: identifier,
      p_subject: subject,
      p_metadata: metadata || {},
    });

    if (error) {
      console.error("[RateLimit] Error recording rate event:", error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error("[RateLimit] Exception in recordRateEvent:", err);
    return null;
  }
}

/**
 * Check and record rate limit in one operation
 */
export async function checkAndRecordRateLimit(
  tenantId: string | null,
  scope: RateLimitScope,
  identifier: string,
  subject: string,
  metadata?: Record<string, any>
): Promise<RateLimitCheckResult> {
  const result = await checkRateLimit(tenantId, scope, identifier, subject);

  if (result.allowed) {
    await recordRateEvent(tenantId, scope, identifier, subject, metadata);
  }

  return result;
}

/**
 * List rate limit rules
 */
export async function listRateLimits(
  tenantId?: string,
  scope?: RateLimitScope,
  enabled?: boolean
): Promise<RateLimit[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    let query = supabaseAdmin.from("rate_limits").select("*").order("created_at", { ascending: false });

    if (tenantId !== undefined) {
      query = query.eq("tenant_id", tenantId);
    }

    if (scope) {
      query = query.eq("scope", scope);
    }

    if (enabled !== undefined) {
      query = query.eq("enabled", enabled);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[RateLimit] Error listing rate limits:", error);
      return [];
    }

    return (data || []) as RateLimit[];
  } catch (err) {
    console.error("[RateLimit] Exception in listRateLimits:", err);
    return [];
  }
}

/**
 * Create rate limit rule
 */
export async function createRateLimit(args: {
  tenantId?: string;
  scope: RateLimitScope;
  identifier: string;
  maxRequests: number;
  windowSize: number;
  windowType: RateLimitWindow;
  enabled?: boolean;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("rate_limits")
      .insert({
        tenant_id: args.tenantId || null,
        scope: args.scope,
        identifier: args.identifier,
        max_requests: args.maxRequests,
        window_size: args.windowSize,
        window_type: args.windowType,
        enabled: args.enabled !== undefined ? args.enabled : true,
        metadata: args.metadata || {},
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create rate limit: ${error.message}`);
    }

    return data.id;
  } catch (err) {
    throw err;
  }
}

/**
 * Update rate limit rule
 */
export async function updateRateLimit(
  limitId: string,
  updates: {
    maxRequests?: number;
    windowSize?: number;
    windowType?: RateLimitWindow;
    enabled?: boolean;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    const updateData: any = {};
    if (updates.maxRequests !== undefined) updateData.max_requests = updates.maxRequests;
    if (updates.windowSize !== undefined) updateData.window_size = updates.windowSize;
    if (updates.windowType !== undefined) updateData.window_type = updates.windowType;
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { error } = await supabaseAdmin.from("rate_limits").update(updateData).eq("id", limitId);

    if (error) {
      throw new Error(`Failed to update rate limit: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Delete rate limit rule
 */
export async function deleteRateLimit(limitId: string): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    const { error } = await supabaseAdmin.from("rate_limits").delete().eq("id", limitId);

    if (error) {
      throw new Error(`Failed to delete rate limit: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Get rate limit statistics
 */
export async function getRateLimitStatistics(tenantId: string | null): Promise<RateLimitStatistics> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_rate_limit_statistics", {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error("[RateLimit] Error getting statistics:", error);
      return {
        total_events: 0,
        unique_subjects: 0,
        by_identifier: [],
        recent_events: [],
      };
    }

    return data as RateLimitStatistics;
  } catch (err) {
    console.error("[RateLimit] Exception in getRateLimitStatistics:", err);
    return {
      total_events: 0,
      unique_subjects: 0,
      by_identifier: [],
      recent_events: [],
    };
  }
}

/**
 * List rate limit events
 */
export async function listRateLimitEvents(
  tenantId?: string,
  identifier?: string,
  subject?: string,
  limit: number = 100
): Promise<RateLimitEvent[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rateLimitService must only run on server");
    }

    let query = supabaseAdmin
      .from("rate_limit_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tenantId !== undefined) {
      query = query.eq("tenant_id", tenantId);
    }

    if (identifier) {
      query = query.eq("identifier", identifier);
    }

    if (subject) {
      query = query.eq("subject", subject);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[RateLimit] Error listing rate events:", error);
      return [];
    }

    return (data || []) as RateLimitEvent[];
  } catch (err) {
    console.error("[RateLimit] Exception in listRateLimitEvents:", err);
    return [];
  }
}
