/**
 * M1 Governance Manager
 *
 * Comprehensive governance and policy management with change control, audit trails, and compliance
 * Enforces organizational policies, manages approvals, and maintains audit logs
 *
 * Version: v2.8.0
 * Phase: 15A - Advanced Governance
 */

export type PolicyType = 'security' | 'data' | 'operational' | 'compliance' | 'access' | 'resource';
export type PolicyAction = 'allow' | 'deny' | 'require_approval' | 'log_only';
export type ChangeStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'implemented' | 'rolled_back';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type AuditEventType =
  | 'policy_created'
  | 'policy_updated'
  | 'policy_deleted'
  | 'policy_enforced'
  | 'policy_violated'
  | 'change_requested'
  | 'change_approved'
  | 'change_rejected'
  | 'change_implemented'
  | 'approval_granted'
  | 'approval_denied'
  | 'audit_generated';

/**
 * Policy definition
 */
export interface Policy {
  id: string;
  name: string;
  description: string;
  type: PolicyType;
  rules: PolicyRule[];
  enforcementLevel: 'soft' | 'hard'; // soft = warn, hard = enforce
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  version: number;
  active: boolean;
}

/**
 * Individual policy rule
 */
export interface PolicyRule {
  id: string;
  condition: string; // e.g., "action === 'delete' && resource === 'critical'"
  action: PolicyAction;
  metadata: Record<string, unknown>;
}

/**
 * Change request for governance
 */
export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  type: 'policy' | 'configuration' | 'process' | 'infrastructure';
  status: ChangeStatus;
  requestedBy: string;
  requestedAt: number;
  approvedBy?: string;
  approvedAt?: number;
  rejectionReason?: string;
  implementedAt?: number;
  rollbackAt?: number;
  rollbackReason?: string;
  impactAnalysis: {
    affectedServices: string[];
    estimatedDowntime: number; // milliseconds
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    mitigationPlan?: string;
  };
  attachments: string[]; // file IDs or URLs
}

/**
 * Approval request
 */
export interface ApprovalRequest {
  id: string;
  changeId: string;
  requestedAt: number;
  expiresAt: number;
  status: ApprovalStatus;
  approverRole: string;
  minimumApprovers: number;
  approvals: {
    approvedBy: string;
    approvedAt: number;
    comments?: string;
  }[];
  rejections: {
    rejectedBy: string;
    rejectedAt: number;
    reason: string;
  }[];
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  actor: string;
  resource: string;
  resourceId: string;
  action: string;
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  result: 'success' | 'failure';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

/**
 * Governance Manager
 */
export class GovernanceManager {
  private policies: Map<string, Policy> = new Map();
  private changeRequests: Map<string, ChangeRequest> = new Map();
  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  private auditLog: AuditLogEntry[] = [];
  private policyVersions: Map<string, Policy[]> = new Map(); // policyId -> [v1, v2, ...]
  private changeCounter: number = 0;
  private approvalCounter: number = 0;
  private auditRetentionDays: number = 2555; // 7 years for compliance

  constructor(auditRetentionDays: number = 2555) {
    this.auditRetentionDays = auditRetentionDays;
  }

