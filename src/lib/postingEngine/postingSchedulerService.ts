/**
 * AMPE Scheduler Service
 * Phase 85: Runs continuously, checking for ready schedules
 */

import { getSupabaseServer } from '@/lib/supabase';
import { PostingAttempt, OrchestrationSchedule } from './postingTypes';
import { processSchedule, getPostingEngineConfig } from './postingOrchestratorService';

interface SchedulerResult {
  processed: number;
  successful: number;
  blocked: number;
  failed: number;
  attempts: PostingAttempt[];
}

/**
 * Run the posting loop - process all ready schedules
 */
export async function runPostingLoop(
  workspaceId: string
): Promise<SchedulerResult> {
  const supabase = await getSupabaseServer();

  // Check if engine is enabled
  const config = await getPostingEngineConfig(workspaceId);
  if (!config.engine_enabled) {
    return {
      processed: 0,
      successful: 0,
      blocked: 0,
      failed: 0,
      attempts: [],
    };
  }

  // Get ready schedules
  const schedules = await consumeReadySchedules(workspaceId);

  const attempts: PostingAttempt[] = [];
  let successful = 0;
  let blocked = 0;
  let failed = 0;

  // Process each schedule
  for (const schedule of schedules) {
    try {
      const attempt = await processSchedule(schedule.id);
      attempts.push(attempt);

      if (attempt.status === 'published' || attempt.status === 'draft_created') {
        successful++;
      } else if (attempt.status === 'blocked') {
        blocked++;
      } else if (attempt.status === 'failed') {
        failed++;
      }
    } catch (error) {
      console.error(`Failed to process schedule ${schedule.id}:`, error);
      failed++;
    }
  }

  return {
    processed: schedules.length,
    successful,
    blocked,
    failed,
    attempts,
  };
}

/**
 * Consume all ready schedules for a workspace
 */
export async function consumeReadySchedules(
  workspaceId: string
): Promise<OrchestrationSchedule[]> {
  const supabase = await getSupabaseServer();

  const now = new Date().toISOString();

  // Get schedules that are ready and due
  const { data: schedules, error } = await supabase
    .from('campaign_orchestration_schedules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'ready')
    .lte('scheduled_for', now)
    .order('priority', { ascending: false })
    .order('scheduled_for', { ascending: true })
    .limit(20);

  if (error) {
    throw new Error(`Failed to get ready schedules: ${error.message}`);
  }

  return schedules || [];
}

/**
 * Get pending schedules (not yet ready)
 */
export async function getPendingSchedules(
  workspaceId: string,
  limit: number = 50
): Promise<OrchestrationSchedule[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('campaign_orchestration_schedules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get pending schedules: ${error.message}`);
  }

  return data || [];
}

/**
 * Process a specific client's schedules
 */
export async function processClientSchedules(
  clientId: string,
  workspaceId: string
): Promise<SchedulerResult> {
  const supabase = await getSupabaseServer();

  const now = new Date().toISOString();

  // Get ready schedules for this client
  const { data: schedules, error } = await supabase
    .from('campaign_orchestration_schedules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('client_id', clientId)
    .eq('status', 'ready')
    .lte('scheduled_for', now)
    .order('priority', { ascending: false })
    .limit(10);

  if (error || !schedules) {
    return {
      processed: 0,
      successful: 0,
      blocked: 0,
      failed: 0,
      attempts: [],
    };
  }

  const attempts: PostingAttempt[] = [];
  let successful = 0;
  let blocked = 0;
  let failed = 0;

  for (const schedule of schedules) {
    try {
      const attempt = await processSchedule(schedule.id);
      attempts.push(attempt);

      if (attempt.status === 'published' || attempt.status === 'draft_created') {
        successful++;
      } else if (attempt.status === 'blocked') {
        blocked++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
  }

  return {
    processed: schedules.length,
    successful,
    blocked,
    failed,
    attempts,
  };
}

/**
 * Get scheduler statistics
 */
export async function getSchedulerStats(
  workspaceId: string,
  days: number = 7
): Promise<{
  total_processed: number;
  by_status: Record<string, number>;
  by_channel: Record<string, number>;
  by_day: Array<{ date: string; count: number }>;
}> {
  const supabase = await getSupabaseServer();

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: attempts } = await supabase
    .from('posting_attempts')
    .select('status, channel, attempted_at')
    .eq('workspace_id', workspaceId)
    .gte('attempted_at', startDate);

  const attemptsList = attempts || [];

  // Count by status
  const byStatus: Record<string, number> = {};
  attemptsList.forEach(a => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  });

  // Count by channel
  const byChannel: Record<string, number> = {};
  attemptsList.forEach(a => {
    byChannel[a.channel] = (byChannel[a.channel] || 0) + 1;
  });

  // Count by day
  const byDayMap: Record<string, number> = {};
  attemptsList.forEach(a => {
    const date = a.attempted_at.split('T')[0];
    byDayMap[date] = (byDayMap[date] || 0) + 1;
  });

  const byDay = Object.entries(byDayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total_processed: attemptsList.length,
    by_status: byStatus,
    by_channel: byChannel,
    by_day: byDay,
  };
}

/**
 * Mark schedule as ready for posting
 */
export async function markScheduleReady(
  scheduleId: string,
  approvedBy?: string
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase
    .from('campaign_orchestration_schedules')
    .update({
      status: 'ready',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq('id', scheduleId);
}

/**
 * Retry a failed posting attempt
 */
export async function retryFailedAttempt(
  attemptId: string
): Promise<PostingAttempt | null> {
  const supabase = await getSupabaseServer();

  // Get the original attempt
  const { data: attempt } = await supabase
    .from('posting_attempts')
    .select('schedule_id, retry_count')
    .eq('id', attemptId)
    .single();

  if (!attempt) {
    return null;
  }

  // Update retry count
  await supabase
    .from('posting_attempts')
    .update({ retry_count: (attempt.retry_count || 0) + 1 })
    .eq('id', attemptId);

  // Reprocess the schedule
  return processSchedule(attempt.schedule_id);
}
