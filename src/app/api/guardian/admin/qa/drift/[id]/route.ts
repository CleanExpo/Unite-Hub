/**
 * GET /api/guardian/admin/qa/drift/[id] — Get drift report
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getDriftReport } from '@/lib/guardian/simulation/qaDriftEngine';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET: Fetch single drift report
 */
export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  try {
    const report = await getDriftReport(workspaceId, id);
    return successResponse(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch drift report';
    return errorResponse(message, 404);
  }
});
