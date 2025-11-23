/**
 * Creative Ops Grid Engine
 * Phase 71: Unified operations grid for founder visibility
 */

import { collectCreativeSignals, SignalsSnapshot } from './creativeSignalsHub';
import { generateCycleCoordinationReport, CycleCoordinationReport } from './cycleCoordinator';
import { detectCreativePressures, PressureReport } from './creativePressureEngine';
import { detectCreativeOpportunities, OpportunityReport } from './creativeOpportunityEngine';

export type GridZone = 'stability' | 'pressure' | 'opportunity' | 'expansion';

export interface OpsGridState {
  workspace_id: string;
  timestamp: string;
  zone: GridZone;
  zone_score: number; // 0-100
  health_score: number;
  pressure_score: number;
  opportunity_score: number;
  coordination_score: number;
}

export interface CreativeOpsBrief {
  brief_id: string;
  workspace_id: string;
  generated_at: string;
  period: string;

  // Summary
  headline: string;
  zone: GridZone;
  overall_status: 'excellent' | 'good' | 'attention_needed' | 'critical';

  // Key metrics
  key_metrics: {
    health: number;
    pressure: number;
    opportunity: number;
    coordination: number;
  };

  // Critical items
  critical_pressures: string[];
  top_opportunities: string[];
  cycle_issues: string[];

  // Recommendations
  immediate_actions: string[];
  this_week_priorities: string[];
  strategic_focus: string[];

  // Data quality
  data_completeness: number;
  confidence: number;
}

export interface FullOpsReport {
  workspace_id: string;
  timestamp: string;
  grid_state: OpsGridState;
  signals: SignalsSnapshot;
  cycles: CycleCoordinationReport;
  pressures: PressureReport;
  opportunities: OpportunityReport;
  brief: CreativeOpsBrief;
}

/**
 * Generate full operations report for a workspace
 */
export async function generateOpsReport(workspaceId: string): Promise<FullOpsReport> {
  const timestamp = new Date().toISOString();

  // Collect all data
  const signals = await collectCreativeSignals(workspaceId);
  const cycles = generateCycleCoordinationReport(workspaceId, signals);
  const pressures = detectCreativePressures(workspaceId, signals, cycles);
  const opportunities = detectCreativeOpportunities(workspaceId, signals, cycles);

  // Calculate grid state
  const gridState = calculateGridState(workspaceId, signals, pressures, opportunities, cycles);

  // Generate brief
  const brief = generateCreativeOpsBrief(workspaceId, gridState, signals, cycles, pressures, opportunities);

  return {
    workspace_id: workspaceId,
    timestamp,
    grid_state: gridState,
    signals,
    cycles,
    pressures,
    opportunities,
    brief,
  };
}

/**
 * Calculate grid zone and scores
 */
function calculateGridState(
  workspaceId: string,
  signals: SignalsSnapshot,
  pressures: PressureReport,
  opportunities: OpportunityReport,
  cycles: CycleCoordinationReport
): OpsGridState {
  const timestamp = new Date().toISOString();

  const healthScore = signals.overall_health;
  const pressureScore = pressures.overall_pressure_score;
  const coordinationScore = cycles.overall_coordination_score;

  // Calculate opportunity score
  const valueScores = { high: 3, medium: 2, low: 1 };
  const opportunityScore = opportunities.opportunities.length > 0
    ? Math.min(100, opportunities.opportunities.reduce(
        (sum, o) => sum + valueScores[o.potential_value] * (o.confidence / 100) * 10,
        0
      ))
    : 30;

  // Determine zone based on pressure-opportunity matrix
  let zone: GridZone;
  if (pressureScore > 60 && opportunityScore > 60) {
    zone = 'expansion'; // High pressure, high opportunity - dynamic state
  } else if (pressureScore > 50) {
    zone = 'pressure'; // High pressure - needs attention
  } else if (opportunityScore > 50) {
    zone = 'opportunity'; // Low pressure, high opportunity - growth time
  } else {
    zone = 'stability'; // Low pressure, low opportunity - maintain
  }

  // Calculate zone score
  let zoneScore: number;
  switch (zone) {
    case 'stability':
      zoneScore = (healthScore + coordinationScore) / 2;
      break;
    case 'pressure':
      zoneScore = 100 - pressureScore;
      break;
    case 'opportunity':
      zoneScore = opportunityScore;
      break;
    case 'expansion':
      zoneScore = (opportunityScore - pressureScore + 100) / 2;
      break;
  }

  return {
    workspace_id: workspaceId,
    timestamp,
    zone,
    zone_score: zoneScore,
    health_score: healthScore,
    pressure_score: pressureScore,
    opportunity_score: opportunityScore,
    coordination_score: coordinationScore,
  };
}

