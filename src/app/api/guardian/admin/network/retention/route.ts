import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  getRetentionPolicyForTenant,
  upsertRetentionPolicyForTenant,
} from '@/lib/guardian/network/retentionPolicyService';

/**
 * GET: Retrieve retention policy for current tenant
 * PATCH: Update retention policy for current tenant
 */

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const policy = await getRetentionPolicyForTenant(workspaceId);
  return successResponse(policy);
});

export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { patch, actorId } = body;

  if (!patch || typeof patch !== 'object') {
    return errorResponse('patch object required', 400);
  }

  const updatedPolicy = await upsertRetentionPolicyForTenant(
    workspaceId,
    patch,
    actorId
  );

  return successResponse(updatedPolicy);
});
