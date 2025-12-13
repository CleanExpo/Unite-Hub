/**
 * Benchmark Aggregation Service
 *
 * Computes benchmark metrics using aggregated Guardian data.
 * Read-only, aggregate-only, no reverse inference possible.
 */

import type {
  AggregateGuardianMetrics,
  BenchmarkSnapshot,
  BenchmarkWindow,
  CohortDistribution,
  CohortMetadata
} from './types';
import { createBenchmarkMetric } from './types';

/**
 * Compute benchmarks from tenant metrics vs cohort distribution
 */
export async function computeBenchmarks(
  tenantId: string,
  tenantMetrics: AggregateGuardianMetrics,
  cohort: CohortMetadata,
  cohortDistribution: CohortDistribution
): Promise<BenchmarkSnapshot> {
  const metrics = [];
  const warnings: string[] = [];

  // Metric 1: Alert Rate (alerts per day over window)
  const alertMetric = computeAlertRateBenchmark(tenantMetrics, cohortDistribution, cohort.window);
  if (alertMetric) {
metrics.push(alertMetric);
}

  // Metric 2: Incident Rate (incidents per day over window)
  const incidentMetric = computeIncidentRateBenchmark(
    tenantMetrics,
    cohortDistribution,
    cohort.window
  );
  if (incidentMetric) {
metrics.push(incidentMetric);
}

  // Metric 3: Correlation Density (correlations per incident)
  const correlationMetric = computeCorrelationDensityBenchmark(
    tenantMetrics,
    cohortDistribution,
    cohort.window
  );
  if (correlationMetric) {
metrics.push(correlationMetric);
}

  // Metric 4: Risk Label Distribution (% high-risk)
  const riskMetric = computeRiskLabelBenchmark(tenantMetrics, cohortDistribution, cohort.window);
  if (riskMetric) {
metrics.push(riskMetric);
}

  // Metric 5: Volatility Index (metric variance over time)
  const volatilityMetric = computeVolatilityBenchmark(tenantMetrics, cohort.window);
  if (volatilityMetric) {
metrics.push(volatilityMetric);
}

  return {
    generatedAt: new Date().toISOString(),
    tenantId,
    cohort,
    metrics,
    warnings,
    disclaimer:
      '⚠️ Benchmarks are anonymised, aggregate-only indicators. Not rankings, certifications, or competitive comparisons. For contextual reference only.',
    aiInsightAvailable: true // Always indicate availability; gating happens at UI level
  };
}

/**
 * Benchmark 1: Alert Rate (alerts per day)
 */
function computeAlertRateBenchmark(
  tenantMetrics: AggregateGuardianMetrics,
  cohortDistribution: CohortDistribution,
  window: BenchmarkWindow
): ReturnType<typeof createBenchmarkMetric> | null {
  const windowDays = window === '30d' ? 30 : window === '90d' ? 90 : 180;
  const tenantAlertRate = (tenantMetrics.alerts30d || 0) / 30; // Per day

  return createBenchmarkMetric(
    'alert_rate',
    window,
    Math.round(tenantAlertRate * 10) / 10,
    cohortDistribution.metrics.alertRateMedian,
    cohortDistribution.metrics.alertRateP75,
    cohortDistribution.metrics.alertRateP90,
    `Alert rate: ${tenantAlertRate.toFixed(1)} alerts/day vs cohort median of ${cohortDistribution.metrics.alertRateMedian.toFixed(1)}.`
  );
}

/**
 * Benchmark 2: Incident Rate (incidents per day)
 */
function computeIncidentRateBenchmark(
  tenantMetrics: AggregateGuardianMetrics,
  cohortDistribution: CohortDistribution,
  window: BenchmarkWindow
): ReturnType<typeof createBenchmarkMetric> | null {
  const tenantIncidentRate = (tenantMetrics.incidents30d || 0) / 30; // Per day

  return createBenchmarkMetric(
    'incident_rate',
    window,
    Math.round(tenantIncidentRate * 10) / 10,
    cohortDistribution.metrics.incidentRateMedian,
    cohortDistribution.metrics.incidentRateP75,
    cohortDistribution.metrics.incidentRateP90,
    `Incident rate: ${tenantIncidentRate.toFixed(1)} incidents/day vs cohort median of ${cohortDistribution.metrics.incidentRateMedian.toFixed(1)}.`
  );
}

/**
 * Benchmark 3: Correlation Density (correlations per incident)
 */
function computeCorrelationDensityBenchmark(
  tenantMetrics: AggregateGuardianMetrics,
  cohortDistribution: CohortDistribution,
  window: BenchmarkWindow
): ReturnType<typeof createBenchmarkMetric> | null {
  const tenantIncidents = tenantMetrics.incidents30d || 1;
  const tenantCorrelations = tenantMetrics.correlations30d || 0;
  const tenantDensity =
    tenantIncidents > 0 ? (tenantCorrelations / tenantIncidents) * 100 : 0;

  return createBenchmarkMetric(
    'correlation_density',
    window,
    Math.round(tenantDensity * 10) / 10,
    cohortDistribution.metrics.correlationDensityMedian,
    cohortDistribution.metrics.correlationDensityP75,
    cohortDistribution.metrics.correlationDensityP90,
    `Correlation density: ${tenantDensity.toFixed(1)}% of incidents are correlated vs cohort median of ${cohortDistribution.metrics.correlationDensityMedian.toFixed(1)}%.`
  );
}

/**
 * Benchmark 4: Risk Label Distribution (% high-risk)
 */
function computeRiskLabelBenchmark(
  tenantMetrics: AggregateGuardianMetrics,
  cohortDistribution: CohortDistribution,
  window: BenchmarkWindow
): ReturnType<typeof createBenchmarkMetric> | null {
  const riskDist = tenantMetrics.riskLabelDistribution30d || {
    low: 1,
    medium: 1,
    high: 0
  };

  const total = riskDist.low + riskDist.medium + riskDist.high || 1;
  const tenantHighRiskPercentage = (riskDist.high / total) * 100;

  return createBenchmarkMetric(
    'risk_label_distribution',
    window,
    Math.round(tenantHighRiskPercentage * 10) / 10,
    cohortDistribution.metrics.riskLabelHighPercentage,
    cohortDistribution.metrics.riskLabelHighPercentage * 1.1, // Mock P75
    cohortDistribution.metrics.riskLabelHighPercentage * 1.2, // Mock P90
    `High-risk incidents: ${tenantHighRiskPercentage.toFixed(1)}% vs cohort median of ${cohortDistribution.metrics.riskLabelHighPercentage.toFixed(1)}%.`
  );
}

/**
 * Benchmark 5: Volatility Index (variance over time)
 */
function computeVolatilityBenchmark(
  tenantMetrics: AggregateGuardianMetrics,
  window: BenchmarkWindow
): ReturnType<typeof createBenchmarkMetric> | null {
  // Volatility: metric variance from tenant data
  const tenantVolatility = tenantMetrics.metricsVariance || 15; // Default 15% variance

  return createBenchmarkMetric(
    'volatility_index',
    window,
    Math.round(tenantVolatility * 10) / 10,
    18.5, // Cohort median volatility (mock)
    22.0, // Cohort P75 (mock)
    25.5, // Cohort P90 (mock)
    `Volatility index: ${tenantVolatility.toFixed(1)}% vs cohort median of 18.5%. Indicates operational stability over time.`
  );
}
