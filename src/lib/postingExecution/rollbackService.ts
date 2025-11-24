/**
 * Rollback Service
 * Phase 87: Post removal/retraction capability
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  RollbackResult,
  RollbackInput,
  RollbackStatus,
  PostingChannel,
} from './postingExecutionTypes';
import { getExecutionById } from './executionService';

/**
 * Initiate rollback for an execution
 */
export async function initiateRollback(input: RollbackInput): Promise<RollbackResult> {
  const supabase = await getSupabaseServer();

  // Get execution
  const execution = await getExecutionById(input.executionId);

  if (!execution) {
    throw new Error('Execution not found');
  }

  if (execution.status !== 'success') {
    throw new Error('Can only rollback successful executions');
  }

  if (!execution.externalPostId) {
    throw new Error('No external post ID to rollback');
  }

  // Create rollback record
  const { data: rollback, error: createError } = await supabase
    .from('rollback_log')
    .insert({
      execution_id: input.executionId,
      channel: execution.channel,
      external_post_id: execution.externalPostId,
      status: 'pending',
      requested_by: input.requestedBy,
      reason: input.reason,
      metadata: {
        original_url: execution.externalUrl,
        initiated_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (createError || !rollback) {
    throw new Error(`Failed to create rollback: ${createError?.message}`);
  }

  // Attempt rollback
  try {
    const result = await executeRollbackOnChannel(
      execution.channel,
      execution.externalPostId,
      execution.workspaceId
    );

    // Update rollback record
    const status: RollbackStatus = result.success ? 'success' :
      (result.notSupported ? 'not_supported' : 'failed');

    const { data: updated, error: updateError } = await supabase
      .from('rollback_log')
      .update({
        status,
        attempted_at: new Date().toISOString(),
        completed_at: result.success ? new Date().toISOString() : null,
        platform_response: result.platformResponse,
        error_message: result.error,
      })
      .eq('id', rollback.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update rollback:', updateError);
    }

    return mapToRollbackResult(updated || rollback);

  } catch (error: any) {
    // Update as failed
    await supabase
      .from('rollback_log')
      .update({
        status: 'failed',
        attempted_at: new Date().toISOString(),
        error_message: error.message,
      })
      .eq('id', rollback.id);

    return {
      ...mapToRollbackResult(rollback),
      status: 'failed',
      errorMessage: error.message,
    };
  }
}

/**
 * Get rollback by ID
 */
export async function getRollbackById(rollbackId: string): Promise<RollbackResult | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('rollback_log')
    .select('*')
    .eq('id', rollbackId)
    .single();

  if (error || !data) return null;

  return mapToRollbackResult(data);
}

/**
 * List rollbacks for workspace
 */
export async function listRollbacks(
  workspaceId: string,
  options?: {
    status?: RollbackStatus;
    limit?: number;
  }
): Promise<RollbackResult[]> {
  const supabase = await getSupabaseServer();

  // Need to join through executions to get workspace
  let query = supabase
    .from('rollback_log')
    .select(`
      *,
      posting_executions!inner (workspace_id)
    `)
    .eq('posting_executions.workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to list rollbacks:', error);
    return [];
  }

  return (data || []).map(mapToRollbackResult);
}

/**
 * Execute rollback on specific channel
 */
async function executeRollbackOnChannel(
  channel: PostingChannel,
  postId: string,
  workspaceId: string
): Promise<{
  success: boolean;
  notSupported?: boolean;
  error?: string;
  platformResponse?: any;
}> {
  // Get credentials
  const supabase = await getSupabaseServer();
  const { data: credentials } = await supabase
    .from('channel_tokens')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('channel', channel)
    .eq('is_active', true)
    .single();

  // Demo mode
  if (!credentials || credentials.metadata?.demo) {
    return {
      success: true,
      platformResponse: {
        demo: true,
        message: 'Demo rollback successful',
        post_id: postId,
      },
    };
  }

  // Channel-specific rollback logic
  switch (channel) {
    case 'fb':
      return rollbackFacebook(postId, credentials.access_token);

    case 'ig':
      // Instagram doesn't support programmatic deletion
      return {
        success: false,
        notSupported: true,
        error: 'Instagram does not support programmatic post deletion',
      };

    case 'linkedin':
      return rollbackLinkedIn(postId, credentials.access_token);

    case 'x':
      return rollbackX(postId, credentials.access_token);

    case 'reddit':
      return rollbackReddit(postId, credentials.access_token);

    case 'tiktok':
      // TikTok doesn't support programmatic deletion
      return {
        success: false,
        notSupported: true,
        error: 'TikTok does not support programmatic post deletion',
      };

    case 'youtube':
      return rollbackYouTube(postId, credentials.access_token);

    case 'gmb':
      return rollbackGMB(postId, credentials.access_token);

    case 'email':
      // Email cannot be rolled back
      return {
        success: false,
        notSupported: true,
        error: 'Emails cannot be recalled once sent',
      };

    default:
      return {
        success: false,
        error: `Unknown channel: ${channel}`,
      };
  }
}

// Facebook rollback
async function rollbackFacebook(
  postId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string; platformResponse?: any }> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${postId}?access_token=${accessToken}`,
      { method: 'DELETE' }
    );

    const data = await response.json();

    if (data.success) {
      return { success: true, platformResponse: data };
    }

    return {
      success: false,
      error: data.error?.message || 'Delete failed',
      platformResponse: data,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// LinkedIn rollback
async function rollbackLinkedIn(
  postId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string; platformResponse?: any }> {
  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/ugcPosts/${postId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();
    return {
      success: false,
      error: data.message || 'Delete failed',
      platformResponse: data,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// X (Twitter) rollback
async function rollbackX(
  postId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string; platformResponse?: any }> {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/${postId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (data.data?.deleted) {
      return { success: true, platformResponse: data };
    }

    return {
      success: false,
      error: data.errors?.[0]?.message || 'Delete failed',
      platformResponse: data,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Reddit rollback
async function rollbackReddit(
  postId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string; platformResponse?: any }> {
  try {
    const response = await fetch(
      'https://oauth.reddit.com/api/del',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `id=t3_${postId}`,
      }
    );

    if (response.status === 200) {
      return { success: true };
    }

    const data = await response.json();
    return {
      success: false,
      error: 'Delete failed',
      platformResponse: data,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// YouTube rollback
async function rollbackYouTube(
  videoId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string; platformResponse?: any }> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();
    return {
      success: false,
      error: data.error?.message || 'Delete failed',
      platformResponse: data,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Google My Business rollback
async function rollbackGMB(
  postName: string,
  accessToken: string
): Promise<{ success: boolean; error?: string; platformResponse?: any }> {
  try {
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/${postName}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 200 || response.status === 204) {
      return { success: true };
    }

    const data = await response.json();
    return {
      success: false,
      error: data.error?.message || 'Delete failed',
      platformResponse: data,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Helper
function mapToRollbackResult(row: any): RollbackResult {
  return {
    id: row.id,
    executionId: row.execution_id,
    channel: row.channel,
    externalPostId: row.external_post_id,
    rollbackPayload: row.rollback_payload,
    status: row.status,
    attemptedAt: row.attempted_at,
    completedAt: row.completed_at,
    platformResponse: row.platform_response,
    errorMessage: row.error_message,
    requestedBy: row.requested_by,
    reason: row.reason,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}
