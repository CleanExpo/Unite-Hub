/**
 * GET /api/guardian/meta/automation/schedules - List schedules
 * POST /api/guardian/meta/automation/schedules - Create schedule (admin-only)
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_automation_schedules')
    .select('*')
    .eq('tenant_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return successResponse({ schedules: data || [] });
});

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });
  const supabase = getSupabaseServer();
  const body = await req.json();

  const { data, error } = await supabase
    .from('guardian_meta_automation_schedules')
    .insert({
      tenant_id: workspaceId,
      schedule_key: body.scheduleKey,
      title: body.title,
      description: body.description,
      is_active: body.isActive !== false,
      cadence: body.cadence,
      timezone: body.timezone || 'UTC',
      run_at_hour: body.runAtHour || 9,
      run_at_minute: body.runAtMinute || 0,
      day_of_week: body.dayOfWeek,
      day_of_month: body.dayOfMonth,
      task_types: body.taskTypes,
      config: body.config || {},
      next_run_at: body.nextRunAt,
    })
    .select('*')
    .single();

  if (error) throw error;

  return successResponse(data, 201);
});
