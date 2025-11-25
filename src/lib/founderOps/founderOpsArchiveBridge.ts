/**
 * Founder Ops Archive Bridge
 *
 * Integration with Living Intelligence Archive for logging all Founder Ops activities.
 * Ensures complete audit trail with brand metadata, execution results, and context.
 *
 * Key Features:
 * - Task lifecycle logging (created, updated, executed, approved, completed)
 * - Brand-aware archival with proper metadata
 * - Execution result storage
 * - Performance metrics tracking
 * - Query interface for historical analysis
 *
 * @module founderOps/founderOpsArchiveBridge
 */

import { createApiLogger } from '@/lib/logger';
import type { FounderTask } from './founderOpsTaskLibrary';
import type { TaskExecutionResult } from './founderOpsEngine';

const logger = createApiLogger({ route: '/founder-ops/archive-bridge' });

// ====================================
// Types
// ====================================

export interface ArchiveEntry {
  id: string;
  workspace_id: string;
  entry_type:
    | 'task_created'
    | 'task_updated'
    | 'task_executed'
    | 'task_approved'
    | 'task_rejected'
    | 'task_completed'
    | 'task_deleted'
    | 'status_changed'
    | 'queue_paused'
    | 'queue_resumed';
  task_id: string;
  brand_slug: string;
  archetype: string;
  timestamp: string;
  user_id?: string;
  metadata: {
    task_title?: string;
    task_priority?: string;
    task_status?: string;
    execution_result?: TaskExecutionResult;
    changes?: Record<string, any>;
    reason?: string;
    notes?: string;
    brand_context?: Record<string, any>;
    ai_systems_used?: string[];
    performance_metrics?: {
      execution_time_ms?: number;
      tokens_used?: number;
      cost?: number;
    };
  };
  created_at: string;
}

export interface ArchiveQuery {
  workspace_id: string;
  entry_type?: string | string[];
  task_id?: string;
  brand_slug?: string;
  archetype?: string;
  start_date?: string;
  end_date?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
}

export interface ArchiveStats {
  total_entries: number;
  by_entry_type: Record<string, number>;
  by_brand: Record<string, number>;
  by_archetype: Record<string, number>;
  date_range: {
    earliest: string;
    latest: string;
  };
}

// ====================================
// Founder Ops Archive Bridge Class
// ====================================

export class FounderOpsArchiveBridge {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  // ====================================
  // Archive Logging
  // ====================================

  /**
   * Log task creation to archive
   */
  async logTaskCreated(task: FounderTask, userId: string): Promise<void> {
    logger.info('Logging task creation to archive', {
      workspaceId: this.workspaceId,
      taskId: task.id,
      brandSlug: task.brand_slug,
    });

    const entry: Partial<ArchiveEntry> = {
      entry_type: 'task_created',
      task_id: task.id,
      brand_slug: task.brand_slug,
      archetype: task.archetype,
      timestamp: new Date().toISOString(),
      user_id: userId,
      metadata: {
        task_title: task.title,
        task_priority: task.priority,
        task_status: task.status,
      },
    };

    await this.writeToArchive(entry);
  }

  /**
   * Log task update to archive
   */
  async logTaskUpdated(
    task: FounderTask,
    changes: Record<string, any>,
    userId: string
  ): Promise<void> {
    logger.info('Logging task update to archive', {
      workspaceId: this.workspaceId,
      taskId: task.id,
      changes: Object.keys(changes),
    });

    const entry: Partial<ArchiveEntry> = {
      entry_type: 'task_updated',
      task_id: task.id,
      brand_slug: task.brand_slug,
      archetype: task.archetype,
      timestamp: new Date().toISOString(),
      user_id: userId,
      metadata: {
        task_title: task.title,
        task_status: task.status,
        changes,
      },
    };

    await this.writeToArchive(entry);
  }

