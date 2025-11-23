/**
 * Storytelling Templates
 * Phase 74: Template fragments for different narrative sections
 */

import { StoryDataSnapshot, StoryMilestone, StoryKPI, StoryEvent, StoryTrend } from './storytellingSources';

export interface TemplateContext {
  clientName: string;
  timeRangeLabel: string;
  journeyDay: number;
  journeyPhase: string;
  progressPercent: number;
}

/**
 * Executive summary template
 */
export function buildExecutiveSummary(
  context: TemplateContext,
  kpis: StoryKPI[],
  milestones: StoryMilestone[]
): string {
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const improvingKPIs = kpis.filter(k => k.trend === 'up').length;

  if (kpis.length === 0 && milestones.length === 0) {
    return `${context.clientName} is on Day ${context.journeyDay} of their 90-day journey, currently in the ${context.journeyPhase} phase. Not enough data has accumulated yet to provide a complete summary for the ${context.timeRangeLabel.toLowerCase()} period.`;
  }

  let summary = `${context.clientName} is on Day ${context.journeyDay} of their 90-day journey, currently in the ${context.journeyPhase} phase with ${context.progressPercent}% overall progress. `;

  if (completedMilestones > 0) {
    summary += `During the ${context.timeRangeLabel.toLowerCase()} period, ${completedMilestones} milestone${completedMilestones > 1 ? 's were' : ' was'} achieved. `;
  }

  if (improvingKPIs > 0 && kpis.length > 0) {
    summary += `${improvingKPIs} of ${kpis.length} tracked metrics showed improvement.`;
  } else if (kpis.length > 0) {
    summary += `Performance metrics remained stable.`;
  }

  return summary;
}

/**
 * Key wins template
 */
export function buildKeyWins(
  milestones: StoryMilestone[],
  events: StoryEvent[],
  kpis: StoryKPI[]
): string[] {
  const wins: string[] = [];

  // Add completed milestones as wins
  milestones
    .filter(m => m.status === 'completed')
    .forEach(m => {
      wins.push(`${m.title}: ${m.description}${m.impact ? ` - ${m.impact}` : ''}`);
    });

  // Add high-significance events
  events
    .filter(e => e.significance === 'high')
    .forEach(e => {
      wins.push(`${e.title}: ${e.description}`);
    });

  // Add improving KPIs
  kpis
    .filter(k => k.trend === 'up' && k.trend_percentage && k.trend_percentage >= 10)
    .forEach(k => {
      wins.push(`${k.name} increased ${k.trend_percentage}% (${k.context})`);
    });

  return wins.length > 0 ? wins : ['Journey is progressing - wins will be highlighted as milestones are achieved'];
}

/**
 * Challenges/blockers template
 */
export function buildChallenges(
  snapshot: StoryDataSnapshot
): string[] {
  const challenges: string[] = [];

  // Add declining KPIs
  snapshot.kpis
    .filter(k => k.trend === 'down')
    .forEach(k => {
      challenges.push(`${k.name} declined${k.trend_percentage ? ` by ${k.trend_percentage}%` : ''} (${k.context})`);
    });

  // Add missing sources
  if (snapshot.missing_sources.length > 0) {
    challenges.push(`Limited data available from: ${snapshot.missing_sources.join(', ')}`);
  }

  // Add declining trends
  snapshot.trends
    .filter(t => t.direction === 'declining')
    .forEach(t => {
      challenges.push(`${t.dimension}: ${t.summary}`);
    });

  return challenges;
}

/**
 * Next steps template
 */
