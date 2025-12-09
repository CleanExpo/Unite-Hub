/**
 * Critical Point Guard
 *
 * Safety system that gates sensitive actions requiring human approval.
 * Prevents automated execution of destructive, financial, or identity-related actions.
 *
 * Critical Points include:
 * - Financial information entry
 * - Identity document uploads
 * - Passwords and security answers
 * - Final submissions or purchases
 * - Irreversible changes
 * - Destructive actions
 */

import { autoActionConfig } from '@config/autoAction.config';
import { FaraAction } from './faraClient';

// ============================================================================
// TYPES
// ============================================================================

export type CriticalCategory =
  | 'financial_information'
  | 'identity_documents'
  | 'passwords_and_security_answers'
  | 'final_submission_or_purchase'
  | 'irreversible_changes'
  | 'destructive_actions';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'timeout';

export interface CriticalPoint {
  id: string;
  sessionId: string;
  category: CriticalCategory;
  action: FaraAction;
  description: string;
  context: {
    pageUrl: string;
    pageTitle?: string;
    screenshotBase64?: string;
    formData?: Record<string, string>;
  };
  risk: 'low' | 'medium' | 'high' | 'critical';
  status: ApprovalStatus;
  createdAt: Date;
  respondedAt?: Date;
  respondedBy?: string;
  responseNote?: string;
}

export interface ApprovalRequest {
  criticalPoint: CriticalPoint;
  timeoutMs: number;
  autoRejectOnTimeout: boolean;
  notifyChannels: ('email' | 'slack' | 'in_app')[];
}

export interface ApprovalResponse {
  approved: boolean;
  criticalPointId: string;
  respondedBy: string;
  responseNote?: string;
  timestamp: Date;
}

export interface CriticalPointDetectionResult {
  isCritical: boolean;
  category?: CriticalCategory;
  risk?: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
  suggestedDescription?: string;
}

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

/**
 * Patterns for detecting critical points in actions and page content
 */
const CRITICAL_PATTERNS: Record<CriticalCategory, RegExp[]> = {
  financial_information: [
    /credit.?card/i,
    /card.?number/i,
    /cvv|cvc|security.?code/i,
    /expir(y|ation).?date/i,
    /bank.?account/i,
    /routing.?number/i,
    /payment.?method/i,
    /billing.?address/i,
    /paypal|stripe|square/i,
    /wire.?transfer/i,
    /ach.?transfer/i,
  ],
  identity_documents: [
    /passport/i,
    /driver.?s?.?licen[sc]e/i,
    /social.?security/i,
    /ssn|sin|tin/i,
    /tax.?id/i,
    /national.?id/i,
    /birth.?certificate/i,
    /identity.?document/i,
    /id.?verification/i,
    /kyc|know.?your.?customer/i,
  ],
  passwords_and_security_answers: [
    /password/i,
    /secret.?question/i,
    /security.?answer/i,
    /pin.?code/i,
    /two.?factor|2fa|mfa/i,
    /recovery.?code/i,
    /backup.?code/i,
    /authenticator/i,
  ],
  final_submission_or_purchase: [
    /submit.?order/i,
    /place.?order/i,
    /confirm.?purchase/i,
    /complete.?checkout/i,
    /pay.?now/i,
    /buy.?now/i,
    /sign.?agreement/i,
    /accept.?terms/i,
    /confirm.?booking/i,
    /finalize/i,
  ],
  irreversible_changes: [
    /change.?email/i,
    /change.?password/i,
    /update.?phone/i,
    /transfer.?ownership/i,
    /revoke.?access/i,
    /permanently/i,
    /cannot.?be.?undone/i,
    /irreversible/i,
  ],
  destructive_actions: [
    /delete.?account/i,
    /remove.?permanently/i,
    /cancel.?subscription/i,
    /terminate/i,
    /deactivate.?account/i,
    /close.?account/i,
    /erase.?data/i,
    /factory.?reset/i,
  ],
};

/**
 * Risk levels for different action types
 */
const ACTION_RISK_MAP: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  submit_form: 'medium',
  make_payment: 'critical',
  upload_document: 'high',
  delete_record: 'high',
  change_password: 'high',
  grant_permissions: 'high',
  sign_agreement: 'critical',
};

// ============================================================================
// CRITICAL POINT GUARD CLASS
// ============================================================================

export class CriticalPointGuard {
  private pendingApprovals: Map<string, CriticalPoint> = new Map();
  private approvalCallbacks: Map<string, (response: ApprovalResponse) => void> = new Map();
  private timeoutHandles: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Detect if an action triggers a critical point
   */
  detectCriticalPoint(
    action: FaraAction,
    pageContent?: string,
    formLabels?: string[]
  ): CriticalPointDetectionResult {
    // Check if action type is inherently critical
    const actionKey = action.type === 'click' ? this.inferActionIntent(action) : action.type;

    if (autoActionConfig.criticalPoints.requireApprovalFor.includes(actionKey)) {
      const category = this.categorizeAction(actionKey);
      return {
        isCritical: true,
        category,
        risk: ACTION_RISK_MAP[actionKey] || 'medium',
        reason: `Action "${actionKey}" requires approval`,
        suggestedDescription: `Attempting to ${actionKey.replace(/_/g, ' ')}`,
      };
    }

    // Check page content for critical patterns
    const contentToCheck = [
      pageContent || '',
      action.value || '',
      typeof action.target === 'string' ? action.target : action.target?.text || '',
      ...(formLabels || []),
    ].join(' ');

    for (const [category, patterns] of Object.entries(CRITICAL_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(contentToCheck)) {
          return {
            isCritical: true,
            category: category as CriticalCategory,
            risk: this.assessRisk(category as CriticalCategory, action),
            reason: `Detected ${category.replace(/_/g, ' ')} content`,
            suggestedDescription: `Action involves ${category.replace(/_/g, ' ')}`,
          };
        }
      }
    }

