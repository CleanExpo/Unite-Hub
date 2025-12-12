import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * GET /api/guardian/ai/anomalies/events/[id]
 * Retrieve a specific anomaly event with full details
 */
export const GET = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const { id } = await context.params;

  // Get event with full details
  const { data, error } = await supabase
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
      details,
      created_at,
      acknowledged_at,
      acknowledged_by,
      resolved_at,
      resolved_by,
      related_suggestion_id,
      metadata
      `
    )
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .single();

  if (error || !data) {
    return errorResponse('Event not found', 404);
  }

  return successResponse(data);
});

/**
 * PATCH /api/guardian/ai/anomalies/events/[id]
 * Update event status (acknowledge/resolve, admin-only)
 */
export const PATCH = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const user = await validateUserAndWorkspace(req, workspaceId);
  if (!user.isAdmin) {
    return errorResponse('Admin access required', 403);
  }

  const supabase = getSupabaseServer();
  const { id } = await context.params;

  const body = await req.json();
  const { status } = body;

  const validStatuses = ['open', 'acknowledged', 'resolved'];
  if (!status || !validStatuses.includes(status)) {
    return errorResponse('Invalid status', 400);
  }

  const updateData: Record<string, unknown> = { status };
  const now = new Date().toISOString();

  if (status === 'acknowledged') {
    updateData.acknowledged_at = now;
    updateData.acknowledged_by = user.email || 'system';
  } else if (status === 'resolved') {
    updateData.resolved_at = now;
    updateData.resolved_by = user.email || 'system';
  }

  // Update event with tenant isolation
  const { data, error } = await supabase
    .from('guardian_anomaly_events')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .select()
    .single();

  if (error || !data) {
    return errorResponse('Failed to update event', 500);
  }

  return successResponse(data);
});
