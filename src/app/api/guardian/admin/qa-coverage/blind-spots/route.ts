/**
 * GET /api/guardian/admin/qa-coverage/blind-spots — Get blind spots with optional risk filter
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getBlindSpots } from '@/lib/guardian/qa/qaCoverageSnapshotService';

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorBoundary(async (req: NextRequest, _context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const riskLevel = req.nextUrl.searchParams.get('riskLevel') as
    | 'low'
    | 'medium'
    | 'high'
    | 'critical'
    | null;

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const blindSpots = await getBlindSpots(workspaceId, riskLevel || undefined);

    return successResponse({
      blindSpots,
      count: blindSpots.length,
      riskFilter: riskLevel || 'all',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load blind spots';
    return errorResponse(message, 500);
  }
});
