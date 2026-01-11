/**
 * Guardian I04: Remediation Simulation Engine
 *
 * Applies remediation actions virtually to the Guardian pipeline emulator
 * and measures simulated impact. No production tables modified.
 *
 * Simulation: Run Guardian pipeline with virtual overrides (in-memory only),
 * capture metrics, compute deltas vs baseline.
 */

import { GuardianRemediationPlaybookConfig, GuardianRemediationAction } from './remediationPlaybookTypes';
import { BaselineMetrics, getBaselineMetrics } from './baselineMetrics';
import { pipelineEmulateWithOverrides } from './pipelineEmulator';

export interface SimulatedMetrics {
  alerts_total: number;
  alerts_by_severity: Record<string, number>;
  incidents_total: number;
  incidents_by_status: Record<string, number>;
  correlations_total: number;
  notifications_total: number;
  avg_risk_score: number;
  window_days: number;
  computed_at: string;
}

export interface DeltaMetrics {
  alerts_delta: number;
  alerts_pct: number;
  incidents_delta: number;
  incidents_pct: number;
  correlations_delta: number;
  correlations_pct: number;
  notifications_delta: number;
  notifications_pct: number;
  avg_risk_score_delta: number;
  avg_risk_score_pct: number;
}

export interface RemediationSimulationResult {
  baseline: BaselineMetrics;
  simulated: SimulatedMetrics;
  delta: DeltaMetrics;
  overall_effect: 'positive' | 'neutral' | 'negative';
  summary: string;
}

/**
 * Compute delta metrics between baseline and simulated
 */
export function computeDeltaMetrics(baseline: BaselineMetrics, simulated: SimulatedMetrics): DeltaMetrics {
  // Helper: safe division
  const safeDiv = (numerator: number, denominator: number): number => {
    return denominator === 0 ? 0 : (numerator / denominator) * 100;
  };

  return {
    alerts_delta: simulated.alerts_total - baseline.alerts_total,
    alerts_pct: safeDiv(simulated.alerts_total - baseline.alerts_total, baseline.alerts_total),
    incidents_delta: simulated.incidents_total - baseline.incidents_total,
    incidents_pct: safeDiv(simulated.incidents_total - baseline.incidents_total, baseline.incidents_total),
    correlations_delta: simulated.correlations_total - baseline.correlations_total,
    correlations_pct: safeDiv(simulated.correlations_total - baseline.correlations_total, baseline.correlations_total),
    notifications_delta: simulated.notifications_total - baseline.notifications_total,
    notifications_pct: safeDiv(simulated.notifications_total - baseline.notifications_total, baseline.notifications_total),
    avg_risk_score_delta: simulated.avg_risk_score - baseline.avg_risk_score,
    avg_risk_score_pct: safeDiv(simulated.avg_risk_score - baseline.avg_risk_score, baseline.avg_risk_score),
  };
}

/**
 * Classify overall effect (improvement vs degradation)
 * Thresholds:
 * - Positive: alerts/incidents decreased by >=10% OR risk score decreased by >=5%
 * - Negative: alerts/incidents increased by >=10% OR risk score increased by >=5%
 * - Neutral: otherwise
 */
export function classifyEffect(delta: DeltaMetrics): 'positive' | 'neutral' | 'negative' {
  const IMPROVEMENT_THRESHOLD = -10; // negative % = improvement
  const DEGRADATION_THRESHOLD = 10;  // positive % = degradation
  const RISK_IMPROVEMENT_THRESHOLD = -5;
  const RISK_DEGRADATION_THRESHOLD = 5;

  const hasImprovement =
    delta.alerts_pct <= IMPROVEMENT_THRESHOLD ||
    delta.incidents_pct <= IMPROVEMENT_THRESHOLD ||
    delta.avg_risk_score_pct <= RISK_IMPROVEMENT_THRESHOLD;

  const hasDegradation =
    delta.alerts_pct >= DEGRADATION_THRESHOLD ||
    delta.incidents_pct >= DEGRADATION_THRESHOLD ||
    delta.avg_risk_score_pct >= RISK_DEGRADATION_THRESHOLD;

  if (hasImprovement && !hasDegradation) {
return 'positive';
}
  if (hasDegradation && !hasImprovement) {
return 'negative';
}
  return 'neutral';
}

/**
 * Generate human-readable summary
 */
