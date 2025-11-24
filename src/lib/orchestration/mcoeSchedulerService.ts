/**
 * MCOE Scheduler Service
 * Phase 84: Weekly and daily orchestration cycles
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  OrchestrationSchedule,
  ScheduleInput,
  OrchestrationOverview,
  ChannelSummary,
  Channel,
  ChannelHealth,
} from './mcoeTypes';
import { planWeeklySchedule } from './mcoePlannerService';
import { selectAssetForChannel } from './mcoeAssetSelectorService';
import { validateSchedule } from './mcoeGuardrailsService';
import { executeDueSchedules, blockSchedule } from './mcoeExecutorService';
import { logOrchestrationAction } from './mcoeLogService';

const CHANNELS: Channel[] = ['fb', 'ig', 'linkedin', 'x', 'email'];

/**
 * Run daily orchestration pass
 */
export async function runDailyOrchestrationPass(
  workspaceId: string
): Promise<{
  schedules_processed: number;
  executed: number;
  blocked: number;
  errors: string[];
}> {
  const supabase = await getSupabaseServer();
  const errors: string[] = [];
  let processed = 0;
  let blocked = 0;

  // Get pending schedules for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const { data: schedules } = await supabase
    .from('campaign_orchestration_schedules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .gte('scheduled_for', today.toISOString())
    .lt('scheduled_for', tomorrow.toISOString());

  if (!schedules || schedules.length === 0) {
    return { schedules_processed: 0, executed: 0, blocked: 0, errors: [] };
  }

  // Process each schedule
  for (const schedule of schedules) {
    try {
      // Validate against guardrails
      const validation = await validateSchedule(schedule, workspaceId);

      if (!validation.allowed) {
        await blockSchedule(
          schedule.id,
          validation.blockers.join('; '),
          workspaceId,
          schedule.client_id
        );
        blocked++;
      } else {
        // Mark as ready
        await supabase
          .from('campaign_orchestration_schedules')
          .update({
            status: 'ready',
            risk_level: validation.risk_level,
            updated_at: new Date().toISOString(),
          })
          .eq('id', schedule.id);
      }

      processed++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Schedule ${schedule.id}: ${msg}`);
    }
  }

  // Execute due schedules
  const execution = await executeDueSchedules(workspaceId);

  return {
    schedules_processed: processed,
    executed: execution.executed,
    blocked,
    errors: [...errors, ...execution.errors],
  };
}

/**
 * Run weekly campaign planning
 */
export async function runWeeklyCampaignPlanning(
  workspaceId: string
): Promise<{
  clients_planned: number;
  schedules_created: number;
  conflicts_detected: number;
  errors: string[];
}> {
  const supabase = await getSupabaseServer();
  const errors: string[] = [];
  let clientsPlanned = 0;
  let schedulesCreated = 0;
  let conflictsDetected = 0;

  // Get active clients
  const { data: clients } = await supabase
    .from('contacts')
    .select('id, name')
    .eq('workspace_id', workspaceId)
    .in('status', ['customer', 'prospect'])
    .limit(50);

  if (!clients || clients.length === 0) {
    return {
      clients_planned: 0,
      schedules_created: 0,
      conflicts_detected: 0,
      errors: [],
    };
  }

  for (const client of clients) {
    try {
      // Generate weekly plan
      const plan = await planWeeklySchedule(client.id, workspaceId);

      conflictsDetected += plan.conflicts.length;

      // Create schedules
      for (const planned of plan.schedules) {
        // Select asset
        const asset = await selectAssetForChannel(
          client.id,
          workspaceId,
          planned.channel
        );

        const scheduleInput: ScheduleInput = {
          client_id: client.id,
          workspace_id: workspaceId,
          channel: planned.channel,
          scheduled_for: planned.scheduled_for,
          creative_asset_id: asset?.asset_id,
          priority: planned.priority,
        };

        const schedule = await createSchedule(scheduleInput);

        // Log the creation
        await logOrchestrationAction({
          schedule_id: schedule.id,
          client_id: client.id,
          workspace_id: workspaceId,
          action_type: 'schedule_created',
          decision_payload: {
            channel: planned.channel,
            scheduled_for: planned.scheduled_for,
            reasoning: planned.reasoning,
          },
          source_signals: {},
          risk_class: 'low',
          status: 'accepted',
          truth_notes: plan.truth_notes.join(' '),
        });

        schedulesCreated++;
      }

      clientsPlanned++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Client ${client.id}: ${msg}`);
    }
  }

  return {
    clients_planned: clientsPlanned,
    schedules_created: schedulesCreated,
    conflicts_detected: conflictsDetected,
    errors,
  };
}

/**
 * Create a schedule
 */
