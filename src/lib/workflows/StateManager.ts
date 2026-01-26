/**
 * State Manager
 *
 * Manages workflow state persistence and updates
 *
 * @module lib/workflows/StateManager
 */

import { createApiLogger } from '@/lib/logger';
import { WorkflowState } from '@/lib/models/social-drip-campaign';
import { createClient } from '@/lib/supabase/server';

const logger = createApiLogger({ service: 'StateManager' });

export interface CreateWorkflowStateParams {
  enrollmentId: string;
  campaignId: string;
  contactId: string;
  currentNodeId: string;
  workflowStatus: WorkflowState['workflow_status'];
  executionPath: string[];
  workflowVariables: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  assignedVariant?: string;
  waitUntil?: Date;
  waitForEvent?: string;
}

export class StateManager {
  /**
   * Create new workflow state
   */
  async createWorkflowState(params: CreateWorkflowStateParams): Promise<WorkflowState> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('campaign_workflow_states')
        .insert({
          enrollment_id: params.enrollmentId,
          campaign_id: params.campaignId,
          contact_id: params.contactId,
          current_node_id: params.currentNodeId,
          workflow_status: params.workflowStatus,
          execution_path: params.executionPath,
          workflow_variables: params.workflowVariables,
          retry_count: params.retryCount,
          max_retries: params.maxRetries,
          assigned_variant: params.assignedVariant,
          wait_until: params.waitUntil,
          wait_for_event: params.waitForEvent,
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Workflow state created', { id: data.id, enrollmentId: params.enrollmentId });

      return this.mapToWorkflowState(data);
    } catch (error) {
      logger.error('Failed to create workflow state', { error, params });
      throw error;
    }
  }

  /**
   * Get workflow state by ID
   */
  async getWorkflowState(id: string): Promise<WorkflowState | null> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('campaign_workflow_states')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapToWorkflowState(data);
    } catch (error) {
      logger.error('Failed to get workflow state', { error, id });
      throw error;
    }
  }

  /**
   * Get workflow state by enrollment ID
   */
  async getWorkflowStateByEnrollment(enrollmentId: string): Promise<WorkflowState | null> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('campaign_workflow_states')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapToWorkflowState(data);
    } catch (error) {
      logger.error('Failed to get workflow state by enrollment', { error, enrollmentId });
      throw error;
    }
  }

  /**
   * Update workflow state
   */
  async updateWorkflowState(
    id: string,
    updates: Partial<{
      current_node_id: string;
      current_step_id: string;
      workflow_status: WorkflowState['workflow_status'];
      execution_path: string[];
      workflow_variables: Record<string, any>;
      wait_until: Date | null;
      wait_for_event: string | null;
      retry_count: number;
      assigned_variant: string;
      variant_assigned_at: Date;
      last_executed_at: Date;
      next_execution_at: Date | null;
      completed_at: Date | null;
    }>
  ): Promise<void> {
    const supabase = await createClient();

    try {
      const { error } = await supabase
        .from('campaign_workflow_states')
        .update({
          ...updates,
          wait_until: updates.wait_until ? updates.wait_until.toISOString() : undefined,
          variant_assigned_at: updates.variant_assigned_at
            ? updates.variant_assigned_at.toISOString()
            : undefined,
          last_executed_at: updates.last_executed_at
            ? updates.last_executed_at.toISOString()
            : undefined,
          next_execution_at: updates.next_execution_at
            ? updates.next_execution_at.toISOString()
            : undefined,
          completed_at: updates.completed_at ? updates.completed_at.toISOString() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      logger.info('Workflow state updated', { id, updates });
    } catch (error) {
      logger.error('Failed to update workflow state', { error, id, updates });
      throw error;
    }
  }

  /**
   * Get waiting workflows ready for execution
   */
  async getReadyWorkflows(limit: number = 100): Promise<WorkflowState[]> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('campaign_workflow_states')
        .select('*')
        .eq('workflow_status', 'waiting')
        .lte('wait_until', new Date().toISOString())
        .order('next_execution_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data.map((row) => this.mapToWorkflowState(row));
    } catch (error) {
      logger.error('Failed to get ready workflows', { error });
      throw error;
    }
  }

  /**
   * Get active workflows for campaign
   */
  async getActiveWorkflows(campaignId: string): Promise<WorkflowState[]> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('campaign_workflow_states')
        .select('*')
        .eq('campaign_id', campaignId)
        .in('workflow_status', ['running', 'waiting'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((row) => this.mapToWorkflowState(row));
    } catch (error) {
      logger.error('Failed to get active workflows', { error, campaignId });
      throw error;
    }
  }

  /**
   * Pause workflow
   */
  async pauseWorkflow(id: string): Promise<void> {
    await this.updateWorkflowState(id, {
      workflow_status: 'paused',
    });
  }

  /**
   * Resume paused workflow
   */
  async resumePausedWorkflow(id: string): Promise<void> {
    const state = await this.getWorkflowState(id);
    if (!state || state.workflow_status !== 'paused') {
      throw new Error('Workflow not in paused state');
    }

    await this.updateWorkflowState(id, {
      workflow_status: 'running',
    });
  }

  /**
   * Map database row to WorkflowState interface
   */
  private mapToWorkflowState(data: any): WorkflowState {
    return {
      id: data.id,
      enrollment_id: data.enrollment_id,
      campaign_id: data.campaign_id,
      contact_id: data.contact_id,
      current_node_id: data.current_node_id,
      current_step_id: data.current_step_id,
      workflow_status: data.workflow_status,
      execution_path: data.execution_path || [],
      workflow_variables: data.workflow_variables || {},
      wait_until: data.wait_until ? new Date(data.wait_until) : undefined,
      wait_for_event: data.wait_for_event,
      retry_count: data.retry_count || 0,
      max_retries: data.max_retries || 3,
      assigned_variant: data.assigned_variant,
      variant_assigned_at: data.variant_assigned_at ? new Date(data.variant_assigned_at) : undefined,
      started_at: new Date(data.started_at),
      last_executed_at: data.last_executed_at ? new Date(data.last_executed_at) : undefined,
      next_execution_at: data.next_execution_at ? new Date(data.next_execution_at) : undefined,
      completed_at: data.completed_at ? new Date(data.completed_at) : undefined,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }
}
