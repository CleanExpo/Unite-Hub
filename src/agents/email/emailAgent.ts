/**
 * Email Agent
 *
 * Autonomous email composition with governance integration.
 * Features:
 * - Risk scoring and brand safety validation
 * - Tone alignment checking
 * - Founder approval routing for risky content
 * - Comprehensive audit logging
 * - Multi-brand support
 *
 * Integrates with:
 * - Founder risk engine (risk scoring)
 * - Founder approval engine (routing)
 * - Brand positioning map (tone validation)
 * - Event log (audit trail)
 */

import type { BrandId } from '@/lib/brands/brandRegistry';
import { scoreRisk, type RiskScoringInput } from '@/lib/founder/founderRiskEngine';
import {
  evaluateApproval,
  addToApprovalQueue,
  type ApprovalRequest,
} from '@/lib/founder/founderApprovalEngine';
import {
  logFounderEvent,
  logAgentAction,
  logRiskAssessment,
  logApprovalDecision,
} from '@/lib/founder/founderEventLog';
import { checkBrandToneAlignment } from '@/lib/brands/brandPositioningMap';

export interface EmailCompositionRequest {
  brand: BrandId;
  recipient: string;
  recipientName?: string;
  subject: string;
  body: string;
  template?: string;
  isPublicFacing?: boolean;
  context?: 'followup' | 'intro' | 'promotional' | 'educational' | 'transactional';
}

export interface EmailCompositionResult {
  id: string;
  request: EmailCompositionRequest;
  riskAssessment: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    reasons: string[];
    requiresApproval: boolean;
  };
  brandAlignment: {
    aligned: boolean;
    issues: string[];
  };
  approvalStatus: 'auto_approved' | 'pending_review' | 'pending_approval' | 'rejected';
  approvalId?: string;
  readyToSend: boolean;
  timestamp: string;
}

/**
 * Email Agent Class
 * Composes emails with automated governance and safety checks
 */
export class EmailAgent {
  private agentId = 'email-agent';

  /**
   * Compose an email with full governance integration
   */
  async composeEmail(request: EmailCompositionRequest): Promise<EmailCompositionResult> {
    const resultId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Log agent action
    logAgentAction(this.agentId, 'compose_email', {
      brand: request.brand,
      recipient: request.recipient,
      subject: request.subject,
      template: request.template,
    });

    // Step 1: Risk Assessment
    const riskInput: RiskScoringInput = {
      brand: request.brand,
      claim: request.body,
      context: request.isPublicFacing ? 'public' : 'email',
      contentType: 'email',
    };

    const riskAssessment = scoreRisk(riskInput);

    // Log risk assessment
    logRiskAssessment(resultId, riskAssessment.score, riskAssessment.level, request.brand);

    // Step 2: Brand Tone Alignment
    const brandAlignment = checkBrandToneAlignment(request.brand, request.body);

    // Step 3: Approval Routing
    const approvalRequest: ApprovalRequest = {
      id: resultId,
      createdAt: timestamp,
      createdByAgent: 'email',
      riskLevel: riskAssessment.level,
      itemType: 'email',
      brand: request.brand,
      summary: `Email to ${request.recipient}: "${request.subject}"`,
      details: {
        recipient: request.recipient,
        recipientName: request.recipientName,
        subject: request.subject,
        body: request.body,
        template: request.template,
        isPublicFacing: request.isPublicFacing,
        riskScore: riskAssessment.score,
        riskLevel: riskAssessment.level,
        riskReasons: riskAssessment.reasons,
        brandAligned: brandAlignment.aligned,
        brandAlignmentIssues: brandAlignment.issues,
      },
    };

    const approvalResult = evaluateApproval(approvalRequest);

    let approvalStatus: 'auto_approved' | 'pending_review' | 'pending_approval' | 'rejected';
    let approvalId: string | undefined;
    let readyToSend = false;

    if (approvalResult === 'pending_founder_review') {
      approvalStatus = 'pending_approval';
      // Add to founder approval queue
      addToApprovalQueue(approvalRequest);
      approvalId = resultId;

      logApprovalDecision(false, resultId, riskAssessment.level, 'Requires founder review');
    } else if (approvalResult.approved) {
      approvalStatus = 'auto_approved';
      readyToSend = true;

      logApprovalDecision(
        true,
        resultId,
        riskAssessment.level,
        approvalResult.decisionReason
      );
    } else {
      approvalStatus = 'rejected';
      logApprovalDecision(false, resultId, riskAssessment.level, 'Auto-rejected by system');
    }

    const result: EmailCompositionResult = {
      id: resultId,
      request,
      riskAssessment,
      brandAlignment,
      approvalStatus,
      approvalId,
      readyToSend,
      timestamp,
    };

    // Log final result
    logFounderEvent('agent_action', this.agentId, {
      action: 'email_composed',
      resultId,
      approvalStatus,
      readyToSend,
      riskLevel: riskAssessment.level,
    });

    return result;
  }

  /**
   * Validate email before sending
   */
  validateEmail(email: EmailCompositionResult): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!email.readyToSend) {
      errors.push('Email requires founder approval before sending');
    }

    if (email.riskAssessment.level === 'critical') {
      errors.push('Email has critical risk level - cannot send');
    }

    if (!email.brandAlignment.aligned) {
      errors.push('Email does not align with brand positioning');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Mark email as sent
   */
  async markAsSent(emailId: string): Promise<void> {
    logAgentAction(this.agentId, 'email_sent', {
      emailId,
      sentAt: new Date().toISOString(),
    });
  }
}

/**
 * Singleton instance
 */
export const emailAgent = new EmailAgent();
