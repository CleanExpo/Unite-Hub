/**
 * Cycle Coordinator
 * Phase 71: Map and sync creative cycles across channels and formats
 */

import { SignalsSnapshot, SignalDimension } from './creativeSignalsHub';

export type CreativeCycle =
  | 'brand'
  | 'social'
  | 'website'
  | 'ads'
  | 'content'
  | 'seo'
  | 'visuals';

export interface CycleState {
  cycle: CreativeCycle;
  health: number; // 0-100
  momentum: number; // 0-100
  last_updated: string;
  key_metrics: CycleMetric[];
}

export interface CycleMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export interface CycleAlignment {
  cycle_a: CreativeCycle;
  cycle_b: CreativeCycle;
  alignment_score: number; // 0-100
  drift: number;
  status: 'aligned' | 'minor_drift' | 'major_drift' | 'critical_misalignment';
  issues: string[];
}

export interface CycleSyncEvent {
  event_id: string;
  timestamp: string;
  source_cycle: CreativeCycle;
  affected_cycles: CreativeCycle[];
  event_type: 'sync_triggered' | 'drift_detected' | 'alignment_restored';
  severity: 'info' | 'warning' | 'action_required';
  description: string;
  recommended_actions: string[];
}

export interface CycleCoordinationReport {
  workspace_id: string;
  timestamp: string;
  cycle_states: CycleState[];
  alignments: CycleAlignment[];
  sync_events: CycleSyncEvent[];
  overall_coordination_score: number;
  primary_bottleneck: CreativeCycle | null;
  recommendations: string[];
}

// Cycle dependencies: which cycles influence which
const CYCLE_DEPENDENCIES: Record<CreativeCycle, CreativeCycle[]> = {
  brand: ['social', 'website', 'ads', 'content', 'visuals'],
  social: ['content', 'visuals', 'seo'],
  website: ['seo', 'content', 'visuals'],
  ads: ['visuals', 'content'],
  content: ['seo', 'social'],
  seo: ['content', 'website'],
  visuals: ['social', 'ads', 'website'],
};

/**
 * Calculate cycle states from signals snapshot
 */
export function calculateCycleStates(
  snapshot: SignalsSnapshot
): CycleState[] {
  const timestamp = new Date().toISOString();

  // Map dimensions to cycles
  const cycleConfigs: { cycle: CreativeCycle; dimensions: SignalDimension[] }[] = [
    { cycle: 'brand', dimensions: ['resonance', 'stagnation'] },
    { cycle: 'social', dimensions: ['momentum', 'fatigue', 'resonance'] },
    { cycle: 'website', dimensions: ['resonance', 'channel_tension'] },
    { cycle: 'ads', dimensions: ['momentum', 'resonance'] },
    { cycle: 'content', dimensions: ['stagnation', 'unexplored_opportunity'] },
    { cycle: 'seo', dimensions: ['momentum', 'resonance'] },
    { cycle: 'visuals', dimensions: ['stagnation', 'fatigue', 'unexplored_opportunity'] },
  ];

  return cycleConfigs.map(config => {
    const relevantDimensions = snapshot.dimensions.filter(
      d => config.dimensions.includes(d.dimension)
    );

    // Calculate health from dimension values
    const healthValues = relevantDimensions.map(d => {
      // Invert negative dimensions (stagnation, fatigue)
      if (d.dimension === 'stagnation' || d.dimension === 'fatigue') {
        return 100 - d.value;
      }
      return d.value;
    });

    const health = healthValues.length > 0
      ? healthValues.reduce((a, b) => a + b, 0) / healthValues.length
      : 50;

    // Calculate momentum from trends
    const risingCount = relevantDimensions.filter(d => d.trend === 'rising').length;
    const fallingCount = relevantDimensions.filter(d => d.trend === 'falling').length;
    const momentum = relevantDimensions.length > 0
      ? ((risingCount - fallingCount) / relevantDimensions.length + 1) * 50
      : 50;

    return {
      cycle: config.cycle,
      health,
      momentum,
      last_updated: timestamp,
      key_metrics: relevantDimensions.map(d => ({
        name: d.dimension,
        value: d.value,
        unit: '%',
        trend: d.trend === 'rising' ? 'up' : d.trend === 'falling' ? 'down' : 'stable',
      })),
    };
  });
}

