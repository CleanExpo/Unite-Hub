/**
 * GET /api/guardian/meta/restores/[id] - Get restore run status and preview (admin-only)
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getRestoreRun } from '@/lib/guardian/meta/metaRestoreService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const run = await getRestoreRun(workspaceId, id);
  if (!run) throw new Error('Restore run not found');

  return successResponse({
    restoreRun: run,
  });
});