  /**
   * Create policy
   */
  createPolicy(
    name: string,
    description: string,
    type: PolicyType,
    rules: Omit<PolicyRule, 'id'>[],
    createdBy: string,
    enforcementLevel: 'soft' | 'hard' = 'hard'
  ): string {
    const id = `policy_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const policy: Policy = {
      id,
      name,
      description,
      type,
      rules: rules.map((r, i) => ({
        ...r,
        id: `rule_${i}_${Date.now()}`,
      })),
      enforcementLevel,
      createdAt: now,
      updatedAt: now,
      createdBy,
      version: 1,
      active: true,
    };

    this.policies.set(id, policy);

    // Track version
    const versions = this.policyVersions.get(id) || [];
    versions.push(policy);
    this.policyVersions.set(id, versions);

    // Audit log
    this.logAuditEvent('policy_created', createdBy, 'policy', id, `Created policy: ${name}`, {
      policyType: type,
      ruleCount: rules.length,
    });

    return id;
  }

  /**
   * Get policy
   */
  getPolicy(policyId: string): Policy | null {
    return this.policies.get(policyId) || null;
  }

  /**
   * Update policy
   */
  updatePolicy(policyId: string, updates: Partial<Policy>, updatedBy: string): boolean {
    const policy = this.policies.get(policyId);
    if (!policy) {
return false;
}

    const oldVersion = { ...policy };
    const newVersion = policy.version + 1;

    // Apply updates
    if (updates.name) {
policy.name = updates.name;
}
    if (updates.description) {
policy.description = updates.description;
}
    if (updates.rules) {
policy.rules = updates.rules;
}
    if (updates.enforcementLevel) {
policy.enforcementLevel = updates.enforcementLevel;
}
    if (typeof updates.active === 'boolean') {
policy.active = updates.active;
}

    policy.updatedAt = Date.now();
    policy.version = newVersion;

    this.policies.set(policyId, policy);

    // Track version
    const versions = this.policyVersions.get(policyId) || [];
    versions.push(policy);
    this.policyVersions.set(policyId, versions);

    // Audit log
    this.logAuditEvent('policy_updated', updatedBy, 'policy', policyId, `Updated policy version`, {
      oldVersion: oldVersion.version,
      newVersion,
      changes: {
        before: oldVersion,
        after: policy,
      },
    });

    return true;
  }

  /**
   * Evaluate policy against context
   */
  evaluatePolicy(
    policyId: string,
    context: Record<string, unknown>
  ): {
    allowed: boolean;
    action: PolicyAction;
    matchedRule?: PolicyRule;
    explanation: string;
  } {
    const policy = this.policies.get(policyId);
    if (!policy || !policy.active) {
      return { allowed: true, action: 'allow', explanation: 'Policy not found or inactive' };
    }

    // Evaluate rules in order
    for (const rule of policy.rules) {
      try {
        // Simple condition evaluation (in production: use proper expression engine)
        const conditionMet = this.evaluateCondition(rule.condition, context);

        if (conditionMet) {
          const allowed = rule.action === 'allow';
          return {
            allowed,
            action: rule.action,
            matchedRule: rule,
            explanation: `Rule matched: ${rule.condition}`,
          };
        }
      } catch (error) {
        // Continue to next rule on evaluation error
        continue;
      }
    }

    // Default: allow if no rules matched
    return {
      allowed: true,
      action: 'allow',
      explanation: 'No rules matched, default allow',
    };
  }

  /**
   * Request change
   */
  requestChange(
    title: string,
    description: string,
    type: ChangeRequest['type'],
    requestedBy: string,
    impactAnalysis: ChangeRequest['impactAnalysis'],
    attachments: string[] = []
  ): string {
    const id = `change_${++this.changeCounter}_${Date.now()}`;
    const now = Date.now();

    const change: ChangeRequest = {
      id,
      title,
      description,
      type,
      status: 'draft',
      requestedBy,
      requestedAt: now,
      impactAnalysis,
      attachments,
    };

    this.changeRequests.set(id, change);

    // Audit log
    this.logAuditEvent('change_requested', requestedBy, 'change', id, `Requested change: ${title}`, {
      changeType: type,
      riskLevel: impactAnalysis.riskLevel,
    });

    return id;
  }

  /**
   * Get change request
   */
  getChangeRequest(changeId: string): ChangeRequest | null {
    return this.changeRequests.get(changeId) || null;
  }

  /**
   * Get approval request
   */
  getApprovalRequest(approvalId: string): ApprovalRequest | null {
    return this.approvalRequests.get(approvalId) || null;
  }

  /**
   * Submit change for approval
   */
  submitChangeForApproval(
    changeId: string,
    approverRole: string,
    minimumApprovers: number = 1
  ): string | null {
    const change = this.changeRequests.get(changeId);
    if (!change) {
return null;
}

    // Update change status
    change.status = 'pending_review';

    // Create approval request
    const approvalId = `approval_${++this.approvalCounter}_${Date.now()}`;
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 day expiration

    const approval: ApprovalRequest = {
      id: approvalId,
      changeId,
      requestedAt: now,
      expiresAt,
      status: 'pending',
      approverRole,
      minimumApprovers,
      approvals: [],
      rejections: [],
    };

    this.approvalRequests.set(approvalId, approval);

    // Audit log
    this.logAuditEvent('change_requested', change.requestedBy, 'approval', approvalId, `Submitted for approval`, {
      changeId,
      approverRole,
    });

    return approvalId;
  }

  /**
   * Approve change
   */
  approveChange(approvalId: string, approvedBy: string, comments?: string): boolean {
    const approval = this.approvalRequests.get(approvalId);
    if (!approval) {
return false;
}

    const now = Date.now();

    // Check if already expired
    if (now > approval.expiresAt) {
      approval.status = 'expired';
      return false;
    }

    // Add approval
    approval.approvals.push({
      approvedBy,
      approvedAt: now,
      comments,
    });

    // Check if minimum approvers reached
    if (approval.approvals.length >= approval.minimumApprovers) {
      approval.status = 'approved';

      // Update change request
      const change = this.changeRequests.get(approval.changeId);
      if (change) {
        change.status = 'approved';
        change.approvedBy = approvedBy;
        change.approvedAt = now;

        // Audit log
        this.logAuditEvent('change_approved', approvedBy, 'change', change.id, `Approved change`, {
          changeId: change.id,
          approvalId,
        });
      }
    }

    return true;
  }

  /**
   * Reject change
   */
  rejectChange(approvalId: string, rejectedBy: string, reason: string): boolean {
    const approval = this.approvalRequests.get(approvalId);
    if (!approval) {
return false;
}

    const now = Date.now();

    // Add rejection
    approval.rejections.push({
      rejectedBy,
      rejectedAt: now,
      reason,
    });

    // Mark as rejected if any rejection received
    approval.status = 'rejected';

    // Update change request
    const change = this.changeRequests.get(approval.changeId);
    if (change) {
      change.status = 'rejected';
      change.rejectionReason = reason;

      // Audit log
      this.logAuditEvent('change_rejected', rejectedBy, 'change', change.id, `Rejected change`, {
        changeId: change.id,
        reason,
      });
    }

    return true;
  }

  /**
   * Implement approved change
   */
  implementChange(changeId: string, implementedBy: string): boolean {
    const change = this.changeRequests.get(changeId);
    if (!change || change.status !== 'approved') {
return false;
}

    const now = Date.now();
    change.status = 'implemented';
    change.implementedAt = now;

    // Audit log
    this.logAuditEvent('change_implemented', implementedBy, 'change', changeId, `Implemented change`, {
      changeId,
    });

    return true;
  }

  /**
   * Rollback change
   */
  rollbackChange(changeId: string, rolledBackBy: string, reason: string): boolean {
    const change = this.changeRequests.get(changeId);
    if (!change) {
return false;
}

    const now = Date.now();
    change.status = 'rolled_back';
    change.rollbackAt = now;
    change.rollbackReason = reason;

    // Audit log
    this.logAuditEvent('change_implemented', rolledBackBy, 'change', changeId, `Rolled back change`, {
      changeId,
      reason,
    });

    return true;
  }

  /**
   * Log audit event
   */
  logAuditEvent(
    eventType: AuditEventType,
    actor: string,
    resource: string,
    resourceId: string,
    action: string,
    metadata: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): string {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const entry: AuditLogEntry = {
      id,
      eventType,
      actor,
      resource,
      resourceId,
      action,
      result: 'success',
      timestamp: Date.now(),
      ipAddress,
      userAgent,
      metadata,
    };

    this.auditLog.push(entry);
    return id;
  }

  /**
   * Get audit log
   */
  getAuditLog(
    filters?: {
      eventType?: AuditEventType;
      actor?: string;
      resource?: string;
      resourceId?: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
    }
  ): AuditLogEntry[] {
    let results = [...this.auditLog];

    if (filters?.eventType) {
      results = results.filter((e) => e.eventType === filters.eventType);
    }

    if (filters?.actor) {
      results = results.filter((e) => e.actor === filters.actor);
    }

    if (filters?.resource) {
      results = results.filter((e) => e.resource === filters.resource);
    }

    if (filters?.resourceId) {
      results = results.filter((e) => e.resourceId === filters.resourceId);
    }

    if (filters?.startTime) {
      results = results.filter((e) => e.timestamp >= filters.startTime);
    }

    if (filters?.endTime) {
      results = results.filter((e) => e.timestamp <= filters.endTime);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp - a.timestamp);

    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Get policy history
   */
  getPolicyHistory(policyId: string): Policy[] {
    return this.policyVersions.get(policyId) || [];
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(startDate: number, endDate: number): Record<string, unknown> {
    const logs = this.getAuditLog({
      startTime: startDate,
      endTime: endDate,
    });

    const policyViolations = logs.filter((e) => e.eventType === 'policy_violated').length;
    const changesApproved = logs.filter((e) => e.eventType === 'change_approved').length;
    const changesRejected = logs.filter((e) => e.eventType === 'change_rejected').length;
    const changesImplemented = logs.filter((e) => e.eventType === 'change_implemented').length;

    const actorActivity = new Map<string, number>();
    for (const log of logs) {
      const count = actorActivity.get(log.actor) || 0;
      actorActivity.set(log.actor, count + 1);
    }

    return {
      periodStart: startDate,
      periodEnd: endDate,
      totalAuditEvents: logs.length,
      policyViolations,
      changes: {
        approved: changesApproved,
        rejected: changesRejected,
        implemented: changesImplemented,
      },
      activityByActor: Object.fromEntries(actorActivity),
      activePolicies: this.policies.size,
      pendingApprovals: Array.from(this.approvalRequests.values()).filter((a) => a.status === 'pending')
        .length,
    };
  }

  /**
   * Cleanup old audit logs
   */
  cleanupOldAuditLogs(): number {
    const cutoffDate = Date.now() - this.auditRetentionDays * 24 * 60 * 60 * 1000;
    const initialLength = this.auditLog.length;

    this.auditLog = this.auditLog.filter((entry) => entry.timestamp > cutoffDate);

    return initialLength - this.auditLog.length;
  }

  /**
   * Get governance statistics
   */
  getStatistics(): Record<string, unknown> {
    const approvalStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
    };

    for (const approval of this.approvalRequests.values()) {
      approvalStats[approval.status]++;
    }

    const changeStats = {
      draft: 0,
      pending_review: 0,
      approved: 0,
      rejected: 0,
      implemented: 0,
      rolled_back: 0,
    };

    for (const change of this.changeRequests.values()) {
      changeStats[change.status]++;
    }

    return {
      totalPolicies: this.policies.size,
      activePolicies: Array.from(this.policies.values()).filter((p) => p.active).length,
      totalChangeRequests: this.changeRequests.size,
      changes: changeStats,
      totalApprovals: this.approvalRequests.size,
      approvals: approvalStats,
      totalAuditEvents: this.auditLog.length,
    };
  }

  /**
   * Evaluate condition helper
   */
  private evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
    try {
      // Simple evaluation using function constructor (in production: use expression engine)
      const func = new Function(...Object.keys(context), `return ${condition}`);
      return func(...Object.values(context)) as boolean;
    } catch {
      return false;
    }
  }
}

// Export singleton
export const governanceManager = new GovernanceManager();
