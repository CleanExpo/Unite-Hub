/**
 * Guardian Industry Pack: Insurance & Claims Oversight
 * Signal types, thresholds, and data structures
 *
 * All signals derived from aggregate data only (no claim identifiers, policy data, or PII)
 */

export type InsuranceOpsSignalKey =
  | 'claims_velocity_spike'
  | 'fraud_risk_cluster'
  | 'adjuster_load_overload'
  | 'sla_breach_pattern'
  | 'severity_drift';

export type SignalSeverity = 'low' | 'medium' | 'high';
export type SignalWindow = '24h' | '7d' | '30d';
export type SignalTrend = 'up' | 'flat' | 'down';

/**
 * Individual insurance operational signal
 */
export interface InsuranceOpsSignal {
  key: InsuranceOpsSignalKey;
  severity: SignalSeverity;
  window: SignalWindow;
  count: number;
  previousCount?: number;
  trend?: SignalTrend;
  rationale: string;
  suggestedAction?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Complete insurance operations snapshot
 * Contains all detected signals, aggregates, warnings, and disclaimers
 */
export interface InsuranceOpsSnapshot {
  generatedAt: string;
  signals: InsuranceOpsSignal[];
  totals: {
    alerts: number;
    incidents: number;
    correlations: number;
    riskLabel: 'low' | 'medium' | 'high' | 'unknown';
  };
  warnings?: string[];
  disclaimer: string;
}

/**
 * Configurable signal detection thresholds
 */
export interface SignalThresholds {
  claimsVelocityRatio: number;
  fraudClusterMinCount: number;
  adjusterLoadThreshold: number;
  slaBreachWindow: number;
  severityDriftDelta: number;
}

/**
 * Default thresholds for signal detection
 * Adjustable per tenant in future versions
 */
export const DEFAULT_SIGNAL_THRESHOLDS: SignalThresholds = {
  claimsVelocityRatio: 1.5,        // 1.5x 7d baseline = trigger
  fraudClusterMinCount: 5,         // 5+ high anomalies = trigger
  adjusterLoadThreshold: 10,       // 10+ triage items = trigger
  slaBreachWindow: 7,              // 7+ day backlog = trigger
  severityDriftDelta: 2            // risk trending up = trigger
};

/**
 * Create a signal with consistent structure and trend calculation
 */
export function createSignal(
  key: InsuranceOpsSignalKey,
  severity: SignalSeverity,
  window: SignalWindow,
  count: number,
  rationale: string,
  previousCount?: number,
  suggestedAction?: string
): InsuranceOpsSignal {
  const trend = previousCount === undefined
    ? undefined
    : count > previousCount * 1.1
      ? 'up'
      : count < previousCount * 0.9
        ? 'down'
        : 'flat';

  return {
    key,
    severity,
    window,
    count,
    previousCount,
    trend,
    rationale,
    suggestedAction,
    metadata: {
      createdAt: new Date().toISOString(),
      isHeuristic: true
    }
  };
}
