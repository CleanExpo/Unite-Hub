/**
 * Guardian Z14: Status Page Aggregator Service
 * Aggregates Z01-Z13 meta signals into role-safe status cards
 * Operator (detailed) → Leadership (executive) → CS (customer-safe)
 */

import { getSupabaseServer } from '@/lib/supabase';
import { computeMetaStackReadiness } from './metaStackReadinessService';
import { loadMetaGovernancePrefsForTenant } from './metaGovernanceService';
import { logMetaAuditEvent } from './metaAuditService';

export type ViewType = 'operator' | 'leadership' | 'cs';
export type PeriodLabel = 'last_7d' | 'last_30d' | 'quarter_to_date';
export type CardStatus = 'good' | 'warn' | 'bad' | 'info';

export interface StatusCard {
  key: string;
  title: string;
  status: CardStatus;
  value?: string;
  details?: string;
  links?: Array<{
    label: string;
    href: string;
  }>;
}

export interface StatusPageView {
  overallStatus: 'experimental' | 'limited' | 'recommended' | 'needs_attention';
  headline: string;
  cards: StatusCard[];
  blockers: string[];
  warnings: string[];
  periodLabel: PeriodLabel;
  viewType: ViewType;
  capturedAt: Date;
}

/**
 * Load meta state for status aggregation
 * Collects PII-free summaries from Z01-Z13
 */
