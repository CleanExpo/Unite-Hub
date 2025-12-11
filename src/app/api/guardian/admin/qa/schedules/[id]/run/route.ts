/**
 * POST /api/guardian/admin/qa/schedules/[id]/run — Manually trigger QA schedule
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { runQaSchedule, type GuardianQaScheduleExecutionContext } from '@/lib/guardian/simulation/qaScheduleExecutor';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST: Manually trigger QA schedule execution
 */
export const POST = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const executionContext: GuardianQaScheduleExecutionContext = {
    tenantId: workspaceId,
    scheduleId: id,
    now: new Date(),
    actorId: body.actorId,
  };

  try {
    const result = await runQaSchedule(executionContext);
    return successResponse(result, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to execute QA schedule';
    return errorResponse(message, 500);
  }
});
