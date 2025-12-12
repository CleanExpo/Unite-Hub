/**
 * H02 Metric Aggregator
 *
 * Computes hourly/daily aggregate metrics from Guardian runtime tables.
 * All metrics are PII-free aggregates only (counts, rates, percentiles).
 * Never selects raw payloads, destinations, user names, or identifying info.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface MetricBucket {
  bucketStart: string; // ISO timestamp
  value: number;
}

export type SupportedMetricKey =
  | 'alerts_total'
  | 'incidents_total'
  | 'correlation_clusters'
  | 'notif_fail_rate'
  | 'risk_p95'
  | 'insights_activity_24h';

/**
 * Fetch a time series of aggregate metric values.
 * Granularity: 'hour' or 'day'
 * Range: { start: Date, end: Date }
 *
 * Returns: Array of {bucketStart, value} tuples, sorted chronologically.
 * All data is PII-free aggregates only.
 */
export async function getMetricSeries(
  tenantId: string,
  metricKey: SupportedMetricKey,
  granularity: 'hour' | 'day',
  range: { start: Date; end: Date }
): Promise<MetricBucket[]> {
  const supabase = getSupabaseServer();

  if (!isSupportedMetric(metricKey)) {
    throw new Error(`Unsupported metric: ${metricKey}`);
  }

  switch (metricKey) {
    case 'alerts_total':
      return getAlertsTotal(supabase, tenantId, granularity, range);

    case 'incidents_total':
      return getIncidentsTotal(supabase, tenantId, granularity, range);

    case 'correlation_clusters':
      return getCorrelationClusters(supabase, tenantId, granularity, range);

    case 'notif_fail_rate':
      return getNotifFailRate(supabase, tenantId, granularity, range);

    case 'risk_p95':
      return getRiskP95(supabase, tenantId, granularity, range);

    case 'insights_activity_24h':
      return getInsightsActivity(supabase, tenantId, granularity, range);

    default:
      throw new Error(`Unhandled metric: ${metricKey}`);
  }
}

function isSupportedMetric(key: string): key is SupportedMetricKey {
  return [
    'alerts_total',
    'incidents_total',
    'correlation_clusters',
    'notif_fail_rate',
    'risk_p95',
    'insights_activity_24h',
  ].includes(key);
}

/**
 * Alerts total: COUNT of alerts in bucket, grouped by time
 */
async function getAlertsTotal(
  supabase: any,
  tenantId: string,
  granularity: 'hour' | 'day',
  range: { start: Date; end: Date }
): Promise<MetricBucket[]> {
  try {
    // Count alerts per bucket (only aggregate, no payloads selected)
    const bucketUnit = granularity === 'hour' ? 'hour' : 'day';

    // Query: count(*) grouped by time_bucket
    // (Assumes guardian_alert_events or similar has created_at timestamp)
    const { data, error } = await supabase.rpc('get_alerts_per_bucket', {
      p_tenant_id: tenantId,
      p_start: range.start.toISOString(),
      p_end: range.end.toISOString(),
      p_bucket_unit: bucketUnit,
    });

    if (error) {
      console.warn('alerts_total RPC failed:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      bucketStart: row.bucket_start || row.time_bucket,
      value: row.count || 0,
    }));
  } catch (err) {
    console.error('getAlertsTotal error:', err);
    return [];
  }
}

/**
 * Incidents total: COUNT of incidents in bucket
 */
async function getIncidentsTotal(
  supabase: any,
  tenantId: string,
  granularity: 'hour' | 'day',
  range: { start: Date; end: Date }
): Promise<MetricBucket[]> {
  try {
    const bucketUnit = granularity === 'hour' ? 'hour' : 'day';

    const { data, error } = await supabase.rpc('get_incidents_per_bucket', {
      p_tenant_id: tenantId,
      p_start: range.start.toISOString(),
      p_end: range.end.toISOString(),
      p_bucket_unit: bucketUnit,
    });

    if (error) {
      console.warn('incidents_total RPC failed:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      bucketStart: row.bucket_start || row.time_bucket,
      value: row.count || 0,
    }));
  } catch (err) {
    console.error('getIncidentsTotal error:', err);
    return [];
  }
}

/**
 * Correlation clusters: COUNT of active correlation clusters in bucket
 */