  /**
   * Log task execution to archive
   */
  async logTaskExecuted(
    task: FounderTask,
    executionResult: TaskExecutionResult
  ): Promise<void> {
    logger.info('Logging task execution to archive', {
      workspaceId: this.workspaceId,
      taskId: task.id,
      success: executionResult.success,
      executionTimeMs: executionResult.execution_time_ms,
    });

    const entry: Partial<ArchiveEntry> = {
      entry_type: 'task_executed',
      task_id: task.id,
      brand_slug: task.brand_slug,
      archetype: task.archetype,
      timestamp: new Date().toISOString(),
      metadata: {
        task_title: task.title,
        task_status: task.status,
        execution_result: executionResult,
        ai_systems_used: executionResult.ai_systems_used,
        performance_metrics: {
          execution_time_ms: executionResult.execution_time_ms,
        },
      },
    };

    await this.writeToArchive(entry);
  }

  /**
   * Log task approval to archive
   */
  async logTaskApproved(
    task: FounderTask,
    approverId: string,
    notes?: string
  ): Promise<void> {
    logger.info('Logging task approval to archive', {
      workspaceId: this.workspaceId,
      taskId: task.id,
      approverId,
    });

    const entry: Partial<ArchiveEntry> = {
      entry_type: 'task_approved',
      task_id: task.id,
      brand_slug: task.brand_slug,
      archetype: task.archetype,
      timestamp: new Date().toISOString(),
      user_id: approverId,
      metadata: {
        task_title: task.title,
        task_status: task.status,
        notes,
      },
    };

    await this.writeToArchive(entry);
  }

  /**
   * Log task rejection to archive
   */
  async logTaskRejected(
    task: FounderTask,
    approverId: string,
    reason: string
  ): Promise<void> {
    logger.info('Logging task rejection to archive', {
      workspaceId: this.workspaceId,
      taskId: task.id,
      approverId,
    });

    const entry: Partial<ArchiveEntry> = {
      entry_type: 'task_rejected',
      task_id: task.id,
      brand_slug: task.brand_slug,
      archetype: task.archetype,
      timestamp: new Date().toISOString(),
      user_id: approverId,
      metadata: {
        task_title: task.title,
        task_status: task.status,
        reason,
      },
    };

    await this.writeToArchive(entry);
  }

  /**
   * Log task completion to archive
   */
  async logTaskCompleted(task: FounderTask): Promise<void> {
    logger.info('Logging task completion to archive', {
      workspaceId: this.workspaceId,
      taskId: task.id,
    });

    const entry: Partial<ArchiveEntry> = {
      entry_type: 'task_completed',
      task_id: task.id,
      brand_slug: task.brand_slug,
      archetype: task.archetype,
      timestamp: new Date().toISOString(),
      metadata: {
        task_title: task.title,
        task_status: task.status,
      },
    };

    await this.writeToArchive(entry);
  }

  /**
   * Log task deletion to archive
   */
  async logTaskDeleted(task: FounderTask, userId: string, reason?: string): Promise<void> {
    logger.info('Logging task deletion to archive', {
      workspaceId: this.workspaceId,
      taskId: task.id,
      userId,
    });

    const entry: Partial<ArchiveEntry> = {
      entry_type: 'task_deleted',
      task_id: task.id,
      brand_slug: task.brand_slug,
      archetype: task.archetype,
      timestamp: new Date().toISOString(),
      user_id: userId,
      metadata: {
        task_title: task.title,
        task_status: task.status,
        reason,
      },
    };

    await this.writeToArchive(entry);
  }

  /**
   * Log status change to archive
   */
  async logStatusChanged(
    task: FounderTask,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    logger.info('Logging status change to archive', {
      workspaceId: this.workspaceId,
      taskId: task.id,
      oldStatus,
      newStatus,
    });

    const entry: Partial<ArchiveEntry> = {
      entry_type: 'status_changed',
      task_id: task.id,
      brand_slug: task.brand_slug,
      archetype: task.archetype,
      timestamp: new Date().toISOString(),
      metadata: {
        task_title: task.title,
        task_status: newStatus,
        changes: {
          old_status: oldStatus,
          new_status: newStatus,
        },
      },
    };

    await this.writeToArchive(entry);
  }

