/**
 * Guardian I04: Simulation Runs API
 * GET  /api/guardian/simulation/runs - List simulation runs
 * POST /api/guardian/simulation/runs - Start simulation run
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { runRemediationSimulation, listAllSimulationRuns } from '@/lib/guardian/simulation/remediationOrchestrator';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const limitParam = req.nextUrl.searchParams.get('limit');
  const offsetParam = req.nextUrl.searchParams.get('offset');

  const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 20;
  const offset = offsetParam ? parseInt(offsetParam) : 0;

  const { runs, total } = await listAllSimulationRuns(workspaceId, limit, offset);

  return successResponse({
    runs,
    total,
    limit,
    offset,
  });
});

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { playbookId, windowDays, actor } = body;

  if (!playbookId) {
    throw new Error('playbookId required');
  }

  const result = await runRemediationSimulation({
    tenantId: workspaceId,
    playbookId,
    windowDays: windowDays || 30,
    actor: actor || 'api',
  });

  const statusCode = result.status === 'completed' ? 200 : 400;

  return successResponse(result, { status: statusCode });
});
