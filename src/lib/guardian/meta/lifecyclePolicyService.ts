import { getSupabaseServer } from '@/lib/supabase';

/**
 * Z06 Lifecycle Policy Type
 * Defines how meta artefacts (Z01-Z05) should be retained, compacted, and deleted
 */
export interface GuardianLifecyclePolicy {
  policyKey: string; // 'readiness', 'edition_fit', 'uplift', 'executive_reports', 'adoption', 'coach_nudges'
  label: string;
  description: string;
  retentionDays: number;
  archiveEnabled: boolean;
  deleteEnabled: boolean;
  minKeepRows: number;
  compactionStrategy: 'none' | 'snapshot' | 'aggregate';
}

/**
 * Default lifecycle policies for Z-series meta artefacts
 * Conservative defaults: longer retention, archive before delete, safety minimums
 */
export const DEFAULT_LIFECYCLE_POLICIES: Record<string, Omit<GuardianLifecyclePolicy, 'policyKey'>> = {
  readiness: {
    label: 'Readiness Scoring (Z01)',
    description: 'Lifecycle policy for readiness scores and snapshots',
    retentionDays: 365, // Keep detailed readiness data for 1 year
    archiveEnabled: true,
    deleteEnabled: false, // Conservative: archive first, delete disabled by default
    minKeepRows: 100,
    compactionStrategy: 'snapshot',
  },
  edition_fit: {
    label: 'Edition Alignment (Z03)',
    description: 'Lifecycle policy for edition fit analysis and gaps',
    retentionDays: 730, // Keep for 2 years (compliance-sensitive)
    archiveEnabled: true,
    deleteEnabled: false,
    minKeepRows: 100,
    compactionStrategy: 'aggregate',
  },
  uplift: {
    label: 'Uplift Planning (Z02)',
    description: 'Lifecycle policy for uplift plans and tasks',
    retentionDays: 730, // Keep for 2 years (historical uplift plans are valuable)
    archiveEnabled: true,
    deleteEnabled: false,
    minKeepRows: 100,
    compactionStrategy: 'aggregate',
  },
  executive_reports: {
    label: 'Executive Reports (Z04)',
    description: 'Lifecycle policy for executive reports and narratives',
    retentionDays: 1460, // Keep for 4 years (compliance/audit trail)
    archiveEnabled: true,
    deleteEnabled: false,
    minKeepRows: 100,
    compactionStrategy: 'snapshot',
  },
  adoption: {
    label: 'Adoption Scoring (Z05)',
    description: 'Lifecycle policy for adoption scores and signals',
    retentionDays: 365, // Keep detailed adoption data for 1 year
    archiveEnabled: true,
    deleteEnabled: false,
    minKeepRows: 100,
    compactionStrategy: 'aggregate',
  },
  coach_nudges: {
    label: 'In-App Coach Nudges (Z05)',
    description: 'Lifecycle policy for in-app coaching nudges',
    retentionDays: 180, // Keep nudges for 6 months (less critical than scores)
    archiveEnabled: true,
    deleteEnabled: false, // Conservative: never auto-delete nudges
    minKeepRows: 50, // Keep at least 50 recent nudges
    compactionStrategy: 'aggregate',
  },
};

/**
 * Load lifecycle policies for a tenant
 * If no DB records exist, returns in-code defaults
 */
export async function loadLifecyclePoliciesForTenant(
  tenantId: string
): Promise<GuardianLifecyclePolicy[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_lifecycle_policies')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) {
    console.warn(`Failed to load lifecycle policies for tenant ${tenantId}:`, error);
    // Fall back to defaults
    return Object.entries(DEFAULT_LIFECYCLE_POLICIES).map(([key, policy]) => ({
      policyKey: key,
      ...policy,
    }));
  }

  // If we have DB records, use them; otherwise fill in defaults for missing keys
  const dbPolicies = new Map(data.map((p) => [p.policy_key, p]));
  const allKeys = new Set([
    ...dbPolicies.keys(),
    ...Object.keys(DEFAULT_LIFECYCLE_POLICIES),
  ]);

  const policies: GuardianLifecyclePolicy[] = [];

  allKeys.forEach((key) => {
    if (dbPolicies.has(key)) {
      const dbPolicy = dbPolicies.get(key)!;
      policies.push({
        policyKey: dbPolicy.policy_key,
        label: dbPolicy.label,
        description: dbPolicy.description,
        retentionDays: dbPolicy.retention_days,
        archiveEnabled: dbPolicy.archive_enabled,
        deleteEnabled: dbPolicy.delete_enabled,
        minKeepRows: dbPolicy.min_keep_rows,
        compactionStrategy: dbPolicy.compaction_strategy,
      });
    } else {
      const defaults = DEFAULT_LIFECYCLE_POLICIES[key];
      if (defaults) {
        policies.push({
          policyKey: key,
          ...defaults,
        });
      }
    }
  });

  return policies;
}

/**
 * Update a single lifecycle policy for a tenant
 * Enforces safety constraints (min retention_days, confirmation for aggressive changes)
 */
export async function updateLifecyclePolicies(
  tenantId: string,
  updates: Array<{
    policyKey: string;
    retentionDays?: number;
    archiveEnabled?: boolean;
    deleteEnabled?: boolean;
    minKeepRows?: number;
    compactionStrategy?: 'none' | 'snapshot' | 'aggregate';
  }>
): Promise<GuardianLifecyclePolicy[]> {
  const supabase = getSupabaseServer();

  // Load current policies to merge updates
  const currentPolicies = await loadLifecyclePoliciesForTenant(tenantId);
  const policyMap = new Map(currentPolicies.map((p) => [p.policyKey, p]));

  const toUpsert = updates.map((update) => {
    const current = policyMap.get(update.policyKey) || DEFAULT_LIFECYCLE_POLICIES[update.policyKey];
    if (!current) {
      throw new Error(`Unknown policy key: ${update.policyKey}`);
    }

    // Safety checks
    const newRetentionDays = update.retentionDays ?? current.retentionDays;
    if (newRetentionDays < 7) {
      throw new Error(`Retention days must be >= 7 days (got ${newRetentionDays})`);
    }

    // Warn if enabling delete without long retention
    if (update.deleteEnabled && !current.deleteEnabled && newRetentionDays < 90) {
      throw new Error(
        `Cannot enable deletion with retention < 90 days. Current: ${newRetentionDays}. Please increase retention first.`
      );
    }

    return {
      tenant_id: tenantId,
      policy_key: update.policyKey,
      label: current.label,
      description: current.description,
      retention_days: newRetentionDays,
      archive_enabled: update.archiveEnabled ?? current.archiveEnabled,
      delete_enabled: update.deleteEnabled ?? current.deleteEnabled,
      min_keep_rows: update.minKeepRows ?? current.minKeepRows,
      compaction_strategy: update.compactionStrategy ?? current.compactionStrategy,
    };
  });

  const { error } = await supabase
    .from('guardian_meta_lifecycle_policies')
    .upsert(toUpsert, { onConflict: 'tenant_id,policy_key' });

  if (error) {
    throw new Error(`Failed to update lifecycle policies: ${error.message}`);
  }

  // Return updated policies
  return loadLifecyclePoliciesForTenant(tenantId);
}

/**
 * Get a specific policy by key, filling in defaults if needed
 */
export async function getLifecyclePolicyForTenant(
  tenantId: string,
  policyKey: string
): Promise<GuardianLifecyclePolicy | null> {
  const policies = await loadLifecyclePoliciesForTenant(tenantId);
  return policies.find((p) => p.policyKey === policyKey) || null;
}
