/**
 * Feature Flag Service (Phase E12)
 *
 * Progressive feature delivery with audience targeting and A/B testing
 * In-memory caching with TTL for performance
 *
 * @module featureFlagService
 */

import { supabaseAdmin } from "@/lib/supabase";

export interface FlagContext {
  tenantId?: string;
  userId?: string;
  roles?: string[];
  plan?: string;
  country?: string;
  [key: string]: any;
}

export interface FlagEvaluation {
  enabled: boolean;
  variant: string;
  config?: Record<string, any>;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  default_variant: string;
  rollout_percentage: number;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlagSummary {
  key: string;
  name: string;
  enabled: boolean;
  variant: string;
  rollout_percentage: number;
}

// In-memory cache
interface CacheEntry {
  data: FlagEvaluation;
  timestamp: number;
}

const flagCache = new Map<string, CacheEntry>();
const FLAG_CACHE_TTL = 60000; // 60 seconds

/**
 * Check if feature flag is enabled for context
 *
 * @param flagKey - Feature flag key
 * @param context - Evaluation context (tenant, user, etc.)
 * @returns True if enabled
 */
export async function isEnabled(flagKey: string, context: FlagContext = {}): Promise<boolean> {
  const evaluation = await getVariant(flagKey, context);
  return evaluation.enabled;
}

/**
 * Get feature flag variant for context
 *
 * @param flagKey - Feature flag key
 * @param context - Evaluation context
 * @returns Flag evaluation (enabled, variant, config)
 */
export async function getVariant(
  flagKey: string,
  context: FlagContext = {}
): Promise<FlagEvaluation> {
  try {
    // Check cache
    const cacheKey = `${flagKey}:${context.tenantId || ""}:${context.userId || ""}`;
    const cached = flagCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < FLAG_CACHE_TTL) {
      return cached.data;
    }

    // Server-side only
    if (typeof window !== "undefined") {
      return { enabled: false, variant: "control" };
    }

    // Evaluate flag
    const { data, error } = await supabaseAdmin.rpc("evaluate_feature_flag", {
      p_flag_key: flagKey,
      p_tenant_id: context.tenantId || null,
      p_user_id: context.userId || null,
      p_context: context || {},
    });

    if (error) {
      console.error("[FeatureFlags] Error evaluating flag:", error);
      return { enabled: false, variant: "control" };
    }

    const evaluation: FlagEvaluation = data as FlagEvaluation;

    // Cache result
    flagCache.set(cacheKey, {
      data: evaluation,
      timestamp: Date.now(),
    });

    return evaluation;
  } catch (err) {
    console.error("[FeatureFlags] Exception in getVariant:", err);
    return { enabled: false, variant: "control" };
  }
}

/**
 * List all feature flags for a tenant
 *
 * @param tenantId - Tenant UUID
 * @returns Array of flag summaries
 */
export async function listFlagsForTenant(tenantId?: string): Promise<FlagSummary[]> {
  try {
    if (typeof window !== "undefined") return [];

    const { data: flags, error } = await supabaseAdmin
      .from("feature_flags")
      .select("*")
      .order("name");

    if (error) {
      console.error("[FeatureFlags] Error listing flags:", error);
      return [];
    }

    // Evaluate each flag for tenant
    const summaries: FlagSummary[] = [];

    for (const flag of flags || []) {
      const evaluation = await getVariant(flag.key, { tenantId });

      summaries.push({
        key: flag.key,
        name: flag.name,
        enabled: evaluation.enabled,
        variant: evaluation.variant,
        rollout_percentage: flag.rollout_percentage,
      });
    }

    return summaries;
  } catch (err) {
    console.error("[FeatureFlags] Exception in listFlagsForTenant:", err);
    return [];
  }
}

/**
 * Get all feature flags (admin only)
 *
 * @returns Array of feature flags
 */
export async function listAllFlags(): Promise<FeatureFlag[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("feature_flags")
      .select("*")
      .order("name");

    if (error) {
      console.error("[FeatureFlags] Error listing all flags:", error);
      return [];
    }

    return (data || []) as FeatureFlag[];
  } catch (err) {
    console.error("[FeatureFlags] Exception in listAllFlags:", err);
    return [];
  }
}

/**
 * Create or update feature flag (admin only)
 *
 * @param flagData - Flag data
 * @returns Flag ID
 */
export async function upsertFlag(flagData: {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  default_variant?: string;
  rollout_percentage?: number;
  is_global?: boolean;
}): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("feature_flags")
      .upsert(
        {
          key: flagData.key,
          name: flagData.name,
          description: flagData.description || null,
          enabled: flagData.enabled !== undefined ? flagData.enabled : false,
          default_variant: flagData.default_variant || "control",
          rollout_percentage: flagData.rollout_percentage || 0,
          is_global: flagData.is_global !== undefined ? flagData.is_global : true,
        },
        { onConflict: "key" }
      )
      .select("id")
      .single();

    if (error) {
      console.error("[FeatureFlags] Error upserting flag:", error);
      return null;
    }

    // Clear cache
    clearCache();

    return data.id;
  } catch (err) {
    console.error("[FeatureFlags] Exception in upsertFlag:", err);
    return null;
  }
}

/**
 * Add variant to feature flag
 *
 * @param flagId - Flag UUID
 * @param variantData - Variant data
 * @returns Variant ID
 */
export async function addVariant(
  flagId: string,
  variantData: {
    name: string;
    rollout_percentage?: number;
    config?: Record<string, any>;
    description?: string;
  }
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("feature_variants")
      .upsert(
        {
          flag_id: flagId,
          name: variantData.name,
          rollout_percentage: variantData.rollout_percentage || 0,
          config: variantData.config || {},
          description: variantData.description || null,
        },
        { onConflict: "flag_id,name" }
      )
      .select("id")
      .single();

    if (error) {
      console.error("[FeatureFlags] Error adding variant:", error);
      return null;
    }

    clearCache();

    return data.id;
  } catch (err) {
    console.error("[FeatureFlags] Exception in addVariant:", err);
    return null;
  }
}

/**
 * Add audience targeting to feature flag
 *
 * @param flagId - Flag UUID
 * @param audienceData - Audience targeting data
 * @returns Audience ID
 */
export async function addAudience(
  flagId: string,
  audienceData: {
    tenant_id?: string;
    conditions?: Record<string, any>;
    override_variant?: string;
    enabled?: boolean;
  }
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("feature_audiences")
      .insert({
        flag_id: flagId,
        tenant_id: audienceData.tenant_id || null,
        conditions: audienceData.conditions || {},
        override_variant: audienceData.override_variant || null,
        enabled: audienceData.enabled !== undefined ? audienceData.enabled : true,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[FeatureFlags] Error adding audience:", error);
      return null;
    }

    clearCache();

    return data.id;
  } catch (err) {
    console.error("[FeatureFlags] Exception in addAudience:", err);
    return null;
  }
}

/**
 * Clear flag cache
 */
export function clearCache(): void {
  flagCache.clear();
}

/**
 * Get cache size (for monitoring)
 */
export function getCacheSize(): number {
  return flagCache.size;
}
