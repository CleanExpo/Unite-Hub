import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * GET: Retrieve detailed view of a single recommendation
 */

export const GET = withErrorBoundary(async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_network_recommendations')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    return errorResponse('Recommendation not found', 404);
  }

  return successResponse(data);
});
