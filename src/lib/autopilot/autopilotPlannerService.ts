/**
 * Autopilot Planner Service
 * Phase 89: Transform signals into structured actions and build playbooks
 */

import {
  RawAutopilotSignal,
  CreateActionInput,
  AutopilotAction,
  ActionCategory,
  RiskClass,
} from './autopilotTypes';

/**
 * Transform signals into actionable items
 */
export function transformSignalsToActions(
  signals: RawAutopilotSignal[],
  workspaceId: string
): CreateActionInput[] {
  const actions: CreateActionInput[] = [];

  for (const signal of signals) {
    const action = signalToAction(signal, workspaceId);
    if (action) {
      actions.push(action);
    }
  }

  return actions;
}

/**
 * Prioritise actions by impact/effort ratio
 */
export function prioritiseActions(actions: CreateActionInput[]): CreateActionInput[] {
  return actions
    .map(action => ({
      ...action,
      priorityScore: calculatePriorityScore(action),
    }))
    .sort((a, b) => (b as any).priorityScore - (a as any).priorityScore);
}

/**
 * Convert a signal to an action
 */
function signalToAction(
  signal: RawAutopilotSignal,
  workspaceId: string
): CreateActionInput | null {
  switch (signal.sourceEngine) {
    case 'early_warning':
      return earlyWarningToAction(signal);

    case 'performance_reality':
      return performanceRealityToAction(signal);

    case 'combat':
      return combatResultToAction(signal);

    case 'scaling_mode':
      return scalingModeToAction(signal);

    case 'founder_intel':
      return founderIntelToAction(signal);

    default:
      return null;
  }
}

// Early warning to action
function earlyWarningToAction(signal: RawAutopilotSignal): CreateActionInput {
  const severity = signal.severity || 'medium';
  const riskClass: RiskClass = severity === 'critical' ? 'high' : severity === 'warning' ? 'medium' : 'low';

  return {
    clientId: signal.clientId,
    category: 'risk',
    sourceEngine: 'early_warning',
    actionType: 'review_warning',
    riskClass,
    impactEstimate: riskClass === 'high' ? 0.9 : riskClass === 'medium' ? 0.6 : 0.3,
    effortEstimate: 0.2,
    title: `Review warning: ${signal.signalType}`,
    description: signal.data.message,
    payload: {
      warning_id: signal.data.id,
      warning_type: signal.signalType,
      threshold: signal.data.threshold_value,
      actual: signal.data.actual_value,
    },
    truthNotes: 'Requires manual review to determine appropriate response.',
  };
}

// Performance reality to action
function performanceRealityToAction(signal: RawAutopilotSignal): CreateActionInput | null {
  const confidence = signal.data.overall_confidence || 0;

  // Only create action for low confidence or specific recommendations
  if (confidence > 0.7 && !signal.data.recommendation) {
    return null;
  }

  return {
    clientId: signal.clientId,
    category: 'optimisation',
    sourceEngine: 'performance_reality',
    actionType: 'review_performance',
    riskClass: confidence < 0.3 ? 'high' : confidence < 0.5 ? 'medium' : 'low',
    impactEstimate: 0.5,
    effortEstimate: 0.3,
    title: `Review performance: ${signal.data.recommendation || 'Low confidence'}`,
    description: `Performance confidence at ${(confidence * 100).toFixed(0)}%`,
    payload: {
      snapshot_id: signal.data.id,
      confidence,
      recommendation: signal.data.recommendation,
    },
    truthNotes: `Confidence: ${(confidence * 100).toFixed(0)}%. Review recommended.`,
  };
}

// Combat result to action
function combatResultToAction(signal: RawAutopilotSignal): CreateActionInput | null {
  if (signal.data.result_type === 'inconclusive') {
    return null;
  }

  const isWinner = signal.data.result_type === 'winner';

  if (isWinner && signal.data.winner_promoted) {
    // Already promoted
    return null;
  }

  return {
    clientId: signal.clientId,
    category: 'creative',
    sourceEngine: 'combat',
    actionType: isWinner ? 'promote_winner' : 'handle_tie',
    riskClass: 'low',
    impactEstimate: isWinner ? 0.7 : 0.3,
    effortEstimate: 0.1,
    title: isWinner
      ? `Promote combat winner (+${signal.data.lift_percent?.toFixed(1)}% lift)`
      : 'Review combat tie result',
    description: `Combat round ${signal.data.round_id} completed`,
    payload: {
      result_id: signal.data.id,
      round_id: signal.data.round_id,
      result_type: signal.data.result_type,
      lift_percent: signal.data.lift_percent,
    },
  };
}

// Scaling mode to action
function scalingModeToAction(signal: RawAutopilotSignal): CreateActionInput | null {
  const recommendation = signal.data.recommendation;

  if (recommendation === 'hold') {
    return null;
  }

  const riskClass: RiskClass = recommendation === 'freeze' ? 'high' :
    recommendation === 'decrease_mode' ? 'medium' : 'low';

  return {
    category: 'scaling',
    sourceEngine: 'scaling_mode',
    actionType: 'review_scaling',
    riskClass,
    impactEstimate: riskClass === 'high' ? 0.9 : 0.6,
    effortEstimate: 0.4,
    title: `Scaling recommendation: ${recommendation.replace('_', ' ')}`,
    description: `Health score: ${signal.data.health_score?.toFixed(0)}%, Utilisation: ${(signal.data.utilisation * 100).toFixed(0)}%`,
    payload: {
      snapshot_id: signal.data.id,
      current_mode: signal.data.current_mode,
      recommendation,
      health_score: signal.data.health_score,
    },
    truthNotes: 'Scaling changes require careful consideration of current capacity.',
  };
}

// Founder intel to action
function founderIntelToAction(signal: RawAutopilotSignal): CreateActionInput {
  return {
    category: 'reporting',
    sourceEngine: 'founder_intel',
    actionType: 'generate_report',
    riskClass: 'low',
    impactEstimate: 0.3,
    effortEstimate: 0.1,
    title: 'Generate weekly founder intel report',
    description: 'Compile insights from latest founder intel snapshot',
    payload: {
      snapshot_id: signal.data.id,
    },
  };
}

// Calculate priority score
function calculatePriorityScore(action: CreateActionInput): number {
  // Priority = (Impact * RiskWeight) / Effort
  const riskWeights: Record<RiskClass, number> = {
    high: 1.5,
    medium: 1.0,
    low: 0.8,
  };

  const riskWeight = riskWeights[action.riskClass];
  const effort = Math.max(0.1, action.effortEstimate);

  return (action.impactEstimate * riskWeight) / effort;
}
