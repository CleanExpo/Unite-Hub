/**
 * GET  /api/guardian/admin/qa/baselines — List baselines
 * POST /api/guardian/admin/qa/baselines — Create baseline from run
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  listBaselines,
  createBaselineFromRegressionRun,
  createBaselineFromSimulationRun,
  createBaselineFromPlaybookSimulationRun,
  type GuardianQaBaseline,
} from '@/lib/guardian/simulation/qaBaselineManager';

/**
 * GET: List baselines
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const scope = req.nextUrl.searchParams.get('scope');
  const isReference = req.nextUrl.searchParams.get('isReference');
  const limit = req.nextUrl.searchParams.get('limit');

  try {
    const baselines = await listBaselines(workspaceId, {
      scope: scope || undefined,
      isReference: isReference === 'true' ? true : isReference === 'false' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
    });

    return successResponse(baselines);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list baselines';
    return errorResponse(message, 500);
  }
});

/**
 * POST: Create baseline from a regression/simulation/playbook run
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { name, description, source_type, source_id, isReference } = body;

  if (!name || !source_type || !source_id) {
    return errorResponse('name, source_type, source_id required', 400);
  }

  if (!['regression_run', 'simulation_run', 'playbook_simulation_run'].includes(source_type)) {
    return errorResponse(
      'source_type must be regression_run, simulation_run, or playbook_simulation_run',
      400
    );
  }

  try {
    let baseline: GuardianQaBaseline;

    if (source_type === 'regression_run') {
      baseline = await createBaselineFromRegressionRun(workspaceId, name, source_id, {
        description,
        isReference,
        createdBy: body.createdBy,
      });
    } else if (source_type === 'simulation_run') {
      baseline = await createBaselineFromSimulationRun(workspaceId, name, source_id, {
        description,
        isReference,
        createdBy: body.createdBy,
      });
    } else {
      // playbook_simulation_run
      baseline = await createBaselineFromPlaybookSimulationRun(workspaceId, name, source_id, {
        description,
        isReference,
        createdBy: body.createdBy,
      });
    }

    return successResponse(baseline, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create baseline';
    return errorResponse(message, 500);
  }
});
