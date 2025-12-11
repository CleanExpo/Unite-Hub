/**
 * GET /api/guardian/network/benchmarks/tenant
 *
 * Tenant-scoped benchmark API. Returns this tenant's metrics alongside
 * anonymized cohort statistics for network comparison.
 *
 * Query Parameters:
 * - bucket_date: ISO date (YYYY-MM-DD), defaults to most recent available
 * - metric_family: Optional filter (alerts, incidents, risk, qa, performance)
 * - metric_key: Optional filter (e.g., alerts.total)
 *
 * Returns: Aggregated, privacy-preserving benchmark data (no other tenant info).
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

interface BenchmarkRow {
  bucket_date: string;
  metric_family: string;
  metric_key: string;
  tenant_value: number;
  cohort_key: string;
  cohort_p50: number | null;
  cohort_p75: number | null;
  cohort_p90: number | null;
  cohort_p95: number | null;
  cohort_p99: number | null;
  mean: number | null;
  stddev: number | null;
  sample_size: number;
}

interface BenchmarkResult {
  metric_family: string;
  metric_key: string;
  tenant_value: number;
  cohort_key: string;
  cohort_p50?: number;
  cohort_p75?: number;
  cohort_p90?: number;
  cohort_p95?: number;
  cohort_p99?: number;
  mean?: number;
  stddev?: number;
  sample_size: number;
  percentile_rank?: string; // e.g., 'top 10%', 'median'
}

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  // Parse query parameters
  const bucketDateStr = req.nextUrl.searchParams.get('bucket_date');
  const metricFamily = req.nextUrl.searchParams.get('metric_family');
  const metricKey = req.nextUrl.searchParams.get('metric_key');

  // If no date specified, find the most recent date with data for this tenant
  let bucketDate: string;

  if (bucketDateStr) {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bucketDateStr)) {
      return errorResponse('Invalid bucket_date format (use YYYY-MM-DD)', 400);
    }
    bucketDate = bucketDateStr;
  } else {
    // Find most recent date
    const { data: maxDateData, error: maxDateError } = await supabase
      .from('guardian_network_benchmark_snapshots')
      .select('bucket_date')
      .eq('tenant_id', workspaceId)
      .order('bucket_date', { ascending: false })
      .limit(1);

    if (maxDateError) {
      return errorResponse('Failed to fetch benchmarks', 500);
    }

    if (!maxDateData || maxDateData.length === 0) {
      return successResponse({
        bucket_date: null,
        benchmarks: [],
        message: 'No benchmark data available for this tenant yet',
      });
    }

    bucketDate = maxDateData[0].bucket_date;
  }

  // Build query
  let query = supabase
    .from('guardian_network_benchmark_snapshots')
    .select(
      `
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
    .eq('tenant_id', workspaceId)
    .eq('bucket_date', bucketDate);

  // Apply optional filters
  if (metricFamily) {
    query = query.eq('metric_family', metricFamily);
  }
  if (metricKey) {
    query = query.eq('metric_key', metricKey);
  }

  // Execute query
  const { data: rows, error } = (await query) as {
    data: BenchmarkRow[] | null;
    error: any;
  };

  if (error) {
    console.error('[Guardian X02 Benchmarks] Query error:', error);
    return errorResponse('Failed to fetch benchmarks', 500);
  }

  if (!rows || rows.length === 0) {
    return successResponse({
      bucket_date: bucketDate,
      benchmarks: [],
      message: 'No benchmarks available for this date',
    });
  }

  // Transform rows to response format, computing percentile rank
  const benchmarks: BenchmarkResult[] = rows.map((row) => {
    let percentile_rank: string | undefined;

    // Compute approximate percentile rank based on cohort p50, p75, p90, p95
    if (row.cohort_p95 && row.tenant_value > row.cohort_p95) {
      percentile_rank = 'top 5%';
    } else if (row.cohort_p90 && row.tenant_value > row.cohort_p90) {
      percentile_rank = 'top 10%';
    } else if (row.cohort_p75 && row.tenant_value > row.cohort_p75) {
      percentile_rank = 'top 25%';
    } else if (row.cohort_p50 && row.tenant_value > row.cohort_p50) {
      percentile_rank = 'above median';
    } else if (row.cohort_p50 && row.tenant_value === row.cohort_p50) {
      percentile_rank = 'at median';
    } else {
      percentile_rank = 'below median';
    }

    return {
      metric_family: row.metric_family,
      metric_key: row.metric_key,
      tenant_value: row.tenant_value,
      cohort_key: row.cohort_key,
      cohort_p50: row.cohort_p50 ?? undefined,
      cohort_p75: row.cohort_p75 ?? undefined,
      cohort_p90: row.cohort_p90 ?? undefined,
      cohort_p95: row.cohort_p95 ?? undefined,
      cohort_p99: row.cohort_p99 ?? undefined,
      mean: row.mean ?? undefined,
      stddev: row.stddev ?? undefined,
      sample_size: row.sample_size,
      percentile_rank,
    };
  });

  return successResponse({
    bucket_date: bucketDate,
    benchmarks,
    count: benchmarks.length,
    filters: {
      metricFamily: metricFamily || null,
      metricKey: metricKey || null,
    },
  });
});
