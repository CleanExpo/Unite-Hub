import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  createExportBundle,
  listExportBundles,
  type GuardianExportBundleRequest,
  type GuardianExportScope,
} from '@/lib/guardian/meta/exportBundleService';

/**
 * GET /api/guardian/meta/exports
 * List export bundles for tenant
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);
  const status = req.nextUrl.searchParams.get('status') || undefined;

  const { bundles, total } = await listExportBundles(workspaceId, {
    limit,
    offset,
    status: status || undefined,
  });

  return successResponse({
    bundles,
    total,
    limit,
    offset,
  });
});

/**
 * POST /api/guardian/meta/exports
 * Create new export bundle
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();

  // Validate request
  if (!body.bundleKey || !body.label || !body.description || !body.scope || !Array.isArray(body.scope)) {
    return errorResponse('bundleKey, label, description, and scope[] required', 400);
  }

  if (body.scope.length === 0) {
    return errorResponse('scope must contain at least one domain', 400);
  }

  // Validate scope values
  const validScopes: GuardianExportScope[] = [
    'readiness',
    'uplift',
    'editions',
    'executive',
    'adoption',
    'lifecycle',
    'integrations',
    'goals_okrs',
    'playbooks',
    'governance',
  ];

  for (const scope of body.scope) {
    if (!validScopes.includes(scope)) {
      return errorResponse(`Invalid scope: ${scope}`, 400);
    }
  }

  const bundleRequest: GuardianExportBundleRequest = {
    tenantId: workspaceId,
    bundleKey: body.bundleKey,
    label: body.label,
    description: body.description,
    scope: body.scope,
    periodStart: body.periodStart || undefined,
    periodEnd: body.periodEnd || undefined,
    actor: body.actor || 'system',
  };

  try {
    const { bundleId } = await createExportBundle(bundleRequest);

    return successResponse(
      {
        bundleId,
        status: 'pending',
        message: 'Export bundle creation started',
      },
      201
    );
  } catch (error) {
    console.error('[Z11 Export API] Failed to create bundle:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to create bundle', 500);
  }
});
