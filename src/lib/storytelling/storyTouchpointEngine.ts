/**
 * Story Touchpoint Engine
 * Phase 75: Generate scheduled touchpoints from existing storytelling engine
 */

import {
  generateClientStory,
  generateFounderClientStory,
  generateWeeklySummary,
  generateMonthlySummary,
  generateQuarterSummary,
  getStoryHealth,
  GeneratedStory,
  GeneratedFounderStory,
  StoryTimeRange,
} from './storytellingEngine';
import { ClientStoryNarrative, FounderStoryNarrative } from './storytellingNarrativeBuilder';

export type TouchpointTimeframe = 'weekly' | 'monthly' | 'ninety_day';

export interface StoryTouchpoint {
  touchpoint_id: string;
  workspace_id: string;
  client_id: string;
  client_name: string;
  timeframe: TouchpointTimeframe;
  time_range: StoryTimeRange;
  theme: string;
  generated_at: string;
  story_health: number;
  excerpt: string;
  narrative: ClientStoryNarrative | FounderStoryNarrative;
  has_video_script: boolean;
  has_voice_script: boolean;
  data_status: 'complete' | 'partial' | 'limited';
}

export interface TouchpointGenerationConfig {
  workspace_id: string;
  client_id: string;
  client_name: string;
  timeframe: TouchpointTimeframe;
  theme?: string;
}

export interface TouchpointBatchResult {
  success: StoryTouchpoint[];
  failed: { client_id: string; error: string }[];
  generated_at: string;
}

/**
 * Map timeframe to story time range
 */
function timeframeToRange(timeframe: TouchpointTimeframe): StoryTimeRange {
  switch (timeframe) {
    case 'weekly':
      return 'last_7_days';
    case 'monthly':
      return 'last_30_days';
    case 'ninety_day':
      return 'last_90_days';
  }
}

/**
 * Get data status from story health
 */
function getDataStatus(health: number): 'complete' | 'partial' | 'limited' {
  if (health >= 75) return 'complete';
  if (health >= 40) return 'partial';
  return 'limited';
}

/**
 * Generate excerpt from narrative
 */
function generateExcerpt(narrative: ClientStoryNarrative | FounderStoryNarrative): string {
  const summary = narrative.executive_summary;
  if (summary.length <= 150) return summary;
  return summary.substring(0, 147) + '...';
}

/**
 * Generate a touchpoint for a client
 */
export function generateTouchpointForClient(
  config: TouchpointGenerationConfig
): StoryTouchpoint {
  const timeRange = timeframeToRange(config.timeframe);
  const story = generateClientStory(
    config.workspace_id,
    config.client_id,
    timeRange
  );

  const health = getStoryHealth(config.workspace_id);

  return {
    touchpoint_id: `tp_${config.client_id}_${config.timeframe}_${Date.now()}`,
    workspace_id: config.workspace_id,
    client_id: config.client_id,
    client_name: config.client_name,
    timeframe: config.timeframe,
    time_range: timeRange,
    theme: config.theme || 'mixed',
    generated_at: new Date().toISOString(),
    story_health: health,
    excerpt: generateExcerpt(story.narrative),
    narrative: story.narrative,
    has_video_script: !!story.videoScript,
    has_voice_script: !!story.voiceScript,
    data_status: getDataStatus(health),
  };
}

/**
 * Generate a founder touchpoint with operational insights
 */
export function generateFounderTouchpointForClient(
  config: TouchpointGenerationConfig
): StoryTouchpoint {
  const timeRange = timeframeToRange(config.timeframe);
  const story = generateFounderClientStory(
    config.workspace_id,
    config.client_id,
    timeRange
  );

  const health = getStoryHealth(config.workspace_id);

  return {
    touchpoint_id: `tp_founder_${config.client_id}_${config.timeframe}_${Date.now()}`,
    workspace_id: config.workspace_id,
    client_id: config.client_id,
    client_name: config.client_name,
    timeframe: config.timeframe,
    time_range: timeRange,
    theme: config.theme || 'mixed',
    generated_at: new Date().toISOString(),
    story_health: health,
    excerpt: generateExcerpt(story.narrative),
    narrative: story.narrative,
    has_video_script: !!story.videoScript,
    has_voice_script: !!story.voiceScript,
    data_status: getDataStatus(health),
  };
}

