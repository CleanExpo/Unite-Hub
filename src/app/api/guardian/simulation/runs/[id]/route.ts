/**
 * Guardian I04: Simulation Run Detail API
 * GET /api/guardian/simulation/runs/[id] - Get simulation run details
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSimulationRun } from '@/lib/guardian/simulation/remediationOrchestrator';

export const GET = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  const run = await getSimulationRun(workspaceId, id);
  if (!run) {
throw new Error('Simulation run not found');
}

  return successResponse({ run });
});
