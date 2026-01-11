import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { updateProgramKpi, deleteProgramKpi, type ProgramKpi } from '@/lib/guardian/meta/programGoalService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/guardian/meta/kpis/[id]
 * Update a KPI
 */
export const PATCH = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  const body = await req.json();

  const updates: Partial<ProgramKpi> = {};

  if (body.label) updates.label = body.label;
  if (body.description) updates.description = body.description;
  if (body.target_value !== undefined) updates.targetValue = parseFloat(body.target_value);
  if (body.target_direction) updates.targetDirection = body.target_direction;
  if (body.unit) updates.unit = body.unit;
  if (body.source_path) updates.sourcePath = body.source_path;
  if (body.metadata) updates.metadata = body.metadata;

  const updated = await updateProgramKpi(id, workspaceId, updates);

  return successResponse({
    kpi: updated,
    message: 'KPI updated successfully',
  });
});

/**
 * DELETE /api/guardian/meta/kpis/[id]
 * Delete a KPI
 */
export const DELETE = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  await deleteProgramKpi(id, workspaceId);

  return successResponse({
    message: 'KPI deleted successfully',
  });
});
