/**
 * Guardian X05: Network Retention Policy Service
 *
 * Manages tenant-scoped retention policies for X-series data with privacy-friendly defaults.
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * X-series retention policy configuration (in days)
 */
export interface GuardianNetworkRetentionPolicy {
  telemetryRetentionDays: number;
  aggregatesRetentionDays: number;
  anomaliesRetentionDays: number;
  benchmarksRetentionDays: number;
  earlyWarningsRetentionDays: number;
  governanceRetentionDays: number;
}

/**
 * Privacy-friendly default retention periods
 */
const DEFAULT_RETENTION_POLICY: GuardianNetworkRetentionPolicy = {
  telemetryRetentionDays: 90, // 3 months - shorter for raw telemetry
  aggregatesRetentionDays: 365, // 1 year - longer for analytics
  anomaliesRetentionDays: 180, // 6 months
  benchmarksRetentionDays: 365, // 1 year
  earlyWarningsRetentionDays: 365, // 1 year
  governanceRetentionDays: 730, // 2 years - longer for audit trail
};

const MIN_RETENTION_DAYS = 30;
const MAX_RETENTION_DAYS = 3650;

/**
 * In-memory cache for retention policies (60s TTL)
 */
const policyCache = new Map<string, { policy: GuardianNetworkRetentionPolicy; timestamp: number }>();
const CACHE_TTL_MS = 60000;

/**
 * Get retention policy for a tenant
 */
export async function getRetentionPolicyForTenant(
  tenantId: string
): Promise<GuardianNetworkRetentionPolicy> {
  // Check cache
  const cached = policyCache.get(tenantId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.policy;
  }

  const supabase = getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('guardian_network_retention_policies')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found; return defaults
        return DEFAULT_RETENTION_POLICY;
      }
      throw error;
    }

    if (!data) {
      return DEFAULT_RETENTION_POLICY;
    }

    const policy: GuardianNetworkRetentionPolicy = {
      telemetryRetentionDays: data.telemetry_retention_days ?? 90,
      aggregatesRetentionDays: data.aggregates_retention_days ?? 365,
      anomaliesRetentionDays: data.anomalies_retention_days ?? 180,
      benchmarksRetentionDays: data.benchmarks_retention_days ?? 365,
      earlyWarningsRetentionDays: data.early_warnings_retention_days ?? 365,
      governanceRetentionDays: data.governance_retention_days ?? 730,
    };

    // Cache the result
    policyCache.set(tenantId, { policy, timestamp: Date.now() });

    return policy;
  } catch (error) {
    console.error(`Failed to fetch retention policy for tenant ${tenantId}:`, error);
    return DEFAULT_RETENTION_POLICY;
  }
}

/**
 * Clear the cache for a specific tenant
 */
export function clearRetentionPolicyCache(tenantId: string): void {
  policyCache.delete(tenantId);
}

/**
 * Validate retention days are within acceptable bounds
 */
function validateRetentionDays(days: number | undefined): number | undefined {
  if (days === undefined) {
    return undefined;
  }
  if (days < MIN_RETENTION_DAYS || days > MAX_RETENTION_DAYS) {
    throw new Error(
      `Retention days must be between ${MIN_RETENTION_DAYS} and ${MAX_RETENTION_DAYS}`
    );
  }
  return days;
}

/**
 * Update retention policy for a tenant
 */
export async function upsertRetentionPolicyForTenant(
  tenantId: string,
  patch: Partial<GuardianNetworkRetentionPolicy>,
  actorId?: string
): Promise<GuardianNetworkRetentionPolicy> {
  const supabase = getSupabaseServer();

  try {
    // Get current policy
    const current = await getRetentionPolicyForTenant(tenantId);

    // Validate patch values
    const validatedPatch: Partial<GuardianNetworkRetentionPolicy> = {};
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) {
        validatedPatch[key as keyof GuardianNetworkRetentionPolicy] = validateRetentionDays(
          value as number
        )!;
      }
    }

    // Merge patch
    const updated: GuardianNetworkRetentionPolicy = { ...current, ...validatedPatch };

    // Prepare database payload
    const dbPayload = {
      tenant_id: tenantId,
      telemetry_retention_days: updated.telemetryRetentionDays,
      aggregates_retention_days: updated.aggregatesRetentionDays,
      anomalies_retention_days: updated.anomaliesRetentionDays,
      benchmarks_retention_days: updated.benchmarksRetentionDays,
      early_warnings_retention_days: updated.earlyWarningsRetentionDays,
      governance_retention_days: updated.governanceRetentionDays,
      updated_at: new Date().toISOString(),
    };

    // Upsert policy
    const { data, error } = await supabase
      .from('guardian_network_retention_policies')
      .upsert(dbPayload, { onConflict: 'tenant_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Upsert returned no data');
    }

    // Clear cache for this tenant
    clearRetentionPolicyCache(tenantId);

    // Log governance event
    await logPolicyUpdateEvent(tenantId, current, updated, actorId);

    return updated;
  } catch (error) {
    console.error(`Failed to upsert retention policy for tenant ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Log a retention policy update event
 */
async function logPolicyUpdateEvent(
  tenantId: string,
  previous: GuardianNetworkRetentionPolicy,
  updated: GuardianNetworkRetentionPolicy,
  actorId?: string
): Promise<void> {
  const supabase = getSupabaseServer();

  try {
    const changes: string[] = [];

    const keys: Array<keyof GuardianNetworkRetentionPolicy> = [
      'telemetryRetentionDays',
      'aggregatesRetentionDays',
      'anomaliesRetentionDays',
      'benchmarksRetentionDays',
      'earlyWarningsRetentionDays',
      'governanceRetentionDays',
    ];

    for (const key of keys) {
      if (previous[key] !== updated[key]) {
        changes.push(`${key}: ${previous[key]} → ${updated[key]}`);
      }
    }

    if (changes.length === 0) {
      return; // No changes
    }

    const { error } = await supabase
      .from('guardian_network_lifecycle_audit')
      .insert({
        scope: 'policy',
        action: 'policy_update',
        tenant_id: tenantId,
        items_affected: 0,
        detail: `Retention policy updated: ${changes.join('; ')}`,
        metadata: {
          actor_id: actorId || null,
          previous,
          updated,
        },
      });

    if (error) {
      console.error('Failed to log retention policy update:', error);
    }
  } catch (error) {
    console.error('Error logging retention policy update:', error);
  }
}
