/**
 * API Routes: Agent Escalations
 * Query, approve, and reject escalations
 *
 * Part of Project Vend Phase 2
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getEscalationManager } from '@/lib/agents/escalation/escalationManager';

/**
 * GET /api/agents/escalations
 * List escalations for a workspace
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const status = req.nextUrl.searchParams.get('status') || 'pending';
  const severity = req.nextUrl.searchParams.get('severity');
  const includeStats = req.nextUrl.searchParams.get('includeStats') === 'true';
  const manager = getEscalationManager();

  // Get escalations
  const escalations = await manager.getPendingEscalations(workspaceId, severity || undefined);

  // Optionally include stats
  let stats = null;
  if (includeStats) {
    stats = await manager.getEscalationStats(workspaceId, 24);
  }

  return successResponse({
    escalations,
    stats: includeStats ? stats : undefined,
    meta: {
      count: escalations.length,
      status,
      severity: severity || 'all'
    }
  });
});

/**
 * POST /api/agents/escalations/[escalationId]/approve
 * Approve an escalation
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const escalationId = req.nextUrl.searchParams.get('escalationId');
  const action = req.nextUrl.searchParams.get('action'); // approve | reject

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  if (!escalationId) {
    return errorResponse('escalationId required', 400);
  }

  if (!action || !['approve', 'reject'].includes(action)) {
    return errorResponse('action must be approve or reject', 400);
  }

  const user = await validateUserAndWorkspace(req, workspaceId);
  const body = await req.json();
  const { reason } = body;

  if (!reason) {
    return errorResponse('reason required', 400);
  }

  const manager = getEscalationManager();

  if (action === 'approve') {
    const result = await manager.approveEscalation(escalationId, user.id, reason);
    return successResponse(result);
  } else {
    const result = await manager.rejectEscalation(escalationId, user.id, reason);
    return successResponse(result);
  }
});
