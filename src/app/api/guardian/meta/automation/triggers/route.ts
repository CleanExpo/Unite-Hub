/**
 * GET /api/guardian/meta/automation/triggers - List triggers
 * POST /api/guardian/meta/automation/triggers - Create trigger (admin-only)
 */

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

  const { data, error } = await supabase
    .from('guardian_meta_automation_triggers')
    .select('*')
    .eq('tenant_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return successResponse({ triggers: data || [] });
});

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });
  const supabase = getSupabaseServer();
  const body = await req.json();

  const { data, error } = await supabase
    .from('guardian_meta_automation_triggers')
    .insert({
      tenant_id: workspaceId,
      trigger_key: body.triggerKey,
      title: body.title,
      description: body.description,
      is_active: body.isActive !== false,
      source_domain: body.sourceDomain,
      metric_key: body.metricKey,
      comparator: body.comparator,
      threshold: body.threshold,
      actions: body.actions || [],
      cooldown_hours: body.cooldownHours || 24,
    })
    .select('*')
    .single();

  if (error) throw error;

  return successResponse(data, 201);
});
