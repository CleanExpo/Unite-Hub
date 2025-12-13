/**
 * Restoration Operations Signal Types
 *
 * PII-safe, aggregate-only data model for restoration industry signals.
 * All counts/ratios derived from Guardian aggregate data; no identifiers.
 */

/**
 * Restoration-specific signal keys
 */
export type RestorationOpsSignalKey =
  | 'water_spike'
  | 'mould_risk_spike'
  | 'fire_event_spike'
  | 'sla_drift'
  | 'equipment_overload'
  | 'repeat_incident_cluster'
  | 'afterhours_surge';

/**
 * Signal severity levels
 */
export type SignalSeverity = 'low' | 'medium' | 'high';

/**
 * Time window for signal detection
 */
export type SignalWindow = '24h' | '7d' | '30d';

/**
 * Trend direction
 */
export type SignalTrend = 'up' | 'flat' | 'down';

/**
 * Single operational signal
 * Heuristic indicator derived from aggregate metrics
 */
export interface RestorationOpsSignal {
  key: RestorationOpsSignalKey;
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
 * Overall operational snapshot
 */
export interface RestorationOpsSnapshot {
  generatedAt: string;
  signals: RestorationOpsSignal[];
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
 * Signal thresholds for heuristic detection
 */
export interface SignalThresholds {
  waterSpikeRatio: number;
  mouldRiskMinCount: number;
  slaBacklogThreshold: number;
  clusterWindow: number;
  clusterRepetitionThreshold: number;
}

/**
 * Default thresholds
 */
export const DEFAULT_SIGNAL_THRESHOLDS: SignalThresholds = {
  waterSpikeRatio: 1.5, // 1.5x baseline = spike
  mouldRiskMinCount: 5, // 5+ high anomalies = mould risk
  slaBacklogThreshold: 3, // 3+ items in triage queue = drift
  clusterWindow: 7, // 7-day window for clustering
  clusterRepetitionThreshold: 3 // 3+ repeats = cluster
};

/**
 * Create a signal with defaults
 */
export function createSignal(
  key: RestorationOpsSignalKey,
  severity: SignalSeverity,
  window: SignalWindow,
  count: number,
  rationale: string,
  previousCount?: number,
  suggestedAction?: string
): RestorationOpsSignal {
  const trend =
    previousCount === undefined
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

/**
 * Calculate trend from two values
 */
export function calculateTrend(current: number, previous: number): SignalTrend {
  if (previous === 0) {
return 'up';
}
  const ratio = current / previous;
  return ratio > 1.1 ? 'up' : ratio < 0.9 ? 'down' : 'flat';
}
