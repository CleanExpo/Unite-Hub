/**
 * Story Touchpoint Scheduler
 * Phase 75: Schedule and manage touchpoint generation runs
 */

import {
  generateTouchpointsForClients,
  generateWeeklyTouchpointForClient,
  generateMonthlyTouchpointForClient,
  generate90DayTouchpointForClient,
  TouchpointTimeframe,
  TouchpointBatchResult,
  StoryTouchpoint,
} from './storyTouchpointEngine';

export interface SchedulerRunResult {
  run_id: string;
  timeframe: TouchpointTimeframe;
  started_at: string;
  completed_at: string;
  total_clients: number;
  success_count: number;
  failed_count: number;
  touchpoints: StoryTouchpoint[];
  errors: { client_id: string; error: string }[];
}

export interface ClientInfo {
  workspace_id: string;
  client_id: string;
  client_name: string;
}

/**
 * Run weekly touchpoints for all provided clients
 */
export function runWeeklyTouchpoints(clients: ClientInfo[]): SchedulerRunResult {
  const startedAt = new Date().toISOString();
  const result = generateTouchpointsForClients(clients, 'weekly');

  return {
    run_id: `run_weekly_${Date.now()}`,
    timeframe: 'weekly',
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    total_clients: clients.length,
    success_count: result.success.length,
    failed_count: result.failed.length,
    touchpoints: result.success,
    errors: result.failed,
  };
}

/**
 * Run monthly touchpoints for all provided clients
 */
export function runMonthlyTouchpoints(clients: ClientInfo[]): SchedulerRunResult {
  const startedAt = new Date().toISOString();
  const result = generateTouchpointsForClients(clients, 'monthly');

  return {
    run_id: `run_monthly_${Date.now()}`,
    timeframe: 'monthly',
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    total_clients: clients.length,
    success_count: result.success.length,
    failed_count: result.failed.length,
    touchpoints: result.success,
    errors: result.failed,
  };
}

/**
 * Run 90-day touchpoints for all provided clients
 */
export function run90DayTouchpoints(clients: ClientInfo[]): SchedulerRunResult {
  const startedAt = new Date().toISOString();
  const result = generateTouchpointsForClients(clients, 'ninety_day');

  return {
    run_id: `run_90day_${Date.now()}`,
    timeframe: 'ninety_day',
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    total_clients: clients.length,
    success_count: result.success.length,
    failed_count: result.failed.length,
    touchpoints: result.success,
    errors: result.failed,
  };
}

/**
 * Run touchpoints for a single client across all timeframes
 */
export function runAllTouchpointsForClient(
  workspaceId: string,
  clientId: string,
  clientName: string
): {
  weekly: StoryTouchpoint;
  monthly: StoryTouchpoint;
  ninety_day: StoryTouchpoint;
} {
  return {
    weekly: generateWeeklyTouchpointForClient(workspaceId, clientId, clientName),
    monthly: generateMonthlyTouchpointForClient(workspaceId, clientId, clientName),
    ninety_day: generate90DayTouchpointForClient(workspaceId, clientId, clientName),
  };
}

/**
 * Get soft-launch clients (mock for now, would fetch from database)
 */
export function getSoftLaunchClients(): ClientInfo[] {
  // In production, this would fetch from the database
  // For now, return mock soft-launch clients
  return [
    {
      workspace_id: 'ws_1',
      client_id: 'client_1',
      client_name: 'Alpha Construction',
    },
    {
      workspace_id: 'ws_2',
      client_id: 'client_2',
      client_name: 'Beta Balustrades',
    },
    {
      workspace_id: 'ws_3',
      client_id: 'client_3',
      client_name: 'Gamma Glass',
    },
    {
      workspace_id: 'ws_4',
      client_id: 'client_4',
      client_name: 'Delta Decks',
    },
  ];
}

/**
 * Determine which touchpoints need to be run based on schedule
 *
 * Weekly: Every Monday
 * Monthly: First day of month
 * 90-day: At journey milestones (day 30, 60, 90)
 */
export function getScheduledTouchpointsForToday(): TouchpointTimeframe[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
  const dayOfMonth = now.getDate();

  const scheduled: TouchpointTimeframe[] = [];

  // Weekly on Monday
  if (dayOfWeek === 1) {
    scheduled.push('weekly');
  }

  // Monthly on 1st
  if (dayOfMonth === 1) {
    scheduled.push('monthly');
  }

  // 90-day touchpoints would be based on client journey day
  // For now, we don't auto-schedule these

  return scheduled;
}

/**
 * Run all scheduled touchpoints for today
 */
export function runScheduledTouchpoints(): SchedulerRunResult[] {
  const scheduled = getScheduledTouchpointsForToday();
  const clients = getSoftLaunchClients();
  const results: SchedulerRunResult[] = [];

  for (const timeframe of scheduled) {
    switch (timeframe) {
      case 'weekly':
        results.push(runWeeklyTouchpoints(clients));
        break;
      case 'monthly':
        results.push(runMonthlyTouchpoints(clients));
        break;
      case 'ninety_day':
        results.push(run90DayTouchpoints(clients));
        break;
    }
  }

  return results;
}

/**
 * Helper to check if touchpoints should run
 * Can be integrated with existing successScheduler.ts
 */
export function shouldRunTouchpoints(): {
  should_run: boolean;
  timeframes: TouchpointTimeframe[];
  reason: string;
} {
  const scheduled = getScheduledTouchpointsForToday();

  if (scheduled.length === 0) {
    return {
      should_run: false,
      timeframes: [],
      reason: 'No touchpoints scheduled for today',
    };
  }

  return {
    should_run: true,
    timeframes: scheduled,
    reason: `Scheduled: ${scheduled.join(', ')}`,
  };
}

export default {
  runWeeklyTouchpoints,
  runMonthlyTouchpoints,
  run90DayTouchpoints,
  runAllTouchpointsForClient,
  getSoftLaunchClients,
  getScheduledTouchpointsForToday,
  runScheduledTouchpoints,
  shouldRunTouchpoints,
};
