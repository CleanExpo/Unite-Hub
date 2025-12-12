/**
 * GET /api/guardian/meta/restores - List restore runs (admin-only)
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { listRestoreRuns } from '@/lib/guardian/meta/metaRestoreService';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
  const status = req.nextUrl.searchParams.get('status') || undefined;

  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const { restores, total } = await listRestoreRuns(workspaceId, { limit, offset, status });

  return successResponse({
    restores: restores.map((r) => ({
      id: r.id,
      status: r.status,
      backupId: r.backup_id,
      targetMode: r.target_mode,
      createdAt: r.created_at,
      finishedAt: r.finished_at,
      actor: r.actor,
      errorMessage: r.error_message,
    })),
    total,
  });
});
