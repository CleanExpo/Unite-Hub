/**
 * POST /api/guardian/admin/drills/runs/[id]/complete — Complete drill and score
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { completeDrillRun } from '@/lib/guardian/simulation/drillRunEngine';
import { generateDrillScore, persistDrillScore } from '@/lib/guardian/ai/drillScoringEngine';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id: runId } = await context.params;

  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { enableScoring = true } = body;

  try {
    // Complete the drill run
    await completeDrillRun(workspaceId, runId);

    let score = null;

    // Generate AI score if enabled
    if (enableScoring) {
      try {
        score = await generateDrillScore(workspaceId, runId);
        await persistDrillScore(workspaceId, runId, score);
      } catch (scoreErr) {
        // Log but don't fail the request if scoring fails
        console.error('Failed to generate drill score:', scoreErr);
      }
    }

    return successResponse({
      success: true,
      score,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to complete drill run';
    return errorResponse(message, 500);
  }
});
