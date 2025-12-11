/**
 * Guardian X02: Benchmark Builder
 *
 * Samples per-tenant metrics for a date and fetches matching cohort aggregates
 * for benchmark comparison. Builds snapshot records for anomaly detection.
 *
 * Privacy: Uses only this tenant's telemetry + aggregated cohort statistics.
 * No individual tenant cross-references.
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  getTenantFingerprintByTenantId,
  computeCohortKeysForFingerprint,
} from './tenantFingerprintService';
import { extractHourlyTelemetryForTenant } from './telemetryExtractor';

export interface GuardianTenantMetricSample {
  bucketDate: string; // YYYY-MM-DD
  metricFamily: string;
  metricKey: string;
  value: number;
}

export interface CohortStatsForMetric {
  cohortKey: string;
  stats: {
    p50?: number;
    p75?: number;
    p90?: number;
    p95?: number;
    p99?: number;
    mean?: number;
    stddev?: number;
    sampleSize: number;
  };
}

/**
 * Sample this tenant's metrics for a specific date.
 *
 * Aggregates hourly telemetry (from X01) into daily metrics per metric_family/metric_key.
 * For counts (alerts, incidents, qa), sums across the day.
 * For averages (risk.avg_score, perf.p95_ms), computes the daily average.
 */
export async function sampleTenantMetricsForDate(
  tenantId: string,
  bucketDate: Date
): Promise<GuardianTenantMetricSample[]> {
  const supabase = getSupabaseServer();

  // Normalize bucket date to start of day
  const dateStart = new Date(bucketDate);
  dateStart.setUTCHours(0, 0, 0, 0);

  const dateEnd = new Date(dateStart);
  dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);

  // Extract hourly telemetry from X01 for this tenant/date
  const hourlyPoints = await extractHourlyTelemetryForTenant(tenantId, {
    start: dateStart,
    end: dateEnd,
  });

  // Aggregate hourly points into daily samples per metric_family/metric_key
  const samplesMap: Record<
    string,
    { values: number[]; family: string; key: string }
  > = {};

  hourlyPoints.forEach((point) => {
    const mapKey = `${point.metricFamily}:${point.metricKey}`;
    if (!samplesMap[mapKey]) {
      samplesMap[mapKey] = {
        values: [],
        family: point.metricFamily,
        key: point.metricKey,
      };
    }
    samplesMap[mapKey].values.push(point.value);
  });

  // Compute daily aggregates
  const samples: GuardianTenantMetricSample[] = [];

  Object.entries(samplesMap).forEach(([, data]) => {
    let dailyValue: number;

    // Sums for counts; averages for scores/latencies
    if (
      data.key === 'alerts.total' ||
      data.key === 'alerts.critical' ||
      data.key === 'incidents.total' ||
      data.key === 'incidents.critical' ||
      data.key === 'qa.drills_completed' ||
      data.key === 'qa.regression_runs' ||
      data.key === 'qa.coverage_snapshots'
    ) {
      // Sum counts
      dailyValue = data.values.reduce((sum, v) => sum + v, 0);
    } else {
      // Average scores/latencies
      dailyValue =
        data.values.length > 0
          ? data.values.reduce((sum, v) => sum + v, 0) / data.values.length
          : 0;
    }

    samples.push({
      bucketDate: dateStart.toISOString().split('T')[0],
      metricFamily: data.family,
      metricKey: data.key,
      value: dailyValue,
    });
  });

  return samples;
}

/**
 * Fetch cohort aggregates for the given tenant and samples.
 *
 * For each sample, queries guardian_network_aggregates_daily for matching
 * cohort statistics. Prefers the most specific cohort with adequate sample_size;
 * falls back to 'global' if needed.
 *
 * Returns a map keyed by ${metricFamily}:${metricKey} with cohort stats.
 */
