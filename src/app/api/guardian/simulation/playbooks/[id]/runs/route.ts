/**
 * Guardian I04: Playbook Simulation Runs List API
 * GET /api/guardian/simulation/playbooks/[id]/runs - List runs for specific playbook
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { listSimulationRuns } from '@/lib/guardian/simulation/remediationOrchestrator';

export const GET = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  const limitParam = req.nextUrl.searchParams.get('limit');
  const offsetParam = req.nextUrl.searchParams.get('offset');

  const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 10;
  const offset = offsetParam ? parseInt(offsetParam) : 0;

  const { runs, total } = await listSimulationRuns(workspaceId, id, limit, offset);

  return successResponse({
    playbookId: id,
    runs,
    total,
    limit,
    offset,
  });
});
