/**
 * GET /api/guardian/admin/drills/runs/[id]/timeline — Get drill timeline
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getDrillTimeline } from '@/lib/guardian/simulation/drillRunEngine';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id: runId } = await context.params;

  try {
    const timeline = await getDrillTimeline(workspaceId, runId);
    return successResponse({ timeline });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load drill timeline';
    return errorResponse(message, 500);
  }
});
