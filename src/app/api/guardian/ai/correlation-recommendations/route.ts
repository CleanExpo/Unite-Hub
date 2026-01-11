import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  buildAndStoreCorrelationRecommendations,
  getRecommendationsForTenant,
} from '@/lib/guardian/ai/correlationRefinementOrchestrator';

/**
 * GET /api/guardian/ai/correlation-recommendations
 * List correlation refinement recommendations with optional filters
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  // Optional filters
  const status = req.nextUrl.searchParams.get('status');
  const source = req.nextUrl.searchParams.get('source'); // 'ai' or 'heuristic'
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 200);

  const recommendations = await getRecommendationsForTenant(workspaceId, {
    status: status || undefined,
    source: source || undefined,
    limit,
  });

  return successResponse({
    recommendations,
    count: recommendations.length,
  });
});

/**
 * POST /api/guardian/ai/correlation-recommendations
 * Trigger generation of correlation recommendations (admin-only)
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const user = await validateUserAndWorkspace(req, workspaceId);
  if (!user.isAdmin) {
    return errorResponse('Admin access required', 403);
  }

  const body = await req.json();
  const windowDays = body.windowDays || 7;
  const maxRecommendations = body.maxRecommendations || 10;

  // Validate input
  if (windowDays < 1 || windowDays > 180) {
    return errorResponse('windowDays must be between 1 and 180', 400);
  }

  if (maxRecommendations < 1 || maxRecommendations > 50) {
    return errorResponse('maxRecommendations must be between 1 and 50', 400);
  }

  try {
    const result = await buildAndStoreCorrelationRecommendations(workspaceId, {
      windowDays,
      maxRecommendations,
      actor: user.email || 'system',
    });

    return successResponse({
      created: result.created,
      aiUsed: result.aiUsed,
      warnings: result.warnings,
      message: `Created ${result.created} recommendations (AI: ${result.aiUsed})`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to generate recommendations: ${msg}`, 500);
  }
});
