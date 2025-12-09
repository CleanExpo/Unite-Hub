/**
 * Risk Envelope
 *
 * Defines hard boundaries for acceptable risk in agent operations.
 * Prevents certain classes of decisions from being made without founder approval.
 */

import { RiskBoundary } from './types';

export interface RiskProfile {
  id: string;
  name: string;
  description: string;
  boundaries: RiskBoundary[];
  createdAt: string;
  updatedAt: string;
  founderApproved: boolean;
}

export interface RiskAssessment {
  decisionId: string;
  riskScore: number; // 0-100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  violations: RiskViolation[];
  requiresApproval: boolean;
  recommendation: string;
}

export interface RiskViolation {
  boundaryId: string;
  boundaryName: string;
  dimension: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actualValue: number;
  threshold: number;
  exceedancePercent: number;
  message: string;
}

// Default risk boundaries for different dimensions
const defaultBoundaries: RiskBoundary[] = [
  {
    id: 'cost-daily-limit',
    name: 'Daily Cost Limit',
    description: 'Maximum API spend per day',
    dimension: 'cost',
    severity: 'critical',
    threshold: 500, // $500 per day
    unit: 'USD',
    founderApprovalRequired: true,
  },
  {
    id: 'cost-single-request',
    name: 'Single Request Cost Limit',
    description: 'Maximum cost for a single request',
    dimension: 'cost',
    severity: 'high',
    threshold: 50, // $50 per request
    unit: 'USD',
    founderApprovalRequired: false,
  },
  {
    id: 'latency-critical-path',
    name: 'Critical Path Latency',
    description: 'Maximum latency for critical operations',
    dimension: 'latency',
    severity: 'high',
    threshold: 5000, // 5 seconds
    unit: 'ms',
    founderApprovalRequired: false,
  },
  {
    id: 'accuracy-safety-critical',
    name: 'Safety-Critical Accuracy',
    description: 'Minimum accuracy for safety-critical operations',
    dimension: 'accuracy',
    severity: 'critical',
    threshold: 95, // 95% minimum
    unit: '%',
    founderApprovalRequired: true,
  },
  {
    id: 'frequency-rate-limit',
    name: 'Decision Frequency Limit',
    description: 'Maximum decisions per hour',
    dimension: 'frequency',
    severity: 'medium',
    threshold: 1000, // 1000 decisions/hour
    unit: 'per hour',
    founderApprovalRequired: false,
  },
  {
    id: 'scope-max-impact',
    name: 'Maximum Impact Scope',
    description: 'Maximum number of contacts affected by single decision',
    dimension: 'scope',
    severity: 'high',
    threshold: 10000, // 10,000 contacts
    unit: 'contacts',
    founderApprovalRequired: true,
  },
];

