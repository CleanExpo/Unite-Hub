import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  cleanupForTenant,
  runFullNetworkCleanup,
} from '@/lib/guardian/network/lifecycleCleanupService';

/**
 * POST: Execute cleanup for a specific tenant or all tenants
 * Admin-only endpoint
 * Supports dry-run mode
 */

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { mode = 'all', dryRun = true, limitPerTable = 1000 } = body;

  if (mode === 'tenant') {
    // Cleanup for specific tenant
    const results = await cleanupForTenant(workspaceId, {
      dryRun,
      limitPerTable,
      now: new Date(),
    });

    return successResponse({
      mode: 'tenant',
      tenantId: workspaceId,
      dryRun,
      results,
      totalAffected: results.reduce((sum, r) => sum + r.deleted, 0),
    });
  } else if (mode === 'all') {
    // Full network cleanup (global patterns + all patterns)
    const results = await runFullNetworkCleanup({
      dryRun,
      limitPerTable,
      now: new Date(),
    });

    return successResponse({
      mode: 'all',
      dryRun,
      results: Object.fromEntries(results),
    });
  } else {
    return errorResponse('Invalid mode: use "tenant" or "all"', 400);
  }
});