export async function loadMetaStateForStatus(
  tenantId: string,
  period: { start: Date; end: Date }
): Promise<{
  readinessScore?: number;
  readinessStatus?: string;
  adoptionRate?: number;
  upliftActivePlans?: number;
  upliftCompletionRatio?: number;
  kpiOnTrackPercent?: number;
  integrationsConfigured?: number;
  integrationsRecentFailures?: number;
  exportsBundleAge?: number;
  improvementCyclesActive?: number;
  improvementOutcomeAge?: number;
  automationLastExecutionAge?: number;
  automationSchedulesActive?: number;
  stackOverallStatus?: string;
  stackBlockers?: string[];
  stackWarnings?: string[];
}> {
  const supabase = getSupabaseServer();
  const state: any = {};

  try {
    // Z01: Readiness
    const { data: readiness } = await supabase
      .from('guardian_tenant_readiness_scores')
      .select('overall_guardian_score, status')
      .eq('tenant_id', tenantId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    if (readiness) {
      state.readinessScore = readiness.overall_guardian_score;
      state.readinessStatus = readiness.status;
    }

    // Z05: Adoption
    const { data: adoption } = await supabase
      .from('guardian_tenant_adoption_scores')
      .select('adoption_rate')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (adoption) {
      state.adoptionRate = adoption.adoption_rate;
    }

    // Z02: Uplift
    const { data: upliftPlans } = await supabase
      .from('guardian_tenant_uplift_plans')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (upliftPlans) {
      state.upliftActivePlans = upliftPlans.length;
    }

    // Z08: KPIs
    const { data: kpis } = await supabase
      .from('guardian_meta_program_goals')
      .select('status')
      .eq('tenant_id', tenantId);

    if (kpis && kpis.length > 0) {
      const onTrack = kpis.filter((k) => k.status === 'on_track').length;
      state.kpiOnTrackPercent = Math.round((onTrack / kpis.length) * 100);
    }

    // Z07: Integrations (meta-only: counts, no URLs)
    const { data: integrations } = await supabase
      .from('guardian_meta_integrations')
      .select('id, status')
      .eq('tenant_id', tenantId);

    if (integrations) {
      state.integrationsConfigured = integrations.length;
      state.integrationsRecentFailures = integrations.filter((i) => i.status === 'failed').length;
    }

    // Z11: Exports
    const { data: exports } = await supabase
      .from('guardian_meta_export_bundles')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (exports) {
      const ageMs = Date.now() - new Date(exports.created_at).getTime();
      state.exportsBundleAge = Math.floor(ageMs / (1000 * 60 * 60 * 24)); // Days
    }

    // Z12: Improvement Loop
    const { data: cycles } = await supabase
      .from('guardian_meta_improvement_cycles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (cycles) {
      state.improvementCyclesActive = cycles.length;
    }

    const { data: outcomes } = await supabase
      .from('guardian_meta_improvement_outcomes')
      .select('captured_at')
      .eq('tenant_id', tenantId)
      .order('captured_at', { ascending: false })
      .limit(1)
      .single();

    if (outcomes) {
      const ageMs = Date.now() - new Date(outcomes.captured_at).getTime();
      state.improvementOutcomeAge = Math.floor(ageMs / (1000 * 60 * 60 * 24)); // Days
    }

    // Z13: Automation
    const { data: automationSchedules } = await supabase
      .from('guardian_meta_automation_schedules')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (automationSchedules) {
      state.automationSchedulesActive = automationSchedules.length;
    }

    const { data: automationExecutions } = await supabase
      .from('guardian_meta_automation_executions')
      .select('started_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (automationExecutions) {
      const ageMs = Date.now() - new Date(automationExecutions.started_at).getTime();
      state.automationLastExecutionAge = Math.floor(ageMs / (1000 * 60 * 60 * 24)); // Days
    }

    // Z10: Stack Readiness
    const stackReadiness = await computeMetaStackReadiness(tenantId);
    state.stackOverallStatus = stackReadiness.overallStatus;
    state.stackBlockers = stackReadiness.blockers;
    state.stackWarnings = stackReadiness.warnings;
  } catch (error) {
    console.error('[Z14 Status Page] Error loading meta state:', error);
  }

  return state;
}

/**
 * Build role-safe status cards from meta state
 */
export function buildStatusCards(
  viewType: ViewType,
  metaState: any,
  governancePrefs?: { externalSharingPolicy: string }
): StatusPageView {
  const cards: StatusCard[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];
  let overallStatus: 'experimental' | 'limited' | 'recommended' | 'needs_attention' = 'experimental';

  // Determine overall status from readiness and stack
  if (metaState.readinessScore !== undefined) {
    if (metaState.readinessScore >= 75) overallStatus = 'recommended';
    else if (metaState.readinessScore >= 50) overallStatus = 'limited';
    else overallStatus = 'needs_attention';
  }

  const sharingPolicy = governancePrefs?.externalSharingPolicy || 'internal_only';
  const canShare = sharingPolicy !== 'internal_only';

  // ===== READINESS CARD =====
  if (metaState.readinessScore !== undefined) {
    const score = metaState.readinessScore;
    cards.push({
      key: 'readiness',
      title: 'Guardian Readiness',
      status: score >= 75 ? 'good' : score >= 50 ? 'warn' : 'bad',
      value: `${score}%`,
      details: metaState.readinessStatus || 'In progress',
      links:
        viewType === 'operator'
          ? [{ label: 'View Details', href: '/guardian/admin/readiness' }]
          : undefined,
    });
  }

  // ===== ADOPTION CARD =====
  if (metaState.adoptionRate !== undefined) {
    const rate = metaState.adoptionRate;
    cards.push({
      key: 'adoption',
      title: 'Team Adoption',
      status: rate >= 60 ? 'good' : rate >= 40 ? 'warn' : 'bad',
      value: `${rate}%`,
      details: 'Active users and engagement',
      links:
        viewType === 'operator'
          ? [{ label: 'View Details', href: '/guardian/admin/adoption' }]
          : undefined,
    });
  }

  // ===== KPIs CARD =====
  if (metaState.kpiOnTrackPercent !== undefined) {
    const onTrack = metaState.kpiOnTrackPercent;
    cards.push({
      key: 'kpis',
      title: 'Program KPIs',
      status: onTrack >= 70 ? 'good' : onTrack >= 50 ? 'warn' : 'bad',
      value: `${onTrack}% on track`,
      details: 'Goals and objectives status',
      links:
        viewType === 'operator'
          ? [{ label: 'View Goals', href: '/guardian/admin/goals' }]
          : undefined,
    });
  }

  // ===== UPLIFT CARD =====
  if (metaState.upliftActivePlans !== undefined) {
    cards.push({
      key: 'uplift',
      title: 'Active Uplift Plans',
      status: metaState.upliftActivePlans > 0 ? 'good' : 'info',
      value: `${metaState.upliftActivePlans}`,
      details: 'Ongoing improvement initiatives',
      links:
        viewType === 'operator'
          ? [{ label: 'View Plans', href: '/guardian/admin/uplift' }]
          : undefined,
    });
  }

  // ===== IMPROVEMENT LOOP CARD =====
  if (metaState.improvementCyclesActive !== undefined) {
    cards.push({
      key: 'improvement',
      title: 'Improvement Cycles',
      status: metaState.improvementCyclesActive > 0 ? 'good' : 'info',
      value: `${metaState.improvementCyclesActive} active`,
      details:
        metaState.improvementOutcomeAge !== undefined
          ? `Last outcome: ${metaState.improvementOutcomeAge} days ago`
          : 'Tracking improvements',
      links:
        viewType === 'operator'
          ? [{ label: 'View Cycles', href: '/guardian/admin/improvement' }]
          : undefined,
    });
  }

  // ===== AUTOMATION CARD =====
  if (metaState.automationSchedulesActive !== undefined) {
    cards.push({
      key: 'automation',
      title: 'Automation Schedules',
      status: metaState.automationSchedulesActive > 0 ? 'good' : 'info',
      value: `${metaState.automationSchedulesActive} active`,
      details:
        metaState.automationLastExecutionAge !== undefined
          ? `Last run: ${metaState.automationLastExecutionAge} days ago`
          : 'Meta evaluation automation',
      links:
        viewType === 'operator'
          ? [{ label: 'View Automation', href: '/guardian/admin/automation' }]
          : undefined,
    });
  }

  // ===== EXPORTS CARD =====
  if (canShare && metaState.exportsBundleAge !== undefined) {
    cards.push({
      key: 'exports',
      title: 'Meta Exports',
      status: metaState.exportsBundleAge <= 7 ? 'good' : metaState.exportsBundleAge <= 30 ? 'warn' : 'info',
      value: `${metaState.exportsBundleAge} days old`,
      details: 'Latest bundle age',
      links:
        viewType === 'operator'
          ? [{ label: 'View Exports', href: '/guardian/admin/exports' }]
          : undefined,
    });
  }

  // ===== INTEGRATIONS CARD =====
  if (viewType === 'operator' && metaState.integrationsConfigured !== undefined) {
    cards.push({
      key: 'integrations',
      title: 'Integrations',
      status:
        metaState.integrationsRecentFailures && metaState.integrationsRecentFailures > 0
          ? 'warn'
          : 'good',
      value: `${metaState.integrationsConfigured} configured`,
      details:
        metaState.integrationsRecentFailures > 0
          ? `${metaState.integrationsRecentFailures} recent failures`
          : 'All healthy',
      links: [{ label: 'Manage', href: '/guardian/admin/integrations' }],
    });
  }

  // Blockers and warnings
  if (metaState.stackBlockers) {
    blockers.push(...metaState.stackBlockers.slice(0, 3));
  }

  if (metaState.stackWarnings) {
    warnings.push(...metaState.stackWarnings.slice(0, 5));
  }

  // Determine headline
  let headline = 'Guardian meta stack status';
  if (overallStatus === 'recommended') {
    headline = 'All systems nominal';
  } else if (overallStatus === 'limited') {
    headline = 'Some areas need attention';
  } else if (overallStatus === 'needs_attention') {
    headline = 'Critical attention required';
  }

  return {
    overallStatus,
    headline,
    cards,
    blockers,
    warnings,
    periodLabel: 'last_30d',
    viewType,
    capturedAt: new Date(),
  };
}

/**
 * Capture a status snapshot (persist to DB)
 */
export async function captureStatusSnapshot(
  tenantId: string,
  viewType: ViewType,
  periodLabel: PeriodLabel,
  actor: string = 'system'
): Promise<{ snapshotId: string }> {
  const supabase = getSupabaseServer();

  try {
    // Load governance prefs
    const { data: prefs } = await supabase
      .from('guardian_meta_governance_prefs')
      .select('external_sharing_policy')
      .eq('tenant_id', tenantId)
      .single();

    // Compute period range
    const end = new Date();
    const start = new Date();

    if (periodLabel === 'last_7d') {
      start.setDate(start.getDate() - 7);
    } else if (periodLabel === 'last_30d') {
      start.setDate(start.getDate() - 30);
    } else if (periodLabel === 'quarter_to_date') {
      const q = Math.floor((end.getMonth() + 1) / 3);
      start.setMonth((q - 1) * 3, 1);
    }

    // Load meta state
    const metaState = await loadMetaStateForStatus(tenantId, { start, end });

    // Build cards
    const view = buildStatusCards(viewType, metaState, prefs);

    // Store snapshot
    const { data: snapshot, error } = await supabase
      .from('guardian_meta_status_snapshots')
      .insert({
        tenant_id: tenantId,
        view_type: viewType,
        period_label: periodLabel,
        overall_status: view.overallStatus,
        headline: view.headline,
        cards: view.cards,
        blockers: view.blockers,
        warnings: view.warnings,
      })
      .select('id')
      .single();

    if (error || !snapshot) throw error || new Error('Failed to create snapshot');

    // Audit log
    await logMetaAuditEvent({
      tenantId,
      actor,
      source: 'status_page',
      action: 'capture',
      entityType: 'snapshot',
      entityId: snapshot.id,
      summary: `Captured ${viewType} status snapshot for ${periodLabel}`,
      details: {
        viewType,
        periodLabel,
        overallStatus: view.overallStatus,
      },
    });

    return { snapshotId: snapshot.id };
  } catch (error) {
    console.error('[Z14 Status Page] Snapshot capture failed:', error);
    throw error;
  }
}
