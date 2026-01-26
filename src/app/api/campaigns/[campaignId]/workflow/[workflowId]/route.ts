/**
 * Workflow State API
 *
 * Endpoints for individual workflow management
 *
 * GET /api/campaigns/[campaignId]/workflow/[workflowId] - Get workflow state
 * PATCH /api/campaigns/[campaignId]/workflow/[workflowId] - Update workflow (pause/resume)
 * POST /api/campaigns/[campaignId]/workflow/[workflowId]/resume - Resume workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/logger';
import { WorkflowEngine } from '@/lib/workflows';
import { StateManager } from '@/lib/workflows';

const logger = createApiLogger({ service: 'WorkflowStateAPI' });

/**
 * Get workflow state
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string; workflowId: string } }
) {
  try {
    const { workflowId } = params;

    logger.info('Getting workflow state', { workflowId });

    const stateManager = new StateManager();
    const workflow = await stateManager.getWorkflowState(workflowId);

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workflow: {
        id: workflow.id,
        enrollment_id: workflow.enrollment_id,
        campaign_id: workflow.campaign_id,
        contact_id: workflow.contact_id,
        current_node_id: workflow.current_node_id,
        current_step_id: workflow.current_step_id,
        status: workflow.workflow_status,
        execution_path: workflow.execution_path,
        variables: workflow.workflow_variables,
        wait_until: workflow.wait_until,
        wait_for_event: workflow.wait_for_event,
        retry_count: workflow.retry_count,
        max_retries: workflow.max_retries,
        assigned_variant: workflow.assigned_variant,
        variant_assigned_at: workflow.variant_assigned_at,
        started_at: workflow.started_at,
        last_executed_at: workflow.last_executed_at,
        next_execution_at: workflow.next_execution_at,
        completed_at: workflow.completed_at,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
      },
    });
  } catch (error) {
    logger.error('Failed to get workflow state', { error });

    return NextResponse.json(
      {
        error: 'Failed to get workflow state',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Update workflow state (pause/resume)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { campaignId: string; workflowId: string } }
) {
  try {
    const { workflowId } = params;
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'action is required (pause or resume)' },
        { status: 400 }
      );
    }

    logger.info('Updating workflow state', { workflowId, action });

    const stateManager = new StateManager();

    if (action === 'pause') {
      await stateManager.pauseWorkflow(workflowId);

      return NextResponse.json({
        success: true,
        message: 'Workflow paused',
      });
    } else if (action === 'resume') {
      await stateManager.resumePausedWorkflow(workflowId);

      return NextResponse.json({
        success: true,
        message: 'Workflow resumed',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "pause" or "resume"' },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Failed to update workflow state', { error });

    return NextResponse.json(
      {
        error: 'Failed to update workflow state',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
