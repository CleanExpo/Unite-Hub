/**
 * Alignment Narrative Generator
 * Phase 73: Generate truth-layer compliant narratives from real data
 */

import {
  AlignmentReport,
  AlignmentBlocker,
  AlignmentOpportunity,
  getDimensionDisplayName,
} from './alignmentEngine';

export interface AlignmentNarrative {
  headline: string;
  summary: string;
  phase_context: string;
  dimension_highlights: string[];
  blocker_narrative: string | null;
  opportunity_narrative: string | null;
  next_steps: string[];
  data_notice: string;
}

/**
 * Generate client-facing narrative
 * Simplified, actionable, honest
 */
export function generateClientNarrative(report: AlignmentReport): AlignmentNarrative {
  const { overall_score, overall_status, dimensions, blockers, opportunities, journey_day, journey_phase, data_completeness } = report;

  // Headline based on status
  let headline: string;
  if (overall_status === 'aligned') {
    headline = 'Your journey is progressing well';
  } else if (overall_status === 'mostly_aligned') {
    headline = 'Good progress with a few areas to address';
  } else if (overall_status === 'needs_attention') {
    headline = 'Some areas need attention to stay on track';
  } else {
    headline = 'Action needed to get back on track';
  }

  // Summary paragraph
  const strongDimensions = dimensions.filter(d => d.status === 'strong' || d.status === 'healthy');
  const weakDimensions = dimensions.filter(d => d.status === 'needs_attention' || d.status === 'critical');

  let summary: string;
  if (data_completeness < 30) {
    summary = `You are on Day ${journey_day} of your 90-day journey. Not enough data has accumulated yet to provide a complete assessment. As you complete more milestones and receive content, this view will become more comprehensive.`;
  } else if (weakDimensions.length === 0) {
    summary = `You are on Day ${journey_day} in the ${journey_phase} phase. All alignment dimensions are healthy. Continue with your current approach.`;
  } else {
    const weakNames = weakDimensions.map(d => getDimensionDisplayName(d.dimension).toLowerCase()).join(' and ');
    summary = `You are on Day ${journey_day} in the ${journey_phase} phase. Your ${weakNames} ${weakDimensions.length === 1 ? 'needs' : 'need'} attention. See the recommendations below.`;
  }

  // Phase context
  const phase_context = getPhaseContextNarrative(journey_phase, journey_day);

  // Dimension highlights
  const dimension_highlights = dimensions
    .filter(d => d.data_availability !== 'insufficient')
    .map(d => {
      const name = getDimensionDisplayName(d.dimension);
      if (d.status === 'strong') {
        return `${name} is strong at ${d.score}%`;
      } else if (d.status === 'healthy') {
        return `${name} is healthy at ${d.score}%`;
      } else if (d.status === 'needs_attention') {
        return `${name} needs attention at ${d.score}%`;
      } else {
        return `${name} is critical at ${d.score}%`;
      }
    });

  // Blocker narrative
  let blocker_narrative: string | null = null;
  if (blockers.length > 0) {
    const topBlocker = blockers[0];
    blocker_narrative = `The most pressing issue is: ${topBlocker.title}. ${topBlocker.description} Suggested action: ${topBlocker.suggested_action}`;
  }

  // Opportunity narrative
  let opportunity_narrative: string | null = null;
  if (opportunities.length > 0 && blockers.filter(b => b.severity === 'critical' || b.severity === 'high').length === 0) {
    const topOpp = opportunities[0];
    opportunity_narrative = `Opportunity: ${topOpp.title}. ${topOpp.description}`;
  }

  // Next steps
  const next_steps: string[] = [];

  // Add blocker actions first
  blockers.slice(0, 2).forEach(b => {
    next_steps.push(b.suggested_action);
  });

  // Add opportunity actions if no critical blockers
  if (blockers.filter(b => b.severity === 'critical').length === 0) {
    opportunities.slice(0, 1).forEach(o => {
      next_steps.push(o.next_step);
    });
  }

  // Default step if none
  if (next_steps.length === 0) {
    next_steps.push('Continue with current activities and check back in a few days');
  }

  // Data notice
  let data_notice: string;
  if (data_completeness >= 80) {
    data_notice = 'This assessment is based on complete data from all systems.';
  } else if (data_completeness >= 50) {
    data_notice = 'Some data is still accumulating. This assessment will become more accurate as your journey progresses.';
  } else {
    data_notice = 'Limited data available. This assessment will improve as you complete more milestones and receive content.';
  }

  return {
    headline,
    summary,
    phase_context,
    dimension_highlights,
    blocker_narrative,
    opportunity_narrative,
    next_steps,
    data_notice,
  };
}

/**
 * Generate founder-facing narrative
 * More detailed, operational focus
 */
