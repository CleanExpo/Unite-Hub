/**
 * AI Automation Workflow Engine
 * Unite Group Process Automation System
 */

import {
  AutomationWorkflow,
  WorkflowCondition,
  WorkflowAction,
  UserBehavior,
  PredictionResult
} from './types';

export interface AutomationConfig {
  enableRealTimeExecution: boolean;
  maxConcurrentWorkflows: number;
  workflowTimeoutMinutes: number;
  retryAttempts: number;
  retryDelaySeconds: number;
  enableWorkflowLogging: boolean;
  enablePerformanceMonitoring: boolean;
}

export const DEFAULT_AUTOMATION_CONFIG: AutomationConfig = {
  enableRealTimeExecution: true,
  maxConcurrentWorkflows: 100,
  workflowTimeoutMinutes: 30,
  retryAttempts: 3,
  retryDelaySeconds: 5,
  enableWorkflowLogging: true,
  enablePerformanceMonitoring: true
};

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  currentStep: number;
  context: Record<string, unknown>;
  logs: ExecutionLog[];
  error?: string;
}

interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

type ExecutionStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecuted?: string;
}

interface TriggerEvent {
  type: string;
  data: Record<string, unknown>;
  userId?: string;
  timestamp: string;
}

export class AutomationEngine {
  private config: AutomationConfig;
  private workflows: Map<string, AutomationWorkflow> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private workflowMetrics: Map<string, WorkflowMetrics> = new Map();
  private eventQueue: TriggerEvent[] = [];
  private isProcessing = false;

  constructor(config: Partial<AutomationConfig> = {}) {
    this.config = { ...DEFAULT_AUTOMATION_CONFIG, ...config };
    this.initializeDefaultWorkflows();
    
    if (this.config.enableRealTimeExecution) {
      this.startEventProcessing();
    }
  }

  /**
   * Register a new automation workflow
   */
  async registerWorkflow(workflow: AutomationWorkflow): Promise<void> {
    // Validate workflow
    this.validateWorkflow(workflow);
    
    // Store workflow
    this.workflows.set(workflow.id, workflow);
    
    // Initialize metrics
    this.workflowMetrics.set(workflow.id, {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    });

    console.log(`Workflow registered: ${workflow.name} (${workflow.id})`);
  }

  /**
   * Trigger workflow execution based on event
   */
  async triggerWorkflow(event: TriggerEvent): Promise<string[]> {
    const triggeredWorkflows: string[] = [];
    
    for (const [workflowId, workflow] of this.workflows.entries()) {
      if (!workflow.enabled) continue;
      
      if (this.shouldTriggerWorkflow(workflow, event)) {
        const executionId = await this.executeWorkflow(workflowId, event);
        if (executionId) {
          triggeredWorkflows.push(executionId);
        }
      }
    }
    
    return triggeredWorkflows;
  }

