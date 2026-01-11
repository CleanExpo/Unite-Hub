/**
 * POST /api/guardian/meta/restores/preview - Build restore preview (admin-only)
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { buildRestorePreview } from '@/lib/guardian/meta/metaRestoreService';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const body = await req.json();
  const { backupId, targetMode } = body;

  if (!backupId || !targetMode) {
    throw new Error('backupId and targetMode required');
  }

  const result = await buildRestorePreview({
    tenantId: workspaceId,
    backupId,
    targetMode,
    actor: 'admin',
  });

  return successResponse({
    message: 'Restore preview computed',
    ...result,
  });
});
