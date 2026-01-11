/**
 * Cross-Industry Benchmarking Data Types
 *
 * Privacy-preserving benchmark metrics and cohort definitions.
 * K-anonymity enforced, no tenant identifiers exposed.
 */

export type BenchmarkMetricKey =
  | 'alert_rate'
  | 'incident_rate'
  | 'correlation_density'
  | 'risk_label_distribution'
  | 'volatility_index';

export type BenchmarkWindow = '30d' | '90d' | '180d';
export type IndustryLabel = 'healthcare' | 'government' | 'education' | 'insurance' | 'restoration' | 'global';

/**
 * Single benchmark metric comparison
 */
export interface BenchmarkMetric {
  key: BenchmarkMetricKey;
  window: BenchmarkWindow;
  tenantValue: number;
  cohortMedian: number;
  cohortP75: number;
  cohortP90: number;
  deltaFromMedian: number; // Percentage delta
  interpretation: 'below' | 'typical' | 'elevated'; // Neutral language
  rationale: string;
}

/**
 * Cohort metadata (never includes member identifiers)
 */
export interface CohortMetadata {
  size: number; // k >= 10 for privacy
  window: BenchmarkWindow;
  industryLabel: IndustryLabel;
  kAnonymityEnforced: boolean;
  generatedAt: string;
}

/**
 * Benchmark snapshot (privacy-safe output)
 */
export interface BenchmarkSnapshot {
  generatedAt: string;
  tenantId: string; // Own tenant ID only (no cohort members revealed)
  cohort: CohortMetadata;
  metrics: BenchmarkMetric[];
  warnings: string[];
  disclaimer: string;
  aiInsightAvailable: boolean;
}

/**
 * Aggregate input for benchmarking (read-only from Guardian data)
 */
export interface AggregateGuardianMetrics {
  // 30d baseline
  alerts30d: number;
  incidents30d: number;
  correlations30d: number;
  riskLabelDistribution30d?: {
    low: number;
    medium: number;
    high: number;
  };

  // 90d & 180d for volatility
  alerts90d?: number;
  incidents90d?: number;
  alerts180d?: number;
  incidents180d?: number;

  // Volatility indicators
  metricsVariance?: number; // 0-100 scale
  trendStability?: 'stable' | 'volatile';
}

/**
 * Cohort distribution aggregates (anonymised)
 */
export interface CohortDistribution {
  size: number;
  industryLabel: IndustryLabel;
  metrics: {
    alertRateMedian: number;
    alertRateP75: number;
    alertRateP90: number;
    incidentRateMedian: number;
    incidentRateP75: number;
    incidentRateP90: number;
    correlationDensityMedian: number;
    correlationDensityP75: number;
    correlationDensityP90: number;
    riskLabelHighPercentage: number; // % of cohort with high risk
    volatilityIndexMedian: number;
  };
}

/**
 * Benchmark computation constants
 */
export const BENCHMARK_CONSTANTS = {
  MIN_COHORT_SIZE: 10, // k-anonymity threshold
  ALERT_RATE_WINDOW_DAYS: 30, // alerts per day
  INCIDENT_RATE_WINDOW_DAYS: 30, // incidents per day
  VOLATILITY_WINDOWS: [30, 90, 180], // days for variance calculation
  DELTA_THRESHOLD_LOW: -15, // < -15% below median = "below"
  DELTA_THRESHOLD_HIGH: 15 // > 15% above median = "elevated"
};

/**
 * Neutral interpretation template (no ranking language)
 */
export function getInterpretation(deltaFromMedian: number): 'below' | 'typical' | 'elevated' {
  if (deltaFromMedian < BENCHMARK_CONSTANTS.DELTA_THRESHOLD_LOW) {
    return 'below';
  }
  if (deltaFromMedian > BENCHMARK_CONSTANTS.DELTA_THRESHOLD_HIGH) {
    return 'elevated';
  }
  return 'typical';
}

/**
 * Create benchmark metric safely
 */
export function createBenchmarkMetric(
  key: BenchmarkMetricKey,
  window: BenchmarkWindow,
  tenantValue: number,
  cohortMedian: number,
  cohortP75: number,
  cohortP90: number,
  rationale: string
): BenchmarkMetric {
  const deltaFromMedian = cohortMedian > 0 ? ((tenantValue - cohortMedian) / cohortMedian) * 100 : 0;

  return {
    key,
    window,
    tenantValue,
    cohortMedian,
    cohortP75,
    cohortP90,
    deltaFromMedian: Math.round(deltaFromMedian * 10) / 10,
    interpretation: getInterpretation(deltaFromMedian),
    rationale
  };
}

/**
 * Create cohort metadata safely
 */
export function createCohortMetadata(
  size: number,
  window: BenchmarkWindow,
  industryLabel: IndustryLabel
): CohortMetadata {
  return {
    size,
    window,
    industryLabel,
    kAnonymityEnforced: size >= BENCHMARK_CONSTANTS.MIN_COHORT_SIZE,
    generatedAt: new Date().toISOString()
  };
}
