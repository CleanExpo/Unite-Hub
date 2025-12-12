/**
 * Guardian Z10: Meta Stack Readiness API
 * GET: Compute and return Z01-Z09 component readiness status
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { computeMetaStackReadiness, getMetaStackReadinessPercentage } from '@/lib/guardian/meta/metaStackReadinessService';

/**
 * GET /api/guardian/meta/stack-readiness?workspaceId=...
 * Compute meta stack readiness for tenant
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  const readiness = await computeMetaStackReadiness(workspaceId);
  const readinessPercentage = await getMetaStackReadinessPercentage(workspaceId);

  return successResponse({
    readiness,
    readinessPercentage,
  });
});
