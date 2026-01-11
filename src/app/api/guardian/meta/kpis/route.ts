import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { persistProgramKpi, type ProgramKpi } from '@/lib/guardian/meta/programGoalService';

/**
 * POST /api/guardian/meta/kpis
 * Create a new KPI under an OKR
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const {
    okr_id,
    kpi_key,
    label,
    description,
    target_value,
    target_direction,
    unit,
    source_metric,
    source_path,
  } = body;

  if (
    !okr_id ||
    !kpi_key ||
    !label ||
    !description ||
    target_value === undefined ||
    !target_direction ||
    !unit ||
    !source_metric ||
    !source_path
  ) {
    return errorResponse(
      'Missing required fields: okr_id, kpi_key, label, description, target_value, target_direction, unit, source_metric, source_path',
      400
    );
  }

  const kpi: ProgramKpi = {
    tenantId: workspaceId,
    okrId: okr_id,
    kpiKey: kpi_key,
    label,
    description,
    targetValue: parseFloat(target_value),
    targetDirection,
    unit,
    sourceMetric: source_metric,
    sourcePath: source_path,
  };

  const persisted = await persistProgramKpi(kpi);

  return successResponse(
    {
      kpi: persisted,
      message: 'KPI created successfully',
    },
    { status: 201 }
  );
});
