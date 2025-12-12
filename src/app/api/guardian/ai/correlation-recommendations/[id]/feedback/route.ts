import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * POST /api/guardian/ai/correlation-recommendations/[id]/feedback
 * Record admin feedback on a recommendation (admin-only)
 */
export const POST = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const user = await validateUserAndWorkspace(req, workspaceId);
  if (!user.isAdmin) {
    return errorResponse('Admin access required', 403);
  }

  const supabase = getSupabaseServer();
  const { id } = await context.params;

  const body = await req.json();
  const { action, reason, notes } = body;

  // Validate action
  const validActions = ['viewed', 'thumbs_up', 'thumbs_down', 'accepted', 'rejected', 'applied'];
  if (!action || !validActions.includes(action)) {
    return errorResponse('Invalid action', 400);
  }

  // Verify recommendation exists
  const { data: rec } = await supabase
    .from('guardian_correlation_recommendations')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .single();

  if (!rec) {
    return errorResponse('Recommendation not found', 404);
  }

  // Insert feedback
  const { data, error } = await supabase
    .from('guardian_correlation_recommendation_feedback')
    .insert({
      tenant_id: workspaceId,
      recommendation_id: id,
      action,
      reason,
      notes,
      actor: user.email || 'system',
    })
    .select()
    .single();

  if (error) {
    return errorResponse('Failed to record feedback', 500);
  }

  return successResponse(data);
});
