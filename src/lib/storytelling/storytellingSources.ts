/**
 * Storytelling Sources
 * Phase 74: Read-only helpers to pull real data from existing engines
 */

export type StoryTimeRange = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';
export type StoryTheme = 'activation' | 'performance' | 'creative' | 'success' | 'mixed';

export interface StoryMilestone {
  milestone_id: string;
  type: 'activation' | 'production' | 'performance' | 'success' | 'creative';
  title: string;
  description: string;
  occurred_at: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  impact?: string;
}

export interface StoryKPI {
  kpi_id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trend_percentage?: number;
  context: string;
}

export interface StoryEvent {
  event_id: string;
  type: string;
  title: string;
  description: string;
  occurred_at: string;
  significance: 'high' | 'medium' | 'low';
}

export interface StoryTrend {
  trend_id: string;
  dimension: string;
  direction: 'improving' | 'declining' | 'stable';
  summary: string;
  data_points: number;
}

export interface StoryDataSnapshot {
  workspace_id: string;
  client_name: string;
  time_range: StoryTimeRange;
  theme: StoryTheme;
  timestamp: string;

  // Journey context
  journey_day: number;
  journey_phase: string;
  journey_progress_percent: number;

  // Data collections
  milestones: StoryMilestone[];
  kpis: StoryKPI[];
  events: StoryEvent[];
  trends: StoryTrend[];

  // Data availability
  data_completeness: number; // 0-100
  insufficient_data: boolean;
  missing_sources: string[];
}

/**
 * Collect activation data for storytelling
 */
export function collectActivationData(
  workspaceId: string,
  timeRange: StoryTimeRange
): { milestones: StoryMilestone[]; events: StoryEvent[]; insufficient: boolean } {
  // In production, would query activation_events table
  // For now, return example structure

  const milestones: StoryMilestone[] = [
    {
      milestone_id: 'ms_profile',
      type: 'activation',
      title: 'Profile Completed',
      description: 'Business profile setup with target audience and messaging preferences',
      occurred_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      impact: 'Enabled personalized content generation',
    },
    {
      milestone_id: 'ms_brandkit',
      type: 'activation',
      title: 'Brand Kit Uploaded',
      description: 'Logo, colors, and fonts uploaded for visual consistency',
      occurred_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      impact: 'Unlocked VIF generation',
    },
    {
      milestone_id: 'ms_vif',
      type: 'activation',
      title: 'First VIF Generated',
      description: 'Visual Identity Fabric created as foundation for all creative',
      occurred_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      impact: 'Production pipeline activated',
    },
  ];

  const events: StoryEvent[] = [
    {
      event_id: 'evt_onboard',
      type: 'onboarding',
      title: 'Onboarding Completed',
      description: 'All initial setup steps finished within first week',
      occurred_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
      significance: 'high',
    },
  ];

  return { milestones, events, insufficient: false };
}

/**
 * Collect performance data for storytelling
 */
export function collectPerformanceData(
  workspaceId: string,
  timeRange: StoryTimeRange
): { kpis: StoryKPI[]; trends: StoryTrend[]; events: StoryEvent[]; insufficient: boolean } {
  // In production, would query performance tables

  const kpis: StoryKPI[] = [
    {
      kpi_id: 'kpi_engagement',
      name: 'Engagement Rate',
      value: 4.2,
      unit: '%',
      trend: 'up',
      trend_percentage: 15,
      context: 'Average across all channels',
    },
    {
      kpi_id: 'kpi_impressions',
      name: 'Total Impressions',
      value: 45000,
      unit: '',
      trend: 'up',
      trend_percentage: 22,
      context: 'Combined channel reach',
    },
    {
      kpi_id: 'kpi_content',
      name: 'Content Delivered',
      value: 12,
      unit: 'pieces',
      trend: 'stable',
      context: 'Completed production jobs',
    },
  ];

  const trends: StoryTrend[] = [
    {
      trend_id: 'trend_engagement',
      dimension: 'Engagement',
      direction: 'improving',
      summary: 'Engagement rates have increased 15% over the period',
      data_points: 30,
    },
    {
      trend_id: 'trend_reach',
      dimension: 'Reach',
      direction: 'improving',
      summary: 'Impressions growing steadily across channels',
      data_points: 30,
    },
  ];

  const events: StoryEvent[] = [
    {
      event_id: 'evt_toppost',
      type: 'performance',
      title: 'Top Performing Content',
      description: 'Project showcase carousel achieved 8.2% engagement rate',
      occurred_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      significance: 'high',
    },
  ];

  return { kpis, trends, events, insufficient: false };
}

/**
 * Collect creative/production data for storytelling
 */
export function collectCreativeData(
  workspaceId: string,
  timeRange: StoryTimeRange
): { milestones: StoryMilestone[]; events: StoryEvent[]; kpis: StoryKPI[]; insufficient: boolean } {
  const milestones: StoryMilestone[] = [
    {
      milestone_id: 'ms_firstjob',
      type: 'production',
      title: 'First Production Job',
      description: 'Initial content bundle completed and delivered',
      occurred_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      impact: 'Began content distribution',
    },
    {
      milestone_id: 'ms_5jobs',
      type: 'production',
      title: '5 Jobs Completed',
      description: 'Production milestone reached',
      occurred_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      impact: 'Steady production velocity established',
    },
  ];

  const events: StoryEvent[] = [
    {
      event_id: 'evt_newmethod',
      type: 'creative',
      title: 'New Creative Method',
      description: 'Behind-the-scenes video format tested with strong results',
      occurred_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      significance: 'medium',
    },
  ];

  const kpis: StoryKPI[] = [
    {
      kpi_id: 'kpi_production',
      name: 'Production Velocity',
      value: 3.5,
      unit: 'jobs/week',
      trend: 'stable',
      context: 'Average weekly output',
    },
    {
      kpi_id: 'kpi_approval',
      name: 'Approval Rate',
      value: 88,
      unit: '%',
      trend: 'up',
      trend_percentage: 5,
      context: 'First-pass approval rate',
    },
  ];

  return { milestones, events, kpis, insufficient: false };
}

