/**
 * Guardian Z15: Meta Backup Service
 * Creates tenant-scoped, deterministic backups of Z01-Z14 meta configuration
 * Scrubbed of secrets/PII; supports selective scope inclusion
 */

import { getSupabaseServer } from '@/lib/supabase';
import { computeJsonChecksum } from './canonicalJson';
import { scrubExportPayload, validateExportContent } from './exportScrubber';
import { logMetaAuditEvent } from './metaAuditService';

export type GuardianBackupScope =
  | 'readiness'
  | 'uplift'
  | 'editions'
  | 'executive'
  | 'adoption'
  | 'lifecycle'
  | 'integrations'
  | 'goals_okrs'
  | 'playbooks'
  | 'governance'
  | 'exports'
  | 'improvement_loop'
  | 'automation'
  | 'status';

export interface GuardianBackupRequest {
  tenantId: string;
  backupKey: string;
  label: string;
  description: string;
  scope: GuardianBackupScope[];
  includeNotes?: boolean;
  actor?: string;
}

export interface GuardianBackupManifest {
  schemaVersion: string;
  generatedAt: string;
  tenantScoped: true;
  backupKey: string;
  scope: GuardianBackupScope[];
  items: Array<{
    itemKey: string;
    checksum: string;
    contentType: string;
    bytesApprox: number;
  }>;
  warnings: string[];
}

/**
 * Create backup set (async job lifecycle)
 */
export async function createBackupSet(req: GuardianBackupRequest): Promise<{ backupId: string }> {
  const supabase = getSupabaseServer();

  // Insert backup set with status=building
  const { data: backup, error: insertError } = await supabase
    .from('guardian_meta_backup_sets')
    .insert({
      tenant_id: req.tenantId,
      backup_key: req.backupKey,
      label: req.label,
      description: req.description,
      scope: req.scope,
      status: 'building',
      created_by: req.actor || 'system',
    })
    .select('id')
    .single();

  if (insertError || !backup) throw insertError || new Error('Failed to create backup');

  const backupId = backup.id;

  try {
    // Build items
    const manifest = await buildBackupItems(backupId, req);

    // Update status to 'ready' with manifest
    await supabase
      .from('guardian_meta_backup_sets')
      .update({
        status: 'ready',
        manifest,
        updated_at: new Date().toISOString(),
      })
      .eq('id', backupId);

    // Log audit event
    await logMetaAuditEvent({
      tenantId: req.tenantId,
      actor: req.actor || 'system',
      source: 'backup',
      action: 'create',
      entityType: 'backup_set',
      entityId: backupId,
      summary: `Created backup: ${req.backupKey}`,
      details: { backupKey: req.backupKey, scope: req.scope },
    });

    return { backupId };
  } catch (error) {
    // Update status to 'failed'
    await supabase
      .from('guardian_meta_backup_sets')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', backupId);

    throw error;
  }
}

/**
 * Build backup items based on scope
 */
async function buildBackupItems(
  backupId: string,
  req: GuardianBackupRequest
): Promise<GuardianBackupManifest> {
  const supabase = getSupabaseServer();
  const items: GuardianBackupManifest['items'] = [];
  const warnings: string[] = [];
  let orderIndex = 0;

  // Check governance for includeNotes gate
  let allowNotes = false;
  if (req.includeNotes) {
    try {
      const { data: prefs } = await supabase
        .from('guardian_meta_governance_prefs')
        .select('external_sharing_policy')
        .eq('tenant_id', req.tenantId)
        .single();

      // Only allow notes if internal_only (never external)
      allowNotes = prefs?.external_sharing_policy === 'internal_only';
      if (req.includeNotes && !allowNotes) {
        warnings.push('includeNotes requested but governance does not allow; excluding notes');
      }
    } catch {
      warnings.push('Could not check governance for includeNotes; excluding notes');
    }
  }

  // Build items per scope
  for (const scopeItem of req.scope) {
    try {
      const itemData = await buildScopeItem(scopeItem, req.tenantId, allowNotes);

      if (!itemData) {
        warnings.push(`No data available for scope: ${scopeItem}`);
        continue;
      }

      // Scrub PII (reuse Z11 scrubber)
      const scrubbed = scrubExportPayload(itemData);

      // Validate
      const validation = validateExportContent(scrubbed);
      warnings.push(...validation.warnings);

      // Compute checksum
      const { canonical, checksum } = computeJsonChecksum(scrubbed);

      // Insert item
      await supabase.from('guardian_meta_backup_items').insert({
        backup_id: backupId,
        tenant_id: req.tenantId,
        item_key: `${scopeItem}_config`,
        content_type: 'application/json',
        content: scrubbed as any,
        checksum,
        order_index: orderIndex++,
      });

      items.push({
        itemKey: `${scopeItem}_config`,
        checksum,
        contentType: 'application/json',
        bytesApprox: canonical.length,
      });
    } catch (error) {
      warnings.push(`Failed to backup scope: ${scopeItem} - ${error}`);
    }
  }

  // Build manifest
  const manifest: GuardianBackupManifest = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    tenantScoped: true,
    backupKey: req.backupKey,
    scope: req.scope,
    items,
    warnings,
  };

  // Insert manifest as item
  const { canonical, checksum } = computeJsonChecksum(manifest);
  await supabase.from('guardian_meta_backup_items').insert({
    backup_id: backupId,
    tenant_id: req.tenantId,
    item_key: 'manifest',
    content_type: 'application/json',
    content: manifest as any,
    checksum,
    order_index: -1,
  });

  return manifest;
}

