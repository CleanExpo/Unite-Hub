/**
 * Agent Handoff Protocol (Agents Protocol v1.0)
 *
 * Manages mid-execution task transfers between agents. Unlike escalation
 * (which is "I need help"), a handoff is "this belongs to someone else."
 *
 * Handoff types:
 * - Routing:    Router classifies input and passes to the right specialist
 * - Completion: Agent finishes its part and passes to next agent in chain
 * - Capability: Agent recognizes the task needs a different specialist
 * - Context:    Agent's context window is full; fresh agent needed
 * - Scheduled:  Predefined workflow dictates the next agent in sequence
 *
 * Every handoff MUST include:
 * 1. Task state (summary of work done)
 * 2. Remaining work (what still needs to happen)
 * 3. Key decisions made (constraints on remaining work)
 * 4. Artifacts produced (file paths / references)
 * 5. Context to preserve vs discard
 */

import { randomUUID } from 'crypto';
import {
  createHandoffMessage,
  type AgentMessage,
  type HandoffPayload,
} from './messages';
import { type AgentCard } from './agent-card';
import { agentEventLogger } from './events';

// ============================================================================
// Types
// ============================================================================

export type HandoffType =
  | 'routing'
  | 'completion'
  | 'capability'
  | 'context'
  | 'scheduled';

export type HandoffStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'failed';

export interface CompletedStep {
  stepNumber: number;
  action: string;
  result: unknown;
  completedAt: string;
}

export interface RemainingStep {
  stepNumber: number;
  action: string;
  inputs: Record<string, unknown>;
  constraints?: string[];
}

export interface HandoffContext {
  /** Original task objective */
  originalObjective: string;
  /** What type of handoff this is */
  handoffType: HandoffType;
  /** Steps completed so far */
  completedSteps: CompletedStep[];
  /** Steps remaining to complete the task */
  remainingSteps: RemainingStep[];
  /** Context accumulated from completed steps */
  accumulatedContext: Record<string, unknown>;
  /** Key decisions made that constrain remaining work */
  keyDecisions: string[];
  /** File paths or references to artifacts produced */
  artifacts: string[];
  /** Errors encountered during execution */
  errors: { stepNumber: number; error: string; timestamp: string }[];
  /** Current confidence score */
  currentConfidence: number;
  /** Context to preserve (critical for receiving agent) */
  preserveContext: Record<string, unknown>;
  /** Context to discard (explicitly mark as irrelevant) */
  discardContext?: string[];
}

export interface HandoffRequest {
  /** Unique handoff identifier */
  handoffId: string;
  /** Type of handoff */
  type: HandoffType;
  /** Source agent initiating handoff */
  sourceAgentId: string;
  /** Target agent receiving handoff */
  targetAgentId: string;
  /** Handoff reason (from HandoffPayload) */
  reason: HandoffPayload['reason'];
  /** Full context being transferred */
  context: HandoffContext;
  /** Current status */
  status: HandoffStatus;
  /** When handoff was initiated */
  initiatedAt: string;
  /** When handoff was resolved */
  resolvedAt?: string;
  /** Rejection reason (if rejected) */
  rejectionReason?: string;
  /** Workspace ID */
  workspaceId: string;
  /** The generated message */
  message: AgentMessage<HandoffPayload>;
}

export interface HandoffAcceptance {
  /** Whether handoff was accepted */
  accepted: boolean;
  /** Reason for acceptance/rejection */
  reason: string;
  /** Estimated completion time if accepted (ms) */
  estimatedCompletionMs?: number;
  /** Notes for coordination */
  notes?: string;
}

// ============================================================================
// Handoff Manager
// ============================================================================

export class HandoffManager {
  private activeHandoffs: Map<string, HandoffRequest> = new Map();

  /**
   * Initiate a handoff to another agent
   */
  initiateHandoff(
    sourceAgentId: string,
    targetAgentId: string,
    reason: HandoffPayload['reason'],
    context: HandoffContext,
    workspaceId: string
  ): HandoffRequest {
    const message = createHandoffMessage(
      sourceAgentId,
      targetAgentId,
      {
        reason,
        taskState: {
          originalObjective: context.originalObjective,
          accumulatedContext: context.accumulatedContext,
          currentConfidence: context.currentConfidence,
        },
        completedSteps: context.completedSteps,
        remainingSteps: context.remainingSteps,
        decisions: context.keyDecisions,
        artifacts: context.artifacts,
        notes: context.discardContext
          ? `Discard: ${context.discardContext.join(', ')}`
          : undefined,
      },
      workspaceId
    );

    const handoff: HandoffRequest = {
      handoffId: randomUUID(),
      type: context.handoffType,
      sourceAgentId,
      targetAgentId,
      reason,
      context,
      status: 'pending',
      initiatedAt: new Date().toISOString(),
      workspaceId,
      message,
    };

    this.activeHandoffs.set(handoff.handoffId, handoff);

    // Log the handoff event
    agentEventLogger.logEvent({
      eventType: 'handoff.initiated',
      agentId: sourceAgentId,
      workspaceId,
      severity: 'info',
      correlationId: message.metadata.correlationId,
      payload: {
        handoffId: handoff.handoffId,
        type: context.handoffType,
        targetAgentId,
        reason,
        completedSteps: context.completedSteps.length,
        remainingSteps: context.remainingSteps.length,
        confidence: context.currentConfidence,
      },
    });

    return handoff;
  }

