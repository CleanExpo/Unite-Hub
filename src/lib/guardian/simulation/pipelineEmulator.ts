/**
 * Guardian I02: Pipeline Emulator Core
 *
 * Emulates the full Guardian pipeline (rules → alerts → correlation → incidents → risk → notifications)
 * in an isolated sandbox using synthetic events.
 *
 * Does not write to production G-series tables.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { GuardianGeneratedEventSpec, loadGeneratedEventsForRun } from './eventGenerator';

export interface GuardianPipelineEmulationContext {
  tenantId: string;
  runId: string;
  scope: 'alerts_only' | 'incident_flow' | 'full_guardian';
  startTime: Date;
  endTime: Date;
}

export interface GuardianEmulationResultSummary {
  totalSyntheticEvents: number;
  simulatedAlerts: number;
  simulatedIncidents: number;
  simulatedCorrelations: number;
  simulatedRiskAdjustments: number;
  simulatedNotifications: number;
  warnings: string[];
}

interface EmulationState {
  eventsCounts: Map<string, number>;
  alertsBySeverity: Map<string, number>;
  incidentIds: Set<string>;
  correlationClusters: Array<{ ruleKey: string; count: number }>;
  riskScoreAdjustments: number;
  notificationCandidates: number;
}

/**
 * Record a trace entry in the pipeline trace log
 */
async function recordTrace(
  tenantId: string,
  runId: string,
  phase: string,
  stepIndex: number,
  occurredAt: Date,
  actor: string,
  message: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase.from('guardian_simulation_pipeline_traces').insert({
    tenant_id: tenantId,
    run_id: runId,
    phase,
    step_index: stepIndex,
    occurred_at: occurredAt.toISOString(),
    actor,
    message,
    details: details || {},
  });

  if (error) {
    console.error('Error recording trace:', error);
    // Don't throw; tracing is supplementary
  }
}

/**
 * Simulate rule evaluation phase
 */
async function simulateRuleEvaluation(
  context: GuardianPipelineEmulationContext,
  events: GuardianGeneratedEventSpec[],
  state: EmulationState
): Promise<number> {
  let stepIndex = 0;
  let alertCount = 0;

  for (const event of events) {
    if (event.generatedAt < context.startTime || event.generatedAt > context.endTime) {
      continue;
    }

    // Simulate rule evaluation
    state.eventsCounts.set(event.ruleKey, (state.eventsCounts.get(event.ruleKey) || 0) + 1);

    const severityCount = state.alertsBySeverity.get(event.severity) || 0;
    state.alertsBySeverity.set(event.severity, severityCount + 1);

    await recordTrace(
      context.tenantId,
      context.runId,
      'rule_eval',
      stepIndex++,
      event.generatedAt,
      'engine',
      `Rule '${event.ruleKey}' matched with severity ${event.severity}`,
      {
        ruleKey: event.ruleKey,
        severity: event.severity,
        synthetic: true,
      }
    );

    alertCount++;
  }

  await recordTrace(
    context.tenantId,
    context.runId,
    'alert_aggregate',
    stepIndex++,
    new Date(),
    'engine',
    `Aggregated ${alertCount} alerts from ${state.eventsCounts.size} distinct rules`,
    {
      totalAlerts: alertCount,
      distinctRules: state.eventsCounts.size,
    }
  );

  return alertCount;
}

/**
 * Simulate correlation phase
 */
async function simulateCorrelation(
  context: GuardianPipelineEmulationContext,
  alertCount: number,
  state: EmulationState
): Promise<number> {
  let stepIndex = 0;

  if (context.scope === 'alerts_only') {
    return 0;
  }

  // Simple clustering: group by ruleKey
  let correlationCount = 0;
  for (const [ruleKey, count] of state.eventsCounts) {
    if (count >= 2) {
      state.correlationClusters.push({ ruleKey, count });
      correlationCount++;

      await recordTrace(
        context.tenantId,
        context.runId,
        'correlation',
        stepIndex++,
        new Date(),
        'correlator',
        `Clustered ${count} alerts from rule '${ruleKey}'`,
        {
          ruleKey,
          clusterSize: count,
        }
      );
    }
  }

  await recordTrace(
    context.tenantId,
    context.runId,
    'correlation',
    stepIndex,
    new Date(),
    'correlator',
    `Correlation phase complete: ${correlationCount} clusters formed`,
    {
      clusterCount: correlationCount,
      totalClustered: state.correlationClusters.reduce((sum, c) => sum + c.count, 0),
    }
  );

  return correlationCount;
}

