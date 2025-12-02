/**
 * Orchestrator Dashboard - Task Detail API
 *
 * GET /api/orchestrator/dashboard/tasks/[id]
 * Returns complete execution trace with metadata, steps, verification status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'OrchestratorDashboard' });

export async function GET(
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

    // Fetch task with workspace verification
    const { data: task, error: taskError } = await supabase
      .from('orchestrator_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('workspace_id', workspaceId)
      .single();

    if (taskError || !task) {
      logger.warn('Task not found', { taskId, workspaceId });
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Fetch execution steps (from trace JSON)
    const trace = task.trace as any;
    const steps = trace?.steps || [];

    // Fetch verification results (from evidence storage)
    let verificationResults = [];
    try {
      // Check if evidence exists for this task
      const evidencePackage = task.evidence_package as any;
      if (evidencePackage) {
        verificationResults = evidencePackage.verification_evidence || [];
      }
    } catch (error) {
      logger.warn('Failed to fetch verification results', {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Compute execution timeline
    const timeline = steps.map((step: any, index: number) => ({
      stepIndex: index,
      assignedAgent: step.assignedAgent,
      status: step.status,
      verified: step.verified || false,
      verificationAttempts: step.verificationAttempts || 0,
      startTime: step.startTime,
      endTime: step.endTime,
      duration: step.endTime && step.startTime ? step.endTime - step.startTime : null,
    }));

    // Compute total duration
    const startTime = task.created_at ? new Date(task.created_at).getTime() : null;
    const endTime = task.completed_at ? new Date(task.completed_at).getTime() : null;
    const totalDuration = startTime && endTime ? endTime - startTime : task.total_time_ms || null;

    logger.info('Task detail fetched', {
      taskId,
      workspaceId,
      status: task.status,
      stepCount: steps.length,
    });

    return NextResponse.json({
      task: {
        id: task.id,
        objective: task.objective,
        description: task.description,
        status: task.status,
        agentChain: trace?.agentChain || [],
        riskScore: trace?.riskScore || 0,
        uncertaintyScore: trace?.uncertaintyScore || 0,
        confidenceScore: trace?.confidenceScore || 0,
        createdAt: task.created_at,
        completedAt: task.completed_at,
        totalDuration,
        finalOutput: trace?.finalOutput,
      },
      steps,
      timeline,
      verificationResults,
    });
  } catch (error) {
    logger.error('Task detail endpoint error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
