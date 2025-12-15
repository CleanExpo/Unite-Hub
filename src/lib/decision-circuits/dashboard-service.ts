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
 * A/B test record with latest decision
 */
export interface ABTestRecord {
  id: string;
  test_id: string;
  test_name: string;
  channel: 'email' | 'social' | 'multichannel';
  status: 'running' | 'paused' | 'completed' | 'terminated';
  variant_count: number;
  total_samples: number;
  avg_engagement_rate: number;
  max_engagement_rate: number;
  started_at: string;
  evaluation_window_end_at?: string;
  latest_decision?: 'promote' | 'continue_test' | 'terminate';
  latest_confidence_score?: number;
  latest_performance_delta?: number;
}

/**
 * A/B test variant result
 */
export interface ABTestVariantResult {
  variant_id: string;
  agent_execution_id: string;
  engagement_rate: number;
  click_through_rate: number;
  sample_size: number;
  evaluated_at: string;
}

/**
 * A/B test evaluation history
 */
export interface ABTestEvaluation {
  id: string;
  winning_variant_id: string;
  decision: 'promote' | 'continue_test' | 'terminate';
  confidence_score: number;
  performance_delta: number;
  evaluated_at: string;
  recommendation?: string;
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

/**
 * Get all A/B tests for a workspace
 */
export async function getABTests(
  workspaceId: string,
  limit: number = 50
): Promise<ABTestRecord[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('circuit_ab_test_summary')
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
        test_id: record.test_id,
        test_name: record.test_name,
        channel: record.channel,
        status: record.status,
        variant_count: record.variant_count || 0,
        total_samples: record.total_samples || 0,
        avg_engagement_rate: record.avg_engagement_rate || 0,
        max_engagement_rate: record.max_engagement_rate || 0,
        started_at: record.started_at,
        evaluation_window_end_at: record.evaluation_window_end_at,
      })) || []
    );
  } catch (error) {
    console.error('Failed to get A/B tests:', error);
    throw error;
  }
}

/**
 * Get detailed A/B test information including variants and latest decision
 */
export async function getABTestDetails(
  workspaceId: string,
  testId: string
): Promise<{
  test: ABTestRecord;
  variants: ABTestVariantResult[];
  evaluations: ABTestEvaluation[];
} | null> {
  const supabase = await createClient();

  try {
    // Get test info
    const { data: testData, error: testError } = await supabase
      .from('circuit_ab_tests')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('test_id', testId)
      .single();

    if (testError || !testData) {
      return null;
    }

    // Get variant results
    const { data: variantData } = await supabase
      .from('circuit_ab_test_results')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('ab_test_id', testData.id)
      .order('evaluated_at', { ascending: false });

    // Get evaluation history
    const { data: evaluationData } = await supabase
      .from('circuit_ab_test_winners')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('ab_test_id', testData.id)
      .order('selected_at', { ascending: false });

    return {
      test: {
        id: testData.id,
        test_id: testData.test_id,
        test_name: testData.test_name,
        channel: testData.channel,
        status: testData.status,
        variant_count: variantData?.length || 0,
        total_samples: variantData?.reduce((sum, v) => sum + (v.sample_size || 0), 0) || 0,
        avg_engagement_rate:
          variantData && variantData.length > 0
            ? variantData.reduce((sum, v) => sum + (v.engagement_rate || 0), 0) / variantData.length
            : 0,
        max_engagement_rate: variantData?.reduce((max, v) => Math.max(max, v.engagement_rate || 0), 0) || 0,
        started_at: testData.started_at,
        evaluation_window_end_at: testData.evaluation_window_end_at,
        latest_decision: evaluationData?.[0]?.decision,
        latest_confidence_score: evaluationData?.[0]?.confidence_score,
        latest_performance_delta: evaluationData?.[0]?.performance_delta,
      },
      variants: (variantData || []).map((v) => ({
        variant_id: v.variant_id,
        agent_execution_id: v.agent_execution_id,
        engagement_rate: v.engagement_rate || 0,
        click_through_rate: v.click_through_rate || 0,
        sample_size: v.sample_size || 0,
        evaluated_at: v.evaluated_at,
      })),
      evaluations: (evaluationData || []).map((e) => ({
        id: e.id,
        winning_variant_id: e.winning_variant_id,
        decision: e.decision,
        confidence_score: e.confidence_score,
        performance_delta: e.performance_delta,
        evaluated_at: e.evaluated_at,
      })),
    };
  } catch (error) {
    console.error(`Failed to get A/B test details for ${testId}:`, error);
    return null;
  }
}
