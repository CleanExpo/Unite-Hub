/**
 * MCOE Executor Service
 * Phase 84: Execute safe posting actions (drafting only in Phase 84)
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  OrchestrationSchedule,
  ExecutionResult,
  ScheduleStatus,
} from './mcoeTypes';
import { logOrchestrationAction } from './mcoeLogService';

/**
 * Execute a draft post (Phase 84 - no actual publishing)
 */
export async function executeDraftPost(
  schedule: OrchestrationSchedule
): Promise<ExecutionResult> {
  const supabase = await getSupabaseServer();

  try {
    // In Phase 84, we only create drafts
    // Future phases will add actual publishing

    // Create a draft in generatedContent
    const draftContent = {
      workspace_id: schedule.workspace_id,
      contact_id: schedule.client_id,
      content_type: `${schedule.channel}_post`,
      content: JSON.stringify(schedule.content_preview),
      status: 'draft',
      metadata: {
        source: 'mcoe',
        schedule_id: schedule.id,
        channel: schedule.channel,
        scheduled_for: schedule.scheduled_for,
        priority: schedule.priority,
      },
    };

    const { data: draft, error } = await supabase
      .from('generatedContent')
      .insert(draftContent)
      .select('id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Update schedule status
    await updateScheduleStatus(schedule.id, 'completed', {
      draft_id: draft.id,
      message: 'Draft created successfully',
    });

    // Log the execution
    await logOrchestrationAction({
      schedule_id: schedule.id,
      client_id: schedule.client_id,
      workspace_id: schedule.workspace_id,
      action_type: 'schedule_executed',
      decision_payload: {
        draft_id: draft.id,
        channel: schedule.channel,
      },
      source_signals: {},
      risk_class: 'low',
      status: 'auto_executed',
    });

    return {
      success: true,
      message: `Draft created for ${schedule.channel}`,
      post_id: draft.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Update schedule status
    await updateScheduleStatus(schedule.id, 'failed', {
      error: message,
    });

    // Log the failure
    await logOrchestrationAction({
      schedule_id: schedule.id,
      client_id: schedule.client_id,
      workspace_id: schedule.workspace_id,
      action_type: 'schedule_failed',
      decision_payload: { error: message },
      source_signals: {},
      risk_class: 'high',
      status: 'rejected',
    });

    return {
      success: false,
      message: `Failed to create draft: ${message}`,
    };
  }
}

/**
 * Update schedule status
 */
export async function updateScheduleStatus(
  scheduleId: string,
  status: ScheduleStatus,
  result?: Record<string, unknown>
): Promise<void> {
  const supabase = await getSupabaseServer();

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed' || status === 'failed') {
    updates.executed_at = new Date().toISOString();
    updates.execution_result = result || {};
  }

  if (status === 'blocked' && result?.reason) {
    updates.blocked_reason = result.reason;
  }

  await supabase
    .from('campaign_orchestration_schedules')
    .update(updates)
    .eq('id', scheduleId);
}

/**
 * Block a schedule with reason
 */
export async function blockSchedule(
  scheduleId: string,
  reason: string,
  workspaceId: string,
  clientId: string
): Promise<void> {
  await updateScheduleStatus(scheduleId, 'blocked', { reason });

  await logOrchestrationAction({
    schedule_id: scheduleId,
    client_id: clientId,
    workspace_id: workspaceId,
    action_type: 'schedule_blocked',
    decision_payload: { reason },
    source_signals: {},
    risk_class: 'high',
    status: 'rejected',
    truth_notes: reason,
  });
}

/**
 * Approve a schedule for execution
 */
export async function approveSchedule(
  scheduleId: string,
  userId: string
): Promise<void> {
  const supabase = await getSupabaseServer();

  const { data: schedule } = await supabase
    .from('campaign_orchestration_schedules')
    .select('*')
    .eq('id', scheduleId)
    .single();

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  await supabase
    .from('campaign_orchestration_schedules')
    .update({
      status: 'ready',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId);

  await logOrchestrationAction({
    schedule_id: scheduleId,
    client_id: schedule.client_id,
    workspace_id: schedule.workspace_id,
    action_type: 'schedule_approved',
    decision_payload: { approved_by: userId },
    source_signals: {},
    risk_class: 'low',
    status: 'accepted',
    actor: userId,
  });
}

/**
 * Cancel a schedule
 */
export async function cancelSchedule(
  scheduleId: string,
  reason: string
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase
    .from('campaign_orchestration_schedules')
    .update({
      status: 'cancelled',
      blocked_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId);
}

/**
 * Execute pending schedules that are due
 */
export async function executeDueSchedules(
  workspaceId: string
): Promise<{
  executed: number;
  failed: number;
  errors: string[];
}> {
  const supabase = await getSupabaseServer();
  let executed = 0;
  let failed = 0;
  const errors: string[] = [];

  const now = new Date().toISOString();

  // Get due schedules
  const { data: dueSchedules } = await supabase
    .from('campaign_orchestration_schedules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('status', ['ready'])
    .lte('scheduled_for', now)
    .order('priority', { ascending: false })
    .limit(10);

  if (!dueSchedules || dueSchedules.length === 0) {
    return { executed: 0, failed: 0, errors: [] };
  }

  for (const schedule of dueSchedules) {
    try {
      const result = await executeDraftPost(schedule);
      if (result.success) {
        executed++;
      } else {
        failed++;
        errors.push(`${schedule.id}: ${result.message}`);
      }
    } catch (error) {
      failed++;
      const msg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${schedule.id}: ${msg}`);
    }
  }

  return { executed, failed, errors };
}

/**
 * Sync posting intent to logs
 */
export async function syncPostingIntentToLogs(
  schedule: OrchestrationSchedule
): Promise<void> {
  await logOrchestrationAction({
    schedule_id: schedule.id,
    client_id: schedule.client_id,
    workspace_id: schedule.workspace_id,
    action_type: 'posting_decision',
    decision_payload: {
      channel: schedule.channel,
      scheduled_for: schedule.scheduled_for,
      asset_id: schedule.creative_asset_id,
      priority: schedule.priority,
    },
    source_signals: {},
    risk_class: schedule.risk_level,
    status: 'pending',
  });
}