/**
 * Generate daily creative ops brief
 */
function generateCreativeOpsBrief(
  workspaceId: string,
  gridState: OpsGridState,
  signals: SignalsSnapshot,
  cycles: CycleCoordinationReport,
  pressures: PressureReport,
  opportunities: OpportunityReport
): CreativeOpsBrief {
  const timestamp = new Date().toISOString();
  const briefId = `brief_${workspaceId}_${Date.now()}`;

  // Determine overall status
  let overallStatus: CreativeOpsBrief['overall_status'];
  if (pressures.critical_count > 0 || gridState.health_score < 40) {
    overallStatus = 'critical';
  } else if (pressures.pressures.length > 3 || gridState.health_score < 60) {
    overallStatus = 'attention_needed';
  } else if (gridState.health_score >= 70 && pressures.pressures.length <= 1) {
    overallStatus = 'excellent';
  } else {
    overallStatus = 'good';
  }

  // Generate headline
  let headline: string;
  switch (gridState.zone) {
    case 'stability':
      headline = 'Creative systems stable - focus on optimization';
      break;
    case 'pressure':
      headline = `${pressures.pressures.length} pressure points require attention`;
      break;
    case 'opportunity':
      headline = `${opportunities.opportunities.length} growth opportunities identified`;
      break;
    case 'expansion':
      headline = 'Dynamic state - balance pressure relief with opportunity capture';
      break;
  }

  // Extract critical items
  const criticalPressures = pressures.pressures
    .filter(p => p.severity === 'critical' || p.severity === 'high')
    .map(p => p.description)
    .slice(0, 3);

  const topOpportunities = opportunities.opportunities
    .filter(o => o.potential_value === 'high')
    .map(o => o.title)
    .slice(0, 3);

  const cycleIssues = cycles.alignments
    .filter(a => a.status === 'critical_misalignment' || a.status === 'major_drift')
    .map(a => a.issues[0] || `${a.cycle_a}-${a.cycle_b} misalignment`)
    .slice(0, 3);

  // Generate recommendations
  const immediateActions = [
    ...pressures.priority_interventions.slice(0, 2).map(i => i.action),
    ...opportunities.opportunities
      .filter(o => o.time_sensitivity === 'urgent')
      .slice(0, 1)
      .map(o => o.actions[0]?.action || o.title),
  ];

  const weekPriorities = [
    ...pressures.pressures
      .filter(p => p.timeline === 'this_week')
      .slice(0, 2)
      .map(p => p.interventions[0]?.action || p.description),
    ...cycles.recommendations.slice(0, 1),
  ];

  const strategicFocus = [
    ...opportunities.strategic_opportunities.slice(0, 2).map(o => o.title),
  ];

  // Calculate data quality
  const dataCompleteness = signals.signals.filter(s =>
    s.metadata && Object.keys(s.metadata).length > 0
  ).length / signals.signals.length * 100;

  const confidence = (dataCompleteness + gridState.coordination_score) / 2;

  return {
    brief_id: briefId,
    workspace_id: workspaceId,
    generated_at: timestamp,
    period: 'Daily',
    headline,
    zone: gridState.zone,
    overall_status: overallStatus,
    key_metrics: {
      health: gridState.health_score,
      pressure: gridState.pressure_score,
      opportunity: gridState.opportunity_score,
      coordination: gridState.coordination_score,
    },
    critical_pressures: criticalPressures,
    top_opportunities: topOpportunities,
    cycle_issues: cycleIssues,
    immediate_actions: immediateActions.slice(0, 3),
    this_week_priorities: weekPriorities.slice(0, 3),
    strategic_focus: strategicFocus.slice(0, 2),
    data_completeness: dataCompleteness,
    confidence,
  };
}

/**
 * Get zone description
 */
export function getZoneDescription(zone: GridZone): string {
  switch (zone) {
    case 'stability':
      return 'Low pressure, steady performance - maintain current approach';
    case 'pressure':
      return 'Issues requiring attention - prioritize fixes';
    case 'opportunity':
      return 'Growth conditions favorable - capture opportunities';
    case 'expansion':
      return 'Dynamic state - balance pressure relief with growth';
  }
}

/**
 * Get zone color for UI
 */
export function getZoneColor(zone: GridZone): string {
  switch (zone) {
    case 'stability':
      return 'blue';
    case 'pressure':
      return 'red';
    case 'opportunity':
      return 'green';
    case 'expansion':
      return 'purple';
  }
}

export default {
  generateOpsReport,
  getZoneDescription,
  getZoneColor,
};
