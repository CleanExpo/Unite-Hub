/**
 * Guardian I10: QA Overview API
 *
 * GET: Fetch unified QA overview KPIs and latest alerts
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getQaOverviewForTenant } from '@/lib/guardian/qa/qaOverviewService';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const overview = await getQaOverviewForTenant(workspaceId);

  return successResponse({
    overview,
  });
});
