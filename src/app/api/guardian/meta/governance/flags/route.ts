/**
 * Guardian Z10: Meta Governance Feature Flags API
 * GET: Load feature flags for tenant
 * PATCH: Update feature flags with audit logging
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  loadMetaFeatureFlagsForTenant,
  updateMetaFeatureFlags,
  type GuardianMetaFeatureFlagKey,
} from '@/lib/guardian/meta/metaGovernanceService';

/**
 * GET /api/guardian/meta/governance/flags?workspaceId=...
 * Load feature flags for tenant
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  const flags = await loadMetaFeatureFlagsForTenant(workspaceId);

  return successResponse({ flags });
});

interface UpdateFlagsRequestBody {
  updates: Partial<Record<GuardianMetaFeatureFlagKey, boolean>>;
  actor: string;
}

/**
 * PATCH /api/guardian/meta/governance/flags?workspaceId=...
 * Update feature flags with audit logging
 */
export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  const body = (await req.json()) as UpdateFlagsRequestBody;
  const { updates, actor } = body;

  if (!updates || !actor) {
    return errorResponse('Missing updates or actor', 400);
  }

  if (typeof actor !== 'string' || actor.trim().length === 0) {
    return errorResponse('actor must be non-empty string', 400);
  }

  const updatedFlags = await updateMetaFeatureFlags(workspaceId, actor, updates);

  return successResponse({
    flags: updatedFlags,
    message: 'Feature flags updated successfully',
  });
});
