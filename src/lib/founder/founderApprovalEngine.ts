/**
 * Founder Approval Engine
 *
 * Routes content/actions through approval workflow based on risk level.
 * Determines whether founder must manually approve or if auto-routing is safe.
 *
 * Used by: Agent control routing, campaign launch, claim validation
 */

import type { BrandId } from '@/lib/brands/brandRegistry';
import type { RiskLevel } from './founderControlConfig';
import { founderControlConfig } from './founderControlConfig';

export interface ApprovalRequest {
  id: string;
  createdAt: string;
  createdByAgent: 'email' | 'content' | 'research' | 'scheduling' | 'analysis' | 'coordination';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  itemType: 'claim' | 'campaign' | 'email' | 'automation' | 'brand_change' | 'override';
  brand: BrandId;
  summary: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ApprovalDecision {
  approved: boolean;
  decisionBy: 'auto' | 'founder';
  decisionAt: string;
  decisionReason?: string;
  suggestedFix?: string;
}

export type ApprovalResult = ApprovalDecision | 'pending_founder_review';

/**
 * Evaluate approval request and route appropriately
 * Returns decision or 'pending_founder_review' if manual approval needed
 */
export function evaluateApproval(req: ApprovalRequest): ApprovalResult {
  // Critical risk always requires founder review
  if (req.riskLevel === 'critical') {
    return 'pending_founder_review';
  }

  // High risk claims and automation require founder review
  if (req.riskLevel === 'high') {
    if (req.itemType === 'claim' || req.itemType === 'automation') {
      return 'pending_founder_review';
    }
  }

  // Medium risk requires content review (automated check)
  if (req.riskLevel === 'medium') {
    if (req.itemType === 'claim') {
      return 'pending_founder_review'; // Claims always go to founder
    }
    // Medium risk content can auto-approve if basic checks pass
  }

  // Low risk auto-approves
  if (req.riskLevel === 'low') {
    return {
      approved: true,
      decisionBy: 'auto',
      decisionAt: new Date().toISOString(),
      decisionReason: 'Low risk - auto-approved by system',
    };
  }

  // Default to founder review for safety
  return 'pending_founder_review';
}

/**
 * Batch evaluate multiple approval requests
 */
export function batchEvaluateApprovals(
  requests: ApprovalRequest[]
): Record<string, ApprovalResult> {
  const results: Record<string, ApprovalResult> = {};
  requests.forEach((req) => {
    results[req.id] = evaluateApproval(req);
  });
  return results;
}

/**
 * Simulate founder decision (for testing/demo)
 */
export function recordFounderDecision(
  req: ApprovalRequest,
  approved: boolean,
  reason?: string
): ApprovalDecision {
  return {
    approved,
    decisionBy: 'founder',
    decisionAt: new Date().toISOString(),
    decisionReason: reason,
  };
}

/**
 * Check if request matches any manual override rules
 */
export function requiresManualOverride(req: ApprovalRequest): boolean {
  const { manualOverrideRequiredFor } = founderControlConfig;

  if (req.itemType === 'claim') return true; // All claims need review
  if (req.itemType === 'override') return true; // Overrides are manual by definition
  if (req.riskLevel === 'critical') return true;
  if (req.riskLevel === 'high' && req.itemType === 'automation') return true;

  return false;
}

/**
 * Get approval queue (pending founder review)
 */
let approvalQueue: ApprovalRequest[] = [];

export function addToApprovalQueue(req: ApprovalRequest): void {
  approvalQueue.push(req);
}

export function getApprovalQueue(): ApprovalRequest[] {
  return [...approvalQueue];
}

export function clearApprovalQueue(): void {
  approvalQueue = [];
}

export function removeFromQueue(id: string): void {
  approvalQueue = approvalQueue.filter((req) => req.id !== id);
}

/**
 * Get approval stats
 */
export function getApprovalStats() {
  const byCriticalityLevel = {
    low: approvalQueue.filter((r) => r.riskLevel === 'low').length,
    medium: approvalQueue.filter((r) => r.riskLevel === 'medium').length,
    high: approvalQueue.filter((r) => r.riskLevel === 'high').length,
    critical: approvalQueue.filter((r) => r.riskLevel === 'critical').length,
  };

  const byType = {
    claim: approvalQueue.filter((r) => r.itemType === 'claim').length,
    campaign: approvalQueue.filter((r) => r.itemType === 'campaign').length,
    email: approvalQueue.filter((r) => r.itemType === 'email').length,
    automation: approvalQueue.filter((r) => r.itemType === 'automation').length,
    brand_change: approvalQueue.filter((r) => r.itemType === 'brand_change').length,
    override: approvalQueue.filter((r) => r.itemType === 'override').length,
  };

  return {
    totalPending: approvalQueue.length,
    byCriticalityLevel,
    byType,
    oldestRequest: approvalQueue[0],
  };
}