/**
 * Build backup item for specific scope (PII-free configuration only)
 */
async function buildScopeItem(
  scope: GuardianBackupScope,
  tenantId: string,
  allowNotes: boolean
): Promise<unknown | null> {
  const supabase = getSupabaseServer();

  switch (scope) {
    case 'readiness': {
      // Latest readiness config/snapshot
      const { data } = await supabase
        .from('guardian_tenant_readiness_scores')
        .select('overall_guardian_score, status, computed_at')
        .eq('tenant_id', tenantId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single();

      return data ? { score: data.overall_guardian_score, status: data.status, computedAt: data.computed_at } : null;
    }

    case 'uplift': {
      // Uplift plan templates/config
      const { data } = await supabase
        .from('guardian_tenant_uplift_plans')
        .select('id, key, status, created_at')
        .eq('tenant_id', tenantId);

      return data ? { plansCount: data.length, plans: data.map((p) => ({ key: p.key, status: p.status })) } : null;
    }

    case 'editions': {
      // Edition fit config
      const { data } = await supabase
        .from('guardian_tenant_editions_fit')
        .select('edition_key, fit_score')
        .eq('tenant_id', tenantId);

      return data ? { editionsCount: data.length, editions: data.map((e) => ({ key: e.edition_key, score: e.fit_score })) } : null;
    }

    case 'executive': {
      // Executive report config
      const { data: scores } = await supabase
        .from('guardian_tenant_readiness_scores')
        .select('overall_guardian_score, status')
        .eq('tenant_id', tenantId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single();

      return scores ? { executiveScore: scores.overall_guardian_score, status: scores.status } : null;
    }

    case 'adoption': {
      // Adoption coaching policy/config
      const { data } = await supabase
        .from('guardian_tenant_adoption_scores')
        .select('adoption_rate, last_assessed_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return data ? { adoptionRate: data.adoption_rate, lastAssessedAt: data.last_assessed_at } : null;
    }

    case 'lifecycle': {
      // Lifecycle policies/schedules
      const { data: policies } = await supabase
        .from('guardian_meta_lifecycle_policies')
        .select('id, policy_key, enabled')
        .eq('tenant_id', tenantId);

      return policies ? { policiesCount: policies.length, policies: policies.map((p) => ({ key: p.policy_key, enabled: p.enabled })) } : null;
    }

    case 'integrations': {
      // Integration metadata (safe fields only, no URLs/secrets)
      const { data } = await supabase
        .from('guardian_meta_integrations')
        .select('id, integration_key, status')
        .eq('tenant_id', tenantId);

      return data ? { integrationsCount: data.length, integrations: data.map((i) => ({ key: i.integration_key, status: i.status })) } : null;
    }

    case 'goals_okrs': {
      // Goals/OKRs definitions (not derived snapshots)
      const { data } = await supabase
        .from('guardian_meta_program_goals')
        .select('goal_key, status, created_at')
        .eq('tenant_id', tenantId);

      return data ? { goalsCount: data.length, goals: data.map((g) => ({ key: g.goal_key, status: g.status })) } : null;
    }

    case 'playbooks': {
      // Playbook templates/config
      const { data } = await supabase
        .from('guardian_meta_playbook_library')
        .select('playbook_key, category')
        .eq('tenant_id', tenantId);

      return data ? { playbooksCount: data.length, playbooks: data.map((p) => ({ key: p.playbook_key, category: p.category })) } : null;
    }

    case 'governance': {
      // Governance settings (safe)
      const [flags, prefs] = await Promise.all([
        supabase.from('guardian_meta_feature_flags').select('*').eq('tenant_id', tenantId).single(),
        supabase.from('guardian_meta_governance_prefs').select('*').eq('tenant_id', tenantId).single(),
      ]);

      return {
        featureFlags: flags.data || {},
        governancePrefs: prefs.data || {},
      };
    }

    case 'exports': {
      // Export bundle metadata (not actual bundles)
      const { data } = await supabase
        .from('guardian_meta_export_bundles')
        .select('id, bundle_key, status, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      return data ? { bundlesCount: data.length, recentBundles: data.map((b) => ({ key: b.bundle_key, status: b.status })) } : null;
    }

    case 'improvement_loop': {
      // Improvement cycles and actions (exclude notes by default)
      const { data: cycles } = await supabase
        .from('guardian_meta_improvement_cycles')
        .select('id, cycle_key, status')
        .eq('tenant_id', tenantId);

      const { data: actions } = await supabase
        .from('guardian_meta_improvement_actions')
        .select('id, status')
        .eq('tenant_id', tenantId);

      return {
        cyclesCount: cycles?.length || 0,
        actionsCount: actions?.length || 0,
        cycles: cycles?.map((c) => ({ key: c.cycle_key, status: c.status })) || [],
      };
    }

    case 'automation': {
      // Automation schedules and triggers (safe config)
      const { data: schedules } = await supabase
        .from('guardian_meta_automation_schedules')
        .select('id, schedule_key, cadence, is_active')
        .eq('tenant_id', tenantId);

      const { data: triggers } = await supabase
        .from('guardian_meta_automation_triggers')
        .select('id, trigger_key, metric_key, comparator, is_active')
        .eq('tenant_id', tenantId);

      return {
        schedulesCount: schedules?.length || 0,
        triggersCount: triggers?.length || 0,
        schedules: schedules?.map((s) => ({ key: s.schedule_key, cadence: s.cadence, active: s.is_active })) || [],
        triggers: triggers?.map((t) => ({ key: t.trigger_key, metric: t.metric_key, comparator: t.comparator, active: t.is_active })) || [],
      };
    }

    case 'status': {
      // Status snapshot preferences (not snapshots themselves)
      const { data } = await supabase
        .from('guardian_meta_status_snapshots')
        .select('view_type, period_label')
        .eq('tenant_id', tenantId)
        .limit(5);

      if (!data) return null;

      const viewTypes = new Set(data.map((s) => s.view_type));
      const periodLabels = new Set(data.map((s) => s.period_label));

      return {
        snapshotViewTypes: Array.from(viewTypes),
        snapshotPeriods: Array.from(periodLabels),
        snapshotsCount: data.length,
      };
    }

    default:
      return null;
  }
}

/**
 * Get backup set by ID
 */
export async function getBackupSet(tenantId: string, backupId: string) {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_backup_sets')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', backupId)
    .single();

  if (error || !data) return null;

  return data;
}

/**
 * List backup sets for tenant
 */
export async function listBackupSets(
  tenantId: string,
  options?: { limit?: number; offset?: number; status?: string }
) {
  const supabase = getSupabaseServer();
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  let query = supabase
    .from('guardian_meta_backup_sets')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    backups: data || [],
    total: count || 0,
  };
}

/**
 * Get backup item by key
 */
export async function getBackupItem(tenantId: string, backupId: string, itemKey: string) {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_backup_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('backup_id', backupId)
    .eq('item_key', itemKey)
    .single();

  if (error || !data) return null;

  return data;
}

/**
 * List backup items (safe fields only)
 */
export async function listBackupItems(tenantId: string, backupId: string) {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_backup_items')
    .select('id, item_key, content_type, checksum, order_index, created_at')
    .eq('tenant_id', tenantId)
    .eq('backup_id', backupId)
    .order('order_index', { ascending: true });

  if (error) throw error;

  return data || [];
}
