/**
 * POST /api/guardian/admin/qa-coverage/snapshot — Create coverage snapshot
 * GET /api/guardian/admin/qa-coverage/snapshot — Get latest snapshot
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { createCoverageSnapshot, getLatestSnapshot } from '@/lib/guardian/qa/qaCoverageSnapshotService';

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const POST = withErrorBoundary(async (req: NextRequest, _context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const snapshot = await createCoverageSnapshot(workspaceId);

    return successResponse(
      {
        snapshot,
      },
      201
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create coverage snapshot';
    return errorResponse(message, 500);
  }
});

export const GET = withErrorBoundary(async (req: NextRequest, _context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const snapshot = await getLatestSnapshot(workspaceId);

    if (!snapshot) {
      return successResponse({
        snapshot: null,
        message: 'No coverage snapshot available. Run coverage snapshot creation first.',
      });
    }

    return successResponse({ snapshot });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load coverage snapshot';
    return errorResponse(message, 500);
  }
});
