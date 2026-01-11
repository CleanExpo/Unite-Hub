/**
 * Z12 Improvement Cycle Service
 * Manages continuous improvement cycles, actions, and outcome snapshots
 * Operationalizes Z01-Z11 meta signals into tracked improvement actions and measurable outcomes
 */

import { getSupabaseServer } from '@/lib/supabase';
import { logMetaAuditEvent } from './metaAuditService';

/**
 * Improvement cycle status
 */
export type ImprovementCycleStatus = 'active' | 'paused' | 'completed' | 'archived';

/**
 * Improvement action status and priority
 */
export type ImprovementActionStatus = 'planned' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type ImprovementActionPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Improvement cycle
 */
export interface GuardianImprovementCycle {
  id: string;
  tenantId: string;
  cycleKey: string;
  title: string;
  description: string;
  periodStart: string;
  periodEnd: string;
  status: ImprovementCycleStatus;
  focusDomains: string[];
  owner: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: any;
}

/**
 * Improvement action
 */
export interface GuardianImprovementAction {
  id: string;
  tenantId: string;
  cycleId: string;
  actionKey: string;
  title: string;
  description: string;
  priority: ImprovementActionPriority;
  status: ImprovementActionStatus;
  dueDate: string | null;
  evidenceLinks: any[];
  relatedPlaybookKeys: string[];
  relatedGoalKpiKeys: string[];
  expectedImpact: any;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Improvement outcome snapshot
 */
export interface GuardianImprovementOutcome {
  id: string;
  tenantId: string;
  cycleId: string;
  label: string;
  metrics: any;
  summary: any;
  capturedAt: string;
  createdAt: string;
}

/**
 * Create improvement cycle
 */
export async function createCycle(
  tenantId: string,
  payload: {
    cycleKey: string;
    title: string;
    description: string;
    periodStart: string;
    periodEnd: string;
    focusDomains: string[];
    owner?: string;
  },
  actor?: string
): Promise<{ cycleId: string }> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_improvement_cycles')
    .insert({
      tenant_id: tenantId,
      cycle_key: payload.cycleKey,
      title: payload.title,
      description: payload.description,
      period_start: payload.periodStart,
      period_end: payload.periodEnd,
      focus_domains: payload.focusDomains,
      owner: payload.owner || null,
      status: 'active',
    })
    .select('id')
    .single();

  if (error || !data) throw error || new Error('Failed to create cycle');

  // Log audit event
  await logMetaAuditEvent({
    tenantId,
    actor: actor || 'system',
    source: 'improvement_loop',
    action: 'create',
    entityType: 'improvement_cycle',
    entityId: data.id,
    summary: `Created improvement cycle: ${payload.cycleKey}`,
    details: {
      cycleKey: payload.cycleKey,
      focusDomains: payload.focusDomains,
    },
  }).catch(() => {
    // Non-blocking audit failure
  });

  return { cycleId: data.id };
}

/**
 * Update cycle
 */
export async function updateCycle(
  tenantId: string,
  cycleId: string,
  patch: Partial<{
    title: string;
    description: string;
    status: ImprovementCycleStatus;
    owner: string | null;
  }>,
  actor?: string
): Promise<GuardianImprovementCycle> {
  const supabase = getSupabaseServer();

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.owner !== undefined) updates.owner = patch.owner;

  const { data, error } = await supabase
    .from('guardian_meta_improvement_cycles')
    .update(updates)
    .eq('tenant_id', tenantId)
    .eq('id', cycleId)
    .select('*')
    .single();

  if (error || !data) throw error || new Error('Failed to update cycle');

  // Log audit
  await logMetaAuditEvent({
    tenantId,
    actor: actor || 'system',
    source: 'improvement_loop',
    action: 'update',
    entityType: 'improvement_cycle',
    entityId: cycleId,
    summary: `Updated improvement cycle`,
    details: patch,
  }).catch(() => {});

  return mapCycleRow(data);
}

/**
 * Get cycle with actions and latest outcomes
 */
