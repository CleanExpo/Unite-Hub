/**
 * AGI Governor
 *
 * Enforces strict governance over multi-model AGI operations.
 * Validates all agent decisions against risk boundaries and founder rules.
 * Core component of "Strong Governor Mode" - founder maintains ultimate control.
 */

import { AgentDecision, GovernorOverride, ModelRoutingDecision } from './types';

export interface GovernancePolicy {
  id: string;
  createdAt: string;
  name: string;
  description: string;
  enabled: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  constraints: GovernanceConstraint[];
  requiresFounderApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface GovernanceConstraint {
  type: 'budget' | 'capability' | 'model' | 'frequency' | 'scope' | 'action' | 'escalation';
  operator: '<' | '<=' | '=' | '>=' | '>' | 'in' | 'not_in' | 'contains';
  value: any;
  reason: string;
}

export interface GovernanceAuditEntry {
  id: string;
  timestamp: string;
  decision: AgentDecision;
  policy: GovernancePolicy;
  validated: boolean;
  violations: string[];
  governorAction: 'approved' | 'rejected' | 'escalated' | 'modified' | 'overridden';
  founderOverride?: GovernorOverride;
  notes?: string;
}

export interface GovernanceReport {
  period: {
    start: string;
    end: string;
  };
  totalDecisions: number;
  approved: number;
  rejected: number;
  escalated: number;
  foundersOverrides: number;
  violationsDetected: number;
  riskTrend: 'increasing' | 'stable' | 'decreasing';
  recommendedActions: string[];
}

// In-memory governance policies and audit log
let governancePolicies: GovernancePolicy[] = [];
let auditLog: GovernanceAuditEntry[] = [];

/**
 * Create new governance policy
 */
export function createGovernancePolicy(policy: Omit<GovernancePolicy, 'id' | 'createdAt'>): GovernancePolicy {
  const newPolicy: GovernancePolicy = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...policy,
  };

  governancePolicies.push(newPolicy);
  return newPolicy;
}

/**
 * Get all active governance policies
 */
export function getActivePolicies(): GovernancePolicy[] {
  return governancePolicies.filter(p => p.enabled);
}

/**
 * Validate agent decision against all governance policies
 */
export function validateDecision(decision: AgentDecision): {
  valid: boolean;
  violations: string[];
  applicablePolicies: GovernancePolicy[];
  requiresApproval: boolean;
} {
  const violations: string[] = [];
  const applicablePolicies = getActivePolicies();

  for (const policy of applicablePolicies) {
    for (const constraint of policy.constraints) {
      const violation = checkConstraint(decision, constraint);
      if (violation) {
        violations.push(violation);
      }
    }
  }

  const valid = violations.length === 0;
  const requiresApproval = !valid || applicablePolicies.some(p => p.requiresFounderApproval);

  return {
    valid,
    violations,
    applicablePolicies,
    requiresApproval,
  };
}

/**
 * Check if decision violates a constraint
 */
function checkConstraint(decision: AgentDecision, constraint: GovernanceConstraint): string | null {
  const value = getDecisionValue(decision, constraint.type);

  if (value === null) return null;

  switch (constraint.operator) {
    case '<':
      if (!(value < constraint.value)) {
        return `${constraint.type} must be < ${constraint.value} (got ${value}): ${constraint.reason}`;
      }
      break;
    case '<=':
      if (!(value <= constraint.value)) {
        return `${constraint.type} must be <= ${constraint.value} (got ${value}): ${constraint.reason}`;
      }
      break;
    case '=':
      if (value !== constraint.value) {
        return `${constraint.type} must equal ${constraint.value} (got ${value}): ${constraint.reason}`;
      }
      break;
    case '>=':
      if (!(value >= constraint.value)) {
        return `${constraint.type} must be >= ${constraint.value} (got ${value}): ${constraint.reason}`;
      }
      break;
    case '>':
      if (!(value > constraint.value)) {
        return `${constraint.type} must be > ${constraint.value} (got ${value}): ${constraint.reason}`;
      }
      break;
    case 'in':
      if (!Array.isArray(constraint.value) || !constraint.value.includes(value)) {
        return `${constraint.type} must be in ${JSON.stringify(constraint.value)} (got ${value}): ${constraint.reason}`;
      }
      break;
    case 'not_in':
      if (Array.isArray(constraint.value) && constraint.value.includes(value)) {
        return `${constraint.type} must not be in ${JSON.stringify(constraint.value)}: ${constraint.reason}`;
      }
      break;
    case 'contains':
      if (typeof value === 'string' && !value.includes(constraint.value)) {
        return `${constraint.type} must contain "${constraint.value}": ${constraint.reason}`;
      }
      break;
  }

  return null;
}