  /**
   * Execute a specific workflow
   */
  async executeWorkflow(workflowId: string, triggerEvent: TriggerEvent): Promise<string | null> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      console.error(`Workflow not found: ${workflowId}`);
      return null;
    }

    // Check concurrent execution limit
    if (this.activeExecutions.size >= this.config.maxConcurrentWorkflows) {
      console.warn(`Maximum concurrent workflows reached. Queuing workflow: ${workflowId}`);
      this.eventQueue.push(triggerEvent);
      return null;
    }

    const executionId = `exec_${workflowId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'pending',
      startTime: new Date().toISOString(),
      currentStep: 0,
      context: { ...triggerEvent.data },
      logs: []
    };

    this.activeExecutions.set(executionId, execution);
    
    // Start execution asynchronously
    this.executeWorkflowAsync(execution, workflow, triggerEvent);
    
    return executionId;
  }

  /**
   * Process workflow execution asynchronously
   */
  private async executeWorkflowAsync(
    execution: WorkflowExecution, 
    workflow: AutomationWorkflow,
    triggerEvent: TriggerEvent
  ): Promise<void> {
    try {
      execution.status = 'running';
      this.logExecution(execution, 'info', `Starting workflow: ${workflow.name}`);

      // Check workflow conditions
      if (!await this.evaluateConditions(workflow.conditions, execution.context, triggerEvent)) {
        execution.status = 'completed';
        this.logExecution(execution, 'info', 'Workflow conditions not met, skipping execution');
        this.completeExecution(execution, workflow);
        return;
      }

      // Execute actions sequentially
      for (let i = 0; i < workflow.actions.length; i++) {
        execution.currentStep = i;
        const action = workflow.actions[i];

        this.logExecution(execution, 'info', `Executing action ${i + 1}/${workflow.actions.length}: ${action.type}`);

        // Apply delay if specified
        if (action.delay && action.delay > 0) {
          await this.delay(action.delay * 1000);
        }

        const success = await this.executeAction(action, execution.context, triggerEvent);
        
        if (!success) {
          // Retry if configured
          let retryCount = 0;
          while (retryCount < (action.retry_count || this.config.retryAttempts)) {
            this.logExecution(execution, 'warn', `Retrying action ${i + 1}, attempt ${retryCount + 1}`);
            await this.delay(this.config.retryDelaySeconds * 1000);
            
            if (await this.executeAction(action, execution.context, triggerEvent)) {
              break;
            }
            retryCount++;
          }

          if (retryCount >= (action.retry_count || this.config.retryAttempts)) {
            throw new Error(`Action failed after ${retryCount} retries: ${action.type}`);
          }
        }
      }

      execution.status = 'completed';
      this.logExecution(execution, 'info', 'Workflow completed successfully');
      
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      this.logExecution(execution, 'error', `Workflow failed: ${execution.error}`);
    } finally {
      this.completeExecution(execution, workflow);
    }
  }

  /**
   * Execute a specific workflow action
   */
  private async executeAction(
    action: WorkflowAction, 
    context: Record<string, unknown>,
    triggerEvent: TriggerEvent
  ): Promise<boolean> {
    try {
      switch (action.type) {
        case 'email_send':
          return await this.executeEmailAction(action, context, triggerEvent);
        
        case 'notification_create':
          return await this.executeNotificationAction(action, context, triggerEvent);
        
        case 'tag_add':
          return await this.executeTagAction(action, context, triggerEvent);
        
        case 'segment_update':
          return await this.executeSegmentAction(action, context, triggerEvent);
        
        case 'task_create':
          return await this.executeTaskAction(action, context, triggerEvent);
        
        default:
          console.warn(`Unknown action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      return false;
    }
  }

  /**
   * Execute email sending action
   */
  private async executeEmailAction(
    action: WorkflowAction,
    context: Record<string, unknown>,
    triggerEvent: TriggerEvent
  ): Promise<boolean> {
    const config = action.configuration;
    
    // This would integrate with actual email service
    console.log('Sending email:', {
      to: config.recipient || triggerEvent.userId,
      subject: this.interpolateTemplate(config.subject as string, context),
      body: this.interpolateTemplate(config.body as string, context),
      template: config.template
    });

    // Simulate email sending delay
    await this.delay(100);
    
    return true;
  }

  /**
   * Execute notification creation action
   */
  private async executeNotificationAction(
    action: WorkflowAction,
    context: Record<string, unknown>,
    triggerEvent: TriggerEvent
  ): Promise<boolean> {
    const config = action.configuration;
    
    // This would integrate with notification system
    console.log('Creating notification:', {
      userId: triggerEvent.userId,
      type: config.type,
      title: this.interpolateTemplate(config.title as string, context),
      message: this.interpolateTemplate(config.message as string, context),
      priority: config.priority || 'normal'
    });

    return true;
  }

  /**
   * Execute tag addition action
   */
  private async executeTagAction(
    action: WorkflowAction,
    context: Record<string, unknown>,
    triggerEvent: TriggerEvent
  ): Promise<boolean> {
    const config = action.configuration;
    
    // This would integrate with user management system
    console.log('Adding tag:', {
      userId: triggerEvent.userId,
      tag: config.tag,
      category: config.category,
      value: config.value
    });

    return true;
  }

  /**
   * Execute segment update action
   */
  private async executeSegmentAction(
    action: WorkflowAction,
    context: Record<string, unknown>,
    triggerEvent: TriggerEvent
  ): Promise<boolean> {
    const config = action.configuration;
    
    // This would integrate with customer segmentation system
    console.log('Updating segment:', {
      userId: triggerEvent.userId,
      segmentId: config.segmentId,
      operation: config.operation, // 'add' or 'remove'
      reason: config.reason
    });

    return true;
  }

  /**
   * Execute task creation action
   */
  private async executeTaskAction(
    action: WorkflowAction,
    context: Record<string, unknown>,
    triggerEvent: TriggerEvent
  ): Promise<boolean> {
    const config = action.configuration;
    
    // This would integrate with task management system
    console.log('Creating task:', {
      assignee: config.assignee,
      title: this.interpolateTemplate(config.title as string, context),
      description: this.interpolateTemplate(config.description as string, context),
      priority: config.priority || 'medium',
      dueDate: config.dueDate,
      relatedUserId: triggerEvent.userId
    });

    return true;
  }

  /**
   * Evaluate workflow conditions
   */
  private async evaluateConditions(
    conditions: WorkflowCondition[],
    context: Record<string, unknown>,
    triggerEvent: TriggerEvent
  ): Promise<boolean> {
    for (const condition of conditions) {
      if (condition.required && !this.evaluateCondition(condition, context, triggerEvent)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: WorkflowCondition,
    context: Record<string, unknown>,
    triggerEvent: TriggerEvent
  ): boolean {
    const value = context[condition.field] || triggerEvent.data[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Check if workflow should be triggered by event
   */
  private shouldTriggerWorkflow(workflow: AutomationWorkflow, event: TriggerEvent): boolean {
    const trigger = workflow.trigger;
    
    switch (trigger.type) {
      case 'behavior':
        return event.type === 'user_behavior' && 
               this.matchesTriggerConfig(trigger.configuration, event.data);
      
      case 'time':
        return event.type === 'scheduled_time' &&
               this.matchesTimeConfig(trigger.configuration);
      
      case 'data_change':
        return event.type === 'data_change' &&
               this.matchesTriggerConfig(trigger.configuration, event.data);
      
      case 'prediction':
        return event.type === 'prediction_result' &&
               this.matchesPredictionConfig(trigger.configuration, event.data);
      
      case 'external_event':
        return event.type === 'external_event' &&
               this.matchesTriggerConfig(trigger.configuration, event.data);
      
      default:
        return false;
    }
  }

  /**
   * Check if trigger configuration matches event data
   */
  private matchesTriggerConfig(config: Record<string, unknown>, eventData: Record<string, unknown>): boolean {
    for (const [key, value] of Object.entries(config)) {
      if (eventData[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if time configuration matches current time
   */
  private matchesTimeConfig(config: Record<string, unknown>): boolean {
    // Implement time-based matching logic
    const now = new Date();
    
    if (config.hour !== undefined && now.getHours() !== config.hour) {
      return false;
    }
    
    if (config.dayOfWeek !== undefined && now.getDay() !== config.dayOfWeek) {
      return false;
    }
    
    if (config.dayOfMonth !== undefined && now.getDate() !== config.dayOfMonth) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if prediction configuration matches result
   */
  private matchesPredictionConfig(config: Record<string, unknown>, eventData: Record<string, unknown>): boolean {
    const predictionResult = eventData as unknown as PredictionResult;
    
    if (config.predictionType && predictionResult.prediction_type !== config.predictionType) {
      return false;
    }
    
    if (config.minConfidence && predictionResult.confidence < Number(config.minConfidence)) {
      return false;
    }
    
    if (config.threshold !== undefined) {
      const threshold = Number(config.threshold);
      const value = Number(predictionResult.predicted_value);
      
      if (config.operator === 'greater_than' && value <= threshold) {
        return false;
      }
      
      if (config.operator === 'less_than' && value >= threshold) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Template interpolation for dynamic content
   */
  private interpolateTemplate(template: string, context: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return String(context[key] || match);
    });
  }

  /**
   * Complete workflow execution and update metrics
   */
  private completeExecution(execution: WorkflowExecution, workflow: AutomationWorkflow): void {
    execution.endTime = new Date().toISOString();
    
    // Update metrics
    const metrics = this.workflowMetrics.get(workflow.id)!;
    metrics.totalExecutions++;
    metrics.lastExecuted = execution.endTime;
    
    if (execution.status === 'completed') {
      metrics.successfulExecutions++;
      workflow.execution_count++;
    } else {
      metrics.failedExecutions++;
    }
    
    // Calculate average execution time
    const executionTime = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
    metrics.averageExecutionTime = (
      (metrics.averageExecutionTime * (metrics.totalExecutions - 1)) + executionTime
    ) / metrics.totalExecutions;
    
    // Update success rate
    workflow.success_rate = metrics.successfulExecutions / metrics.totalExecutions;
    
    // Remove from active executions
    this.activeExecutions.delete(execution.id);
    
    // Log completion
    if (this.config.enableWorkflowLogging) {
      console.log(`Workflow execution completed: ${execution.id} (${execution.status})`);
    }
  }

  /**
   * Initialize default automation workflows
   */
  private initializeDefaultWorkflows(): void {
    const defaultWorkflows: AutomationWorkflow[] = [
      {
        id: 'welcome_new_user',
        name: 'Welcome New User',
        description: 'Send welcome email and set up initial tags for new users',
        trigger: {
          type: 'behavior',
          configuration: {
            event_type: 'user_registered'
          }
        },
        conditions: [],
        actions: [
          {
            type: 'email_send',
            configuration: {
              template: 'welcome_email',
              subject: 'Welcome to Unite Group!',
              body: 'Thank you for joining us, {{userName}}!'
            }
          },
          {
            type: 'tag_add',
            configuration: {
              tag: 'new_user',
              category: 'lifecycle'
            }
          }
        ],
        enabled: true,
        execution_count: 0,
        success_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'churn_risk_alert',
        name: 'Churn Risk Alert',
        description: 'Alert team when user shows high churn risk',
        trigger: {
          type: 'prediction',
          configuration: {
            predictionType: 'churn_risk',
            threshold: 0.7,
            operator: 'greater_than',
            minConfidence: 0.8
          }
        },
        conditions: [
          {
            field: 'user_tier',
            operator: 'in',
            value: ['premium', 'enterprise'],
            required: true
          }
        ],
        actions: [
          {
            type: 'notification_create',
            configuration: {
              type: 'alert',
              title: 'High Churn Risk User',
              message: 'User {{userId}} shows high churn risk ({{churnProbability}}%)',
              priority: 'high'
            }
          },
          {
            type: 'task_create',
            configuration: {
              assignee: 'customer_success_team',
              title: 'Reach out to at-risk user',
              description: 'User {{userId}} has high churn risk. Schedule check-in call.',
              priority: 'high'
            }
          }
        ],
        enabled: true,
        execution_count: 0,
        success_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'lead_scoring_update',
        name: 'Lead Scoring Update',
        description: 'Update lead segments based on quality score',
        trigger: {
          type: 'prediction',
          configuration: {
            predictionType: 'lead_quality_score'
          }
        },
        conditions: [],
        actions: [
          {
            type: 'segment_update',
            configuration: {
              segmentId: 'high_quality_leads',
              operation: 'add'
            }
          }
        ],
        enabled: true,
        execution_count: 0,
        success_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    defaultWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
      this.workflowMetrics.set(workflow.id, {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0
      });
    });

    console.log(`Initialized ${defaultWorkflows.length} default workflows`);
  }

  /**
   * Start event processing loop
   */
  private startEventProcessing(): void {
    setInterval(() => {
      if (this.eventQueue.length > 0 && !this.isProcessing) {
        this.processEventQueue();
      }
    }, 1000);
  }

  /**
   * Process queued events
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      while (this.eventQueue.length > 0 && this.activeExecutions.size < this.config.maxConcurrentWorkflows) {
        const event = this.eventQueue.shift()!;
        await this.triggerWorkflow(event);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Utility methods
   */
  private validateWorkflow(workflow: AutomationWorkflow): void {
    if (!workflow.id || !workflow.name) {
      throw new Error('Workflow must have id and name');
    }
    
    if (!workflow.trigger || !workflow.actions || workflow.actions.length === 0) {
      throw new Error('Workflow must have trigger and at least one action');
    }
  }

  private logExecution(execution: WorkflowExecution, level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    const log: ExecutionLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    execution.logs.push(log);
    
    if (this.config.enableWorkflowLogging) {
      console.log(`[${execution.id}] ${level.toUpperCase()}: ${message}`, data);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Public API methods
   */
  
  async getWorkflows(): Promise<AutomationWorkflow[]> {
    return Array.from(this.workflows.values());
  }

  async getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics | null> {
    return this.workflowMetrics.get(workflowId) || null;
  }

  async getActiveExecutions(): Promise<WorkflowExecution[]> {
    return Array.from(this.activeExecutions.values());
  }

  async getExecutionLogs(executionId: string): Promise<ExecutionLog[]> {
    const execution = this.activeExecutions.get(executionId);
    return execution?.logs || [];
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date().toISOString();
      this.activeExecutions.delete(executionId);
      return true;
    }
    return false;
  }

  async enableWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.enabled = true;
      workflow.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  async disableWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.enabled = false;
      workflow.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  // Event triggering methods for integration
  async onUserBehavior(behavior: UserBehavior): Promise<void> {
    const event: TriggerEvent = {
      type: 'user_behavior',
      data: { ...behavior },
      userId: behavior.user_id,
      timestamp: new Date().toISOString()
    };
    
    await this.triggerWorkflow(event);
  }

  async onPredictionResult(result: PredictionResult, userId: string): Promise<void> {
    const event: TriggerEvent = {
      type: 'prediction_result',
      data: { ...result },
      userId,
      timestamp: new Date().toISOString()
    };
    
    await this.triggerWorkflow(event);
  }

  async onDataChange(entityType: string, entityId: string, changes: Record<string, unknown>): Promise<void> {
    const event: TriggerEvent = {
      type: 'data_change',
      data: {
        entityType,
        entityId,
        changes
      },
      timestamp: new Date().toISOString()
    };
    
    await this.triggerWorkflow(event);
  }

  async onScheduledTime(schedule: Record<string, unknown>): Promise<void> {
    const event: TriggerEvent = {
      type: 'scheduled_time',
      data: schedule,
      timestamp: new Date().toISOString()
    };
    
    await this.triggerWorkflow(event);
  }
}

// Export singleton instance
let automationEngineInstance: AutomationEngine | null = null;

export function getAutomationEngine(config?: Partial<AutomationConfig>): AutomationEngine {
  if (!automationEngineInstance) {
    automationEngineInstance = new AutomationEngine(config);
  }
  return automationEngineInstance;
}

export default AutomationEngine;
