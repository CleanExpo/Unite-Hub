/**
 * Guardian X03: Patterns API
 *
 * GET: List pattern signatures relevant to the current tenant's cohorts
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  // Parse query parameters
  const metricFamily = req.nextUrl.searchParams.get('metricFamily');
  const severity = req.nextUrl.searchParams.get('severity');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

  // Build query - fetch patterns from global table
  let query = supabase
    .from('guardian_network_pattern_signatures')
    .select(
      'id, pattern_key, metric_family, metric_keys, cohort_key, severity, description, created_at'
    )
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
    .offset(offset);

  if (metricFamily) {
    query = query.eq('metric_family', metricFamily);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(`Failed to fetch patterns: ${error.message}`, 500);
  }

  return successResponse({
    patterns: data || [],
    count: data?.length || 0,
    totalAvailable: count || 0,
  });
});
