/**
 * Creative Opportunity Engine
 * Phase 71: Surface creative opportunities from performance data
 */

import { SignalsSnapshot } from './creativeSignalsHub';
import { CycleCoordinationReport, CreativeCycle } from './cycleCoordinator';

export type OpportunityType =
  | 'momentum'
  | 'seasonal'
  | 'competitor_gap'
  | 'platform_shift'
  | 'brand_extension'
  | 'method_discovery'
  | 'channel_expansion'
  | 'audience_growth';

export interface CreativeOpportunity {
  opportunity_id: string;
  type: OpportunityType;
  potential_value: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  title: string;
  description: string;
  evidence: OpportunityEvidence[];
  actions: OpportunityAction[];
  time_sensitivity: 'urgent' | 'timely' | 'flexible';
  estimated_lift: string;
}

export interface OpportunityEvidence {
  source: string;
  signal: string;
  interpretation: string;
}

export interface OpportunityAction {
  action_id: string;
  step: number;
  action: string;
  resources: string[];
  timeline: string;
}

export interface OpportunityReport {
  workspace_id: string;
  timestamp: string;
  opportunities: CreativeOpportunity[];
  top_opportunity: CreativeOpportunity | null;
  quick_wins: CreativeOpportunity[];
  strategic_opportunities: CreativeOpportunity[];
  total_potential_value: number;
}

/**
 * Detect creative opportunities from signals and cycle report
 */
