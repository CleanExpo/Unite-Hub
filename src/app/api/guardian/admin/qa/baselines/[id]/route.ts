/**
 * GET   /api/guardian/admin/qa/baselines/[id] — Get baseline
 * PATCH /api/guardian/admin/qa/baselines/[id] — Update baseline (mark as reference)
 * DELETE /api/guardian/admin/qa/baselines/[id] — Delete baseline
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getBaseline, markBaselineAsReference, deleteBaseline } from '@/lib/guardian/simulation/qaBaselineManager';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET: Fetch single baseline
 */
export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  try {
    const baseline = await getBaseline(workspaceId, id);
    return successResponse(baseline);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch baseline';
    return errorResponse(message, 404);
  }
});

/**
 * PATCH: Update baseline (e.g., mark as reference)
 */
export const PATCH = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { is_reference } = body;

  if (is_reference === undefined) {
    return errorResponse('is_reference field required', 400);
  }

  try {
    const updated = await markBaselineAsReference(workspaceId, id, is_reference);
    return successResponse(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update baseline';
    return errorResponse(message, 500);
  }
});

/**
 * DELETE: Delete baseline
 */
export const DELETE = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;

  try {
    await deleteBaseline(workspaceId, id);
    return successResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete baseline';
    return errorResponse(message, 500);
  }
});
