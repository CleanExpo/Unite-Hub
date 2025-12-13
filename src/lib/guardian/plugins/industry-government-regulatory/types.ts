/**
 * Government & Regulatory Oversight Signal Types
 *
 * Defines safe, aggregate-only governance and compliance readiness signals.
 * No patient/citizen/staff identifiers. Heuristic indicators only.
 */

export type GovSignalKey =
  | 'audit_readiness'
  | 'policy_posture'
  | 'control_drift'
  | 'validation_health'
  | 'backup_posture'
  | 'transparency_score';

export type SignalSeverity = 'low' | 'medium' | 'high';
export type SignalWindow = '30d' | '90d' | '180d';
export type TrendDirection = 'up' | 'flat' | 'down';

/**
 * Individual governance signal
 */
export interface GovSignal {
  key: GovSignalKey;
  severity: SignalSeverity;
  window: SignalWindow;
  count?: number;         // Aggregate count (never identifiers)
  previousCount?: number; // For trend calculation
  trend?: TrendDirection;
  rationale: string;      // Plain-English explanation
  suggestedAction?: string;
  metadata?: {
    createdAt: string;
    isHeuristic: boolean;
  };
}

/**
 * Governance overview for dashboard
 */
export interface GovernanceOverview {
  auditEnabled: boolean;
  aiAllowed: boolean;
  externalSharingPolicy: 'restricted' | 'allowed_with_approval' | 'allowed';
  validationStatus: 'pass' | 'warn' | 'fail' | 'not_configured';
  lastValidationAt?: string;
  backupStatus?: 'recent' | 'stale' | 'not_configured';
  auditExportAvailable: boolean;
}

/**
 * Complete governance oversight snapshot
 */
export interface GovOversightSnapshot {
  generatedAt: string;
  signals: GovSignal[];
  totals: {
    alerts: number;
    incidents: number;
    correlations: number;
    riskLabel: 'low' | 'medium' | 'high';
    riskTrend?: TrendDirection;
  };
  governance: GovernanceOverview;
  warnings: string[];
  disclaimer: string;
}

/**
 * Input: Aggregate government/regulatory data
 */
export interface AggregateGovernmentData {
  // Operational metrics
  alerts24h: number;
  incidents24h: number;
  correlations24h: number;
  alerts30d: number;
  incidents30d: number;

  // Governance signals
  auditEnabled?: boolean;
  aiAllowed?: boolean;
  externalSharingPolicy?: 'restricted' | 'allowed_with_approval' | 'allowed';

  // Validation status
  validationStatus?: 'pass' | 'warn' | 'fail';
  lastValidationAt?: string;

  // Backup status
  backupStatus?: 'recent' | 'stale';
  lastBackupAt?: string;

  // Risk assessment
  currentRiskLabel?: 'low' | 'medium' | 'high';
  riskTrend?: 'up' | 'down' | 'flat';

  // Feature availability
  auditExportAvailable?: boolean;
  backupReadinessAvailable?: boolean;
}

/**
 * Helper: Create signal with proper structure
 */
export function createGovSignal(
  key: GovSignalKey,
  severity: SignalSeverity,
  window: SignalWindow,
  count: number,
  previousCount: number | undefined,
  rationale: string,
  suggestedAction?: string
): GovSignal {
  const trend: TrendDirection | undefined =
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
 * Default thresholds for signal detection
 */
export const DEFAULT_GOV_THRESHOLDS = {
  validationHealthWindow: 30, // days
  controlDriftRiskDelta: 0.3, // 30% increase
  backupStalenessThreshold: 7, // days
  transparencyScoreGoodThreshold: 70
};
