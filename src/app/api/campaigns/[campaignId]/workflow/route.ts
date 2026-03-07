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
import { validateUserAuth } from '@/lib/workspace-validation';

const logger = createApiLogger({ service: 'WorkflowAPI' });

/**
 * Start workflow for contact
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    // Validate user authentication
    const user = await validateUserAuth(request);

    const { campaignId } = await params;
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

    // Get campaign — scoped to user's org via workspace_id
    const { data: campaign, error: campaignError } = await supabase
      .from('drip_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('workspace_id', user.orgId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Verify contact belongs to the same workspace
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contact_id)
      .eq('workspace_id', user.orgId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
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
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
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
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    // Validate user authentication
    const user = await validateUserAuth(request);

    const { campaignId } = await params;

    logger.info('Getting active workflows', { campaignId });

    const supabase = await createClient();

    // Verify campaign belongs to user's workspace before returning workflow state
    const { data: campaign, error: campaignError } = await supabase
      .from('drip_campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('workspace_id', user.orgId)
      .maybeSingle();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

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
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
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
