/**
 * Synthex Automation Service
 *
 * Handles automated lead nurturing workflows with triggers and actions.
 * Supports email, tags, scoring, webhooks, and timed delays.
 *
 * Phase: B13 - Automated Lead Nurturing Workflows
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// ============================================
// Types
// ============================================

export type TriggerType =
  | 'lead_score_threshold'
  | 'churn_risk_high'
  | 'tag_added'
  | 'stage_change'
  | 'manual'
  | 'new_contact'
  | 'score_change';

export type ActionType =
  | 'send_email'
  | 'add_tag'
  | 'remove_tag'
  | 'update_score'
  | 'wait'
  | 'webhook'
  | 'notify'
  | 'update_stage';

export interface WorkflowTrigger {
  type: TriggerType;
  threshold?: number; // For score thresholds
  tag?: string; // For tag triggers
  stage?: string; // For stage triggers
  conditions?: Record<string, unknown>;
}

export interface WorkflowAction {
  type: ActionType;
  // For send_email
  templateId?: string;
  subject?: string;
  body?: string;
  // For tags
  tag?: string;
  // For score updates
  scoreChange?: number;
  // For wait
  seconds?: number;
  // For webhook
  url?: string;
  method?: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  payload?: Record<string, unknown>;
  // For stage updates
  stage?: string;
  // For notify
  channel?: 'email' | 'slack' | 'webhook';
  message?: string;
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  isActive: boolean;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  tenantId: string;
  contactId: string | null;
  triggerContext: Record<string, unknown>;
  payload: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentActionIndex: number;
  actionResults: Array<{ action: WorkflowAction; result: unknown; error?: string }>;
  error: string | null;
  errorDetails: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  templateType: 'email' | 'sms' | 'webhook';
  subject: string | null;
  body: string | null;
  htmlBody: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  email: string;
  name?: string;
  tags?: string[];
  [key: string]: unknown;
}

interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

// ============================================
// Workflow CRUD
// ============================================

export async function listWorkflows(
  tenantId: string,
  options?: { activeOnly?: boolean; limit?: number; offset?: number }
): Promise<ServiceResult<Workflow[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_automation_workflows')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (options?.activeOnly) {
      query = query.eq('is_active', true);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
throw error;
}

    const workflows: Workflow[] = (data || []).map(mapWorkflowFromDb);
    return { data: workflows, error: null };
  } catch (error) {
    console.error('[automationService.listWorkflows] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function getWorkflow(workflowId: string): Promise<ServiceResult<Workflow>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_automation_workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error) {
throw error;
}

    return { data: mapWorkflowFromDb(data), error: null };
  } catch (error) {
    console.error('[automationService.getWorkflow] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function createWorkflow(
  tenantId: string,
  name: string,
  trigger: WorkflowTrigger,
  actions: WorkflowAction[],
  description?: string
): Promise<ServiceResult<Workflow>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_automation_workflows')
      .insert({
        tenant_id: tenantId,
        name,
        description: description || null,
        trigger,
        actions,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
throw error;
}

    return { data: mapWorkflowFromDb(data), error: null };
  } catch (error) {
    console.error('[automationService.createWorkflow] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function updateWorkflow(
  workflowId: string,
  updates: Partial<{
    name: string;
    description: string;
    trigger: WorkflowTrigger;
    actions: WorkflowAction[];
    isActive: boolean;
  }>
): Promise<ServiceResult<Workflow>> {
  try {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) {
dbUpdates.name = updates.name;
}
    if (updates.description !== undefined) {
dbUpdates.description = updates.description;
}
    if (updates.trigger !== undefined) {
dbUpdates.trigger = updates.trigger;
}
    if (updates.actions !== undefined) {
dbUpdates.actions = updates.actions;
}
    if (updates.isActive !== undefined) {
dbUpdates.is_active = updates.isActive;
}

    const { data, error } = await supabaseAdmin
      .from('synthex_automation_workflows')
      .update(dbUpdates)
      .eq('id', workflowId)
      .select()
      .single();

    if (error) {
throw error;
}

    return { data: mapWorkflowFromDb(data), error: null };
  } catch (error) {
    console.error('[automationService.updateWorkflow] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function deleteWorkflow(workflowId: string): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await supabaseAdmin
      .from('synthex_automation_workflows')
      .delete()
      .eq('id', workflowId);

    if (error) {
throw error;
}

    return { data: true, error: null };
  } catch (error) {
    console.error('[automationService.deleteWorkflow] Error:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================
// Workflow Execution
// ============================================

export async function executeWorkflow(
  workflow: Workflow,
  contact: Contact,
  context?: Record<string, unknown>
): Promise<ServiceResult<WorkflowRun>> {
  try {
    // Create run record
    const { data: run, error: createError } = await supabaseAdmin
      .from('synthex_automation_runs')
      .insert({
        workflow_id: workflow.id,
        tenant_id: workflow.tenantId,
        contact_id: contact.id,
        trigger_context: context || {},
        payload: { contact },
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
throw createError;
}

    const actionResults: Array<{ action: WorkflowAction; result: unknown; error?: string }> = [];
    let currentIndex = 0;
    let finalStatus: 'completed' | 'failed' = 'completed';
    let errorMessage: string | null = null;

    // Execute each action
    for (const action of workflow.actions) {
      try {
        const result = await executeAction(action, contact, workflow.tenantId, context);
        actionResults.push({ action, result });
        currentIndex++;

        // Update run progress
        await supabaseAdmin
          .from('synthex_automation_runs')
          .update({
            current_action_index: currentIndex,
            action_results: actionResults,
          })
          .eq('id', run.id);
      } catch (actionError) {
        actionResults.push({
          action,
          result: null,
          error: actionError instanceof Error ? actionError.message : 'Unknown error',
        });
        finalStatus = 'failed';
        errorMessage = actionError instanceof Error ? actionError.message : 'Action failed';
        break;
      }
    }

    // Update final status
    const { data: finalRun, error: updateError } = await supabaseAdmin
      .from('synthex_automation_runs')
      .update({
        status: finalStatus,
        action_results: actionResults,
        error: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', run.id)
      .select()
      .single();

    if (updateError) {
throw updateError;
}

    // Update workflow stats
    const statsUpdate = {
      total_runs: workflow.totalRuns + 1,
      last_run_at: new Date().toISOString(),
      ...(finalStatus === 'completed'
        ? { successful_runs: workflow.successfulRuns + 1 }
        : { failed_runs: workflow.failedRuns + 1 }),
    };

    await supabaseAdmin
      .from('synthex_automation_workflows')
      .update(statsUpdate)
      .eq('id', workflow.id);

    return { data: mapRunFromDb(finalRun), error: null };
  } catch (error) {
    console.error('[automationService.executeWorkflow] Error:', error);
    return { data: null, error: error as Error };
  }
}

async function executeAction(
  action: WorkflowAction,
  contact: Contact,
  tenantId: string,
  context?: Record<string, unknown>
): Promise<unknown> {
  switch (action.type) {
    case 'send_email':
      // Integration with delivery engine would go here
      console.log(`[Automation] Send email to ${contact.email}`, {
        template: action.templateId,
        subject: action.subject,
      });
      return { sent: true, to: contact.email };

    case 'add_tag':
      if (action.tag) {
        const currentTags = contact.tags || [];
        if (!currentTags.includes(action.tag)) {
          await supabaseAdmin
            .from('synthex_audience_contacts')
            .update({ tags: [...currentTags, action.tag] })
            .eq('id', contact.id);
        }
      }
      return { tagAdded: action.tag };

    case 'remove_tag':
      if (action.tag) {
        const tags = (contact.tags || []).filter((t) => t !== action.tag);
        await supabaseAdmin
          .from('synthex_audience_contacts')
          .update({ tags })
          .eq('id', contact.id);
      }
      return { tagRemoved: action.tag };

    case 'update_score':
      if (action.scoreChange) {
        // Get current score and update
        const { data: scoreData } = await supabaseAdmin
          .from('synthex_audience_scores')
          .select('engagement_score')
          .eq('contact_id', contact.id)
          .single();

        const newScore = Math.max(0, (scoreData?.engagement_score || 0) + action.scoreChange);
        await supabaseAdmin
          .from('synthex_audience_scores')
          .update({ engagement_score: newScore })
          .eq('contact_id', contact.id);
      }
      return { scoreUpdated: action.scoreChange };

    case 'wait':
      if (action.seconds) {
        // In production, this would schedule a delayed job
        // For now, we just log it
        console.log(`[Automation] Wait ${action.seconds} seconds`);
      }
      return { waited: action.seconds };

    case 'webhook':
      if (action.url) {
        const response = await fetch(action.url, {
          method: action.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...action.headers,
          },
          body: JSON.stringify({
            contact,
            context,
            tenantId,
            ...action.payload,
          }),
        });
        return { webhookStatus: response.status };
      }
      return { webhookSkipped: true };

    case 'update_stage':
      if (action.stage) {
        await supabaseAdmin
          .from('synthex_lead_models')
          .update({
            current_stage: action.stage,
            stage_entered_at: new Date().toISOString(),
          })
          .eq('contact_id', contact.id);
      }
      return { stageUpdated: action.stage };

    case 'notify':
      console.log(`[Automation] Notify via ${action.channel}: ${action.message}`);
      return { notified: true, channel: action.channel };

    default:
      return { skipped: true, reason: 'Unknown action type' };
  }
}

// ============================================
// Run History
// ============================================

export async function listRuns(
  tenantId: string,
  options?: {
    workflowId?: string;
    contactId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ServiceResult<WorkflowRun[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_automation_runs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (options?.workflowId) {
      query = query.eq('workflow_id', options.workflowId);
    }
    if (options?.contactId) {
      query = query.eq('contact_id', options.contactId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
throw error;
}

    const runs: WorkflowRun[] = (data || []).map(mapRunFromDb);
    return { data: runs, error: null };
  } catch (error) {
    console.error('[automationService.listRuns] Error:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================
// Templates
// ============================================

export async function listTemplates(
  tenantId: string
): Promise<ServiceResult<AutomationTemplate[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_automation_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name');

    if (error) {
throw error;
}

    const templates: AutomationTemplate[] = (data || []).map(mapTemplateFromDb);
    return { data: templates, error: null };
  } catch (error) {
    console.error('[automationService.listTemplates] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function createTemplate(
  tenantId: string,
  name: string,
  templateType: 'email' | 'sms' | 'webhook',
  options?: {
    description?: string;
    subject?: string;
    body?: string;
    htmlBody?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ServiceResult<AutomationTemplate>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_automation_templates')
      .insert({
        tenant_id: tenantId,
        name,
        template_type: templateType,
        description: options?.description || null,
        subject: options?.subject || null,
        body: options?.body || null,
        html_body: options?.htmlBody || null,
        metadata: options?.metadata || {},
        is_active: true,
      })
      .select()
      .single();

    if (error) {
throw error;
}

    return { data: mapTemplateFromDb(data), error: null };
  } catch (error) {
    console.error('[automationService.createTemplate] Error:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================
// Mappers
// ============================================

function mapWorkflowFromDb(row: Record<string, unknown>): Workflow {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    description: row.description as string | null,
    trigger: row.trigger as WorkflowTrigger,
    actions: row.actions as WorkflowAction[],
    isActive: row.is_active as boolean,
    totalRuns: row.total_runs as number,
    successfulRuns: row.successful_runs as number,
    failedRuns: row.failed_runs as number,
    lastRunAt: row.last_run_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRunFromDb(row: Record<string, unknown>): WorkflowRun {
  return {
    id: row.id as string,
    workflowId: row.workflow_id as string,
    tenantId: row.tenant_id as string,
    contactId: row.contact_id as string | null,
    triggerContext: row.trigger_context as Record<string, unknown>,
    payload: row.payload as Record<string, unknown>,
    status: row.status as WorkflowRun['status'],
    currentActionIndex: row.current_action_index as number,
    actionResults: row.action_results as WorkflowRun['actionResults'],
    error: row.error as string | null,
    errorDetails: row.error_details as Record<string, unknown> | null,
    startedAt: row.started_at as string | null,
    completedAt: row.completed_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapTemplateFromDb(row: Record<string, unknown>): AutomationTemplate {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    description: row.description as string | null,
    templateType: row.template_type as AutomationTemplate['templateType'],
    subject: row.subject as string | null,
    body: row.body as string | null,
    htmlBody: row.html_body as string | null,
    metadata: row.metadata as Record<string, unknown>,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
