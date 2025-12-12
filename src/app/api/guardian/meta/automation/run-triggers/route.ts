/**
 * POST /api/guardian/meta/automation/run-triggers - Run triggers now (admin-only)
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { runTriggersForTenant } from '@/lib/guardian/meta/triggerEngine';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const result = await runTriggersForTenant(workspaceId, new Date());

  return successResponse({
    message: 'Triggers evaluated',
    ...result,
  });
});
