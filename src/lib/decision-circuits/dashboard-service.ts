/**
 * Decision Circuits Dashboard Service
 * Read-only data fetching for observability and executive dashboards
 * All queries respect RLS and workspace isolation
 */

import { createClient } from '@/lib/supabase/server';

/**
 * System-level health and autonomy status
 */
export interface SystemHealthStatus {
  overall_success_rate: number;
  active_circuit_versions: number;
  health_check_pass_rate: number;
  rollback_count_30d: number;
  total_executions_30d: number;
  autonomy_lock_status: 'active' | 'inactive';
}

/**
 * Agent-level performance metrics
 */
export interface AgentPerformanceMetrics {
  email_send_success_rate: number;
  social_publish_success_rate: number;
  multichannel_completion_rate: number;
  avg_retries_per_agent: number;
  suppression_blocks: number;
}

/**
 * Circuit execution record for audit trail
 */
export interface CircuitExecutionRecord {
  id: string;
  execution_id: string;
  circuit_id: string;
  success: boolean;
  started_at: string;
  completed_at: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error_message?: string;
}

/**
 * Agent execution record
 */
export interface AgentExecutionRecord {
  id: string;
  circuit_execution_id: string;
  agent_type: 'email' | 'social' | 'multichannel';
  success: boolean;
  started_at: string;
  completed_at?: string;
  failure_reason?: string;
  metrics?: Record<string, unknown>;
}

/**
 * Health check record
 */
export interface HealthCheckRecord {
  id: string;
  check_name: string;
  status: 'pass' | 'fail';
  checked_at: string;
  violation?: string;
  remediation?: string;
}

/**
 * Release state record
 */
export interface ReleaseStateRecord {
  id: string;
  version: string;
  status: 'draft' | 'canary' | 'active' | 'rolled_back';
  current_phase: string;
  phase_progress: number;
  started_at: string;
  completed_at?: string;
  rollback_reason?: string;
}

/**
 * Get system-level health and autonomy status
 */
