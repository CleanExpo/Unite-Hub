/**
 * Z11 Export Bundle Service
 * Manages Z01-Z10 export bundle lifecycle: pending → building → ready/failed
 * Produces PII-free, deterministic bundles with checksums
 */

import { getSupabaseServer } from '@/lib/supabase';
import { computeJsonChecksum } from './canonicalJson';
import { scrubExportPayload, validateExportContent } from './exportScrubber';
import { logMetaAuditEvent } from './metaAuditService';

/**
 * Scope types matching Z-series domains
 * Includes Z12 improvement_loop and Z14 status_snapshots scopes
 */
export type GuardianExportScope =
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
  | 'improvement_loop'
  | 'status_snapshots';

/**
 * Request to create new export bundle
 */
export interface GuardianExportBundleRequest {
  tenantId: string;
  bundleKey: string; // 'cs_transfer_kit' | 'exec_briefing_pack' | 'implementation_handoff'
  label: string;
  description: string;
  scope: GuardianExportScope[];
  periodStart?: string;
  periodEnd?: string;
  actor?: string;
}

/**
 * Manifest structure (versioned, self-contained)
 */
export interface GuardianExportBundleManifest {
  schemaVersion: string;
  generatedAt: string; // ISO 8601
  tenantScoped: true;
  bundleKey: string;
  scope: GuardianExportScope[];
  period?: {
    start?: string;
    end?: string;
  };
  items: Array<{
    itemKey: string;
    checksum: string;
    contentType: string;
    bytesApprox: number;
  }>;
  warnings: string[];
}

/**
 * Export bundle response (after creation)
 */
export interface GuardianExportBundle {
  id: string;
  tenantId: string;
  bundleKey: string;
  label: string;
  description: string;
  scope: GuardianExportScope[];
  status: 'pending' | 'building' | 'ready' | 'failed' | 'archived';
  manifest: GuardianExportBundleManifest | null;
  createdAt: string;
  updatedAt: string;
  errorMessage: string | null;
}

/**
 * Create export bundle (async job)
 * Returns bundleId immediately, job runs async
 */