    return { isCritical: false };
  }

  /**
   * Create and register a critical point for approval
   */
  async createCriticalPoint(
    sessionId: string,
    action: FaraAction,
    context: CriticalPoint['context'],
    detection: CriticalPointDetectionResult
  ): Promise<CriticalPoint> {
    const criticalPoint: CriticalPoint = {
      id: this.generateId(),
      sessionId,
      category: detection.category || 'irreversible_changes',
      action,
      description: detection.suggestedDescription || 'Action requires approval',
      context,
      risk: detection.risk || 'medium',
      status: 'pending',
      createdAt: new Date(),
    };

    this.pendingApprovals.set(criticalPoint.id, criticalPoint);

    return criticalPoint;
  }

  /**
   * Wait for approval with timeout
   */
  async waitForApproval(criticalPointId: string): Promise<ApprovalResponse> {
    const criticalPoint = this.pendingApprovals.get(criticalPointId);

    if (!criticalPoint) {
      throw new Error(`Critical point ${criticalPointId} not found`);
    }

    const timeoutMs = autoActionConfig.criticalPoints.approvalTimeoutMs;
    const autoReject = autoActionConfig.criticalPoints.autoRejectOnTimeout;

    return new Promise((resolve) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.approvalCallbacks.delete(criticalPointId);
        this.timeoutHandles.delete(criticalPointId);

        criticalPoint.status = autoReject ? 'rejected' : 'timeout';
        criticalPoint.respondedAt = new Date();
        criticalPoint.responseNote = autoReject ? 'Auto-rejected due to timeout' : 'Timed out';

        resolve({
          approved: false,
          criticalPointId,
          respondedBy: 'system',
          responseNote: criticalPoint.responseNote,
          timestamp: new Date(),
        });
      }, timeoutMs);

      this.timeoutHandles.set(criticalPointId, timeoutHandle);

      // Register callback for approval
      this.approvalCallbacks.set(criticalPointId, (response) => {
        clearTimeout(timeoutHandle);
        this.timeoutHandles.delete(criticalPointId);
        this.approvalCallbacks.delete(criticalPointId);

        criticalPoint.status = response.approved ? 'approved' : 'rejected';
        criticalPoint.respondedAt = response.timestamp;
        criticalPoint.respondedBy = response.respondedBy;
        criticalPoint.responseNote = response.responseNote;

        resolve(response);
      });
    });
  }

  /**
   * Submit an approval response (called by human reviewer)
   */
  submitApproval(response: ApprovalResponse): boolean {
    const callback = this.approvalCallbacks.get(response.criticalPointId);

    if (!callback) {
      return false;
    }

    callback(response);
    return true;
  }

  /**
   * Get a critical point by ID
   */
  getCriticalPoint(id: string): CriticalPoint | undefined {
    return this.pendingApprovals.get(id);
  }

  /**
   * Get all pending approvals for a session
   */
  getPendingApprovals(sessionId?: string): CriticalPoint[] {
    const approvals = Array.from(this.pendingApprovals.values()).filter(
      (cp) => cp.status === 'pending'
    );

    if (sessionId) {
      return approvals.filter((cp) => cp.sessionId === sessionId);
    }

    return approvals;
  }

  /**
   * Check if an action is blocked (in blockedActions list)
   */
  isActionBlocked(actionType: string): boolean {
    return autoActionConfig.sandbox.blockedActions.includes(actionType);
  }

  /**
   * Validate that we're operating within allowed origins
   */
  isOriginAllowed(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return autoActionConfig.sandbox.allowedOrigins.some((allowed) =>
        hostname.includes(allowed.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private inferActionIntent(action: FaraAction): string {
    const targetText =
      typeof action.target === 'string'
        ? action.target
        : action.target?.text?.toLowerCase() || '';

    // Infer intent from button/link text
    if (/submit|send|confirm/i.test(targetText)) {
return 'submit_form';
}
    if (/pay|purchase|buy|checkout/i.test(targetText)) {
return 'make_payment';
}
    if (/upload|attach/i.test(targetText)) {
return 'upload_document';
}
    if (/delete|remove/i.test(targetText)) {
return 'delete_record';
}
    if (/sign|agree/i.test(targetText)) {
return 'sign_agreement';
}
    if (/grant|allow|permit/i.test(targetText)) {
return 'grant_permissions';
}

    return action.type;
  }

  private categorizeAction(actionKey: string): CriticalCategory {
    const categoryMap: Record<string, CriticalCategory> = {
      submit_form: 'final_submission_or_purchase',
      make_payment: 'financial_information',
      upload_document: 'identity_documents',
      delete_record: 'destructive_actions',
      change_password: 'passwords_and_security_answers',
      grant_permissions: 'irreversible_changes',
      sign_agreement: 'final_submission_or_purchase',
    };

    return categoryMap[actionKey] || 'irreversible_changes';
  }

  private assessRisk(
    category: CriticalCategory,
    action: FaraAction
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical categories always get high risk
    if (category === 'financial_information' || category === 'passwords_and_security_answers') {
      return 'critical';
    }

    if (category === 'identity_documents' || category === 'destructive_actions') {
      return 'high';
    }

    // Assess based on action confidence
    if (action.confidence < 0.5) {
      return 'high';
    }

    if (action.confidence < 0.8) {
      return 'medium';
    }

    return 'low';
  }

  private generateId(): string {
    return `cp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let guardInstance: CriticalPointGuard | null = null;

export function getCriticalPointGuard(): CriticalPointGuard {
  if (!guardInstance) {
    guardInstance = new CriticalPointGuard();
  }
  return guardInstance;
}

export default CriticalPointGuard;
