/**
 * API Route: /api/founder/ops/tasks/[taskId]
 *
 * GET: Get single task
 * PATCH: Update task
 * DELETE: Delete task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/founder/ops/tasks/[taskId]' });

async function verifyFounderAccess(workspaceId: string) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, workspace_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'founder') {
    throw new Error('Forbidden');
  }

  if (profile.workspace_id !== workspaceId) {
    throw new Error('Workspace mismatch');
  }

  return { supabase, user, profile };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const { supabase } = await verifyFounderAccess(workspaceId);

    const { data: task, error } = await supabase
      .from('founder_ops_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, task });
  } catch (error: unknown) {
    logger.error('Failed to fetch task', { error });
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await req.json();
    const { workspaceId, ...updates } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const { supabase } = await verifyFounderAccess(workspaceId);

    const { data: task, error } = await supabase
      .from('founder_ops_tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Task updated', { taskId });

    return NextResponse.json({ success: true, task });
  } catch (error: unknown) {
    logger.error('Failed to update task', { error });
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const { supabase } = await verifyFounderAccess(workspaceId);

    const { error } = await supabase
      .from('founder_ops_tasks')
      .delete()
      .eq('id', taskId)
      .eq('workspace_id', workspaceId);

    if (error) throw error;

    logger.info('Task deleted', { taskId });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Failed to delete task', { error });
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
