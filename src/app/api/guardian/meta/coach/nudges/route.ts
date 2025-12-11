import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  // Get query filters
  const category = req.nextUrl.searchParams.get('category');
  const status = req.nextUrl.searchParams.get('status');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);

  // Start base query
  let query = supabase
    .from('guardian_inapp_coach_nudges')
    .select('*')
    .eq('tenant_id', workspaceId);

  // Filter by status (default: pending or shown)
  if (status) {
    query = query.eq('status', status);
  } else {
    query = query.in('status', ['pending', 'shown']);
  }

  // Filter by category if provided
  if (category) {
    query = query.eq('category', category);
  }

  // Filter out expired nudges
  query = query.or(`expiry_at.is.null,expiry_at.gt.${new Date().toISOString()}`);

  // Sort by priority and creation date
  const { data: nudges, error } = await query
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return successResponse({
    nudges: nudges.map((n) => ({
      id: n.id,
      nudge_key: n.nudge_key,
      title: n.title,
      body: n.body,
      category: n.category,
      severity: n.severity,
      priority: n.priority,
      status: n.status,
      context: n.context || {},
      related_capability_key: n.related_capability_key,
      related_uplift_task_id: n.related_uplift_task_id,
      related_recommendation_id: n.related_recommendation_id,
      expiry_at: n.expiry_at,
      metadata: n.metadata || {},
      created_at: n.created_at,
    })),
  });
});

export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) throw new Error('id and status required');

  // Validate status value
  const validStatuses = ['pending', 'shown', 'dismissed', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  // Verify nudge belongs to tenant
  const { data: nudge, error: fetchError } = await supabase
    .from('guardian_inapp_coach_nudges')
    .select('tenant_id')
    .eq('id', id)
    .single();

  if (fetchError || !nudge) throw new Error('Nudge not found');
  if (nudge.tenant_id !== workspaceId) throw new Error('Unauthorized');

  // Update nudge status
  const { error: updateError } = await supabase
    .from('guardian_inapp_coach_nudges')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', workspaceId);

  if (updateError) throw updateError;

  return successResponse({ id, status });
});
