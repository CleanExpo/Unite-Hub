/**
 * Guardian I10: QA Audit Events API
 *
 * GET: List QA audit events with filtering and pagination
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  // Parse filters
  const source = req.nextUrl.searchParams.get('source');
  const eventType = req.nextUrl.searchParams.get('eventType');
  const severity = req.nextUrl.searchParams.get('severity');
  const limitStr = req.nextUrl.searchParams.get('limit') || '50';
  const limit = Math.min(parseInt(limitStr, 10), 500);

  let query = supabase
    .from('guardian_qa_audit_events')
    .select('*')
    .eq('tenant_id', workspaceId)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (source) {
    query = query.eq('source', source);
  }

  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(`Failed to fetch audit events: ${error.message}`, 500);
  }

  return successResponse({
    events: data || [],
    count: data?.length || 0,
  });
});
