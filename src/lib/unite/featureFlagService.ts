/**
 * Feature Flag Service
 * Phase: D69 - Experimentation & Feature Flag Engine
 *
 * Pure, side-effect-free feature flag evaluation.
 * No mutations during evaluation - read-only operations.
 */

import { supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface FeatureFlag {
  id: string;
  tenant_id?: string;
  flag_key: string;
  name: string;
  description?: string;
  flag_type: 'boolean' | 'string' | 'number' | 'json';
  default_value: unknown;
  override_rules?: Array<{
    user_id?: string;
    org_id?: string;
    value: unknown;
  }>;
  targeting_rules?: {
    percentage?: number;
    regions?: string[];
    user_attributes?: Record<string, unknown>;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface EvaluationContext {
  user_id?: string;
  org_id?: string;
  anonymous_id?: string;
  region?: string;
  attributes?: Record<string, unknown>;
}

// ============================================================================
// FLAG MANAGEMENT
// ============================================================================

export async function createFeatureFlag(
  input: Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at'>
): Promise<FeatureFlag> {
  const { data, error } = await supabaseAdmin
    .from('unite_feature_flags')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create feature flag: ${error.message}`);
  return data as FeatureFlag;
}

export async function listFeatureFlags(filters?: {
  tenant_id?: string;
  is_active?: boolean;
  limit?: number;
}): Promise<FeatureFlag[]> {
  let query = supabaseAdmin
    .from('unite_feature_flags')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list feature flags: ${error.message}`);
  return data as FeatureFlag[];
}

export async function getFeatureFlag(flagKey: string): Promise<FeatureFlag | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_feature_flags')
    .select('*')
    .eq('flag_key', flagKey)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get feature flag: ${error.message}`);
  }

  return data as FeatureFlag;
}

export async function updateFeatureFlag(
  flagKey: string,
  updates: Partial<Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at'>>
): Promise<FeatureFlag> {
  const { data, error } = await supabaseAdmin
    .from('unite_feature_flags')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('flag_key', flagKey)
    .select()
    .single();

  if (error) throw new Error(`Failed to update feature flag: ${error.message}`);
  return data as FeatureFlag;
}

export async function deleteFeatureFlag(flagKey: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('unite_feature_flags')
    .delete()
    .eq('flag_key', flagKey);

  if (error) throw new Error(`Failed to delete feature flag: ${error.message}`);
}

// ============================================================================
// PURE FLAG EVALUATION (no side effects)
// ============================================================================

export async function evaluateFlag(
  flagKey: string,
  context: EvaluationContext
): Promise<{
  value: unknown;
  reason: string;
}> {
  const flag = await getFeatureFlag(flagKey);

  // Flag not found - return default false for boolean, null for others
  if (!flag) {
    return {
      value: false,
      reason: 'flag_not_found',
    };
  }

  // Flag inactive - return default value
  if (!flag.is_active) {
    return {
      value: flag.default_value,
      reason: 'flag_inactive',
    };
  }

  // Check override rules (highest priority)
  if (flag.override_rules && flag.override_rules.length > 0) {
    for (const rule of flag.override_rules) {
      if (rule.user_id && rule.user_id === context.user_id) {
        return {
          value: rule.value,
          reason: 'user_override',
        };
      }
      if (rule.org_id && rule.org_id === context.org_id) {
        return {
          value: rule.value,
          reason: 'org_override',
        };
      }
    }
  }

  // Check targeting rules
  if (flag.targeting_rules) {
    const { percentage, regions, user_attributes } = flag.targeting_rules;

    // Region targeting
    if (regions && regions.length > 0 && context.region) {
      if (!regions.includes(context.region)) {
        return {
          value: flag.default_value,
          reason: 'region_mismatch',
        };
      }
    }

    // Attribute matching
    if (user_attributes && context.attributes) {
      const allMatch = Object.entries(user_attributes).every(
        ([key, value]) => context.attributes?.[key] === value
      );
      if (!allMatch) {
        return {
          value: flag.default_value,
          reason: 'attributes_mismatch',
        };
      }
    }

    // Percentage rollout (stable hash-based)
    if (percentage !== undefined && percentage < 100) {
      const userId = context.user_id || context.anonymous_id || 'unknown';
      const hashInput = `${flagKey}:${userId}`;
      const bucket = hashToBucket(hashInput, 100);

      if (bucket >= percentage) {
        return {
          value: flag.default_value,
          reason: 'not_in_rollout_percentage',
        };
      }
    }
  }

  // All rules passed - return enabled value
  return {
    value: flag.flag_type === 'boolean' ? true : flag.default_value,
    reason: 'targeting_match',
  };
}

// ============================================================================
// BATCH FLAG EVALUATION
// ============================================================================

export async function evaluateFlags(
  flagKeys: string[],
  context: EvaluationContext
): Promise<Record<string, { value: unknown; reason: string }>> {
  const results: Record<string, { value: unknown; reason: string }> = {};

  // Fetch all flags in one query
  const { data: flags } = await supabaseAdmin
    .from('unite_feature_flags')
    .select('*')
    .in('flag_key', flagKeys);

  const flagMap = new Map((flags || []).map((f) => [f.flag_key, f as FeatureFlag]));

  for (const flagKey of flagKeys) {
    const flag = flagMap.get(flagKey);

    if (!flag) {
      results[flagKey] = { value: false, reason: 'flag_not_found' };
      continue;
    }

    // Inline evaluation logic (same as evaluateFlag)
    if (!flag.is_active) {
      results[flagKey] = { value: flag.default_value, reason: 'flag_inactive' };
      continue;
    }

    // Override rules
    let overridden = false;
    if (flag.override_rules && flag.override_rules.length > 0) {
      for (const rule of flag.override_rules) {
        if (rule.user_id && rule.user_id === context.user_id) {
          results[flagKey] = { value: rule.value, reason: 'user_override' };
          overridden = true;
          break;
        }
        if (rule.org_id && rule.org_id === context.org_id) {
          results[flagKey] = { value: rule.value, reason: 'org_override' };
          overridden = true;
          break;
        }
      }
    }

    if (overridden) continue;

    // Targeting rules
    if (flag.targeting_rules) {
      const { percentage, regions, user_attributes } = flag.targeting_rules;

      if (regions && regions.length > 0 && context.region && !regions.includes(context.region)) {
        results[flagKey] = { value: flag.default_value, reason: 'region_mismatch' };
        continue;
      }

      if (user_attributes && context.attributes) {
        const allMatch = Object.entries(user_attributes).every(
          ([key, value]) => context.attributes?.[key] === value
        );
        if (!allMatch) {
          results[flagKey] = { value: flag.default_value, reason: 'attributes_mismatch' };
          continue;
        }
      }

      if (percentage !== undefined && percentage < 100) {
        const userId = context.user_id || context.anonymous_id || 'unknown';
        const hashInput = `${flagKey}:${userId}`;
        const bucket = hashToBucket(hashInput, 100);

        if (bucket >= percentage) {
          results[flagKey] = { value: flag.default_value, reason: 'not_in_rollout_percentage' };
          continue;
        }
      }
    }

    // All rules passed
    results[flagKey] = {
      value: flag.flag_type === 'boolean' ? true : flag.default_value,
      reason: 'targeting_match',
    };
  }

  return results;
}

// ============================================================================
// UTILITY: HASH TO BUCKET (stable assignment)
// ============================================================================

function hashToBucket(input: string, buckets: number): number {
  // Simple hash function for stable bucketing
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % buckets;
}
