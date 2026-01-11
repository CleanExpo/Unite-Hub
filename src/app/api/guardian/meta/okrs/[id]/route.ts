import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { updateProgramOkr, deleteProgramOkr, type ProgramOkr } from '@/lib/guardian/meta/programGoalService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/guardian/meta/okrs/[id]
 * Update an OKR
 */
export const PATCH = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  const body = await req.json();

  const updates: Partial<ProgramOkr> = {};

  if (body.objective) updates.objective = body.objective;
  if (body.status) updates.status = body.status;
  if (body.weight !== undefined) updates.weight = body.weight;
  if (body.metadata) updates.metadata = body.metadata;

  const updated = await updateProgramOkr(id, workspaceId, updates);

  return successResponse({
    okr: updated,
    message: 'OKR updated successfully',
  });
});

/**
 * DELETE /api/guardian/meta/okrs/[id]
 * Delete an OKR (cascade deletes KPIs)
 */
export const DELETE = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  await deleteProgramOkr(id, workspaceId);

  return successResponse({
    message: 'OKR deleted successfully',
  });
});
