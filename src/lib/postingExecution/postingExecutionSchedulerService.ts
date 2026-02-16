/**
 * Posting Execution Scheduler Service
 * Phase 87: Process scheduled posts through preflight and execution
 */

import { getSupabaseServer } from '@/lib/supabase';
import { runPreflight } from './preflightService';
import { executePost } from './executionService';
import { PostingChannel } from './postingExecutionTypes';

interface ScheduleItem {
  id: string;
  client_id: string;
  workspace_id: string;
  channel: string;
  content_markdown: string;
  media_urls: string[];
  scheduled_for: string;
  metadata: Record<string, unknown>;
}

interface ProcessResult {
  scheduleId: string;
  preflightPassed: boolean;
  executed: boolean;
  executionId?: string;
  error?: string;
}

/**
 * Process all due schedules
 */
export async function processDueSchedules(
  workspaceId?: string
): Promise<ProcessResult[]> {
  const supabase = await getSupabaseServer();

  // Get approved schedules that are due
  let query = supabase
    .from('campaign_orchestration_schedules')
    .select('*')
    .eq('status', 'approved')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(50);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data: schedules, error } = await query;

  if (error) {
    console.error('Failed to fetch due schedules:', error);
    return [];
  }

  if (!schedules || schedules.length === 0) {
    return [];
  }

  // Process each schedule
  const results: ProcessResult[] = [];

  for (const schedule of schedules) {
    const result = await processSchedule(schedule);
    results.push(result);
  }

  return results;
}

/**
 * Process a single schedule
 */
async function processSchedule(schedule: ScheduleItem): Promise<ProcessResult> {
  const supabase = await getSupabaseServer();

  try {
    // Mark as processing
    await supabase
      .from('campaign_orchestration_schedules')
      .update({ status: 'processing' })
      .eq('id', schedule.id);

    // Run preflight checks
    const preflight = await runPreflight({
      scheduleId: schedule.id,
      clientId: schedule.client_id,
      workspaceId: schedule.workspace_id,
      channel: schedule.channel as PostingChannel,
      content: schedule.content_markdown,
    });

    if (!preflight.passed) {
      // Mark schedule as blocked
      await supabase
        .from('campaign_orchestration_schedules')
        .update({
          status: 'blocked',
          execution_result: {
            preflight_id: preflight.id,
            blocked_by: preflight.blockedBy,
            block_reason: preflight.blockReason,
          },
        })
        .eq('id', schedule.id);

      return {
        scheduleId: schedule.id,
        preflightPassed: false,
        executed: false,
        error: preflight.blockReason,
      };
    }

    // Execute post
    const execution = await executePost({
      preflightId: preflight.id,
      payload: {
        content: schedule.content_markdown,
        mediaUrls: schedule.media_urls,
        metadata: schedule.metadata,
      },
    });

    return {
      scheduleId: schedule.id,
      preflightPassed: true,
      executed: execution.status === 'success',
      executionId: execution.id,
      error: execution.errorMessage,
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Mark as failed
    await supabase
      .from('campaign_orchestration_schedules')
      .update({
        status: 'failed',
        execution_result: { error: errorMessage },
      })
      .eq('id', schedule.id);

    return {
      scheduleId: schedule.id,
      preflightPassed: false,
      executed: false,
      error: errorMessage,
    };
  }
}

/**
 * Get scheduler status
 */
export async function getSchedulerStatus(workspaceId: string): Promise<{
  pending: number;
  processing: number;
  blocked: number;
  completedToday: number;
  failedToday: number;
}> {
  const supabase = await getSupabaseServer();
  const today = new Date().toISOString().split('T')[0];

  const [pending, processing, blocked, completedToday, failedToday] = await Promise.all([
    supabase
      .from('campaign_orchestration_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'approved')
      .lte('scheduled_for', new Date().toISOString()),

    supabase
      .from('campaign_orchestration_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'processing'),

    supabase
      .from('campaign_orchestration_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'blocked'),

    supabase
      .from('campaign_orchestration_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
      .gte('executed_at', today),

    supabase
      .from('campaign_orchestration_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'failed')
      .gte('updated_at', today),
  ]);

  return {
    pending: pending.count || 0,
    processing: processing.count || 0,
    blocked: blocked.count || 0,
    completedToday: completedToday.count || 0,
    failedToday: failedToday.count || 0,
  };
}

/**
 * Get upcoming schedules
 */
export async function getUpcomingSchedules(
  workspaceId: string,
  limit: number = 10
): Promise<ScheduleItem[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('campaign_orchestration_schedules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'approved')
    .gt('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Failed to get upcoming schedules:', error);
    return [];
  }

  return data || [];
}
