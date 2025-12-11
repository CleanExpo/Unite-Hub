/**
 * Guardian I05: QA Metrics Extractor
 *
 * Purpose:
 * Extract comparable aggregate metrics from I01–I04 simulation/regression/playbook runs
 * Provides common interface for baseline creation and drift comparison
 *
 * Metrics include: alert counts, incident counts, risk scores, notifications, playbook actions
 * No raw payloads, no PII, no production data
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Severity distribution: count of events/alerts by severity level
 */
export interface SeverityBreakdown {
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
}

/**
 * Rule-based breakdown: count by rule key
 */
export interface RuleBreakdown {
  [ruleKey: string]: number;
}

/**
 * Playbook evaluation metrics
 */
export interface PlaybookMetrics {
  totalEvaluated: number;
  totalActions: number;
  byPlaybookId?: {
    [playbookId: string]: {
      actions: number;
    };
  };
  overAutomationScore?: number;
  underAutomationScore?: number;
}

/**
 * Core QA metrics aggregated from simulation/regression runs
 * All counts and scores only; no raw payloads or PII
 */
export interface GuardianQaMetrics {
  alerts: {
    total: number;
    bySeverity: SeverityBreakdown;
    byRule: RuleBreakdown;
  };
  incidents: {
    total: number;
    byType?: {
      [type: string]: number;
    };
  };
  risk: {
    avgScore?: number;
    maxScore?: number;
    relativeChange?: number;
  };
  notifications: {
    simulatedTotal: number;
    byChannel?: {
      [channel: string]: number;
    };
  };
  playbooks?: PlaybookMetrics;
  extra?: Record<string, unknown>;
}

/**
 * Extract metrics from a regression run (I03)
 * Joins with underlying simulation runs and pipeline traces
 */
export async function extractMetricsFromRegressionRun(
  tenantId: string,
  regressionRunId: string
): Promise<GuardianQaMetrics> {
  const supabase = getSupabaseServer();

  // Query regression run to get impact_estimate and related run IDs
  const { data: regressionRun, error: regressionError } = await supabase
    .from('guardian_regression_runs')
    .select('impact_estimate, metadata')
    .eq('tenant_id', tenantId)
    .eq('id', regressionRunId)
    .single();

  if (regressionError || !regressionRun) {
    throw new Error(`Regression run ${regressionRunId} not found: ${regressionError?.message}`);
  }

  // Extract metrics from impact_estimate (from I01 dryRunEngine output)
  const impactEstimate = regressionRun.impact_estimate || {};

  const metrics: GuardianQaMetrics = {
    alerts: {
      total: impactEstimate.alerts?.total || 0,
      bySeverity: impactEstimate.alerts?.bySeverity || {},
      byRule: impactEstimate.alerts?.byRule || {},
    },
    incidents: {
      total: impactEstimate.incidents?.total || 0,
      byType: impactEstimate.incidents?.byType || {},
    },
    risk: {
      avgScore: impactEstimate.risk?.avgScore,
      maxScore: impactEstimate.risk?.maxScore,
      relativeChange: impactEstimate.risk?.relativeChange,
    },
    notifications: {
      simulatedTotal: impactEstimate.notifications?.simulatedTotal || 0,
      byChannel: impactEstimate.notifications?.byChannel || {},
    },
  };

  // If playbook metrics present, include them
  if (impactEstimate.playbooks) {
    metrics.playbooks = impactEstimate.playbooks;
  }

  // Store any extra metrics from metadata
  if (regressionRun.metadata?.extraMetrics) {
    metrics.extra = regressionRun.metadata.extraMetrics;
  }

  return metrics;
}

/**
 * Extract metrics from an isolated simulation run (I01/I02)
 */
export async function extractMetricsFromSimulationRun(
  tenantId: string,
  simulationRunId: string
): Promise<GuardianQaMetrics> {
  const supabase = getSupabaseServer();

  // Query simulation run and aggregated pipeline trace data
  const { data: simulationRun, error: simError } = await supabase
    .from('guardian_simulation_runs')
    .select('impact_estimate, metadata')
    .eq('tenant_id', tenantId)
    .eq('id', simulationRunId)
    .single();

  if (simError || !simulationRun) {
    throw new Error(`Simulation run ${simulationRunId} not found: ${simError?.message}`);
  }

  // Metrics from impact_estimate or emulator summary
  const impactEstimate = simulationRun.impact_estimate || {};

  const metrics: GuardianQaMetrics = {
    alerts: {
      total: impactEstimate.alerts?.total || 0,
      bySeverity: impactEstimate.alerts?.bySeverity || {},
      byRule: impactEstimate.alerts?.byRule || {},
    },
    incidents: {
      total: impactEstimate.incidents?.total || 0,
      byType: impactEstimate.incidents?.byType || {},
    },
    risk: {
      avgScore: impactEstimate.risk?.avgScore,
      maxScore: impactEstimate.risk?.maxScore,
    },
    notifications: {
      simulatedTotal: impactEstimate.notifications?.simulatedTotal || 0,
    },
  };

  return metrics;
}

/**
 * Extract metrics from a playbook simulation run (I04)
 * Focuses on playbook evaluation, actions, and automation scores
 */