export function generateFounderNarrative(report: AlignmentReport): AlignmentNarrative {
  const { client_name, overall_score, overall_status, dimensions, blockers, opportunities, journey_day, journey_phase, data_completeness } = report;

  // Headline with client name
  let headline: string;
  if (overall_status === 'aligned') {
    headline = `${client_name}: On track (${overall_score}%)`;
  } else if (overall_status === 'mostly_aligned') {
    headline = `${client_name}: Minor attention needed (${overall_score}%)`;
  } else if (overall_status === 'needs_attention') {
    headline = `${client_name}: Intervention recommended (${overall_score}%)`;
  } else {
    headline = `${client_name}: Urgent attention required (${overall_score}%)`;
  }

  // Summary with operational details
  const criticalBlockers = blockers.filter(b => b.severity === 'critical' || b.severity === 'high');
  const highPotentialOpps = opportunities.filter(o => o.potential === 'high');

  let summary: string;
  if (data_completeness < 30) {
    summary = `Day ${journey_day}/${journey_phase}. Insufficient data for complete assessment. Client needs more activity before alignment can be accurately measured.`;
  } else if (criticalBlockers.length > 0) {
    summary = `Day ${journey_day}/${journey_phase}. ${criticalBlockers.length} critical/high blocker${criticalBlockers.length > 1 ? 's' : ''} requiring intervention. Primary: ${criticalBlockers[0].title}.`;
  } else if (highPotentialOpps.length > 0) {
    summary = `Day ${journey_day}/${journey_phase}. No critical blockers. ${highPotentialOpps.length} high-potential opportunit${highPotentialOpps.length > 1 ? 'ies' : 'y'} available.`;
  } else {
    summary = `Day ${journey_day}/${journey_phase}. Alignment score ${overall_score}%. No critical issues. Standard progression.`;
  }

  // Phase context
  const phase_context = getPhaseContextNarrative(journey_phase, journey_day);

  // Dimension highlights - more detailed for founder
  const dimension_highlights = dimensions.map(d => {
    const name = getDimensionDisplayName(d.dimension);
    const factors = d.contributing_factors.slice(0, 2).join(', ');
    const availability = d.data_availability === 'insufficient' ? ' (insufficient data)' : '';
    return `${name}: ${d.score}% (${d.status})${factors ? ` - ${factors}` : ''}${availability}`;
  });

  // Blocker narrative - operational focus
  let blocker_narrative: string | null = null;
  if (blockers.length > 0) {
    const blockerSummary = blockers.map(b => `${b.severity.toUpperCase()}: ${b.title}`).join('; ');
    blocker_narrative = `Blockers (${blockers.length}): ${blockerSummary}`;
  }

  // Opportunity narrative
  let opportunity_narrative: string | null = null;
  if (opportunities.length > 0) {
    const oppSummary = opportunities.slice(0, 2).map(o => `${o.potential} potential: ${o.title}`).join('; ');
    opportunity_narrative = `Opportunities: ${oppSummary}`;
  }

  // Next steps - prioritized for founder action
  const next_steps: string[] = [];

  criticalBlockers.forEach(b => {
    next_steps.push(`[URGENT] ${b.suggested_action}`);
  });

  blockers.filter(b => b.severity === 'medium').slice(0, 1).forEach(b => {
    next_steps.push(b.suggested_action);
  });

  highPotentialOpps.slice(0, 1).forEach(o => {
    next_steps.push(`[OPPORTUNITY] ${o.next_step}`);
  });

  if (next_steps.length === 0) {
    next_steps.push('No immediate action required. Continue monitoring.');
  }

  // Data notice
  const data_notice = `Data completeness: ${data_completeness}%`;

  return {
    headline,
    summary,
    phase_context,
    dimension_highlights,
    blocker_narrative,
    opportunity_narrative,
    next_steps,
    data_notice,
  };
}

/**
 * Get phase-specific context narrative
 */
function getPhaseContextNarrative(phase: string, day: number): string {
  const contexts: Record<string, string> = {
    onboarding: `Days 0-7 focus on account setup and brand foundation. All information gathered now improves content accuracy.`,
    foundation: `Days 8-21 build your visual identity. VIF generation and initial concepts happen during this phase.`,
    activation: `Days 22-45 begin active content production. First deliveries and performance tracking start.`,
    optimization: `Days 46-75 use performance data to refine creative. Reactive adjustments and A/B testing occur.`,
    evolution: `Days 76-90 establish long-term creative evolution. Success patterns inform ongoing strategy.`,
  };

  return contexts[phase] || `You are currently in the ${phase} phase of your journey.`;
}

/**
 * Generate single-line status for list views
 */
export function generateStatusLine(report: AlignmentReport): string {
  const { overall_score, blockers, opportunities } = report;

  const criticalCount = blockers.filter(b => b.severity === 'critical' || b.severity === 'high').length;
  const oppCount = opportunities.filter(o => o.potential === 'high').length;

  if (criticalCount > 0) {
    return `${overall_score}% - ${criticalCount} blocker${criticalCount > 1 ? 's' : ''} need attention`;
  } else if (oppCount > 0) {
    return `${overall_score}% - ${oppCount} opportunit${oppCount > 1 ? 'ies' : 'y'} available`;
  } else {
    return `${overall_score}% - On track`;
  }
}

export default {
  generateClientNarrative,
  generateFounderNarrative,
  generateStatusLine,
};
