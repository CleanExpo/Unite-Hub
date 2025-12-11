/**
 * GET /api/guardian/admin/gatekeeper/decisions
 *
 * List all gate decisions for a workspace with optional filters.
 *
 * Query params:
 * - status: 'pending' | 'evaluated' | 'failed'
 * - decision: 'allow' | 'block' | 'warn'
 * - limit: number (default 50)
 * - offset: number (default 0)
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { listGateDecisions } from '@/lib/guardian/simulation/gatekeeperOrchestrator';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const status = req.nextUrl.searchParams.get('status') as
    | 'pending'
    | 'evaluated'
    | 'failed'
    | null;
  const decision = req.nextUrl.searchParams.get('decision') as
    | 'allow'
    | 'block'
    | 'warn'
    | null;
  const limit = req.nextUrl.searchParams.get('limit');
  const offset = req.nextUrl.searchParams.get('offset');

  try {
    const decisions = await listGateDecisions(workspaceId, {
      status: status || undefined,
      decision: decision || undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return successResponse({ data: decisions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list gate decisions';
    return errorResponse(message, 500);
  }
});
