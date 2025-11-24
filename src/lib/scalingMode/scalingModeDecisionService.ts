/**
 * Scaling Mode Decision Service
 * Phase 86: Determine recommendations based on scores
 */

import {
  ScalingModeConfig,
  ScalingHealthScores,
  ScalingModeDecision,
  ScalingRecommendation,
  ScalingMode,
} from './scalingModeTypes';
import { getNextMode, getPreviousMode } from './scalingModeConfigService';

/**
 * Decide next mode based on current state
 */
export function decideNextMode(
  config: ScalingModeConfig,
  scores: ScalingHealthScores,
  activeClients: number,
  safeCapacity: number
): ScalingModeDecision {
  const thresholds = config.guardrail_thresholds;
  const utilisation = safeCapacity > 0 ? activeClients / safeCapacity : 0;
  const reasons: string[] = [];

  // Check for freeze condition
  if (scores.overall_scaling_health_score < thresholds.freeze_below_health) {
    reasons.push(
      `Health score ${scores.overall_scaling_health_score.toFixed(0)} is below freeze threshold ${thresholds.freeze_below_health}`
    );
    return {
      recommendation: 'freeze',
      confidence: 0.9,
      reasons,
      can_auto_apply: false,
    };
  }

  // Check for decrease conditions
  const shouldDecrease = checkDecreaseConditions(scores, thresholds, reasons);
  if (shouldDecrease) {
    const prevMode = getPreviousMode(config.current_mode);
    return {
      recommendation: 'decrease_mode',
      confidence: 0.8,
      reasons,
      can_auto_apply: false, // Never auto-decrease
      next_mode: prevMode || config.current_mode,
    };
  }

  // Check for increase conditions
  const canIncrease = checkIncreaseConditions(
    scores,
    thresholds,
    utilisation,
    config.current_mode,
    reasons
  );

  if (canIncrease) {
    const nextMode = getNextMode(config.current_mode);
    if (nextMode) {
      return {
        recommendation: 'increase_mode',
        confidence: calculateConfidence(scores, thresholds),
        reasons,
        can_auto_apply: config.auto_mode_enabled && scores.overall_scaling_health_score >= 80,
        next_mode: nextMode,
      };
    }
  }

  // Default: hold
  reasons.push('Current mode is appropriate for health and utilisation levels.');
  return {
    recommendation: 'hold',
    confidence: 0.85,
    reasons,
    can_auto_apply: false,
  };
}

/**
 * Check if conditions warrant decreasing mode
 */
function checkDecreaseConditions(
  scores: ScalingHealthScores,
  thresholds: any,
  reasons: string[]
): boolean {
  let shouldDecrease = false;

  // High warning density
  if (scores.warning_density_score > thresholds.max_warning_density * 100) {
    reasons.push(
      `Warning density ${scores.warning_density_score.toFixed(0)}% exceeds threshold ${(thresholds.max_warning_density * 100).toFixed(0)}%`
    );
    shouldDecrease = true;
  }

  // High churn risk
  if (scores.churn_risk_score > thresholds.max_churn_risk * 100) {
    reasons.push(
      `Churn risk ${scores.churn_risk_score.toFixed(0)}% exceeds threshold ${(thresholds.max_churn_risk * 100).toFixed(0)}%`
    );
    shouldDecrease = true;
  }

  // High AI cost pressure
  if (scores.ai_cost_pressure_score > thresholds.max_ai_cost_pressure * 100) {
    reasons.push(
      `AI cost pressure ${scores.ai_cost_pressure_score.toFixed(0)}% exceeds threshold ${(thresholds.max_ai_cost_pressure * 100).toFixed(0)}%`
    );
    shouldDecrease = true;
  }

  // Poor infra health
  if (scores.infra_health_score < 50) {
    reasons.push(
      `Infrastructure health ${scores.infra_health_score.toFixed(0)} is below acceptable level`
    );
    shouldDecrease = true;
  }

  return shouldDecrease;
}

/**
 * Check if conditions allow increasing mode
 */
function checkIncreaseConditions(
  scores: ScalingHealthScores,
  thresholds: any,
  utilisation: number,
  currentMode: ScalingMode,
  reasons: string[]
): boolean {
  // Already at max mode
  if (currentMode === 'scale') {
    reasons.push('Already at maximum scaling mode.');
    return false;
  }

  // Health too low
  if (scores.overall_scaling_health_score < thresholds.min_health_for_increase) {
    reasons.push(
      `Health ${scores.overall_scaling_health_score.toFixed(0)} below increase threshold ${thresholds.min_health_for_increase}`
    );
    return false;
  }

  // Utilisation too high (not enough headroom)
  if (utilisation > thresholds.max_utilisation_for_increase) {
    reasons.push(
      `Utilisation ${(utilisation * 100).toFixed(0)}% too high for safe scaling`
    );
    return false;
  }

  // All checks passed
  reasons.push(
    `Health ${scores.overall_scaling_health_score.toFixed(0)} and utilisation ${(utilisation * 100).toFixed(0)}% support scaling up`
  );
  return true;
}

/**
 * Calculate confidence for the recommendation
 */
function calculateConfidence(
  scores: ScalingHealthScores,
  thresholds: any
): number {
  let confidence = 0.7;

  // Higher confidence with better health
  if (scores.overall_scaling_health_score >= 90) {
    confidence = 0.95;
  } else if (scores.overall_scaling_health_score >= 80) {
    confidence = 0.85;
  } else if (scores.overall_scaling_health_score >= 70) {
    confidence = 0.75;
  }

  return confidence;
}

/**
 * Check if onboarding should be frozen
 */
export function shouldFreezeOnboarding(
  scores: ScalingHealthScores,
  config: ScalingModeConfig
): boolean {
  const thresholds = config.guardrail_thresholds;

  // Freeze if health is very low
  if (scores.overall_scaling_health_score < thresholds.freeze_below_health) {
    return true;
  }

  // Freeze if warning density is too high
  if (scores.warning_density_score > thresholds.max_warning_density * 100) {
    return true;
  }

  // Freeze if churn risk is too high
  if (scores.churn_risk_score > thresholds.max_churn_risk * 100) {
    return true;
  }

  return false;
}

/**
 * Get recommendation display text
 */
export function getRecommendationText(recommendation: ScalingRecommendation): string {
  const texts: Record<ScalingRecommendation, string> = {
    hold: 'Maintain current mode',
    increase_mode: 'Safe to scale up',
    decrease_mode: 'Consider scaling down',
    freeze: 'Freeze new onboarding',
  };
  return texts[recommendation];
}
