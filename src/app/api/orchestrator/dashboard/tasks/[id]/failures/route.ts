/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Orchestrator Dashboard - Failure Analysis API
 *
 * GET /api/orchestrator/dashboard/tasks/[id]/failures
 * Returns root cause analysis and recovery suggestions for failed tasks
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

    // Only return failure analysis if task failed
    if (task.status !== 'failed' && task.status !== 'halted') {
      return NextResponse.json({
        taskId,
        status: task.status,
        message: 'Task has not failed - no failure analysis available',
        analysis: null,
      });
    }

    const trace = task.trace as any;
    const steps = trace?.steps || [];

    // Find failed steps
    const failedSteps = steps
      .map((step: any, index: number) => ({ ...step, stepIndex: index }))
      .filter((step: any) => step.status === 'failed');

    // Analyze root cause
    let rootCause = 'Unknown failure';
    let failureType = 'unknown';
    let impactedSteps = [];

    if (failedSteps.length > 0) {
      const firstFailure = failedSteps[0];
      rootCause = firstFailure.error || 'Step failed without error message';

      // Determine failure type
      if (firstFailure.error?.includes('timeout')) {
        failureType = 'timeout';
      } else if (firstFailure.error?.includes('verification')) {
        failureType = 'verification_failure';
      } else if (firstFailure.error?.includes('unauthorized') || firstFailure.error?.includes('permission')) {
        failureType = 'authorization';
      } else if (firstFailure.error?.includes('not found')) {
        failureType = 'resource_not_found';
      } else if (firstFailure.error?.includes('network') || firstFailure.error?.includes('connection')) {
        failureType = 'network';
      } else {
        failureType = 'execution_error';
      }

      // Find impacted downstream steps (blocked by failure)
      impactedSteps = steps
        .slice(firstFailure.stepIndex + 1)
        .map((step: any, index: number) => ({
          stepIndex: firstFailure.stepIndex + 1 + index,
          assignedAgent: step.assignedAgent,
          status: step.status,
        }));
    }

    // Generate recovery suggestions
    const recoverySuggestions = generateRecoverySuggestions(failureType, failedSteps, trace);

    // Get evidence from failed step
    const evidencePackage = task.evidence_package as any;
    const failureEvidence = evidencePackage?.verification_evidence?.filter(
      (e: any) => failedSteps.some((fs: any) => fs.stepIndex === e.step_index)
    ) || [];

    logger.info('Failure analysis generated', {
      taskId,
      failureType,
      failedStepCount: failedSteps.length,
      impactedStepCount: impactedSteps.length,
    });

    return NextResponse.json({
      taskId,
      status: task.status,
      analysis: {
        rootCause,
        failureType,
        failedSteps: failedSteps.map((step: any) => ({
          stepIndex: step.stepIndex,
          assignedAgent: step.assignedAgent,
          error: step.error,
          verificationAttempts: step.verificationAttempts || 0,
          lastVerificationError: step.lastVerificationError,
        })),
        impactedSteps,
        failureEvidence,
        recoverySuggestions,
      },
      taskMetadata: {
        objective: task.objective,
        agentChain: trace?.agentChain || [],
        totalSteps: steps.length,
        completedSteps: steps.filter((s: any) => s.status === 'completed').length,
      },
    });
  } catch (error) {
    logger.error('Failure analysis endpoint error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generate recovery suggestions based on failure type
 */
function generateRecoverySuggestions(
  failureType: string,
  failedSteps: any[],
  trace: any
): Array<{ action: string; description: string; priority: 'high' | 'medium' | 'low' }> {
  const suggestions = [];

  switch (failureType) {
    case 'timeout':
      suggestions.push({
        action: 'Increase timeout threshold',
        description: 'The task may need more time to complete. Consider increasing timeout limits.',
        priority: 'high' as const,
      });
      suggestions.push({
        action: 'Break down task into smaller steps',
        description: 'Split large operations into smaller, independently verifiable steps.',
        priority: 'medium' as const,
      });
      break;

    case 'verification_failure':
      suggestions.push({
        action: 'Review verification criteria',
        description: 'Check if verification criteria are too strict or misconfigured.',
        priority: 'high' as const,
      });
      suggestions.push({
        action: 'Inspect evidence package',
        description: 'Review verification evidence to understand what failed and why.',
        priority: 'high' as const,
      });
      suggestions.push({
        action: 'Retry with manual verification',
        description: 'Manually verify the step output and override if correct.',
        priority: 'low' as const,
      });
      break;

    case 'authorization':
      suggestions.push({
        action: 'Verify credentials and permissions',
        description: 'Ensure the agent has necessary permissions for the operation.',
        priority: 'high' as const,
      });
      suggestions.push({
        action: 'Check workspace access',
        description: 'Verify the task is executing in the correct workspace context.',
        priority: 'medium' as const,
      });
      break;

    case 'resource_not_found':
      suggestions.push({
        action: 'Verify resource paths and identifiers',
        description: 'Check that all required resources exist before retrying.',
        priority: 'high' as const,
      });
      suggestions.push({
        action: 'Create missing dependencies',
        description: 'The task may depend on resources that need to be created first.',
        priority: 'medium' as const,
      });
      break;

    case 'network':
      suggestions.push({
        action: 'Retry the task',
        description: 'Network errors are often transient - a simple retry may succeed.',
        priority: 'high' as const,
      });
      suggestions.push({
        action: 'Check external service status',
        description: 'Verify that external APIs and services are operational.',
        priority: 'medium' as const,
      });
      break;

    default:
      suggestions.push({
        action: 'Review error logs',
        description: 'Examine detailed error messages and stack traces for insights.',
        priority: 'high' as const,
      });
      suggestions.push({
        action: 'Contact support',
        description: 'If the error persists, contact support with the task ID.',
        priority: 'low' as const,
      });
  }

  // Always suggest retry if attempts < 3
  if (failedSteps.some((step: any) => (step.verificationAttempts || 0) < 3)) {
    suggestions.unshift({
      action: 'Retry failed steps',
      description: `Retry the ${failedSteps.length} failed step(s) with automatic recovery.`,
      priority: 'high' as const,
    });
  }

  return suggestions;
}