export async function fetchCohortAggregatesForSamples(
  tenantId: string,
  samples: GuardianTenantMetricSample[],
  bucketDate: Date
): Promise<Map<string, CohortStatsForMetric>> {
  const supabase = getSupabaseServer();

  // Get tenant fingerprint to determine cohort keys
  const fingerprint = await getTenantFingerprintByTenantId(tenantId);
  const cohortKeys = computeCohortKeysForFingerprint(fingerprint);

  // Normalize bucket date
  const dateStr = bucketDate.toISOString().split('T')[0];

  const result = new Map<string, CohortStatsForMetric>();

  // For each sample, find the best matching cohort aggregate
  for (const sample of samples) {
    const mapKey = `${sample.metricFamily}:${sample.metricKey}`;

    // Try cohort keys in order of preference (specific to general)
    let bestMatch: any = null;

    for (const cohortKey of cohortKeys) {
      const { data, error } = await supabase
        .from('guardian_network_aggregates_daily')
        .select(
          `
          p50,
          p75,
          p90,
          p95,
          p99,
          mean,
          stddev,
          sample_size,
          cohort_key
        `
        )
        .eq('bucket_date', dateStr)
        .eq('cohort_key', cohortKey)
        .eq('metric_family', sample.metricFamily)
        .eq('metric_key', sample.metricKey)
        .single();

      if (!error && data) {
        // Found a matching cohort; use it
        bestMatch = data;
        break;
      }
    }

    // If no specific cohort found, try 'global' as fallback
    if (!bestMatch) {
      const { data } = await supabase
        .from('guardian_network_aggregates_daily')
        .select(
          `
          p50,
          p75,
          p90,
          p95,
          p99,
          mean,
          stddev,
          sample_size,
          cohort_key
        `
        )
        .eq('bucket_date', dateStr)
        .eq('cohort_key', 'global')
        .eq('metric_family', sample.metricFamily)
        .eq('metric_key', sample.metricKey)
        .single();

      if (data) {
        bestMatch = data;
      }
    }

    if (bestMatch) {
      result.set(mapKey, {
        cohortKey: bestMatch.cohort_key,
        stats: {
          p50: bestMatch.p50,
          p75: bestMatch.p75,
          p90: bestMatch.p90,
          p95: bestMatch.p95,
          p99: bestMatch.p99,
          mean: bestMatch.mean,
          stddev: bestMatch.stddev,
          sampleSize: bestMatch.sample_size,
        },
      });
    }
  }

  return result;
}

/**
 * Build benchmark snapshots for a tenant on a specific date.
 *
 * Pipeline:
 * 1. Sample this tenant's daily metrics
 * 2. Fetch matching cohort aggregates
 * 3. Insert/upsert into guardian_network_benchmark_snapshots
 * 4. Return the samples for use by anomaly detection
 *
 * Idempotent: Re-running same date overwrites previous snapshots.
 */
export async function buildBenchmarkSnapshotsForDate(
  tenantId: string,
  bucketDate: Date
): Promise<GuardianTenantMetricSample[]> {
  const supabase = getSupabaseServer();

  // Step 1: Sample this tenant's metrics
  const samples = await sampleTenantMetricsForDate(tenantId, bucketDate);

  if (samples.length === 0) {
    return []; // No metrics for this date
  }

  // Step 2: Fetch cohort aggregates
  const cohortMap = await fetchCohortAggregatesForSamples(
    tenantId,
    samples,
    bucketDate
  );

  // Step 3: Build rows for insertion
  const snapshotRows = samples
    .filter((sample) => cohortMap.has(`${sample.metricFamily}:${sample.metricKey}`))
    .map((sample) => {
      const cohort = cohortMap.get(
        `${sample.metricFamily}:${sample.metricKey}`
      )!;
      return {
        tenant_id: tenantId,
        bucket_date: sample.bucketDate,
        metric_family: sample.metricFamily,
        metric_key: sample.metricKey,
        tenant_value: sample.value,
        cohort_key: cohort.cohortKey,
        p50: cohort.stats.p50 ?? null,
        p75: cohort.stats.p75 ?? null,
        p90: cohort.stats.p90 ?? null,
        p95: cohort.stats.p95 ?? null,
        p99: cohort.stats.p99 ?? null,
        mean: cohort.stats.mean ?? null,
        stddev: cohort.stats.stddev ?? null,
        sample_size: cohort.stats.sampleSize,
        metadata: {},
      };
    });

  // Step 4: Upsert snapshots (idempotent)
  if (snapshotRows.length > 0) {
    const { error } = await supabase
      .from('guardian_network_benchmark_snapshots')
      .upsert(snapshotRows, {
        onConflict:
          'tenant_id,bucket_date,metric_family,metric_key,cohort_key',
      });

    if (error) {
      console.error(
        `[Guardian X02] Failed to upsert benchmark snapshots for tenant ${tenantId}:`,
        error
      );
      throw new Error(`Failed to build benchmark snapshots: ${error.message}`);
    }
  }

  return samples;
}
