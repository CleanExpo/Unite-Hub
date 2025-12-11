/**
 * GET /api/guardian/admin/drills/runs/[id]/responses — List responses
 * POST /api/guardian/admin/drills/runs/[id]/responses — Record response
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { recordDrillResponse, getDrillResponses } from '@/lib/guardian/simulation/drillRunEngine';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id: runId } = await context.params;

  try {
    const responses = await getDrillResponses(workspaceId, runId);
    return successResponse({ responses });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load responses';
    return errorResponse(message, 500);
  }
});

export const POST = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id: runId } = await context.params;

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON in request body', 400);
  }

  const { eventId, operatorId, responseText, responseType, respondedAt, metadata } = body;

  if (!eventId || !responseText || !responseType) {
    return errorResponse('eventId, responseText, and responseType required', 400);
  }

  try {
    await recordDrillResponse(workspaceId, runId, eventId, operatorId, {
      responseText,
      responseType,
      respondedAt: respondedAt ? new Date(respondedAt) : undefined,
      metadata,
    });

    return successResponse({ success: true }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record response';
    return errorResponse(message, 500);
  }
});
