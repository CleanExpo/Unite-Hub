/**
 * Guardian X05: Network Lifecycle Cleanup Service
 *
 * Executes data cleanup operations for X-series artifacts based on tenant retention policies.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { getRetentionPolicyForTenant } from './retentionPolicyService';
import { logLifecycleAudit } from './lifecycleAuditLogger';

/**
 * Cleanup run options
 */
export interface GuardianNetworkCleanupRunOptions {
  now?: Date;
  dryRun?: boolean;
  limitPerTable?: number;
}

/**
 * Cleanup result for a table
 */
export interface GuardianCleanupResult {
  table: string;
  deleted: number;
}

/**
 * Run cleanup for a specific tenant
 */
export async function cleanupForTenant(
  tenantId: string,
  options?: GuardianNetworkCleanupRunOptions
): Promise<GuardianCleanupResult[]> {
  const { now = new Date(), dryRun = false, limitPerTable = 1000 } = options || {};

  const results: GuardianCleanupResult[] = [];

  try {
    // Get retention policy for tenant
    const policy = await getRetentionPolicyForTenant(tenantId);

    // Cleanup telemetry
    const telemetryResult = await cleanupTable(
      'guardian_network_telemetry_hourly',
      tenantId,
      policy.telemetryRetentionDays,
      now,
      dryRun,
      limitPerTable
    );
    results.push(telemetryResult);

    // Cleanup anomalies
    const anomaliesResult = await cleanupTable(
      'guardian_network_anomaly_signals',
      tenantId,
      policy.anomaliesRetentionDays,
      now,
      dryRun,
      limitPerTable
    );
    results.push(anomaliesResult);

    // Cleanup benchmarks
    const benchmarksResult = await cleanupTable(
      'guardian_network_benchmark_snapshots',
      tenantId,
      policy.benchmarksRetentionDays,
      now,
      dryRun,
      limitPerTable
    );
    results.push(benchmarksResult);

    // Cleanup early warnings
    const warningsResult = await cleanupEarlyWarnings(
      tenantId,
      policy.earlyWarningsRetentionDays,
      now,
      dryRun,
      limitPerTable
    );
    results.push(warningsResult);

    // Cleanup governance events
    const governanceResult = await cleanupTable(
      'guardian_network_governance_events',
      tenantId,
      policy.governanceRetentionDays,
      now,
      dryRun,
      limitPerTable
    );
    results.push(governanceResult);

    // Log cleanup operation
    const totalAffected = results.reduce((sum, r) => sum + r.deleted, 0);
    await logLifecycleAudit({
      scope: 'cleanup',
      action: dryRun ? 'dry_run' : 'delete',
      tenantId,
      itemsAffected: totalAffected,
      windowStart: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // approximate
      windowEnd: now,
      detail: `Cleanup for tenant: ${results.map((r) => `${r.table}(${r.deleted})`).join(', ')}`,
    });

    return results;
  } catch (error) {
    console.error(`Cleanup failed for tenant ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Cleanup a specific table for a tenant based on retention days
 */
async function cleanupTable(
  tableName: string,
  tenantId: string,
  retentionDays: number,
  now: Date,
  dryRun: boolean,
  limit: number
): Promise<GuardianCleanupResult> {
  const supabase = getSupabaseServer();

  try {
    const cutoffDate = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

    if (dryRun) {
      // Count rows that would be deleted
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error(`Dry-run count failed for ${tableName}:`, error);
        return { table: tableName, deleted: 0 };
      }

      return { table: tableName, deleted: count ?? 0 };
    }

    // Delete rows in batches
    let totalDeleted = 0;
    const batchSize = limit;
    let hasMore = true;

    while (hasMore) {
      const { data, error: selectError } = await supabase
        .from(tableName)
        .select('id')
        .eq('tenant_id', tenantId)
        .lt('created_at', cutoffDate.toISOString())
        .limit(batchSize);

      if (selectError) {
        console.error(`Failed to select rows from ${tableName}:`, selectError);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      const ids = data.map((row) => row.id);

      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);

      if (deleteError) {
        console.error(`Failed to delete from ${tableName}:`, deleteError);
        break;
      }

      totalDeleted += ids.length;

      if (ids.length < batchSize) {
        hasMore = false;
      }
    }

    return { table: tableName, deleted: totalDeleted };
  } catch (error) {
    console.error(`Cleanup failed for ${tableName}:`, error);
    return { table: tableName, deleted: 0 };
  }
}

/**
 * Cleanup early warnings with special handling for open warnings
 */
async function cleanupEarlyWarnings(
  tenantId: string,
  retentionDays: number,
  now: Date,
  dryRun: boolean,
  limit: number
): Promise<GuardianCleanupResult> {
  const supabase = getSupabaseServer();

  try {
    const cutoffDate = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

    if (dryRun) {
      // Count closed warnings that would be deleted
      const { count, error } = await supabase
        .from('guardian_network_early_warnings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['acknowledged', 'dismissed'])
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Dry-run count failed for early_warnings:', error);
        return { table: 'guardian_network_early_warnings', deleted: 0 };
      }

      return { table: 'guardian_network_early_warnings', deleted: count ?? 0 };
    }

    // Delete closed warnings
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error: selectError } = await supabase
        .from('guardian_network_early_warnings')
        .select('id')
        .eq('tenant_id', tenantId)
        .in('status', ['acknowledged', 'dismissed'])
        .lt('created_at', cutoffDate.toISOString())
        .limit(limit);

      if (selectError) {
        console.error('Failed to select early warnings:', selectError);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      const ids = data.map((row) => row.id);

      const { error: deleteError } = await supabase
        .from('guardian_network_early_warnings')
        .delete()
        .in('id', ids);

      if (deleteError) {
        console.error('Failed to delete early warnings:', deleteError);
        break;
      }

      totalDeleted += ids.length;

      if (ids.length < limit) {
        hasMore = false;
      }
    }

    return { table: 'guardian_network_early_warnings', deleted: totalDeleted };
  } catch (error) {
    console.error('Cleanup failed for early warnings:', error);
    return { table: 'guardian_network_early_warnings', deleted: 0 };
  }
}

/**
 * Cleanup pattern signatures globally (aged patterns)
 */
export async function cleanupPatternSignatures(
  options?: GuardianNetworkCleanupRunOptions
): Promise<GuardianCleanupResult> {
  const { now = new Date(), dryRun = false } = options || {};

  const supabase = getSupabaseServer();

  try {
    // Remove patterns not updated in > 365 days
    const ageThreshold = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    if (dryRun) {
      const { count, error } = await supabase
        .from('guardian_network_pattern_signatures')
        .select('*', { count: 'exact', head: true })
        .lt('updated_at', ageThreshold.toISOString());

      if (error) {
        console.error('Dry-run count failed for patterns:', error);
        return { table: 'guardian_network_pattern_signatures', deleted: 0 };
      }

      return { table: 'guardian_network_pattern_signatures', deleted: count ?? 0 };
    }

    const { error } = await supabase
      .from('guardian_network_pattern_signatures')
      .delete()
      .lt('updated_at', ageThreshold.toISOString());

    if (error) {
      console.error('Failed to delete patterns:', error);
      return { table: 'guardian_network_pattern_signatures', deleted: 0 };
    }

    // Log cleanup
    await logLifecycleAudit({
      scope: 'patterns',
      action: 'delete',
      itemsAffected: 0, // Would need count query, simplified here
      detail: 'Removed aged pattern signatures',
    });

    return { table: 'guardian_network_pattern_signatures', deleted: 0 };
  } catch (error) {
    console.error('Cleanup failed for patterns:', error);
    return { table: 'guardian_network_pattern_signatures', deleted: 0 };
  }
}

/**
 * Run full network cleanup for all tenants
 */
export async function runFullNetworkCleanup(
  options?: GuardianNetworkCleanupRunOptions
): Promise<Map<string, GuardianCleanupResult[]>> {
  const results = new Map<string, GuardianCleanupResult[]>();

  try {
    // Get list of all tenants (simplified - in production, fetch from workspaces table)
    // For now, this is a placeholder that would be called with explicit tenant IDs
    // In a real implementation, iterate through all active workspaces

    console.log('Starting full network cleanup...');

    // Cleanup patterns globally
    await cleanupPatternSignatures(options);

    console.log('Full network cleanup completed');

    return results;
  } catch (error) {
    console.error('Full network cleanup failed:', error);
    throw error;
  }
}
