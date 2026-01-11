import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { deleteClusterAnnotation } from '@/lib/guardian/ai/correlationRefinementOrchestrator';

/**
 * PATCH /api/guardian/correlation/annotations/[id]
 * Update annotation (admin-only)
 */
export const PATCH = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const user = await validateUserAndWorkspace(req, workspaceId);
  if (!user.isAdmin) {
    return errorResponse('Admin access required', 403);
  }

  const supabase = getSupabaseServer();
  const { id } = await context.params;

  const body = await req.json();
  const { label, category, notes, tags } = body;

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (label !== undefined) updateData.label = label;
  if (category !== undefined) updateData.category = category;
  if (notes !== undefined) updateData.notes = notes;
  if (tags !== undefined) updateData.tags = tags;

  const { data, error } = await supabase
    .from('guardian_correlation_cluster_annotations')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .select()
    .single();

  if (error || !data) {
    return errorResponse('Failed to update annotation', 500);
  }

  return successResponse(data);
});

/**
 * DELETE /api/guardian/correlation/annotations/[id]
 * Delete annotation (admin-only)
 */
export const DELETE = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const user = await validateUserAndWorkspace(req, workspaceId);
  if (!user.isAdmin) {
    return errorResponse('Admin access required', 403);
  }

  const { id } = await context.params;

  try {
    await deleteClusterAnnotation(workspaceId, id);
    return successResponse({ id, status: 'deleted' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to delete annotation: ${msg}`, 500);
  }
});
