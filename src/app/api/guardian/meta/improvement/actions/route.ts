import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { createAction } from '@/lib/guardian/meta/improvementCycleService';

/**
 * POST /api/guardian/meta/improvement/actions
 * Create improvement action in cycle (admin-only)
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();

  if (!body.cycleId || !body.actionKey || !body.title || !body.description) {
    return errorResponse('cycleId, actionKey, title, description required', 400);
  }

  try {
    const { actionId } = await createAction(
      workspaceId,
      body.cycleId,
      {
        actionKey: body.actionKey,
        title: body.title,
        description: body.description,
        priority: body.priority || 'medium',
        dueDate: body.dueDate,
        relatedPlaybookKeys: body.relatedPlaybookKeys,
        relatedGoalKpiKeys: body.relatedGoalKpiKeys,
        expectedImpact: body.expectedImpact,
        notes: body.notes,
      },
      body.actor
    );

    return successResponse({ actionId, status: 'planned' }, 201);
  } catch (error) {
    console.error('[Z12 Actions API] Failed to create action:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to create action', 500);
  }
});
