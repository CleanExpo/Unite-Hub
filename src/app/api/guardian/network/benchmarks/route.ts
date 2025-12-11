/**
 * GET /api/guardian/network/benchmarks
 *
 * Read-only, aggregated network benchmarks API.
 * Returns k-anonymity-enforced aggregates — safe for public consumption.
 * No tenant identifiers, raw metrics, or PII exposed.
 *
 * Query Parameters:
 * - cohortKey: string (optional, default 'global')
 *   Examples: 'global', 'region:apac', 'size:small', 'vertical:saas'
 * - metricFamily: string (optional, filter to specific metric family)
 *   Examples: 'alerts', 'incidents', 'risk', 'qa', 'performance'
 * - metricKey: string (optional, filter to specific metric key)
 *   Examples: 'alerts.total', 'risk.avg_score', 'perf.p95_ms'
 * - startDate: string (optional, ISO format, default: 30 days ago)
 * - endDate: string (optional, ISO format, default: today)
 * - minSampleSize: number (optional, default: 5, enforce k-anonymity)
 * - limit: number (optional, max 1000, default: 100)
 *
 * Returns:
 * {
 *   benchmarks: {
 *     date: string (ISO date),
 *     cohortKey: string,
 *     metricFamily: string,
 *     metricKey: string,
 *     percentiles: { p50, p75, p90, p95, p99, mean, stddev },
 *     sampleSize: number,
 *     redacted: boolean (true if sample_size < minSampleSize threshold)
 *   }[],
 *   count: number,
 *   hasMore: boolean
 * }
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

interface BenchmarkRow {
  bucket_date: string;
  cohort_key: string;
  metric_family: string;
  metric_key: string;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  mean: number;
  stddev: number;
  sample_size: number;
}

interface BenchmarkResult {
  date: string;
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
  redacted: boolean;
}

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const supabase = getSupabaseServer();

  // Parse query parameters
  const cohortKey = req.nextUrl.searchParams.get('cohortKey') ?? 'global';
  const metricFamily = req.nextUrl.searchParams.get('metricFamily');
  const metricKey = req.nextUrl.searchParams.get('metricKey');
  const startDateStr = req.nextUrl.searchParams.get('startDate');
  const endDateStr = req.nextUrl.searchParams.get('endDate');
  const minSampleSizeStr = req.nextUrl.searchParams.get('minSampleSize') ?? '5';
  const limitStr = req.nextUrl.searchParams.get('limit') ?? '100';

  // Parse dates
  let startDate: Date;
  let endDate: Date;

  try {
    endDate = endDateStr ? new Date(endDateStr) : new Date();
    startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  } catch {
    return errorResponse('Invalid date format. Use ISO format (YYYY-MM-DD).', 400);
  }

  // Validate and parse numeric parameters
  let minSampleSize: number;
  let limit: number;

  try {
    minSampleSize = Math.max(1, parseInt(minSampleSizeStr, 10));
    limit = Math.min(1000, Math.max(1, parseInt(limitStr, 10)));
  } catch {
    return errorResponse('Invalid numeric parameters.', 400);
  }

  // Validate cohort key format
  const validCohortPrefixes = ['global', 'region:', 'size:', 'vertical:'];
  const isValidCohort =
    cohortKey === 'global' ||
    validCohortPrefixes.some((prefix) => cohortKey.startsWith(prefix));

  if (!isValidCohort) {
    return errorResponse(
      'Invalid cohortKey. Expected: global, region:*, size:*, or vertical:*',
      400
    );
  }

  // Validate metric family
  const validMetricFamilies = ['alerts', 'incidents', 'risk', 'qa', 'performance'];
  if (metricFamily && !validMetricFamilies.includes(metricFamily)) {
    return errorResponse(
      `Invalid metricFamily. Expected one of: ${validMetricFamilies.join(', ')}`,
      400
    );
  }

  // Build query
  let query = supabase
    .from('guardian_network_aggregates_daily')
    .select(
      `
      bucket_date,
      cohort_key,
      metric_family,
      metric_key,
      p50,
      p75,
      p90,
      p95,
      p99,
      mean,
      stddev,
      sample_size
    `
    )
    .eq('cohort_key', cohortKey)
    .gte('bucket_date', startDate.toISOString().split('T')[0])
    .lte('bucket_date', endDate.toISOString().split('T')[0])
    .gte('sample_size', minSampleSize)
    .order('bucket_date', { ascending: false })
    .limit(limit + 1); // Fetch one extra to determine hasMore

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
    console.error('[Guardian X01 Benchmarks] Query error:', error);
    return errorResponse('Failed to fetch benchmarks.', 500);
  }

  if (!rows) {
    return successResponse({
      benchmarks: [],
      count: 0,
      hasMore: false,
      cohortKey,
      dateRange: { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] },
      filters: {
        metricFamily: metricFamily || null,
        metricKey: metricKey || null,
        minSampleSize,
      },
    });
  }

  // Determine hasMore
  const hasMore = rows.length > limit;
  const benchmarkRows = rows.slice(0, limit);

  // Transform rows to response format
  const benchmarks: BenchmarkResult[] = benchmarkRows.map((row) => ({
    date: row.bucket_date,
    cohortKey: row.cohort_key,
    metricFamily: row.metric_family,
    metricKey: row.metric_key,
    percentiles: {
      p50: row.p50,
      p75: row.p75,
      p90: row.p90,
      p95: row.p95,
      p99: row.p99,
      mean: row.mean,
      stddev: row.stddev,
    },
    sampleSize: row.sample_size,
    redacted: false, // All results here meet the minSampleSize threshold
  }));

  return successResponse({
    benchmarks,
    count: benchmarks.length,
    hasMore,
    cohortKey,
    dateRange: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    },
    filters: {
      metricFamily: metricFamily || null,
      metricKey: metricKey || null,
      minSampleSize,
    },
  });
});
