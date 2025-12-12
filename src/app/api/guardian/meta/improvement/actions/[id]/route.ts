import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { setActionStatus } from '@/lib/guardian/meta/improvementCycleService';

/**
 * PATCH /api/guardian/meta/improvement/actions/[id]
 * Update action status (admin-only)
 */
export const PATCH = withErrorBoundary(
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id: actionId } = await context.params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) return errorResponse('workspaceId required', 400);

    await validateUserAndWorkspace(req, workspaceId);

    const body = await req.json();

    if (!body.status) {
      return errorResponse('status required', 400);
    }

    try {
      const action = await setActionStatus(workspaceId, actionId, body.status, body.actor);

      return successResponse({ action });
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Failed to update action', 500);
    }
  }
);
