/**
 * Guardian H05: Governance Coach Session Detail & Apply API
 * GET: Retrieve specific coach session (includes plan, actions, narrative)
 * POST: Apply coach session with confirm=true gating
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { applyCoachSession } from '@/lib/guardian/meta/governanceCoachService';

export const GET = withErrorBoundary(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: sessionId } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  // Get session
  const { data: session, error: sessionError } = await supabase
    .from('guardian_governance_coach_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('tenant_id', workspaceId)
    .single();

  if (sessionError || !session) {
    return errorResponse('Coach session not found', 404);
  }

  // Get actions for this session
  const { data: actions, error: actionsError } = await supabase
    .from('guardian_governance_coach_actions')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (actionsError) throw actionsError;

  return successResponse({
    session,
    actions,
  });
});

export const POST = withErrorBoundary(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id: sessionId } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const workspace = await validateUserAndWorkspace(req, workspaceId);

  // Admin-only check
  if (workspace.role !== 'owner' && workspace.role !== 'admin') {
    return errorResponse('Insufficient permissions (admin required)', 403);
  }

  const body = await req.json();
  const { confirm = false, action } = body;

  // Handle different actions
  if (action === 'apply') {
    // SECURITY: Require explicit confirm=true flag
    if (!confirm) {
      return errorResponse('Apply requires explicit confirm=true (safety gate)', 400);
    }

    // Apply session with all checks
    const result = await applyCoachSession({
      sessionId,
      tenantId: workspaceId,
      actor: workspace.user_id,
      confirm: true,
    });

    return successResponse(result);
  }

  return errorResponse('Unknown action', 400);
});
