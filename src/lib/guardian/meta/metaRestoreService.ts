/**
 * Guardian Z15: Meta Restore Service
 * Computes restore previews and applies restores with strict guardrails
 * Preview-first workflow: always show diff before applying
 */

import { getSupabaseServer } from '@/lib/supabase';
import { computeJsonChecksum } from './canonicalJson';
import { logMetaAuditEvent } from './metaAuditService';
import { schedulerUtils } from './schedulerUtils';

/**
 * Allowlisted entities per scope for restore operations
 * Defines which tables/rows can be restored and what mode (merge/replace)
 */
const RESTORE_ALLOWLIST: Record<string, { mergeMode: boolean; replaceMode: boolean; tables: string[] }> = {
  readiness: { mergeMode: true, replaceMode: false, tables: ['guardian_tenant_readiness_scores'] },
  uplift: { mergeMode: true, replaceMode: true, tables: ['guardian_tenant_uplift_plans'] },
  editions: { mergeMode: true, replaceMode: false, tables: ['guardian_tenant_editions_fit'] },
  executive: { mergeMode: true, replaceMode: false, tables: ['guardian_tenant_readiness_scores'] },
  adoption: { mergeMode: true, replaceMode: false, tables: ['guardian_tenant_adoption_scores'] },
  lifecycle: { mergeMode: true, replaceMode: false, tables: ['guardian_meta_lifecycle_policies'] },
  integrations: { mergeMode: true, replaceMode: false, tables: ['guardian_meta_integrations'] },
  goals_okrs: { mergeMode: true, replaceMode: false, tables: ['guardian_meta_program_goals'] },
  playbooks: { mergeMode: true, replaceMode: true, tables: ['guardian_meta_playbook_library'] },
  governance: { mergeMode: true, replaceMode: false, tables: ['guardian_meta_feature_flags', 'guardian_meta_governance_prefs'] },
  exports: { mergeMode: true, replaceMode: false, tables: ['guardian_meta_export_bundles'] },
  improvement_loop: { mergeMode: true, replaceMode: true, tables: ['guardian_meta_improvement_cycles', 'guardian_meta_improvement_actions'] },
  automation: { mergeMode: true, replaceMode: false, tables: ['guardian_meta_automation_schedules', 'guardian_meta_automation_triggers'] },
  status: { mergeMode: false, replaceMode: false, tables: [] }, // Status is derived, never restored
};

export interface RestorePreviewRequest {
  tenantId: string;
  backupId: string;
  targetMode: 'merge' | 'replace';
  actor: string;
}

/**
 * Build restore preview: compute diff without applying
 */
export async function buildRestorePreview(req: RestorePreviewRequest): Promise<{ restoreRunId: string }> {
  const supabase = getSupabaseServer();

  // Create restore run with status=preview
  const { data: run, error } = await supabase
    .from('guardian_meta_restore_runs')
    .insert({
      tenant_id: req.tenantId,
      backup_id: req.backupId,
      target_mode: req.targetMode,
      status: 'preview',
      actor: req.actor,
    })
    .select('id')
    .single();

  if (error || !run) throw error || new Error('Failed to create restore run');

  const restoreRunId = run.id;

  try {
    // Load backup
    const { data: backup } = await supabase
      .from('guardian_meta_backup_sets')
      .select('*')
      .eq('id', req.backupId)
      .eq('tenant_id', req.tenantId)
      .single();

    if (!backup) throw new Error('Backup not found');

    // Compute preview diff
    const previewDiff = await computePreviewDiff(req.tenantId, backup, req.targetMode);
    const applyPlan = buildApplyPlan(previewDiff, req.targetMode);

    // Update restore run with preview and plan
    await supabase
      .from('guardian_meta_restore_runs')
      .update({
        preview_diff: previewDiff,
        apply_plan: applyPlan,
      })
      .eq('id', restoreRunId);

    // Log audit event
    await logMetaAuditEvent({
      tenantId: req.tenantId,
      actor: req.actor,
      source: 'restore',
      action: 'preview',
      entityType: 'restore_run',
      entityId: restoreRunId,
      summary: `Preview restore from backup: ${backup.backup_key}`,
      details: {
        backupKey: backup.backup_key,
        targetMode: req.targetMode,
        previewStats: {
          adds: Object.keys(previewDiff.adds || {}).length,
          updates: Object.keys(previewDiff.updates || {}).length,
          skips: Object.keys(previewDiff.skips || {}).length,
        },
      },
    });

    return { restoreRunId };
  } catch (error) {
    // Update restore run status to 'failed'
    await supabase
      .from('guardian_meta_restore_runs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
      })
      .eq('id', restoreRunId);

    throw error;
  }
}

/**
 * Compute PII-free preview diff (no actual payloads, just counts and keys)
 */
