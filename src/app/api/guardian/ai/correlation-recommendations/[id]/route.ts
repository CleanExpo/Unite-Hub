import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { updateRecommendationStatus } from '@/lib/guardian/ai/correlationRefinementOrchestrator';

/**
 * GET /api/guardian/ai/correlation-recommendations/[id]
 * Get a specific recommendation detail
 */
export const GET = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const { id } = await context.params;

  const { data, error } = await supabase
    .from('guardian_correlation_recommendations')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .single();

  if (error || !data) {
    return errorResponse('Recommendation not found', 404);
  }

  return successResponse(data);
});

/**
 * PATCH /api/guardian/ai/correlation-recommendations/[id]
 * Update recommendation status (admin-only)
 */
export const PATCH = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const user = await validateUserAndWorkspace(req, workspaceId);
  if (!user.isAdmin) {
    return errorResponse('Admin access required', 403);
  }

  const { id } = await context.params;
  const body = await req.json();
  const { status } = body;

  // Validate status
  const validStatuses = ['new', 'reviewing', 'accepted', 'rejected', 'applied'];
  if (!status || !validStatuses.includes(status)) {
    return errorResponse('Invalid status', 400);
  }

  try {
    const updated = await updateRecommendationStatus(workspaceId, id, status, user.email);
    return successResponse(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to update recommendation: ${msg}`, 500);
  }
});