/**
 * Generate weekly touchpoint for client
 */
export function generateWeeklyTouchpointForClient(
  workspaceId: string,
  clientId: string,
  clientName: string
): StoryTouchpoint {
  return generateTouchpointForClient({
    workspace_id: workspaceId,
    client_id: clientId,
    client_name: clientName,
    timeframe: 'weekly',
  });
}

/**
 * Generate monthly touchpoint for client
 */
export function generateMonthlyTouchpointForClient(
  workspaceId: string,
  clientId: string,
  clientName: string
): StoryTouchpoint {
  return generateTouchpointForClient({
    workspace_id: workspaceId,
    client_id: clientId,
    client_name: clientName,
    timeframe: 'monthly',
  });
}

/**
 * Generate 90-day touchpoint for client
 */
export function generate90DayTouchpointForClient(
  workspaceId: string,
  clientId: string,
  clientName: string
): StoryTouchpoint {
  return generateTouchpointForClient({
    workspace_id: workspaceId,
    client_id: clientId,
    client_name: clientName,
    timeframe: 'ninety_day',
  });
}

/**
 * Batch generate touchpoints for multiple clients
 */
export function generateTouchpointsForClients(
  clients: { workspace_id: string; client_id: string; client_name: string }[],
  timeframe: TouchpointTimeframe
): TouchpointBatchResult {
  const success: StoryTouchpoint[] = [];
  const failed: { client_id: string; error: string }[] = [];

  for (const client of clients) {
    try {
      const touchpoint = generateTouchpointForClient({
        workspace_id: client.workspace_id,
        client_id: client.client_id,
        client_name: client.client_name,
        timeframe,
      });
      success.push(touchpoint);
    } catch (error) {
      failed.push({
        client_id: client.client_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    success,
    failed,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Get touchpoint freshness status
 */
export function getTouchpointFreshness(
  generatedAt: string,
  timeframe: TouchpointTimeframe
): 'fresh' | 'stale' | 'expired' {
  const generated = new Date(generatedAt).getTime();
  const now = Date.now();
  const ageMs = now - generated;
  const ageHours = ageMs / (1000 * 60 * 60);
  const ageDays = ageHours / 24;

  switch (timeframe) {
    case 'weekly':
      if (ageDays <= 7) return 'fresh';
      if (ageDays <= 14) return 'stale';
      return 'expired';
    case 'monthly':
      if (ageDays <= 30) return 'fresh';
      if (ageDays <= 45) return 'stale';
      return 'expired';
    case 'ninety_day':
      if (ageDays <= 90) return 'fresh';
      if (ageDays <= 120) return 'stale';
      return 'expired';
  }
}

/**
 * Get touchpoint summary for quick display
 */
export function getTouchpointSummary(touchpoint: StoryTouchpoint): {
  title: string;
  subtitle: string;
  metrics_count: number;
  wins_count: number;
} {
  const narrative = touchpoint.narrative;
  const winsCount = narrative.key_wins.filter(
    w => w !== 'Journey is progressing - wins will be highlighted as milestones are achieved'
  ).length;

  return {
    title: narrative.title,
    subtitle: narrative.subtitle,
    metrics_count: narrative.kpi_highlights.length,
    wins_count: winsCount,
  };
}

export default {
  generateTouchpointForClient,
  generateFounderTouchpointForClient,
  generateWeeklyTouchpointForClient,
  generateMonthlyTouchpointForClient,
  generate90DayTouchpointForClient,
  generateTouchpointsForClients,
  getTouchpointFreshness,
  getTouchpointSummary,
};
