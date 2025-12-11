/**
 * Guardian I10: QA Settings API
 *
 * GET: Read QA feature flags for the current tenant
 * PATCH: Update QA feature flags (admin only)
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getQaFeatureFlagsForTenant, upsertQaFeatureFlags, GuardianQaFeatureFlags } from '@/lib/guardian/qa/qaFeatureFlagsService';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const flags = await getQaFeatureFlagsForTenant(workspaceId);

  return successResponse({
    flags,
  });
});

export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  // Verify admin access
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  let body: Partial<GuardianQaFeatureFlags>;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON in request body', 400);
  }

  // Validate only allowed fields
  const allowedKeys = [
    'enableSimulation',
    'enableRegression',
    'enableChaos',
    'enableGatekeeper',
    'enableTraining',
    'enablePerformance',
    'enableCoverage',
    'enableDriftMonitor',
    'enableAiScoring',
  ];

  const patch: Partial<GuardianQaFeatureFlags> = {};
  for (const key of allowedKeys) {
    if (key in body) {
      const value = body[key as keyof GuardianQaFeatureFlags];
      if (typeof value === 'boolean') {
        patch[key as keyof GuardianQaFeatureFlags] = value;
      }
    }
  }

  if (Object.keys(patch).length === 0) {
    return errorResponse('No valid flags to update', 400);
  }

  const updatedFlags = await upsertQaFeatureFlags(workspaceId, patch, user.id);

  return successResponse({
    flags: updatedFlags,
  });
});
