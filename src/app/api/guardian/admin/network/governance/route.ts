/**
 * GET /api/guardian/admin/network/governance
 *
 * Retrieve governance event audit trail for the current tenant.
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getNetworkGovernanceEventsForTenant } from '@/lib/guardian/network/networkGovernanceLogger';

/**
 * GET: Retrieve governance events for current tenant
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  try {
    // Parse query parameters
    const limitParam = req.nextUrl.searchParams.get('limit');
    const offsetParam = req.nextUrl.searchParams.get('offset');
    const eventType = req.nextUrl.searchParams.get('event_type');
    const context = req.nextUrl.searchParams.get('context');

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
      return errorResponse('Invalid limit or offset', 400);
    }

    // Retrieve events
    const events = await getNetworkGovernanceEventsForTenant(workspaceId, {
      limit,
      offset,
      eventType: eventType || undefined,
      context: context || undefined,
    });

    return successResponse({
      events,
      limit,
      offset,
      count: events.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get governance events:', error);
    return errorResponse('Failed to get governance events', 500);
  }
});