async function computePreviewDiff(
  tenantId: string,
  backup: any,
  targetMode: string
): Promise<{ adds: Record<string, string[]>; updates: Record<string, string[]>; skips: Record<string, string> }> {
  const adds: Record<string, string[]> = {};
  const updates: Record<string, string[]> = {};
  const skips: Record<string, string> = {};

  const supabase = getSupabaseServer();

  for (const scope of backup.scope) {
    // Check allowlist
    const allowlist = RESTORE_ALLOWLIST[scope];
    if (!allowlist) {
      skips[scope] = 'Unknown scope';
      continue;
    }

    if (targetMode === 'replace' && !allowlist.replaceMode) {
      skips[scope] = 'Replace mode not allowed for this scope';
      continue;
    }

    if (targetMode === 'merge' && !allowlist.mergeMode) {
      skips[scope] = 'Merge mode not allowed for this scope';
      continue;
    }

    // Load backup item
    const { data: backupItem } = await supabase
      .from('guardian_meta_backup_items')
      .select('content')
      .eq('backup_id', backup.id)
      .eq('item_key', `${scope}_config`)
      .single();

    if (!backupItem) {
      skips[scope] = 'Backup item not found';
      continue;
    }

    // For now, placeholder: in production, compare item keys against current state
    // and decide adds vs updates based on existence
    adds[scope] = [];
    updates[scope] = [];

    // Simplified: all items as "adds" for merge mode (actual dedup happens on apply)
    if (backupItem.content && typeof backupItem.content === 'object') {
      const contentStr = JSON.stringify(backupItem.content);
      // Extract item keys from content (heuristic)
      if (contentStr.includes('key')) {
        adds[scope].push(`[${scope}_items_backed_up]`);
      }
    }
  }

  return { adds, updates, skips };
}

/**
 * Build apply plan from preview diff
 */
function buildApplyPlan(
  preview: any,
  targetMode: string
): { operations: Array<{ scope: string; op: string; count: number }> } {
  const operations: Array<{ scope: string; op: string; count: number }> = [];

  for (const scope in preview.adds) {
    if ((preview.adds[scope] || []).length > 0) {
      operations.push({
        scope,
        op: targetMode === 'replace' ? 'replace' : 'merge_upsert',
        count: (preview.adds[scope] || []).length,
      });
    }
  }

  return { operations };
}

/**
 * Apply restore run (admin-confirmed only)
 */
export async function applyRestoreRun(tenantId: string, restoreRunId: string, actor: string): Promise<{ status: string }> {
  const supabase = getSupabaseServer();

  // Load restore run
  const { data: run } = await supabase
    .from('guardian_meta_restore_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', restoreRunId)
    .single();

  if (!run) throw new Error('Restore run not found');
  if (run.status !== 'preview') throw new Error('Restore run is not in preview state');

  try {
    // Update status to applying
    await supabase
      .from('guardian_meta_restore_runs')
      .update({
        status: 'applying',
        started_at: new Date().toISOString(),
      })
      .eq('id', restoreRunId);

    // Execute apply plan
    const result = await executeApplyPlan(tenantId, run, actor);

    // Update status to completed
    await supabase
      .from('guardian_meta_restore_runs')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        result_summary: result,
      })
      .eq('id', restoreRunId);

    // Log audit event
    await logMetaAuditEvent({
      tenantId,
      actor,
      source: 'restore',
      action: 'apply',
      entityType: 'restore_run',
      entityId: restoreRunId,
      summary: `Applied restore from backup`,
      details: result,
    });

    return { status: 'completed' };
  } catch (error) {
    // Update status to failed
    const errorMsg = error instanceof Error ? error.message : String(error);
    await supabase
      .from('guardian_meta_restore_runs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_message: errorMsg,
      })
      .eq('id', restoreRunId);

    // Log failure
    await logMetaAuditEvent({
      tenantId,
      actor,
      source: 'restore',
      action: 'apply_failed',
      entityType: 'restore_run',
      entityId: restoreRunId,
      summary: `Restore failed: ${errorMsg}`,
      details: { error: errorMsg },
    });

    throw error;
  }
}

/**
 * Execute apply plan (placeholder: simplified implementation)
 */
async function executeApplyPlan(tenantId: string, run: any, actor: string): Promise<any> {
  const supabase = getSupabaseServer();
  const appliedCount = 0;
  const updatedCount = 0;
  const skippedCount = 0;
  const errors: string[] = [];

  // Load backup
  const { data: backup } = await supabase
    .from('guardian_meta_backup_sets')
    .select('*')
    .eq('id', run.backup_id)
    .single();

  if (!backup) throw new Error('Backup not found during apply');

  // For each scope in plan, execute operations
  for (const scope of backup.scope) {
    try {
      const allowlist = RESTORE_ALLOWLIST[scope];
      if (!allowlist) {
        errors.push(`Scope ${scope} not allowlisted`);
        continue;
      }

      // In production, would:
      // 1. Load backup item content
      // 2. Apply upserts/deletes to allowlisted tables
      // 3. Recompute derived fields (e.g., automation next_run_at)
      // 4. Return counts

      // Placeholder: log that scope would be applied
      console.log(`[Z15 Restore] Would apply ${scope} with mode ${run.target_mode}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`Scope ${scope}: ${msg}`);
    }
  }

  return {
    appliedCount,
    updatedCount,
    skippedCount,
    errors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get restore run with safe field filtering (no huge payloads)
 */
export async function getRestoreRun(tenantId: string, restoreRunId: string) {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_restore_runs')
    .select('id, tenant_id, status, backup_id, target_mode, created_at, started_at, finished_at, actor')
    .eq('tenant_id', tenantId)
    .eq('id', restoreRunId)
    .single();

  if (error || !data) return null;

  return data;
}

/**
 * List restore runs (recent first)
 */
export async function listRestoreRuns(
  tenantId: string,
  options?: { limit?: number; offset?: number; status?: string }
) {
  const supabase = getSupabaseServer();
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  let query = supabase
    .from('guardian_meta_restore_runs')
    .select('id, status, backup_id, target_mode, created_at, finished_at, actor, error_message', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    restores: data || [],
    total: count || 0,
  };
}
