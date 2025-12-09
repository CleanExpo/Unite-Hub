/**
 * MCOE Planner Service
 * Phase 84: Plan weekly posting schedules per client and channel
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  Channel,
  WeeklyPlan,
  PlannedSchedule,
  ChannelAllocation,
  PlanConflict,
  ChannelState,
  RiskClass,
} from './mcoeTypes';

const CHANNELS: Channel[] = ['fb', 'ig', 'linkedin', 'x', 'email'];

// Optimal posting frequencies per channel (posts per week)
const CHANNEL_FREQUENCIES: Record<Channel, number> = {
  fb: 5,
  ig: 7,
  tiktok: 14,
  linkedin: 3,
  youtube: 2,
  gmb: 2,
  reddit: 3,
  email: 2,
  x: 14,
};

// Best posting hours per channel (24h format)
const CHANNEL_BEST_TIMES: Record<Channel, number[]> = {
  fb: [9, 13, 16],
  ig: [11, 14, 19],
  tiktok: [7, 12, 19, 22],
  linkedin: [8, 10, 12],
  youtube: [14, 16, 21],
  gmb: [10, 14],
  reddit: [8, 12, 20],
  email: [9, 14],
  x: [8, 12, 17, 21],
};

/**
 * Plan weekly schedule for a client
 */
export async function planWeeklySchedule(
  clientId: string,
  workspaceId: string
): Promise<WeeklyPlan> {
  const supabase = await getSupabaseServer();

  // Get current channel states
  const { data: channelStates } = await supabase
    .from('channel_state')
    .select('*')
    .eq('client_id', clientId);

  // Get early warnings
  const { data: warnings } = await supabase
    .from('early_warning_events')
    .select('warning_type, severity')
    .eq('client_id', clientId)
    .in('status', ['open', 'acknowledged']);

  const hasHighWarnings = warnings?.some(w => w.severity === 'high') || false;

  // Calculate week boundaries
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const schedules: PlannedSchedule[] = [];
  const channelAllocations: ChannelAllocation[] = [];
  const conflicts: PlanConflict[] = [];
  const truthNotes: string[] = [];

  // Plan for each channel
  for (const channel of CHANNELS) {
    const state = channelStates?.find(s => s.channel === channel);
    const fatigue = state?.fatigue_score || 0;
    const frequency = CHANNEL_FREQUENCIES[channel];
    const bestTimes = CHANNEL_BEST_TIMES[channel];

    // Adjust frequency based on fatigue
    let adjustedFrequency = frequency;
    let fatigueRisk: RiskClass = 'low';

    if (fatigue >= 0.7) {
      adjustedFrequency = Math.floor(frequency * 0.5);
      fatigueRisk = 'high';
      conflicts.push({
        type: 'fatigue',
        description: `High fatigue on ${channel} (${Math.round(fatigue * 100)}%), reducing posts`,
        severity: 'medium',
        affected_schedules: [],
        resolution: `Reduced from ${frequency} to ${adjustedFrequency} posts`,
      });
    } else if (fatigue >= 0.4) {
      adjustedFrequency = Math.floor(frequency * 0.75);
      fatigueRisk = 'medium';
    }

    // Block all if high warnings
    if (hasHighWarnings) {
      adjustedFrequency = 0;
      conflicts.push({
        type: 'warning',
        description: `High-severity warnings active, blocking ${channel} posts`,
        severity: 'high',
        affected_schedules: [],
      });
    }

    // Generate schedule times
    const scheduledTimes = selectOptimalTimes(
      weekStart,
      weekEnd,
      adjustedFrequency,
      bestTimes
    );

    // Create schedules
    for (const time of scheduledTimes) {
      schedules.push({
        channel,
        scheduled_for: time.toISOString(),
        priority: calculatePriority(channel, fatigue),
        reasoning: `Scheduled based on ${channel} optimal times and current fatigue (${Math.round(fatigue * 100)}%)`,
      });
    }

    channelAllocations.push({
      channel,
      posts_planned: scheduledTimes.length,
      optimal_times: bestTimes.map(h => `${h}:00`),
      fatigue_risk: fatigueRisk,
    });
  }

  // Add truth notes
  if (channelStates?.length === 0) {
    truthNotes.push('No historical channel data available. Schedule based on industry defaults.');
  }

  if (hasHighWarnings) {
    truthNotes.push('High-severity warnings active. All posting blocked until resolved.');
  }

  return {
    client_id: clientId,
    week_start: weekStart.toISOString(),
    week_end: weekEnd.toISOString(),
    schedules,
    channel_allocation: channelAllocations,
    conflicts,
    truth_notes: truthNotes,
  };
}

