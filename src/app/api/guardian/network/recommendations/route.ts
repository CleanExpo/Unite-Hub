import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * GET: List recommendations for current tenant with filters
 * PATCH: Update recommendation status
 */

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const status = req.nextUrl.searchParams.get('status');
  const recommendationType = req.nextUrl.searchParams.get('recommendationType');
  const severity = req.nextUrl.searchParams.get('severity');
  const since = req.nextUrl.searchParams.get('since');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);

  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_network_recommendations')
    .select(
      'id,created_at,updated_at,source,metric_family,metric_key,severity,status,recommendation_type,suggestion_theme,title,summary'
    )
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (recommendationType) {
    query = query.eq('recommendation_type', recommendationType);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  if (since) {
    query = query.gte('created_at', new Date(since).toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(`Failed to fetch recommendations: ${error.message}`, 500);
  }

  return successResponse({
    recommendations: data || [],
    count: data?.length || 0,
  });
});

export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { id, status, metadataPatch } = body;

  if (!id || typeof id !== 'string') {
    return errorResponse('id required', 400);
  }

  if (!status || !['open', 'in_progress', 'implemented', 'dismissed'].includes(status)) {
    return errorResponse('invalid status', 400);
  }

  const supabase = getSupabaseServer();

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('guardian_network_recommendations')
    .select('id, status')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (fetchError || !existing) {
    return errorResponse('Recommendation not found', 404);
  }

  // Validate status transition
  const allowedTransitions: Record<string, string[]> = {
    open: ['in_progress', 'dismissed'],
    in_progress: ['implemented', 'dismissed', 'open'],
    implemented: [],
    dismissed: ['open'],
  };

  if (!allowedTransitions[existing.status]?.includes(status)) {
    return errorResponse(
      `Cannot transition from ${existing.status} to ${status}`,
      400
    );
  }

  const updatePayload: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (metadataPatch) {
    // Get current metadata and merge
    const { data: rec } = await supabase
      .from('guardian_network_recommendations')
      .select('metadata')
      .eq('id', id)
      .single();

    updatePayload.metadata = {
      ...(rec?.metadata || {}),
      ...metadataPatch,
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from('guardian_network_recommendations')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return errorResponse(`Failed to update recommendation: ${updateError.message}`, 500);
  }

  return successResponse(updated);
});
