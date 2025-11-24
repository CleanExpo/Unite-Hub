/**
 * AMPE Execution Service
 * Phase 85: Executes posting attempts and records outcomes
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  PostingAttempt,
  PostingContext,
  PostingPayload,
  PostingResult,
  SafetyCheckResults,
  Channel,
} from './postingTypes';
import { publishToChannel } from './postingChannelAdapterService';

/**
 * Execute a posting attempt
 */
export async function execute(
  context: PostingContext,
  safetyResults: SafetyCheckResults
): Promise<PostingAttempt> {
  const { schedule, config } = context;
  const supabase = await getSupabaseServer();

  // Create the attempt record
  const attempt = await createPostingAttempt(
    schedule.id,
    schedule.client_id,
    schedule.workspace_id,
    schedule.channel,
    safetyResults
  );

  // If safety checks failed, mark as blocked
  if (!safetyResults.all_passed) {
    return await updateAttemptStatus(
      attempt.id,
      'blocked',
      undefined,
      safetyResults.blocked_by || 'Safety check failed'
    );
  }

  // Build posting payload from schedule
  const payload = buildPostingPayload(schedule);

  // Get channel credentials
  const credentials = await getChannelCredentials(schedule.client_id, schedule.channel);

  // Execute the posting
  const result = await publishToChannel(
    schedule.channel,
    payload,
    credentials,
    config.draft_mode_only
  );

  // Update attempt with result
  const updatedAttempt = await updateAttemptStatus(
    attempt.id,
    result.status,
    result,
    result.error_message
  );

  // Log the action
  await logPostingAction(context, updatedAttempt, result);

  return updatedAttempt;
}

/**
 * Create a new posting attempt record
 */
async function createPostingAttempt(
  scheduleId: string,
  clientId: string,
  workspaceId: string,
  channel: Channel,
  safetyResults: SafetyCheckResults
): Promise<PostingAttempt> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('posting_attempts')
    .insert({
      schedule_id: scheduleId,
      client_id: clientId,
      workspace_id: workspaceId,
      channel,
      status: 'pending',
      safety_checks: safetyResults,
      confidence_score: calculateOverallConfidence(safetyResults),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create posting attempt: ${error.message}`);
  }

  return data;
}

/**
 * Update posting attempt status
 */
async function updateAttemptStatus(
  attemptId: string,
  status: string,
  result?: PostingResult,
  errorMessage?: string
): Promise<PostingAttempt> {
  const supabase = await getSupabaseServer();

  const updateData: Record<string, unknown> = {
    status,
    completed_at: new Date().toISOString(),
  };

  if (result) {
    updateData.platform_response = result.platform_response;
    updateData.platform_post_id = result.platform_post_id;
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { data, error } = await supabase
    .from('posting_attempts')
    .update(updateData)
    .eq('id', attemptId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update posting attempt: ${error.message}`);
  }

  return data;
}

/**
 * Build posting payload from schedule
 */
function buildPostingPayload(schedule: any): PostingPayload {
  const preview = schedule.content_preview || {};

  return {
    content: preview.text || preview.content || '',
    media_urls: preview.media_urls || [],
    link: preview.link,
    hashtags: preview.hashtags || [],
    mentions: preview.mentions || [],
    scheduled_time: schedule.scheduled_for,
    metadata: {
      schedule_id: schedule.id,
      priority: schedule.priority,
      risk_level: schedule.risk_level,
    },
  };
}

/**
 * Get channel credentials for a client
 */
async function getChannelCredentials(
  clientId: string,
  channel: Channel
): Promise<any | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('channel_tokens')
    .select('tokens')
    .eq('client_id', clientId)
    .single();

  if (!data?.tokens) {
    return null;
  }

  return data.tokens[channel] || null;
}

/**
 * Calculate overall confidence from safety checks
 */
function calculateOverallConfidence(safetyResults: SafetyCheckResults): number {
  const passedChecks = safetyResults.checks.filter(c => c.passed).length;
  const totalChecks = safetyResults.checks.length;

  if (totalChecks === 0) return 0.5;

  return Math.round((passedChecks / totalChecks) * 100) / 100;
}

/**
 * Log posting action to orchestration actions
 */
async function logPostingAction(
  context: PostingContext,
  attempt: PostingAttempt,
  result: PostingResult
): Promise<void> {
  const supabase = await getSupabaseServer();

  const actionType = result.success
    ? attempt.status === 'draft_created'
      ? 'schedule_executed'
      : 'schedule_executed'
    : 'schedule_failed';

  await supabase.from('campaign_orchestration_actions').insert({
    schedule_id: context.schedule.id,
    client_id: context.schedule.client_id,
    workspace_id: context.schedule.workspace_id,
    action_type: actionType,
    decision_payload: {
      attempt_id: attempt.id,
      status: attempt.status,
      platform_post_id: result.platform_post_id,
    },
    source_signals: {
      safety_checks: attempt.safety_checks,
      config: {
        draft_mode: context.config.draft_mode_only,
        engine_enabled: context.config.engine_enabled,
      },
    },
    risk_class: context.schedule.risk_level,
    confidence_score: attempt.confidence_score,
    truth_notes: generateTruthNotes(context, result),
    status: result.success ? 'accepted' : 'rejected',
    executed_at: new Date().toISOString(),
    execution_result: result.platform_response,
  });
}

/**
 * Generate truth notes for the posting attempt
 */
function generateTruthNotes(
  context: PostingContext,
  result: PostingResult
): string {
  const notes: string[] = [];

  if (context.config.draft_mode_only) {
    notes.push('Phase 85: Draft mode - actual publishing disabled.');
  }

  if (result.success) {
    if (result.status === 'draft_created') {
      notes.push(`Draft created for ${context.schedule.channel.toUpperCase()}.`);
    } else {
      notes.push(`Published to ${context.schedule.channel.toUpperCase()}.`);
    }
  } else {
    notes.push(`Failed: ${result.error_message || 'Unknown error'}.`);
  }

  const confidence = context.schedule.metadata?.confidence_score as number;
  if (confidence && confidence < 0.7) {
    notes.push(`Low confidence (${(confidence * 100).toFixed(0)}%) - results may vary.`);
  }

  return notes.join(' ');
}

/**
 * Record a posting attempt (external API)
 */
export async function recordPostingAttempt(
  scheduleId: string,
  clientId: string,
  workspaceId: string,
  channel: Channel,
  status: string,
  safetyChecks: SafetyCheckResults,
  result?: PostingResult
): Promise<PostingAttempt> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('posting_attempts')
    .insert({
      schedule_id: scheduleId,
      client_id: clientId,
      workspace_id: workspaceId,
      channel,
      status,
      safety_checks: safetyChecks,
      platform_response: result?.platform_response,
      platform_post_id: result?.platform_post_id,
      error_message: result?.error_message,
      confidence_score: calculateOverallConfidence(safetyChecks),
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to record posting attempt: ${error.message}`);
  }

  return data;
}

/**
 * Get posting attempts for a schedule
 */
export async function getScheduleAttempts(scheduleId: string): Promise<PostingAttempt[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('posting_attempts')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('attempted_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get schedule attempts: ${error.message}`);
  }

  return data || [];
}

/**
 * Get recent posting attempts for a workspace
 */
export async function getRecentAttempts(
  workspaceId: string,
  limit: number = 50
): Promise<PostingAttempt[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('posting_attempts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('attempted_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get recent attempts: ${error.message}`);
  }

  return data || [];
}
