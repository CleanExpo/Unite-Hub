/**
 * API Route: GET /api/founder/ops/queue/daily
 * Returns daily execution queue for a specific date
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/founder/ops/queue/daily' });

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get daily queue
    const { data: queueData, error: queueError } = await supabase.rpc(
      'get_founder_ops_daily_queue',
      {
        p_workspace_id: workspaceId,
        p_date: date,
      }
    );

    if (queueError) throw queueError;

    // Get queue status
    const { data: statusData, error: statusError } = await supabase.rpc('get_queue_status', {
      p_workspace_id: workspaceId,
      p_date: date,
    });

    if (statusError) throw statusError;

    const tasks = queueData || [];
    const totalDuration = tasks.reduce((sum: number, t: any) => sum + t.estimated_duration_minutes, 0);
    const capacityUsed = (totalDuration / 480) * 100; // 8 hours = 480 minutes

    const byBrand: Record<string, number> = {};
    const byPriority: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };

    tasks.forEach((task: any) => {
      byBrand[task.task_brand] = (byBrand[task.task_brand] || 0) + 1;
      byPriority[task.task_priority] = (byPriority[task.task_priority] || 0) + 1;
    });

    const queue = {
      date,
      tasks,
      total_duration_minutes: totalDuration,
      capacity_used_percentage: Math.round(capacityUsed),
      by_brand: byBrand,
      by_priority: byPriority,
    };

    const status = {
      status: statusData?.status || 'empty',
      is_paused: statusData?.is_paused || false,
      progress: {
        completed: statusData?.completed_tasks || 0,
        total: statusData?.total_tasks || 0,
        percentage: statusData?.total_tasks
          ? Math.round(((statusData?.completed_tasks || 0) / statusData?.total_tasks) * 100)
          : 0,
      },
    };

    return NextResponse.json({ success: true, queue, status });
  } catch (error) {
    logger.error('Failed to fetch daily queue', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
