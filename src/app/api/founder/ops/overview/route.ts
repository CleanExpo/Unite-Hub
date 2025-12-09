/**
 * API Route: GET /api/founder/ops/overview
 *
 * Returns overview metrics for the Founder Ops Hub dashboard.
 * Includes total tasks, pending approvals, scheduled tasks, overdue tasks,
 * queue status, and distribution by brand and priority.
 *
 * @requires Founder role
 * @requires workspace_id query parameter
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/founder/ops/overview' });

export async function GET(req: NextRequest) {
  try {
    // Get workspace ID from query
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      );
    }

    // Authenticate and verify founder role
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify founder role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'founder') {
      return NextResponse.json({ error: 'Forbidden - Founder role required' }, { status: 403 });
    }

    if (profile.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Workspace mismatch' }, { status: 403 });
    }

    logger.info('Fetching overview metrics', { workspaceId, userId: user.id });

    // Get total tasks (excluding archived)
    const { count: totalTasks, error: totalError } = await supabase
      .from('founder_ops_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .not('status', 'eq', 'archived');

    if (totalError) {
throw totalError;
}

    // Get pending approvals
    const { count: pendingApprovals, error: approvalsError } = await supabase
      .from('founder_ops_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending_review');

    if (approvalsError) {
throw approvalsError;
}

    // Get scheduled today
    const today = new Date().toISOString().split('T')[0];
    const { data: todayQueue, error: queueError } = await supabase
      .from('founder_ops_queue')
      .select('id, status')
      .eq('workspace_id', workspaceId)
      .eq('queue_date', today);

    if (queueError) {
throw queueError;
}

    const scheduledToday = todayQueue?.length || 0;
    const completedToday = todayQueue?.filter((q: any) => q.status === 'completed').length || 0;

    // Get overdue tasks
    const now = new Date().toISOString();
    const { count: overdueTasks, error: overdueError } = await supabase
      .from('founder_ops_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .not('status', 'in', '(completed,archived)')
      .not('deadline', 'is', null)
      .lt('deadline', now);

    if (overdueError) {
throw overdueError;
}

    // Get queue status for today
    const { data: queueStatus, error: statusError } = await supabase.rpc('get_queue_status', {
      p_workspace_id: workspaceId,
      p_date: today,
    });

    if (statusError) {
throw statusError;
}

    // Get distribution by brand
    const { data: tasksByBrand, error: brandError } = await supabase
      .from('founder_ops_tasks')
      .select('brand_slug')
      .eq('workspace_id', workspaceId)
      .not('status', 'eq', 'archived');

    if (brandError) {
throw brandError;
}

    const byBrand: Record<string, number> = {};
    tasksByBrand?.forEach((task: any) => {
      byBrand[task.brand_slug] = (byBrand[task.brand_slug] || 0) + 1;
    });

    // Get distribution by priority
    const { data: tasksByPriority, error: priorityError } = await supabase
      .from('founder_ops_tasks')
      .select('priority')
      .eq('workspace_id', workspaceId)
      .not('status', 'eq', 'archived');

    if (priorityError) {
throw priorityError;
}

    const byPriority: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };
    tasksByPriority?.forEach((task: any) => {
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
    });

    // Get next deadline
    const { data: nextDeadlineTask, error: deadlineError } = await supabase
      .from('founder_ops_tasks')
      .select('id, title, deadline, brand_slug')
      .eq('workspace_id', workspaceId)
      .not('status', 'in', '(completed,archived)')
      .not('deadline', 'is', null)
      .gte('deadline', now)
      .order('deadline', { ascending: true })
      .limit(1)
      .single();

    // Ignore error if no deadline found
    const nextDeadline = nextDeadlineTask
      ? {
          task_id: nextDeadlineTask.id,
          title: nextDeadlineTask.title,
          deadline: nextDeadlineTask.deadline,
          brand: nextDeadlineTask.brand_slug,
        }
      : undefined;

    const metrics = {
      total_tasks: totalTasks || 0,
      pending_approvals: pendingApprovals || 0,
      scheduled_today: scheduledToday,
      completed_today: completedToday,
      overdue_tasks: overdueTasks || 0,
      queue_status: queueStatus?.status || 'empty',
      by_brand: byBrand,
      by_priority: byPriority,
      next_deadline: nextDeadline,
    };

    logger.info('Overview metrics fetched', { workspaceId, metrics });

    return NextResponse.json({ success: true, metrics });
  } catch (error) {
    logger.error('Failed to fetch overview metrics', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
