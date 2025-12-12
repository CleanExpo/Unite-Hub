/**
 * Guardian Z10: Meta Audit Log API
 * GET: List audit log entries with filtering by source, entity type, date range
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { listMetaAuditLog, type GuardianMetaAuditSource } from '@/lib/guardian/meta/metaAuditService';

/**
 * GET /api/guardian/meta/audit?workspaceId=...&source=...&entityType=...&limit=50
 * List audit log entries with optional filtering
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  // Parse query parameters
  const source = req.nextUrl.searchParams.get('source') || undefined;
  const entityType = req.nextUrl.searchParams.get('entityType') || undefined;
  const actor = req.nextUrl.searchParams.get('actor') || undefined;
  const startDateStr = req.nextUrl.searchParams.get('startDate');
  const endDateStr = req.nextUrl.searchParams.get('endDate');
  const limitStr = req.nextUrl.searchParams.get('limit') || '50';
  const offsetStr = req.nextUrl.searchParams.get('offset') || '0';

  // Parse limit/offset
  const limit = Math.min(Math.max(parseInt(limitStr, 10), 1), 500); // 1-500
  const offset = Math.max(parseInt(offsetStr, 10), 0);

  // Parse dates
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (startDateStr) {
    startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) {
      return errorResponse('Invalid startDate format (use ISO 8601)', 400);
    }
  }

  if (endDateStr) {
    endDate = new Date(endDateStr);
    if (isNaN(endDate.getTime())) {
      return errorResponse('Invalid endDate format (use ISO 8601)', 400);
    }
  }

  // Query audit log
  const events = await listMetaAuditLog(workspaceId, {
    source: source as GuardianMetaAuditSource | undefined,
    entityType,
    actor,
    startDate,
    endDate,
    limit,
    offset,
  });

  return successResponse({
    events,
    pagination: {
      limit,
      offset,
      count: events.length,
    },
  });
});
