/**
 * GET /api/guardian/admin/qa/performance/runs/[id] — Get performance run details
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSupabaseServer } from '@/lib/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  try {
    const supabase = getSupabaseServer();

    const { data: runData, error: runError } = await supabase
      .from('guardian_performance_runs')
      .select(
        `
        *,
        profile:guardian_performance_profiles(id, name, profile_type, target_entity_type)
        `
      )
      .eq('id', id)
      .eq('tenant_id', workspaceId)
      .single();

    if (runError || !runData) {
      return errorResponse('Run not found', 404);
    }

    return successResponse({ run: runData });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load run';
    return errorResponse(message, 500);
  }
});
