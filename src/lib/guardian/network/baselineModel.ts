/**
 * Guardian X02: Network Anomaly Baseline Model
 *
 * Core anomaly classification logic that compares tenant metrics to cohort baselines.
 * Uses statistical measures (z-score, delta ratio) to classify anomalies by type and severity.
 */

export interface GuardianNetworkBaselineInput {
  tenantMetricValue: number;
  cohortStats: {
    p50?: number;
    p75?: number;
    p90?: number;
    p95?: number;
    p99?: number;
    mean?: number;
    stddev?: number;
    sampleSize: number;
    cohortKey: string;
  };
}

export interface GuardianNetworkBaselineResult {
  anomalyType: 'elevated' | 'suppressed' | 'none';
  severity: 'low' | 'medium' | 'high' | 'critical' | 'none';
  zScore?: number;
  deltaRatio?: number;
  explanation: string;
}

/**
 * Compute z-score: (value - mean) / stddev
 * Returns undefined if stddev is 0 or missing
 */
export function computeZScore(
  value: number,
  mean?: number,
  stddev?: number
): number | undefined {
  if (mean === undefined || stddev === undefined || stddev === 0) {
    return undefined;
  }
  return (value - mean) / stddev;
}

/**
 * Classify anomaly based on tenant metric vs cohort baseline
 *
 * Thresholds:
 * - Elevated/Critical: deltaRatio >= 2.0
 * - Elevated/High: deltaRatio >= 0.5 OR z-score >= 3
 * - Suppressed: deltaRatio <= -0.5
 * - None: otherwise
 */
export function classifyAnomaly(
  input: GuardianNetworkBaselineInput
): GuardianNetworkBaselineResult {
  const { tenantMetricValue, cohortStats } = input;
  const p50 = cohortStats.p50;
  const mean = cohortStats.mean;
  const stddev = cohortStats.stddev;

  // Compute z-score if possible
  const zScore = computeZScore(tenantMetricValue, mean, stddev);

  // Compute delta ratio (% deviation from p50) if p50 exists
  let deltaRatio: number | undefined;
  if (p50 !== undefined && p50 > 0) {
    deltaRatio = (tenantMetricValue - p50) / p50;
  }

  // Generate explanation
  const explanation = generateExplanation(
    tenantMetricValue,
    cohortStats,
    zScore,
    deltaRatio
  );

  // Classify based on thresholds
  let anomalyType: 'elevated' | 'suppressed' | 'none' = 'none';
  let severity: 'low' | 'medium' | 'high' | 'critical' | 'none' = 'none';

  // Check for elevated/critical anomaly (primary threshold: deltaRatio)
  if (deltaRatio !== undefined && deltaRatio >= 2.0) {
    anomalyType = 'elevated';
    severity = 'critical';
  }
  // Check for elevated/high anomaly
  else if (
    (deltaRatio !== undefined && deltaRatio >= 0.5) ||
    (zScore !== undefined && zScore >= 3)
  ) {
    anomalyType = 'elevated';
    severity = 'high';
  }
  // Check for suppressed anomaly
  else if (deltaRatio !== undefined && deltaRatio <= -0.5) {
    anomalyType = 'suppressed';
    severity = 'medium';
  }

  return {
    anomalyType,
    severity,
    zScore,
    deltaRatio,
    explanation,
  };
}

/**
 * Map severity to numeric score for sorting/filtering
 */
export function severityToScore(severity: string): number {
  const scores: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    none: 0,
  };
  return scores[severity] ?? 0;
}

/**
 * Determine if anomaly should be persisted based on minimum severity threshold
 * Always returns false for 'none' severity
 */
export function shouldPersistAnomaly(
  severity: string,
  minSeverity?: string
): boolean {
  if (severity === 'none') {
    return false;
  }

  if (!minSeverity) {
    return true; // Persist all non-none anomalies if no threshold
  }

  return severityToScore(severity) >= severityToScore(minSeverity);
}

/**
 * Generate human-readable explanation of anomaly
 */
function generateExplanation(
  tenantValue: number,
  cohortStats: GuardianNetworkBaselineInput['cohortStats'],
  zScore?: number,
  deltaRatio?: number
): string {
  const { p50, cohortKey } = cohortStats;

  if (deltaRatio === undefined || p50 === undefined) {
    return `Tenant metric value is ${tenantValue}. Insufficient cohort data for comparison.`;
  }

  const percentDiff = Math.round(deltaRatio * 100);
  const direction = percentDiff > 0 ? 'above' : 'below';
  const absPercent = Math.abs(percentDiff);

  let baseMsg = `Tenant ${cohortKey} metric is ${absPercent}% ${direction} cohort median (${p50.toFixed(0)})`;

  if (zScore !== undefined && !isNaN(zScore)) {
    baseMsg += ` (z=${zScore.toFixed(2)})`;
  }

  baseMsg += '.';
  return baseMsg;
}
