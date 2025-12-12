/**
 * Guardian Z10: Meta Governance Preferences API
 * GET: Load governance preferences for tenant
 * PATCH: Update governance preferences with validation and audit
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  loadMetaGovernancePrefsForTenant,
  updateMetaGovernancePrefs,
  type GuardianMetaGovernancePrefs,
} from '@/lib/guardian/meta/metaGovernanceService';

/**
 * GET /api/guardian/meta/governance/prefs?workspaceId=...
 * Load governance preferences for tenant
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  const prefs = await loadMetaGovernancePrefsForTenant(workspaceId);

  return successResponse({ prefs });
});

interface UpdatePrefsRequestBody {
  updates: Partial<GuardianMetaGovernancePrefs>;
  actor: string;
}

/**
 * PATCH /api/guardian/meta/governance/prefs?workspaceId=...
 * Update governance preferences with validation and audit
 */
export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  const body = (await req.json()) as UpdatePrefsRequestBody;
  const { updates, actor } = body;

  if (!updates || !actor) {
    return errorResponse('Missing updates or actor', 400);
  }

  if (typeof actor !== 'string' || actor.trim().length === 0) {
    return errorResponse('actor must be non-empty string', 400);
  }

  const updatedPrefs = await updateMetaGovernancePrefs(workspaceId, actor, updates);

  return successResponse({
    prefs: updatedPrefs,
    message: 'Governance preferences updated successfully',
  });
});