/**
 * Select optimal posting times within a week
 */
export function selectOptimalTimes(
  weekStart: Date,
  weekEnd: Date,
  count: number,
  preferredHours: number[]
): Date[] {
  const times: Date[] = [];
  const daysInWeek = 7;

  if (count === 0) {
return times;
}

  // Distribute evenly across the week
  const spacing = Math.floor(daysInWeek / count);

  for (let i = 0; i < count; i++) {
    const dayOffset = Math.min(i * spacing, daysInWeek - 1);
    const hour = preferredHours[i % preferredHours.length];

    const time = new Date(weekStart);
    time.setDate(weekStart.getDate() + dayOffset);
    time.setHours(hour, 0, 0, 0);

    // Only add if within week bounds
    if (time <= weekEnd) {
      times.push(time);
    }
  }

  return times;
}

/**
 * Calculate schedule priority based on channel and fatigue
 */
function calculatePriority(channel: Channel, fatigue: number): number {
  // Base priority by channel importance
  const basePriority: Record<Channel, number> = {
    email: 80,
    linkedin: 70,
    fb: 60,
    ig: 60,
    youtube: 55,
    x: 50,
    tiktok: 45,
    gmb: 40,
    reddit: 35,
  };

  let priority = basePriority[channel];

  // Reduce priority for fatigued channels
  if (fatigue >= 0.7) {
    priority -= 20;
  } else if (fatigue >= 0.4) {
    priority -= 10;
  }

  return Math.max(priority, 10);
}

/**
 * Get existing schedules for a week
 */
export async function getWeekSchedules(
  clientId: string,
  workspaceId: string,
  weekStart: Date
): Promise<any[]> {
  const supabase = await getSupabaseServer();

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const { data, error } = await supabase
    .from('campaign_orchestration_schedules')
    .select('*')
    .eq('client_id', clientId)
    .eq('workspace_id', workspaceId)
    .gte('scheduled_for', weekStart.toISOString())
    .lt('scheduled_for', weekEnd.toISOString())
    .order('scheduled_for', { ascending: true });

  if (error) {
    throw new Error(`Failed to get schedules: ${error.message}`);
  }

  return data || [];
}

/**
 * Check for scheduling conflicts
 */
export function detectConflicts(
  schedules: PlannedSchedule[]
): PlanConflict[] {
  const conflicts: PlanConflict[] = [];

  // Check for same-channel posts too close together
  const byChannel = new Map<Channel, PlannedSchedule[]>();

  for (const schedule of schedules) {
    const list = byChannel.get(schedule.channel) || [];
    list.push(schedule);
    byChannel.set(schedule.channel, list);
  }

  for (const [channel, channelSchedules] of byChannel.entries()) {
    // Sort by time
    channelSchedules.sort((a, b) =>
      new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
    );

    // Check spacing
    for (let i = 1; i < channelSchedules.length; i++) {
      const prev = new Date(channelSchedules[i - 1].scheduled_for);
      const curr = new Date(channelSchedules[i].scheduled_for);
      const hoursDiff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 12) {
        conflicts.push({
          type: 'timing',
          description: `${channel} posts scheduled ${Math.round(hoursDiff)}h apart`,
          severity: 'medium',
          affected_schedules: [
            channelSchedules[i - 1].scheduled_for,
            channelSchedules[i].scheduled_for,
          ],
          resolution: 'Consider spreading posts further apart',
        });
      }
    }
  }

  return conflicts;
}