// Risk profiles
const riskProfiles: RiskProfile[] = [
  {
    id: 'conservative',
    name: 'Conservative Risk Profile',
    description: 'Strict boundaries, high approval requirements',
    boundaries: defaultBoundaries.map(b => ({
      ...b,
      threshold: Math.min(b.threshold * 0.5, b.threshold - 100),
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    founderApproved: true,
  },
  {
    id: 'balanced',
    name: 'Balanced Risk Profile',
    description: 'Moderate boundaries with selective approvals',
    boundaries: defaultBoundaries,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    founderApproved: true,
  },
  {
    id: 'aggressive',
    name: 'Aggressive Risk Profile',
    description: 'Relaxed boundaries, minimal approvals',
    boundaries: defaultBoundaries.map(b => ({
      ...b,
      threshold: Math.min(b.threshold * 2, b.threshold + 200),
      founderApprovalRequired: false,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    founderApproved: false, // Requires founder approval to enable
  },
];

let activeProfile = riskProfiles[1]; // Default to balanced

/**
 * Get active risk profile
 */
export function getActiveProfile(): RiskProfile {
  return activeProfile;
}

/**
 * Set active risk profile
 */
export function setActiveProfile(profileId: string): RiskProfile | null {
  const profile = riskProfiles.find(p => p.id === profileId);
  if (!profile) {
return null;
}

  if (!profile.founderApproved && profileId !== 'balanced') {
    console.warn(`Risk profile ${profileId} not founder-approved. Requires approval to enable.`);
    return null;
  }

  activeProfile = profile;
  return profile;
}

/**
 * Get all available risk profiles
 */
export function getAllProfiles(): RiskProfile[] {
  return [...riskProfiles];
}

/**
 * Create custom risk profile
 */
export function createCustomProfile(
  name: string,
  description: string,
  boundaries: RiskBoundary[]
): RiskProfile {
  const profile: RiskProfile = {
    id: crypto.randomUUID(),
    name,
    description,
    boundaries,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    founderApproved: false, // Custom profiles need approval
  };

  riskProfiles.push(profile);
  return profile;
}

/**
 * Assess risk of a decision
 */
export function assessRisk(decision: {
  estimatedCost: number;
  estimatedLatency: number;
  estimatedAccuracy: number;
  affectedContacts: number;
  operationType: string;
}): RiskAssessment {
  const profile = getActiveProfile();
  const violations: RiskViolation[] = [];
  let riskScore = 0;

  // Check each boundary
  for (const boundary of profile.boundaries) {
    const exceedance = checkBoundaryViolation(decision, boundary);

    if (exceedance.violated) {
      violations.push({
        boundaryId: boundary.id,
        boundaryName: boundary.name,
        dimension: boundary.dimension,
        severity: boundary.severity,
        actualValue: exceedance.actualValue,
        threshold: boundary.threshold,
        exceedancePercent: exceedance.percent,
        message: exceedance.message,
      });

      // Increase risk score based on severity
      const severityScore =
        boundary.severity === 'critical' ? 50 : boundary.severity === 'high' ? 30 : 15;
      riskScore += severityScore;
    }
  }

  // Clamp risk score to 0-100
  riskScore = Math.min(100, riskScore);

  // Determine risk level
  let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  if (violations.some(v => v.severity === 'critical')) {
    riskLevel = 'critical';
  } else if (violations.length > 3 || riskScore > 70) {
    riskLevel = 'high';
  } else if (violations.length > 1 || riskScore > 40) {
    riskLevel = 'medium';
  } else if (violations.length > 0) {
    riskLevel = 'low';
  } else {
    riskLevel = 'safe';
  }

  // Determine if approval required
  const requiresApproval =
    violations.some(v => v.severity === 'critical') ||
    violations.some(v => profile.boundaries.find(b => b.id === v.boundaryId)?.founderApprovalRequired);

  // Generate recommendation
  let recommendation = 'Decision is within acceptable risk boundaries.';
  if (violations.length > 0) {
    recommendation = `Decision violates ${violations.length} risk boundary/boundaries. `;
    if (requiresApproval) {
      recommendation += 'Founder approval required.';
    } else {
      recommendation += 'Review recommended.';
    }
  }

  return {
    decisionId: crypto.randomUUID(),
    riskScore,
    riskLevel,
    violations,
    requiresApproval,
    recommendation,
  };
}

/**
 * Check if decision violates a boundary
 */
function checkBoundaryViolation(
  decision: any,
  boundary: RiskBoundary
): {
  violated: boolean;
  actualValue: number;
  percent: number;
  message: string;
} {
  let actualValue = 0;
  let isViolation = false;

  switch (boundary.dimension) {
    case 'cost':
      actualValue = decision.estimatedCost || 0;
      isViolation = actualValue > boundary.threshold;
      break;
    case 'latency':
      actualValue = decision.estimatedLatency || 0;
      isViolation = actualValue > boundary.threshold;
      break;
    case 'accuracy':
      actualValue = decision.estimatedAccuracy || 100;
      isViolation = actualValue < boundary.threshold; // Lower is worse for accuracy
      break;
    case 'scope':
      actualValue = decision.affectedContacts || 0;
      isViolation = actualValue > boundary.threshold;
      break;
    case 'frequency':
      actualValue = decision.frequency || 0;
      isViolation = actualValue > boundary.threshold;
      break;
  }

  const percent = isViolation
    ? boundary.dimension === 'accuracy'
      ? ((boundary.threshold - actualValue) / boundary.threshold) * 100
      : ((actualValue - boundary.threshold) / boundary.threshold) * 100
    : 0;

  const message = isViolation
    ? `${boundary.name}: ${actualValue} exceeds limit of ${boundary.threshold} ${boundary.unit}`
    : '';

  return {
    violated: isViolation,
    actualValue,
    percent: Math.round(percent),
    message,
  };
}

/**
 * Adjust boundary threshold
 */
export function adjustBoundaryThreshold(
  profileId: string,
  boundaryId: string,
  newThreshold: number
): boolean {
  const profile = riskProfiles.find(p => p.id === profileId);
  if (!profile) {
return false;
}

  const boundary = profile.boundaries.find(b => b.id === boundaryId);
  if (!boundary) {
return false;
}

  boundary.threshold = newThreshold;
  profile.updatedAt = new Date().toISOString();

  return true;
}

/**
 * Get risk violations history
 */
export function getRiskViolationStats(): {
  totalAssessments: number;
  violationsDetected: number;
  criticalViolations: number;
  mostViolatedBoundary: string;
} {
  // This would typically query audit log
  // For now, return summary stats
  return {
    totalAssessments: 0,
    violationsDetected: 0,
    criticalViolations: 0,
    mostViolatedBoundary: 'none',
  };
}

/**
 * Recommend profile based on risk tolerance
 */
export function recommendProfile(riskTolerance: 'low' | 'medium' | 'high'): string {
  switch (riskTolerance) {
    case 'low':
      return 'conservative';
    case 'medium':
      return 'balanced';
    case 'high':
      return 'aggressive';
  }
}

/**
 * Get boundary details
 */
export function getBoundary(boundaryId: string): RiskBoundary | null {
  const profile = getActiveProfile();
  return profile.boundaries.find(b => b.id === boundaryId) || null;
}

/**
 * List all boundaries in active profile
 */
export function listActiveBoundaries(): RiskBoundary[] {
  return getActiveProfile().boundaries;
}

/**
 * Approve custom profile for use
 */
export function approveProfile(profileId: string): RiskProfile | null {
  const profile = riskProfiles.find(p => p.id === profileId);
  if (!profile) {
return null;
}

  profile.founderApproved = true;
  profile.updatedAt = new Date().toISOString();

  return profile;
}

/**
 * Revoke profile approval
 */
export function revokeProfileApproval(profileId: string): RiskProfile | null {
  if (profileId === 'balanced') {
    console.warn('Cannot revoke approval for default balanced profile');
    return null;
  }

  const profile = riskProfiles.find(p => p.id === profileId);
  if (!profile) {
return null;
}

  profile.founderApproved = false;
  profile.updatedAt = new Date().toISOString();

  return profile;
}
