/**
 * Guardian Industry Pack: Healthcare & Aged Care Oversight
 * Signal types, thresholds, and data structures
 *
 * All signals derived from aggregate data only (no patient, resident, staff, or room identifiers)
 */

export type HealthcareSignalKey =
  | 'environmental_risk_spike'
  | 'repeat_incident_pattern'
  | 'response_latency'
  | 'afterhours_event_rate'
  | 'care_environment_stability'
  | 'escalation_pressure';

export type SignalSeverity = 'low' | 'medium' | 'high';
export type SignalWindow = '7d' | '30d' | '90d';
export type SignalTrend = 'up' | 'flat' | 'down';

/**
 * Individual healthcare operational signal
 */
export interface HealthcareSignal {
  key: HealthcareSignalKey;
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
 * Complete healthcare operations snapshot
 * Contains all detected signals, aggregates, warnings, and disclaimers
 */
export interface HealthcareSnapshot {
  generatedAt: string;
  signals: HealthcareSignal[];
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
  environmentalRiskRatio: number; // e.g., 1.5 for 1.5x baseline
  repeatIncidentMinCluster: number; // e.g., 3 for 3+ recurring patterns
  responseLatencyDays: number; // e.g., 7 for 7-day triage backlog
  afterhoursEventRate: number; // e.g., 0.4 for 40% of 24h alerts off-hours
  escalationPressureDelta: number; // e.g., 0.3 for 30% risk increase
}

/**
 * Helper: Create a signal with defaults
 */
export function createSignal(
  key: HealthcareSignalKey,
  severity: SignalSeverity,
  window: SignalWindow,
  data: {
    count: number;
    previousCount?: number;
    rationale: string;
    suggestedAction?: string;
  }
): HealthcareSignal {
  const trend = data.previousCount !== undefined
    ? data.count > data.previousCount * 1.1
      ? 'up'
      : data.count < data.previousCount * 0.9
      ? 'down'
      : 'flat'
    : undefined;

  return {
    key,
    severity,
    window,
    count: data.count,
    previousCount: data.previousCount,
    trend,
    rationale: data.rationale,
    suggestedAction: data.suggestedAction,
    metadata: {
      createdAt: new Date().toISOString(),
      isHeuristic: true
    }
  };
}

/**
 * Default thresholds for healthcare signal detection
 */
export const DEFAULT_SIGNAL_THRESHOLDS: SignalThresholds = {
  environmentalRiskRatio: 1.5, // 1.5x baseline alert/incident surge
  repeatIncidentMinCluster: 3, // 3+ recurring incident patterns
  responseLatencyDays: 7, // 7-day triage backlog threshold
  afterhoursEventRate: 0.4, // 40% of 24h alerts outside business hours
  escalationPressureDelta: 0.3 // 30% risk increase
};
