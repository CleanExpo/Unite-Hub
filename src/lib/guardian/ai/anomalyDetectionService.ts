/**
 * H02 Anomaly Detection Service
 *
 * Evaluates latest observations against baselines and creates anomaly events.
 * Supports z-score, EWMA, and IQR detection methods.
 * Advisory-only: anomalies do not auto-create incidents/rules.
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  getMetricSeries,
  type MetricBucket,
  type SupportedMetricKey,
} from './anomalyMetricAggregator';
import {
  buildAndStoreBaseline,
  getLatestBaseline,
  hasRecentBaseline,
  type BaselineStats,
} from './anomalyBaselineService';

export interface AnomalyDetectionResult {
  fired: boolean;
  eventId?: string;
  score?: number;
  severity?: 'info' | 'warn' | 'high' | 'critical';
  summary?: string;
}

export interface DetectorEvaluationResult {
  detectorId: string;
  detectorName: string;
  fired: boolean;
  eventId?: string;
  score?: number;
  severity?: 'info' | 'warn' | 'high' | 'critical';
  error?: string;
}

/**
 * Evaluate a single detector: check baseline and current observation
 */
export async function evaluateDetector(
  tenantId: string,
  detectorId: string,
  now: Date = new Date()
): Promise<AnomalyDetectionResult> {
  const supabase = getSupabaseServer();

  try {
    // Load detector
    const { data: detector, error: detectorError } = await supabase
      .from('guardian_anomaly_detectors')
      .select('*')
      .eq('id', detectorId)
      .eq('tenant_id', tenantId)
      .single();

    if (detectorError || !detector) {
      throw new Error(`Detector not found: ${detectorId}`);
    }

    if (!detector.is_active) {
      return { fired: false };
    }

    // Ensure baseline exists and is recent
    const hasRecent = await hasRecentBaseline(tenantId, detectorId, 24);
    if (!hasRecent) {
      // Build new baseline
      await buildAndStoreBaseline(tenantId, detectorId);
    }

    // Get latest baseline
    const baseline = await getLatestBaseline(tenantId, detectorId);
    if (!baseline) {
      throw new Error('Failed to build or retrieve baseline');
    }

    // Fetch current observation (last bucket)
    const granularity = detector.granularity as 'hour' | 'day';
    const bucketSize = granularity === 'hour' ? 1 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const bucketStart = new Date(Math.floor(now.getTime() / bucketSize) * bucketSize);
    const bucketEnd = new Date(bucketStart.getTime() + bucketSize);

    const series = await getMetricSeries(tenantId, detector.metric_key, granularity, {
      start: new Date(bucketStart.getTime() - bucketSize), // Get last 2 buckets for trend
      end: bucketEnd,
    });

    if (series.length === 0) {
      return { fired: false };
    }

    // Get current observation (last bucket)
    const currentBucket = series[series.length - 1];
    const observedValue = currentBucket.value;

    // Apply min_count noise filter
    if (observedValue < detector.min_count) {
      return { fired: false };
    }

    // Compute score and check threshold
    const { fired, score, expectedValue, severity, summary, details } = computeAnomaly(
      observedValue,
      baseline,
      detector.method,
      detector.threshold,
      series
    );

    if (!fired) {
      return { fired: false };
    }

    // Create anomaly event
    const { data: event, error: eventError } = await supabase
      .from('guardian_anomaly_events')
      .insert({
        tenant_id: tenantId,
        detector_id: detectorId,
        observed_at: currentBucket.bucketStart,
        observed_value: observedValue,
        expected_value: expectedValue,
        score,
        severity,
        status: 'open',
        summary,
        details,
      })
      .select('id')
      .single();

    if (eventError || !event) {
      console.error('Failed to create anomaly event:', eventError);
      return { fired: true, score, severity };
    }

    return {
      fired: true,
      eventId: event.id,
      score,
      severity,
      summary,
    };
  } catch (error: any) {
    console.error(`Error evaluating detector ${detectorId}:`, error);
    throw error;
  }
}

/**
 * Compute anomaly score and check if threshold is exceeded
 */