export async function getSystemHealthStatus(
  workspaceId: string
): Promise<SystemHealthStatus> {
  const supabase = await createClient();

  try {
    // Get circuit execution success rate (last 30 days)
    const { data: executionStats, error: executionError } = await supabase
      .from('circuit_execution_logs')
      .select('success')
      .eq('workspace_id', workspaceId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (executionError) {
      console.warn('Failed to fetch execution stats:', executionError);
    }

    const totalExecutions = executionStats?.length || 0;
    const successfulExecutions = executionStats?.filter((e) => e.success).length || 0;
    const overallSuccessRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    // Get active circuit versions
    const { data: versions, error: versionsError } = await supabase
      .from('circuit_release_state')
      .select('version')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    if (versionsError) {
      console.warn('Failed to fetch versions:', versionsError);
    }

    const activeVersions = versions?.length || 0;

    // Get health check pass rate
    const { data: healthChecks, error: healthError } = await supabase
      .from('circuit_health_checks')
      .select('status')
      .eq('workspace_id', workspaceId)
      .gte('checked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (healthError) {
      console.warn('Failed to fetch health checks:', healthError);
    }

    const totalHealthChecks = healthChecks?.length || 0;
    const passedHealthChecks = healthChecks?.filter((h) => h.status === 'pass').length || 0;
    const healthCheckPassRate = totalHealthChecks > 0 ? (passedHealthChecks / totalHealthChecks) * 100 : 0;

    // Get rollback count (30 days)
    const { data: rollbacks, error: rollbackError } = await supabase
      .from('circuit_rollback_events')
      .select('id')
      .eq('workspace_id', workspaceId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (rollbackError) {
      console.warn('Failed to fetch rollbacks:', rollbackError);
    }

    const rollbackCount = rollbacks?.length || 0;

    return {
      overall_success_rate: Math.round(overallSuccessRate * 100) / 100,
      active_circuit_versions: activeVersions,
      health_check_pass_rate: Math.round(healthCheckPassRate * 100) / 100,
      rollback_count_30d: rollbackCount,
      total_executions_30d: totalExecutions,
      autonomy_lock_status: 'active', // TODO: Read from circuit_enforcement table
    };
  } catch (error) {
    console.error('Failed to get system health status:', error);
    throw error;
  }
}

/**
 * Get agent-level performance metrics
 */
export async function getAgentPerformanceMetrics(
  workspaceId: string
): Promise<AgentPerformanceMetrics> {
  const supabase = await createClient();

  try {
    // Email agent success rate
    const { data: emailExecutions, error: emailError } = await supabase
      .from('email_agent_executions')
      .select('sent')
      .eq('workspace_id', workspaceId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (emailError) {
      console.warn('Failed to fetch email executions:', emailError);
    }

    const totalEmailExecutions = emailExecutions?.length || 0;
    const sentEmails = emailExecutions?.filter((e) => e.sent).length || 0;
    const emailSuccessRate = totalEmailExecutions > 0 ? (sentEmails / totalEmailExecutions) * 100 : 0;

    // Social agent success rate
    const { data: socialExecutions, error: socialError } = await supabase
      .from('social_agent_executions')
      .select('published')
      .eq('workspace_id', workspaceId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (socialError) {
      console.warn('Failed to fetch social executions:', socialError);
    }

    const totalSocialExecutions = socialExecutions?.length || 0;
    const publishedPosts = socialExecutions?.filter((e) => e.published).length || 0;
    const socialSuccessRate = totalSocialExecutions > 0 ? (publishedPosts / totalSocialExecutions) * 100 : 0;

    // Multichannel completion rate
    const { data: multichannelingExecutions, error: multichannelingError } = await supabase
      .from('multichannel_executions')
      .select('execution_status')
      .eq('workspace_id', workspaceId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (multichannelingError) {
      console.warn('Failed to fetch multichannel executions:', multichannelingError);
    }

    const totalMultichannelExecutions = multichannelingExecutions?.length || 0;
    const completedMultichannel =
      multichannelingExecutions?.filter((e) => e.execution_status === 'completed').length || 0;
    const multichanelCompletionRate =
      totalMultichannelExecutions > 0
        ? (completedMultichannel / totalMultichannelExecutions) * 100
        : 0;

    // Average retries (from email executions)
    const { data: retryData, error: retryError } = await supabase
      .from('email_agent_executions')
      .select('retry_count')
      .eq('workspace_id', workspaceId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (retryError) {
      console.warn('Failed to fetch retry data:', retryError);
    }

    const totalRetries = retryData?.reduce((sum, r) => sum + (r.retry_count || 0), 0) || 0;
    const avgRetries = totalRetries > 0 ? totalRetries / Math.max(retryData?.length || 1, 1) : 0;

    // Suppression blocks
    const { data: suppressionData, error: suppressionError } = await supabase
      .from('email_suppression_list')
      .select('id')
      .eq('workspace_id', workspaceId);

    if (suppressionError) {
      console.warn('Failed to fetch suppression data:', suppressionError);
    }

    const suppressionBlocks = suppressionData?.length || 0;

    return {
      email_send_success_rate: Math.round(emailSuccessRate * 100) / 100,
      social_publish_success_rate: Math.round(socialSuccessRate * 100) / 100,
      multichannel_completion_rate: Math.round(multichanelCompletionRate * 100) / 100,
      avg_retries_per_agent: Math.round(avgRetries * 100) / 100,
      suppression_blocks: suppressionBlocks,
    };
  } catch (error) {
    console.error('Failed to get agent performance metrics:', error);
    throw error;
  }
}

/**
 * Get recent circuit executions for audit trail
 */
export async function getRecentCircuitExecutions(
  workspaceId: string,
  limit: number = 50
): Promise<CircuitExecutionRecord[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('circuit_execution_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (
      data?.map((record) => ({
        id: record.id,
        execution_id: record.execution_id,
        circuit_id: record.circuit_id,
        success: record.success,
        started_at: record.created_at,
        completed_at: record.updated_at,
        inputs: record.inputs,
        outputs: record.outputs,
        error_message: record.error_message,
      })) || []
    );
  } catch (error) {
    console.error('Failed to get circuit executions:', error);
    throw error;
  }
}

/**
 * Get recent agent executions
 */
export async function getRecentAgentExecutions(
  workspaceId: string,
  agentType: 'email' | 'social' | 'multichannel' = 'email',
  limit: number = 50
): Promise<AgentExecutionRecord[]> {
  const supabase = await createClient();

  try {
    if (agentType === 'email') {
      const { data, error } = await supabase
        .from('email_agent_executions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
throw error;
}

      return (
        data?.map((record) => ({
          id: record.id,
          circuit_execution_id: record.circuit_execution_id,
          agent_type: 'email' as const,
          success: record.sent,
          started_at: record.created_at,
          completed_at: record.sent_at,
          failure_reason: record.last_error,
          metrics: {
            provider: record.provider,
            retry_count: record.retry_count,
            provider_message_id: record.provider_message_id,
          },
        })) || []
      );
    } else if (agentType === 'social') {
      const { data, error } = await supabase
        .from('social_agent_executions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
throw error;
}

      return (
        data?.map((record) => ({
          id: record.id,
          circuit_execution_id: record.circuit_execution_id,
          agent_type: 'social' as const,
          success: record.published,
          started_at: record.created_at,
          completed_at: record.published_at,
          failure_reason: record.last_error,
          metrics: {
            platform: record.platform,
            retry_count: record.retry_count,
            platform_post_id: record.platform_post_id,
          },
        })) || []
      );
    } else {
      // multichannel
      const { data, error } = await supabase
        .from('multichannel_executions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
throw error;
}

      return (
        data?.map((record) => ({
          id: record.id,
          circuit_execution_id: record.circuit_execution_id,
          agent_type: 'multichannel' as const,
          success: record.execution_status === 'completed',
          started_at: record.started_at,
          completed_at: record.completed_at,
          failure_reason: record.failure_reason,
          metrics: {
            flow_id: record.flow_id,
            agent_sequence: record.agent_sequence,
          },
        })) || []
      );
    }
  } catch (error) {
    console.error(`Failed to get ${agentType} agent executions:`, error);
    throw error;
  }
}

/**
 * Get recent health checks
 */
export async function getRecentHealthChecks(
  workspaceId: string,
  limit: number = 50
): Promise<HealthCheckRecord[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('circuit_health_checks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('checked_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (
      data?.map((record) => ({
        id: record.id,
        check_name: record.check_name,
        status: record.status,
        checked_at: record.checked_at,
        violation: record.violation,
        remediation: record.remediation,
      })) || []
    );
  } catch (error) {
    console.error('Failed to get health checks:', error);
    throw error;
  }
}

/**
 * Get release state and history
 */
export async function getReleaseState(
  workspaceId: string,
  limit: number = 20
): Promise<ReleaseStateRecord[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('circuit_release_state')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (
      data?.map((record) => ({
        id: record.id,
        version: record.version,
        status: record.status,
        current_phase: record.current_phase,
        phase_progress: record.phase_progress || 0,
        started_at: record.started_at,
        completed_at: record.completed_at,
        rollback_reason: record.rollback_reason,
      })) || []
    );
  } catch (error) {
    console.error('Failed to get release state:', error);
    throw error;
  }
}
