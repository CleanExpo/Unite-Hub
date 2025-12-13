/**
 * Campus Operations Signal Types
 *
 * Safe, aggregate-only data model for education & campus operations oversight.
 * Never exposes student IDs, staff identifiers, or location details.
 */

export type CampusSignalKey =
  | 'operational_disruption'
  | 'environmental_risk'
  | 'repeat_pattern'
  | 'response_latency'
  | 'afterhours_activity'
  | 'stability_indicator';

export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Individual campus operation signal
 */
export interface CampusSignal {
  key: CampusSignalKey;
  severity: 'low' | 'medium' | 'high';
  timewindow: string;
  count: number;
  trend?: TrendDirection;
  rationale: string;
  suggestedAction?: string;
}

/**
 * Campus operations overview
 */
export interface CampusOperationsOverview {
  totalIncidents24h: number;
  totalIncidents7d: number;
  escalationRate: number; // percentage
  responseStatus: 'on_track' | 'delayed' | 'critical';
  environmentalStatus: 'normal' | 'elevated' | 'critical';
  afterhoursPercentage: number;
}

/**
 * Campus operational safety snapshot
 */
export interface CampusOversightSnapshot {
  generatedAt: string;
  signals: CampusSignal[];
  overview: CampusOperationsOverview;
  warnings: string[];
  disclaimer: string;
}

/**
 * Aggregate data input for signal derivation
 */
export interface AggregateCampusData {
  // Volume metrics (24h)
  incidents24h: number;
  alerts24h: number;
  correlations24h: number;

  // Volume metrics (7d, 30d)
  incidents7d?: number;
  incidents30d?: number;
  alerts7d?: number;

  // Environmental/facility metrics
  facilityIssues24h?: number;
  facilityIssues7d?: number;
  environmentalAlerts24h?: number;

  // Response metrics
  avgResolutionTime?: number; // days
  unresolved7d?: number;
  escalations24h?: number;

  // Activity patterns
  afterhoursIncidents24h?: number;
  afterhoursIncidents7d?: number;
  peakHourVolume?: number;

  // Risk/status labels
  currentRiskLabel?: 'low' | 'medium' | 'high';
  riskTrend?: TrendDirection;

  // Operational status
  systemAvailability?: number; // 0-100
  queueLength?: number;
  staffingLevel?: 'normal' | 'reduced' | 'critical';
}

/**
 * Default thresholds for signal detection
 */
export const DEFAULT_CAMPUS_THRESHOLDS = {
  disruptionIncidentRatio: 1.5, // 1.5x baseline
  environmentalRiskRatio: 1.8,
  repeatIncidentMinCluster: 3, // ≥3 correlated in 7d
  responseLatencyDays: 5,
  afterhoursElevationRatio: 1.3,
  escalationRateThreshold: 0.25, // 25%
  stabilitySafeVolume: 10 // baseline incidents for stability check
};

/**
 * Create a campus signal safely
 */
export function createCampusSignal(
  key: CampusSignalKey,
  severity: 'low' | 'medium' | 'high',
  timewindow: string,
  count: number,
  trend?: TrendDirection,
  rationale?: string,
  suggestedAction?: string
): CampusSignal {
  return {
    key,
    severity,
    timewindow,
    count,
    trend,
    rationale: rationale || 'Campus operational signal detected.',
    suggestedAction
  };
}
