/**
 * GET /api/guardian/admin/qa/drift — List drift reports
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { listDriftReports } from '@/lib/guardian/simulation/qaDriftEngine';

/**
 * GET: List drift reports
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const severity = req.nextUrl.searchParams.get('severity');
  const scheduleId = req.nextUrl.searchParams.get('scheduleId');
  const limit = req.nextUrl.searchParams.get('limit');
  const offset = req.nextUrl.searchParams.get('offset');

  try {
    const reports = await listDriftReports(workspaceId, {
      severity: severity || undefined,
      scheduleId: scheduleId || undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return successResponse(reports);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list drift reports';
    return errorResponse(message, 500);
  }
});
