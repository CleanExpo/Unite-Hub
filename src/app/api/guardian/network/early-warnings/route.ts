/**
 * Guardian X03: Early-Warnings API
 *
 * GET: List early warnings for the current tenant
 * PATCH: Update early warning status (acknowledge/dismiss)
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
  const status = req.nextUrl.searchParams.get('status');
  const severity = req.nextUrl.searchParams.get('severity');
  const since = req.nextUrl.searchParams.get('since');
  const metricFamily = req.nextUrl.searchParams.get('metricFamily');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

  // Build query
  let query = supabase
    .from('guardian_network_early_warnings')
    .select(
      `id, created_at, severity, match_score, bucket_date, status, suggestion_theme,
       evidence, pattern_id, guardian_network_pattern_signatures(id, pattern_key, metric_family, metric_keys, severity, cohort_key, description)`
    )
    .eq('tenant_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit)
    .offset(offset);

  if (status) {
    query = query.eq('status', status);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  if (since) {
    query = query.gte('created_at', since);
  }

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(`Failed to fetch early warnings: ${error.message}`, 500);
  }

  return successResponse({
    warnings: data || [],
    count: data?.length || 0,
    totalAvailable: count || 0,
  });
});

export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) {
    return errorResponse('id and status are required', 400);
  }

  if (!['open', 'acknowledged', 'dismissed'].includes(status)) {
    return errorResponse('Invalid status value', 400);
  }

  // Verify the warning belongs to this tenant
  const { data: warning, error: fetchError } = await supabase
    .from('guardian_network_early_warnings')
    .select('tenant_id')
    .eq('id', id)
    .single();

  if (fetchError || !warning || warning.tenant_id !== workspaceId) {
    return errorResponse('Warning not found or access denied', 404);
  }

  // Update status
  const { error: updateError } = await supabase
    .from('guardian_network_early_warnings')
    .update({ status })
    .eq('id', id);

  if (updateError) {
    return errorResponse(`Failed to update warning: ${updateError.message}`, 500);
  }

  return successResponse({ id, status });
});