export function buildNextSteps(
  context: TemplateContext,
  milestones: StoryMilestone[],
  trends: StoryTrend[]
): string[] {
  const steps: string[] = [];

  // Add upcoming milestones
  milestones
    .filter(m => m.status === 'upcoming' || m.status === 'in_progress')
    .slice(0, 3)
    .forEach(m => {
      steps.push(`${m.title}: ${m.description}`);
    });

  // Add trend-based recommendations
  trends.forEach(t => {
    if (t.direction === 'improving') {
      steps.push(`Continue current approach for ${t.dimension.toLowerCase()} - momentum is positive`);
    } else if (t.direction === 'declining') {
      steps.push(`Review ${t.dimension.toLowerCase()} strategy - consider adjustments`);
    }
  });

  // Add phase-specific guidance
  if (context.journeyPhase === 'onboarding') {
    steps.push('Complete profile and brand kit to unlock content production');
  } else if (context.journeyPhase === 'foundation') {
    steps.push('Review VIF concepts and provide feedback for refinement');
  } else if (context.journeyPhase === 'activation') {
    steps.push('Monitor initial content performance and approve production queue');
  } else if (context.journeyPhase === 'optimization') {
    steps.push('Review performance insights to inform creative adjustments');
  } else if (context.journeyPhase === 'evolution') {
    steps.push('Consider expanding successful methods to new channels');
  }

  return steps.slice(0, 5);
}

/**
 * 90-day context framing template
 */
export function buildJourneyContext(context: TemplateContext): string {
  const phaseDescriptions: Record<string, string> = {
    onboarding: 'setting up account and gathering brand information',
    foundation: 'building the visual identity foundation and generating initial concepts',
    activation: 'producing and deploying content across channels',
    optimization: 'analyzing performance data to refine creative strategy',
    evolution: 'evolving the creative approach based on accumulated learnings',
  };

  const phaseDesc = phaseDescriptions[context.journeyPhase] || context.journeyPhase;

  return `This period falls within Day ${context.journeyDay} of the 90-day journey. The ${context.journeyPhase} phase focuses on ${phaseDesc}. Overall journey progress stands at ${context.progressPercent}%.`;
}

/**
 * Video script template for Gemini VEO 3
 */
export function buildVideoScript(
  context: TemplateContext,
  kpis: StoryKPI[],
  wins: string[]
): { scenes: { visual: string; narration: string; duration: string }[] } {
  const scenes: { visual: string; narration: string; duration: string }[] = [];

  // Opening scene
  scenes.push({
    visual: 'Animated logo reveal with brand colors',
    narration: `${context.clientName}'s ${context.timeRangeLabel} Progress Report. Day ${context.journeyDay} of your 90-day journey.`,
    duration: '5s',
  });

  // KPI highlights
  if (kpis.length > 0) {
    const topKPIs = kpis.slice(0, 3);
    scenes.push({
      visual: 'Animated metrics dashboard with trend indicators',
      narration: `Key metrics: ${topKPIs.map(k => `${k.name} at ${k.value}${k.unit}`).join(', ')}.`,
      duration: '8s',
    });
  }

  // Wins highlight
  if (wins.length > 0 && wins[0] !== 'Journey is progressing - wins will be highlighted as milestones are achieved') {
    scenes.push({
      visual: 'Success badges or checkmark animations',
      narration: `Achievements this period: ${wins.slice(0, 2).join('. ')}.`,
      duration: '10s',
    });
  }

  // Closing
  scenes.push({
    visual: 'Forward-looking animation with journey progress bar',
    narration: `Your journey continues at ${context.progressPercent}% progress. Check your dashboard for detailed insights.`,
    duration: '5s',
  });

  return { scenes };
}

/**
 * Voice script template for ElevenLabs
 */
export function buildVoiceScript(
  context: TemplateContext,
  summary: string,
  wins: string[],
  nextSteps: string[]
): { script: string; tone: string; pacing: string } {
  let script = `Hello ${context.clientName}. Here's your ${context.timeRangeLabel.toLowerCase()} progress update. `;
  script += summary + ' ';

  if (wins.length > 0 && wins[0] !== 'Journey is progressing - wins will be highlighted as milestones are achieved') {
    script += `Key wins this period include: ${wins.slice(0, 2).join('. ')}. `;
  }

  if (nextSteps.length > 0) {
    script += `Coming up: ${nextSteps[0]}. `;
  }

  script += `For full details, visit your dashboard. Thank you.`;

  return {
    script,
    tone: 'Professional, warm, encouraging',
    pacing: 'Moderate pace with natural pauses',
  };
}

export default {
  buildExecutiveSummary,
  buildKeyWins,
  buildChallenges,
  buildNextSteps,
  buildJourneyContext,
  buildVideoScript,
  buildVoiceScript,
};
