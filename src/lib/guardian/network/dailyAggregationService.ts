/**
 * Guardian X01: Daily Network Aggregation Pipeline
 *
 * Computes per-cohort percentiles (p50, p75, p90, p95, p99, mean, stddev) from hourly telemetry.
 * Enforces k-anonymity: only publishes aggregates with sample_size >= minimum threshold.
 * Runs daily to generate safe-to-expose network benchmarks.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface AggregateResult {
  date: Date;
  cohortKey: string;
  metricFamily: string;
  metricKey: string;
  percentiles: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
    mean: number;
    stddev: number;
  };
  sampleSize: number;
  status: 'published' | 'redacted'; // 'redacted' if sample_size < minimum
}

/**
 * Compute statistics from an array of numeric values.
 * Returns percentiles (p50, p75, p90, p95, p99), mean, and standard deviation.
 */
function computeStatistics(
  values: number[]
): {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  mean: number;
  stddev: number;
} {
  if (values.length === 0) {
    return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, mean: 0, stddev: 0 };
  }

  // Sort values
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  // Percentile helper: linear interpolation
  const percentile = (p: number): number => {
    const index = (p / 100) * (n - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
return sorted[lower];
}
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  // Mean
  const mean = values.reduce((sum, v) => sum + v, 0) / n;

  // Standard deviation
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const stddev = Math.sqrt(variance);

  return {
    p50: percentile(50),
    p75: percentile(75),
    p90: percentile(90),
    p95: percentile(95),
    p99: percentile(99),
    mean,
    stddev,
  };
}

/**
 * Build daily aggregates for a specific date.
 *
 * Pipeline:
 * 1. Fetch all hourly telemetry for the date
 * 2. Group by (cohort_key, metric_family, metric_key)
 * 3. Compute percentiles and statistics
 * 4. Enforce k-anonymity: only insert if sample_size >= minSampleSize
 * 5. Upsert into guardian_network_aggregates_daily
 *
 * Idempotent: Re-running for same date overwrites previous aggregates.
 */