export async function getCycle(
  tenantId: string,
  cycleId: string
): Promise<{
  cycle: GuardianImprovementCycle;
  actions: GuardianImprovementAction[];
  latestOutcome: GuardianImprovementOutcome | null;
}> {
  const supabase = getSupabaseServer();

  const [cycleRes, actionsRes, outcomesRes] = await Promise.all([
    supabase
      .from('guardian_meta_improvement_cycles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', cycleId)
      .single(),
    supabase
      .from('guardian_meta_improvement_actions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('cycle_id', cycleId)
      .order('created_at', { ascending: false }),
    supabase
      .from('guardian_meta_improvement_outcomes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('cycle_id', cycleId)
      .order('captured_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (cycleRes.error || !cycleRes.data) throw cycleRes.error || new Error('Cycle not found');

  return {
    cycle: mapCycleRow(cycleRes.data),
    actions: (actionsRes.data || []).map(mapActionRow),
    latestOutcome: outcomesRes.data ? mapOutcomeRow(outcomesRes.data) : null,
  };
}

/**
 * List cycles for tenant
 */
export async function listCycles(
  tenantId: string,
  filters?: {
    status?: ImprovementCycleStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{ cycles: GuardianImprovementCycle[]; total: number }> {
  const supabase = getSupabaseServer();
  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;

  let query = supabase
    .from('guardian_meta_improvement_cycles')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    cycles: (data || []).map(mapCycleRow),
    total: count || 0,
  };
}

/**
 * Create action in cycle
 */
export async function createAction(
  tenantId: string,
  cycleId: string,
  payload: {
    actionKey: string;
    title: string;
    description: string;
    priority?: ImprovementActionPriority;
    dueDate?: string;
    relatedPlaybookKeys?: string[];
    relatedGoalKpiKeys?: string[];
    expectedImpact?: any;
    notes?: string;
  },
  actor?: string
): Promise<{ actionId: string }> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_improvement_actions')
    .insert({
      tenant_id: tenantId,
      cycle_id: cycleId,
      action_key: payload.actionKey,
      title: payload.title,
      description: payload.description,
      priority: payload.priority || 'medium',
      status: 'planned',
      due_date: payload.dueDate || null,
      related_playbook_keys: payload.relatedPlaybookKeys || [],
      related_goal_kpi_keys: payload.relatedGoalKpiKeys || [],
      expected_impact: payload.expectedImpact || {},
      notes: payload.notes || null,
    })
    .select('id')
    .single();

  if (error || !data) throw error || new Error('Failed to create action');

  // Log audit
  await logMetaAuditEvent({
    tenantId,
    actor: actor || 'system',
    source: 'improvement_loop',
    action: 'create',
    entityType: 'improvement_action',
    entityId: data.id,
    summary: `Created improvement action: ${payload.actionKey}`,
    details: {
      actionKey: payload.actionKey,
      priority: payload.priority || 'medium',
      relatedPlaybookKeys: payload.relatedPlaybookKeys,
    },
  }).catch(() => {});

  return { actionId: data.id };
}

/**
 * Update action status
 */
export async function setActionStatus(
  tenantId: string,
  actionId: string,
  status: ImprovementActionStatus,
  actor?: string
): Promise<GuardianImprovementAction> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_improvement_actions')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)
    .eq('id', actionId)
    .select('*')
    .single();

  if (error || !data) throw error || new Error('Failed to update action');

  // Log audit
  await logMetaAuditEvent({
    tenantId,
    actor: actor || 'system',
    source: 'improvement_loop',
    action: 'update',
    entityType: 'improvement_action',
    entityId: actionId,
    summary: `Updated action status to: ${status}`,
    details: { status },
  }).catch(() => {});

  return mapActionRow(data);
}

/**
 * List actions in cycle
 */
export async function listActions(
  tenantId: string,
  cycleId: string,
  filters?: {
    status?: ImprovementActionStatus;
    priority?: ImprovementActionPriority;
  }
): Promise<GuardianImprovementAction[]> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_meta_improvement_actions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('cycle_id', cycleId)
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapActionRow);
}

/**
 * Capture outcome snapshot
 * Builds snapshot from Z01-Z08 meta data and inserts as outcome
 */
export async function captureOutcome(
  tenantId: string,
  cycleId: string,
  label: string,
  actor?: string
): Promise<{ outcomeId: string; outcome: GuardianImprovementOutcome }> {
  const supabase = getSupabaseServer();

  // Build meta snapshot from Z01-Z08
  const snapshot = await buildMetaOutcomeMetricsSnapshot(tenantId, cycleId);

  // Get previous outcome for delta calculation
  const { data: prevOutcome } = await supabase
    .from('guardian_meta_improvement_outcomes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('cycle_id', cycleId)
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();

  // Compute deltas
  const summary = computeOutcomeDelta(snapshot, prevOutcome?.metrics);

  // Insert outcome
  const { data, error } = await supabase
    .from('guardian_meta_improvement_outcomes')
    .insert({
      tenant_id: tenantId,
      cycle_id: cycleId,
      label,
      metrics: snapshot,
      summary,
    })
    .select('*')
    .single();

  if (error || !data) throw error || new Error('Failed to capture outcome');

  // Log audit
  await logMetaAuditEvent({
    tenantId,
    actor: actor || 'system',
    source: 'improvement_loop',
    action: 'create',
    entityType: 'improvement_outcome',
    entityId: data.id,
    summary: `Captured improvement outcome: ${label}`,
    details: { label },
  }).catch(() => {});

  return {
    outcomeId: data.id,
    outcome: mapOutcomeRow(data),
  };
}

/**
 * Build meta outcome metrics snapshot from Z01-Z08
 * Aggregates current scores/statuses/counts from Z-series meta tables
 */
async function buildMetaOutcomeMetricsSnapshot(
  tenantId: string,
  cycleId: string
): Promise<any> {
  const supabase = getSupabaseServer();

  // Get cycle period for time-scoped queries
  const { data: cycle } = await supabase
    .from('guardian_meta_improvement_cycles')
    .select('period_start, period_end')
    .eq('tenant_id', tenantId)
    .eq('id', cycleId)
    .single();

  const periodStart = cycle?.period_start;
  const periodEnd = cycle?.period_end;

  const snapshot: Record<string, any> = {};

  // Z01: Readiness
  try {
    const { data: readiness } = await supabase
      .from('guardian_tenant_readiness_scores')
      .select('overall_guardian_score, status, details')
      .eq('tenant_id', tenantId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    if (readiness) {
      snapshot.readiness = {
        score: readiness.overall_guardian_score,
        status: readiness.status,
        capabilities: readiness.details?.capabilities || {},
      };
    }
  } catch {}

  // Z02: Uplift/Adoption
  try {
    const { data: uplift } = await supabase
      .from('guardian_tenant_uplift_plans')
      .select('status')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    const { data: adoption } = await supabase
      .from('guardian_tenant_adoption_scores')
      .select('adoption_rate')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    snapshot.adoption = {
      activePlansCount: (uplift || []).length,
      adoptionRate: adoption?.adoption_rate || 0,
    };
  } catch {}

  // Z03: Editions
  try {
    const { data: editions } = await supabase
      .from('guardian_tenant_editions_fit')
      .select('edition_key, fit_score')
      .eq('tenant_id', tenantId)
      .order('fit_score', { ascending: false })
      .limit(3);

    snapshot.editions = {
      topEditions: (editions || []).map((e) => ({
        key: e.edition_key,
        fitScore: e.fit_score,
      })),
    };
  } catch {}

  // Z08: Goals/KPIs (if available)
  try {
    const { data: goals } = await supabase
      .from('guardian_meta_program_goals')
      .select('status')
      .eq('tenant_id', tenantId);

    const onTrack = (goals || []).filter((g) => g.status === 'on_track').length;
    const total = (goals || []).length;

    snapshot.goals_okrs = {
      totalGoals: total,
      onTrackCount: onTrack,
      onTrackPct: total > 0 ? Math.round((onTrack / total) * 100) : 0,
    };
  } catch {}

  // Z10: Governance meta stack readiness
  try {
    const { data: prefs } = await supabase
      .from('guardian_meta_governance_prefs')
      .select('risk_posture, ai_usage_policy')
      .eq('tenant_id', tenantId)
      .single();

    snapshot.governance = {
      riskPosture: prefs?.risk_posture || 'standard',
      aiUsagePolicy: prefs?.ai_usage_policy || 'off',
    };
  } catch {}

  return {
    timestamp: new Date().toISOString(),
    period: { start: periodStart, end: periodEnd },
    ...snapshot,
  };
}

/**
 * Compute delta between two outcome snapshots
 */
function computeOutcomeDelta(current: any, previous?: any): any {
  if (!previous) {
    return { notes: 'baseline_outcome' };
  }

  const deltas: Record<string, any> = {};

  // Readiness delta
  if (current.readiness && previous.readiness) {
    deltas.readiness_delta =
      (current.readiness.score || 0) - (previous.readiness.score || 0);
  }

  // Adoption delta
  if (current.adoption && previous.adoption) {
    deltas.adoption_delta =
      (current.adoption.adoptionRate || 0) - (previous.adoption.adoptionRate || 0);
  }

  // Goals/KPIs delta
  if (current.goals_okrs && previous.goals_okrs) {
    deltas.kpi_on_track_pct_delta =
      (current.goals_okrs.onTrackPct || 0) - (previous.goals_okrs.onTrackPct || 0);
  }

  return deltas;
}

/**
 * Map database row to typed cycle
 */
function mapCycleRow(row: any): GuardianImprovementCycle {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    cycleKey: row.cycle_key,
    title: row.title,
    description: row.description,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status,
    focusDomains: row.focus_domains,
    owner: row.owner,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata,
  };
}

/**
 * Map database row to typed action
 */
function mapActionRow(row: any): GuardianImprovementAction {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    cycleId: row.cycle_id,
    actionKey: row.action_key,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date,
    evidenceLinks: row.evidence_links || [],
    relatedPlaybookKeys: row.related_playbook_keys || [],
    relatedGoalKpiKeys: row.related_goal_kpi_keys || [],
    expectedImpact: row.expected_impact || {},
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to typed outcome
 */
function mapOutcomeRow(row: any): GuardianImprovementOutcome {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    cycleId: row.cycle_id,
    label: row.label,
    metrics: row.metrics,
    summary: row.summary,
    capturedAt: row.captured_at,
    createdAt: row.created_at,
  };
}
