/**
 * Creative Pressure Engine
 * Phase 71: Detect situations requiring creative action
 */

import { SignalsSnapshot, SignalDimension } from './creativeSignalsHub';
import { CycleCoordinationReport, CreativeCycle } from './cycleCoordinator';

export type PressureType =
  | 'creative_fatigue'
  | 'engagement_decline'
  | 'visual_stagnation'
  | 'brand_misalignment'
  | 'channel_underperformance'
  | 'method_exhaustion'
  | 'audience_disconnect';

export interface CreativePressure {
  pressure_id: string;
  type: PressureType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  affected_area: string;
  description: string;
  evidence: PressureEvidence[];
  interventions: PressureIntervention[];
  timeline: 'immediate' | 'this_week' | 'this_month';
}

export interface PressureEvidence {
  source: string;
  metric: string;
  value: number;
  threshold: number;
  delta?: number;
}

export interface PressureIntervention {
  intervention_id: string;
  type: 'quick_fix' | 'strategic' | 'experimental';
  action: string;
  expected_impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  resources_needed: string[];
}

export interface PressureReport {
  workspace_id: string;
  timestamp: string;
  pressures: CreativePressure[];
  overall_pressure_score: number;
  critical_count: number;
  priority_interventions: PressureIntervention[];
}

/**
 * Detect creative pressures from signals and cycle report
 */
