/**
 * Execution Service
 * Phase 87: Execute posts and record outcomes
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ExecutionResult,
  ExecutePostInput,
  ExecutionStatus,
  ExecutionStats,
  PostingChannel,
} from './postingExecutionTypes';
import { getPreflightById } from './preflightService';
import { executeOnChannel } from './channelExecutionAdapterService';

/**
 * Execute a post after preflight checks
 */
export async function executePost(input: ExecutePostInput): Promise<ExecutionResult> {
  const supabase = await getSupabaseServer();

  // Get preflight data
  const preflight = await getPreflightById(input.preflightId);

  if (!preflight) {
    throw new Error('Preflight not found');
  }

  // Check if execution is allowed (unless forced)
  if (!preflight.passed && !input.force) {
    throw new Error(`Cannot execute: preflight failed - ${preflight.blockReason}`);
  }

  // Create execution record
  const { data: execution, error: createError } = await supabase
    .from('posting_executions')
    .insert({
      preflight_id: input.preflightId,
      schedule_id: preflight.scheduleId,
      client_id: preflight.clientId,
      workspace_id: preflight.workspaceId,
      channel: preflight.channel,
      status: 'pending',
      execution_payload: input.payload,
      forced_by: input.forcedBy,
      force_reason: input.forceReason,
      metadata: {
        forced: !!input.force,
        started_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (createError || !execution) {
    throw new Error(`Failed to create execution: ${createError?.message}`);
  }

  // Execute on channel
  try {
    const result = await executeOnChannel({
      channel: preflight.channel,
      payload: input.payload,
      credentials: await getChannelCredentials(preflight.workspaceId, preflight.channel),
    });

    // Update execution with result
    const status: ExecutionStatus = result.success ? 'success' : 'failed';

    const { data: updated, error: updateError } = await supabase
      .from('posting_executions')
      .update({
        status,
        external_post_id: result.postId,
        external_url: result.url,
        platform_response: result.platformResponse,
        executed_at: new Date().toISOString(),
        error_message: result.error,
        error_code: result.errorCode,
        truth_notes: generateExecutionTruthNotes(preflight, result.success),
      })
      .eq('id', execution.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update execution:', updateError);
    }

    return mapToExecutionResult(updated || execution);

  } catch (error: any) {
    // Update execution as failed
    const { data: failed } = await supabase
      .from('posting_executions')
      .update({
        status: 'failed',
        error_message: error.message,
        error_code: 'EXECUTION_ERROR',
        executed_at: new Date().toISOString(),
      })
      .eq('id', execution.id)
      .select()
      .single();

    return mapToExecutionResult(failed || execution);
  }
}

/**
 * Get execution by ID
 */
export async function getExecutionById(executionId: string): Promise<ExecutionResult | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('posting_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (error || !data) {
return null;
}

  return mapToExecutionResult(data);
}

/**
 * List executions for workspace
 */
export async function listExecutions(
  workspaceId: string,
  options?: {
    clientId?: string;
    channel?: PostingChannel;
    status?: ExecutionStatus;
    limit?: number;
  }
): Promise<ExecutionResult[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('posting_executions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (options?.clientId) {
    query = query.eq('client_id', options.clientId);
  }

  if (options?.channel) {
    query = query.eq('channel', options.channel);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to list executions:', error);
    return [];
  }

  return (data || []).map(mapToExecutionResult);
}

/**
 * Get execution stats for workspace
 */
export async function getExecutionStats(
  workspaceId: string,
  days: number = 7
): Promise<ExecutionStats> {
  const supabase = await getSupabaseServer();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('posting_executions')
    .select('status')
    .eq('workspace_id', workspaceId)
    .gte('created_at', since);

  const executions = data || [];

  return {
    total: executions.length,
    success: executions.filter(e => e.status === 'success').length,
    failed: executions.filter(e => e.status === 'failed').length,
    rolledBack: executions.filter(e => e.status === 'rolled_back').length,
    pending: executions.filter(e => e.status === 'pending').length,
  };
}

/**
 * Retry a failed execution
 */
export async function retryExecution(executionId: string): Promise<ExecutionResult> {
  const supabase = await getSupabaseServer();

  const execution = await getExecutionById(executionId);

  if (!execution) {
    throw new Error('Execution not found');
  }

  if (execution.status !== 'failed') {
    throw new Error('Can only retry failed executions');
  }

  if (execution.retryCount >= 3) {
    throw new Error('Max retries exceeded');
  }

  // Increment retry count
  await supabase
    .from('posting_executions')
    .update({
      retry_count: execution.retryCount + 1,
      status: 'pending',
    })
    .eq('id', executionId);

  // Re-execute
  return executePost({
    preflightId: execution.preflightId,
    payload: execution.executionPayload!,
  });
}

// Helper functions

async function getChannelCredentials(
  workspaceId: string,
  channel: PostingChannel
): Promise<any> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('channel_tokens')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('channel', channel)
    .eq('is_active', true)
    .single();

  if (!data) {
    return {
      accessToken: 'demo-token',
      metadata: { demo: true },
    };
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    pageId: data.page_id,
    accountId: data.account_id,
    metadata: data.metadata,
  };
}

function generateExecutionTruthNotes(preflight: any, success: boolean): string {
  if (success) {
    return `Execution successful. Preflight confidence: ${(preflight.confidenceScore * 100).toFixed(0)}%`;
  }
  return `Execution failed. Preflight confidence was ${(preflight.confidenceScore * 100).toFixed(0)}%`;
}

function mapToExecutionResult(row: any): ExecutionResult {
  return {
    id: row.id,
    preflightId: row.preflight_id,
    scheduleId: row.schedule_id,
    clientId: row.client_id,
    workspaceId: row.workspace_id,
    channel: row.channel,
    status: row.status,
    externalPostId: row.external_post_id,
    externalUrl: row.external_url,
    platformResponse: row.platform_response,
    executionPayload: row.execution_payload,
    executedAt: row.executed_at,
    errorMessage: row.error_message,
    errorCode: row.error_code,
    retryCount: row.retry_count,
    truthNotes: row.truth_notes,
    forcedBy: row.forced_by,
    forceReason: row.force_reason,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}