/**
 * Calculate alignments between dependent cycles
 */
export function calculateCycleAlignments(
  cycleStates: CycleState[]
): CycleAlignment[] {
  const alignments: CycleAlignment[] = [];
  const stateMap = new Map(cycleStates.map(s => [s.cycle, s]));

  for (const [sourceCycle, dependentCycles] of Object.entries(CYCLE_DEPENDENCIES)) {
    const sourceState = stateMap.get(sourceCycle as CreativeCycle);
    if (!sourceState) continue;

    for (const depCycle of dependentCycles) {
      const depState = stateMap.get(depCycle);
      if (!depState) continue;

      // Calculate alignment based on health difference
      const healthDiff = Math.abs(sourceState.health - depState.health);
      const momentumDiff = Math.abs(sourceState.momentum - depState.momentum);
      const drift = (healthDiff + momentumDiff) / 2;
      const alignmentScore = 100 - drift;

      // Determine status
      let status: CycleAlignment['status'];
      if (drift < 15) status = 'aligned';
      else if (drift < 30) status = 'minor_drift';
      else if (drift < 50) status = 'major_drift';
      else status = 'critical_misalignment';

      // Identify issues
      const issues: string[] = [];
      if (healthDiff > 30) {
        issues.push(`Health gap: ${sourceCycle} (${sourceState.health.toFixed(0)}) vs ${depCycle} (${depState.health.toFixed(0)})`);
      }
      if (momentumDiff > 30) {
        issues.push(`Momentum gap: ${sourceCycle} trending ${sourceState.momentum > 50 ? 'up' : 'down'} while ${depCycle} ${depState.momentum > 50 ? 'up' : 'down'}`);
      }

      alignments.push({
        cycle_a: sourceCycle as CreativeCycle,
        cycle_b: depCycle,
        alignment_score: alignmentScore,
        drift,
        status,
        issues,
      });
    }
  }

  return alignments.sort((a, b) => a.alignment_score - b.alignment_score);
}

/**
 * Detect sync events based on alignments
 */
export function detectSyncEvents(
  alignments: CycleAlignment[],
  previousAlignments?: CycleAlignment[]
): CycleSyncEvent[] {
  const events: CycleSyncEvent[] = [];
  const timestamp = new Date().toISOString();

  for (const alignment of alignments) {
    // Check for critical misalignments
    if (alignment.status === 'critical_misalignment') {
      events.push({
        event_id: `sync_${alignment.cycle_a}_${alignment.cycle_b}_${Date.now()}`,
        timestamp,
        source_cycle: alignment.cycle_a,
        affected_cycles: [alignment.cycle_b],
        event_type: 'drift_detected',
        severity: 'action_required',
        description: `Critical misalignment between ${alignment.cycle_a} and ${alignment.cycle_b} (${alignment.drift.toFixed(0)}% drift)`,
        recommended_actions: [
          `Review ${alignment.cycle_a} strategy and its impact on ${alignment.cycle_b}`,
          `Consider synchronizing ${alignment.cycle_b} with recent ${alignment.cycle_a} changes`,
          ...alignment.issues.map(i => `Address: ${i}`),
        ],
      });
    } else if (alignment.status === 'major_drift') {
      events.push({
        event_id: `sync_${alignment.cycle_a}_${alignment.cycle_b}_${Date.now()}`,
        timestamp,
        source_cycle: alignment.cycle_a,
        affected_cycles: [alignment.cycle_b],
        event_type: 'drift_detected',
        severity: 'warning',
        description: `Major drift between ${alignment.cycle_a} and ${alignment.cycle_b} (${alignment.drift.toFixed(0)}% drift)`,
        recommended_actions: [
          `Monitor ${alignment.cycle_b} for continued divergence`,
          `Plan alignment actions within 7 days`,
        ],
      });
    }

    // Check for alignment restoration
    if (previousAlignments) {
      const prevAlignment = previousAlignments.find(
        a => a.cycle_a === alignment.cycle_a && a.cycle_b === alignment.cycle_b
      );
      if (prevAlignment &&
          prevAlignment.status !== 'aligned' &&
          alignment.status === 'aligned') {
        events.push({
          event_id: `sync_restored_${alignment.cycle_a}_${alignment.cycle_b}_${Date.now()}`,
          timestamp,
          source_cycle: alignment.cycle_a,
          affected_cycles: [alignment.cycle_b],
          event_type: 'alignment_restored',
          severity: 'info',
          description: `Alignment restored between ${alignment.cycle_a} and ${alignment.cycle_b}`,
          recommended_actions: ['Maintain current coordination approach'],
        });
      }
    }
  }

  return events;
}

