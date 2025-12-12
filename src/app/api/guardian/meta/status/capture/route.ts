/**
 * POST /api/guardian/meta/status/capture - Capture status snapshot now (admin-only)
 * Body: { viewType, periodLabel }
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { captureStatusSnapshot } from '@/lib/guardian/meta/statusPageService';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const body = await req.json();
  const { viewType, periodLabel } = body;

  if (!viewType || !periodLabel) {
    throw new Error('viewType and periodLabel required');
  }

  const result = await captureStatusSnapshot(workspaceId, viewType, periodLabel, 'admin');

  return successResponse({
    message: 'Status snapshot captured',
    ...result,
  });
});
