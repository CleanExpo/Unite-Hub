/**
 * Orchestrator Dashboard - Task Steps API
 *
 * GET /api/orchestrator/dashboard/tasks/[id]/steps
 * Returns steps with verification status and retry history
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
      .select('trace, evidence_package')
      .eq('id', taskId)
      .eq('workspace_id', workspaceId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const trace = task.trace as any;
    const steps = trace?.steps || [];

    // Enhance steps with verification status
    const enhancedSteps = steps.map((step: any, index: number) => {
      // Extract verification evidence for this step
      const evidencePackage = task.evidence_package as any;
      const stepEvidence = evidencePackage?.verification_evidence?.filter(
        (e: any) => e.step_index === index
      ) || [];

      return {
        stepIndex: index,
        assignedAgent: step.assignedAgent,
        inputContext: step.inputContext,
        outputPayload: step.outputPayload,
        riskScore: step.riskScore,
        uncertaintyScore: step.uncertaintyScore,
        status: step.status,
        error: step.error,
        verified: step.verified || false,
        verificationAttempts: step.verificationAttempts || 0,
        lastVerificationError: step.lastVerificationError,
        verificationEvidence: step.verificationEvidence || [],
        retryHistory: step.retryHistory || [],
        evidence: stepEvidence,
      };
    });

    logger.info('Task steps fetched', {
      taskId,
      stepCount: enhancedSteps.length,
    });

    return NextResponse.json({
      taskId,
      steps: enhancedSteps,
      totalSteps: enhancedSteps.length,
      verifiedSteps: enhancedSteps.filter((s: any) => s.verified).length,
      failedSteps: enhancedSteps.filter((s: any) => s.status === 'failed').length,
    });
  } catch (error) {
    logger.error('Task steps endpoint error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