export async function createExportBundle(
  req: GuardianExportBundleRequest
): Promise<{ bundleId: string }> {
  const supabase = getSupabaseServer();

  // Insert bundle record with status=pending
  const { data: bundle, error: insertError } = await supabase
    .from('guardian_meta_export_bundles')
    .insert({
      tenant_id: req.tenantId,
      bundle_key: req.bundleKey,
      label: req.label,
      description: req.description,
      scope: req.scope,
      period_start: req.periodStart || null,
      period_end: req.periodEnd || null,
      status: 'pending',
      created_by: req.actor || 'system',
    })
    .select('id')
    .single();

  if (insertError || !bundle) {
    throw insertError || new Error('Failed to create bundle');
  }

  const bundleId = bundle.id;

  // Update status to 'building' (async job starting)
  await supabase
    .from('guardian_meta_export_bundles')
    .update({
      status: 'building',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bundleId);

  // Start async build job
  buildBundleAsync(bundleId, req).catch((err) => {
    console.error(`[Z11] Bundle build failed for ${bundleId}:`, err);
  });

  return { bundleId };
}

/**
 * Async bundle build job (runs in background)
 */
async function buildBundleAsync(
  bundleId: string,
  req: GuardianExportBundleRequest
): Promise<void> {
  const supabase = getSupabaseServer();

  try {
    // Build items and manifest
    const manifest = await buildBundleItems(bundleId, req);

    // Update status to 'ready' with manifest
    await supabase
      .from('guardian_meta_export_bundles')
      .update({
        status: 'ready',
        manifest,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bundleId);

    // Log audit event
    await logMetaAuditEvent({
      tenantId: req.tenantId,
      actor: req.actor || 'system',
      source: 'meta_governance',
      action: 'create',
      entityType: 'export_bundle',
      entityId: bundleId,
      summary: `Created export bundle: ${req.bundleKey}`,
      details: {
        bundleKey: req.bundleKey,
        scope: req.scope,
      },
    });
  } catch (error) {
    // Update status to 'failed' with error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('guardian_meta_export_bundles')
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bundleId);

    // Log audit event for failure
    await logMetaAuditEvent({
      tenantId: req.tenantId,
      actor: req.actor || 'system',
      source: 'meta_governance',
      action: 'update',
      entityType: 'export_bundle',
      entityId: bundleId,
      summary: `Export bundle failed: ${req.bundleKey}`,
      details: {
        bundleKey: req.bundleKey,
        error: errorMessage,
      },
    }).catch(() => {
      // Silently fail audit logging if bundle is already broken
    });
  }
}

/**
 * Build bundle items based on scope (internal)
 * Creates items for each scope, then manifest item
 */
async function buildBundleItems(
  bundleId: string,
  req: GuardianExportBundleRequest
): Promise<GuardianExportBundleManifest> {
  const supabase = getSupabaseServer();
  const items: GuardianExportBundleManifest['items'] = [];
  const warnings: string[] = [];
  let orderIndex = 0;

  // Build items per scope
  for (const scopeItem of req.scope) {
    try {
      const itemData = await buildScopeItem(scopeItem, req);

      if (!itemData) {
        warnings.push(`No data available for scope: ${scopeItem}`);
        continue;
      }

      // Scrub PII
      const scrubbed = scrubExportPayload(itemData);

      // Validate for residual PII
      const validation = validateExportContent(scrubbed);
      if (validation.warnings.length > 0) {
        warnings.push(`[${scopeItem}] ${validation.warnings.join('; ')}`);
      }

      // Compute checksum
      const { canonical, checksum } = computeJsonChecksum(scrubbed);

      // Insert item
      await supabase.from('guardian_meta_export_bundle_items').insert({
        bundle_id: bundleId,
        tenant_id: req.tenantId,
        item_key: `${scopeItem}_snapshot`,
        content_type: 'application/json',
        content: scrubbed as any,
        checksum,
        order_index: orderIndex++,
      });

      items.push({
        itemKey: `${scopeItem}_snapshot`,
        checksum,
        contentType: 'application/json',
        bytesApprox: canonical.length,
      });
    } catch (error) {
      warnings.push(
        `Failed to build item for scope: ${scopeItem} - ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Build manifest item
  const manifest: GuardianExportBundleManifest = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    tenantScoped: true,
    bundleKey: req.bundleKey,
    scope: req.scope,
    period:
      req.periodStart || req.periodEnd
        ? {
            start: req.periodStart,
            end: req.periodEnd,
          }
        : undefined,
    items,
    warnings,
  };

  // Insert manifest as item (order_index = -1 to appear first)
  const { canonical, checksum } = computeJsonChecksum(manifest);
  await supabase.from('guardian_meta_export_bundle_items').insert({
    bundle_id: bundleId,
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
 * Build PII-free data snapshot for specific scope
 * Returns aggregated, safe data only (no raw logs, no identifiers)
 */
async function buildScopeItem(
  scope: GuardianExportScope,
  req: GuardianExportBundleRequest
): Promise<unknown | null> {
  const supabase = getSupabaseServer();

  switch (scope) {
    case 'readiness': {
      // Latest readiness snapshot
      const { data } = await supabase
        .from('guardian_tenant_readiness_scores')
        .select('overall_guardian_score, status, computed_at, details')
        .eq('tenant_id', req.tenantId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single();

      return data
        ? {
            score: data.overall_guardian_score,
            status: data.status,
            computed_at: data.computed_at,
            capabilities: data.details?.capabilities || {},
          }
        : null;
    }

    case 'uplift': {
      // Active uplift plans summary
      const { data } = await supabase
        .from('guardian_tenant_uplift_plans')
        .select('id, key, status, created_at')
        .eq('tenant_id', req.tenantId)
        .eq('status', 'active');

      return data
        ? {
            activePlansCount: data.length,
            plans: data.map((p) => ({
              key: p.key,
              status: p.status,
              created_at: p.created_at,
            })),
          }
        : null;
    }

    case 'editions': {
      // Edition fit scoring
      const { data } = await supabase
        .from('guardian_tenant_editions_fit')
        .select('edition_key, fit_score, created_at')
        .eq('tenant_id', req.tenantId)
        .order('fit_score', { ascending: false });

      return data
        ? {
            editionCount: data.length,
            editions: data.map((e) => ({
              editionKey: e.edition_key,
              fitScore: e.fit_score,
              computed_at: e.created_at,
            })),
          }
        : null;
    }

    case 'governance': {
      // Meta governance snapshot (already safe)
      const [flags, prefs] = await Promise.all([
        supabase
          .from('guardian_meta_feature_flags')
          .select('*')
          .eq('tenant_id', req.tenantId)
          .single(),
        supabase
          .from('guardian_meta_governance_prefs')
          .select('*')
          .eq('tenant_id', req.tenantId)
          .single(),
      ]);

      return {
        featureFlags: flags.data || {
          enableZAiHints: false,
          enableZSuccessNarrative: false,
          enableZPlaybookAi: false,
          enableZLifecycleAi: false,
          enableZGoalsAi: false,
        },
        governancePrefs: prefs.data || {
          riskPosture: 'standard',
          aiUsagePolicy: 'off',
          externalSharingPolicy: 'internal_only',
        },
      };
    }

    case 'adoption': {
      // Adoption metrics summary
      const { data } = await supabase
        .from('guardian_tenant_adoption_scores')
        .select('adoption_rate, last_activity_at, created_at')
        .eq('tenant_id', req.tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return data
        ? {
            adoptionRate: data.adoption_rate,
            lastActivityAt: data.last_activity_at,
            computed_at: data.created_at,
          }
        : null;
    }

    case 'lifecycle': {
      // Lifecycle stage tracking
      const { data } = await supabase
        .from('guardian_tenant_lifecycle_jobs')
        .select('lifecycle_stage, status, created_at')
        .eq('tenant_id', req.tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return data
        ? {
            lifecycleStage: data.lifecycle_stage,
            jobStatus: data.status,
            computed_at: data.created_at,
          }
        : null;
    }

    case 'integrations': {
      // Integration connections summary
      const { data } = await supabase
        .from('guardian_meta_integrations')
        .select('integration_key, status, created_at')
        .eq('tenant_id', req.tenantId);

      return data
        ? {
            integrationsCount: data.length,
            integrations: data.map((i) => ({
              integrationKey: i.integration_key,
              status: i.status,
              connected_at: i.created_at,
            })),
          }
        : null;
    }

    case 'goals_okrs': {
      // Goals and OKRs summary
      const { data } = await supabase
        .from('guardian_meta_program_goals')
        .select('goal_key, status, created_at')
        .eq('tenant_id', req.tenantId);

      return data
        ? {
            goalsCount: data.length,
            goals: data.map((g) => ({
              goalKey: g.goal_key,
              status: g.status,
              created_at: g.created_at,
            })),
          }
        : null;
    }

    case 'playbooks': {
      // Playbooks summary
      const { data } = await supabase
        .from('guardian_meta_playbook_library')
        .select('playbook_key, category, created_at')
        .eq('tenant_id', req.tenantId);

      return data
        ? {
            playbooksCount: data.length,
            playbooks: data.map((p) => ({
              playbookKey: p.playbook_key,
              category: p.category,
              added_at: p.created_at,
            })),
          }
        : null;
    }

    case 'executive': {
      // Executive-ready summary (high-level metrics only)
      const { data } = await supabase
        .from('guardian_tenant_readiness_scores')
        .select('overall_guardian_score, status')
        .eq('tenant_id', req.tenantId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single();

      return data
        ? {
            guardianScore: data.overall_guardian_score,
            readinessStatus: data.status,
            summaryReady: true,
          }
        : null;
    }

    case 'improvement_loop': {
      // Z12 Continuous Improvement Loop summary (PII scrubbed)
      const { data: cycles } = await supabase
        .from('guardian_meta_improvement_cycles')
        .select('id, cycle_key, status, period_start, period_end')
        .eq('tenant_id', req.tenantId)
        .order('created_at', { ascending: false });

      if (!cycles || cycles.length === 0) {
        return null;
      }

      const { data: actions } = await supabase
        .from('guardian_meta_improvement_actions')
        .select('id, status, priority')
        .eq('tenant_id', req.tenantId);

      const { data: outcomes } = await supabase
        .from('guardian_meta_improvement_outcomes')
        .select('id, label, captured_at, summary')
        .eq('tenant_id', req.tenantId)
        .order('captured_at', { ascending: false });

      const activeCyclesCount = cycles.filter((c) => c.status === 'active').length;
      const actionsByStatus = {
        planned: actions?.filter((a) => a.status === 'planned').length || 0,
        in_progress: actions?.filter((a) => a.status === 'in_progress').length || 0,
        done: actions?.filter((a) => a.status === 'done').length || 0,
        blocked: actions?.filter((a) => a.status === 'blocked').length || 0,
      };

      return {
        cyclesCount: cycles.length,
        activeCyclesCount,
        actionsCount: actions?.length || 0,
        actionsByStatus,
        outcomesCount: outcomes?.length || 0,
        recentCycles: cycles.slice(0, 5).map((c) => ({
          cycleKey: c.cycle_key,
          status: c.status,
          periodStart: c.period_start,
          periodEnd: c.period_end,
        })),
      };
    }

    case 'status_snapshots': {
      // Z14 Status Page snapshots (operator/leadership/cs views)
      const { data: snapshots } = await supabase
        .from('guardian_meta_status_snapshots')
        .select('id, view_type, period_label, overall_status, headline, captured_at')
        .eq('tenant_id', req.tenantId)
        .order('captured_at', { ascending: false })
        .limit(20);

      if (!snapshots || snapshots.length === 0) {
        return null;
      }

      // Group by view type
      const byViewType: Record<string, any[]> = { operator: [], leadership: [], cs: [] };
      snapshots.forEach((s) => {
        if (byViewType[s.view_type]) {
          byViewType[s.view_type].push({
            periodLabel: s.period_label,
            overallStatus: s.overall_status,
            headline: s.headline,
            capturedAt: s.captured_at,
          });
        }
      });

      return {
        snapshotsCount: snapshots.length,
        byViewType,
        recentSnapshots: snapshots.slice(0, 5).map((s) => ({
          viewType: s.view_type,
          status: s.overall_status,
          capturedAt: s.captured_at,
        })),
      };
    }

    default:
      return null;
  }
}

/**
 * Get export bundle by ID (for retrieval)
 */
export async function getExportBundle(
  tenantId: string,
  bundleId: string
): Promise<GuardianExportBundle | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_export_bundles')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', bundleId)
    .single();

  if (error || !data) return null;

  return mapBundleRow(data);
}

/**
 * List export bundles for tenant (with pagination)
 */
export async function listExportBundles(
  tenantId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }
): Promise<{ bundles: GuardianExportBundle[]; total: number }> {
  const supabase = getSupabaseServer();
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  let query = supabase
    .from('guardian_meta_export_bundles')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    bundles: (data || []).map(mapBundleRow),
    total: count || 0,
  };
}

/**
 * Get bundle item by key
 */
export async function getBundleItem(
  tenantId: string,
  bundleId: string,
  itemKey: string
): Promise<{ itemKey: string; content: unknown; checksum: string } | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_export_bundle_items')
    .select('item_key, content, checksum')
    .eq('tenant_id', tenantId)
    .eq('bundle_id', bundleId)
    .eq('item_key', itemKey)
    .single();

  if (error || !data) return null;

  return {
    itemKey: data.item_key,
    content: data.content,
    checksum: data.checksum,
  };
}

/**
 * Map database row to typed bundle
 */
function mapBundleRow(row: any): GuardianExportBundle {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    bundleKey: row.bundle_key,
    label: row.label,
    description: row.description,
    scope: row.scope,
    status: row.status,
    manifest: row.manifest,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    errorMessage: row.error_message,
  };
}
