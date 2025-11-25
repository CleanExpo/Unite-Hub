/**
 * Founder Ops Engine
 *
 * Core execution engine for the Founder Ops Hub.
 * Handles task CRUD operations, status management, approval workflow,
 * AI system integration, and audit logging.
 *
 * Key Features:
 * - Brand-aware task execution using Brand Matrix
 * - Founder approval gates for high-effort tasks
 * - AI system integration (VIF, Topic Engine, Content Generation)
 * - Living Intelligence Archive logging
 * - Status transitions with validation
 *
 * @module founderOps/founderOpsEngine
 */

import { createApiLogger } from '@/lib/logger';
import { brandContextResolver } from '@/lib/brands/brandContextResolver';
import type { FounderTask, TaskStatus, TaskArchetype } from './founderOpsTaskLibrary';
import { TASK_LIBRARY, founderOpsTaskLibrary } from './founderOpsTaskLibrary';

const logger = createApiLogger({ route: '/founder-ops/engine' });

// ====================================
// Types
// ====================================

export interface TaskExecutionResult {
  success: boolean;
  task_id: string;
  status: TaskStatus;
  output?: {
    content_id?: string;
    draft_id?: string;
    visual_asset_ids?: string[];
    published?: boolean;
  };
  error?: string;
  execution_time_ms: number;
  ai_systems_used: string[];
}

export interface TaskApprovalRequest {
  task_id: string;
  approver_id: string;
  approved: boolean;
  notes?: string;
  rejection_reason?: string;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channels?: string[];
  deadline?: string;
  scheduled_for?: string;
  metadata?: Record<string, any>;
}

// ====================================
// Founder Ops Engine Class
// ====================================

export class FounderOpsEngine {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  // ====================================
  // Task CRUD Operations
  // ====================================

