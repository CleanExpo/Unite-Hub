import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getCycle, updateCycle } from '@/lib/guardian/meta/improvementCycleService';

/**
 * GET /api/guardian/meta/improvement/cycles/[id]
 * Fetch cycle with actions and outcomes
 */
export const GET = withErrorBoundary(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: cycleId } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const result = await getCycle(workspaceId, cycleId);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Cycle not found', 404);
  }
});

/**
 * PATCH /api/guardian/meta/improvement/cycles/[id]
 * Update cycle (admin-only)
 */
export const PATCH = withErrorBoundary(
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id: cycleId } = await context.params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) return errorResponse('workspaceId required', 400);

    await validateUserAndWorkspace(req, workspaceId);

    const body = await req.json();

    try {
      const cycle = await updateCycle(
        workspaceId,
        cycleId,
        {
          title: body.title,
          description: body.description,
          status: body.status,
          owner: body.owner,
        },
        body.actor
      );

      return successResponse({ cycle });
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to update cycle', 500);
    }
  }
);
