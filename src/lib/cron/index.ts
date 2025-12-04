// src/lib/cron/index.ts
// Cron System Module Exports

export {
  // Types
  type ScheduledTask,
  type TaskResult,
  type CronConfig,
  // Config
  DEFAULT_CRON_CONFIG,
  SCHEDULED_TASKS,
  // Task Handlers
  runModelScoutTask,
  runCostReportTask,
  runContentQueueTask,
  runSEOHealthCheckTask,
  runStrategyReviewTask,
  // Main Runner
  runTask,
} from './scheduled-tasks';

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

import { SCHEDULED_TASKS, runTask, type ScheduledTask, type TaskResult } from './scheduled-tasks';

/**
 * Get all enabled tasks
 */
export function getEnabledTasks(): ScheduledTask[] {
  return SCHEDULED_TASKS.filter((t) => t.enabled);
}

/**
 * Get task by ID
 */
export function getTaskById(taskId: string): ScheduledTask | undefined {
  return SCHEDULED_TASKS.find((t) => t.id === taskId);
}

/**
 * Run all enabled tasks (for manual trigger)
 */
export async function runAllEnabledTasks(): Promise<TaskResult[]> {
  const enabledTasks = getEnabledTasks();
  const results: TaskResult[] = [];

  for (const task of enabledTasks) {
    try {
      const result = await runTask(task.id);
      results.push(result);
    } catch (error) {
      results.push({
        task_id: task.id,
        success: false,
        started_at: new Date(),
        completed_at: new Date(),
        duration_ms: 0,
        error: String(error),
      });
    }
  }

  return results;
}

/**
 * Parse cron expression to human-readable format
 */
export function describeCronSchedule(schedule: string): string {
  const parts = schedule.split(' ');
  if (parts.length !== 5) {
    return 'Invalid cron expression';
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Common patterns
  if (schedule === '* * * * *') {
    return 'Every minute';
  }
  if (schedule.startsWith('*/')) {
    const interval = parseInt(minute.replace('*/', ''));
    return `Every ${interval} minutes`;
  }
  if (hour.startsWith('*/') && minute === '0') {
    const interval = parseInt(hour.replace('*/', ''));
    return `Every ${interval} hours`;
  }
  if (dayOfWeek !== '*' && minute !== '*' && hour !== '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = parseInt(dayOfWeek);
    return `Every ${days[dayIndex]} at ${hour}:${minute.padStart(2, '0')}`;
  }
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*' && minute !== '*' && hour !== '*') {
    return `Daily at ${hour}:${minute.padStart(2, '0')}`;
  }

  return schedule;
}

/**
 * Get tasks summary for dashboard
 */
export function getTasksSummary(): {
  total: number;
  enabled: number;
  disabled: number;
  tasks: Array<{
    id: string;
    name: string;
    schedule_human: string;
    enabled: boolean;
  }>;
} {
  return {
    total: SCHEDULED_TASKS.length,
    enabled: SCHEDULED_TASKS.filter((t) => t.enabled).length,
    disabled: SCHEDULED_TASKS.filter((t) => !t.enabled).length,
    tasks: SCHEDULED_TASKS.map((t) => ({
      id: t.id,
      name: t.name,
      schedule_human: describeCronSchedule(t.schedule),
      enabled: t.enabled,
    })),
  };
}
