/**
 * Guardian I10: QA Feature Flags Service
 *
 * Tenant-scoped control of Guardian QA/Chaos features.
 * Defaults to safe, non-disruptive stance (simulation-only by default).
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface GuardianQaFeatureFlags {
  enableSimulation: boolean;
  enableRegression: boolean;
  enableChaos: boolean;
  enableGatekeeper: boolean;
  enableTraining: boolean;
  enablePerformance: boolean;
  enableCoverage: boolean;
  enableDriftMonitor: boolean;
  enableAiScoring: boolean;
}

// In-memory cache: { tenantId: { flags, timestamp } }
const flagsCache = new Map<string, { flags: GuardianQaFeatureFlags; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

const DEFAULT_FLAGS: GuardianQaFeatureFlags = {
  enableSimulation: true,
  enableRegression: true,
  enableChaos: false,
  enableGatekeeper: false,
  enableTraining: false,
  enablePerformance: false,
  enableCoverage: true,
  enableDriftMonitor: true,
  enableAiScoring: false,
};

/**
 * Get QA feature flags for a tenant, with in-memory caching
 */
export async function getQaFeatureFlagsForTenant(tenantId: string): Promise<GuardianQaFeatureFlags> {
  const cached = flagsCache.get(tenantId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.flags;
  }

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_qa_feature_flags')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  let flags = DEFAULT_FLAGS;

  if (data) {
    flags = {
      enableSimulation: data.enable_simulation,
      enableRegression: data.enable_regression,
      enableChaos: data.enable_chaos,
      enableGatekeeper: data.enable_gatekeeper,
      enableTraining: data.enable_training,
      enablePerformance: data.enable_performance,
      enableCoverage: data.enable_coverage,
      enableDriftMonitor: data.enable_drift_monitor,
      enableAiScoring: data.enable_ai_scoring,
    };
  } else if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows, which is expected for new tenants
    throw new Error(`Failed to fetch QA feature flags: ${error.message}`);
  }

  flagsCache.set(tenantId, { flags, timestamp: Date.now() });
  return flags;
}

/**
 * Update QA feature flags for a tenant
 */
export async function upsertQaFeatureFlags(
  tenantId: string,
  patch: Partial<GuardianQaFeatureFlags>,
  actorId?: string
): Promise<GuardianQaFeatureFlags> {
  const supabase = getSupabaseServer();

  // Get current flags to merge
  const current = await getQaFeatureFlagsForTenant(tenantId);
  const merged = { ...current, ...patch };

  const { data, error } = await supabase
    .from('guardian_qa_feature_flags')
    .upsert(
      {
        tenant_id: tenantId,
        enable_simulation: merged.enableSimulation,
        enable_regression: merged.enableRegression,
        enable_chaos: merged.enableChaos,
        enable_gatekeeper: merged.enableGatekeeper,
        enable_training: merged.enableTraining,
        enable_performance: merged.enablePerformance,
        enable_coverage: merged.enableCoverage,
        enable_drift_monitor: merged.enableDriftMonitor,
        enable_ai_scoring: merged.enableAiScoring,
        last_updated_at: new Date(),
        last_updated_by: actorId || null,
      },
      { onConflict: 'tenant_id' }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert QA feature flags: ${error?.message || 'Unknown error'}`);
  }

  // Invalidate cache
  flagsCache.delete(tenantId);

  // Return the updated flags
  return {
    enableSimulation: data.enable_simulation,
    enableRegression: data.enable_regression,
    enableChaos: data.enable_chaos,
    enableGatekeeper: data.enable_gatekeeper,
    enableTraining: data.enable_training,
    enablePerformance: data.enable_performance,
    enableCoverage: data.enable_coverage,
    enableDriftMonitor: data.enable_drift_monitor,
    enableAiScoring: data.enable_ai_scoring,
  };
}

/**
 * Clear cache for testing/admin purposes
 */
export function clearQaFlagsCacheForTenant(tenantId: string): void {
  flagsCache.delete(tenantId);
}
