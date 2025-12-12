/**
 * POST /api/guardian/meta/restores/[id]/apply - Apply restore (admin-only, requires confirmation)
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { applyRestoreRun } from '@/lib/guardian/meta/metaRestoreService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const body = await req.json();
  const { confirm } = body;

  // Require explicit confirmation
  if (confirm !== true) {
    throw new Error('Restore requires explicit confirmation (confirm: true)');
  }

  const result = await applyRestoreRun(workspaceId, id, 'admin');

  return successResponse({
    message: 'Restore applied',
    ...result,
  });
});
