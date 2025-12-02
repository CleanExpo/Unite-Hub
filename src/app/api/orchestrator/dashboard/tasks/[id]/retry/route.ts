/**
 * Orchestrator Dashboard - Task Retry API
 *
 * POST /api/orchestrator/dashboard/tasks/[id]/retry
 * Retries failed steps in a task
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiLogger } from '@/lib/logger';
import { OrchestratorEngine } from '@/lib/orchestrator/orchestratorEngine';

const logger = createApiLogger({ context: 'OrchestratorDashboard' });

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;
    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Fetch task
    const { data: task, error: taskError } = await supabase
      .from('orchestrator_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('workspace_id', workspaceId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only retry failed or halted tasks
    if (task.status !== 'failed' && task.status !== 'halted') {
      return NextResponse.json({
        error: 'Task is not in a failed state',
        status: task.status,
      }, { status: 400 });
    }

    const trace = task.trace as any;
    const steps = trace?.steps || [];

    // Find failed steps
    const failedSteps = steps
      .map((step: any, index: number) => ({ ...step, stepIndex: index }))
      .filter((step: any) => step.status === 'failed');

    if (failedSteps.length === 0) {
      return NextResponse.json({
        error: 'No failed steps to retry',
        status: task.status,
      }, { status: 400 });
    }

    logger.info('Retrying task', {
      taskId,
      failedStepCount: failedSteps.length,
    });

    // Create new task for retry (preserve original task as audit trail)
    const orchestrator = new OrchestratorEngine();

    // Build retry task with same objective but from failed step onward
    const retryTask = {
      workspaceId: task.workspace_id,
      objective: task.objective,
      description: `Retry of task ${taskId} from step ${failedSteps[0].stepIndex}`,
      initialContext: {
        ...task.initial_context,
        retryFromStep: failedSteps[0].stepIndex,
        originalTaskId: taskId,
        retryAttempt: (task.retry_count || 0) + 1,
      },
    };

    // Execute retry
    const result = await orchestrator.executeWorkflow(retryTask);

    // Update original task with retry reference
    await supabase
      .from('orchestrator_tasks')
      .update({
        retry_count: (task.retry_count || 0) + 1,
        retry_task_id: result.taskId,
      })
      .eq('id', taskId);

    logger.info('Task retry initiated', {
      originalTaskId: taskId,
      retryTaskId: result.taskId,
      retryAttempt: (task.retry_count || 0) + 1,
    });

    return NextResponse.json({
      message: 'Task retry initiated',
      originalTaskId: taskId,
      retryTaskId: result.taskId,
      retryAttempt: (task.retry_count || 0) + 1,
      failedStepsRetrying: failedSteps.length,
    });
  } catch (error) {
    logger.error('Task retry endpoint error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
