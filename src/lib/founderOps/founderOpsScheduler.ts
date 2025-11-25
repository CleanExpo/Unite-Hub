/**
 * Founder Ops Scheduler
 *
 * Daily and weekly execution queue generation for the Founder Ops Hub.
 * Smart scheduling based on task effort, priority, deadlines, and brand distribution.
 *
 * Key Features:
 * - Daily queue generation (8-hour workday)
 * - Weekly planning with balanced distribution
 * - Smart batching by brand and channel
 * - Deadline-aware scheduling
 * - Queue control (pause, resume, reorder)
 *
 * @module founderOps/founderOpsScheduler
 */

import { createApiLogger } from '@/lib/logger';
import type { FounderTask, TaskPriority } from './founderOpsTaskLibrary';
import { TASK_LIBRARY } from './founderOpsTaskLibrary';

const logger = createApiLogger({ route: '/founder-ops/scheduler' });

// ====================================
// Types
// ====================================

export interface DailyQueue {
  date: string; // YYYY-MM-DD
  tasks: ScheduledTask[];
  total_duration_minutes: number;
  capacity_used_percentage: number;
  by_brand: Record<string, number>; // brand → task count
  by_priority: Record<TaskPriority, number>;
}

export interface WeeklyQueue {
  week_start: string; // YYYY-MM-DD (Monday)
  week_end: string; // YYYY-MM-DD (Sunday)
  daily_queues: DailyQueue[];
  total_tasks: number;
  total_duration_minutes: number;
  by_brand: Record<string, number>;
  by_priority: Record<TaskPriority, number>;
}

export interface ScheduledTask extends FounderTask {
  scheduled_time?: string; // ISO timestamp
  scheduled_order?: number; // Position in queue
  estimated_duration_minutes: number;
}

export interface SchedulingConfig {
  daily_capacity_minutes: number; // Default: 480 (8 hours)
  max_tasks_per_day: number; // Default: 20
  prefer_batching: boolean; // Group by brand/channel
  respect_deadlines: boolean; // Prioritize deadline-approaching tasks
  balance_brands: boolean; // Distribute evenly across brands
}

// ====================================
// Founder Ops Scheduler Class
// ====================================

export class FounderOpsScheduler {
  private workspaceId: string;
  private config: SchedulingConfig;

  constructor(
    workspaceId: string,
    config: Partial<SchedulingConfig> = {}
  ) {
    this.workspaceId = workspaceId;
    this.config = {
      daily_capacity_minutes: config.daily_capacity_minutes || 480, // 8 hours
      max_tasks_per_day: config.max_tasks_per_day || 20,
      prefer_batching: config.prefer_batching !== false,
      respect_deadlines: config.respect_deadlines !== false,
      balance_brands: config.balance_brands !== false,
    };
  }

  // ====================================
  // Queue Generation
  // ====================================

  /**
   * Generate daily queue for a specific date
   */
  async getDailyQueue(date: Date): Promise<DailyQueue> {
    logger.info('Generating daily queue', {
      workspaceId: this.workspaceId,
      date: this.formatDate(date),
    });

    // Get all scheduled tasks for this date
    const allTasks = await this.getTasksForDate(date);

    // Sort and prioritize tasks
    const prioritizedTasks = this.prioritizeTasks(allTasks, date);

    // Fill queue up to capacity
    const scheduledTasks = this.fillDailyQueue(prioritizedTasks, date);

    // Calculate statistics
    const totalDuration = scheduledTasks.reduce(
      (sum, task) => sum + task.estimated_duration_minutes,
      0
    );
    const capacityUsed = (totalDuration / this.config.daily_capacity_minutes) * 100;

    // Group by brand and priority
    const byBrand: Record<string, number> = {};
    const byPriority: Record<TaskPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    scheduledTasks.forEach((task) => {
      byBrand[task.brand_slug] = (byBrand[task.brand_slug] || 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
    });

    const queue: DailyQueue = {
      date: this.formatDate(date),
      tasks: scheduledTasks,
      total_duration_minutes: totalDuration,
      capacity_used_percentage: Math.round(capacityUsed),
      by_brand: byBrand,
      by_priority: byPriority,
    };

    logger.info('Daily queue generated', {
      date: queue.date,
      taskCount: scheduledTasks.length,
      duration: totalDuration,
      capacity: capacityUsed.toFixed(1) + '%',
    });

    return queue;
  }

  /**
   * Generate weekly queue starting from a specific date (Monday)
   */
  async getWeeklyQueue(startDate: Date): Promise<WeeklyQueue> {
    logger.info('Generating weekly queue', {
      workspaceId: this.workspaceId,
      weekStart: this.formatDate(startDate),
    });

    // Ensure startDate is Monday
    const monday = this.getMonday(startDate);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    // Generate daily queues for each day
    const dailyQueues: DailyQueue[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);

      // Skip weekends if configured
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Sunday or Saturday
        continue; // Can make configurable later
      }

      const queue = await this.getDailyQueue(date);
      dailyQueues.push(queue);
    }