export async function extractMetricsFromPlaybookSimulationRun(
  tenantId: string,
  playbookSimRunId: string
): Promise<GuardianQaMetrics> {
  const supabase = getSupabaseServer();

  // Query playbook sim run
  const { data: playbookSimRun, error: pbError } = await supabase
    .from('guardian_playbook_simulation_runs')
    .select('impact_estimate, playbook_evaluations, action_simulations, metadata')
    .eq('tenant_id', tenantId)
    .eq('id', playbookSimRunId)
    .single();

  if (pbError || !playbookSimRun) {
    throw new Error(
      `Playbook simulation run ${playbookSimRunId} not found: ${pbError?.message}`
    );
  }

  // Aggregate playbook action counts
  const actionSims = playbookSimRun.action_simulations || [];
  const totalActions = actionSims.length;

  const byPlaybookId: Record<string, { actions: number }> = {};
  for (const action of actionSims) {
    const pid = action.playbook_id;
    if (!byPlaybookId[pid]) {
      byPlaybookId[pid] = { actions: 0 };
    }
    byPlaybookId[pid].actions += 1;
  }

  const playbookEvals = playbookSimRun.playbook_evaluations || {};
  const totalEvaluated = Object.keys(playbookEvals).length;

  const metrics: GuardianQaMetrics = {
    alerts: {
      total: 0,
      bySeverity: {},
      byRule: {},
    },
    incidents: {
      total: 0,
    },
    risk: {},
    notifications: {
      simulatedTotal: 0,
    },
    playbooks: {
      totalEvaluated,
      totalActions,
      byPlaybookId,
      overAutomationScore: playbookSimRun.metadata?.overAutomationScore,
      underAutomationScore: playbookSimRun.metadata?.underAutomationScore,
    },
  };

  return metrics;
}

/**
 * Consolidate multiple metrics into a single aggregate
 * Useful when a regression pack spans multiple scenarios or runs
 */
export function consolidateMetrics(metricsArray: GuardianQaMetrics[]): GuardianQaMetrics {
  if (metricsArray.length === 0) {
    return {
      alerts: { total: 0, bySeverity: {}, byRule: {} },
      incidents: { total: 0 },
      risk: {},
      notifications: { simulatedTotal: 0 },
    };
  }

  const consolidated: GuardianQaMetrics = {
    alerts: {
      total: 0,
      bySeverity: {},
      byRule: {},
    },
    incidents: {
      total: 0,
      byType: {},
    },
    risk: {
      avgScore: 0,
      maxScore: 0,
    },
    notifications: {
      simulatedTotal: 0,
      byChannel: {},
    },
  };

  let totalRiskScores = 0;
  let riskScoreCount = 0;
  let maxRiskScore = 0;

  let totalPlaybookActions = 0;
  let totalPlaybookEvaluated = 0;
  const playbookByIdMap: Record<string, { actions: number }> = {};

  for (const m of metricsArray) {
    // Alerts
    consolidated.alerts.total += m.alerts.total;
    for (const [severity, count] of Object.entries(m.alerts.bySeverity)) {
      consolidated.alerts.bySeverity[severity] =
        (consolidated.alerts.bySeverity[severity] || 0) + (count || 0);
    }
    for (const [rule, count] of Object.entries(m.alerts.byRule)) {
      consolidated.alerts.byRule[rule] =
        (consolidated.alerts.byRule[rule] || 0) + (count || 0);
    }

    // Incidents
    consolidated.incidents.total += m.incidents.total;
    if (m.incidents.byType) {
      for (const [type, count] of Object.entries(m.incidents.byType)) {
        consolidated.incidents.byType![type] =
          (consolidated.incidents.byType![type] || 0) + count;
      }
    }

    // Risk
    if (m.risk.avgScore !== undefined) {
      totalRiskScores += m.risk.avgScore;
      riskScoreCount += 1;
    }
    if (m.risk.maxScore !== undefined) {
      maxRiskScore = Math.max(maxRiskScore, m.risk.maxScore);
    }

    // Notifications
    consolidated.notifications.simulatedTotal += m.notifications.simulatedTotal;
    if (m.notifications.byChannel) {
      for (const [channel, count] of Object.entries(m.notifications.byChannel)) {
        consolidated.notifications.byChannel![channel] =
          (consolidated.notifications.byChannel![channel] || 0) + count;
      }
    }

    // Playbooks
    if (m.playbooks) {
      totalPlaybookEvaluated += m.playbooks.totalEvaluated;
      totalPlaybookActions += m.playbooks.totalActions;
      if (m.playbooks.byPlaybookId) {
        for (const [pbId, stats] of Object.entries(m.playbooks.byPlaybookId)) {
          if (!playbookByIdMap[pbId]) {
            playbookByIdMap[pbId] = { actions: 0 };
          }
          playbookByIdMap[pbId].actions += stats.actions;
        }
      }
    }
  }

  // Finalize aggregates
  if (riskScoreCount > 0) {
    consolidated.risk.avgScore = totalRiskScores / riskScoreCount;
  }
  if (maxRiskScore > 0) {
    consolidated.risk.maxScore = maxRiskScore;
  }

  if (totalPlaybookEvaluated > 0 || totalPlaybookActions > 0) {
    consolidated.playbooks = {
      totalEvaluated: totalPlaybookEvaluated,
      totalActions: totalPlaybookActions,
      byPlaybookId: playbookByIdMap,
    };
  }

  return consolidated;
}

/**
 * Safe metrics merging with null/undefined checks
 */
export function mergeMetrics(...metricsList: (GuardianQaMetrics | null | undefined)[]): GuardianQaMetrics {
  const filtered = metricsList.filter((m) => m !== null && m !== undefined) as GuardianQaMetrics[];
  return consolidateMetrics(filtered);
}
