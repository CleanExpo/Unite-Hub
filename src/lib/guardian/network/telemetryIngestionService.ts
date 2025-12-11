/**
 * Guardian X01: Telemetry Ingestion Service
 *
 * Orchestrates the full pipeline: tenant fingerprint → extraction → database insertion.
 * Idempotent over the same time window.
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  getTenantFingerprintByTenantId,
  computeCohortKeysForFingerprint,
} from './tenantFingerprintService';
import {
  extractHourlyTelemetryForTenant,
  mergeTelemetryPoints,
  type GuardianTelemetryPoint,
} from './telemetryExtractor';

export interface IngestionResult {
  tenantId: string;
  tenantHash: string;
  window: { start: Date; end: Date };
  pointsIngested: number;
  cohortKeys: string[];
}

/**
 * Ingest hourly telemetry for a single tenant.
 *
 * Pipeline:
 * 1. Get or create tenant fingerprint (compute hash)
 * 2. Extract hourly telemetry from Guardian & I-series tables
 * 3. Merge duplicate points
 * 4. Upsert into guardian_network_telemetry_hourly
 *
 * Idempotent: Same tenantId + window produces same result on re-run.
 */
export async function ingestHourlyTelemetryForTenant(
  tenantId: string,
  window: { start: Date; end: Date }
): Promise<IngestionResult> {
  const supabase = getSupabaseServer();

  // Step 1: Get tenant fingerprint (or create default)
  const fingerprint = await getTenantFingerprintByTenantId(tenantId);

  // Step 2: Extract telemetry points
  const rawPoints = await extractHourlyTelemetryForTenant(tenantId, window);

  // Step 3: Merge duplicates
  const mergedPoints = mergeTelemetryPoints(rawPoints);

  // Step 4: Upsert to database (idempotent)
  if (mergedPoints.length > 0) {
    const rows = mergedPoints.map((point) => ({
      tenant_hash: fingerprint.tenantHash,
      bucket_start: point.bucketStart.toISOString(),
      metric_family: point.metricFamily,
      metric_key: point.metricKey,
      metric_value: point.value,
      unit: point.unit || null,
      metadata: point.metadata || null,
    }));

    // Upsert: on conflict of (tenant_hash, bucket_start, metric_family, metric_key),
    // update the value (idempotent)
    const { error } = await supabase.from('guardian_network_telemetry_hourly').upsert(rows, {
      onConflict: 'tenant_hash,bucket_start,metric_family,metric_key',
    });

    if (error) {
      throw new Error(
        `Failed to ingest telemetry for tenant ${tenantId}: ${error.message}`
      );
    }
  }

  // Compute cohort keys for this tenant
  const cohortKeys = computeCohortKeysForFingerprint(fingerprint);

  return {
    tenantId,
    tenantHash: fingerprint.tenantHash,
    window,
    pointsIngested: mergedPoints.length,
    cohortKeys,
  };
}

/**
 * Ingest recent telemetry for all active tenants.
 *
 * Used as a background job to backfill or update network telemetry.
 * - Fetches all tenants from workspaces table
 * - For each, ingests telemetry for the past N hours
 * - Returns summary of ingestion results
 *
 * Recommended: Run hourly via cron job (e.g., /api/cron/ingest-network-telemetry)
 */
export async function ingestRecentTelemetryForAllTenants(
  hoursBack: number = 1
): Promise<IngestionResult[]> {
  const supabase = getSupabaseServer();

  // Fetch all active workspace IDs (tenant IDs in this system)
  const { data: workspaces, error: fetchError } = await supabase
    .from('workspaces')
    .select('id')
    .is('deleted_at', null)
    .limit(1000); // Safety limit

  if (fetchError) {
    throw new Error(`Failed to fetch workspaces: ${fetchError.message}`);
  }

  if (!workspaces || workspaces.length === 0) {
    return [];
  }

  // Compute time window: now - hoursBack to now
  const now = new Date();
  const start = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

  const results: IngestionResult[] = [];

  // Ingest for each tenant in parallel with concurrency limit
  const concurrency = 5; // Avoid overwhelming Supabase
  for (let i = 0; i < workspaces.length; i += concurrency) {
    const batch = workspaces.slice(i, i + concurrency);

    const batchPromises = batch.map((workspace) =>
      ingestHourlyTelemetryForTenant(workspace.id, { start, end: now }).catch(
        (err) => {
          console.error(
            `[Guardian X01] Failed to ingest telemetry for tenant ${workspace.id}:`,
            err
          );
          // Return null on error; we continue with other tenants
          return null;
        }
      )
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r) => r !== null) as IngestionResult[]);
  }

  return results;
}

/**
 * Ingest telemetry for a specific time range (for backfilling or data recovery).
 *
 * Useful for:
 * - Backfilling historical telemetry
 * - Recovering from missed ingestion windows
 * - Debugging specific time periods
 */
export async function ingestTelemetryForDateRange(
  startDate: Date,
  endDate: Date
): Promise<IngestionResult[]> {
  const supabase = getSupabaseServer();

  // Fetch all active workspace IDs
  const { data: workspaces, error: fetchError } = await supabase
    .from('workspaces')
    .select('id')
    .is('deleted_at', null)
    .limit(1000);

  if (fetchError) {
    throw new Error(`Failed to fetch workspaces: ${fetchError.message}`);
  }

  if (!workspaces || workspaces.length === 0) {
    return [];
  }

  const results: IngestionResult[] = [];

  // Walk through hours in the range
  let currentHourStart = new Date(startDate);
  currentHourStart.setUTCMinutes(0, 0, 0);

  while (currentHourStart < endDate) {
    const currentHourEnd = new Date(currentHourStart);
    currentHourEnd.setUTCHours(currentHourEnd.getUTCHours() + 1);

    // Ingest for all tenants in this hour (with concurrency limit)
    const concurrency = 5;
    for (let i = 0; i < workspaces.length; i += concurrency) {
      const batch = workspaces.slice(i, i + concurrency);

      const batchPromises = batch.map((workspace) =>
        ingestHourlyTelemetryForTenant(workspace.id, {
          start: currentHourStart,
          end: currentHourEnd,
        }).catch((err) => {
          console.error(
            `[Guardian X01] Failed to ingest telemetry for tenant ${workspace.id} at ${currentHourStart.toISOString()}:`,
            err
          );
          return null;
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter((r) => r !== null) as IngestionResult[]);
    }

    currentHourStart = currentHourEnd;
  }

  return results;
}
