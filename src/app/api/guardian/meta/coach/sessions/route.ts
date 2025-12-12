/**
 * Guardian H05: Governance Coach Sessions API
 * GET: List coach sessions
 * POST: Create new coach session (admin-only)
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { createCoachSession } from '@/lib/guardian/meta/governanceCoachService';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

  const { data, count, error } = await supabase
    .from('guardian_governance_coach_sessions')
    .select('*', { count: 'exact' })
    .eq('tenant_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return successResponse({
    items: data,
    total: count,
    limit,
    offset,
  });
});

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const workspace = await validateUserAndWorkspace(req, workspaceId);

  // Admin-only check
  if (workspace.role !== 'owner' && workspace.role !== 'admin') {
    return errorResponse('Insufficient permissions (admin required)', 403);
  }

  const body = await req.json();
  const { coachMode = 'operator', targetFeatures } = body;

  // Validate input
  if (!['operator', 'leadership', 'cs_handoff'].includes(coachMode)) {
    return errorResponse('Invalid coachMode', 400);
  }

  // Create coach session
  const session = await createCoachSession({
    tenantId: workspaceId,
    coachMode,
    targetFeatures,
    actor: workspace.user_id,
  });

  return successResponse(session, 201);
});
