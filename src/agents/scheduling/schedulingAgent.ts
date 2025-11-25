/**
 * Scheduling Agent
 *
 * Autonomous meeting scheduling with availability calculation, conflict detection,
 * founder governance routing, and multi-brand calendar management.
 *
 * Features:
 * - Calendar availability calculation (free time slot detection)
 * - Meeting conflict detection and resolution
 * - Automatic meeting proposal generation
 * - Risk scoring and brand safety validation
 * - Founder approval routing for complex scheduling
 * - Event logging and audit trail
 * - Multi-brand scheduling support
 *
 * Integrates with:
 * - Availability engine (free time calculation)
 * - Conflict detection engine (overlap detection)
 * - Scheduling communications module (proposal generation)
 * - Founder risk engine (risk scoring)
 * - Founder approval engine (routing)
 * - Founder event log (audit trail)
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
import { calculateAvailability } from './availabilityEngine';
import { detectConflicts } from './conflictEngine';
import { buildSchedulingEmail, buildCalendarInvite } from './schedulingComms';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  organizer?: string;
  attendees?: string[];
  description?: string;
}

export interface SchedulingRequest {
  brand: BrandId;
  participant: string;
  participantEmail: string;
  durationMinutes: number;
  dateRange: { start: string; end: string };
  calendarEvents: CalendarEvent[];
  preferredTimes?: string[];
  timezone?: string;
  description?: string;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
  durationMinutes: number;
  confidence: number; // 0-1, lower if near other events
}

export interface SchedulingResult {
  id: string;
  request: SchedulingRequest;
  availableSlots: AvailabilitySlot[];
  conflicts: Array<{ eventA: CalendarEvent; eventB: CalendarEvent; overlap: number }>;
  proposalEmail: string;
  calendarInvite: string;
  riskAssessment: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    reasons: string[];
    requiresApproval: boolean;
  };
  approvalStatus: 'auto_approved' | 'pending_review' | 'pending_approval' | 'rejected';
  approvalId?: string;
  readyToSend: boolean;
  timestamp: string;
}

/**
 * Scheduling Agent Class
 * Handles autonomous meeting scheduling with governance
 */
export class SchedulingAgent {
  private agentId = 'scheduling-agent';

  /**
   * Propose a meeting with full governance integration
   */
  async proposeMeeting(request: SchedulingRequest): Promise<SchedulingResult> {
    const resultId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Log agent action
    logAgentAction(this.agentId, 'propose_meeting', {
      brand: request.brand,
      participant: request.participantEmail,
      durationMinutes: request.durationMinutes,
      dateRange: request.dateRange,
    });

    // Step 1: Calculate availability
    const availableSlots = calculateAvailability({
      calendarEvents: request.calendarEvents,
      durationMinutes: request.durationMinutes,
      dateRange: request.dateRange,
    });

    // Step 2: Detect conflicts
    const conflicts = detectConflicts(request.calendarEvents);

    // Step 3: Build proposal email
    const proposalEmail = buildSchedulingEmail({
      brand: request.brand,
      participant: request.participant,
      availableSlots,
      timezone: request.timezone || 'UTC',
      description: request.description,
    });

    // Step 4: Build calendar invite
    const calendarInvite = buildCalendarInvite({
      brand: request.brand,
      participant: request.participant,
      participantEmail: request.participantEmail,
      slots: availableSlots.slice(0, 3), // Top 3 slots
      duration: request.durationMinutes,
    });

    // Step 5: Risk Assessment
    const riskInput: RiskScoringInput = {
      brand: request.brand,
      claim: proposalEmail,
      context: 'email',
      contentType: 'scheduling_proposal',
    };

    const riskAssessment = scoreRisk(riskInput);

    // Log risk assessment
    logRiskAssessment(resultId, riskAssessment.score, riskAssessment.level, request.brand);

    // Step 6: Approval Routing
    const approvalRequest: ApprovalRequest = {
      id: resultId,
      createdAt: timestamp,
      createdByAgent: 'scheduling',
      riskLevel: riskAssessment.level,
      itemType: 'scheduling',
      brand: request.brand,
      summary: `Meeting proposal to ${request.participant}`,
      details: {
        participant: request.participant,
        participantEmail: request.participantEmail,
        durationMinutes: request.durationMinutes,
        dateRange: request.dateRange,
        availableSlots,
        conflicts,
        riskScore: riskAssessment.score,
        riskLevel: riskAssessment.level,
        riskReasons: riskAssessment.reasons,
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

    const result: SchedulingResult = {
      id: resultId,
      request,
      availableSlots,
      conflicts,
      proposalEmail,
      calendarInvite,
      riskAssessment,
      approvalStatus,
      approvalId,
      readyToSend,
      timestamp,
    };

    // Log final result
    logFounderEvent('agent_action', this.agentId, {
      action: 'meeting_proposed',
      resultId,
      approvalStatus,
      readyToSend,
      riskLevel: riskAssessment.level,
      availableSlots: availableSlots.length,
      conflicts: conflicts.length,
    });

    return result;
  }

  /**
   * Validate scheduling proposal before sending
   */
  validateProposal(result: SchedulingResult): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!result.readyToSend) {
      errors.push('Proposal requires founder approval before sending');
    }

    if (result.riskAssessment.level === 'critical') {
      errors.push('Proposal has critical risk level - cannot send');
    }

    if (result.availableSlots.length === 0) {
      errors.push('No available time slots found');
    }

    if (result.conflicts.length > 5) {
      errors.push('Too many calendar conflicts detected');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Mark meeting proposal as sent
   */
  async markProposalSent(proposalId: string): Promise<void> {
    logAgentAction(this.agentId, 'proposal_sent', {
      proposalId,
      sentAt: new Date().toISOString(),
    });
  }

  /**
   * Schedule confirmed meeting
   */
  async confirmMeeting(proposalId: string, confirmedSlot: AvailabilitySlot): Promise<void> {
    logAgentAction(this.agentId, 'meeting_confirmed', {
      proposalId,
      confirmedSlot,
      confirmedAt: new Date().toISOString(),
    });
  }
}

/**
 * Singleton instance
 */
export const schedulingAgent = new SchedulingAgent();
