/**
 * Scheduled Jobs Configuration
 * Manages recurring jobs for analytics, predictions, and maintenance
 */

import cron from 'node-cron';
import { analyticsQueue, predictionQueue } from '@/lib/queue/bull-queue';
import { getSupabaseServer } from '@/lib/supabase';
import { cacheManager } from '@/lib/cache/redis-client';

interface ScheduledJobMetrics {
  lastRun?: Date;
  nextRun?: Date;
  runsCompleted: number;
  runsFailed: number;
  lastError?: string;
}

class ScheduledJobsManager {
  private jobs: Map<string, { schedule: string; metrics: ScheduledJobMetrics }> = new Map();
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;

  /**
   * Initialize all scheduled jobs
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
return;
}

    console.log('[Scheduled Jobs] Initializing...');

    try {
      // Daily analytics aggregation at 2 AM UTC
      this.scheduleAnalyticsAggregation();

      // Pattern detection every 6 hours
      this.schedulePatternDetection();

      // Prediction generation at 3 AM UTC
      this.schedulePredictionGeneration();

      // Cache health check every hour
      this.scheduleCacheHealthCheck();

      // Alert statistics refresh every 30 minutes
      this.scheduleAlertStatsRefresh();

      // Cleanup old job records every 12 hours
      this.scheduleJobCleanup();

      this.isInitialized = true;
      console.log('[Scheduled Jobs] Initialized successfully');
    } catch (error) {
      console.error('[Scheduled Jobs] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Schedule daily analytics aggregation (2 AM UTC)
   */
  private scheduleAnalyticsAggregation(): void {
    const schedule = '0 2 * * *'; // 2 AM every day
    const task = cron.schedule(schedule, async () => {
      console.log('[Scheduled Jobs] Running daily analytics aggregation...');
      const metrics = this.jobs.get('analytics-aggregation');

      try {
        const frameworks = await this.getActiveFrameworks();
        console.log(`[Scheduled Jobs] Found ${frameworks.length} active frameworks`);

        for (const framework of frameworks) {
          await analyticsQueue.add(
            {
              workspaceId: framework.workspace_id,
              frameworkId: framework.id,
              date: new Date(),
              type: 'daily_aggregation',
            },
            {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
              priority: 5,
            }
          );
        }

        if (metrics) {
          metrics.metrics.runsCompleted++;
          metrics.metrics.lastRun = new Date();
          metrics.metrics.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        console.log('[Scheduled Jobs] Analytics aggregation jobs queued');
      } catch (error) {
        console.error('[Scheduled Jobs] Analytics aggregation error:', error);
        if (metrics) {
          metrics.metrics.runsFailed++;
          metrics.metrics.lastError = error instanceof Error ? error.message : String(error);
        }
      }
    });

    this.jobs.set('analytics-aggregation', {
      schedule,
      metrics: {
        runsCompleted: 0,
        runsFailed: 0,
        nextRun: this.getNextRunTime(schedule),
      },
    });

    this.tasks.set('analytics-aggregation', task);
    console.log('[Scheduled Jobs] Analytics aggregation scheduled: 2 AM UTC daily');
  }

  /**
   * Schedule pattern detection (every 6 hours)
   */
  private schedulePatternDetection(): void {
    const schedule = '0 */6 * * *'; // Every 6 hours
    const task = cron.schedule(schedule, async () => {
      console.log('[Scheduled Jobs] Running pattern detection...');
      const metrics = this.jobs.get('pattern-detection');

      try {
        const frameworks = await this.getActiveFrameworks();

        for (const framework of frameworks) {
          await analyticsQueue.add(
            {
              workspaceId: framework.workspace_id,
              frameworkId: framework.id,
              type: 'pattern_detection',
            },
            {
              attempts: 2,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
              priority: 4,
            }
          );
        }

        if (metrics) {
          metrics.metrics.runsCompleted++;
          metrics.metrics.lastRun = new Date();
          metrics.metrics.nextRun = new Date(Date.now() + 6 * 60 * 60 * 1000);
        }

        console.log('[Scheduled Jobs] Pattern detection jobs queued');
      } catch (error) {
        console.error('[Scheduled Jobs] Pattern detection error:', error);
        if (metrics) {
          metrics.metrics.runsFailed++;
          metrics.metrics.lastError = error instanceof Error ? error.message : String(error);
        }
      }
    });

    this.jobs.set('pattern-detection', {
      schedule,
      metrics: {
        runsCompleted: 0,
        runsFailed: 0,
        nextRun: this.getNextRunTime(schedule),
      },
    });

    this.tasks.set('pattern-detection', task);
    console.log('[Scheduled Jobs] Pattern detection scheduled: every 6 hours');
  }

  /**
   * Schedule prediction generation (3 AM UTC daily)
   */
  private schedulePredictionGeneration(): void {
    const schedule = '0 3 * * *'; // 3 AM every day
    const task = cron.schedule(schedule, async () => {
      console.log('[Scheduled Jobs] Running prediction generation...');
      const metrics = this.jobs.get('prediction-generation');

      try {
        const frameworks = await this.getActiveFrameworks();

        for (const framework of frameworks) {
          await predictionQueue.add(
            {
              workspaceId: framework.workspace_id,
              frameworkId: framework.id,
              type: 'daily_predictions',
            },
            {
              attempts: 2,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
              priority: 6,
            }
          );
        }

        if (metrics) {
          metrics.metrics.runsCompleted++;
          metrics.metrics.lastRun = new Date();
          metrics.metrics.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        console.log('[Scheduled Jobs] Prediction generation jobs queued');
      } catch (error) {
        console.error('[Scheduled Jobs] Prediction generation error:', error);
        if (metrics) {
          metrics.metrics.runsFailed++;
          metrics.metrics.lastError = error instanceof Error ? error.message : String(error);
        }
      }
    });

    this.jobs.set('prediction-generation', {
      schedule,
      metrics: {
        runsCompleted: 0,
        runsFailed: 0,
        nextRun: this.getNextRunTime(schedule),
      },
    });

    this.tasks.set('prediction-generation', task);
    console.log('[Scheduled Jobs] Prediction generation scheduled: 3 AM UTC daily');
  }

  /**
   * Schedule cache health check (every hour)
   */
  private scheduleCacheHealthCheck(): void {
    const schedule = '0 * * * *'; // Every hour
    const task = cron.schedule(schedule, async () => {
      try {
        const status = await cacheManager.getStatus();
        const metrics = cacheManager.getMetrics();

        if (status !== 'healthy') {
          console.warn('[Scheduled Jobs] Cache unhealthy:', status);
        } else {
          console.log('[Scheduled Jobs] Cache health check passed');
        }

        console.log('[Scheduled Jobs] Cache metrics:', metrics);
      } catch (error) {
        console.error('[Scheduled Jobs] Cache health check error:', error);
      }
    });

    this.jobs.set('cache-health-check', {
      schedule,
      metrics: {
        runsCompleted: 0,
        runsFailed: 0,
        nextRun: this.getNextRunTime(schedule),
      },
    });

    this.tasks.set('cache-health-check', task);
    console.log('[Scheduled Jobs] Cache health check scheduled: every hour');
  }

  /**
   * Schedule alert statistics refresh (every 30 minutes)
   */
  private scheduleAlertStatsRefresh(): void {
    const schedule = '*/30 * * * *'; // Every 30 minutes
    const task = cron.schedule(schedule, async () => {
      try {
        const supabase = await getSupabaseServer();

        // Invalidate cached alert stats
        await cacheManager.invalidatePattern('stats:*');

        console.log('[Scheduled Jobs] Alert statistics cache refreshed');
      } catch (error) {
        console.error('[Scheduled Jobs] Alert stats refresh error:', error);
      }
    });

    this.jobs.set('alert-stats-refresh', {
      schedule,
      metrics: {
        runsCompleted: 0,
        runsFailed: 0,
        nextRun: this.getNextRunTime(schedule),
      },
    });

    this.tasks.set('alert-stats-refresh', task);
    console.log('[Scheduled Jobs] Alert statistics refresh scheduled: every 30 minutes');
  }

  /**
   * Schedule job cleanup (every 12 hours)
   */
  private scheduleJobCleanup(): void {
    const schedule = '0 */12 * * *'; // Every 12 hours
    const task = cron.schedule(schedule, async () => {
      try {
        console.log('[Scheduled Jobs] Running cleanup...');

        // Cleanup completed jobs older than 1 hour
        await analyticsQueue.clean(60 * 60 * 1000, 'completed');
        await predictionQueue.clean(60 * 60 * 1000, 'completed');

        console.log('[Scheduled Jobs] Cleanup completed');
      } catch (error) {
        console.error('[Scheduled Jobs] Cleanup error:', error);
      }
    });

    this.jobs.set('job-cleanup', {
      schedule,
      metrics: {
        runsCompleted: 0,
        runsFailed: 0,
        nextRun: this.getNextRunTime(schedule),
      },
    });

    this.tasks.set('job-cleanup', task);
    console.log('[Scheduled Jobs] Job cleanup scheduled: every 12 hours');
  }

  /**
   * Get all active frameworks
   */
  private async getActiveFrameworks(): Promise<any[]> {
    try {
      const supabase = await getSupabaseServer();

      const { data } = await supabase
        .from('convex_frameworks')
        .select('id, workspace_id')
        .eq('status', 'active');

      return data || [];
    } catch (error) {
      console.error('[Scheduled Jobs] Failed to fetch frameworks:', error);
      return [];
    }
  }

  /**
   * Get metrics for all scheduled jobs
   */
  getMetrics() {
    const metrics: Record<string, any> = {};

    this.jobs.forEach((job, name) => {
      metrics[name] = {
        schedule: job.schedule,
        ...job.metrics,
      };
    });

    return metrics;
  }

  /**
   * Shutdown all scheduled jobs
   */
  shutdown(): void {
    console.log('[Scheduled Jobs] Shutting down...');

    this.tasks.forEach((task) => {
      task.stop();
    });

    this.tasks.clear();
    this.jobs.clear();
    this.isInitialized = false;

    console.log('[Scheduled Jobs] Shutdown complete');
  }

  /**
   * Get next run time for a cron schedule
   */
  private getNextRunTime(schedule: string): Date {
    const task = cron.schedule(schedule, () => {}, { scheduled: false });
    const nextRun = task.nextDate().toDate();
    task.stop();
    return nextRun;
  }
}

// Singleton instance
export const scheduledJobsManager = new ScheduledJobsManager();

export default ScheduledJobsManager;
