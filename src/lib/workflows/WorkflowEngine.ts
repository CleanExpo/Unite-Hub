/**
 * Workflow Engine
 *
 * Core execution engine for social drip campaigns
 * Interprets canvas data and executes workflow nodes
 *
 * @module lib/workflows/WorkflowEngine
 */

import { createApiLogger } from '@/lib/logger';
import {
  SocialDripCampaign,
  SocialCampaignStep,
  WorkflowState,
  ExecutionContext,
  CampaignEvent,
  VisualNode,
  VisualEdge,
} from '@/lib/models/social-drip-campaign';
import { NodeExecutor } from './executors/NodeExecutor';
import { TriggerExecutor } from './executors/TriggerExecutor';
import { EmailExecutor } from './executors/EmailExecutor';
import { WaitExecutor } from './executors/WaitExecutor';
import { ConditionExecutor } from './executors/ConditionExecutor';
import { SplitExecutor } from './executors/SplitExecutor';
import { ActionExecutor } from './executors/ActionExecutor';
import { ExitExecutor } from './executors/ExitExecutor';
import { StateManager } from './StateManager';
import { EventLogger } from './EventLogger';

const logger = createApiLogger({ service: 'WorkflowEngine' });

export interface WorkflowEngineConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  maxExecutionTime?: number; // milliseconds
  enableParallelExecution?: boolean;
}

export class WorkflowEngine {
  private executors: Map<string, NodeExecutor>;
  private stateManager: StateManager;
  private eventLogger: EventLogger;
  private config: Required<WorkflowEngineConfig>;

  constructor(config: WorkflowEngineConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      maxExecutionTime: config.maxExecutionTime ?? 300000, // 5 minutes
      enableParallelExecution: config.enableParallelExecution ?? false,
    };

    // Initialize executors for each node type
    this.executors = new Map<string, NodeExecutor>([
      ['trigger', new TriggerExecutor()],
      ['email', new EmailExecutor()],
      ['wait', new WaitExecutor()],
      ['condition', new ConditionExecutor()],
      ['split', new SplitExecutor()],
      ['action', new ActionExecutor()],
      ['exit', new ExitExecutor()],
    ]);

