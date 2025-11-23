/**
 * Storytelling Engine
 * Phase 74: High-level functions to generate client stories
 */

import {
  collectStoryData,
  StoryTimeRange,
  StoryTheme,
  StoryDataSnapshot,
} from './storytellingSources';
import {
  buildClientNarrative,
  buildFounderNarrative,
  buildStoryVideoScript,
  buildStoryVoiceScript,
  ClientStoryNarrative,
  FounderStoryNarrative,
  VideoScript,
  VoiceScript,
} from './storytellingNarrativeBuilder';

export interface ClientStory {
  snapshot: StoryDataSnapshot;
  narrative: ClientStoryNarrative;
  video_script?: VideoScript;
  voice_script?: VoiceScript;
}

export interface FounderClientStory {
  snapshot: StoryDataSnapshot;
  narrative: FounderStoryNarrative;
  video_script?: VideoScript;
  voice_script?: VoiceScript;
}

export interface StoryRequest {
  workspaceId: string;
  clientName: string;
  timeRange: StoryTimeRange;
  theme: StoryTheme;
  journeyDay: number;
  journeyPhase: string;
  journeyProgressPercent: number;
  includeVideoScript?: boolean;
  includeVoiceScript?: boolean;
}

/**
 * Generate a client-facing story
 */
export function generateClientStory(request: StoryRequest): ClientStory {
  // Collect all story data
  const snapshot = collectStoryData(
    request.workspaceId,
    request.clientName,
    request.timeRange,
    request.theme,
    {
      day: request.journeyDay,
      phase: request.journeyPhase,
      progressPercent: request.journeyProgressPercent,
    }
  );

  // Build narrative
  const narrative = buildClientNarrative(snapshot);

  // Build optional scripts
  const videoScript = request.includeVideoScript
    ? buildStoryVideoScript(snapshot)
    : undefined;

  const voiceScript = request.includeVoiceScript
    ? buildStoryVoiceScript(snapshot)
    : undefined;

  return {
    snapshot,
    narrative,
    video_script: videoScript,
    voice_script: voiceScript,
  };
}

/**
 * Generate a founder-facing client story
 */
export function generateFounderClientStory(request: StoryRequest): FounderClientStory {
  // Collect all story data
  const snapshot = collectStoryData(
    request.workspaceId,
    request.clientName,
    request.timeRange,
    request.theme,
    {
      day: request.journeyDay,
      phase: request.journeyPhase,
      progressPercent: request.journeyProgressPercent,
    }
  );

  // Build founder narrative
  const narrative = buildFounderNarrative(snapshot);

  // Build optional scripts
  const videoScript = request.includeVideoScript
    ? buildStoryVideoScript(snapshot)
    : undefined;

  const voiceScript = request.includeVoiceScript
    ? buildStoryVoiceScript(snapshot)
    : undefined;

  return {
    snapshot,
    narrative,
    video_script: videoScript,
    voice_script: voiceScript,
  };
}

/**
 * Generate weekly summary story
 */
export function generateWeeklySummary(
  workspaceId: string,
  clientName: string,
  journeyContext: { day: number; phase: string; progressPercent: number }
): ClientStory {
  return generateClientStory({
    workspaceId,
    clientName,
    timeRange: 'last_7_days',
    theme: 'mixed',
    journeyDay: journeyContext.day,
    journeyPhase: journeyContext.phase,
    journeyProgressPercent: journeyContext.progressPercent,
    includeVideoScript: false,
    includeVoiceScript: false,
  });
}

/**
 * Generate monthly summary story
 */
export function generateMonthlySummary(
  workspaceId: string,
  clientName: string,
  journeyContext: { day: number; phase: string; progressPercent: number }
): ClientStory {
  return generateClientStory({
    workspaceId,
    clientName,
    timeRange: 'last_30_days',
    theme: 'mixed',
    journeyDay: journeyContext.day,
    journeyPhase: journeyContext.phase,
    journeyProgressPercent: journeyContext.progressPercent,
    includeVideoScript: true,
    includeVoiceScript: true,
  });
}

/**
 * Generate quarter/90-day summary story
 */
export function generateQuarterSummary(
  workspaceId: string,
  clientName: string,
  journeyContext: { day: number; phase: string; progressPercent: number }
): ClientStory {
  return generateClientStory({
    workspaceId,
    clientName,
    timeRange: 'last_90_days',
    theme: 'mixed',
    journeyDay: journeyContext.day,
    journeyPhase: journeyContext.phase,
    journeyProgressPercent: journeyContext.progressPercent,
    includeVideoScript: true,
    includeVoiceScript: true,
  });
}

/**
 * Generate theme-specific story
 */
export function generateThemeStory(
  workspaceId: string,
  clientName: string,
  theme: StoryTheme,
  timeRange: StoryTimeRange,
  journeyContext: { day: number; phase: string; progressPercent: number }
): ClientStory {
  return generateClientStory({
    workspaceId,
    clientName,
    timeRange,
    theme,
    journeyDay: journeyContext.day,
    journeyPhase: journeyContext.phase,
    journeyProgressPercent: journeyContext.progressPercent,
    includeVideoScript: false,
    includeVoiceScript: false,
  });
}

/**
 * Get available story periods for a client
 */
export function getAvailableStoryPeriods(journeyDay: number): StoryTimeRange[] {
  const periods: StoryTimeRange[] = ['last_7_days'];

  if (journeyDay >= 30) {
    periods.push('last_30_days');
  }

  if (journeyDay >= 90) {
    periods.push('last_90_days');
  }

  return periods;
}

/**
 * Get story health indicator
 */
export function getStoryHealth(story: ClientStory): {
  status: 'complete' | 'partial' | 'limited';
  message: string;
} {
  const completeness = story.snapshot.data_completeness;

  if (completeness >= 75) {
    return {
      status: 'complete',
      message: 'Story based on complete data',
    };
  } else if (completeness >= 40) {
    return {
      status: 'partial',
      message: 'Some data sources unavailable',
    };
  } else {
    return {
      status: 'limited',
      message: 'Limited data - story will improve over time',
    };
  }
}

export default {
  generateClientStory,
  generateFounderClientStory,
  generateWeeklySummary,
  generateMonthlySummary,
  generateQuarterSummary,
  generateThemeStory,
  getAvailableStoryPeriods,
  getStoryHealth,
};