export async function buildDailyAggregatesForDate(
  date: Date,
  minSampleSize: number = 5
): Promise<AggregateResult[]> {
  const supabase = getSupabaseServer();

  // Normalize date to midnight UTC
  const bucketDate = new Date(date);
  bucketDate.setUTCHours(0, 0, 0, 0);

  const nextDate = new Date(bucketDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  // Step 1: Fetch all hourly telemetry for this date
  const { data: hourlyData, error: fetchError } = await supabase
    .from('guardian_network_telemetry_hourly')
    .select(
      `
      tenant_hash,
      bucket_start,
      metric_family,
      metric_key,
      metric_value
    `
    )
    .gte('bucket_start', bucketDate.toISOString())
    .lt('bucket_start', nextDate.toISOString());

  if (fetchError) {
    throw new Error(`Failed to fetch hourly telemetry: ${fetchError.message}`);
  }

  if (!hourlyData || hourlyData.length === 0) {
    return [];
  }

  // Fetch tenant fingerprints to map tenant_hash → cohort_keys
  const { data: fingerprints, error: fpError } = await supabase
    .from('guardian_network_tenant_fingerprints')
    .select('tenant_hash, region, size_band, vertical');

  if (fpError) {
    throw new Error(`Failed to fetch fingerprints: ${fpError.message}`);
  }

  const fingerprintMap: Record<
    string,
    { region?: string; sizeBand?: string; vertical?: string }
  > = {};
  if (fingerprints) {
    fingerprints.forEach((fp) => {
      fingerprintMap[fp.tenant_hash] = {
        region: fp.region,
        sizeBand: fp.size_band,
        vertical: fp.vertical,
      };
    });
  }

  // Step 2: Group by (tenant_hash, metric_family, metric_key)
  // Then expand to all cohort combinations
  const cohortAggregates: Record<
    string,
    Record<string, Record<string, number[]>>
  > = {};

  hourlyData.forEach((row) => {
    const fp = fingerprintMap[row.tenant_hash];
    if (!fp) {
return;
} // Fingerprint not found; skip

    // Compute all cohort keys for this tenant
    const cohortKeys = ['global'];
    if (fp.region) {
cohortKeys.push(`region:${fp.region}`);
}
    if (fp.sizeBand) {
cohortKeys.push(`size:${fp.sizeBand}`);
}
    if (fp.vertical) {
cohortKeys.push(`vertical:${fp.vertical}`);
}

    // For each cohort key, add this metric to the aggregation
    cohortKeys.forEach((cohortKey) => {
      if (!cohortAggregates[cohortKey]) {
        cohortAggregates[cohortKey] = {};
      }
      if (!cohortAggregates[cohortKey][row.metric_family]) {
        cohortAggregates[cohortKey][row.metric_family] = {};
      }
      if (!cohortAggregates[cohortKey][row.metric_family][row.metric_key]) {
        cohortAggregates[cohortKey][row.metric_family][row.metric_key] = [];
      }

      cohortAggregates[cohortKey][row.metric_family][row.metric_key].push(
        row.metric_value
      );
    });
  });

  // Step 3: Compute statistics and build insert rows
  const results: AggregateResult[] = [];
  const insertRows: any[] = [];

  Object.entries(cohortAggregates).forEach(([cohortKey, metrics]) => {
    Object.entries(metrics).forEach(([metricFamily, keys]) => {
      Object.entries(keys).forEach(([metricKey, values]) => {
        const sampleSize = new Set(
          hourlyData
            .filter(
              (row) =>
                row.metric_family === metricFamily &&
                row.metric_key === metricKey
            )
            .map((row) => row.tenant_hash)
        ).size; // Count unique tenant_hash contributors

        const stats = computeStatistics(values);
        const status = sampleSize >= minSampleSize ? 'published' : 'redacted';

        results.push({
          date: bucketDate,
          cohortKey,
          metricFamily,
          metricKey,
          percentiles: stats,
          sampleSize,
          status,
        });

        // Only insert published aggregates
        if (status === 'published') {
          insertRows.push({
            bucket_date: bucketDate.toISOString().split('T')[0], // YYYY-MM-DD
            cohort_key: cohortKey,
            metric_family: metricFamily,
            metric_key: metricKey,
            p50: Math.round(stats.p50 * 100) / 100,
            p75: Math.round(stats.p75 * 100) / 100,
            p90: Math.round(stats.p90 * 100) / 100,
            p95: Math.round(stats.p95 * 100) / 100,
            p99: Math.round(stats.p99 * 100) / 100,
            mean: Math.round(stats.mean * 100) / 100,
            stddev: Math.round(stats.stddev * 100) / 100,
            sample_size: sampleSize,
          });
        }
      });
    });
  });

  // Step 4: Upsert aggregates (idempotent)
  if (insertRows.length > 0) {
    const { error: upsertError } = await supabase
      .from('guardian_network_aggregates_daily')
      .upsert(insertRows, {
        onConflict: 'bucket_date,cohort_key,metric_family,metric_key',
      });

    if (upsertError) {
      throw new Error(`Failed to upsert aggregates: ${upsertError.message}`);
    }
  }

  return results;
}

/**
 * Build aggregates for a date range (backfilling).
 *
 * Useful for:
 * - Initial backfill after deployment
 * - Recovering missed aggregation windows
 */
export async function buildDailyAggregatesForDateRange(
  startDate: Date,
  endDate: Date,
  minSampleSize: number = 5
): Promise<AggregateResult[]> {
  const allResults: AggregateResult[] = [];

  const currentDate = new Date(startDate);
  currentDate.setUTCHours(0, 0, 0, 0);

  while (currentDate < endDate) {
    const results = await buildDailyAggregatesForDate(currentDate, minSampleSize);
    allResults.push(...results);

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return allResults;
}

/**
 * Cleanup: Delete old aggregates and telemetry (beyond retention window).
 *
 * Retention policies:
 * - Hourly telemetry: 90 days
 * - Daily aggregates: 365 days
 *
 * Run weekly via cron job to reclaim storage.
 */
export async function cleanupOldTelemetry(hoursRetention: number = 90 * 24): Promise<void> {
  const supabase = getSupabaseServer();

  const cutoffDate = new Date();
  cutoffDate.setUTCHours(cutoffDate.getUTCHours() - hoursRetention);

  // Delete old hourly telemetry
  const { error: deleteHourlyError } = await supabase
    .from('guardian_network_telemetry_hourly')
    .delete()
    .lt('bucket_start', cutoffDate.toISOString());

  if (deleteHourlyError) {
    console.error(
      `[Guardian X01] Failed to cleanup hourly telemetry: ${deleteHourlyError.message}`
    );
  }

  // Delete old daily aggregates (365 days)
  const cutoffAggregate = new Date();
  cutoffAggregate.setUTCDate(cutoffAggregate.getUTCDate() - 365);
  const cutoffAggregateStr = cutoffAggregate.toISOString().split('T')[0];

  const { error: deleteAggError } = await supabase
    .from('guardian_network_aggregates_daily')
    .delete()
    .lt('bucket_date', cutoffAggregateStr);

  if (deleteAggError) {
    console.error(
      `[Guardian X01] Failed to cleanup daily aggregates: ${deleteAggError.message}`
    );
  }
}
