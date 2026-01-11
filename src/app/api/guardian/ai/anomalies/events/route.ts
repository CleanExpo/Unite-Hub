import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * GET /api/guardian/ai/anomalies/events
 * List anomaly events with optional filters
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  // Parse filter parameters
  const status = req.nextUrl.searchParams.get('status'); // 'open' | 'acknowledged' | 'resolved'
  const severity = req.nextUrl.searchParams.get('severity'); // 'info' | 'warn' | 'high' | 'critical'
  const detectorId = req.nextUrl.searchParams.get('detectorId');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '100', 10), 1000);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);

  let query = supabase
    .from('guardian_anomaly_events')
    .select(
      `
      id,
      detector_id,
      observed_at,
      observed_value,
      expected_value,
      score,
      severity,
      status,
      summary,
      created_at,
      acknowledged_at,
      resolved_at
      `,
      { count: 'exact' }
    )
    .eq('tenant_id', workspaceId)
    .order('observed_at', { ascending: false });

  // Apply filters
  if (status) {
    const validStatuses = ['open', 'acknowledged', 'resolved'];
    if (validStatuses.includes(status)) {
      query = query.eq('status', status);
    }
  }

  if (severity) {
    const validSeverities = ['info', 'warn', 'high', 'critical'];
    if (validSeverities.includes(severity)) {
      query = query.eq('severity', severity);
    }
  }

  if (detectorId) {
    query = query.eq('detector_id', detectorId);
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return errorResponse('Failed to fetch events', 500);
  }

  return successResponse({
    events: data || [],
    total: count || 0,
    limit,
    offset,
  });
});