/**
 * Generate full cycle coordination report
 */
export function generateCycleCoordinationReport(
  workspaceId: string,
  snapshot: SignalsSnapshot,
  previousReport?: CycleCoordinationReport
): CycleCoordinationReport {
  const cycleStates = calculateCycleStates(snapshot);
  const alignments = calculateCycleAlignments(cycleStates);
  const syncEvents = detectSyncEvents(
    alignments,
    previousReport?.alignments
  );

  // Calculate overall coordination score
  const avgAlignment = alignments.length > 0
    ? alignments.reduce((sum, a) => sum + a.alignment_score, 0) / alignments.length
    : 100;

  // Find primary bottleneck
  const worstCycle = cycleStates.sort((a, b) => a.health - b.health)[0];
  const primaryBottleneck = worstCycle && worstCycle.health < 50
    ? worstCycle.cycle
    : null;

  // Generate recommendations
  const recommendations: string[] = [];

  if (avgAlignment < 70) {
    recommendations.push('Multiple cycle misalignments detected - consider full creative audit');
  }

  const criticalAlignments = alignments.filter(a => a.status === 'critical_misalignment');
  if (criticalAlignments.length > 0) {
    recommendations.push(
      `Priority: Address ${criticalAlignments.map(a => `${a.cycle_a}→${a.cycle_b}`).join(', ')} misalignments`
    );
  }

  if (primaryBottleneck) {
    recommendations.push(`Focus improvement on ${primaryBottleneck} cycle (currently ${worstCycle.health.toFixed(0)}% health)`);
  }

  const lowMomentumCycles = cycleStates.filter(s => s.momentum < 40);
  if (lowMomentumCycles.length > 0) {
    recommendations.push(
      `Boost momentum in: ${lowMomentumCycles.map(s => s.cycle).join(', ')}`
    );
  }

  return {
    workspace_id: workspaceId,
    timestamp: new Date().toISOString(),
    cycle_states: cycleStates,
    alignments,
    sync_events: syncEvents,
    overall_coordination_score: avgAlignment,
    primary_bottleneck: primaryBottleneck,
    recommendations,
  };
}

/**
 * Get cycles that need attention
 */
export function getCyclesNeedingAttention(
  report: CycleCoordinationReport
): { cycle: CreativeCycle; reason: string; priority: 'high' | 'medium' | 'low' }[] {
  const results: { cycle: CreativeCycle; reason: string; priority: 'high' | 'medium' | 'low' }[] = [];

  for (const state of report.cycle_states) {
    if (state.health < 40) {
      results.push({
        cycle: state.cycle,
        reason: `Low health (${state.health.toFixed(0)}%)`,
        priority: 'high',
      });
    } else if (state.health < 60) {
      results.push({
        cycle: state.cycle,
        reason: `Below average health (${state.health.toFixed(0)}%)`,
        priority: 'medium',
      });
    }

    if (state.momentum < 30) {
      results.push({
        cycle: state.cycle,
        reason: `Low momentum (${state.momentum.toFixed(0)}%)`,
        priority: 'high',
      });
    }
  }

  // Add misalignment-based needs
  for (const alignment of report.alignments) {
    if (alignment.status === 'critical_misalignment') {
      results.push({
        cycle: alignment.cycle_b,
        reason: `Misaligned with ${alignment.cycle_a}`,
        priority: 'high',
      });
    }
  }

  return results.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export default {
  calculateCycleStates,
  calculateCycleAlignments,
  detectSyncEvents,
  generateCycleCoordinationReport,
  getCyclesNeedingAttention,
};
