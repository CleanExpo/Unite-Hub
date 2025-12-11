/**
 * GET /api/guardian/admin/qa-coverage/trend — Get coverage trend over time
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getCoverageTrend } from '@/lib/guardian/qa/qaCoverageSnapshotService';

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorBoundary(async (req: NextRequest, _context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const lookbackParam = req.nextUrl.searchParams.get('lookbackDays');
  const lookbackDays = lookbackParam ? Math.max(1, Math.min(365, parseInt(lookbackParam, 10))) : 30;

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const trend = await getCoverageTrend(workspaceId, lookbackDays);

    return successResponse({
      trend,
      count: trend.length,
      lookbackDays,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load coverage trend';
    return errorResponse(message, 500);
  }
});
