import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { captureOutcome } from '@/lib/guardian/meta/improvementCycleService';

/**
 * POST /api/guardian/meta/improvement/cycles/[id]/capture-outcome
 * Capture outcome snapshot for cycle (admin-only)
 */
export const POST = withErrorBoundary(
  async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id: cycleId } = await context.params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) return errorResponse('workspaceId required', 400);

    await validateUserAndWorkspace(req, workspaceId);

    const body = await req.json();

    if (!body.label) {
      return errorResponse('label required (e.g., baseline, mid_cycle, end_cycle)', 400);
    }

    try {
      const { outcomeId, outcome } = await captureOutcome(workspaceId, cycleId, body.label, body.actor);

      return successResponse({ outcomeId, outcome }, 201);
    } catch (error) {
      console.error('[Z12 Outcomes API] Failed to capture outcome:', error);
      return errorResponse(error instanceof Error ? error.message : 'Failed to capture outcome', 500);
    }
  }
);