export async function createSchedule(
  input: ScheduleInput
): Promise<OrchestrationSchedule> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('campaign_orchestration_schedules')
    .insert({
      client_id: input.client_id,
      workspace_id: input.workspace_id,
      campaign_id: input.campaign_id,
      channel: input.channel,
      scheduled_for: input.scheduled_for,
      creative_asset_id: input.creative_asset_id,
      content_preview: input.content_preview || {},
      priority: input.priority || 50,
      status: 'pending',
      risk_level: 'low',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create schedule: ${error.message}`);
  }

  return normalizeSchedule(data);
}

/**
 * Get orchestration overview
 */
export async function getOrchestrationOverview(
  workspaceId: string
): Promise<OrchestrationOverview> {
  const supabase = await getSupabaseServer();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get schedule counts
  const { count: totalSchedules } = await supabase
    .from('campaign_orchestration_schedules')
    .select('id', { count: 'exact' })
    .eq('workspace_id', workspaceId);

  const { count: pendingSchedules } = await supabase
    .from('campaign_orchestration_schedules')
    .select('id', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .in('status', ['pending', 'ready']);

  const { count: completedToday } = await supabase
    .from('campaign_orchestration_schedules')
    .select('id', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .eq('status', 'completed')
    .gte('executed_at', today.toISOString());

  const { count: blockedCount } = await supabase
    .from('campaign_orchestration_schedules')
    .select('id', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .eq('status', 'blocked');

  // Get channel health
  const { data: channelStates } = await supabase
    .from('channel_state')
    .select('channel, fatigue_score, momentum_score, visibility_score')
    .eq('workspace_id', workspaceId);

  const channelsActive = channelStates?.length || 0;
  const avgHealth = channelStates
    ? channelStates.reduce((sum, s) => {
        const health = (1 - s.fatigue_score) * 0.3 + s.momentum_score * 0.35 + s.visibility_score * 0.35;
        return sum + health;
      }, 0) / (channelStates.length || 1)
    : 0;

  const highFatigueChannels = channelStates
    ?.filter(s => s.fatigue_score >= 0.7)
    .map(s => s.channel as Channel) || [];

  // Get conflicts
  const { count: conflictsCount } = await supabase
    .from('campaign_orchestration_actions')
    .select('id', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .eq('action_type', 'conflict_detected')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return {
    total_schedules: totalSchedules || 0,
    pending_schedules: pendingSchedules || 0,
    completed_today: completedToday || 0,
    blocked_count: blockedCount || 0,
    channels_active: channelsActive,
    avg_health_score: avgHealth,
    conflicts_detected: conflictsCount || 0,
    high_fatigue_channels: highFatigueChannels,
  };
}

/**
 * Get channel summaries
 */
export async function getChannelSummaries(
  workspaceId: string
): Promise<ChannelSummary[]> {
  const supabase = await getSupabaseServer();
  const summaries: ChannelSummary[] = [];

  for (const channel of CHANNELS) {
    const { count: pending } = await supabase
      .from('campaign_orchestration_schedules')
      .select('id', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('channel', channel)
      .in('status', ['pending', 'ready']);

    const { count: completed } = await supabase
      .from('campaign_orchestration_schedules')
      .select('id', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('channel', channel)
      .eq('status', 'completed');

    const { data: state } = await supabase
      .from('channel_state')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('channel', channel)
      .single();

    const health: ChannelHealth = {
      channel,
      health_score: state
        ? (1 - state.fatigue_score) * 0.3 + state.momentum_score * 0.35 + state.visibility_score * 0.35
        : 0.5,
      fatigue: state?.fatigue_score || 0,
      momentum: state?.momentum_score || 0.5,
      visibility: state?.visibility_score || 0.5,
      engagement: state?.engagement_score || 0.5,
      last_post: state?.last_post_at,
      recommended_wait_hours: state?.fatigue_score >= 0.7 ? 48 : state?.fatigue_score >= 0.5 ? 24 : 6,
    };

    summaries.push({
      channel,
      schedules_pending: pending || 0,
      schedules_completed: completed || 0,
      health,
    });
  }

  return summaries;
}

/**
 * Normalize schedule from database
 */
function normalizeSchedule(row: Record<string, unknown>): OrchestrationSchedule {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    client_id: row.client_id as string,
    workspace_id: row.workspace_id as string,
    campaign_id: row.campaign_id as string | undefined,
    channel: row.channel as Channel,
    scheduled_for: row.scheduled_for as string,
    time_zone: row.time_zone as string || 'UTC',
    creative_asset_id: row.creative_asset_id as string | undefined,
    variation_id: row.variation_id as string | undefined,
    content_preview: row.content_preview as OrchestrationSchedule['content_preview'],
    status: row.status as OrchestrationSchedule['status'],
    priority: row.priority as number,
    metadata: row.metadata as Record<string, unknown>,
    risk_level: row.risk_level as OrchestrationSchedule['risk_level'],
    blocked_reason: row.blocked_reason as string | undefined,
    executed_at: row.executed_at as string | undefined,
    execution_result: row.execution_result as OrchestrationSchedule['execution_result'],
    created_by: row.created_by as string | undefined,
    approved_by: row.approved_by as string | undefined,
    approved_at: row.approved_at as string | undefined,
  };
}
