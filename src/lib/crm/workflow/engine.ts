import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/sendEmail';
import { createNotification } from '@/lib/crm/notifications';

export interface WorkflowTrigger {
  type: 'deal_stage_change' | 'task_status_change' | 'client_created' | 'project_status_change';
  config: Record<string, any>;
}

export interface WorkflowCondition {
  type: 'field_equals' | 'field_contains' | 'field_greater_than' | 'field_less_than' | 'date_before' | 'date_after';
  field_name: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  logical_operator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'send_email' | 'create_task' | 'update_field' | 'send_notification' | 'create_activity' | 'assign_user';
  config: Record<string, any>;
  delay_minutes?: number;
}

export class WorkflowEngine {
  private supabase: any;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Execute workflows based on a trigger event
   */
  async executeTrigger(
    triggerType: string,
    entityType: string,
    entityId: string,
    context: Record<string, any>
  ) {
    try {
      // Find all active workflows matching this trigger
      const { data: workflows, error } = await this.supabase
        .from('workflow_templates')
        .select(`
          *,
          workflow_triggers!inner (
            trigger_type,
            trigger_config
          ),
          workflow_conditions (
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
        .eq('is_active', true)
        .eq('workflow_triggers.trigger_type', triggerType);

      if (error) throw error;

      // Execute each matching workflow
      for (const workflow of workflows || []) {
        await this.executeWorkflow(workflow, entityType, entityId, context);
      }
    } catch (error) {
      console.error('Error executing trigger:', error);
    }
  }

  /**
   * Execute a single workflow
   */
  private async executeWorkflow(
    workflow: any,
    entityType: string,
    entityId: string,
    context: Record<string, any>
  ) {
    // Create execution log
    const { data: executionLog, error: logError } = await this.supabase
      .from('workflow_execution_logs')
      .insert({
        workflow_id: workflow.id,
        trigger_entity_type: entityType,
        trigger_entity_id: entityId,
        status: 'running',
        execution_details: { context }
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating execution log:', logError);
      return;
    }

    try {
      // Check if trigger conditions match
      const triggerMatch = this.checkTriggerConditions(
        workflow.workflow_triggers[0],
        context
      );

      if (!triggerMatch) {
        await this.updateExecutionLog(executionLog.id, 'completed', {
          message: 'Trigger conditions not met'
        });
        return;
      }

      // Evaluate workflow conditions
      const conditionsMet = await this.evaluateConditions(
        workflow.workflow_conditions,
        entityType,
        entityId,
        context
      );

      if (!conditionsMet) {
        await this.updateExecutionLog(executionLog.id, 'completed', {
          message: 'Workflow conditions not met'
        });
        return;
      }

      // Execute actions
      const sortedActions = (workflow.workflow_actions || []).sort(
        (a: any, b: any) => a.order_index - b.order_index
      );

      for (const action of sortedActions) {
        await this.executeAction(
          action,
          executionLog.id,
          entityType,
          entityId,
          context
        );
      }

      await this.updateExecutionLog(executionLog.id, 'completed');
    } catch (error) {
      await this.updateExecutionLog(executionLog.id, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check if trigger conditions match
   */
  private checkTriggerConditions(
    trigger: any,
    context: Record<string, any>
  ): boolean {
    const config = trigger.trigger_config;

    switch (trigger.trigger_type) {
      case 'deal_stage_change':
        return (
          context.from_stage === config.from_stage &&
          context.to_stage === config.to_stage
        );
      case 'task_status_change':
        return (
          context.from_status === config.from_status &&
          context.to_status === config.to_status
        );
      case 'client_created':
        return true; // No additional conditions for client creation
      case 'project_status_change':
        return (
          context.from_status === config.from_status &&
          context.to_status === config.to_status
        );
      default:
        return false;
    }
  }

  /**
   * Evaluate workflow conditions
   */
  private async evaluateConditions(
    conditions: any[],
    entityType: string,
    entityId: string,
    context: Record<string, any>
  ): Promise<boolean> {
    if (!conditions || conditions.length === 0) return true;

    // Get entity data
    const entityData = await this.getEntityData(entityType, entityId);
    if (!entityData) return false;

    let result = true;
    let previousOperator = 'AND';

    for (const condition of conditions) {
      const conditionMet = this.evaluateCondition(
        condition,
        entityData,
        context
      );

      if (previousOperator === 'AND') {
        result = result && conditionMet;
      } else {
        result = result || conditionMet;
      }

      previousOperator = condition.logical_operator || 'AND';
    }

    return result;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: any,
    entityData: any,
    context: Record<string, any>
  ): boolean {
    const fieldValue = entityData[condition.field_name];
    const compareValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === compareValue;
      case 'not_equals':
        return fieldValue !== compareValue;
      case 'contains':
        return String(fieldValue).includes(String(compareValue));
      case 'greater_than':
        return Number(fieldValue) > Number(compareValue);
      case 'less_than':
        return Number(fieldValue) < Number(compareValue);
      default:
        return false;
    }
  }

  /**
   * Execute a workflow action
   */
  private async executeAction(
    action: any,
    executionLogId: string,
    entityType: string,
    entityId: string,
    context: Record<string, any>
  ) {
    // Create action log
    const { data: actionLog, error: logError } = await this.supabase
      .from('workflow_action_logs')
      .insert({
        execution_log_id: executionLogId,
        action_id: action.id,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating action log:', logError);
      return;
    }

    try {
      // Apply delay if configured
      if (action.delay_minutes > 0) {
        await new Promise(resolve => 
          setTimeout(resolve, action.delay_minutes * 60 * 1000)
        );
      }

      // Execute action based on type
      const result = await this.executeActionByType(
        action,
        entityType,
        entityId,
        context
      );

      // Update action log
      await this.supabase
        .from('workflow_action_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result
        })
        .eq('id', actionLog.id);
    } catch (error) {
      await this.supabase
        .from('workflow_action_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', actionLog.id);
    }
  }

  /**
   * Execute action based on its type
   */
  private async executeActionByType(
    action: any,
    entityType: string,
    entityId: string,
    context: Record<string, any>
  ): Promise<any> {
    const config = action.action_config;

    switch (action.action_type) {
      case 'send_email':
        return await this.sendEmailAction(config, entityType, entityId, context);
      
      case 'create_task':
        return await this.createTaskAction(config, entityType, entityId, context);
      
      case 'update_field':
        return await this.updateFieldAction(config, entityType, entityId);
      
      case 'send_notification':
        return await this.sendNotificationAction(config, entityType, entityId, context);
      
      case 'create_activity':
        return await this.createActivityAction(config, entityType, entityId, context);
      
      case 'assign_user':
        return await this.assignUserAction(config, entityType, entityId);
      
      default:
        throw new Error(`Unknown action type: ${action.action_type}`);
    }
  }

  /**
   * Send email action
   */
  private async sendEmailAction(
    config: any,
    entityType: string,
    entityId: string,
    context: Record<string, any>
  ) {
    const entityData = await this.getEntityData(entityType, entityId);
    
    // Replace variables in email template
    const subject = this.replaceVariables(config.subject, entityData, context);
    const body = this.replaceVariables(config.body, entityData, context);
    
    const result = await sendEmail({
      to: config.to || entityData.email,
      subject,
      html: body
    });

    return { emailSent: result.success };
  }

  /**
   * Create task action
   */
  private async createTaskAction(
    config: any,
    entityType: string,
    entityId: string,
    context: Record<string, any>
  ) {
    const entityData = await this.getEntityData(entityType, entityId);
    
    const { data, error } = await this.supabase
      .from('tasks')
      .insert({
        title: this.replaceVariables(config.title, entityData, context),
        description: this.replaceVariables(config.description, entityData, context),
        assigned_to: config.assigned_to,
        due_date: config.due_date,
        priority: config.priority || 'medium',
        status: 'pending',
        [entityType === 'deals' ? 'deal_id' : 'client_id']: entityId
      })
      .select()
      .single();

    if (error) throw error;
    return { taskId: data.id };
  }

  /**
   * Update field action
   */
  private async updateFieldAction(
    config: any,
    entityType: string,
    entityId: string
  ) {
    const tableName = this.getTableName(entityType);
    
    const { error } = await this.supabase
      .from(tableName)
      .update({ [config.field_name]: config.field_value })
      .eq('id', entityId);

    if (error) throw error;
    return { updated: true };
  }

  /**
   * Send notification action
   */
  private async sendNotificationAction(
    config: any,
    entityType: string,
    entityId: string,
    context: Record<string, any>
  ) {
    const entityData = await this.getEntityData(entityType, entityId);
    
    await createNotification({
      user_id: config.user_id || context.user_id,
      type: config.notification_type || 'workflow',
      title: this.replaceVariables(config.title, entityData, context),
      message: this.replaceVariables(config.message, entityData, context),
      data: {
        entity_type: entityType,
        entity_id: entityId,
        workflow_action: true
      }
    });

    return { notificationSent: true };
  }

  /**
   * Create activity action
   */
  private async createActivityAction(
    config: any,
    entityType: string,
    entityId: string,
    context: Record<string, any>
  ) {
    const entityData = await this.getEntityData(entityType, entityId);
    
    const { data, error } = await this.supabase
      .from('crm_activities')
      .insert({
        type: config.activity_type || 'note',
        subject: this.replaceVariables(config.subject, entityData, context),
        description: this.replaceVariables(config.description, entityData, context),
        [entityType === 'deals' ? 'deal_id' : 'client_id']: entityId,
        created_by: context.user_id
      })
      .select()
      .single();

    if (error) throw error;
    return { activityId: data.id };
  }

  /**
   * Assign user action
   */
  private async assignUserAction(
    config: any,
    entityType: string,
    entityId: string
  ) {
    const tableName = this.getTableName(entityType);
    
    const { error } = await this.supabase
      .from(tableName)
      .update({ assigned_to: config.user_id })
      .eq('id', entityId);

    if (error) throw error;
    return { assigned: true };
  }

  /**
   * Get entity data
   */
  private async getEntityData(entityType: string, entityId: string) {
    const tableName = this.getTableName(entityType);
    
    const { data, error } = await this.supabase
      .from(tableName)
      .select('*')
      .eq('id', entityId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get table name from entity type
   */
  private getTableName(entityType: string): string {
    const tableMap: Record<string, string> = {
      deals: 'deals',
      tasks: 'tasks',
      clients: 'clients',
      projects: 'projects',
      deal: 'deals',
      task: 'tasks',
      client: 'clients',
      project: 'projects'
    };

    return tableMap[entityType] || entityType;
  }

  /**
   * Replace variables in text
   */
  private replaceVariables(
    text: string,
    entityData: any,
    context: Record<string, any>
  ): string {
    let result = text;

    // Replace entity variables
    Object.keys(entityData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, entityData[key] || '');
    });

    // Replace context variables
    Object.keys(context).forEach(key => {
      const regex = new RegExp(`{{context.${key}}}`, 'g');
      result = result.replace(regex, context[key] || '');
    });

    return result;
  }

  /**
   * Update execution log
   */
  private async updateExecutionLog(
    logId: string,
    status: string,
    details?: any
  ) {
    await this.supabase
      .from('workflow_execution_logs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        execution_details: details
      })
      .eq('id', logId);
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();
