/**
 * Guardian I06: Gate Evaluation Engine
 *
 * Executes impact plans by running I03/I05 components and translating
 * results into gate decisions (allow/block/warn).
 *
 * Uses configurable thresholds for decision logic.
 */

import { GuardianImpactPlan } from './changeImpactPlanner';
import { type GuardianQaDriftResult } from './qaDriftEngine';

export interface GuardianGateConfig {
  failureOnCriticalDrift?: boolean;
  failureOnRegressionFail?: boolean;
  warnOnPlaybookExplosionFactor?: number;
  maxAllowedAlertsRelativeChange?: number;
  maxAllowedIncidentsRelativeChange?: number;
  maxAllowedRiskRelativeChange?: number;
}

export const DEFAULT_GATE_CONFIG: GuardianGateConfig = {
  failureOnCriticalDrift: true,
  failureOnRegressionFail: true,
  warnOnPlaybookExplosionFactor: 1.5,
  maxAllowedAlertsRelativeChange: 0.2, // 20%
  maxAllowedIncidentsRelativeChange: 0.25, // 25%
  maxAllowedRiskRelativeChange: 0.3, // 30%
};

export interface GuardianGateEvaluationResult {
  decision: 'allow' | 'block' | 'warn';
  reason: string;
  flags: string[];
  summary: Record<string, unknown>;
}

export interface GuardianGateEvaluationResponse {
  regressionRunId?: string;
  qaScheduleId?: string;
  driftReportId?: string;
  result: GuardianGateEvaluationResult;
}

/**
 * Evaluate impact plan by running I03/I05 simulations and checking results
 * against gate configuration thresholds
 */
export async function evaluateImpactPlan(
  tenantId: string,
  plan: GuardianImpactPlan,
  gateConfig: GuardianGateConfig = DEFAULT_GATE_CONFIG
): Promise<GuardianGateEvaluationResponse> {
  const flags: string[] = [];
  let decision: 'allow' | 'block' | 'warn' = 'allow';
  let reason = 'No issues detected in impact evaluation';

  // Mock implementation: In production, would call:
  // - regressionOrchestrator.executeRegressionRun() for each pack
  // - qaScheduleExecutor.runQaSchedule() for each schedule
  // - Inspect metrics and drift results

  const summary: Record<string, unknown> = {
    selectedPacks: plan.regressionPackIds,
    selectedChaosProfiles: plan.chaosProfileIds,
    selectedSchedules: plan.qaScheduleIds,
    options: plan.options,
    evaluationTime: new Date().toISOString(),
    flags,
  };

  // MOCK: Simulate a successful evaluation
  // In production, parse actual I03/I05 results
  const mockRegressionRunId = `run_${Date.now()}`;
  const mockMetrics = {
    alerts: { total: 2500, bySeverity: {} },
    incidents: { total: 45 },
    risk: { avgScore: 6.5, maxScore: 9.2 },
    notifications: { simulatedTotal: 150 },
  };

  // Check against thresholds
  if (
    gateConfig.maxAllowedAlertsRelativeChange &&
    mockMetrics.alerts.total > 2500 * (1 + gateConfig.maxAllowedAlertsRelativeChange)
  ) {
    flags.push('Alert volume exceeds acceptable threshold');
    if (!decision || decision === 'allow') {
      decision = 'warn';
      reason = 'Alert volume increased beyond configured threshold';
    }
  }

  // MOCK: Simulate detection of a concerning pattern
  // (In production, inspect actual drift reports)
  if (plan.options?.simulatePlaybooks) {
    flags.push('Playbook simulation enabled - results review recommended');
  }

  if (flags.length > 0 && decision === 'allow') {
    decision = 'warn';
    reason = `Gate evaluation found ${flags.length} warning(s)`;
  }

  (summary as Record<string, unknown>).flags = flags;

  return {
    regressionRunId: mockRegressionRunId,
    result: {
      decision,
      reason,
      flags,
      summary,
    },
  };
}

/**
 * Apply decision logic based on drift and regression results
 */
export function applyDecisionLogic(
  drift: GuardianQaDriftResult | null,
  regressionFailed: boolean,
  gateConfig: GuardianGateConfig = DEFAULT_GATE_CONFIG
): { decision: 'allow' | 'block' | 'warn'; flags: string[] } {
  const flags: string[] = [];
  let decision: 'allow' | 'block' | 'warn' = 'allow';

  // Check regression failure
  if (regressionFailed && gateConfig.failureOnRegressionFail) {
    flags.push('Regression pack execution failed');
    decision = 'block';
  }

  // Check drift severity
  if (drift) {
    if (drift.severity === 'critical' && gateConfig.failureOnCriticalDrift) {
      flags.push('Critical drift detected in impact assessment');
      decision = 'block';
    } else if (drift.severity === 'warning') {
      flags.push('Warning-level drift detected');
      if (decision !== 'block') {
        decision = 'warn';
      }
    } else if (drift.severity === 'info' && decision === 'allow') {
      // info-level is OK
    }
  }

  return { decision, flags };
}

/**
 * Format decision and flags into human-readable summary
 */
export function formatGateDecision(
  result: GuardianGateEvaluationResult
): string {
  const lines: string[] = [
    `**Gate Decision**: ${result.decision.toUpperCase()}`,
    `**Reason**: ${result.reason}`,
  ];

  if (result.flags.length > 0) {
    lines.push('**Flags**:');
    for (const flag of result.flags) {
      lines.push(`  - ${flag}`);
    }
  }

  return lines.join('\n');
}
