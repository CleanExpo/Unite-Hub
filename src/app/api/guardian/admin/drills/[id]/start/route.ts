/**
 * POST /api/guardian/admin/drills/[id]/start — Start a drill run
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { startDrillRun } from '@/lib/guardian/simulation/drillRunEngine';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id: drillId } = await context.params;

  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { mode = 'guided', operatorId, teamName, maxDurationSeconds } = body;

  try {
    const runState = await startDrillRun({
      tenantId: workspaceId,
      drillId,
      mode: mode as 'guided' | 'freeform',
      operatorId,
      teamName,
      maxDurationSeconds,
      now: new Date(),
    });

    return successResponse({ run: runState }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start drill run';
    return errorResponse(message, 500);
  }
});