/**
 * Simulate incident creation phase
 */
async function simulateIncidents(
  context: GuardianPipelineEmulationContext,
  correlationCount: number,
  state: EmulationState
): Promise<number> {
  let stepIndex = 0;

  if (context.scope !== 'full_guardian') {
    return 0;
  }

  let incidentCount = 0;
  for (const cluster of state.correlationClusters) {
    const incidentId = `sim-incident-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    state.incidentIds.add(incidentId);
    incidentCount++;

    await recordTrace(
      context.tenantId,
      context.runId,
      'incident',
      stepIndex++,
      new Date(),
      'engine',
      `Created incident '${incidentId}' from cluster with rule '${cluster.ruleKey}' (${cluster.count} alerts)`,
      {
        incidentId,
        ruleKey: cluster.ruleKey,
        alertCount: cluster.count,
      }
    );
  }

  await recordTrace(
    context.tenantId,
    context.runId,
    'incident',
    stepIndex,
    new Date(),
    'engine',
    `Incident phase complete: ${incidentCount} incidents created`,
    {
      incidentCount,
    }
  );

  return incidentCount;
}

/**
 * Simulate risk scoring phase
 */
async function simulateRiskScoring(
  context: GuardianPipelineEmulationContext,
  incidentCount: number,
  state: EmulationState
): Promise<void> {
  let stepIndex = 0;

  if (context.scope !== 'full_guardian') {
    return;
  }

  // Simple risk model: aggregate severity levels
  let highRiskCount = 0;
  for (const [severity, count] of state.alertsBySeverity) {
    if (severity === 'critical') {
      highRiskCount += count * 3;
    } else if (severity === 'high') {
      highRiskCount += count * 2;
    } else if (severity === 'medium') {
      highRiskCount += count * 1;
    }
  }

  const riskAdjustment = Math.min(highRiskCount / 10, 100); // Cap at 100
  state.riskScoreAdjustments = riskAdjustment;

  await recordTrace(
    context.tenantId,
    context.runId,
    'risk',
    stepIndex++,
    new Date(),
    'risk_engine',
    `Risk score adjustment calculated: +${riskAdjustment.toFixed(1)} points`,
    {
      riskAdjustment: riskAdjustment.toFixed(1),
      highRiskMetric: highRiskCount,
      severity_breakdown: Object.fromEntries(state.alertsBySeverity),
    }
  );

  await recordTrace(
    context.tenantId,
    context.runId,
    'risk',
    stepIndex,
    new Date(),
    'risk_engine',
    `Risk scoring phase complete`,
    {
      finalRiskAdjustment: riskAdjustment.toFixed(1),
    }
  );
}

/**
 * Simulate notification phase
 */
async function simulateNotifications(
  context: GuardianPipelineEmulationContext,
  incidentCount: number,
  state: EmulationState
): Promise<number> {
  let stepIndex = 0;

  if (context.scope !== 'full_guardian') {
    return 0;
  }

  // Would send notifications for incidents
  let notificationCount = 0;
  for (const incidentId of state.incidentIds) {
    notificationCount++;

    await recordTrace(
      context.tenantId,
      context.runId,
      'notification',
      stepIndex++,
      new Date(),
      'notifier',
      `Would send notification for incident '${incidentId}' (modeled only, not dispatched)`,
      {
        incidentId,
        channels: ['email', 'slack'], // Modeled, not actual
      }
    );
  }

  await recordTrace(
    context.tenantId,
    context.runId,
    'notification',
    stepIndex,
    new Date(),
    'notifier',
    `Notification phase complete: ${notificationCount} notifications modeled (none dispatched)`,
    {
      notificationCount,
      dispatchedCount: 0,
    }
  );

  state.notificationCandidates = notificationCount;
  return notificationCount;
}

/**
 * Emulate the full pipeline for a simulation run
 */
export async function emulatePipelineForRun(
  context: GuardianPipelineEmulationContext
): Promise<GuardianEmulationResultSummary> {
  const state: EmulationState = {
    eventsCounts: new Map(),
    alertsBySeverity: new Map(),
    incidentIds: new Set(),
    correlationClusters: [],
    riskScoreAdjustments: 0,
    notificationCandidates: 0,
  };

  // Load synthetic events
  const events = await loadGeneratedEventsForRun(context.tenantId, context.runId);

  // Record emulation start
  await recordTrace(
    context.tenantId,
    context.runId,
    'ingest',
    0,
    context.startTime,
    'engine',
    `Pipeline emulation started: ${events.length} synthetic events loaded`,
    {
      scope: context.scope,
      eventCount: events.length,
    }
  );

  // Run phases
  const alertCount = await simulateRuleEvaluation(context, events, state);
  const correlationCount = await simulateCorrelation(context, alertCount, state);
  const incidentCount = await simulateIncidents(context, correlationCount, state);
  await simulateRiskScoring(context, incidentCount, state);
  const notificationCount = await simulateNotifications(context, incidentCount, state);

  // Record completion
  await recordTrace(
    context.tenantId,
    context.runId,
    'ingest',
    999,
    new Date(),
    'engine',
    `Pipeline emulation completed`,
    {
      scope: context.scope,
      alerts: alertCount,
      correlations: correlationCount,
      incidents: incidentCount,
      notifications: notificationCount,
    }
  );

  return {
    totalSyntheticEvents: events.length,
    simulatedAlerts: alertCount,
    simulatedIncidents: incidentCount,
    simulatedCorrelations: correlationCount,
    simulatedRiskAdjustments: Math.round(state.riskScoreAdjustments * 100) / 100,
    simulatedNotifications: notificationCount,
    warnings: events.length === 0 ? ['No synthetic events generated'] : [],
  };
}

/**
 * Pipeline emulation with virtual overrides (for I04 remediation simulation)
 * Applies remediation overrides in-memory; no production tables modified
 */
export async function pipelineEmulateWithOverrides(
  tenantId: string,
  baselineMetrics: {
    alerts_total: number;
    alerts_by_severity: Record<string, number>;
    incidents_total: number;
    incidents_by_status: Record<string, number>;
    correlations_total: number;
    notifications_total: number;
    avg_risk_score: number;
    window_days: number;
  },
  overrides: Record<string, unknown>
): Promise<{
  alerts_total: number;
  alerts_by_severity: Record<string, number>;
  incidents_total: number;
  incidents_by_status: Record<string, number>;
  correlations_total: number;
  notifications_total: number;
  avg_risk_score: number;
  window_days: number;
  computed_at: string;
}> {
  // For now, return a simplified simulation
  // In practice, this would re-run the full pipeline with overrides applied
  // This is a placeholder that estimates impact based on override types

  const disabledRules = (overrides.disabledRules as Set<string>) || new Set();
  const suppressedChannels = (overrides.suppressedNotificationChannels as Set<string>) || new Set();
  const ruleThresholdAdjustments = (overrides.ruleThresholdAdjustments as Map<string, number>) || new Map();

  // Estimate: disabling rules reduces alerts/incidents by ~10-15% per rule
  const rulesDisabledReduction = Math.min(disabledRules.size * 0.12, 0.5);

  // Estimate: increasing min link count reduces incidents/correlations by ~5-10%
  const minLinkCountReduction = (overrides.minLinkCountOverride as number) ? Math.min((overrides.minLinkCountOverride as number) * 0.05, 0.3) : 0;

  // Estimate: suppressing channels reduces notifications by ~80% per channel
  const notificationReduction = Math.min(suppressedChannels.size * 0.8, 1.0);

  // Apply reductions to baseline metrics
  const alertsReduced = Math.round(baselineMetrics.alerts_total * (1 - rulesDisabledReduction));
  const incidentsReduced = Math.round(baselineMetrics.incidents_total * (1 - rulesDisabledReduction - minLinkCountReduction));
  const correlationsReduced = Math.round(baselineMetrics.correlations_total * (1 - minLinkCountReduction));
  const notificationsReduced = Math.round(baselineMetrics.notifications_total * (1 - notificationReduction));

  // Estimate: risk score reduction proportional to alert/incident reduction
  const avgRiskReduction = (alertsReduced / baselineMetrics.alerts_total + incidentsReduced / baselineMetrics.incidents_total) / 2;
  const avgRiskScoreReduced = baselineMetrics.avg_risk_score * (1 - avgRiskReduction);

  return {
    alerts_total: alertsReduced,
    alerts_by_severity: baselineMetrics.alerts_by_severity, // Simplified: keep same distribution
    incidents_total: incidentsReduced,
    incidents_by_status: baselineMetrics.incidents_by_status,
    correlations_total: correlationsReduced,
    notifications_total: notificationsReduced,
    avg_risk_score: avgRiskScoreReduced,
    window_days: baselineMetrics.window_days,
    computed_at: new Date().toISOString(),
  };
}
