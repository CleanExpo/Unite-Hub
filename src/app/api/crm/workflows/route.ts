import { withApiAuth } from '@/lib/supabase/apiAuth';
import { createApiClient } from '@/lib/supabase/api';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkPermission } from '@/lib/auth/permissions';

// Workflow template schema
const workflowTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  trigger_type: z.enum(['deal_stage_change', 'task_status_change', 'client_created', 'project_status_change']),
  is_active: z.boolean().default(true),
  triggers: z.array(z.object({
    trigger_type: z.string(),
    trigger_config: z.record(z.any())
  })),
  conditions: z.array(z.object({
    condition_type: z.string(),
    field_name: z.string(),
    operator: z.string(),
    value: z.any(),
    logical_operator: z.enum(['AND', 'OR']).optional(),
    order_index: z.number().optional()
  })).optional(),
  actions: z.array(z.object({
    action_type: z.string(),
    action_config: z.record(z.any()),
    order_index: z.number().optional(),
    delay_minutes: z.number().optional()
  }))
});

async function handleGET(req: NextRequest, userId: string) {
  try {
    const supabase = await createApiClient();
    
    // Check permission
    if (!await checkPermission(userId, 'crm.workflows.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get workflows with all related data
    const { data: workflows, error } = await supabase
      .from('workflow_templates')
      .select(`
        *,
        workflow_triggers (
          id,
          trigger_type,
          trigger_config
        ),
        workflow_conditions (
          id,
          condition_type,
          field_name,
          operator,
          value,
          logical_operator,
          order_index
        ),
        workflow_actions (
          id,
          action_type,
          action_config,
          order_index,
          delay_minutes
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json(workflows);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching workflows:', message);
    return NextResponse.json(
      { error: `Failed to fetch workflows: ${message}` },
      { status: 500 }
    );
  }
}

async function handlePOST(req: NextRequest, userId: string) {
  try {
    const supabase = await createApiClient();
    const body = await req.json();
    
    // Check permission
    if (!await checkPermission(userId, 'crm.workflows.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate request body
    const validation = workflowTemplateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const { triggers, conditions, actions, ...templateData } = validation.data;

    // Start a transaction
    // Create workflow template
    const { data: workflow, error: workflowError } = await supabase
      .from('workflow_templates')
      .insert({
        ...templateData,
        created_by: userId
      })
      .select()
      .single();

    if (workflowError) throw workflowError;

    // Create triggers
    if (triggers && triggers.length > 0) {
      const { error: triggerError } = await supabase
        .from('workflow_triggers')
        .insert(
          triggers.map(trigger => ({
            workflow_id: workflow.id,
            ...trigger
          }))
        );
      if (triggerError) throw triggerError;
    }

    // Create conditions
    if (conditions && conditions.length > 0) {
      const { error: conditionError } = await supabase
        .from('workflow_conditions')
        .insert(
          conditions.map((condition, index) => ({
            workflow_id: workflow.id,
            ...condition,
            order_index: condition.order_index ?? index
          }))
        );
      if (conditionError) throw conditionError;
    }

    // Create actions
    if (actions && actions.length > 0) {
      const { error: actionError } = await supabase
        .from('workflow_actions')
        .insert(
          actions.map((action, index) => ({
            workflow_id: workflow.id,
            ...action,
            order_index: action.order_index ?? index,
            delay_minutes: action.delay_minutes ?? 0
          }))
        );
      if (actionError) throw actionError;
    }

    // Fetch the complete workflow with all relations
    const { data: completeWorkflow, error: fetchError } = await supabase
      .from('workflow_templates')
      .select(`
        *,
        workflow_triggers (*),
        workflow_conditions (*),
        workflow_actions (*)
      `)
      .eq('id', workflow.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(completeWorkflow, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating workflow:', message);
    return NextResponse.json(
      { error: `Failed to create workflow: ${message}` },
      { status: 500 }
    );
  }
}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
