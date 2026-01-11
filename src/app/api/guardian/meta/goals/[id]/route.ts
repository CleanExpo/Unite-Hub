import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  loadGoalWithOkrsAndKpis,
  updateProgramGoal,
  deleteProgramGoal,
  type ProgramGoal,
} from '@/lib/guardian/meta/programGoalService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/guardian/meta/goals/[id]
 * Load a specific goal with all OKRs and KPIs
 */
export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  const goal = await loadGoalWithOkrsAndKpis(id, workspaceId);

  return successResponse({ goal });
});

/**
 * PATCH /api/guardian/meta/goals/[id]
 * Update a goal
 */
export const PATCH = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  const body = await req.json();

  const updates: Partial<ProgramGoal> = {};

  if (body.title) updates.title = body.title;
  if (body.description) updates.description = body.description;
  if (body.timeframe_start) updates.timeframeStart = new Date(body.timeframe_start);
  if (body.timeframe_end) updates.timeframeEnd = new Date(body.timeframe_end);
  if (body.owner !== undefined) updates.owner = body.owner;
  if (body.status) updates.status = body.status;
  if (body.category) updates.category = body.category;
  if (body.metadata) updates.metadata = body.metadata;

  const updated = await updateProgramGoal(id, workspaceId, updates);

  return successResponse({
    goal: updated,
    message: 'Goal updated successfully',
  });
});

/**
 * DELETE /api/guardian/meta/goals/[id]
 * Delete a goal (cascade deletes OKRs and KPIs)
 */
export const DELETE = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  await deleteProgramGoal(id, workspaceId);

  return successResponse({
    message: 'Goal deleted successfully',
  });
});
