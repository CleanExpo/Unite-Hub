/**
 * GET /api/guardian/network/anomalies
 *
 * Tenant-scoped anomaly signals API. Returns detected anomalies
 * for this tenant with context and explanation.
 *
 * Query Parameters:
 * - since: ISO timestamp or date (YYYY-MM-DD), defaults to 30 days ago
 * - metric_family: Optional filter
 * - severity: Optional filter (low, medium, high, critical)
 * - limit: Optional pagination (default 100, max 500)
 * - offset: Optional pagination (default 0)
 *
 * Returns: Tenant-scoped anomaly signals (no other tenant visibility).
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

interface AnomalyRow {
  id: string;
  detected_at: string;
  metric_family: string;
  metric_key: string;
  anomaly_type: string;
  severity: string;
  window_start: string;
  window_end: string;
  tenant_value: number;
  cohort_p50: number | null;
  cohort_p90: number | null;
  cohort_p95: number | null;
  z_score: number | null;
  delta_ratio: number | null;
  cohort_key: string;
  explanation: string | null;
  sample_size: number;
}

interface AnomalyResult {
  id: string;
  detected_at: string;
  metric_family: string;
  metric_key: string;
  anomaly_type: string;
  severity: string;
  window_start: string;
  window_end: string;
  tenant_value: number;
  cohort_p50?: number;
  cohort_p90?: number;
  cohort_p95?: number;
  z_score?: number;
  delta_ratio?: number;
  cohort_key: string;
  explanation?: string;
  sample_size: number;
}

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  // Parse query parameters
  const sinceStr = req.nextUrl.searchParams.get('since');
  const metricFamily = req.nextUrl.searchParams.get('metric_family');
  const severity = req.nextUrl.searchParams.get('severity');
  const limitStr = req.nextUrl.searchParams.get('limit') ?? '100';
  const offsetStr = req.nextUrl.searchParams.get('offset') ?? '0';

  // Compute "since" timestamp
  let sinceDate: Date;
  if (sinceStr) {
    sinceDate = new Date(sinceStr);
    if (isNaN(sinceDate.getTime())) {
      return errorResponse('Invalid since date format', 400);
    }
  } else {
    // Default: 30 days ago
    sinceDate = new Date();
    sinceDate.setUTCDate(sinceDate.getUTCDate() - 30);
  }

  // Parse pagination
  let limit: number;
  let offset: number;
  try {
    limit = Math.min(500, Math.max(1, parseInt(limitStr, 10)));
    offset = Math.max(0, parseInt(offsetStr, 10));
  } catch {
    return errorResponse('Invalid pagination parameters', 400);
  }

  // Validate severity filter
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  if (severity && !validSeverities.includes(severity)) {
    return errorResponse('Invalid severity value', 400);
  }

  // Build query
  let query = supabase
    .from('guardian_network_anomaly_signals')
    .select(
      `
      id,
      detected_at,
      metric_family,
      metric_key,
      anomaly_type,
      severity,
      window_start,
      window_end,
      tenant_value,
      cohort_p50,
      cohort_p90,
      cohort_p95,
      z_score,
      delta_ratio,
      cohort_key,
      explanation,
      sample_size
    `,
      { count: 'exact' }
    )
    .eq('tenant_id', workspaceId)
    .gte('detected_at', sinceDate.toISOString())
    .order('detected_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply optional filters
  if (metricFamily) {
    query = query.eq('metric_family', metricFamily);
  }
  if (severity) {
    query = query.eq('severity', severity);
  }

  // Execute query
  const { data: rows, error, count } = (await query) as {
    data: AnomalyRow[] | null;
    error: any;
    count: number | null;
  };

  if (error) {
    console.error('[Guardian X02 Anomalies] Query error:', error);
    return errorResponse('Failed to fetch anomalies', 500);
  }

  if (!rows) {
    return successResponse({
      anomalies: [],
      count: 0,
      total_available: 0,
      offset,
      limit,
    });
  }

  // Transform rows to response format
  const anomalies: AnomalyResult[] = rows.map((row) => ({
    id: row.id,
    detected_at: row.detected_at,
    metric_family: row.metric_family,
    metric_key: row.metric_key,
    anomaly_type: row.anomaly_type,
    severity: row.severity,
    window_start: row.window_start,
    window_end: row.window_end,
    tenant_value: row.tenant_value,
    cohort_p50: row.cohort_p50 ?? undefined,
    cohort_p90: row.cohort_p90 ?? undefined,
    cohort_p95: row.cohort_p95 ?? undefined,
    z_score: row.z_score ?? undefined,
    delta_ratio: row.delta_ratio ?? undefined,
    cohort_key: row.cohort_key,
    explanation: row.explanation ?? undefined,
    sample_size: row.sample_size,
  }));

  return successResponse({
    anomalies,
    count: anomalies.length,
    total_available: count ?? 0,
    offset,
    limit,
    filters: {
      sinceDate: sinceDate.toISOString().split('T')[0],
      metricFamily: metricFamily || null,
      severity: severity || null,
    },
  });
});