function generateSummary(baseline: BaselineMetrics, delta: DeltaMetrics, effect: 'positive' | 'neutral' | 'negative'): string {
  const parts: string[] = [];

  parts.push(`Overall Effect: ${effect.toUpperCase()}`);

  // Alert impact
  if (delta.alerts_delta !== 0) {
    const direction = delta.alerts_delta < 0 ? 'decrease' : 'increase';
    parts.push(`Alerts would ${direction} by ${Math.abs(delta.alerts_delta)} (${delta.alerts_pct.toFixed(1)}%)`);
  }

  // Incident impact
  if (delta.incidents_delta !== 0) {
    const direction = delta.incidents_delta < 0 ? 'decrease' : 'increase';
    parts.push(`Incidents would ${direction} by ${Math.abs(delta.incidents_delta)} (${delta.incidents_pct.toFixed(1)}%)`);
  }

  // Notification impact
  if (delta.notifications_delta !== 0) {
    const direction = delta.notifications_delta < 0 ? 'decrease' : 'increase';
    parts.push(`Notifications would ${direction} by ${Math.abs(delta.notifications_delta)} (${delta.notifications_pct.toFixed(1)}%)`);
  }

  // Risk score impact
  if (delta.avg_risk_score_delta !== 0) {
    const direction = delta.avg_risk_score_delta < 0 ? 'reduce' : 'increase';
    parts.push(`Avg Risk Score would ${direction} by ${Math.abs(delta.avg_risk_score_delta).toFixed(2)} (${delta.avg_risk_score_pct.toFixed(1)}%)`);
  }

  if (delta.alerts_delta === 0 && delta.incidents_delta === 0 && delta.notifications_delta === 0) {
    parts.push('No significant changes detected.');
  }

  return parts.join(' | ');
}

/**
 * Simulate remediation by running Guardian pipeline with virtual overrides
 */
export async function simulateRemediation(
  tenantId: string,
  playbookConfig: GuardianRemediationPlaybookConfig,
  windowDays: number = 30
): Promise<RemediationSimulationResult> {
  // Step 1: Get baseline metrics
  const baseline = await getBaselineMetrics(tenantId, windowDays);

  // Step 2: Create virtual overrides from playbook actions
  const overrides = buildOverridesFromActions(playbookConfig.actions);

  // Step 3: Run emulator with overrides (in-memory, no production writes)
  let simulated: SimulatedMetrics;
  try {
    simulated = await pipelineEmulateWithOverrides(tenantId, baseline, overrides);
  } catch (err) {
    console.error('Emulation failed:', err);
    // Return unchanged simulated metrics if emulation fails
    simulated = {
      alerts_total: baseline.alerts_total,
      alerts_by_severity: baseline.alerts_by_severity,
      incidents_total: baseline.incidents_total,
      incidents_by_status: baseline.incidents_by_status,
      correlations_total: baseline.correlations_total,
      notifications_total: baseline.notifications_total,
      avg_risk_score: baseline.avg_risk_score,
      window_days: windowDays,
      computed_at: new Date().toISOString(),
    };
  }

  // Step 4: Compute deltas
  const delta = computeDeltaMetrics(baseline, simulated);

  // Step 5: Classify effect
  const overall_effect = classifyEffect(delta);

  // Step 6: Generate summary
  const summary = generateSummary(baseline, delta, overall_effect);

  return {
    baseline,
    simulated,
    delta,
    overall_effect,
    summary,
  };
}

/**
 * Build virtual overrides object from remediation actions
 * Used by emulator to adjust rule evaluation, correlation, etc. (in-memory only)
 */
function buildOverridesFromActions(actions: GuardianRemediationAction[]): Record<string, unknown> {
  const overrides: Record<string, unknown> = {
    disabledRules: new Set<string>(),
    ruleThresholdAdjustments: new Map<string, number>(),
    correlationWindowMinutesOverride: null as number | null,
    minLinkCountOverride: null as number | null,
    suppressedNotificationChannels: new Set<string>(),
  };

  for (const action of actions) {
    switch (action.type) {
      case 'adjust_rule_threshold': {
        const key = `${action.rule_id}:${action.metric}`;
        overrides.ruleThresholdAdjustments.set(key, action.delta);
        break;
      }

      case 'disable_rule': {
        (overrides.disabledRules as Set<string>).add(action.rule_id);
        break;
      }

      case 'adjust_correlation_window': {
        // Use the first window adjustment (apply latest)
        if (overrides.correlationWindowMinutesOverride === null) {
          overrides.correlationWindowMinutesOverride = action.window_minutes_delta;
        }
        break;
      }

      case 'increase_min_link_count': {
        overrides.minLinkCountOverride = action.delta;
        break;
      }

      case 'suppress_notification_channel': {
        (overrides.suppressedNotificationChannels as Set<string>).add(action.channel);
        break;
      }
    }
  }

  return overrides;
}