function computeAnomaly(
  observedValue: number,
  baseline: BaselineStats,
  method: 'zscore' | 'ewma' | 'iqr',
  threshold: number,
  recentSeries: MetricBucket[]
): {
  fired: boolean;
  score: number;
  expectedValue: number;
  severity: 'info' | 'warn' | 'high' | 'critical';
  summary: string;
  details: Record<string, any>;
} {
  let score = 0;
  let expectedValue = 0;
  let fired = false;

  if (method === 'zscore' && baseline.zscore) {
    const { mean, stddev } = baseline.zscore;
    expectedValue = mean;
    if (stddev > 0) {
      score = Math.abs((observedValue - mean) / stddev);
      fired = score > threshold;
    }
  } else if (method === 'ewma' && baseline.ewma) {
    const { mean } = baseline.ewma;
    expectedValue = mean;
    const deviation = Math.abs(observedValue - mean);
    score = deviation;
    fired = deviation > threshold;
  } else if (method === 'iqr' && baseline.iqr) {
    const { lower_fence, upper_fence } = baseline.iqr;
    expectedValue = (baseline.iqr.q1 + baseline.iqr.q3) / 2;
    if (observedValue < lower_fence || observedValue > upper_fence) {
      fired = true;
      score = Math.max(
        Math.abs(observedValue - lower_fence),
        Math.abs(observedValue - upper_fence)
      );
    }
  }

  // Derive severity from score magnitude
  let severity: 'info' | 'warn' | 'high' | 'critical' = 'info';
  if (score >= threshold * 2.5) {
    severity = 'critical';
  } else if (score >= threshold * 1.5) {
    severity = 'high';
  } else if (score >= threshold) {
    severity = 'warn';
  }

  // Build summary
  const deviationPercent = ((observedValue - expectedValue) / expectedValue * 100).toFixed(1);
  const summary = `Metric exceeded baseline by ${Math.abs(Number(deviationPercent))}% (observed: ${observedValue}, expected: ${expectedValue.toFixed(2)})`;

  // Build details (PII-free context)
  const windowValues = recentSeries.map((b) => b.value);
  const windowAvg = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
  const trend =
    windowValues.length > 1
      ? windowValues[windowValues.length - 1] > windowValues[0]
        ? 'rising'
        : 'falling'
      : 'stable';

  const details = {
    window_values: windowValues,
    window_average: windowAvg,
    baseline_mean:
      method === 'zscore'
        ? baseline.zscore?.mean
        : method === 'ewma'
          ? baseline.ewma?.mean
          : baseline.iqr?.median,
    recent_trend: trend,
    baseline_method: method,
  };

  return {
    fired,
    score,
    expectedValue,
    severity,
    summary,
    details,
  };
}

/**
 * Run all active detectors for a tenant
 */
export async function runAllActiveDetectors(
  tenantId: string,
  now: Date = new Date(),
  options?: { detectorIds?: string[] }
): Promise<{ evaluated: number; fired: number; errors: number; results: DetectorEvaluationResult[] }> {
  const supabase = getSupabaseServer();

  // Load active detectors
  let query = supabase
    .from('guardian_anomaly_detectors')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (options?.detectorIds) {
    query = query.in('id', options.detectorIds);
  }

  const { data: detectors, error } = await query;

  if (error || !detectors) {
    console.error('Failed to load detectors:', error);
    return { evaluated: 0, fired: 0, errors: 1, results: [] };
  }

  let evaluated = 0;
  let fired = 0;
  let errors = 0;
  const results: DetectorEvaluationResult[] = [];

  // Evaluate each detector
  for (const detector of detectors) {
    evaluated++;
    try {
      const result = await evaluateDetector(tenantId, detector.id, now);
      if (result.fired) {
        fired++;
      }
      results.push({
        detectorId: detector.id,
        detectorName: detector.name,
        ...result,
      });
    } catch (err: any) {
      errors++;
      results.push({
        detectorId: detector.id,
        detectorName: detector.name,
        fired: false,
        error: err?.message || 'Unknown error',
      });
    }
  }

  return { evaluated, fired, errors, results };
}

/**
 * Get current anomaly status for a detector (latest open/unresolved event)
 */
export async function getDetectorAnomalyStatus(
  tenantId: string,
  detectorId: string
): Promise<any | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_anomaly_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('detector_id', detectorId)
    .in('status', ['open', 'acknowledged'])
    .order('observed_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
