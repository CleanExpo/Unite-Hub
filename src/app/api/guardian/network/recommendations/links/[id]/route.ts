import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * GET: Retrieve origin details (links to source entities) for a recommendation
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

  // Get recommendation to verify it exists and belongs to workspace
  const { data: recommendation, error: recError } = await supabase
    .from('guardian_network_recommendations')
    .select('id')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (recError || !recommendation) {
    return errorResponse('Recommendation not found', 404);
  }

  // Get all links for this recommendation
  const { data: links, error: linksError } = await supabase
    .from('guardian_network_recommendation_links')
    .select('source_table, source_id, metadata')
    .eq('recommendation_id', id)
    .eq('workspace_id', workspaceId);

  if (linksError) {
    return errorResponse('Failed to retrieve links', 500);
  }

  return successResponse({
    links: (links || []).map((link) => ({
      sourceTable: link.source_table,
      sourceId: link.source_id,
      metadata: link.metadata,
    })),
  });
});