/**
 * Extract value from decision based on constraint type
 */
function getDecisionValue(decision: AgentDecision, type: string): any {
  switch (type) {
    case 'budget':
      return decision.estimatedCost;
    case 'capability':
      return decision.requiredCapability;
    case 'model':
      return decision.modelId;
    case 'frequency':
      return decision.frequency;
    case 'scope':
      return decision.scope;
    case 'action':
      return decision.actionType;
    case 'escalation':
      return decision.escalationLevel;
    default:
      return null;
  }
}

/**
 * Process decision through governance
 */
export function governDecision(
  decision: AgentDecision,
  routing: ModelRoutingDecision
): {
  approved: boolean;
  action: 'execute' | 'escalate' | 'reject';
  violations: string[];
  approvalRequired: boolean;
  suggestedRevisions?: AgentDecision;
} {
  const validation = validateDecision(decision);

  if (validation.valid && !validation.requiresApproval) {
    return {
      approved: true,
      action: 'execute',
      violations: [],
      approvalRequired: false,
    };
  }

  if (validation.violations.length > 0 || validation.requiresApproval) {
    return {
      approved: false,
      action: 'escalate',
      violations: validation.violations,
      approvalRequired: true,
      suggestedRevisions: suggestRevisions(decision, validation.violations),
    };
  }

  return {
    approved: false,
    action: 'reject',
    violations: validation.violations,
    approvalRequired: false,
  };
}

/**
 * Suggest revisions to make decision compliant
 */
function suggestRevisions(decision: AgentDecision, violations: string[]): AgentDecision {
  const revised = { ...decision };

  for (const violation of violations) {
    // Parse violation message and apply conservative fixes
    if (violation.includes('cost')) {
      // Reduce estimated cost by 20%
      revised.estimatedCost = Math.max(0, decision.estimatedCost * 0.8);
    }
    if (violation.includes('frequency')) {
      // Reduce frequency by half
      revised.frequency = Math.max(1, Math.floor(decision.frequency / 2));
    }
    if (violation.includes('scope')) {
      // Narrow scope to 'limited'
      revised.scope = 'limited';
    }
  }

  return revised;
}

/**
 * Record governance audit entry
 */
export function recordAudit(
  decision: AgentDecision,
  policy: GovernancePolicy,
  action: 'approved' | 'rejected' | 'escalated' | 'modified' | 'overridden',
  violations: string[] = [],
  override?: GovernorOverride
): GovernanceAuditEntry {
  const entry: GovernanceAuditEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    decision,
    policy,
    validated: violations.length === 0,
    violations,
    governorAction: action,
    founderOverride: override,
  };

  auditLog.push(entry);
  return entry;
}

/**
 * Apply founder override to decision
 */
export function applyFounderOverride(
  decision: AgentDecision,
  override: GovernorOverride
): GovernanceAuditEntry {
  const policy = governancePolicies[0] || createDefaultPolicy();

  const entry = recordAudit(decision, policy, 'overridden', [], override);

  // Log the override event
  console.log(`Founder Override: ${override.reason}`);
  console.log(`Decision: ${JSON.stringify(decision)}`);

  return entry;
}

/**
 * Get governance audit log
 */
