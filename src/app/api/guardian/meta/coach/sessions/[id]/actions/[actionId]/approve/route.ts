/**
 * Guardian H05: Governance Coach Action Approval API
 * POST: Approve specific action within a session (must be approved before apply)
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { approveCoachAction } from '@/lib/guardian/meta/governanceCoachService';

export const POST = withErrorBoundary(async (req: NextRequest, context: { params: Promise<{ id: string; actionId: string }> }) => {
  const { id: sessionId, actionId } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const workspace = await validateUserAndWorkspace(req, workspaceId);

  // Admin-only check
  if (workspace.role !== 'owner' && workspace.role !== 'admin') {
    return errorResponse('Insufficient permissions (admin required)', 403);
  }

  // Approve action
  await approveCoachAction({
    sessionId,
    actionId,
    tenantId: workspaceId,
    actor: workspace.user_id,
  });

  return successResponse({ approved: true });
});