export function detectCreativePressures(
  workspaceId: string,
  snapshot: SignalsSnapshot,
  cycleReport: CycleCoordinationReport
): PressureReport {
  const pressures: CreativePressure[] = [];
  const timestamp = new Date().toISOString();

  // Detect creative fatigue
  const fatigueDim = snapshot.dimensions.find(d => d.dimension === 'fatigue');
  if (fatigueDim && fatigueDim.value > 50) {
    pressures.push({
      pressure_id: `pressure_fatigue_${Date.now()}`,
      type: 'creative_fatigue',
      severity: fatigueDim.value > 70 ? 'critical' : fatigueDim.value > 60 ? 'high' : 'medium',
      score: fatigueDim.value,
      affected_area: 'All channels',
      description: 'Audience showing signs of content fatigue - declining engagement across channels',
      evidence: [{
        source: 'signals_hub',
        metric: 'fatigue_index',
        value: fatigueDim.value,
        threshold: 50,
      }],
      interventions: [
        {
          intervention_id: `int_refresh_${Date.now()}`,
          type: 'strategic',
          action: 'Launch creative refresh campaign with new visual direction',
          expected_impact: 'high',
          effort: 'high',
          resources_needed: ['VIF generation', 'Creative Director review', 'Production queue'],
        },
        {
          intervention_id: `int_format_${Date.now()}`,
          type: 'quick_fix',
          action: 'Switch to different content formats (e.g., video if mostly static)',
          expected_impact: 'medium',
          effort: 'low',
          resources_needed: ['VIF templates'],
        },
      ],
      timeline: fatigueDim.value > 70 ? 'immediate' : 'this_week',
    });
  }

  // Detect engagement decline
  const momentumDim = snapshot.dimensions.find(d => d.dimension === 'momentum');
  const resonanceDim = snapshot.dimensions.find(d => d.dimension === 'resonance');
  if (momentumDim && resonanceDim && momentumDim.value < 40 && resonanceDim.value < 40) {
    pressures.push({
      pressure_id: `pressure_engagement_${Date.now()}`,
      type: 'engagement_decline',
      severity: 'high',
      score: 100 - ((momentumDim.value + resonanceDim.value) / 2),
      affected_area: 'Engagement metrics',
      description: 'Both momentum and resonance low - content not connecting with audience',
      evidence: [
        { source: 'signals_hub', metric: 'momentum', value: momentumDim.value, threshold: 40 },
        { source: 'signals_hub', metric: 'resonance', value: resonanceDim.value, threshold: 40 },
      ],
      interventions: [
        {
          intervention_id: `int_audience_${Date.now()}`,
          type: 'strategic',
          action: 'Conduct audience research to realign content strategy',
          expected_impact: 'high',
          effort: 'medium',
          resources_needed: ['Analytics review', 'Audience insights'],
        },
        {
          intervention_id: `int_ab_${Date.now()}`,
          type: 'experimental',
          action: 'Run multiple A/B tests to find what resonates',
          expected_impact: 'medium',
          effort: 'medium',
          resources_needed: ['A/B testing service', 'Multiple variants'],
        },
      ],
      timeline: 'this_week',
    });
  }

  // Detect visual stagnation
  const stagnationDim = snapshot.dimensions.find(d => d.dimension === 'stagnation');
  if (stagnationDim && stagnationDim.value > 60) {
    pressures.push({
      pressure_id: `pressure_stagnation_${Date.now()}`,
      type: 'visual_stagnation',
      severity: stagnationDim.value > 80 ? 'high' : 'medium',
      score: stagnationDim.value,
      affected_area: 'Visual methods',
      description: 'Using same visual methods repeatedly - creative becoming predictable',
      evidence: [{
        source: 'signals_hub',
        metric: 'stagnation_index',
        value: stagnationDim.value,
        threshold: 60,
      }],
      interventions: [
        {
          intervention_id: `int_new_methods_${Date.now()}`,
          type: 'experimental',
          action: 'Test 3-5 new VIF methods from unexplored categories',
          expected_impact: 'medium',
          effort: 'low',
          resources_needed: ['VIF catalog', 'Production queue'],
        },
      ],
      timeline: 'this_week',
    });
  }

  // Detect brand misalignment from cycle report
  const brandCycle = cycleReport.cycle_states.find(s => s.cycle === 'brand');
  const misalignedWithBrand = cycleReport.alignments.filter(
    a => a.cycle_a === 'brand' && a.status !== 'aligned'
  );
  if (misalignedWithBrand.length >= 2) {
    pressures.push({
      pressure_id: `pressure_brand_${Date.now()}`,
      type: 'brand_misalignment',
      severity: 'high',
      score: 100 - (misalignedWithBrand.reduce((sum, a) => sum + a.alignment_score, 0) / misalignedWithBrand.length),
      affected_area: `${misalignedWithBrand.map(a => a.cycle_b).join(', ')}`,
      description: 'Multiple channels drifting from brand guidelines',
      evidence: misalignedWithBrand.map(a => ({
        source: 'cycle_coordinator',
        metric: `${a.cycle_b}_alignment`,
        value: a.alignment_score,
        threshold: 70,
      })),
      interventions: [
        {
          intervention_id: `int_brand_audit_${Date.now()}`,
          type: 'strategic',
          action: 'Run Creative Director brand consistency audit',
          expected_impact: 'high',
          effort: 'medium',
          resources_needed: ['Creative Director', 'Brand guidelines'],
        },
      ],
      timeline: 'this_week',
    });
  }

  // Detect channel underperformance
  const tensionDim = snapshot.dimensions.find(d => d.dimension === 'channel_tension');
  if (tensionDim && tensionDim.value > 50) {
    pressures.push({
      pressure_id: `pressure_channel_${Date.now()}`,
      type: 'channel_underperformance',
      severity: tensionDim.value > 70 ? 'high' : 'medium',
      score: tensionDim.value,
      affected_area: 'Channel distribution',
      description: 'High variance in channel performance - some channels significantly underperforming',
      evidence: [{
        source: 'signals_hub',
        metric: 'channel_tension',
        value: tensionDim.value,
        threshold: 50,
      }],
      interventions: [
        {
          intervention_id: `int_channel_review_${Date.now()}`,
          type: 'strategic',
          action: 'Review and reallocate resources from underperforming channels',
          expected_impact: 'medium',
          effort: 'low',
          resources_needed: ['Performance data', 'Budget planning'],
        },
        {
          intervention_id: `int_channel_adapt_${Date.now()}`,
          type: 'experimental',
          action: 'Adapt top-performing content for underperforming channels',
          expected_impact: 'medium',
          effort: 'medium',
          resources_needed: ['VIF adaptation', 'Channel templates'],
        },
      ],
      timeline: 'this_month',
    });
  }

  // Calculate overall pressure score
  const overallScore = pressures.length > 0
    ? pressures.reduce((sum, p) => sum + p.score, 0) / pressures.length
    : 0;

  // Get priority interventions
  const priorityInterventions = pressures
    .filter(p => p.severity === 'critical' || p.severity === 'high')
    .flatMap(p => p.interventions.filter(i => i.expected_impact === 'high'))
    .slice(0, 5);

  return {
    workspace_id: workspaceId,
    timestamp,
    pressures: pressures.sort((a, b) => b.score - a.score),
    overall_pressure_score: overallScore,
    critical_count: pressures.filter(p => p.severity === 'critical').length,
    priority_interventions: priorityInterventions,
  };
}

/**
 * Get pressures by severity
 */
export function getPressuresBySeverity(
  report: PressureReport,
  severity: CreativePressure['severity']
): CreativePressure[] {
  return report.pressures.filter(p => p.severity === severity);
}

/**
 * Get immediate action items
 */
export function getImmediateActions(report: PressureReport): PressureIntervention[] {
  return report.pressures
    .filter(p => p.timeline === 'immediate')
    .flatMap(p => p.interventions)
    .filter(i => i.type === 'quick_fix' || i.expected_impact === 'high');
}

export default {
  detectCreativePressures,
  getPressuresBySeverity,
  getImmediateActions,
};
