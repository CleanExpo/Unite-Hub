/**
 * Execution Feedback Loop System
 *
 * Tracks agent executions to enable learning and optimization.
 * Records what agents do, how long it takes, success/failure rates,
 * and provides insights for future task routing and optimization.
 *
 * Features:
 * - Execution history tracking
 * - Success/failure pattern analysis
 * - Performance metrics per agent/task type
 * - Recommendations based on historical data
 * - Automatic error pattern detection
 *
 * Usage:
 *   import { executionFeedback } from '@/lib/learning/execution-feedback';
 *
 *   // Record execution
 *   const execution = executionFeedback.startExecution({
 *     agentId: 'email-agent',
 *     taskType: 'email_processing',
 *     taskDescription: 'Process email from contact@example.com',
 *     workspaceId: 'workspace-123',
 *   });
 *
 *   // ... do work
 *
 *   // Finish execution
 *   await execution.finish({
 *     success: true,
 *     outputs: { contactsCreated: 1, emailsProcessed: 1 },
 *     metadata: { emailId: 'email-456' },
 *   });
 *
 *   // Get recommendations
 *   const recommendation = await executionFeedback.recommendAgent('email_processing');
 */

import { createClient } from '@/lib/supabase/server';
import { apm } from '@/lib/monitoring/apm';

export type TaskType =
  | 'email_processing'
  | 'content_generation'
  | 'contact_scoring'
  | 'campaign_execution'
  | 'database_query'
  | 'api_request'
  | 'file_processing'
  | 'data_transformation'
  | 'orchestration'
  | 'other';

export type AgentId =
  | 'orchestrator'
  | 'email-agent'
  | 'content-agent'
  | 'frontend'
  | 'backend'
  | 'seo'
  | 'founder-os'
  | 'system';

