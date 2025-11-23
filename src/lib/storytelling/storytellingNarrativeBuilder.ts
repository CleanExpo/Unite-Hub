/**
 * Storytelling Narrative Builder
 * Phase 74: Assemble human-readable narratives from data
 */

import {
  StoryDataSnapshot,
  getTimeRangeLabel,
  getThemeLabel,
} from './storytellingSources';
import {
  buildExecutiveSummary,
  buildKeyWins,
  buildChallenges,
  buildNextSteps,
  buildJourneyContext,
  buildVideoScript,
  buildVoiceScript,
  TemplateContext,
} from './storytellingTemplates';

export interface ClientStoryNarrative {
  story_id: string;
  title: string;
  subtitle: string;
  executive_summary: string;
  journey_context: string;
  key_wins: string[];
  challenges: string[];
  next_steps: string[];
  kpi_highlights: { name: string; value: string; trend: string }[];
  milestone_summary: string;
  data_notice: string;
  generated_at: string;
}

export interface FounderStoryNarrative extends ClientStoryNarrative {
  operational_summary: string;
  risk_indicators: string[];
  opportunity_indicators: string[];
  recommended_actions: string[];
}

export interface VideoScript {
  scenes: { visual: string; narration: string; duration: string }[];
  total_duration: string;
  style_notes: string;
}

export interface VoiceScript {
  script: string;
  tone: string;
  pacing: string;
  estimated_duration: string;
}

/**
 * Build client-facing story narrative
 */
export function buildClientNarrative(snapshot: StoryDataSnapshot): ClientStoryNarrative {
  const context: TemplateContext = {
    clientName: snapshot.client_name,
    timeRangeLabel: getTimeRangeLabel(snapshot.time_range),
    journeyDay: snapshot.journey_day,
    journeyPhase: snapshot.journey_phase,
    progressPercent: snapshot.journey_progress_percent,
  };

  const storyId = `story_${snapshot.workspace_id}_${snapshot.time_range}_${Date.now()}`;
  const themeLabel = getThemeLabel(snapshot.theme);

  // Build narrative sections
  const executiveSummary = buildExecutiveSummary(context, snapshot.kpis, snapshot.milestones);
  const journeyContext = buildJourneyContext(context);
  const keyWins = buildKeyWins(snapshot.milestones, snapshot.events, snapshot.kpis);
  const challenges = buildChallenges(snapshot);
  const nextSteps = buildNextSteps(context, snapshot.milestones, snapshot.trends);

  // KPI highlights for display
  const kpiHighlights = snapshot.kpis.slice(0, 5).map(k => ({
    name: k.name,
    value: `${k.value}${k.unit}`,
    trend: k.trend === 'up' ? '+' + (k.trend_percentage || '') + '%' :
           k.trend === 'down' ? '-' + (k.trend_percentage || '') + '%' : 'stable',
  }));

  // Milestone summary
  const completed = snapshot.milestones.filter(m => m.status === 'completed').length;
  const total = snapshot.milestones.length;
  const milestoneSummary = total > 0
    ? `${completed} of ${total} milestones completed this period`
    : 'No milestones recorded for this period';

  // Data notice
  let dataNotice: string;
  if (snapshot.insufficient_data) {
    dataNotice = 'Limited data available. This story will become more complete as your journey progresses.';
  } else if (snapshot.data_completeness < 75) {
    dataNotice = `Based on ${snapshot.data_completeness}% of available data sources. Some metrics may be incomplete.`;
  } else {
    dataNotice = 'Based on complete data from all tracked sources.';
  }

  return {
    story_id: storyId,
    title: `Your ${themeLabel} Story`,
    subtitle: `${context.timeRangeLabel} • Day ${context.journeyDay}`,
    executive_summary: executiveSummary,
    journey_context: journeyContext,
    key_wins: keyWins,
    challenges,
    next_steps: nextSteps,
    kpi_highlights: kpiHighlights,
    milestone_summary: milestoneSummary,
    data_notice: dataNotice,
    generated_at: snapshot.timestamp,
  };
}

/**
 * Build founder-facing story narrative with operational details
 */
export function buildFounderNarrative(snapshot: StoryDataSnapshot): FounderStoryNarrative {
  const clientNarrative = buildClientNarrative(snapshot);

  // Operational summary
  const operationalSummary = buildOperationalSummary(snapshot);

  // Risk indicators
  const riskIndicators = buildRiskIndicators(snapshot);

  // Opportunity indicators
  const opportunityIndicators = buildOpportunityIndicators(snapshot);

  // Recommended actions
  const recommendedActions = buildRecommendedActions(snapshot, riskIndicators, opportunityIndicators);

  return {
    ...clientNarrative,
    operational_summary: operationalSummary,
    risk_indicators: riskIndicators,
    opportunity_indicators: opportunityIndicators,
    recommended_actions: recommendedActions,
  };
}

/**
 * Build operational summary for founders
 */
function buildOperationalSummary(snapshot: StoryDataSnapshot): string {
  const { client_name, journey_day, journey_phase, data_completeness } = snapshot;

  const declining = snapshot.kpis.filter(k => k.trend === 'down').length;
  const improving = snapshot.kpis.filter(k => k.trend === 'up').length;

  let summary = `${client_name}: Day ${journey_day}/${journey_phase}. `;
  summary += `Data completeness: ${data_completeness}%. `;

  if (declining > 0) {
    summary += `${declining} declining metric${declining > 1 ? 's' : ''} requiring attention. `;
  } else if (improving > 0) {
    summary += `${improving} metric${improving > 1 ? 's' : ''} improving. `;
  } else {
    summary += 'Metrics stable. ';
  }

  const completed = snapshot.milestones.filter(m => m.status === 'completed').length;
  if (completed > 0) {
    summary += `${completed} milestone${completed > 1 ? 's' : ''} completed.`;
  }

  return summary;
}

