/**
 * GET/PATCH /api/guardian/admin/network/settings
 *
 * Manage X-series Network Intelligence feature flags for the current tenant.
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  getNetworkFeatureFlagsForTenant,
  upsertNetworkFeatureFlags,
  GuardianNetworkFeatureFlags,
} from '@/lib/guardian/network/networkFeatureFlagsService';

/**
 * GET: Retrieve feature flags for current tenant
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const flags = await getNetworkFeatureFlagsForTenant(workspaceId);

    return successResponse({
      flags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get network feature flags:', error);
    return errorResponse('Failed to get network feature flags', 500);
  }
});

/**
 * PATCH: Update feature flags for current tenant
 */
export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  // TODO: Add role check for admin-level operations if needed
  // For now, workspace validation is sufficient

  try {
    const body = await req.json();

    // Validate payload shape
    const patch = validateFlagsPatch(body);

    // Get actor ID from auth (user_id)
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const actorId = user?.id || undefined;

    // Update flags
    const updated = await upsertNetworkFeatureFlags(workspaceId, patch, actorId);

    return successResponse({
      flags: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid flag')) {
      return errorResponse(error.message, 400);
    }
    console.error('Failed to update network feature flags:', error);
    return errorResponse('Failed to update network feature flags', 500);
  }
});

/**
 * Validate and extract flags from request body
 */
function validateFlagsPatch(body: unknown): Partial<GuardianNetworkFeatureFlags> {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Invalid flag payload');
  }

  const validKeys = [
    'enableNetworkTelemetry',
    'enableNetworkBenchmarks',
    'enableNetworkAnomalies',
    'enableNetworkEarlyWarnings',
    'enableAiHints',
    'enableCohortMetadataSharing',
  ];

  const patch: Partial<GuardianNetworkFeatureFlags> = {};
  const payload = body as Record<string, unknown>;

  for (const key of validKeys) {
    if (key in payload) {
      const value = payload[key];
      if (typeof value !== 'boolean') {
        throw new Error(`Invalid flag value for ${key}: must be boolean`);
      }
      patch[key as keyof GuardianNetworkFeatureFlags] = value;
    }
  }

  return patch;
}