export interface ExecutionRecord {
  id: string;
  workspace_id: string;
  agent_id: AgentId;
  task_type: TaskType;
  task_description: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  success: boolean | null;
  error_message: string | null;
  error_type: string | null;
  inputs: Record<string, any>;
  outputs: Record<string, any> | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ExecutionStartParams {
  agentId: AgentId;
  taskType: TaskType;
  taskDescription: string;
  workspaceId: string;
  inputs?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ExecutionFinishParams {
  success: boolean;
  outputs?: Record<string, any>;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface ExecutionStats {
  agent_id: AgentId;
  task_type: TaskType;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
  avg_duration_ms: number;
  p50_duration_ms: number;
  p95_duration_ms: number;
  p99_duration_ms: number;
  common_errors: Array<{ error_type: string; count: number }>;
  last_execution: string;
}

export interface AgentRecommendation {
  agent_id: AgentId;
  confidence: number;
  reason: string;
  historical_success_rate: number;
  avg_duration_ms: number;
  recent_executions: number;
}

class ExecutionTracker {
  private executionId: string;
  private startTime: number;
  private params: ExecutionStartParams;
  private finished: boolean = false;

  constructor(executionId: string, params: ExecutionStartParams) {
    this.executionId = executionId;
    this.startTime = Date.now();
    this.params = params;
  }

  /**
   * Finish execution and record results
   */
  async finish(finishParams: ExecutionFinishParams): Promise<void> {
    if (this.finished) {
      console.warn('[ExecutionFeedback] Execution already finished:', this.executionId);
      return;
    }

    this.finished = true;
    const duration = Date.now() - this.startTime;

    const supabase = await createClient();

    const { error } = await supabase
      .from('execution_history')
      .update({
        finished_at: new Date().toISOString(),
        duration_ms: duration,
        success: finishParams.success,
        error_message: finishParams.error?.message || null,
        error_type: finishParams.error?.name || null,
        outputs: finishParams.outputs || {},
        metadata: {
          ...this.params.metadata,
          ...finishParams.metadata,
        },
      })
      .eq('id', this.executionId);

    if (error) {
      console.error('[ExecutionFeedback] Failed to finish execution:', error);
    }

    // Record APM metric
    apm.recordHistogram(`execution.duration.${this.params.taskType}`, duration, {
      agent_id: this.params.agentId,
      success: String(finishParams.success),
    });

    if (!finishParams.success) {
      apm.incrementCounter('execution.failures', 1, {
        agent_id: this.params.agentId,
        task_type: this.params.taskType,
        error_type: finishParams.error?.name || 'unknown',
      });
    }
  }

  /**
   * Mark execution as abandoned (not properly finished)
   */
  async abandon(reason: string): Promise<void> {
    if (this.finished) return;

    this.finished = true;
    const duration = Date.now() - this.startTime;

    const supabase = await createClient();

    await supabase
      .from('execution_history')
      .update({
        finished_at: new Date().toISOString(),
        duration_ms: duration,
        success: false,
        error_message: `Abandoned: ${reason}`,
        error_type: 'ExecutionAbandoned',
      })
      .eq('id', this.executionId);
  }

  /**
   * Get execution ID
   */
  getId(): string {
    return this.executionId;
  }
}

class ExecutionFeedbackLoop {
  /**
   * Start tracking an execution
   */
  async startExecution(params: ExecutionStartParams): Promise<ExecutionTracker> {
    const supabase = await createClient();

    const executionRecord: Partial<ExecutionRecord> = {
      workspace_id: params.workspaceId,
      agent_id: params.agentId,
      task_type: params.taskType,
      task_description: params.taskDescription,
      started_at: new Date().toISOString(),
      inputs: params.inputs || {},
      metadata: params.metadata || {},
    };

    const { data, error } = await supabase
      .from('execution_history')
      .insert(executionRecord)
      .select()
      .single();

    if (error || !data) {
      console.error('[ExecutionFeedback] Failed to start execution:', error);
      // Return no-op tracker if database fails
      return new ExecutionTracker('noop', params);
    }

    apm.incrementCounter('execution.started', 1, {
      agent_id: params.agentId,
      task_type: params.taskType,
    });

    return new ExecutionTracker(data.id, params);
  }

  /**
   * Get execution statistics for an agent/task combination
   */
  async getExecutionStats(
    agentId: AgentId,
    taskType: TaskType,
    workspaceId: string,
    timeWindowDays: number = 30
  ): Promise<ExecutionStats | null> {
    const supabase = await createClient();

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - timeWindowDays);

    const { data, error } = await supabase
      .from('execution_history')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('agent_id', agentId)
      .eq('task_type', taskType)
      .gte('started_at', sinceDate.toISOString())
      .order('started_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    const executions = data as ExecutionRecord[];

    // Calculate statistics
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter((e) => e.success === true).length;
    const failedExecutions = executions.filter((e) => e.success === false).length;
    const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;

    // Duration statistics
    const durations = executions
      .filter((e) => e.duration_ms !== null)
      .map((e) => e.duration_ms as number)
      .sort((a, b) => a - b);

    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    const p50Duration = durations[p50Index] || 0;
    const p95Duration = durations[p95Index] || 0;
    const p99Duration = durations[p99Index] || 0;

    // Common errors
    const errorCounts: Record<string, number> = {};
    executions
      .filter((e) => e.error_type)
      .forEach((e) => {
        const errorType = e.error_type as string;
        errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
      });

    const commonErrors = Object.entries(errorCounts)
      .map(([error_type, count]) => ({ error_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      agent_id: agentId,
      task_type: taskType,
      total_executions: totalExecutions,
      successful_executions: successfulExecutions,
      failed_executions: failedExecutions,
      success_rate: successRate,
      avg_duration_ms: avgDuration,
      p50_duration_ms: p50Duration,
      p95_duration_ms: p95Duration,
      p99_duration_ms: p99Duration,
      common_errors: commonErrors,
      last_execution: executions[0]?.started_at || '',
    };
  }

  /**
   * Recommend best agent for a task type based on historical data
   */
  async recommendAgent(
    taskType: TaskType,
    workspaceId: string,
    options: {
      timeWindowDays?: number;
      minExecutions?: number;
      preferSpeed?: boolean;
      preferReliability?: boolean;
    } = {}
  ): Promise<AgentRecommendation[]> {
    const {
      timeWindowDays = 30,
      minExecutions = 5,
      preferSpeed = false,
      preferReliability = true,
    } = options;

    const agents: AgentId[] = [
      'orchestrator',
      'email-agent',
      'content-agent',
      'frontend',
      'backend',
      'seo',
      'founder-os',
    ];

    const recommendations: AgentRecommendation[] = [];

    for (const agentId of agents) {
      const stats = await this.getExecutionStats(agentId, taskType, workspaceId, timeWindowDays);

      if (!stats || stats.total_executions < minExecutions) {
        continue;
      }

      // Calculate confidence score
      let confidence = 0;

      // Success rate component (0-50 points)
      confidence += stats.success_rate * 50;

      // Execution count component (0-20 points)
      const executionScore = Math.min(stats.total_executions / 100, 1) * 20;
      confidence += executionScore;

      // Speed component (0-15 points)
      if (preferSpeed) {
        const speedScore = Math.max(0, 1 - stats.avg_duration_ms / 10000) * 15;
        confidence += speedScore;
      }

      // Reliability component (0-15 points)
      if (preferReliability) {
        const recentSuccess = stats.success_rate > 0.95 ? 15 : stats.success_rate * 15;
        confidence += recentSuccess;
      }

      // Determine reason
      let reason = '';
      if (stats.success_rate >= 0.95) {
        reason = `High success rate (${(stats.success_rate * 100).toFixed(1)}%)`;
      } else if (stats.avg_duration_ms < 1000) {
        reason = `Fast execution (~${Math.round(stats.avg_duration_ms)}ms avg)`;
      } else if (stats.total_executions > 50) {
        reason = `Extensive experience (${stats.total_executions} executions)`;
      } else {
        reason = `Moderate performance (${(stats.success_rate * 100).toFixed(1)}% success)`;
      }

      recommendations.push({
        agent_id: agentId,
        confidence: Math.min(confidence, 100),
        reason,
        historical_success_rate: stats.success_rate,
        avg_duration_ms: stats.avg_duration_ms,
        recent_executions: stats.total_executions,
      });
    }

    // Sort by confidence
    recommendations.sort((a, b) => b.confidence - a.confidence);

    return recommendations;
  }

  /**
   * Get execution history for analysis
   */
  async getExecutionHistory(
    workspaceId: string,
    filters: {
      agentId?: AgentId;
      taskType?: TaskType;
      success?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ExecutionRecord[]> {
    const supabase = await createClient();

    let query = supabase
      .from('execution_history')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false });

    if (filters.agentId) {
      query = query.eq('agent_id', filters.agentId);
    }

    if (filters.taskType) {
      query = query.eq('task_type', filters.taskType);
    }

    if (filters.success !== undefined) {
      query = query.eq('success', filters.success);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ExecutionFeedback] Failed to get execution history:', error);
      return [];
    }

    return (data as ExecutionRecord[]) || [];
  }

  /**
   * Identify error patterns across executions
   */
  async identifyErrorPatterns(
    workspaceId: string,
    timeWindowDays: number = 7
  ): Promise<Array<{ pattern: string; count: number; agents: AgentId[]; example_message: string }>> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - timeWindowDays);

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('execution_history')
      .select('agent_id, error_type, error_message')
      .eq('workspace_id', workspaceId)
      .eq('success', false)
      .gte('started_at', sinceDate.toISOString());

    if (error || !data) {
      return [];
    }

    // Group by error type
    const errorGroups: Record<
      string,
      { count: number; agents: Set<AgentId>; examples: string[] }
    > = {};

    data.forEach((record) => {
      const errorType = record.error_type || 'unknown';

      if (!errorGroups[errorType]) {
        errorGroups[errorType] = {
          count: 0,
          agents: new Set(),
          examples: [],
        };
      }

      errorGroups[errorType].count++;
      errorGroups[errorType].agents.add(record.agent_id);

      if (errorGroups[errorType].examples.length < 3 && record.error_message) {
        errorGroups[errorType].examples.push(record.error_message);
      }
    });

    // Convert to array and sort by count
    const patterns = Object.entries(errorGroups)
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        agents: Array.from(data.agents),
        example_message: data.examples[0] || '',
      }))
      .sort((a, b) => b.count - a.count);

    return patterns;
  }
}

// Singleton instance
export const executionFeedback = new ExecutionFeedbackLoop();

// Export types and classes
export type { ExecutionTracker };
export { ExecutionFeedbackLoop };
