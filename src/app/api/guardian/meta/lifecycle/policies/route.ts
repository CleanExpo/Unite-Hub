import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  loadLifecyclePoliciesForTenant,
  updateLifecyclePolicies,
} from '@/lib/guardian/meta/lifecyclePolicyService';

/**
 * GET /api/guardian/meta/lifecycle/policies
 * Load current lifecycle policies for tenant
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const policies = await loadLifecyclePoliciesForTenant(workspaceId);

  return successResponse({
    policies: policies.map((p) => ({
      policy_key: p.policyKey,
      label: p.label,
      description: p.description,
      retention_days: p.retentionDays,
      archive_enabled: p.archiveEnabled,
      delete_enabled: p.deleteEnabled,
      min_keep_rows: p.minKeepRows,
      compaction_strategy: p.compactionStrategy,
    })),
  });
});

/**
 * PATCH /api/guardian/meta/lifecycle/policies
 * Update one or more lifecycle policies
 */
export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { updates } = body;

  if (!Array.isArray(updates)) {
    throw new Error('updates must be an array');
  }

  // Validate update objects
  for (const update of updates) {
    if (!update.policy_key) {
      throw new Error('Each update must include policy_key');
    }

    // Safety check: prevent aggressive deletion without explicit confirmation
    if (
      update.delete_enabled &&
      (update.retention_days === undefined || update.retention_days < 90)
    ) {
      throw new Error(
        'Cannot enable deletion with retention < 90 days. Please increase retention first.'
      );
    }
  }

  // Convert snake_case to camelCase for service
  const camelCaseUpdates = updates.map((u: any) => ({
    policyKey: u.policy_key,
    retentionDays: u.retention_days,
    archiveEnabled: u.archive_enabled,
    deleteEnabled: u.delete_enabled,
    minKeepRows: u.min_keep_rows,
    compactionStrategy: u.compaction_strategy,
  }));

  const policies = await updateLifecyclePolicies(workspaceId, camelCaseUpdates);

  return successResponse({
    policies: policies.map((p) => ({
      policy_key: p.policyKey,
      label: p.label,
      description: p.description,
      retention_days: p.retentionDays,
      archive_enabled: p.archiveEnabled,
      delete_enabled: p.deleteEnabled,
      min_keep_rows: p.minKeepRows,
      compaction_strategy: p.compactionStrategy,
    })),
  });
});
