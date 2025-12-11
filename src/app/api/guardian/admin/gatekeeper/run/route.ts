/**
 * POST /api/guardian/admin/gatekeeper/run
 *
 * Trigger a new gatekeeper evaluation for a Guardian config change.
 * Intended for CI/CD integration and admin manual usage.
 *
 * Request body:
 * {
 *   source: 'ci' | 'manual' | 'api' | 'script',
 *   sourceRef?: 'commit-hash' or PR ID,
 *   changeType: 'rules' | 'playbooks' | 'thresholds' | 'mixed',
 *   diff: GuardianChangeDiff,
 * }
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { runGatekeeper } from '@/lib/guardian/simulation/gatekeeperOrchestrator';

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

  // Validate required fields
  const { source, changeType, diff } = body;
  if (!source || !changeType || !diff) {
    return errorResponse('source, changeType, diff required', 400);
  }

  // Validate source
  if (!['manual', 'ci', 'api', 'script'].includes(source)) {
    return errorResponse('source must be manual, ci, api, or script', 400);
  }

  // Validate changeType
  if (!['rules', 'playbooks', 'thresholds', 'mixed'].includes(changeType)) {
    return errorResponse(
      'changeType must be rules, playbooks, thresholds, or mixed',
      400
    );
  }

  try {
    const response = await runGatekeeper({
      tenantId: workspaceId,
      source,
      sourceRef: body.sourceRef,
      changeType,
      diff,
      actorId: body.actorId,
    });

    return successResponse(response, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to run gatekeeper';
    return errorResponse(message, 500);
  }
});
