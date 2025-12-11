/**
 * GET /api/guardian/admin/gatekeeper/decisions/[id]
 *
 * Fetch a single gate decision with full details:
 * - change set diff
 * - evaluation results
 * - links to related regression runs, QA schedules, drift reports
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getGateDecision } from '@/lib/guardian/simulation/gatekeeperOrchestrator';

export const GET = withErrorBoundary(
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return errorResponse('workspaceId required', 400);
    }

    await validateUserAndWorkspace(req, workspaceId);

    try {
      const decision = await getGateDecision(workspaceId, id);

      return successResponse(decision);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get gate decision';
      return errorResponse(message, 500);
    }
  }
);
