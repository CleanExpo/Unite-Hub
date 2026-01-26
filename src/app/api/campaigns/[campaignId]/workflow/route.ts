/**
 * Campaign Workflow API
 *
 * Endpoints for workflow execution management
 *
 * POST /api/campaigns/[campaignId]/workflow - Start workflow for contact
 * GET /api/campaigns/[campaignId]/workflow - Get active workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/logger';
import { WorkflowEngine } from '@/lib/workflows';
import { StateManager } from '@/lib/workflows';
import { createClient } from '@/lib/supabase/server';

const logger = createApiLogger({ service: 'WorkflowAPI' });

/**
 * Start workflow for contact
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params;
    const body = await request.json();
    const { contact_id } = body;

    if (!contact_id) {
      return NextResponse.json(
        { error: 'contact_id is required' },
        { status: 400 }
      );
    }

    logger.info('Starting workflow', { campaignId, contactId: contact_id });

    const supabase = await createClient();

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('drip_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('campaign_enrollments')
      .insert({
        campaign_id: campaignId,
        contact_id: contact_id,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (enrollmentError) throw enrollmentError;

    // Start workflow
    const engine = new WorkflowEngine();
    const workflowState = await engine.startWorkflow(
      campaign as any,
      enrollment.id,
      contact_id
    );

    logger.info('Workflow started', { workflowStateId: workflowState.id });

    return NextResponse.json({
      success: true,
      workflow_state: {
        id: workflowState.id,
        enrollment_id: workflowState.enrollment_id,
        status: workflowState.workflow_status,
        current_node_id: workflowState.current_node_id,
      },
    });
  } catch (error) {
    logger.error('Failed to start workflow', { error });

    return NextResponse.json(
      {
        error: 'Failed to start workflow',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Get active workflows for campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params;

    logger.info('Getting active workflows', { campaignId });

    const stateManager = new StateManager();
    const workflows = await stateManager.getActiveWorkflows(campaignId);

    return NextResponse.json({
      success: true,
      workflows: workflows.map((w) => ({
        id: w.id,
        enrollment_id: w.enrollment_id,
        contact_id: w.contact_id,
        status: w.workflow_status,
        current_node_id: w.current_node_id,
        execution_path: w.execution_path,
        wait_until: w.wait_until,
        wait_for_event: w.wait_for_event,
        assigned_variant: w.assigned_variant,
        started_at: w.started_at,
        last_executed_at: w.last_executed_at,
        next_execution_at: w.next_execution_at,
      })),
      count: workflows.length,
    });
  } catch (error) {
    logger.error('Failed to get active workflows', { error });

    return NextResponse.json(
      {
        error: 'Failed to get active workflows',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
