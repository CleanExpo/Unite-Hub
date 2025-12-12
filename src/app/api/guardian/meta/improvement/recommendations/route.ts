import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { deriveImprovementRecommendations } from '@/lib/guardian/meta/improvementPlannerService';

/**
 * GET /api/guardian/meta/improvement/recommendations
 * Get deterministic improvement recommendations from Z-series patterns
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const { patterns, recommendedActions } = await deriveImprovementRecommendations(workspaceId);

    return successResponse({
      patterns,
      recommendedActions,
      count: recommendedActions.length,
      isAdvisory: true,
    });
  } catch (error) {
    console.error('[Z12 Recommendations API] Failed to derive recommendations:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to derive recommendations', 500);
  }
});
