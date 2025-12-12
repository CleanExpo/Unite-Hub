/**
 * H02 Baseline Builder
 *
 * Computes rolling baselines from time-series aggregates using three methods:
 * - Z-Score: mean ± std dev, optionally with seasonal patterns
 * - EWMA: Exponential weighted moving average with variance tracking
 * - IQR: Interquartile range with fence detection
 *
 * All baseline statistics are aggregate-only and PII-free.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { getMetricSeries, type MetricBucket, type SupportedMetricKey } from './anomalyMetricAggregator';

export interface BaselineStats {
  method: 'zscore' | 'ewma' | 'iqr';
  zscore?: {
    mean: number;
    stddev: number;
    seasonal?: Record<string, { mean: number; stddev: number }>;
  };
  ewma?: {
    alpha: number;
    mean: number;
    variance: number;
  };
  iqr?: {
    median: number;
    q1: number;
    q3: number;
    iqr: number;
    lower_fence: number;
    upper_fence: number;
  };
  datapoints: number;
  min_value: number;
  max_value: number;
}

/**
 * Compute baseline statistics from a series of values
 */
export function computeBaseline(
  series: number[],
  method: 'zscore' | 'ewma' | 'iqr',
  windowSize: number,
  _lookback: number
): BaselineStats {
  if (series.length === 0) {
    throw new Error('Cannot compute baseline from empty series');
  }

  const minVal = Math.min(...series);
  const maxVal = Math.max(...series);

  switch (method) {
    case 'zscore':
      return computeZscoreBaseline(series, minVal, maxVal);

    case 'ewma':
      return computeEwmaBaseline(series, minVal, maxVal);

    case 'iqr':
      return computeIqrBaseline(series, minVal, maxVal);

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

function computeZscoreBaseline(
  series: number[],
  minVal: number,
  maxVal: number
): BaselineStats {
  const mean = series.reduce((a, b) => a + b, 0) / series.length;
  const variance =
    series.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / series.length;
  const stddev = Math.sqrt(variance);

  return {
    method: 'zscore',
    zscore: {
      mean,
      stddev,
      // Optionally add seasonal: { 'hour_0': {...}, ... }
      // For now, keep simple
    },
    datapoints: series.length,
    min_value: minVal,
    max_value: maxVal,
  };
}

function computeEwmaBaseline(
  series: number[],
  minVal: number,
  maxVal: number
): BaselineStats {
  // Simple EWMA: alpha = 2 / (N + 1)
  const alpha = 2 / (series.length + 1);

  let ewmaMean = series[0];
  let ewmaVar = 0;

  for (let i = 1; i < series.length; i++) {
    const prevMean = ewmaMean;
    ewmaMean = alpha * series[i] + (1 - alpha) * prevMean;
    ewmaVar = alpha * Math.pow(series[i] - ewmaMean, 2) + (1 - alpha) * ewmaVar;
  }

  return {
    method: 'ewma',
    ewma: {
      alpha,
      mean: ewmaMean,
      variance: ewmaVar,
    },
    datapoints: series.length,
    min_value: minVal,
    max_value: maxVal,
  };
}

function computeIqrBaseline(
  series: number[],
  minVal: number,
  maxVal: number
): BaselineStats {
  const sorted = [...series].sort((a, b) => a - b);
  const n = sorted.length;

  const q1Index = Math.floor(n * 0.25);
  const medianIndex = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);

  const q1 = sorted[q1Index];
  const median = sorted[medianIndex];
  const q3 = sorted[q3Index];

  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  return {
    method: 'iqr',
    iqr: {
      median,
      q1,
      q3,
      iqr,
      lower_fence: lowerFence,
      upper_fence: upperFence,
    },
    datapoints: n,
    min_value: minVal,
    max_value: maxVal,
  };
}

/**
 * Build and store baseline for a detector
 */
export async function buildAndStoreBaseline(
  tenantId: string,
  detectorId: string
): Promise<{ baselineId: string; datapoints: number; stats: BaselineStats }> {
  const supabase = getSupabaseServer();

  // Load detector config
  const { data: detector, error: detectorError } = await supabase
    .from('guardian_anomaly_detectors')
    .select('*')
    .eq('id', detectorId)
    .eq('tenant_id', tenantId)
    .single();

  if (detectorError || !detector) {
    throw new Error(`Detector not found: ${detectorId}`);
  }

  const {
    metric_key: metricKey,
    granularity,
    baseline_lookback: lookback,
    method,
  } = detector;

  // Compute lookback window in hours
  const lookbackHours = granularity === 'day' ? lookback * 24 : lookback;
  const startTime = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
  const endTime = new Date();

  // Fetch metric series
  const series = await getMetricSeries(tenantId, metricKey as SupportedMetricKey, granularity, {
    start: startTime,
    end: endTime,
  });

  if (series.length === 0) {
    throw new Error(`No data available for metric: ${metricKey}`);
  }

  // Extract values
  const values = series.map((b) => b.value);

  // Compute baseline
  const stats = computeBaseline(values, method, detector.window_size, lookback);

  // Store in DB
  const { data: baseline, error: storeError } = await supabase
    .from('guardian_anomaly_baselines')
    .insert({
      tenant_id: tenantId,
      detector_id: detectorId,
      period_start: startTime.toISOString(),
      period_end: endTime.toISOString(),
      stats,
    })
    .select('id')
    .single();

  if (storeError || !baseline) {
    throw new Error(`Failed to store baseline: ${storeError?.message}`);
  }

  return {
    baselineId: baseline.id,
    datapoints: values.length,
    stats,
  };
}

/**
 * Get the most recent baseline for a detector
 */
export async function getLatestBaseline(
  tenantId: string,
  detectorId: string
): Promise<(BaselineStats & { baselineId: string; computedAt: string }) | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_anomaly_baselines')
    .select('id, stats, computed_at')
    .eq('tenant_id', tenantId)
    .eq('detector_id', detectorId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    baselineId: data.id,
    computedAt: data.computed_at,
    ...data.stats,
  };
}

/**
 * Check if a detector has a recent baseline
 */
export async function hasRecentBaseline(
  tenantId: string,
  detectorId: string,
  maxAgeHours: number = 24
): Promise<boolean> {
  const baseline = await getLatestBaseline(tenantId, detectorId);
  if (!baseline) return false;

  const computedAt = new Date(baseline.computedAt);
  const ageHours = (Date.now() - computedAt.getTime()) / (1000 * 60 * 60);

  return ageHours <= maxAgeHours;
}