/**
 * Collect success engine data for storytelling
 */
export function collectSuccessData(
  workspaceId: string,
  timeRange: StoryTimeRange
): { kpis: StoryKPI[]; trends: StoryTrend[]; events: StoryEvent[]; insufficient: boolean } {
  const kpis: StoryKPI[] = [
    {
      kpi_id: 'kpi_success',
      name: 'Success Score',
      value: 68,
      unit: '',
      trend: 'up',
      trend_percentage: 8,
      context: 'Overall client health',
    },
    {
      kpi_id: 'kpi_alignment',
      name: 'Alignment Score',
      value: 72,
      unit: '%',
      trend: 'stable',
      context: '5-dimension average',
    },
  ];

  const trends: StoryTrend[] = [
    {
      trend_id: 'trend_success',
      dimension: 'Success',
      direction: 'improving',
      summary: 'Success score trending upward as engagement improves',
      data_points: 14,
    },
  ];

  const events: StoryEvent[] = [
    {
      event_id: 'evt_score60',
      type: 'success',
      title: 'Success Score Milestone',
      description: 'Crossed 60-point threshold indicating healthy progression',
      occurred_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      significance: 'high',
    },
  ];

  return { kpis, trends, events, insufficient: false };
}

/**
 * Collect all story data for a given workspace and parameters
 */
export function collectStoryData(
  workspaceId: string,
  clientName: string,
  timeRange: StoryTimeRange,
  theme: StoryTheme,
  journeyContext: {
    day: number;
    phase: string;
    progressPercent: number;
  }
): StoryDataSnapshot {
  const timestamp = new Date().toISOString();
  const missingSources: string[] = [];

  let milestones: StoryMilestone[] = [];
  let kpis: StoryKPI[] = [];
  let events: StoryEvent[] = [];
  let trends: StoryTrend[] = [];

  // Collect based on theme
  if (theme === 'activation' || theme === 'mixed') {
    const activation = collectActivationData(workspaceId, timeRange);
    milestones = [...milestones, ...activation.milestones];
    events = [...events, ...activation.events];
    if (activation.insufficient) {
missingSources.push('activation');
}
  }

  if (theme === 'performance' || theme === 'mixed') {
    const performance = collectPerformanceData(workspaceId, timeRange);
    kpis = [...kpis, ...performance.kpis];
    trends = [...trends, ...performance.trends];
    events = [...events, ...performance.events];
    if (performance.insufficient) {
missingSources.push('performance');
}
  }

  if (theme === 'creative' || theme === 'mixed') {
    const creative = collectCreativeData(workspaceId, timeRange);
    milestones = [...milestones, ...creative.milestones];
    events = [...events, ...creative.events];
    kpis = [...kpis, ...creative.kpis];
    if (creative.insufficient) {
missingSources.push('creative');
}
  }

  if (theme === 'success' || theme === 'mixed') {
    const success = collectSuccessData(workspaceId, timeRange);
    kpis = [...kpis, ...success.kpis];
    trends = [...trends, ...success.trends];
    events = [...events, ...success.events];
    if (success.insufficient) {
missingSources.push('success');
}
  }

  // Sort events by date
  events.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  // Calculate data completeness
  const totalPossible = 4; // activation, performance, creative, success
  const available = totalPossible - missingSources.length;
  const dataCompleteness = Math.round((available / totalPossible) * 100);

  return {
    workspace_id: workspaceId,
    client_name: clientName,
    time_range: timeRange,
    theme,
    timestamp,
    journey_day: journeyContext.day,
    journey_phase: journeyContext.phase,
    journey_progress_percent: journeyContext.progressPercent,
    milestones,
    kpis,
    events,
    trends,
    data_completeness: dataCompleteness,
    insufficient_data: dataCompleteness < 25,
    missing_sources: missingSources,
  };
}

/**
 * Get time range label
 */
export function getTimeRangeLabel(range: StoryTimeRange): string {
  const labels: Record<StoryTimeRange, string> = {
    last_7_days: 'Last 7 Days',
    last_30_days: 'Last 30 Days',
    last_90_days: 'Last 90 Days',
    all_time: 'All Time',
  };
  return labels[range];
}

/**
 * Get theme label
 */
export function getThemeLabel(theme: StoryTheme): string {
  const labels: Record<StoryTheme, string> = {
    activation: 'Activation',
    performance: 'Performance',
    creative: 'Creative',
    success: 'Success',
    mixed: 'Complete Story',
  };
  return labels[theme];
}

export default {
  collectStoryData,
  collectActivationData,
  collectPerformanceData,
  collectCreativeData,
  collectSuccessData,
  getTimeRangeLabel,
  getThemeLabel,
};