/**
 * Build risk indicators for founders
 */
function buildRiskIndicators(snapshot: StoryDataSnapshot): string[] {
  const risks: string[] = [];

  // Declining metrics
  snapshot.kpis
    .filter(k => k.trend === 'down')
    .forEach(k => {
      risks.push(`${k.name} declining${k.trend_percentage ? ` (${k.trend_percentage}%)` : ''}`);
    });

  // Low data completeness
  if (snapshot.data_completeness < 50) {
    risks.push(`Low data completeness (${snapshot.data_completeness}%) - story may be incomplete`);
  }

  // No recent events
  if (snapshot.events.length === 0) {
    risks.push('No notable events recorded - client may need engagement');
  }

  // Declining trends
  snapshot.trends
    .filter(t => t.direction === 'declining')
    .forEach(t => {
      risks.push(`${t.dimension} trend declining`);
    });

  return risks;
}

/**
 * Build opportunity indicators for founders
 */
function buildOpportunityIndicators(snapshot: StoryDataSnapshot): string[] {
  const opportunities: string[] = [];

  // Strong improving metrics
  snapshot.kpis
    .filter(k => k.trend === 'up' && k.trend_percentage && k.trend_percentage >= 15)
    .forEach(k => {
      opportunities.push(`Strong ${k.name} growth (${k.trend_percentage}%) - consider expansion`);
    });

  // High-impact milestones completed
  snapshot.milestones
    .filter(m => m.status === 'completed' && m.impact)
    .forEach(m => {
      opportunities.push(`${m.title} unlocked: ${m.impact}`);
    });

  // Positive trends
  snapshot.trends
    .filter(t => t.direction === 'improving')
    .forEach(t => {
      opportunities.push(`${t.dimension} momentum positive - can accelerate`);
    });

  return opportunities;
}

/**
 * Build recommended actions for founders
 */
function buildRecommendedActions(
  snapshot: StoryDataSnapshot,
  risks: string[],
  opportunities: string[]
): string[] {
  const actions: string[] = [];

  // Risk-based actions first
  if (risks.length > 0) {
    if (risks.some(r => r.includes('declining'))) {
      actions.push('Review declining metrics and adjust strategy');
    }
    if (risks.some(r => r.includes('data completeness'))) {
      actions.push('Ensure all data sources are properly connected');
    }
    if (risks.some(r => r.includes('No notable events'))) {
      actions.push('Check in with client to confirm engagement');
    }
  }

  // Opportunity-based actions
  if (opportunities.length > 0) {
    if (opportunities.some(o => o.includes('expansion'))) {
      actions.push('Discuss volume or channel expansion with client');
    }
    if (opportunities.some(o => o.includes('accelerate'))) {
      actions.push('Consider advancing to next phase features');
    }
  }

  // Default action
  if (actions.length === 0) {
    actions.push('Continue monitoring - no immediate action required');
  }

  return actions.slice(0, 5);
}

/**
 * Build video script from snapshot
 */
export function buildStoryVideoScript(snapshot: StoryDataSnapshot): VideoScript {
  const context: TemplateContext = {
    clientName: snapshot.client_name,
    timeRangeLabel: getTimeRangeLabel(snapshot.time_range),
    journeyDay: snapshot.journey_day,
    journeyPhase: snapshot.journey_phase,
    progressPercent: snapshot.journey_progress_percent,
  };

  const wins = buildKeyWins(snapshot.milestones, snapshot.events, snapshot.kpis);
  const { scenes } = buildVideoScript(context, snapshot.kpis, wins);

  // Calculate total duration
  const totalSeconds = scenes.reduce((sum, s) => {
    const seconds = parseInt(s.duration.replace('s', ''));
    return sum + seconds;
  }, 0);

  return {
    scenes,
    total_duration: `${totalSeconds}s`,
    style_notes: 'Professional animation style, brand colors, smooth transitions',
  };
}

/**
 * Build voice script from snapshot
 */
export function buildStoryVoiceScript(snapshot: StoryDataSnapshot): VoiceScript {
  const context: TemplateContext = {
    clientName: snapshot.client_name,
    timeRangeLabel: getTimeRangeLabel(snapshot.time_range),
    journeyDay: snapshot.journey_day,
    journeyPhase: snapshot.journey_phase,
    progressPercent: snapshot.journey_progress_percent,
  };

  const summary = buildExecutiveSummary(context, snapshot.kpis, snapshot.milestones);
  const wins = buildKeyWins(snapshot.milestones, snapshot.events, snapshot.kpis);
  const nextSteps = buildNextSteps(context, snapshot.milestones, snapshot.trends);

  const voiceData = buildVoiceScript(context, summary, wins, nextSteps);

  // Estimate duration (roughly 150 words per minute)
  const wordCount = voiceData.script.split(' ').length;
  const minutes = Math.ceil(wordCount / 150);

  return {
    ...voiceData,
    estimated_duration: `${minutes} minute${minutes > 1 ? 's' : ''}`,
  };
}

export default {
  buildClientNarrative,
  buildFounderNarrative,
  buildStoryVideoScript,
  buildStoryVoiceScript,
};
