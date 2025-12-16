/**
 * Metrics Rollups API Endpoint
 * GET /api/circuits/metrics/rollups?workspaceId=<uuid>&abTestId=<string>&variantId=<string>
 *
 * Retrieve aggregated metrics for dashboard and CX09 consumption
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getRollups, getRollupSummary } from '@/lib/decision-circuits/metrics/metrics-rollup';

/**
 * GET /api/circuits/metrics/rollups
 * Retrieve aggregated metrics rollups
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const abTestId = req.nextUrl.searchParams.get('abTestId');
  const variantId = req.nextUrl.searchParams.get('variantId');
  const circuitExecutionId = req.nextUrl.searchParams.get('circuitExecutionId');
  const channel = req.nextUrl.searchParams.get('channel') as 'email' | 'social' | null;
  const timeStart = req.nextUrl.searchParams.get('timeStart');
  const timeEnd = req.nextUrl.searchParams.get('timeEnd');
  const limitStr = req.nextUrl.searchParams.get('limit') || '100';

  // Validate workspace
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  // Validate limit
  let limit = 100;
  try {
    limit = Math.min(Math.max(parseInt(limitStr, 10), 1), 500);
  } catch {
    limit = 100;
  }

  // Get rollups
  const rollups = await getRollups({
    workspace_id: workspaceId,
    circuit_execution_id: circuitExecutionId || undefined,
    ab_test_id: abTestId || undefined,
    variant_id: variantId || undefined,
    channel: channel || undefined,
    time_start: timeStart || undefined,
    time_end: timeEnd || undefined,
    limit,
  });

  return successResponse(
    {
      workspace_id: workspaceId,
      ab_test_id: abTestId,
      variant_id: variantId,
      circuit_execution_id: circuitExecutionId,
      channel,
      rollups,
      count: rollups.length,
      timestamp: new Date().toISOString(),
    },
    200
  );
});

/**
 * GET /api/circuits/metrics/rollups/summary
 * Retrieve aggregated summary for test/variant
 */
export async function GET_SUMMARY(req: NextRequest) {
  return withErrorBoundary(async (req: NextRequest) => {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const abTestId = req.nextUrl.searchParams.get('abTestId');
    const variantId = req.nextUrl.searchParams.get('variantId');

    if (!workspaceId || !abTestId || !variantId) {
      return errorResponse('workspaceId, abTestId, and variantId required', 400);
    }

    await validateUserAndWorkspace(req, workspaceId);

    const summary = await getRollupSummary(workspaceId, abTestId, variantId);

    if (!summary) {
      return successResponse(
        {
          workspace_id: workspaceId,
          ab_test_id: abTestId,
          variant_id: variantId,
          message: 'No rollup data available for this variant',
          timestamp: new Date().toISOString(),
        },
        200
      );
    }

    return successResponse(
      {
        workspace_id: workspaceId,
        ab_test_id: abTestId,
        variant_id: variantId,
        ...summary,
        timestamp: new Date().toISOString(),
      },
      200
    );
  })(req);
}
