import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { runMetaLifecycleForTenant } from '@/lib/guardian/meta/lifecycleJobService';

/**
 * POST /api/guardian/meta/lifecycle/run
 * Trigger lifecycle run for a tenant
 * Optional: specify which policy keys to run
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { policy_keys } = body || {};

  // Validate policy_keys if provided
  if (policy_keys && !Array.isArray(policy_keys)) {
    throw new Error('policy_keys must be an array');
  }

  // Run lifecycle
  const results = await runMetaLifecycleForTenant(
    {
      tenantId: workspaceId,
      now: new Date(),
    },
    policy_keys
  );

  // Transform results to snake_case for API
  const transformedResults = results.map((r) => ({
    policy_key: r.policyKey,
    compacted_rows: r.compactedRows,
    deleted_rows: r.deletedRows,
    retained_rows: r.retainedRows,
    oldest_affected_date: r.oldestAffectedDate?.toISOString(),
    newest_affected_date: r.newestAffectedDate?.toISOString(),
    status: r.status,
    reason: r.reason,
  }));

  // Calculate totals
  const totals = {
    total_compacted: results.reduce((sum, r) => sum + r.compactedRows, 0),
    total_deleted: results.reduce((sum, r) => sum + r.deletedRows, 0),
    operations_successful: results.filter((r) => r.status === 'success').length,
    operations_skipped: results.filter((r) => r.status === 'skipped').length,
    operations_failed: results.filter((r) => r.status === 'error').length,
  };

  return successResponse({
    summary: {
      tenant_id: workspaceId,
      run_at: new Date().toISOString(),
      ...totals,
    },
    results: transformedResults,
  });
});
