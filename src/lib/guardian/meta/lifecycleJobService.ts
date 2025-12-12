import { getSupabaseServer } from '@/lib/supabase';
import {
  loadLifecyclePoliciesForTenant,
  GuardianLifecyclePolicy,
} from '@/lib/guardian/meta/lifecyclePolicyService';

/**
 * Z06 Lifecycle Job Context
 * Encapsulates tenant and timing information for lifecycle operations
 */
export interface GuardianLifecycleJobContext {
  tenantId: string;
  now: Date;
}

/**
 * Lifecycle Operation Summary
 * Reports on what was done during a lifecycle run
 */
export interface GuardianLifecycleOperationSummary {
  policyKey: string;
  compactedRows: number;
  deletedRows: number;
  retainedRows: number;
  oldestAffectedDate?: Date;
  newestAffectedDate?: Date;
  status: 'success' | 'skipped' | 'error';
  reason?: string;
}

/**
 * Apply readiness lifecycle
 * Compact guardian_tenant_readiness_scores into guardian_readiness_snapshots_compact
 */
export async function applyReadinessLifecycle(
  ctx: GuardianLifecycleJobContext,
  policy: GuardianLifecyclePolicy
): Promise<GuardianLifecycleOperationSummary> {
  const supabase = getSupabaseServer();

  try {
    if (policy.compactionStrategy === 'none') {
      return {
        policyKey: 'readiness',
        compactedRows: 0,
        deletedRows: 0,
        retainedRows: 0,
        status: 'skipped',
        reason: 'Compaction strategy is none',
      };
    }

    // Get oldest row eligible for compaction (beyond retention window)
    const cutoffDate = new Date(ctx.now.getTime() - policy.retentionDays * 86400000);

    // Count current rows before compaction
    const { count: countBefore } = await supabase
      .from('guardian_tenant_readiness_scores')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', ctx.tenantId);

    // Compact: aggregate readiness scores by week
    const { data: toCompact } = await supabase
      .from('guardian_tenant_readiness_scores')
      .select('*')
      .eq('tenant_id', ctx.tenantId)
      .lt('computed_at', cutoffDate.toISOString())
      .order('computed_at', { ascending: true });

    if (!toCompact || toCompact.length === 0) {
      return {
        policyKey: 'readiness',
        compactedRows: 0,
        deletedRows: 0,
        retainedRows: countBefore || 0,
        status: 'skipped',
        reason: 'No rows eligible for compaction',
      };
    }

    // Aggregate by week
    const weeklyAggregates = new Map<string, { scores: number[]; week: string }>();
    toCompact.forEach((row) => {
      const date = new Date(row.computed_at);
      const week = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
        .toISOString()
        .split('T')[0];

      if (!weeklyAggregates.has(week)) {
        weeklyAggregates.set(week, { scores: [], week });
      }
      weeklyAggregates.get(week)!.scores.push(row.overall_score);
    });

    // Insert compact records
    const compactRecords = Array.from(weeklyAggregates.entries()).map(([week, data]) => {
      const scores = data.scores;
      return {
        tenant_id: ctx.tenantId,
        period_start: new Date(week),
        period_end: new Date(new Date(week).getTime() + 6 * 86400000), // End of week
        overall_score_avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        overall_score_min: Math.min(...scores),
        overall_score_max: Math.max(...scores),
        capabilities_summary: {}, // Simplified for readiness
      };
    });

    const { error: insertError } = await supabase
      .from('guardian_readiness_snapshots_compact')
      .insert(compactRecords);

    if (insertError) {
      throw insertError;
    }

    // Delete if enabled (with safety checks)
    let deletedRows = 0;
    if (policy.deleteEnabled) {
      const { count: countAfter } = await supabase
        .from('guardian_tenant_readiness_scores')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', ctx.tenantId);

      const safeToDelete = (countAfter || 0) - policy.minKeepRows;
      if (safeToDelete > 0) {
        // Delete oldest rows up to safe limit
        const rowsToDelete = toCompact.slice(0, safeToDelete);
        const ids = rowsToDelete.map((r) => r.id);

        const { error: deleteError } = await supabase
          .from('guardian_tenant_readiness_scores')
          .delete()
          .in('id', ids);

        if (!deleteError) {
          deletedRows = ids.length;
        }
      }
    }

    return {
      policyKey: 'readiness',
      compactedRows: compactRecords.length,
      deletedRows,
      retainedRows: (countBefore || 0) - deletedRows,
      oldestAffectedDate: toCompact[0]?.computed_at,
      newestAffectedDate: toCompact[toCompact.length - 1]?.computed_at,
      status: 'success',
    };
  } catch (error) {
    console.error('Readiness lifecycle error:', error);
    return {
      policyKey: 'readiness',
      compactedRows: 0,
      deletedRows: 0,
      retainedRows: 0,
      status: 'error',
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply adoption lifecycle
 * Compact guardian_adoption_scores into guardian_adoption_scores_compact
 */
export async function applyAdoptionLifecycle(
  ctx: GuardianLifecycleJobContext,
  policy: GuardianLifecyclePolicy
): Promise<GuardianLifecycleOperationSummary> {
  const supabase = getSupabaseServer();

  try {
    if (policy.compactionStrategy === 'none') {
      return {
        policyKey: 'adoption',
        compactedRows: 0,
        deletedRows: 0,
        retainedRows: 0,
        status: 'skipped',
        reason: 'Compaction strategy is none',
      };
    }

    const cutoffDate = new Date(ctx.now.getTime() - policy.retentionDays * 86400000);

    const { count: countBefore } = await supabase
      .from('guardian_adoption_scores')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', ctx.tenantId);

    // Get scores to compact
    const { data: toCompact } = await supabase
      .from('guardian_adoption_scores')
      .select('*')
      .eq('tenant_id', ctx.tenantId)
      .lt('computed_at', cutoffDate.toISOString())
      .order('computed_at', { ascending: true });

    if (!toCompact || toCompact.length === 0) {
      return {
        policyKey: 'adoption',
        compactedRows: 0,
        deletedRows: 0,
        retainedRows: countBefore || 0,
        status: 'skipped',
        reason: 'No rows eligible for compaction',
      };
    }

    // Aggregate by dimension/subdimension/week
    const weeklyAggregates = new Map<
      string,
      { scores: number[]; statuses: string[]; week: string }
    >();

    toCompact.forEach((row) => {
      const date = new Date(row.computed_at);
      const week = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
        .toISOString()
        .split('T')[0];
      const key = `${row.dimension}|${row.sub_dimension}|${week}`;

      if (!weeklyAggregates.has(key)) {
        weeklyAggregates.set(key, { scores: [], statuses: [], week });
      }
      const agg = weeklyAggregates.get(key)!;
      agg.scores.push(row.score);
      agg.statuses.push(row.status);
    });

    // Insert compact records
    const compactRecords = Array.from(weeklyAggregates.entries()).map(([key, data]) => {
      const [dimension, subDimension, week] = key.split('|');
      const scores = data.scores;
      const statuses = data.statuses;

      // Calculate mode (most common status)
      const statusCounts = new Map<string, number>();
      statuses.forEach((s) => {
        statusCounts.set(s, (statusCounts.get(s) || 0) + 1);
      });
      const statusMode = Array.from(statusCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];

      return {
        tenant_id: ctx.tenantId,
        period_start: new Date(week),
        period_end: new Date(new Date(week).getTime() + 6 * 86400000),
        dimension,
        sub_dimension: subDimension,
        score_avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        score_min: Math.min(...scores),
        score_max: Math.max(...scores),
        status_mode: statusMode,
      };
    });

    const { error: insertError } = await supabase
      .from('guardian_adoption_scores_compact')
      .insert(compactRecords);

    if (insertError) {
      throw insertError;
    }

    // Delete if enabled
    let deletedRows = 0;
    if (policy.deleteEnabled) {
      const { count: countAfter } = await supabase
        .from('guardian_adoption_scores')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', ctx.tenantId);

      const safeToDelete = (countAfter || 0) - policy.minKeepRows;
      if (safeToDelete > 0) {
        const rowsToDelete = toCompact.slice(0, safeToDelete);
        const ids = rowsToDelete.map((r) => r.id);

        const { error: deleteError } = await supabase
          .from('guardian_adoption_scores')
          .delete()
          .in('id', ids);

        if (!deleteError) {
          deletedRows = ids.length;
        }
      }
    }

    return {
      policyKey: 'adoption',
      compactedRows: compactRecords.length,
      deletedRows,
      retainedRows: (countBefore || 0) - deletedRows,
      oldestAffectedDate: toCompact[0]?.computed_at,
      newestAffectedDate: toCompact[toCompact.length - 1]?.computed_at,
      status: 'success',
    };
  } catch (error) {
    console.error('Adoption lifecycle error:', error);
    return {
      policyKey: 'adoption',
      compactedRows: 0,
      deletedRows: 0,
      retainedRows: 0,
      status: 'error',
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply coach nudges lifecycle
 * Compact guardian_inapp_coach_nudges into guardian_coach_nudges_compact
 * Keeps recent/pending nudges, archives shown/dismissed/completed
 */
export async function applyCoachLifecycle(
  ctx: GuardianLifecycleJobContext,
  policy: GuardianLifecyclePolicy
): Promise<GuardianLifecycleOperationSummary> {
  const supabase = getSupabaseServer();

  try {
    if (policy.compactionStrategy === 'none') {
      return {
        policyKey: 'coach_nudges',
        compactedRows: 0,
        deletedRows: 0,
        retainedRows: 0,
        status: 'skipped',
        reason: 'Compaction strategy is none',
      };
    }

    const cutoffDate = new Date(ctx.now.getTime() - policy.retentionDays * 86400000);

    const { count: countBefore } = await supabase
      .from('guardian_inapp_coach_nudges')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', ctx.tenantId);

    // Get nudges to compact (shown/dismissed/completed beyond retention)
    const { data: toCompact } = await supabase
      .from('guardian_inapp_coach_nudges')
      .select('*')
      .eq('tenant_id', ctx.tenantId)
      .in('status', ['shown', 'dismissed', 'completed'])
      .lt('updated_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true });

    if (!toCompact || toCompact.length === 0) {
      return {
        policyKey: 'coach_nudges',
        compactedRows: 0,
        deletedRows: 0,
        retainedRows: countBefore || 0,
        status: 'skipped',
        reason: 'No nudges eligible for compaction',
      };
    }

    // Aggregate by nudge_key/week
    const weeklyAggregates = new Map<
      string,
      { shown: number; dismissed: number; completed: number; week: string }
    >();

    toCompact.forEach((nudge) => {
      const date = new Date(nudge.created_at);
      const week = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
        .toISOString()
        .split('T')[0];
      const key = `${nudge.nudge_key}|${week}`;

      if (!weeklyAggregates.has(key)) {
        weeklyAggregates.set(key, { shown: 0, dismissed: 0, completed: 0, week });
      }
      const agg = weeklyAggregates.get(key)!;

      if (nudge.status === 'shown') agg.shown++;
      else if (nudge.status === 'dismissed') agg.dismissed++;
      else if (nudge.status === 'completed') agg.completed++;
    });

    // Insert compact records
    const compactRecords = Array.from(weeklyAggregates.entries()).map(([key, data]) => {
      const [nudgeKey, week] = key.split('|');

      return {
        tenant_id: ctx.tenantId,
        period_start: new Date(week),
        period_end: new Date(new Date(week).getTime() + 6 * 86400000),
        nudge_key: nudgeKey,
        shown_count: data.shown,
        dismissed_count: data.dismissed,
        completed_count: data.completed,
      };
    });

    const { error: insertError } = await supabase
      .from('guardian_coach_nudges_compact')
      .insert(compactRecords);

    if (insertError) {
      throw insertError;
    }

    // Delete if enabled (never delete pending/shown active nudges)
    let deletedRows = 0;
    if (policy.deleteEnabled) {
      const { count: countAfter } = await supabase
        .from('guardian_inapp_coach_nudges')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', ctx.tenantId)
        .in('status', ['shown', 'dismissed', 'completed']);

      const safeToDelete = (countAfter || 0) - policy.minKeepRows;
      if (safeToDelete > 0) {
        const rowsToDelete = toCompact.slice(0, safeToDelete);
        const ids = rowsToDelete.map((r) => r.id);

        const { error: deleteError } = await supabase
          .from('guardian_inapp_coach_nudges')
          .delete()
          .in('id', ids);

        if (!deleteError) {
          deletedRows = ids.length;
        }
      }
    }

    return {
      policyKey: 'coach_nudges',
      compactedRows: compactRecords.length,
      deletedRows,
      retainedRows: (countBefore || 0) - deletedRows,
      oldestAffectedDate: toCompact[0]?.created_at,
      newestAffectedDate: toCompact[toCompact.length - 1]?.created_at,
      status: 'success',
    };
  } catch (error) {
    console.error('Coach lifecycle error:', error);
    return {
      policyKey: 'coach_nudges',
      compactedRows: 0,
      deletedRows: 0,
      retainedRows: 0,
      status: 'error',
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply reports lifecycle
 * Prune very old executive_reports and health_timeline_points
 */
export async function applyReportsLifecycle(
  ctx: GuardianLifecycleJobContext,
  policy: GuardianLifecyclePolicy
): Promise<GuardianLifecycleOperationSummary> {
  const supabase = getSupabaseServer();

  try {
    const cutoffDate = new Date(ctx.now.getTime() - policy.retentionDays * 86400000);

    const { count: countBefore } = await supabase
      .from('guardian_executive_reports')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', ctx.tenantId);

    // Get reports beyond retention
    const { data: toDelete, error: fetchError } = await supabase
      .from('guardian_executive_reports')
      .select('id')
      .eq('tenant_id', ctx.tenantId)
      .lt('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if (!toDelete || toDelete.length === 0) {
      return {
        policyKey: 'executive_reports',
        compactedRows: 0,
        deletedRows: 0,
        retainedRows: countBefore || 0,
        status: 'skipped',
        reason: 'No reports eligible for deletion',
      };
    }

    // Check safety lower bound
    const { count: countAfter } = await supabase
      .from('guardian_executive_reports')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', ctx.tenantId);

    const safeToDelete = (countAfter || 0) - policy.minKeepRows;
    let deletedRows = 0;

    if (policy.deleteEnabled && safeToDelete > 0) {
      const rowsToDelete = toDelete.slice(0, safeToDelete);
      const ids = rowsToDelete.map((r) => r.id);

      const { error: deleteError } = await supabase
        .from('guardian_executive_reports')
        .delete()
        .in('id', ids);

      if (!deleteError) {
        deletedRows = ids.length;
      }
    }

    return {
      policyKey: 'executive_reports',
      compactedRows: 0,
      deletedRows,
      retainedRows: (countBefore || 0) - deletedRows,
      status: 'success',
    };
  } catch (error) {
    console.error('Reports lifecycle error:', error);
    return {
      policyKey: 'executive_reports',
      compactedRows: 0,
      deletedRows: 0,
      retainedRows: 0,
      status: 'error',
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main orchestrator: Run lifecycle for a tenant
 * Applies all applicable policies and returns summary
 */
export async function runMetaLifecycleForTenant(
  ctx: GuardianLifecycleJobContext,
  selectedPolicyKeys?: string[]
): Promise<GuardianLifecycleOperationSummary[]> {
  const policies = await loadLifecyclePoliciesForTenant(ctx.tenantId);
  const results: GuardianLifecycleOperationSummary[] = [];

  // Filter policies if requested
  const policiesToRun = selectedPolicyKeys
    ? policies.filter((p) => selectedPolicyKeys.includes(p.policyKey))
    : policies;

  for (const policy of policiesToRun) {
    let result: GuardianLifecycleOperationSummary;

    switch (policy.policyKey) {
      case 'readiness':
        result = await applyReadinessLifecycle(ctx, policy);
        break;
      case 'adoption':
        result = await applyAdoptionLifecycle(ctx, policy);
        break;
      case 'coach_nudges':
        result = await applyCoachLifecycle(ctx, policy);
        break;
      case 'executive_reports':
        result = await applyReportsLifecycle(ctx, policy);
        break;
      default:
        // Silently skip unknown policies
        continue;
    }

    results.push(result);
  }

  return results;
}