export function getAuditLog(limit = 100): GovernanceAuditEntry[] {
  return auditLog.slice(-limit);
}

/**
 * Generate governance report
 */
export function generateGovernanceReport(startDate: Date, endDate: Date): GovernanceReport {
  const start = startDate.toISOString();
  const end = endDate.toISOString();

  const relevant = auditLog.filter(
    entry => entry.timestamp >= start && entry.timestamp <= end
  );

  const approved = relevant.filter(e => e.governorAction === 'approved').length;
  const rejected = relevant.filter(e => e.governorAction === 'rejected').length;
  const escalated = relevant.filter(e => e.governorAction === 'escalated').length;
  const overridden = relevant.filter(e => e.governorAction === 'overridden').length;
  const violations = relevant.reduce((sum, e) => sum + e.violations.length, 0);

  // Determine trend
  const firstHalf = relevant.slice(0, Math.floor(relevant.length / 2));
  const secondHalf = relevant.slice(Math.floor(relevant.length / 2));

  const firstHalfViolations = firstHalf.reduce((sum, e) => sum + e.violations.length, 0);
  const secondHalfViolations = secondHalf.reduce((sum, e) => sum + e.violations.length, 0);

  let riskTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (secondHalfViolations > firstHalfViolations * 1.2) {
    riskTrend = 'increasing';
  } else if (secondHalfViolations < firstHalfViolations * 0.8) {
    riskTrend = 'decreasing';
  }

  const recommendedActions = [];
  if (escalated > approved * 0.5) {
    recommendedActions.push('Review governance policies - high escalation rate');
  }
  if (violations > 50) {
    recommendedActions.push('Audit agent training - frequent policy violations');
  }
  if (riskTrend === 'increasing') {
    recommendedActions.push('Implement additional safety checks');
  }

  return {
    period: { start, end },
    totalDecisions: relevant.length,
    approved,
    rejected,
    escalated,
    foundersOverrides: overridden,
    violationsDetected: violations,
    riskTrend,
    recommendedActions,
  };
}

/**
 * Create default governance policy
 */
function createDefaultPolicy(): GovernancePolicy {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: 'Default Safety Policy',
    description: 'Default governance policy enforcing basic safety constraints',
    enabled: true,
    riskLevel: 'medium',
    constraints: [
      {
        type: 'budget',
        operator: '<',
        value: 100,
        reason: 'Limit single decision cost to $100',
      },
      {
        type: 'frequency',
        operator: '<=',
        value: 10,
        reason: 'Limit decision frequency to 10 per hour',
      },
    ],
    requiresFounderApproval: false,
  };
}

/**
 * Enable/disable governance policy
 */
export function setGovernancePolicyEnabled(policyId: string, enabled: boolean): GovernancePolicy | null {
  const policy = governancePolicies.find(p => p.id === policyId);
  if (policy) {
    policy.enabled = enabled;
  }
  return policy || null;
}

/**
 * Get governance statistics
 */
export function getGovernanceStats() {
  const totalAuditEntries = auditLog.length;
  const approvals = auditLog.filter(e => e.governorAction === 'approved').length;
  const rejections = auditLog.filter(e => e.governorAction === 'rejected').length;
  const escalations = auditLog.filter(e => e.governorAction === 'escalated').length;
  const overrides = auditLog.filter(e => e.governorAction === 'overridden').length;

  const totalViolations = auditLog.reduce((sum, e) => sum + e.violations.length, 0);
  const violationRate = totalAuditEntries > 0 ? (totalViolations / totalAuditEntries) * 100 : 0;

  return {
    totalDecisions: totalAuditEntries,
    approvals,
    rejections,
    escalations,
    founderOverrides: overrides,
    totalViolations,
    averageViolationsPerDecision: totalAuditEntries > 0 ? totalViolations / totalAuditEntries : 0,
    violationRate: violationRate.toFixed(2) + '%',
    activePolicies: governancePolicies.filter(p => p.enabled).length,
  };
}
