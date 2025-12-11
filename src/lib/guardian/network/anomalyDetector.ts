/**
 * Guardian X02: Network Anomaly Detector
 *
 * Detects per-tenant anomalies by comparing their metrics to network cohort baselines.
 * Persists anomaly signals with severity and explanation for operator review.
 *
 * Privacy: Uses only this tenant's metrics + aggregated cohort statistics.
 * No individual tenant cross-references or raw data from other tenants.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { buildBenchmarkSnapshotsForDate } from './benchmarkBuilder';
import {
  classifyAnomaly,
  shouldPersistAnomaly,
  type GuardianNetworkBaselineInput,
} from './baselineModel';

export interface GuardianAnomalyDetectionOptions {
  bucketDate: Date;
  metricFamilies?: string[];
  minSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DetectionResult {
  tenantId: string;
  bucketDate: Date;
  anomaliesDetected: number;
  anomaliesPersisted: number;
}

/**
 * Detect anomalies for a single tenant on a specific date.
 *
 * Pipeline:
 * 1. Build/refresh benchmark snapshots for the date
 * 2. Load snapshots for the tenant
 * 3. For each snapshot, classify anomaly against cohort baseline
 * 4. Persist anomalies that meet severity threshold
 * 5. Deduplicate: update existing anomaly if detected again
 */
export async function detectAnomaliesForTenant(
  tenantId: string,
  options: GuardianAnomalyDetectionOptions
): Promise<DetectionResult> {
  const supabase = getSupabaseServer();

  // Step 1: Build benchmark snapshots (refreshes from telemetry + cohort aggregates)
  await buildBenchmarkSnapshotsForDate(tenantId, options.bucketDate);

  // Step 2: Load benchmark snapshots for this tenant/date
  const { data: snapshots, error: snapError } = await supabase
    .from('guardian_network_benchmark_snapshots')
    .select(
      `
      id,
      bucket_date,
      metric_family,
      metric_key,
      tenant_value,
      cohort_key,
      cohort_p50,
      cohort_p75,
      cohort_p90,
      cohort_p95,
      cohort_p99,
      mean,
      stddev,
      sample_size
    `
    )
    .eq('tenant_id', tenantId)
    .eq('bucket_date', options.bucketDate.toISOString().split('T')[0]);

  if (snapError) {
    console.error(
      `[Guardian X02] Failed to load benchmark snapshots for tenant ${tenantId}:`,
      snapError
    );
    throw new Error(`Failed to detect anomalies: ${snapError.message}`);
  }

  if (!snapshots || snapshots.length === 0) {
    return {
      tenantId,
      bucketDate: options.bucketDate,
      anomaliesDetected: 0,
      anomaliesPersisted: 0,
    };
  }

  let anomaliesDetected = 0;
  let anomaliesPersisted = 0;

  // Step 3 & 4: Classify and persist anomalies
  const anomalyRows: any[] = [];

  for (const snap of snapshots) {
    // Filter by options if provided
    if (
      options.metricFamilies &&
      !options.metricFamilies.includes(snap.metric_family)
    ) {
      continue;
    }

    // Build baseline input for classification
    const baselineInput: GuardianNetworkBaselineInput = {
      tenantMetricValue: snap.tenant_value,
      cohortStats: {
        p50: snap.cohort_p50 ?? undefined,
        p75: snap.cohort_p75 ?? undefined,
        p90: snap.cohort_p90 ?? undefined,
        p95: snap.cohort_p95 ?? undefined,
        p99: snap.cohort_p99 ?? undefined,
        mean: snap.mean ?? undefined,
        stddev: snap.stddev ?? undefined,
        sampleSize: snap.sample_size,
        cohortKey: snap.cohort_key,
      },
    };

    // Classify anomaly
    const classification = classifyAnomaly(baselineInput);

    // Check if we should persist this anomaly
    if (shouldPersistAnomaly(classification.severity, options.minSeverity)) {
      anomaliesDetected += 1;

      // Prepare row for insertion
      const windowStart = new Date(options.bucketDate);
      windowStart.setUTCHours(0, 0, 0, 0);

      const windowEnd = new Date(windowStart);
      windowEnd.setUTCDate(windowEnd.getUTCDate() + 1);

      anomalyRows.push({
        tenant_id: tenantId,
        metric_family: snap.metric_family,
        metric_key: snap.metric_key,
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
        anomaly_type: classification.anomalyType,
        severity: classification.severity,
        tenant_value: snap.tenant_value,
        cohort_p50: snap.cohort_p50,
        cohort_p90: snap.cohort_p90,
        cohort_p95: snap.cohort_p95,
        z_score: classification.zScore ?? null,
        delta_ratio: classification.deltaRatio ?? null,
        sample_size: snap.sample_size,
        cohort_key: snap.cohort_key,
        explanation: classification.explanation,
        metadata: {},
      });
    }
  }

  // Step 5: Upsert anomalies (deduplicate on conflict)
  if (anomalyRows.length > 0) {
    const { data: insertedRows, error: insertError } = await supabase
      .from('guardian_network_anomaly_signals')
      .upsert(anomalyRows, {
        onConflict:
          'tenant_id,metric_family,metric_key,window_start,anomaly_type',
      });

    if (insertError) {
      console.error(
        `[Guardian X02] Failed to upsert anomaly signals for tenant ${tenantId}:`,
        insertError
      );
      throw new Error(
        `Failed to persist anomalies: ${insertError.message}`
      );
    }

    if (insertedRows) {
      anomaliesPersisted = insertedRows.length;
    }
  }

  return {
    tenantId,
    bucketDate: options.bucketDate,
    anomaliesDetected,
    anomaliesPersisted,
  };
}

/**
 * Convenience helper: Detect anomalies for all active tenants on a specific date.
 *
 * Used by scheduled jobs (cron tasks).
 * In large deployments, migrate this to a proper job queue/worker.
 *
 * Runs detection in batches with concurrency limit to avoid overwhelming the database.
 */
export async function detectAnomaliesForDateAllTenants(
  bucketDate: Date,
  options?: Omit<GuardianAnomalyDetectionOptions, 'bucketDate'>
): Promise<DetectionResult[]> {
  const supabase = getSupabaseServer();

  // Fetch all active workspace IDs (tenant IDs)
  const { data: workspaces, error: fetchError } = await supabase
    .from('workspaces')
    .select('id')
    .is('deleted_at', null)
    .limit(1000); // Safety limit

  if (fetchError) {
    console.error('[Guardian X02] Failed to fetch workspaces:', fetchError);
    throw new Error(`Failed to fetch tenants: ${fetchError.message}`);
  }

  if (!workspaces || workspaces.length === 0) {
    return [];
  }

  const results: DetectionResult[] = [];

  // Process in batches with concurrency limit
  const concurrency = 5;
  for (let i = 0; i < workspaces.length; i += concurrency) {
    const batch = workspaces.slice(i, i + concurrency);

    const batchPromises = batch.map((workspace) =>
      detectAnomaliesForTenant(workspace.id, {
        bucketDate,
        ...options,
      }).catch((err) => {
        console.error(
          `[Guardian X02] Failed to detect anomalies for tenant ${workspace.id}:`,
          err
        );
        // Return null on error; continue with other tenants
        return null;
      })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(
      ...(batchResults.filter((r) => r !== null) as DetectionResult[])
    );
  }

  return results;
}