export function detectCreativeOpportunities(
  workspaceId: string,
  snapshot: SignalsSnapshot,
  cycleReport: CycleCoordinationReport
): OpportunityReport {
  const opportunities: CreativeOpportunity[] = [];
  const timestamp = new Date().toISOString();

  // Momentum opportunity - capitalize on rising trends
  const momentumDim = snapshot.dimensions.find(d => d.dimension === 'momentum');
  if (momentumDim && momentumDim.value > 60 && momentumDim.trend === 'rising') {
    opportunities.push({
      opportunity_id: `opp_momentum_${Date.now()}`,
      type: 'momentum',
      potential_value: 'high',
      confidence: momentumDim.value,
      title: 'Capitalize on Rising Momentum',
      description: 'Creative momentum is strong and rising - ideal time to amplify successful strategies',
      evidence: [{
        source: 'signals_hub',
        signal: `Momentum at ${momentumDim.value.toFixed(0)}% and rising`,
        interpretation: 'Audience engagement is increasing across channels',
      }],
      actions: [
        {
          action_id: 'act_1',
          step: 1,
          action: 'Identify top-performing content from past 2 weeks',
          resources: ['Analytics', 'Performance data'],
          timeline: '1 day',
        },
        {
          action_id: 'act_2',
          step: 2,
          action: 'Create variations and expand to additional channels',
          resources: ['VIF', 'Production queue'],
          timeline: '3 days',
        },
        {
          action_id: 'act_3',
          step: 3,
          action: 'Increase posting frequency on high-performing channels',
          resources: ['Content calendar', 'Budget'],
          timeline: '1 week',
        },
      ],
      time_sensitivity: 'urgent',
      estimated_lift: '15-25% engagement increase',
    });
  }

  // Unexplored opportunity - test new methods
  const unexploredDim = snapshot.dimensions.find(d => d.dimension === 'unexplored_opportunity');
  if (unexploredDim && unexploredDim.value > 40) {
    opportunities.push({
      opportunity_id: `opp_methods_${Date.now()}`,
      type: 'method_discovery',
      potential_value: 'medium',
      confidence: 60,
      title: 'Untested Visual Methods Available',
      description: `${unexploredDim.value.toFixed(0)}% of VIF methods unused - potential for fresh creative approaches`,
      evidence: [{
        source: 'signals_hub',
        signal: `${unexploredDim.value.toFixed(0)}% methods untested`,
        interpretation: 'Large catalog of methods not yet explored',
      }],
      actions: [
        {
          action_id: 'act_1',
          step: 1,
          action: 'Review VIF catalog for methods matching brand personality',
          resources: ['VIF catalog', 'Brand guidelines'],
          timeline: '2 days',
        },
        {
          action_id: 'act_2',
          step: 2,
          action: 'Select 3-5 methods for small-scale testing',
          resources: ['Reactive engine'],
          timeline: '1 day',
        },
        {
          action_id: 'act_3',
          step: 3,
          action: 'Run A/B tests comparing new vs established methods',
          resources: ['A/B testing service'],
          timeline: '2 weeks',
        },
      ],
      time_sensitivity: 'flexible',
      estimated_lift: '10-20% engagement on new content',
    });
  }

  // Channel expansion from high-performing cycles
  const strongCycles = cycleReport.cycle_states.filter(s => s.health > 70 && s.momentum > 60);
  if (strongCycles.length > 0) {
    const cycle = strongCycles[0];
    opportunities.push({
      opportunity_id: `opp_expand_${Date.now()}`,
      type: 'channel_expansion',
      potential_value: 'medium',
      confidence: cycle.health,
      title: `Expand ${cycle.cycle} Success`,
      description: `${cycle.cycle} cycle performing well - opportunity to extend approach to related areas`,
      evidence: [{
        source: 'cycle_coordinator',
        signal: `${cycle.cycle} at ${cycle.health.toFixed(0)}% health, ${cycle.momentum.toFixed(0)}% momentum`,
        interpretation: 'Strong performance indicates scalable approach',
      }],
      actions: [
        {
          action_id: 'act_1',
          step: 1,
          action: `Document what's working in ${cycle.cycle}`,
          resources: ['Performance analysis'],
          timeline: '2 days',
        },
        {
          action_id: 'act_2',
          step: 2,
          action: 'Adapt successful elements for dependent cycles',
          resources: ['VIF', 'Templates'],
          timeline: '1 week',
        },
      ],
      time_sensitivity: 'timely',
      estimated_lift: '10-15% improvement in related cycles',
    });
  }

  // Brand extension from high resonance
  const resonanceDim = snapshot.dimensions.find(d => d.dimension === 'resonance');
  if (resonanceDim && resonanceDim.value > 70) {
    opportunities.push({
      opportunity_id: `opp_brand_${Date.now()}`,
      type: 'brand_extension',
      potential_value: 'high',
      confidence: resonanceDim.value,
      title: 'High Audience Resonance - Brand Extension',
      description: 'Strong audience connection suggests opportunity for brand expansion or new offerings',
      evidence: [{
        source: 'signals_hub',
        signal: `Resonance at ${resonanceDim.value.toFixed(0)}%`,
        interpretation: 'Audience deeply engaged with current brand positioning',
      }],
      actions: [
        {
          action_id: 'act_1',
          step: 1,
          action: 'Analyze which brand elements drive highest engagement',
          resources: ['Analytics', 'Content audit'],
          timeline: '3 days',
        },
        {
          action_id: 'act_2',
          step: 2,
          action: 'Develop brand extension concepts aligned with strengths',
          resources: ['Creative Director', 'Strategy'],
          timeline: '1 week',
        },
        {
          action_id: 'act_3',
          step: 3,
          action: 'Test extension with limited audience',
          resources: ['VIF', 'A/B testing'],
          timeline: '2 weeks',
        },
      ],
      time_sensitivity: 'timely',
      estimated_lift: '20-30% audience growth potential',
    });
  }

  // Alignment restoration opportunity
  const poorAlignments = cycleReport.alignments.filter(a => a.status === 'aligned');
  if (poorAlignments.length >= 5 && cycleReport.overall_coordination_score > 80) {
    opportunities.push({
      opportunity_id: `opp_coordinated_${Date.now()}`,
      type: 'audience_growth',
      potential_value: 'high',
      confidence: cycleReport.overall_coordination_score,
      title: 'Highly Coordinated Cycles - Growth Push',
      description: 'Creative cycles well-aligned - ideal conditions for aggressive growth campaign',
      evidence: [{
        source: 'cycle_coordinator',
        signal: `${cycleReport.overall_coordination_score.toFixed(0)}% coordination score`,
        interpretation: 'All creative systems working in harmony',
      }],
      actions: [
        {
          action_id: 'act_1',
          step: 1,
          action: 'Plan comprehensive multi-channel campaign',
          resources: ['Campaign surface', 'Budget'],
          timeline: '3 days',
        },
        {
          action_id: 'act_2',
          step: 2,
          action: 'Generate full asset bundle via VIF',
          resources: ['VIF', 'Production queue'],
          timeline: '1 week',
        },
        {
          action_id: 'act_3',
          step: 3,
          action: 'Launch coordinated burst across all channels',
          resources: ['Distribution', 'Monitoring'],
          timeline: '2 weeks',
        },
      ],
      time_sensitivity: 'urgent',
      estimated_lift: '25-40% reach increase',
    });
  }

  // Categorize opportunities
  const quickWins = opportunities.filter(o =>
    o.time_sensitivity !== 'urgent' &&
    o.actions.length <= 2
  );

  const strategic = opportunities.filter(o =>
    o.potential_value === 'high' &&
    o.actions.length >= 3
  );

  // Calculate total potential
  const valueScores = { high: 3, medium: 2, low: 1 };
  const totalPotential = opportunities.reduce(
    (sum, o) => sum + valueScores[o.potential_value] * (o.confidence / 100),
    0
  );

  return {
    workspace_id: workspaceId,
    timestamp,
    opportunities: opportunities.sort((a, b) => {
      const aScore = valueScores[a.potential_value] * a.confidence;
      const bScore = valueScores[b.potential_value] * b.confidence;
      return bScore - aScore;
    }),
    top_opportunity: opportunities[0] || null,
    quick_wins: quickWins,
    strategic_opportunities: strategic,
    total_potential_value: totalPotential,
  };
}

/**
 * Get opportunities by type
 */
export function getOpportunitiesByType(
  report: OpportunityReport,
  type: OpportunityType
): CreativeOpportunity[] {
  return report.opportunities.filter(o => o.type === type);
}

/**
 * Get time-sensitive opportunities
 */
export function getUrgentOpportunities(report: OpportunityReport): CreativeOpportunity[] {
  return report.opportunities.filter(o => o.time_sensitivity === 'urgent');
}

export default {
  detectCreativeOpportunities,
  getOpportunitiesByType,
  getUrgentOpportunities,
};