    // Aggregate statistics
    const totalTasks = dailyQueues.reduce((sum, q) => sum + q.tasks.length, 0);
    const totalDuration = dailyQueues.reduce((sum, q) => sum + q.total_duration_minutes, 0);

    const byBrand: Record<string, number> = {};
    const byPriority: Record<TaskPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    dailyQueues.forEach((queue) => {
      Object.entries(queue.by_brand).forEach(([brand, count]) => {
        byBrand[brand] = (byBrand[brand] || 0) + count;
      });

      Object.entries(queue.by_priority).forEach(([priority, count]) => {
        byPriority[priority as TaskPriority] =
          (byPriority[priority as TaskPriority] || 0) + count;
      });
    });

    const weeklyQueue: WeeklyQueue = {
      week_start: this.formatDate(monday),
      week_end: this.formatDate(sunday),
      daily_queues: dailyQueues,
      total_tasks: totalTasks,
      total_duration_minutes: totalDuration,
      by_brand: byBrand,
      by_priority: byPriority,
    };

    logger.info('Weekly queue generated', {
      weekStart: weeklyQueue.week_start,
      weekEnd: weeklyQueue.week_end,
      totalTasks,
      totalDuration,
    });

    return weeklyQueue;
  }

  // ====================================
  // Task Scheduling
  // ====================================

  /**
   * Schedule a task for a specific date/time
   */
  async scheduleTask(taskId: string, scheduledFor: Date): Promise<void> {
    logger.info('Scheduling task', { taskId, scheduledFor: scheduledFor.toISOString() });

    // TODO: Update task in database with scheduled_for timestamp

    logger.info('Task scheduled', { taskId });
  }

  /**
   * Reschedule a task to a different date/time
   */
  async rescheduleTask(taskId: string, newScheduledFor: Date): Promise<void> {
    logger.info('Rescheduling task', { taskId, newScheduledFor: newScheduledFor.toISOString() });

    // TODO: Update task in database

    logger.info('Task rescheduled', { taskId });
  }

  /**
   * Unschedule a task (move back to draft)
   */
  async unscheduleTask(taskId: string): Promise<void> {
    logger.info('Unscheduling task', { taskId });

    // TODO: Update task status to draft, clear scheduled_for

    logger.info('Task unscheduled', { taskId });
  }

  // ====================================
  // Queue Control
  // ====================================

  /**
   * Pause queue execution
   */
  async pauseQueue(date?: Date): Promise<void> {
    const targetDate = date || new Date();
    logger.info('Pausing queue', { date: this.formatDate(targetDate) });

    // TODO: Set queue pause flag in database

    logger.info('Queue paused', { date: this.formatDate(targetDate) });
  }

  /**
   * Resume queue execution
   */
  async resumeQueue(date?: Date): Promise<void> {
    const targetDate = date || new Date();
    logger.info('Resuming queue', { date: this.formatDate(targetDate) });

    // TODO: Clear queue pause flag in database

    logger.info('Queue resumed', { date: this.formatDate(targetDate) });
  }

  /**
   * Reorder tasks in queue
   */
  async reorderQueue(date: Date, taskIds: string[]): Promise<void> {
    logger.info('Reordering queue', {
      date: this.formatDate(date),
      taskCount: taskIds.length,
    });

    // TODO: Update scheduled_order for each task in database

    logger.info('Queue reordered', { date: this.formatDate(date) });
  }

  // ====================================
  // Private Helper Methods
  // ====================================

  /**
   * Get all tasks scheduled for a specific date
   */
  private async getTasksForDate(date: Date): Promise<FounderTask[]> {
    // TODO: Query database for tasks with scheduled_for on this date
    // For now, return empty array
    return [];
  }

  /**
   * Prioritize tasks based on deadline, priority, effort
   */
  private prioritizeTasks(tasks: FounderTask[], targetDate: Date): ScheduledTask[] {
    const scheduledTasks: ScheduledTask[] = tasks.map((task) => {
      const taskDef = TASK_LIBRARY[task.archetype];
      return {
        ...task,
        estimated_duration_minutes: taskDef?.estimated_duration_minutes || 30,
      };
    });

    // Sort by priority score (higher = more urgent)
    scheduledTasks.sort((a, b) => {
      const scoreA = this.calculatePriorityScore(a, targetDate);
      const scoreB = this.calculatePriorityScore(b, targetDate);
      return scoreB - scoreA; // Descending
    });

    return scheduledTasks;
  }

  /**
   * Calculate priority score for a task
   */
  private calculatePriorityScore(task: ScheduledTask, targetDate: Date): number {
    let score = 0;

    // Priority weight (0-100)
    const priorityWeights: Record<TaskPriority, number> = {
      urgent: 100,
      high: 75,
      medium: 50,
      low: 25,
    };
    score += priorityWeights[task.priority] || 50;

    // Deadline urgency (0-50)
    if (this.config.respect_deadlines && task.deadline) {
      const deadline = new Date(task.deadline);
      const daysUntilDeadline = Math.ceil(
        (deadline.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDeadline <= 0) {
        score += 50; // Overdue
      } else if (daysUntilDeadline <= 1) {
        score += 40; // Due tomorrow
      } else if (daysUntilDeadline <= 3) {
        score += 30; // Due within 3 days
      } else if (daysUntilDeadline <= 7) {
        score += 20; // Due within a week
      } else {
        score += 10; // Due later
      }
    }

    // Effort (prefer quick wins if same priority)
    const effortBonus = task.estimated_duration_minutes < 30 ? 10 : 0;
    score += effortBonus;

    return score;
  }

  /**
   * Fill daily queue up to capacity
   */
  private fillDailyQueue(prioritizedTasks: ScheduledTask[], date: Date): ScheduledTask[] {
    const queue: ScheduledTask[] = [];
    let totalDuration = 0;
    let taskCount = 0;

    // Start time: 9:00 AM
    let currentTime = new Date(date);
    currentTime.setHours(9, 0, 0, 0);

    for (const task of prioritizedTasks) {
      // Check capacity
      if (
        totalDuration + task.estimated_duration_minutes > this.config.daily_capacity_minutes ||
        taskCount >= this.config.max_tasks_per_day
      ) {
        break; // Queue full
      }

      // Add to queue
      queue.push({
        ...task,
        scheduled_time: currentTime.toISOString(),
        scheduled_order: taskCount + 1,
      });

      // Update counters
      totalDuration += task.estimated_duration_minutes;
      taskCount += 1;

      // Advance time
      currentTime = new Date(currentTime.getTime() + task.estimated_duration_minutes * 60 * 1000);
    }

    // Apply batching if enabled
    if (this.config.prefer_batching) {
      return this.applyBatching(queue);
    }

    return queue;
  }

  /**
   * Apply smart batching by brand and channel
   */
  private applyBatching(queue: ScheduledTask[]): ScheduledTask[] {
    // Group by brand
    const byBrand: Record<string, ScheduledTask[]> = {};
    queue.forEach((task) => {
      if (!byBrand[task.brand_slug]) {
        byBrand[task.brand_slug] = [];
      }
      byBrand[task.brand_slug].push(task);
    });

    // Interleave brands to distribute evenly
    const batchedQueue: ScheduledTask[] = [];
    const brands = Object.keys(byBrand);
    let brandIndex = 0;

    while (batchedQueue.length < queue.length) {
      const brand = brands[brandIndex % brands.length];
      const brandTasks = byBrand[brand];

      if (brandTasks && brandTasks.length > 0) {
        const task = brandTasks.shift()!;
        batchedQueue.push(task);
      }

      brandIndex++;
    }

    // Re-assign scheduled_order
    batchedQueue.forEach((task, index) => {
      task.scheduled_order = index + 1;
    });

    return batchedQueue;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get Monday of the week containing the given date
   */
  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }
}

/**
 * Create Founder Ops Scheduler instance
 */
export function createFounderOpsScheduler(
  workspaceId: string,
  config?: Partial<SchedulingConfig>
): FounderOpsScheduler {
  return new FounderOpsScheduler(workspaceId, config);
}
