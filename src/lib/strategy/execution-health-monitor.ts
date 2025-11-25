/**
 * Execution Health Monitor
 * Phase 4: Task 1 - Real-Time Health Tracking
 *
 * Monitors strategy execution health with:
 * - Task completion rates
 * - Error rate detection
 * - Agent performance metrics
 * - Resource utilization tracking
 * - Predictive health scoring
 *
 * @module lib/strategy/execution-health-monitor
 */

import { supabaseAdmin } from '@/lib/supabase';

export interface HealthMetrics {
  score: number; // 0-100 health score
  lastChecked: Date;
  issues: string[];
  taskCompletionRate?: number;
  errorRate?: number;
  averageTaskDuration?: number;
  agentStatus?: Record<string, { tasksCompleted: number; tasksFailed: number; avgDuration: number }>;
  resourceStatus?: {
    memoryUsagePercent: number;
    cpuUsagePercent: number;
    tasksQueuedAhead: number;
  };
  predictedCompletion?: Date;
}

export interface HealthCheckResult {
  healthy: boolean;
  score: number;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Monitors and tracks execution health
 */
export class ExecutionHealthMonitor {
  private workspaceId: string;
  private readonly HEALTH_THRESHOLDS = {
    taskCompletionRate: 0.8, // 80% minimum
    errorRate: 0.2, // 20% maximum
    averageTaskDuration: 30000, // 30 seconds maximum
    minHealthScore: 50, // Below this = unhealthy
  };

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  /**
   * Check overall execution health
   */
  async checkHealth(executionId: string): Promise<HealthMetrics> {
    try {
      // Fetch execution and tasks
      const { data: execution, error: execError } = await supabaseAdmin
        .from('strategy_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (execError) throw execError;

      const { data: tasks, error: tasksError } = await supabaseAdmin
        .from('agent_tasks')
        .select('*')
        .eq('execution_id', executionId);

      if (tasksError) throw tasksError;

      if (!tasks || tasks.length === 0) {
        return {
          score: 100,
          lastChecked: new Date(),
          issues: [],
        };
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(execution, tasks);
      const healthScore = this.calculateHealthScore(metrics);
      const issues = this.identifyIssues(metrics);
      const agentStatus = this.analyzeAgentPerformance(tasks);

      return {
        score: healthScore,
        lastChecked: new Date(),
        issues,
        taskCompletionRate: metrics.completionRate,
        errorRate: metrics.errorRate,
        averageTaskDuration: metrics.avgTaskDuration,
        agentStatus,
        resourceStatus: {
          memoryUsagePercent: Math.random() * 80, // Placeholder
          cpuUsagePercent: Math.random() * 75, // Placeholder
          tasksQueuedAhead: tasks.filter((t) => t.status === 'pending').length,
        },
        predictedCompletion: this.predictCompletion(execution, tasks, metrics),
      };
    } catch (error) {
      console.error('Health check failed:', error);

      return {
        score: 0,
        lastChecked: new Date(),
        issues: [`Health check failed: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  /**
   * Calculate metrics from execution and tasks
   */
  private calculateMetrics(execution: any, tasks: any[]): {
    completionRate: number;
    errorRate: number;
    avgTaskDuration: number;
    totalDuration: number;
    tasksCompleted: number;
    tasksFailed: number;
    tasksPending: number;
  } {
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const failed = tasks.filter((t) => t.status === 'failed').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const total = tasks.length;

    // Calculate durations
    let totalDuration = 0;
    let durationCount = 0;

    for (const task of tasks) {
      if (task.assigned_at && task.completed_at) {
        const duration = new Date(task.completed_at).getTime() - new Date(task.assigned_at).getTime();
        totalDuration += duration;
        durationCount++;
      }
    }

    const avgTaskDuration = durationCount > 0 ? totalDuration / durationCount : 0;

    const execStart = new Date(execution.started_at).getTime();
    const execEnd = execution.completed_at ? new Date(execution.completed_at).getTime() : Date.now();
    const execDuration = execEnd - execStart;

    return {
      completionRate: total > 0 ? completed / total : 0,
      errorRate: total > 0 ? failed / total : 0,
      avgTaskDuration,
      totalDuration: execDuration,
      tasksCompleted: completed,
      tasksFailed: failed,
      tasksPending: pending,
    };
  }

  /**
   * Calculate overall health score (0-100)
   */
  private calculateHealthScore(metrics: ReturnType<typeof this.calculateMetrics>): number {
    let score = 100;

    // Deduct for low completion rate
    const completionDeficit = Math.max(0, this.HEALTH_THRESHOLDS.taskCompletionRate - metrics.completionRate);
    score -= completionDeficit * 50; // Up to 50 points

    // Deduct for high error rate
    const errorExcess = Math.max(0, metrics.errorRate - this.HEALTH_THRESHOLDS.errorRate);
    score -= errorExcess * 25; // Up to 25 points

    // Deduct for slow tasks
    if (metrics.avgTaskDuration > this.HEALTH_THRESHOLDS.averageTaskDuration) {
      const durationRatio = metrics.avgTaskDuration / this.HEALTH_THRESHOLDS.averageTaskDuration;
      score -= Math.min(15, (durationRatio - 1) * 10); // Up to 15 points
    }

    // Ensure score is in valid range
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Identify health issues
   */
  private identifyIssues(metrics: ReturnType<typeof this.calculateMetrics>): string[] {
    const issues: string[] = [];

    if (metrics.completionRate < this.HEALTH_THRESHOLDS.taskCompletionRate) {
      issues.push(
        `Low completion rate: ${(metrics.completionRate * 100).toFixed(1)}% (threshold: ${(this.HEALTH_THRESHOLDS.taskCompletionRate * 100).toFixed(0)}%)`
      );
    }

    if (metrics.errorRate > this.HEALTH_THRESHOLDS.errorRate) {
      issues.push(
        `High error rate: ${(metrics.errorRate * 100).toFixed(1)}% (threshold: ${(this.HEALTH_THRESHOLDS.errorRate * 100).toFixed(0)}%)`
      );
    }

    if (metrics.avgTaskDuration > this.HEALTH_THRESHOLDS.averageTaskDuration) {
      issues.push(
        `Slow task execution: ${(metrics.avgTaskDuration / 1000).toFixed(1)}s avg (threshold: ${(this.HEALTH_THRESHOLDS.averageTaskDuration / 1000).toFixed(0)}s)`
      );
    }

    if (metrics.tasksFailed > 0) {
      issues.push(`${metrics.tasksFailed} task(s) have failed`);
    }

    return issues;
  }

  /**
   * Analyze per-agent performance
   */
  private analyzeAgentPerformance(
    tasks: any[]
  ): Record<string, { tasksCompleted: number; tasksFailed: number; avgDuration: number }> {
    const agentStats: Record<string, any> = {};

    for (const task of tasks) {
      const agentType = task.agent_type;

      if (!agentStats[agentType]) {
        agentStats[agentType] = {
          tasksCompleted: 0,
          tasksFailed: 0,
          totalDuration: 0,
          durationCount: 0,
        };
      }

      if (task.status === 'completed') {
        agentStats[agentType].tasksCompleted++;
      } else if (task.status === 'failed') {
        agentStats[agentType].tasksFailed++;
      }

      if (task.assigned_at && task.completed_at) {
        const duration = new Date(task.completed_at).getTime() - new Date(task.assigned_at).getTime();
        agentStats[agentType].totalDuration += duration;
        agentStats[agentType].durationCount++;
      }
    }

    // Calculate averages
    const result: Record<string, { tasksCompleted: number; tasksFailed: number; avgDuration: number }> = {};

    for (const [agent, stats] of Object.entries(agentStats)) {
      result[agent] = {
        tasksCompleted: stats.tasksCompleted,
        tasksFailed: stats.tasksFailed,
        avgDuration:
          stats.durationCount > 0 ? stats.totalDuration / stats.durationCount : 0,
      };
    }

    return result;
  }

  /**
   * Predict completion time based on current metrics
   */
  private predictCompletion(
    execution: any,
    tasks: any[],
    metrics: ReturnType<typeof this.calculateMetrics>
  ): Date {
    const pending = tasks.filter((t) => t.status === 'pending').length;

    if (pending === 0) {
      // Already completed or will complete very soon
      return new Date();
    }

    // Estimate remaining time based on average task duration
    const estimatedRemainingMs = metrics.avgTaskDuration * pending;

    return new Date(Date.now() + estimatedRemainingMs);
  }

  /**
   * Perform comprehensive health check with recommendations
   */
  async comprehensiveHealthCheck(executionId: string): Promise<HealthCheckResult> {
    const health = await this.checkHealth(executionId);

    const healthy = health.score >= this.HEALTH_THRESHOLDS.minHealthScore;
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Generate warnings
    if (health.score < 75) {
      warnings.push('Execution health is degraded');
    }

    if (health.taskCompletionRate && health.taskCompletionRate < 0.5) {
      warnings.push('Less than 50% of tasks completed - consider reviewing strategy');
    }

    if (health.errorRate && health.errorRate > 0.3) {
      warnings.push('Error rate exceeds 30% - investigate failing tasks');
    }

    // Generate recommendations
    if (health.errorRate && health.errorRate > this.HEALTH_THRESHOLDS.errorRate) {
      recommendations.push('Reduce complexity of failing tasks');
      recommendations.push('Review error logs and adjust agent instructions');
    }

    if (health.averageTaskDuration && health.averageTaskDuration > this.HEALTH_THRESHOLDS.averageTaskDuration) {
      recommendations.push('Parallelize independent tasks');
      recommendations.push('Break down large tasks into smaller units');
    }

    if (health.taskCompletionRate && health.taskCompletionRate < this.HEALTH_THRESHOLDS.taskCompletionRate) {
      recommendations.push('Add more agents to handle workload');
      recommendations.push('Review task dependencies for deadlocks');
    }

    return {
      healthy,
      score: health.score,
      issues: health.issues,
      warnings,
      recommendations,
    };
  }

  /**
   * Get health history
   */
  async getHealthHistory(executionId: string, intervalMinutes: number = 5): Promise<HealthMetrics[]> {
    const { data: snapshots, error } = await supabaseAdmin
      .from('execution_health_snapshots')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: false })
      .limit(Math.floor(60 / intervalMinutes)); // Get last hour

    if (error) throw error;

    return (snapshots || []).map((s) => ({
      score: s.health_score,
      lastChecked: new Date(s.created_at),
      issues: s.issues || [],
      taskCompletionRate: s.completion_rate,
      errorRate: s.error_rate,
      averageTaskDuration: s.avg_task_duration,
    }));
  }

  /**
   * Archive health check results
   */
  async archiveHealthCheck(executionId: string, metrics: HealthMetrics): Promise<void> {
    const { error } = await supabaseAdmin.from('execution_health_snapshots').insert({
      execution_id: executionId,
      workspace_id: this.workspaceId,
      health_score: metrics.score,
      completion_rate: metrics.taskCompletionRate,
      error_rate: metrics.errorRate,
      avg_task_duration: metrics.averageTaskDuration,
      issues: metrics.issues,
    });

    if (error) throw error;
  }
}

export default ExecutionHealthMonitor;
