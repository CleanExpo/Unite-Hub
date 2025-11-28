/**
 * Founder Ops Queue Management
 *
 * Queue management system for controlling daily/weekly task execution.
 * Provides pause/resume controls, queue inspection, and manual reordering.
 *
 * Key Features:
 * - Queue status management (active, paused, completed)
 * - Real-time queue inspection
 * - Manual task reordering
 * - Queue metrics and statistics
 * - Integration with scheduler
 *
 * @module founderOps/founderOpsQueue
 */

import { createApiLogger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import type { FounderTask } from './founderOpsTaskLibrary';
import type { DailyQueue, ScheduledTask } from './founderOpsScheduler';

const logger = createApiLogger({ route: '/founder-ops/queue' });

// ====================================
// Types
// ====================================

export interface QueueStatus {
  id: string;
  workspace_id: string;
  queue_date: string; // YYYY-MM-DD
  status: 'active' | 'paused' | 'completed';
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  is_paused: boolean;
  paused_at?: string;
  paused_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QueueMetrics {
  date: string;
  total_tasks: number;
  completed: number;
  in_progress: number;
  pending: number;
  completion_percentage: number;
  estimated_time_remaining_minutes: number;
  time_elapsed_minutes: number;
  average_task_duration_minutes: number;
}

export interface QueueControlRequest {
  queue_id: string;
  action: 'pause' | 'resume' | 'cancel' | 'reorder';
  user_id: string;
  reason?: string;
  task_order?: string[]; // For reorder action
}

// ====================================
// Founder Ops Queue Manager Class
// ====================================

export class FounderOpsQueueManager {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  // ====================================
  // Queue Status
  // ====================================

  /**
   * Get queue status for a specific date
   */
  async getQueueStatus(date: Date): Promise<QueueStatus | null> {
    const dateStr = this.formatDate(date);

    logger.info('Fetching queue status', {
      workspaceId: this.workspaceId,
      date: dateStr,
    });

    try {
      // Query tasks for the given date
      const { data: tasks, error } = await supabaseAdmin
        .from('founder_ops_tasks')
        .select('id, status')
        .eq('workspace_id', this.workspaceId)
        .gte('scheduled_for', `${dateStr}T00:00:00`)
        .lt('scheduled_for', `${dateStr}T23:59:59`);

      if (error) {
        logger.error('Error fetching queue status', { error: error.message });
        return null;
      }

      const taskList = tasks || [];
      const completed = taskList.filter(t => t.status === 'completed').length;
      const inProgress = taskList.filter(t => t.status === 'in_progress').length;
      const pending = taskList.filter(t => ['scheduled', 'draft', 'pending_review'].includes(t.status)).length;

      const queueStatus: QueueStatus = {
        id: `queue_${dateStr}_${this.workspaceId}`,
        workspace_id: this.workspaceId,
        queue_date: dateStr,
        status: completed === taskList.length && taskList.length > 0 ? 'completed' : 'active',
        total_tasks: taskList.length,
        completed_tasks: completed,
        in_progress_tasks: inProgress,
        pending_tasks: pending,
        is_paused: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return queueStatus;
    } catch (err) {
      logger.error('Exception fetching queue status', { error: err });
      return null;
    }
  }

  /**
   * Get queue metrics for a specific date
   */
  async getQueueMetrics(date: Date): Promise<QueueMetrics> {
    const dateStr = this.formatDate(date);

    logger.info('Calculating queue metrics', {
      workspaceId: this.workspaceId,
      date: dateStr,
    });

    try {
      const { data: tasks, error } = await supabaseAdmin
        .from('founder_ops_tasks')
        .select('id, status, estimated_duration_minutes, started_at, completed_at')
        .eq('workspace_id', this.workspaceId)
        .gte('scheduled_for', `${dateStr}T00:00:00`)
        .lt('scheduled_for', `${dateStr}T23:59:59`);

      if (error) {
        logger.error('Error fetching queue metrics', { error: error.message });
      }

      const taskList = tasks || [];
      const completed = taskList.filter(t => t.status === 'completed').length;
      const inProgress = taskList.filter(t => t.status === 'in_progress').length;
      const pending = taskList.filter(t => ['scheduled', 'draft', 'pending_review'].includes(t.status)).length;

      const completedTasks = taskList.filter(t => t.completed_at && t.started_at);
      const totalDuration = completedTasks.reduce((sum, t) => {
        const start = new Date(t.started_at).getTime();
        const end = new Date(t.completed_at).getTime();
        return sum + (end - start) / (1000 * 60);
      }, 0);
      const avgDuration = completedTasks.length > 0 ? totalDuration / completedTasks.length : 0;

      const remainingEstimate = taskList
        .filter(t => t.status !== 'completed')
        .reduce((sum, t) => sum + (t.estimated_duration_minutes || 15), 0);

      const metrics: QueueMetrics = {
        date: dateStr,
        total_tasks: taskList.length,
        completed,
        in_progress: inProgress,
        pending,
        completion_percentage: taskList.length > 0 ? Math.round((completed / taskList.length) * 100) : 0,
        estimated_time_remaining_minutes: remainingEstimate,
        time_elapsed_minutes: Math.round(totalDuration),
        average_task_duration_minutes: Math.round(avgDuration),
      };

      return metrics;
    } catch (err) {
      logger.error('Exception calculating queue metrics', { error: err });
      return {
        date: dateStr,
        total_tasks: 0,
        completed: 0,
        in_progress: 0,
        pending: 0,
        completion_percentage: 0,
        estimated_time_remaining_minutes: 0,
        time_elapsed_minutes: 0,
        average_task_duration_minutes: 0,
      };
    }
  }

  /**
   * Get all queues for a date range
   */
  async getQueuesInRange(startDate: Date, endDate: Date): Promise<QueueStatus[]> {
    const startStr = this.formatDate(startDate);
    const endStr = this.formatDate(endDate);

    logger.info('Fetching queues in range', {
      workspaceId: this.workspaceId,
      startDate: startStr,
      endDate: endStr,
    });

    try {
      const queues: QueueStatus[] = [];
      const current = new Date(startDate);

      while (current <= endDate) {
        const status = await this.getQueueStatus(current);
        if (status) {
          queues.push(status);
        }
        current.setDate(current.getDate() + 1);
      }

      return queues;
    } catch (err) {
      logger.error('Exception fetching queues in range', { error: err });
      return [];
    }
  }

  // ====================================
  // Queue Control
  // ====================================

  /**
   * Pause queue execution
   */
  async pauseQueue(date: Date, userId: string, reason?: string): Promise<void> {
    const dateStr = this.formatDate(date);

    logger.info('Pausing queue', {
      workspaceId: this.workspaceId,
      date: dateStr,
      userId,
      reason,
    });

    try {
      // Update all scheduled tasks for this date to 'paused' status
      const { error } = await supabaseAdmin
        .from('founder_ops_tasks')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString(),
        })
        .eq('workspace_id', this.workspaceId)
        .eq('status', 'scheduled')
        .gte('scheduled_for', `${dateStr}T00:00:00`)
        .lt('scheduled_for', `${dateStr}T23:59:59`);

      if (error) {
        logger.error('Error pausing queue', { error: error.message });
        throw error;
      }

      logger.info('Queue paused', { date: dateStr, userId, reason });
    } catch (err) {
      logger.error('Exception pausing queue', { error: err });
      throw err;
    }
  }

  /**
   * Resume queue execution
   */
  async resumeQueue(date: Date, userId: string): Promise<void> {
    const dateStr = this.formatDate(date);

    logger.info('Resuming queue', {
      workspaceId: this.workspaceId,
      date: dateStr,
      userId,
    });

    try {
      // Update all paused tasks for this date back to 'scheduled' status
      const { error } = await supabaseAdmin
        .from('founder_ops_tasks')
        .update({
          status: 'scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('workspace_id', this.workspaceId)
        .eq('status', 'paused')
        .gte('scheduled_for', `${dateStr}T00:00:00`)
        .lt('scheduled_for', `${dateStr}T23:59:59`);

      if (error) {
        logger.error('Error resuming queue', { error: error.message });
        throw error;
      }

      logger.info('Queue resumed', { date: dateStr, userId });
    } catch (err) {
      logger.error('Exception resuming queue', { error: err });
      throw err;
    }
  }

  /**
   * Cancel queue (clear all pending tasks)
   */
  async cancelQueue(date: Date, userId: string, reason?: string): Promise<void> {
    const dateStr = this.formatDate(date);

    logger.info('Canceling queue', {
      workspaceId: this.workspaceId,
      date: dateStr,
      userId,
      reason,
    });

    try {
      // Archive all non-completed tasks for this date
      const { error } = await supabaseAdmin
        .from('founder_ops_tasks')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq('workspace_id', this.workspaceId)
        .in('status', ['scheduled', 'paused', 'draft', 'pending_review'])
        .gte('scheduled_for', `${dateStr}T00:00:00`)
        .lt('scheduled_for', `${dateStr}T23:59:59`);

      if (error) {
        logger.error('Error canceling queue', { error: error.message });
        throw error;
      }

      logger.info('Queue canceled', { date: dateStr, userId, reason });
    } catch (err) {
      logger.error('Exception canceling queue', { error: err });
      throw err;
    }
  }

  /**
   * Reorder tasks in queue
   */
  async reorderQueue(date: Date, taskIds: string[], userId: string): Promise<void> {
    const dateStr = this.formatDate(date);

    logger.info('Reordering queue', {
      workspaceId: this.workspaceId,
      date: dateStr,
      taskCount: taskIds.length,
      userId,
    });

    try {
      // Update scheduled_order for each task based on position in taskIds array
      for (let i = 0; i < taskIds.length; i++) {
        const taskId = taskIds[i];
        const order = i + 1;

        const { error } = await supabaseAdmin
          .from('founder_ops_tasks')
          .update({
            priority_order: order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskId)
          .eq('workspace_id', this.workspaceId);

        if (error) {
          logger.error('Error updating task order', { taskId, order, error: error.message });
        } else {
          logger.debug('Updated task order', { taskId, order });
        }
      }

      logger.info('Queue reordered', { date: dateStr, taskCount: taskIds.length });
    } catch (err) {
      logger.error('Exception reordering queue', { error: err });
      throw err;
    }
  }

  // ====================================
  // Queue Inspection
  // ====================================

  /**
   * Get current queue (today's tasks)
   */
  async getCurrentQueue(): Promise<DailyQueue> {
    const today = new Date();
    const dateStr = this.formatDate(today);

    logger.info('Fetching current queue', {
      workspaceId: this.workspaceId,
      date: dateStr,
    });

    try {
      const { data: tasks, error } = await supabaseAdmin
        .from('founder_ops_tasks')
        .select('*')
        .eq('workspace_id', this.workspaceId)
        .gte('scheduled_for', `${dateStr}T00:00:00`)
        .lt('scheduled_for', `${dateStr}T23:59:59`)
        .order('priority_order', { ascending: true });

      if (error) {
        logger.error('Error fetching current queue', { error: error.message });
      }

      const taskList = tasks || [];
      const totalDuration = taskList.reduce((sum, t) => sum + (t.estimated_duration_minutes || 15), 0);
      const byBrand: Record<string, number> = {};
      const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };

      taskList.forEach(t => {
        byBrand[t.brand_slug || 'unknown'] = (byBrand[t.brand_slug || 'unknown'] || 0) + 1;
        const p = t.priority as keyof typeof byPriority;
        if (p in byPriority) byPriority[p]++;
      });

      const dailyCapacityMinutes = 480; // 8 hours
      const queue: DailyQueue = {
        date: dateStr,
        tasks: taskList as unknown as ScheduledTask[],
        total_duration_minutes: totalDuration,
        capacity_used_percentage: Math.min(100, Math.round((totalDuration / dailyCapacityMinutes) * 100)),
        by_brand: byBrand,
        by_priority: byPriority,
      };

      return queue;
    } catch (err) {
      logger.error('Exception fetching current queue', { error: err });
      return {
        date: dateStr,
        tasks: [],
        total_duration_minutes: 0,
        capacity_used_percentage: 0,
        by_brand: {},
        by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
      };
    }
  }

  /**
   * Get next task in queue
   */
  async getNextTask(date?: Date): Promise<ScheduledTask | null> {
    const targetDate = date || new Date();
    const dateStr = this.formatDate(targetDate);

    logger.info('Fetching next task', {
      workspaceId: this.workspaceId,
      date: dateStr,
    });

    try {
      const { data: task, error } = await supabaseAdmin
        .from('founder_ops_tasks')
        .select('*')
        .eq('workspace_id', this.workspaceId)
        .eq('status', 'scheduled')
        .gte('scheduled_for', `${dateStr}T00:00:00`)
        .lt('scheduled_for', `${dateStr}T23:59:59`)
        .order('priority_order', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching next task', { error: error.message });
      }

      return task as unknown as ScheduledTask || null;
    } catch (err) {
      logger.error('Exception fetching next task', { error: err });
      return null;
    }
  }

  /**
   * Get upcoming tasks (next N tasks)
   */
  async getUpcomingTasks(count: number, date?: Date): Promise<ScheduledTask[]> {
    const targetDate = date || new Date();
    const dateStr = this.formatDate(targetDate);

    logger.info('Fetching upcoming tasks', {
      workspaceId: this.workspaceId,
      date: dateStr,
      count,
    });

    try {
      const { data: tasks, error } = await supabaseAdmin
        .from('founder_ops_tasks')
        .select('*')
        .eq('workspace_id', this.workspaceId)
        .in('status', ['scheduled', 'pending_review'])
        .gte('scheduled_for', `${dateStr}T00:00:00`)
        .order('priority_order', { ascending: true })
        .limit(count);

      if (error) {
        logger.error('Error fetching upcoming tasks', { error: error.message });
      }

      return (tasks || []) as unknown as ScheduledTask[];
    } catch (err) {
      logger.error('Exception fetching upcoming tasks', { error: err });
      return [];
    }
  }

  // ====================================
  // Queue Statistics
  // ====================================

  /**
   * Get queue completion summary
   */
  async getQueueSummary(date: Date): Promise<{
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
    failed: number;
    completion_rate: number;
    average_duration_minutes: number;
  }> {
    const dateStr = this.formatDate(date);

    logger.info('Calculating queue summary', {
      workspaceId: this.workspaceId,
      date: dateStr,
    });

    try {
      const { data: tasks, error } = await supabaseAdmin
        .from('founder_ops_tasks')
        .select('id, status, started_at, completed_at')
        .eq('workspace_id', this.workspaceId)
        .gte('scheduled_for', `${dateStr}T00:00:00`)
        .lt('scheduled_for', `${dateStr}T23:59:59`);

      if (error) {
        logger.error('Error fetching queue summary', { error: error.message });
      }

      const taskList = tasks || [];
      const completed = taskList.filter(t => t.status === 'completed').length;
      const inProgress = taskList.filter(t => t.status === 'in_progress').length;
      const pending = taskList.filter(t => ['scheduled', 'draft', 'pending_review'].includes(t.status)).length;
      const failed = taskList.filter(t => t.status === 'failed').length;

      const completedTasks = taskList.filter(t => t.completed_at && t.started_at);
      const totalDuration = completedTasks.reduce((sum, t) => {
        const start = new Date(t.started_at).getTime();
        const end = new Date(t.completed_at).getTime();
        return sum + (end - start) / (1000 * 60);
      }, 0);
      const avgDuration = completedTasks.length > 0 ? totalDuration / completedTasks.length : 0;

      return {
        total: taskList.length,
        completed,
        in_progress: inProgress,
        pending,
        failed,
        completion_rate: taskList.length > 0 ? Math.round((completed / taskList.length) * 100) : 0,
        average_duration_minutes: Math.round(avgDuration),
      };
    } catch (err) {
      logger.error('Exception calculating queue summary', { error: err });
      return {
        total: 0,
        completed: 0,
        in_progress: 0,
        pending: 0,
        failed: 0,
        completion_rate: 0,
        average_duration_minutes: 0,
      };
    }
  }

  /**
   * Get queue performance metrics
   */
  async getQueuePerformance(startDate: Date, endDate: Date): Promise<{
    total_queues: number;
    average_completion_rate: number;
    average_tasks_per_day: number;
    total_tasks_completed: number;
    total_time_spent_minutes: number;
    most_productive_day: string;
    least_productive_day: string;
  }> {
    const startStr = this.formatDate(startDate);
    const endStr = this.formatDate(endDate);

    logger.info('Calculating queue performance', {
      workspaceId: this.workspaceId,
      startDate: startStr,
      endDate: endStr,
    });

    try {
      const { data: tasks, error } = await supabaseAdmin
        .from('founder_ops_tasks')
        .select('id, status, scheduled_for, started_at, completed_at')
        .eq('workspace_id', this.workspaceId)
        .gte('scheduled_for', `${startStr}T00:00:00`)
        .lte('scheduled_for', `${endStr}T23:59:59`);

      if (error) {
        logger.error('Error fetching queue performance', { error: error.message });
      }

      const taskList = tasks || [];
      const completedTasks = taskList.filter(t => t.status === 'completed');

      // Calculate total time spent
      const totalTimeSpent = completedTasks.reduce((sum, t) => {
        if (t.started_at && t.completed_at) {
          const start = new Date(t.started_at).getTime();
          const end = new Date(t.completed_at).getTime();
          return sum + (end - start) / (1000 * 60);
        }
        return sum;
      }, 0);

      // Group by day to calculate productivity
      const byDay: Record<string, number> = {};
      completedTasks.forEach(t => {
        const day = t.scheduled_for?.split('T')[0] || 'unknown';
        byDay[day] = (byDay[day] || 0) + 1;
      });

      const days = Object.entries(byDay);
      const mostProductiveDay = days.length > 0
        ? days.reduce((a, b) => a[1] > b[1] ? a : b)[0]
        : startStr;
      const leastProductiveDay = days.length > 0
        ? days.reduce((a, b) => a[1] < b[1] ? a : b)[0]
        : startStr;

      // Calculate days in range
      const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return {
        total_queues: daysInRange,
        average_completion_rate: taskList.length > 0
          ? Math.round((completedTasks.length / taskList.length) * 100)
          : 0,
        average_tasks_per_day: daysInRange > 0
          ? Math.round(taskList.length / daysInRange)
          : 0,
        total_tasks_completed: completedTasks.length,
        total_time_spent_minutes: Math.round(totalTimeSpent),
        most_productive_day: mostProductiveDay,
        least_productive_day: leastProductiveDay,
      };
    } catch (err) {
      logger.error('Exception calculating queue performance', { error: err });
      return {
        total_queues: 0,
        average_completion_rate: 0,
        average_tasks_per_day: 0,
        total_tasks_completed: 0,
        total_time_spent_minutes: 0,
        most_productive_day: startStr,
        least_productive_day: startStr,
      };
    }
  }

  // ====================================
  // Utility Methods
  // ====================================

  /**
   * Check if queue is paused
   */
  async isQueuePaused(date: Date): Promise<boolean> {
    const status = await this.getQueueStatus(date);
    return status?.is_paused || false;
  }

  /**
   * Check if queue is active
   */
  async isQueueActive(date: Date): Promise<boolean> {
    const status = await this.getQueueStatus(date);
    return status?.status === 'active';
  }

  /**
   * Check if queue is completed
   */
  async isQueueCompleted(date: Date): Promise<boolean> {
    const status = await this.getQueueStatus(date);
    return status?.status === 'completed';
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Create Founder Ops Queue Manager instance
 */
export function createFounderOpsQueueManager(workspaceId: string): FounderOpsQueueManager {
  return new FounderOpsQueueManager(workspaceId);
}