    this.stateManager = new StateManager();
    this.eventLogger = new EventLogger();
  }

  /**
   * Start workflow execution for an enrollment
   */
  async startWorkflow(
    campaign: SocialDripCampaign,
    enrollmentId: string,
    contactId: string
  ): Promise<WorkflowState> {
    logger.info('Starting workflow', { campaignId: campaign.id, enrollmentId, contactId });

    try {
      // Find trigger node
      const triggerNode = campaign.canvas_data.nodes.find((n) => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('No trigger node found in campaign');
      }

      // Initialize workflow state
      const workflowState = await this.stateManager.createWorkflowState({
        enrollmentId,
        campaignId: campaign.id,
        contactId,
        currentNodeId: triggerNode.id,
        workflowStatus: 'running',
        executionPath: [triggerNode.id],
        workflowVariables: {},
        retryCount: 0,
        maxRetries: this.config.maxRetries,
      });

      // Log enrollment started event
      await this.eventLogger.logEvent({
        campaignId: campaign.id,
        enrollmentId,
        contactId,
        eventType: 'enrollment_started',
        eventSource: 'system',
        nodeId: triggerNode.id,
        eventData: { trigger_type: triggerNode.data.config?.trigger_type },
      });

      // Execute first node
      await this.executeNode(campaign, workflowState);

      return workflowState;
    } catch (error) {
      logger.error('Failed to start workflow', { error, enrollmentId });
      throw error;
    }
  }

  /**
   * Resume workflow execution (for wait states)
   */
  async resumeWorkflow(workflowStateId: string): Promise<void> {
    logger.info('Resuming workflow', { workflowStateId });

    try {
      const workflowState = await this.stateManager.getWorkflowState(workflowStateId);
      if (!workflowState) {
        throw new Error(`Workflow state not found: ${workflowStateId}`);
      }

      if (workflowState.workflow_status !== 'waiting') {
        logger.warn('Workflow not in waiting state', {
          workflowStateId,
          status: workflowState.workflow_status,
        });
        return;
      }

      // Check if wait condition is met
      if (workflowState.wait_until && new Date() < workflowState.wait_until) {
        logger.info('Wait time not reached yet', { workflowStateId, waitUntil: workflowState.wait_until });
        return;
      }

      // Load campaign
      const campaign = await this.loadCampaign(workflowState.campaign_id);

      // Update state to running
      await this.stateManager.updateWorkflowState(workflowState.id, {
        workflow_status: 'running',
        wait_until: null,
        wait_for_event: null,
      });

      // Continue execution from current node
      await this.executeNode(campaign, workflowState);
    } catch (error) {
      logger.error('Failed to resume workflow', { error, workflowStateId });
      throw error;
    }
  }

  /**
   * Execute current node and advance workflow
   */
  private async executeNode(
    campaign: SocialDripCampaign,
    workflowState: WorkflowState
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Check execution timeout
      if (Date.now() - startTime > this.config.maxExecutionTime) {
        throw new Error('Workflow execution timeout');
      }

      // Get current node
      const currentNode = campaign.canvas_data.nodes.find(
        (n) => n.id === workflowState.current_node_id
      );

      if (!currentNode) {
        throw new Error(`Node not found: ${workflowState.current_node_id}`);
      }

      // Get executor for node type
      const executor = this.executors.get(currentNode.type);
      if (!executor) {
        throw new Error(`No executor found for node type: ${currentNode.type}`);
      }

      // Get step data (if exists)
      const step = campaign.steps?.find((s) => s.node_id === currentNode.id);

      // Build execution context
      const context: ExecutionContext = {
        enrollment: await this.loadEnrollment(workflowState.enrollment_id),
        workflow_state: workflowState,
        contact: await this.loadContact(workflowState.contact_id),
        campaign,
        current_step: step as SocialCampaignStep,
        variables: workflowState.workflow_variables,
      };

      // Execute node with retry logic
      const result = await this.executeWithRetry(executor, currentNode, context);

      // Log execution event
      await this.eventLogger.logEvent({
        campaignId: campaign.id,
        enrollmentId: workflowState.enrollment_id,
        contactId: workflowState.contact_id,
        eventType: this.getEventTypeForNode(currentNode.type),
        eventSource: 'system',
        nodeId: currentNode.id,
        stepId: step?.id,
        eventData: result.eventData || {},
      });

      // Handle execution result
      await this.handleExecutionResult(campaign, workflowState, currentNode, result);
    } catch (error) {
      logger.error('Node execution failed', {
        error,
        campaignId: campaign.id,
        nodeId: workflowState.current_node_id,
      });

      // Update workflow state to failed
      await this.stateManager.updateWorkflowState(workflowState.id, {
        workflow_status: 'failed',
        workflow_variables: {
          ...workflowState.workflow_variables,
          last_error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Execute node with retry logic
   */
  private async executeWithRetry(
    executor: NodeExecutor,
    node: VisualNode,
    context: ExecutionContext
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= context.workflow_state.max_retries; attempt++) {
      try {
        logger.info('Executing node', {
          nodeId: node.id,
          nodeType: node.type,
          attempt,
        });

        return await executor.execute(node, context);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn('Node execution attempt failed', {
          nodeId: node.id,
          attempt,
          error: lastError.message,
        });

        // Don't retry on last attempt
        if (attempt < context.workflow_state.max_retries) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt); // Exponential backoff
          await this.sleep(delay);

          // Update retry count
          await this.stateManager.updateWorkflowState(context.workflow_state.id, {
            retry_count: attempt + 1,
          });
        }
      }
    }

    throw lastError || new Error('Execution failed with unknown error');
  }

  /**
   * Handle execution result and advance workflow
   */
  private async handleExecutionResult(
    campaign: SocialDripCampaign,
    workflowState: WorkflowState,
    currentNode: VisualNode,
    result: any
  ): Promise<void> {
    // Handle wait state
    if (result.wait) {
      await this.stateManager.updateWorkflowState(workflowState.id, {
        workflow_status: 'waiting',
        wait_until: result.wait_until,
        wait_for_event: result.wait_for_event,
        next_execution_at: result.wait_until,
      });

      logger.info('Workflow waiting', {
        workflowStateId: workflowState.id,
        waitUntil: result.wait_until,
        waitForEvent: result.wait_for_event,
      });

      return;
    }

    // Handle exit state
    if (result.exit) {
      await this.stateManager.updateWorkflowState(workflowState.id, {
        workflow_status: 'exited',
        completed_at: new Date(),
        workflow_variables: {
          ...workflowState.workflow_variables,
          exit_reason: result.exit_reason,
        },
      });

      await this.eventLogger.logEvent({
        campaignId: campaign.id,
        enrollmentId: workflowState.enrollment_id,
        contactId: workflowState.contact_id,
        eventType: 'enrollment_exited',
        eventSource: 'system',
        nodeId: currentNode.id,
        eventData: { reason: result.exit_reason },
      });

      logger.info('Workflow exited', { workflowStateId: workflowState.id, reason: result.exit_reason });
      return;
    }

    // Get next node(s)
    const nextNodeIds = this.getNextNodes(campaign.canvas_data, currentNode, result);

    if (nextNodeIds.length === 0) {
      // No more nodes - workflow completed
      await this.stateManager.updateWorkflowState(workflowState.id, {
        workflow_status: 'completed',
        completed_at: new Date(),
      });

      await this.eventLogger.logEvent({
        campaignId: campaign.id,
        enrollmentId: workflowState.enrollment_id,
        contactId: workflowState.contact_id,
        eventType: 'enrollment_completed',
        eventSource: 'system',
        nodeId: currentNode.id,
        eventData: {},
      });

      logger.info('Workflow completed', { workflowStateId: workflowState.id });
      return;
    }

    // Move to next node(s)
    const nextNodeId = nextNodeIds[0]; // For now, take first (branching handled by executors)

    await this.stateManager.updateWorkflowState(workflowState.id, {
      current_node_id: nextNodeId,
      execution_path: [...workflowState.execution_path, nextNodeId],
      retry_count: 0, // Reset retry count for new node
      last_executed_at: new Date(),
    });

    // Continue execution
    await this.executeNode(campaign, {
      ...workflowState,
      current_node_id: nextNodeId,
      execution_path: [...workflowState.execution_path, nextNodeId],
    });
  }

  /**
   * Get next nodes based on current node and execution result
   */
  private getNextNodes(
    canvasData: { nodes: VisualNode[]; edges: VisualEdge[] },
    currentNode: VisualNode,
    result: any
  ): string[] {
    const edges = canvasData.edges.filter((e) => e.source === currentNode.id);

    // Condition nodes: use result to determine which branch
    if (currentNode.type === 'condition' && result.branchId) {
      const branchEdge = edges.find((e) => e.sourceHandle === result.branchId);
      return branchEdge ? [branchEdge.target] : [];
    }

    // Split nodes: use result to determine which variant
    if (currentNode.type === 'split' && result.variantId) {
      const variantEdge = edges.find((e) => e.sourceHandle === result.variantId);
      return variantEdge ? [variantEdge.target] : [];
    }

    // Default: return all connected nodes
    return edges.map((e) => e.target);
  }

  /**
   * Get event type for node type
   */
  private getEventTypeForNode(nodeType: string): any {
    const eventMap: Record<string, any> = {
      trigger: 'enrollment_started',
      email: 'email_sent',
      wait: 'wait_started',
      condition: 'condition_evaluated',
      split: 'variant_assigned',
      action: 'tag_added', // Default, varies by action type
      exit: 'enrollment_exited',
    };

    return eventMap[nodeType] || 'enrollment_started';
  }

  /**
   * Load campaign from database
   */
  private async loadCampaign(campaignId: string): Promise<SocialDripCampaign> {
    // TODO: Implement database query
    throw new Error('Not implemented');
  }

  /**
   * Load enrollment from database
   */
  private async loadEnrollment(enrollmentId: string): Promise<any> {
    // TODO: Implement database query
    throw new Error('Not implemented');
  }

  /**
   * Load contact from database
   */
  private async loadContact(contactId: string): Promise<any> {
    // TODO: Implement database query
    throw new Error('Not implemented');
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
