/**
 * POST /api/guardian/meta/automation/run-scheduler - Run due schedules now (admin-only)
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { runDueSchedules } from '@/lib/guardian/meta/schedulerRunner';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  // Run scheduler for current tenant only
  const result = await runDueSchedules(new Date(), {
    maxSchedules: 10,
    tenantIdOverride: workspaceId,
  });

  return successResponse({
    message: 'Scheduler executed',
    ...result,
  });
});
