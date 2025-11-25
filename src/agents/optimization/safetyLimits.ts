/**
 * Safety Limits
 *
 * Defines hard risk constraints and safety envelopes for optimization.
 * Ensures auto-tuning never exceeds founder-approved risk thresholds.
 */

export interface RiskSafetyProfile {
  maxRiskLevel: 'low' | 'medium' | 'high';
  allowThresholdIncrease: boolean;
  requireApprovalAbove: 'low' | 'medium' | 'high';
  maxConcurrency?: number;
  maxBatchSize?: number;
  minHealthScore?: number;
}

/**
 * Default risk safety profile (conservative)
 */
export const defaultRiskSafetyProfile: RiskSafetyProfile = {
  maxRiskLevel: 'high',
  allowThresholdIncrease: false,
  requireApprovalAbove: 'medium',
  maxConcurrency: 100,
  maxBatchSize: 50,
  minHealthScore: 50,
};

/**
 * Aggressive profile (for mature, well-tested agents)
 */
export const aggressiveRiskProfile: RiskSafetyProfile = {
  maxRiskLevel: 'high',
  allowThresholdIncrease: true,
  requireApprovalAbove: 'high',
  maxConcurrency: 200,
  maxBatchSize: 100,
  minHealthScore: 40,
};

/**
 * Conservative profile (for critical operations)
 */
export const conservativeRiskProfile: RiskSafetyProfile = {
  maxRiskLevel: 'medium',
  allowThresholdIncrease: false,
  requireApprovalAbove: 'low',
  maxConcurrency: 50,
  maxBatchSize: 25,
  minHealthScore: 70,
};

/**
 * Check if a risk level is within the safety envelope
 */
export function isWithinRiskEnvelope(
  currentLevel: 'low' | 'medium' | 'high' | 'critical',
  profile: RiskSafetyProfile
): boolean {
  // Critical is never allowed
  if (currentLevel === 'critical') return false;

  // Check against max allowed level
  const levelOrder = { low: 0, medium: 1, high: 2, critical: 3 };
  const currentIdx = levelOrder[currentLevel];
  const maxIdx = levelOrder[profile.maxRiskLevel];

  return currentIdx <= maxIdx;
}

/**
 * Check if a change requires founder approval
 */
export function requiresFounderApproval(newLevel: 'low' | 'medium' | 'high', profile: RiskSafetyProfile): boolean {
  const order = ['low', 'medium', 'high'] as const;
  const newIdx = order.indexOf(newLevel);
  const reqIdx = order.indexOf(profile.requireApprovalAbove);

  return newIdx >= reqIdx;
}

/**
 * Validate a parameter against safety constraints
 */
export function validateAgainstSafetyLimits(
  param: string,
  value: number,
  profile: RiskSafetyProfile
): { valid: boolean; reason?: string } {
  if (param === 'concurrency' && profile.maxConcurrency !== undefined) {
    if (value > profile.maxConcurrency) {
      return {
        valid: false,
        reason: `Concurrency ${value} exceeds limit ${profile.maxConcurrency}`,
      };
    }
  }

  if (param === 'batch_size' && profile.maxBatchSize !== undefined) {
    if (value > profile.maxBatchSize) {
      return {
        valid: false,
        reason: `Batch size ${value} exceeds limit ${profile.maxBatchSize}`,
      };
    }
  }

  if (param === 'health_score' && profile.minHealthScore !== undefined) {
    if (value < profile.minHealthScore) {
      return {
        valid: false,
        reason: `Health score ${value} below minimum ${profile.minHealthScore}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Get recommended profile for an agent based on health
 */
export function recommendProfile(agentHealth: number): RiskSafetyProfile {
  if (agentHealth < 50) {
    return conservativeRiskProfile;
  } else if (agentHealth < 75) {
    return defaultRiskSafetyProfile;
  } else {
    return aggressiveRiskProfile;
  }
}

/**
 * Apply safety constraints to a proposed value
 */
export function applySafetyConstraints(
  param: string,
  proposedValue: number,
  profile: RiskSafetyProfile
): number {
  if (param === 'concurrency' && profile.maxConcurrency !== undefined) {
    return Math.min(proposedValue, profile.maxConcurrency);
  }

  if (param === 'batch_size' && profile.maxBatchSize !== undefined) {
    return Math.min(proposedValue, profile.maxBatchSize);
  }

  if (param === 'health_score' && profile.minHealthScore !== undefined) {
    return Math.max(proposedValue, profile.minHealthScore);
  }

  return proposedValue;
}
