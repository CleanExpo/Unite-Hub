import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  getLifecycleAuditEvents,
} from '@/lib/guardian/network/lifecycleAuditLogger';

/**
 * GET: Retrieve lifecycle audit events for current tenant
 * Supports filtering by scope, action, date range, pagination
 */

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  // Parse query parameters
  const scope = req.nextUrl.searchParams.get('scope') as string | undefined;
  const action = req.nextUrl.searchParams.get('action') as string | undefined;
  const startDate = req.nextUrl.searchParams.get('startDate');
  const endDate = req.nextUrl.searchParams.get('endDate');
  const limit = req.nextUrl.searchParams.get('limit');
  const offset = req.nextUrl.searchParams.get('offset');

  const options: any = {};

  if (scope) {
options.scope = scope;
}
  if (action) {
options.action = action;
}
  if (startDate) {
options.startDate = new Date(startDate);
}
  if (endDate) {
options.endDate = new Date(endDate);
}
  if (limit) {
options.limit = parseInt(limit, 10);
}
  if (offset) {
options.offset = parseInt(offset, 10);
}

  const events = await getLifecycleAuditEvents(workspaceId, options);
  return successResponse(events);
});