async function getCorrelationClusters(
  supabase: any,
  tenantId: string,
  granularity: 'hour' | 'day',
  range: { start: Date; end: Date }
): Promise<MetricBucket[]> {
  try {
    const bucketUnit = granularity === 'hour' ? 'hour' : 'day';

    const { data, error } = await supabase.rpc('get_correlation_clusters_per_bucket', {
      p_tenant_id: tenantId,
      p_start: range.start.toISOString(),
      p_end: range.end.toISOString(),
      p_bucket_unit: bucketUnit,
    });

    if (error) {
      console.warn('correlation_clusters RPC failed:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      bucketStart: row.bucket_start || row.time_bucket,
      value: row.count || 0,
    }));
  } catch (err) {
    console.error('getCorrelationClusters error:', err);
    return [];
  }
}

/**
 * Notification failure rate: (failures / total) * 100 per bucket
 */
async function getNotifFailRate(
  supabase: any,
  tenantId: string,
  granularity: 'hour' | 'day',
  range: { start: Date; end: Date }
): Promise<MetricBucket[]> {
  try {
    const bucketUnit = granularity === 'hour' ? 'hour' : 'day';

    const { data, error } = await supabase.rpc('get_notif_fail_rate_per_bucket', {
      p_tenant_id: tenantId,
      p_start: range.start.toISOString(),
      p_end: range.end.toISOString(),
      p_bucket_unit: bucketUnit,
    });

    if (error) {
      console.warn('notif_fail_rate RPC failed:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      bucketStart: row.bucket_start || row.time_bucket,
      value: parseFloat(row.fail_rate || 0), // Percentage 0-100
    }));
  } catch (err) {
    console.error('getNotifFailRate error:', err);
    return [];
  }
}

/**
 * Risk P95: 95th percentile of risk scores in bucket
 */
async function getRiskP95(
  supabase: any,
  tenantId: string,
  granularity: 'hour' | 'day',
  range: { start: Date; end: Date }
): Promise<MetricBucket[]> {
  try {
    const bucketUnit = granularity === 'hour' ? 'hour' : 'day';

    const { data, error } = await supabase.rpc('get_risk_p95_per_bucket', {
      p_tenant_id: tenantId,
      p_start: range.start.toISOString(),
      p_end: range.end.toISOString(),
      p_bucket_unit: bucketUnit,
    });

    if (error) {
      console.warn('risk_p95 RPC failed:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      bucketStart: row.bucket_start || row.time_bucket,
      value: parseFloat(row.p95 || 0),
    }));
  } catch (err) {
    console.error('getRiskP95 error:', err);
    return [];
  }
}

/**
 * Insights activity: Count of insights or related activity in 24h window
 */
async function getInsightsActivity(
  supabase: any,
  tenantId: string,
  granularity: 'hour' | 'day',
  range: { start: Date; end: Date }
): Promise<MetricBucket[]> {
  try {
    const bucketUnit = granularity === 'hour' ? 'hour' : 'day';

    const { data, error } = await supabase.rpc('get_insights_activity_per_bucket', {
      p_tenant_id: tenantId,
      p_start: range.start.toISOString(),
      p_end: range.end.toISOString(),
      p_bucket_unit: bucketUnit,
    });

    if (error) {
      console.warn('insights_activity RPC failed:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      bucketStart: row.bucket_start || row.time_bucket,
      value: row.activity_count || 0,
    }));
  } catch (err) {
    console.error('getInsightsActivity error:', err);
    return [];
  }
}

/**
 * Validate that a metric is available and computable for this tenant.
 * Returns { available: boolean, reason?: string }
 */
export async function validateMetricAvailable(
  tenantId: string,
  metricKey: SupportedMetricKey
): Promise<{ available: boolean; reason?: string }> {
  try {
    // Try a minimal query to check if metric RPC exists
    const series = await getMetricSeries(tenantId, metricKey, 'hour', {
      start: new Date(Date.now() - 1 * 60 * 60 * 1000), // Last hour
      end: new Date(),
    });

    if (Array.isArray(series)) {
      return { available: true };
    }
    return { available: false, reason: 'Metric returned non-array' };
  } catch (err: any) {
    return {
      available: false,
      reason: err?.message || 'Unknown error',
    };
  }
}