  /**
   * Accept or reject a handoff request
   */
  respondToHandoff(
    handoffId: string,
    acceptance: HandoffAcceptance
  ): HandoffRequest {
    const handoff = this.activeHandoffs.get(handoffId);
    if (!handoff) {
      throw new Error(`Handoff not found: ${handoffId}`);
    }

    if (handoff.status !== 'pending') {
      throw new Error(`Handoff ${handoffId} is already ${handoff.status}`);
    }

    if (acceptance.accepted) {
      handoff.status = 'accepted';
    } else {
      handoff.status = 'rejected';
      handoff.rejectionReason = acceptance.reason;
    }

    handoff.resolvedAt = new Date().toISOString();
    this.activeHandoffs.set(handoffId, handoff);

    // Log the response
    agentEventLogger.logEvent({
      eventType: acceptance.accepted ? 'handoff.accepted' : 'handoff.rejected',
      agentId: handoff.targetAgentId,
      workspaceId: handoff.workspaceId,
      severity: acceptance.accepted ? 'info' : 'warn',
      payload: {
        handoffId,
        accepted: acceptance.accepted,
        reason: acceptance.reason,
      },
    });

    return handoff;
  }

  /**
   * Mark a handoff as in progress (target agent has started work)
   */
  markInProgress(handoffId: string): void {
    const handoff = this.activeHandoffs.get(handoffId);
    if (!handoff) throw new Error(`Handoff not found: ${handoffId}`);
    handoff.status = 'in_progress';
  }

  /**
   * Mark a handoff as completed
   */
  completeHandoff(handoffId: string): void {
    const handoff = this.activeHandoffs.get(handoffId);
    if (!handoff) throw new Error(`Handoff not found: ${handoffId}`);

    handoff.status = 'completed';
    handoff.resolvedAt = new Date().toISOString();

    agentEventLogger.logEvent({
      eventType: 'handoff.completed',
      agentId: handoff.targetAgentId,
      workspaceId: handoff.workspaceId,
      severity: 'info',
      payload: { handoffId },
    });
  }

  /**
   * Mark a handoff as failed
   */
  failHandoff(handoffId: string, reason: string): void {
    const handoff = this.activeHandoffs.get(handoffId);
    if (!handoff) throw new Error(`Handoff not found: ${handoffId}`);

    handoff.status = 'failed';
    handoff.rejectionReason = reason;
    handoff.resolvedAt = new Date().toISOString();

    agentEventLogger.logEvent({
      eventType: 'handoff.failed',
      agentId: handoff.targetAgentId,
      workspaceId: handoff.workspaceId,
      severity: 'error',
      payload: { handoffId, reason },
    });
  }

  /**
   * Validate if a handoff is allowed between two agents
   */
  validateHandoff(
    sourceAgent: AgentCard,
    targetAgent: AgentCard
  ): { valid: boolean; reason?: string } {
    // Check delegation rules
    if (!sourceAgent.canDelegateTo.includes(targetAgent.id)) {
      return {
        valid: false,
        reason: `${sourceAgent.id} is not authorized to delegate to ${targetAgent.id}`,
      };
    }

    if (!targetAgent.canReceiveDelegationFrom.includes(sourceAgent.id)) {
      return {
        valid: false,
        reason: `${targetAgent.id} is not configured to receive from ${sourceAgent.id}`,
      };
    }

    // Check target agent availability
    if (targetAgent.currentState === 'offline' || targetAgent.currentState === 'maintenance') {
      return {
        valid: false,
        reason: `${targetAgent.id} is ${targetAgent.currentState}`,
      };
    }

    // Check target agent capacity
    if (targetAgent.currentState === 'busy') {
      return {
        valid: false,
        reason: `${targetAgent.id} is busy (${targetAgent.activeExecutions} active executions)`,
      };
    }

    return { valid: true };
  }

  // --- Query methods ---

  /**
   * Get handoff by ID
   */
  getHandoff(handoffId: string): HandoffRequest | undefined {
    return this.activeHandoffs.get(handoffId);
  }

  /**
   * Get pending handoffs for an agent (either as source or target)
   */
  getPendingHandoffs(agentId: string): HandoffRequest[] {
    return Array.from(this.activeHandoffs.values()).filter(
      (h) =>
        h.status === 'pending' &&
        (h.sourceAgentId === agentId || h.targetAgentId === agentId)
    );
  }

  /**
   * Get all handoffs for an agent
   */
  getHandoffsForAgent(agentId: string): HandoffRequest[] {
    return Array.from(this.activeHandoffs.values()).filter(
      (h) => h.sourceAgentId === agentId || h.targetAgentId === agentId
    );
  }

  /**
   * Clean up completed/failed handoffs older than given age (ms)
   */
  cleanup(maxAgeMs: number = 3_600_000): number {
    const cutoff = Date.now() - maxAgeMs;
    let cleaned = 0;

    for (const [id, handoff] of this.activeHandoffs) {
      if (
        (handoff.status === 'completed' || handoff.status === 'failed' || handoff.status === 'rejected') &&
        handoff.resolvedAt &&
        new Date(handoff.resolvedAt).getTime() < cutoff
      ) {
        this.activeHandoffs.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const handoffManager = new HandoffManager();