  /**
   * Create new task
   */
  async createTask(task: Partial<FounderTask>): Promise<FounderTask> {
    logger.info('Creating new task', {
      workspaceId: this.workspaceId,
      archetype: task.archetype,
      brand: task.brand_slug,
    });

    // Validate task
    const validation = founderOpsTaskLibrary.validateTask(task);
    if (!validation.valid) {
      throw new Error(`Task validation failed: ${validation.errors.join(', ')}`);
    }

    // Validate brand context if required
    const taskDef = task.archetype ? TASK_LIBRARY[task.archetype] : null;
    if (taskDef?.requires_brand_context && task.brand_slug) {
      const brandContext = await brandContextResolver.resolveBrandContext(task.brand_slug);
      if (!brandContext) {
        throw new Error(`Invalid brand: ${task.brand_slug}`);
      }
    }

    // Create task object
    const newTask: FounderTask = {
      id: this.generateTaskId(),
      workspace_id: this.workspaceId,
      brand_slug: task.brand_slug!,
      archetype: task.archetype!,
      title: task.title!,
      description: task.description,
      priority: task.priority || 'medium',
      status: task.status || 'draft',
      channels: task.channels || [],
      deadline: task.deadline,
      scheduled_for: task.scheduled_for,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: task.created_by!,
      assigned_to: task.assigned_to || 'ai',
      metadata: task.metadata || {},
    };

    // TODO: Save to database (founder_ops_tasks table)
    // For now, return the task object
    logger.info('Task created', { taskId: newTask.id });

    // Log to Living Intelligence Archive
    await this.logToArchive('task_created', newTask);

    return newTask;
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<FounderTask | null> {
    logger.info('Fetching task', { taskId });

    // TODO: Fetch from database
    // For now, return null
    return null;
  }

  /**
   * Get all tasks with filters
   */
  async getTasks(filters?: {
    brand_slug?: string;
    status?: TaskStatus;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assigned_to?: string;
    archetype?: TaskArchetype;
  }): Promise<FounderTask[]> {
    logger.info('Fetching tasks', { filters });

    // TODO: Fetch from database with filters
    // For now, return empty array
    return [];
  }

  /**
   * Get tasks by brand
   */
  async getTasksByBrand(brandSlug: string): Promise<FounderTask[]> {
    return this.getTasks({ brand_slug: brandSlug });
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status: TaskStatus): Promise<FounderTask[]> {
    return this.getTasks({ status });
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, updates: TaskUpdateRequest): Promise<FounderTask> {
    logger.info('Updating task', { taskId, updates });

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Apply updates
    const updatedTask: FounderTask = {
      ...task,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // TODO: Save to database

    logger.info('Task updated', { taskId });

    // Log to Living Intelligence Archive
    await this.logToArchive('task_updated', updatedTask, { updates });

    return updatedTask;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<void> {
    logger.info('Deleting task', { taskId });

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // TODO: Delete from database (or mark as archived)

    logger.info('Task deleted', { taskId });

    // Log to Living Intelligence Archive
    await this.logToArchive('task_deleted', task);
  }

  // ====================================
  // Status Management
  // ====================================

  /**
   * Update task status with validation
   */
  async updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<void> {
    logger.info('Updating task status', { taskId, newStatus });

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Validate status transition
    const validTransitions = this.getValidStatusTransitions(task.status);
    if (!validTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${task.status} → ${newStatus}. Valid: ${validTransitions.join(', ')}`
      );
    }

    // Update status
    await this.updateTask(taskId, { metadata: { ...task.metadata, previous_status: task.status } });

    // TODO: Update status in database

    logger.info('Task status updated', { taskId, oldStatus: task.status, newStatus });

    // Log to Living Intelligence Archive
    await this.logToArchive('status_changed', task, {
      old_status: task.status,
      new_status: newStatus,
    });
  }

  /**
   * Get valid status transitions for current status
   */
  private getValidStatusTransitions(currentStatus: TaskStatus): TaskStatus[] {
    const transitions: Record<TaskStatus, TaskStatus[]> = {
      draft: ['scheduled', 'archived'],
      scheduled: ['in_progress', 'draft', 'archived'],
      in_progress: ['pending_review', 'scheduled', 'archived'],
      pending_review: ['approved', 'rejected', 'in_progress'],
      approved: ['completed', 'in_progress'],
      rejected: ['in_progress', 'archived'],
      completed: ['archived'],
      archived: ['draft'], // Allow un-archiving
    };

    return transitions[currentStatus] || [];
  }

  // ====================================
  // Approval Workflow
  // ====================================

  /**
   * Approve task
   */
  async approveTask(taskId: string, approverId: string, notes?: string): Promise<void> {
    logger.info('Approving task', { taskId, approverId });

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status !== 'pending_review') {
      throw new Error(`Task must be in pending_review status to approve. Current: ${task.status}`);
    }

    // Update task status
    await this.updateTaskStatus(taskId, 'approved');

    // Update metadata with approval info
    await this.updateTask(taskId, {
      metadata: {
        ...task.metadata,
        approval_notes: notes,
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      },
    });

    logger.info('Task approved', { taskId });

    // Log to Living Intelligence Archive
    await this.logToArchive('task_approved', task, { approver_id: approverId, notes });
  }

  /**
   * Reject task
   */
  async rejectTask(taskId: string, approverId: string, reason: string): Promise<void> {
    logger.info('Rejecting task', { taskId, approverId });

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status !== 'pending_review') {
      throw new Error(`Task must be in pending_review status to reject. Current: ${task.status}`);
    }

    // Update task status
    await this.updateTaskStatus(taskId, 'rejected');

    // Update metadata with rejection info
    await this.updateTask(taskId, {
      metadata: {
        ...task.metadata,
        rejection_reason: reason,
        rejected_by: approverId,
        rejected_at: new Date().toISOString(),
      },
    });

    logger.info('Task rejected', { taskId });

    // Log to Living Intelligence Archive
    await this.logToArchive('task_rejected', task, { approver_id: approverId, reason });
  }

  // ====================================
  // Task Execution
  // ====================================

  /**
   * Execute task (trigger AI systems)
   */
  async executeTask(taskId: string): Promise<TaskExecutionResult> {
    const startTime = Date.now();

    logger.info('Executing task', { taskId });

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Update status to in_progress
    await this.updateTaskStatus(taskId, 'in_progress');

    try {
      // Get task definition
      const taskDef = TASK_LIBRARY[task.archetype];
      if (!taskDef) {
        throw new Error(`Unknown task archetype: ${task.archetype}`);
      }

      // Get brand context
      const brandContext = await brandContextResolver.resolveBrandContext(task.brand_slug);
      if (!brandContext) {
        throw new Error(`Invalid brand: ${task.brand_slug}`);
      }

      // Execute based on archetype
      const result = await this.executeByArchetype(task, taskDef, brandContext);

      // Update status to pending_review if approval required
      const nextStatus = taskDef.requires_founder_approval ? 'pending_review' : 'approved';
      await this.updateTaskStatus(taskId, nextStatus);

      const executionTime = Date.now() - startTime;

      logger.info('Task executed successfully', {
        taskId,
        executionTimeMs: executionTime,
        aiSystemsUsed: taskDef.ai_systems_used,
      });

      // Log to Living Intelligence Archive
      await this.logToArchive('task_executed', task, {
        execution_time_ms: executionTime,
        ai_systems_used: taskDef.ai_systems_used,
        result,
      });

      return {
        success: true,
        task_id: taskId,
        status: nextStatus,
        output: result,
        execution_time_ms: executionTime,
        ai_systems_used: taskDef.ai_systems_used,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Task execution failed', { taskId, error: errorMessage });

      // Update status back to scheduled
      await this.updateTaskStatus(taskId, 'scheduled');

      // Log to Living Intelligence Archive
      await this.logToArchive('task_execution_failed', task, {
        execution_time_ms: executionTime,
        error: errorMessage,
      });

      return {
        success: false,
        task_id: taskId,
        status: 'scheduled',
        error: errorMessage,
        execution_time_ms: executionTime,
        ai_systems_used: [],
      };
    }
  }

  /**
   * Execute task based on archetype
   */
  private async executeByArchetype(
    task: FounderTask,
    taskDef: any,
    brandContext: any
  ): Promise<any> {
    // TODO: Integrate with AI systems based on archetype
    // For now, return mock result

    const aiSystemsUsed = taskDef.ai_systems_used;

    logger.info('Executing with AI systems', {
      taskId: task.id,
      archetype: task.archetype,
      aiSystems: aiSystemsUsed,
    });

    // Mock execution result
    const result: any = {
      content_id: this.generateContentId(),
      draft_id: this.generateDraftId(),
      published: false,
    };

    // Add visual assets for tasks that use VIF
    if (aiSystemsUsed.includes('VIF')) {
      result.visual_asset_ids = [this.generateAssetId()];
    }

    return result;
  }

  // ====================================
  // Utility Methods
  // ====================================

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique content ID
   */
  private generateContentId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique draft ID
   */
  private generateDraftId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique asset ID
   */
  private generateAssetId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log to Living Intelligence Archive
   */
  private async logToArchive(
    eventType: string,
    task: FounderTask,
    metadata?: Record<string, any>
  ): Promise<void> {
    // TODO: Implement founderOpsArchiveBridge integration
    logger.info('Logging to Living Intelligence Archive', {
      eventType,
      taskId: task.id,
      brand: task.brand_slug,
      archetype: task.archetype,
    });
  }
}

/**
 * Create Founder Ops Engine instance
 */
export function createFounderOpsEngine(workspaceId: string): FounderOpsEngine {
  return new FounderOpsEngine(workspaceId);
}
