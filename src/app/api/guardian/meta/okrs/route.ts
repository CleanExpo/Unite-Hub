import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { persistProgramOkr, type ProgramOkr } from '@/lib/guardian/meta/programGoalService';

/**
 * POST /api/guardian/meta/okrs
 * Create a new OKR under a goal
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { goal_id, objective, objective_key, status = 'active', weight = 1.0 } = body;

  if (!goal_id || !objective || !objective_key) {
    return errorResponse('Missing required fields: goal_id, objective, objective_key', 400);
  }

  const okr: ProgramOkr = {
    tenantId: workspaceId,
    goalId: goal_id,
    objective,
    objectiveKey: objective_key,
    status: status || 'active',
    weight: weight || 1.0,
  };

  const persisted = await persistProgramOkr(okr);

  return successResponse(
    {
      okr: persisted,
      message: 'OKR created successfully',
    },
    { status: 201 }
  );
});
