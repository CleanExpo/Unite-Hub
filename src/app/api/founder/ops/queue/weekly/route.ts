/**
 * API Route: GET /api/founder/ops/queue/weekly
 * Returns weekly execution queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/founder/ops/queue/weekly' });

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
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

    // Calculate week start (Monday) and end (Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];

    // Get weekly queue
    const { data: queueData, error: queueError } = await supabase.rpc(
      'get_founder_ops_weekly_queue',
      {
        p_workspace_id: workspaceId,
        p_start_date: startDate,
        p_end_date: endDate,
      }
    );

    if (queueError) {
throw queueError;
}

    const tasks = queueData || [];
    const dailyQueues: any[] = [];

    // Group by date
    const tasksByDate: Record<string, any[]> = {};
    tasks.forEach((task: any) => {
      const date = task.queue_date;
      if (!tasksByDate[date]) {
        tasksByDate[date] = [];
      }
      tasksByDate[date].push(task);
    });

    // Create daily queues
    for (const [date, dateTasks] of Object.entries(tasksByDate)) {
      const totalDuration = dateTasks.reduce((sum, t) => sum + t.estimated_duration_minutes, 0);
      const capacityUsed = (totalDuration / 480) * 100;

      dailyQueues.push({
        date,
        tasks: dateTasks,
        total_duration_minutes: totalDuration,
        capacity_used_percentage: Math.round(capacityUsed),
      });
    }

    const queue = {
      week_start: startDate,
      week_end: endDate,
      daily_queues: dailyQueues,
      total_tasks: tasks.length,
    };

    return NextResponse.json({ success: true, queue });
  } catch (error) {
    logger.error('Failed to fetch weekly queue', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
