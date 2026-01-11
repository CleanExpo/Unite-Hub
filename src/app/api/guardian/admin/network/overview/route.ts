/**
 * GET /api/guardian/admin/network/overview
 *
 * Retrieve the unified Network Intelligence console overview for the current tenant.
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getNetworkOverviewForTenant } from '@/lib/guardian/network/networkOverviewService';

/**
 * GET: Retrieve Network Intelligence overview for current tenant
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const overview = await getNetworkOverviewForTenant(workspaceId);

    return successResponse({
      overview,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get network overview:', error);
    return errorResponse('Failed to get network overview', 500);
  }
});