  // ====================================
  // Archive Query
  // ====================================

  /**
   * Query archive entries
   */
  async queryArchive(query: ArchiveQuery): Promise<ArchiveEntry[]> {
    logger.info('Querying archive', {
      workspaceId: this.workspaceId,
      query,
    });

    // TODO: Query database (aiMemory or separate archive table)
    // For now, return empty array

    return [];
  }

  /**
   * Get task history
   */
  async getTaskHistory(taskId: string): Promise<ArchiveEntry[]> {
    logger.info('Fetching task history', {
      workspaceId: this.workspaceId,
      taskId,
    });

    return this.queryArchive({
      workspace_id: this.workspaceId,
      task_id: taskId,
    });
  }

  /**
   * Get brand activity history
   */
  async getBrandHistory(brandSlug: string, limit?: number): Promise<ArchiveEntry[]> {
    logger.info('Fetching brand history', {
      workspaceId: this.workspaceId,
      brandSlug,
      limit,
    });

    return this.queryArchive({
      workspace_id: this.workspaceId,
      brand_slug: brandSlug,
      limit,
    });
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 50): Promise<ArchiveEntry[]> {
    logger.info('Fetching recent activity', {
      workspaceId: this.workspaceId,
      limit,
    });

    return this.queryArchive({
      workspace_id: this.workspaceId,
      limit,
    });
  }

  // ====================================
  // Archive Statistics
  // ====================================

  /**
   * Get archive statistics
   */
  async getArchiveStats(): Promise<ArchiveStats> {
    logger.info('Calculating archive statistics', {
      workspaceId: this.workspaceId,
    });

    // TODO: Calculate from database
    // For now, return mock stats

    const stats: ArchiveStats = {
      total_entries: 0,
      by_entry_type: {},
      by_brand: {},
      by_archetype: {},
      date_range: {
        earliest: new Date().toISOString(),
        latest: new Date().toISOString(),
      },
    };

    return stats;
  }

  /**
   * Get brand activity summary
   */
  async getBrandActivitySummary(
    brandSlug: string,
    startDate: string,
    endDate: string
  ): Promise<{
    brand_slug: string;
    date_range: { start: string; end: string };
    total_tasks: number;
    tasks_created: number;
    tasks_completed: number;
    tasks_approved: number;
    tasks_rejected: number;
    total_execution_time_ms: number;
    average_execution_time_ms: number;
  }> {
    logger.info('Calculating brand activity summary', {
      workspaceId: this.workspaceId,
      brandSlug,
      startDate,
      endDate,
    });

    // TODO: Calculate from database

    const summary = {
      brand_slug: brandSlug,
      date_range: { start: startDate, end: endDate },
      total_tasks: 0,
      tasks_created: 0,
      tasks_completed: 0,
      tasks_approved: 0,
      tasks_rejected: 0,
      total_execution_time_ms: 0,
      average_execution_time_ms: 0,
    };

    return summary;
  }

  // ====================================
  // Private Methods
  // ====================================

  /**
   * Write entry to archive
   */
  private async writeToArchive(entry: Partial<ArchiveEntry>): Promise<void> {
    logger.debug('Writing to archive', {
      entryType: entry.entry_type,
      taskId: entry.task_id,
    });

    // TODO: Write to database (aiMemory table or dedicated archive table)
    // For now, just log

    logger.info('Archive entry written', {
      entryType: entry.entry_type,
      taskId: entry.task_id,
    });
  }
}

/**
 * Create Founder Ops Archive Bridge instance
 */
export function createFounderOpsArchiveBridge(workspaceId: string): FounderOpsArchiveBridge {
  return new FounderOpsArchiveBridge(workspaceId);
}
