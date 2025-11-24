/**
 * AMPE Orchestrator Service
 * Phase 85: Top-level coordinator for safe publishing
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  PostingAttempt,
  PostingContext,
  PostingEngineConfig,
  OrchestrationSchedule,
  ChannelState,
  PostingEngineOverview,
} from './postingTypes';
import { runSafetyChecks, isPublishAllowed } from './postingSafetyService';
import { execute } from './postingExecutionService';

/**
 * Process a single schedule for posting
 */
export async function processSchedule(
  scheduleId: string
): Promise<PostingAttempt> {
  const supabase = await getSupabaseServer();

  // Load schedule
  const { data: schedule, error } = await supabase
    .from('campaign_orchestration_schedules')
    .select('*')
    .eq('id', scheduleId)
    .single();

  if (error || !schedule) {
    throw new Error(`Schedule not found: ${scheduleId}`);
  }

  // Build context
  const context = await buildPostingContext(schedule);

  // Apply safety cage
  const safetyResults = await runSafetyChecks(context);

  // Execute posting
  const attempt = await execute(context, safetyResults);

  return attempt;
}

/**
 * Build complete posting context for a schedule
 */
export async function buildPostingContext(
  schedule: OrchestrationSchedule
): Promise<PostingContext> {
  const supabase = await getSupabaseServer();

  // Get config
  const config = await getPostingEngineConfig(schedule.workspace_id);

  // Get channel state
  const { data: channelState } = await supabase
    .from('channel_state')
    .select('*')
    .eq('client_id', schedule.client_id)
    .eq('channel', schedule.channel)
    .single();

  // Get early warnings
  const { data: earlyWarnings } = await supabase
    .from('early_warning_events')
    .select('id, severity, type, message')
    .eq('client_id', schedule.client_id)
    .eq('status', 'active')
    .limit(10);

  return {
    schedule,
    config,
    channelState: channelState || undefined,
    earlyWarnings: earlyWarnings || [],
  };
}

/**
 * Get posting engine configuration
 */
export async function getPostingEngineConfig(
  workspaceId: string
): Promise<PostingEngineConfig> {
  const supabase = await getSupabaseServer();

  // Try workspace-specific config first
  const { data: workspaceConfig } = await supabase
    .from('posting_engine_config')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  if (workspaceConfig) {
    return workspaceConfig;
  }

  // Fall back to global config
  const { data: globalConfig } = await supabase
    .from('posting_engine_config')
    .select('*')
    .is('workspace_id', null)
    .single();

  if (globalConfig) {
    return globalConfig;
  }

  // Default config
  return {
    id: 'default',
    engine_enabled: true,
    draft_mode_only: true,
    auto_publish_low_risk: false,
    require_approval_medium: true,
    require_approval_high: true,
    min_confidence_score: 0.6,
    max_fatigue_score: 0.8,
    block_during_warnings: true,
    max_posts_per_hour: 10,
    max_posts_per_day: 50,
    metadata: {},
  };
}

/**
 * Update posting engine configuration
 */
export async function updatePostingEngineConfig(
  workspaceId: string,
  updates: Partial<PostingEngineConfig>,
  userId?: string
): Promise<PostingEngineConfig> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('posting_engine_config')
    .upsert({
      workspace_id: workspaceId,
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update config: ${error.message}`);
  }

  return data;
}

/**
 * Get posting engine overview for dashboard
 */
export async function getPostingEngineOverview(
  workspaceId: string
): Promise<PostingEngineOverview> {
  const supabase = await getSupabaseServer();

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get attempt counts
  const { data: attempts } = await supabase
    .from('posting_attempts')
    .select('status, confidence_score')
    .eq('workspace_id', workspaceId)
    .gte('attempted_at', dayAgo);

  const attemptsList = attempts || [];

  // Count by status
  const published = attemptsList.filter(a => a.status === 'published').length;
  const drafts = attemptsList.filter(a => a.status === 'draft_created').length;
  const blocked = attemptsList.filter(a => a.status === 'blocked').length;
  const failed = attemptsList.filter(a => a.status === 'failed').length;

  // Calculate average confidence
  const avgConfidence = attemptsList.length > 0
    ? attemptsList.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / attemptsList.length
    : 0;

  // Get active channels
  const { data: tokens } = await supabase
    .from('channel_tokens')
    .select('channels_connected')
    .eq('workspace_id', workspaceId);

  const allChannels = new Set<string>();
  tokens?.forEach(t => t.channels_connected?.forEach((c: string) => allChannels.add(c)));

  // Get config
  const config = await getPostingEngineConfig(workspaceId);

  return {
    total_attempts: attemptsList.length,
    published_count: published,
    draft_count: drafts,
    blocked_count: blocked,
    failed_count: failed,
    channels_active: allChannels.size,
    avg_confidence: Math.round(avgConfidence * 100) / 100,
    engine_enabled: config.engine_enabled,
    draft_mode: config.draft_mode_only,
  };
}

/**
 * Enable/disable posting engine globally
 */
export async function setEngineEnabled(
  workspaceId: string,
  enabled: boolean,
  userId?: string
): Promise<void> {
  await updatePostingEngineConfig(workspaceId, { engine_enabled: enabled }, userId);
}

/**
 * Set draft mode
 */
export async function setDraftMode(
  workspaceId: string,
  draftMode: boolean,
  userId?: string
): Promise<void> {
  await updatePostingEngineConfig(workspaceId, { draft_mode_only: draftMode }, userId);
}

/**
 * Get channel token status for a client
 */
export async function getChannelTokenStatus(
  clientId: string
): Promise<{
  connected: string[];
  errors: Record<string, string>;
  lastValidated?: string;
}> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('channel_tokens')
    .select('channels_connected, validation_errors, last_validated_at')
    .eq('client_id', clientId)
    .single();

  return {
    connected: data?.channels_connected || [],
    errors: data?.validation_errors || {},
    lastValidated: data?.last_validated_at,
  };
}

/**
 * Handoff schedule to channel adapter (used by scheduler)
 */
export async function handoffToChannelAdapter(
  schedule: OrchestrationSchedule
): Promise<PostingAttempt> {
  return processSchedule(schedule.id);
}
