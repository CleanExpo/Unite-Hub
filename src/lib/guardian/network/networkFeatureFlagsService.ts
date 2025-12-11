/**
 * Guardian X04: Network Feature Flags Service
 *
 * Manages tenant-scoped feature flags for X-series Network Intelligence
 * (X01–X03). All flags default to false (conservative, opt-in model).
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Tenant-scoped feature flags for Network Intelligence features.
 * All default to false (opt-in model).
 */
export interface GuardianNetworkFeatureFlags {
  enableNetworkTelemetry: boolean;
  enableNetworkBenchmarks: boolean;
  enableNetworkAnomalies: boolean;
  enableNetworkEarlyWarnings: boolean;
  enableAiHints: boolean;
  enableCohortMetadataSharing: boolean;
}

/**
 * Default flags (conservative, all disabled)
 */
const DEFAULT_FLAGS: GuardianNetworkFeatureFlags = {
  enableNetworkTelemetry: false,
  enableNetworkBenchmarks: false,
  enableNetworkAnomalies: false,
  enableNetworkEarlyWarnings: false,
  enableAiHints: false,
  enableCohortMetadataSharing: false,
};

/**
 * In-memory cache for feature flags (60s TTL)
 */
const flagsCache = new Map<string, { flags: GuardianNetworkFeatureFlags; timestamp: number }>();
const CACHE_TTL_MS = 60000;

/**
 * Get feature flags for a tenant from the database.
 * Falls back to defaults if no row exists.
 */
export async function getNetworkFeatureFlagsForTenant(
  tenantId: string
): Promise<GuardianNetworkFeatureFlags> {
  // Check cache
  const cached = flagsCache.get(tenantId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.flags;
  }

  const supabase = getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('guardian_network_feature_flags')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found; return defaults
        return DEFAULT_FLAGS;
      }
      throw error;
    }

    if (!data) {
      return DEFAULT_FLAGS;
    }

    const flags: GuardianNetworkFeatureFlags = {
      enableNetworkTelemetry: data.enable_network_telemetry ?? false,
      enableNetworkBenchmarks: data.enable_network_benchmarks ?? false,
      enableNetworkAnomalies: data.enable_network_anomalies ?? false,
      enableNetworkEarlyWarnings: data.enable_network_early_warnings ?? false,
      enableAiHints: data.enable_ai_hints ?? false,
      enableCohortMetadataSharing: data.enable_cohort_metadata_sharing ?? false,
    };

    // Cache the result
    flagsCache.set(tenantId, { flags, timestamp: Date.now() });

    return flags;
  } catch (error) {
    console.error(`Failed to fetch feature flags for tenant ${tenantId}:`, error);
    // On error, return safe defaults
    return DEFAULT_FLAGS;
  }
}

/**
 * Clear the cache for a specific tenant
 */
export function clearFeatureFlagsCache(tenantId: string): void {
  flagsCache.delete(tenantId);
}

/**
 * Update feature flags for a tenant and log the governance event.
 */
export async function upsertNetworkFeatureFlags(
  tenantId: string,
  patch: Partial<GuardianNetworkFeatureFlags>,
  actorId?: string
): Promise<GuardianNetworkFeatureFlags> {
  const supabase = getSupabaseServer();

  try {
    // Get current flags
    const current = await getNetworkFeatureFlagsForTenant(tenantId);

    // Merge patch
    const updated: GuardianNetworkFeatureFlags = { ...current, ...patch };

    // Prepare database payload
    const dbPayload = {
      tenant_id: tenantId,
      enable_network_telemetry: updated.enableNetworkTelemetry,
      enable_network_benchmarks: updated.enableNetworkBenchmarks,
      enable_network_anomalies: updated.enableNetworkAnomalies,
      enable_network_early_warnings: updated.enableNetworkEarlyWarnings,
      enable_ai_hints: updated.enableAiHints,
      enable_cohort_metadata_sharing: updated.enableCohortMetadataSharing,
      last_updated_at: new Date().toISOString(),
      last_updated_by: actorId || null,
    };

    // Upsert flags
    const { data, error } = await supabase
      .from('guardian_network_feature_flags')
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
    clearFeatureFlagsCache(tenantId);

    // Log governance event for each changed flag
    await logFlagsChangeEvents(tenantId, current, updated, actorId);

    return updated;
  } catch (error) {
    console.error(`Failed to upsert feature flags for tenant ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Log individual governance events for each flag that changed
 */
async function logFlagsChangeEvents(
  tenantId: string,
  previous: GuardianNetworkFeatureFlags,
  updated: GuardianNetworkFeatureFlags,
  actorId?: string
): Promise<void> {
  const supabase = getSupabaseServer();

  const flagMappings: Array<{
    flagKey: keyof GuardianNetworkFeatureFlags;
    context: string;
  }> = [
    { flagKey: 'enableNetworkTelemetry', context: 'network_telemetry' },
    { flagKey: 'enableNetworkBenchmarks', context: 'benchmarks' },
    { flagKey: 'enableNetworkAnomalies', context: 'anomalies' },
    { flagKey: 'enableNetworkEarlyWarnings', context: 'early_warnings' },
    { flagKey: 'enableAiHints', context: 'ai_hints' },
    { flagKey: 'enableCohortMetadataSharing', context: 'cohort_metadata' },
  ];

  const eventsToLog: Array<{
    tenant_id: string;
    actor_id: string | null;
    event_type: string;
    context: string;
    details: Record<string, unknown>;
  }> = [];

  for (const mapping of flagMappings) {
    const prevValue = previous[mapping.flagKey];
    const newValue = updated[mapping.flagKey];

    if (prevValue !== newValue) {
      eventsToLog.push({
        tenant_id: tenantId,
        actor_id: actorId || null,
        event_type: 'flags_changed',
        context: mapping.context,
        details: {
          previous_state: prevValue,
          new_state: newValue,
        },
      });
    }
  }

  if (eventsToLog.length > 0) {
    try {
      const { error } = await supabase
        .from('guardian_network_governance_events')
        .insert(eventsToLog);

      if (error) {
        console.error('Failed to log governance events:', error);
        // Don't throw; log failures should not block flag updates
      }
    } catch (error) {
      console.error('Error logging governance events:', error);
    }
  }
}
