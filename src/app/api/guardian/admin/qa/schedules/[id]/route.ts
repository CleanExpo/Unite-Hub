/**
 * GET    /api/guardian/admin/qa/schedules/[id] — Get schedule
 * PATCH  /api/guardian/admin/qa/schedules/[id] — Update schedule
 * DELETE /api/guardian/admin/qa/schedules/[id] — Delete schedule
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  getQaSchedule,
  updateQaSchedule,
  deleteQaSchedule,
} from '@/lib/guardian/simulation/qaScheduleExecutor';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET: Fetch single schedule
 */
export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  try {
    const schedule = await getQaSchedule(workspaceId, id);
    return successResponse(schedule);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch schedule';
    return errorResponse(message, 404);
  }
});

/**
 * PATCH: Update schedule
 */
export const PATCH = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
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
    return errorResponse('Invalid JSON body', 400);
  }

  try {
    const updated = await updateQaSchedule(workspaceId, id, {
      ...body,
      updatedBy: body.updatedBy,
    });
    return successResponse(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update schedule';
    return errorResponse(message, 500);
  }
});

/**
 * DELETE: Delete schedule
 */
export const DELETE = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  try {
    await deleteQaSchedule(workspaceId, id);
    return successResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete schedule';
    return errorResponse(message, 500);
  }
});
