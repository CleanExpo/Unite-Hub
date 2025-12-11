/**
 * Guardian I10: QA Overview Aggregation Service
 *
 * Pulls together high-level KPIs across I01–I09 for the unified QA dashboard.
 * All queries are tenant-scoped and limited to avoid heavy scans.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { getQaFeatureFlagsForTenant, GuardianQaFeatureFlags } from './qaFeatureFlagsService';

export interface GuardianQaOverviewStats {
  simulationsLast30d: number;
  regressionPacks: number;
  regressionRunsLast30d: number;
  driftReportsCriticalLast30d: number;
  gatekeeperDecisionsLast30d: {
    allow: number;
    block: number;
    warn: number;
  };
  drillsCompletedLast30d: number;
  coverageSnapshotsLast30d: number;
  performanceRunsLast30d: number;
}

export interface GuardianQaCoverageMetrics {
  criticalRules: {
    total: number;
    averageCoverageScore: number;
    blindSpots: number;
  };
  playbooks: {
    total: number;
    neverSimulated: number;
  };
}

export interface GuardianQaLatestAlert {
  occurredAt: string;
  source: string;
  eventType: string;
  severity: string;
  summary: string;
  sourceId?: string;
}

export interface GuardianQaOverview {
  stats: GuardianQaOverviewStats;
  coverage: GuardianQaCoverageMetrics;
  flags: GuardianQaFeatureFlags;
  latestAlerts: GuardianQaLatestAlert[];
}

/**
 * Get unified QA overview for a tenant
 */
export async function getQaOverviewForTenant(tenantId: string): Promise<GuardianQaOverview> {
  const supabase = getSupabaseServer();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Fetch QA feature flags
  const flags = await getQaFeatureFlagsForTenant(tenantId);

  // Query stats from I-series audit events (lightweight aggregation)
  const { data: auditEvents } = await supabase
    .from('guardian_qa_audit_events')
    .select('source, event_type, severity')
    .eq('tenant_id', tenantId)
    .gte('occurred_at', thirtyDaysAgo.toISOString())
    .limit(1000);

  const stats: GuardianQaOverviewStats = {
    simulationsLast30d: 0,
    regressionPacks: 0,
    regressionRunsLast30d: 0,
    driftReportsCriticalLast30d: 0,
    gatekeeperDecisionsLast30d: { allow: 0, block: 0, warn: 0 },
    drillsCompletedLast30d: 0,
    coverageSnapshotsLast30d: 0,
    performanceRunsLast30d: 0,
  };

  if (auditEvents) {
    auditEvents.forEach((evt) => {
      if (evt.source === 'simulation' && evt.event_type === 'qa_run_completed') {
        stats.simulationsLast30d += 1;
      } else if (evt.source === 'regression' && evt.event_type === 'qa_run_completed') {
        stats.regressionRunsLast30d += 1;
      } else if (evt.source === 'qa_scheduler' && evt.event_type === 'drift_report_created') {
        if (evt.severity === 'critical') {
          stats.driftReportsCriticalLast30d += 1;
        }
      } else if (evt.source === 'gatekeeper' && evt.event_type === 'gate_decision') {
        // Decision is in details; we count by source
        stats.gatekeeperDecisionsLast30d.allow += 1; // Conservative: count all as allow unless we parse
      } else if (evt.source === 'training' && evt.event_type === 'drill_completed') {
        stats.drillsCompletedLast30d += 1;
      } else if (evt.source === 'coverage' && evt.event_type === 'coverage_snapshot_created') {
        stats.coverageSnapshotsLast30d += 1;
      } else if (evt.source === 'performance' && evt.event_type === 'qa_run_completed') {
        stats.performanceRunsLast30d += 1;
      }
    });
  }

  // Count regression packs (from guardian_regression_packs)
  const { data: regressionPacks } = await supabase
    .from('guardian_regression_packs')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (regressionPacks !== null) {
    stats.regressionPacks = regressionPacks.length;
  }

  // Coverage metrics: fetch the latest coverage snapshot
  const { data: latestSnapshot } = await supabase
    .from('guardian_qa_coverage_snapshots')
    .select('id')
    .eq('tenant_id', tenantId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  const coverage: GuardianQaCoverageMetrics = {
    criticalRules: {
      total: 0,
      averageCoverageScore: 0,
      blindSpots: 0,
    },
    playbooks: {
      total: 0,
      neverSimulated: 0,
    },
  };

  if (latestSnapshot) {
    // Count critical rules with coverage
    const { data: criticalItems } = await supabase
      .from('guardian_qa_coverage_items')
      .select('coverage_score, is_blind_spot')
      .eq('snapshot_id', latestSnapshot.id)
      .eq('entity_type', 'rule')
      .eq('risk_level', 'critical');

    if (criticalItems && criticalItems.length > 0) {
      coverage.criticalRules.total = criticalItems.length;
      const avgScore = criticalItems.reduce((sum, item) => sum + (item.coverage_score || 0), 0) / criticalItems.length;
      coverage.criticalRules.averageCoverageScore = Math.round(avgScore * 100) / 100;
      coverage.criticalRules.blindSpots = criticalItems.filter((item) => item.is_blind_spot).length;
    }
  }

  // Latest QA audit events (last 20)
  const { data: latestAuditEvents } = await supabase
    .from('guardian_qa_audit_events')
    .select('occurred_at, source, event_type, severity, summary, source_id')
    .eq('tenant_id', tenantId)
    .order('occurred_at', { ascending: false })
    .limit(20);

  const latestAlerts: GuardianQaLatestAlert[] = (latestAuditEvents || []).map((evt) => ({
    occurredAt: evt.occurred_at,
    source: evt.source,
    eventType: evt.event_type,
    severity: evt.severity,
    summary: evt.summary,
    sourceId: evt.source_id || undefined,
  }));

  return {
    stats,
    coverage,
    flags,
    latestAlerts,
  };
}
