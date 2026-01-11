import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { evaluateAllKpisForTenant, type GuardianKpiEvaluationContext } from '@/lib/guardian/meta/kpiEvaluationService';

/**
 * POST /api/guardian/meta/kpis/evaluate
 * Evaluate all KPIs for a tenant in a given period
 *
 * Resolves metrics from Z-series, computes status, and persists snapshots
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { periodStart, periodEnd } = body;

  if (!periodStart || !periodEnd) {
    return errorResponse('Missing required fields: periodStart, periodEnd', 400);
  }

  const ctx: GuardianKpiEvaluationContext = {
    tenantId: workspaceId,
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    now: new Date(),
  };

  const results = await evaluateAllKpisForTenant(ctx);

  return successResponse({
    message: `Evaluated ${results.length} KPIs`,
    evaluated: results.length,
    snapshots: results.map((r) => ({
      kpi_id: r.kpiId,
      current_value: r.result.currentValue,
      status: r.result.status,
      delta: r.result.delta,
    })),
  });
});
