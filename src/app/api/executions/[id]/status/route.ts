/**
 * GET /api/executions/[id]/status
 * Phase 4: Task 2 - Get Execution Status
 *
 * Retrieves current status and metrics of execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const executionId = params.id;

    // Get authorization
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Fetch execution
    const supabase = await getSupabaseServer();
    const { data: execution, error: execError } = await supabase
      .from('strategy_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (execError || !execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    // Verify access
    const { data: org, error: orgError } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', userId)
      .eq('org_id', execution.workspace_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('execution_id', executionId);

    if (tasksError) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Calculate metrics
    const completedTasks = (tasks || []).filter((t) => t.status === 'completed').length;
    const failedTasks = (tasks || []).filter((t) => t.status === 'failed').length;
    const totalTasks = tasks?.length || 0;

    // Calculate health score
    let healthScore = 100;
    if (totalTasks > 0) {
      const completionRate = completedTasks / totalTasks;
      const errorRate = failedTasks / totalTasks;

      if (completionRate < 0.8) {
        healthScore -= (0.8 - completionRate) * 50;
      }

      if (errorRate > 0.2) {
        healthScore -= (errorRate - 0.2) * 25;
      }
    }

    return NextResponse.json({
      execution: {
        id: execution.id,
        status: execution.status,
        strategyId: execution.strategy_id,
        startedAt: execution.started_at,
        completedAt: execution.completed_at,
        totalTasks: execution.total_tasks,
        completedTasks: execution.completed_tasks || completedTasks,
        failedTasks: execution.failed_tasks || failedTasks,
      },
      health: {
        score: Math.max(0, Math.min(100, healthScore)),
        completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
        errorRate: totalTasks > 0 ? failedTasks / totalTasks : 0,
        lastChecked: new Date(),
      },
      tasks: tasks || [],
      metrics: execution.metrics || {},
    });
  } catch (error) {
    console.error('Failed to get execution status:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
