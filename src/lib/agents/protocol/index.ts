/**
 * Agents Protocol v1.0 - Barrel Export
 *
 * Central export for all protocol modules. Import from here:
 *
 *   import {
 *     AgentCard,
 *     createAgentCard,
 *     createMessage,
 *     agentEventLogger,
 *     escalationManager,
 *     handoffManager,
 *     verifyAgentOutput,
 *     initializeProtocol,
 *   } from '@/lib/agents/protocol';
 */

// ============================================================================
// Agent Card Specification
// ============================================================================
export {
  // Types
  type AgentState,
  type AgentType,
  type ModelTier,
  type PermissionTier,
  type FileSystemAccess,
  type AgentCapabilityDefinition,
  type AgentBoundaries,
  type AgentPermissions,
  type DelegationCondition,
  type DelegationRule,
  type AgentMetrics,
  type AgentCard,
  type AgentCardValidationResult,
  // Functions
  createDefaultBoundaries,
  createDefaultPermissions,
  createDefaultMetrics,
  createAgentCard,
  validateAgentCard,
} from './agent-card';

// ============================================================================
// Structured Message Protocol
// ============================================================================
export {
  // Types
  type MessageType,
  type MessagePriority,
  type MessageMetadata,
  type AgentMessage,
  type RequestPayload,
  type ResponsePayload,
  type HandoffPayload,
  type EscalationPayload,
  type NotificationPayload,
  type HeartbeatPayload,
  type DelegationPayload,
  type CompletionPayload,
  // Functions
  createMessage,
  createRequestMessage,
  createResponseMessage,
  createHandoffMessage,
  createEscalationMessage,
  createDelegationMessage,
  createNotificationMessage,
  createCompletionMessage,
} from './messages';

// ============================================================================
// Structured Event Logging
// ============================================================================
export {
  // Types
  type AgentEventType,
  type EventSeverity,
  type AgentEvent,
  type TaskEventPayload,
  type DelegationEventPayload,
  type HandoffEventPayload,
  type EscalationEventPayload,
  type ErrorEventPayload,
  type StateChangePayload,
  type PermissionEventPayload,
  // Class
  AgentEventLogger,
  // Singleton
  agentEventLogger,
} from './events';

// ============================================================================
// Escalation Protocol
// ============================================================================
export {
  // Types
  type EscalationCondition,
  type EscalationSeverity,
  type EscalationStatus,
  type EscalationRule,
  type EscalationMetrics,
  type EscalationTrigger,
  // Class
  EscalationManager,
  // Singleton
  escalationManager,
} from './escalation';

// ============================================================================
// Handoff Protocol
// ============================================================================
export {
  // Types
  type HandoffType,
  type HandoffStatus,
  type CompletedStep,
  type RemainingStep,
  type HandoffContext,
  type HandoffRequest,
  type HandoffAcceptance,
  // Class
  HandoffManager,
  // Singleton
  handoffManager,
} from './handoff';

// ============================================================================
// Output Quality Verification
// ============================================================================
export {
  // Types
  type QualityDimension,
  type QualityScore,
  type VerificationResult,
  type VerificationConfig,
  // Class
  OutputVerifier,
  // Function
  verifyAgentOutput,
} from './verification';

// ============================================================================
// Protocol Initialization
// ============================================================================

import { validateAgentCard, type AgentCard } from './agent-card';
import { escalationManager } from './escalation';
import { agentEventLogger } from './events';

export interface ProtocolHealthSummary {
  /** Protocol version */
  protocolVersion: string;
  /** Number of registered agent cards */
  registeredAgents: number;
  /** Number of valid agent cards */
  validAgents: number;
  /** Number of invalid agent cards */
  invalidAgents: number;
  /** Total escalation rules registered */
  totalEscalationRules: number;
  /** Active escalation count */
  activeEscalations: number;
  /** Total events logged */
  totalEventsLogged: number;
  /** Validation errors across all agents */
  validationErrors: string[];
  /** Validation warnings across all agents */
  validationWarnings: string[];
  /** Initialization timestamp */
  initializedAt: string;
}

/**
 * Initialize the Agents Protocol for all registered agents.
 * Call this at application startup after defining all Agent Cards.
 *
 * @param agentCards - Map of agent ID to AgentCard
 * @returns Health summary of the protocol initialization
 */
export function initializeProtocol(
  agentCards: Record<string, AgentCard>
): ProtocolHealthSummary {
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];
  let validCount = 0;
  let totalRules = 0;

  for (const [id, card] of Object.entries(agentCards)) {
    // Validate each agent card
    const validation = validateAgentCard(card);

    if (validation.valid) {
      validCount++;
    } else {
      validationErrors.push(
        ...validation.errors.map((e) => `[${id}] ${e}`)
      );
    }
    validationWarnings.push(
      ...validation.warnings.map((w) => `[${id}] ${w}`)
    );

    // Register default escalation rules for each agent
    const rules = escalationManager.getDefaultRules(id);
    escalationManager.registerRules(id, rules);
    totalRules += rules.length;
  }

  // Log initialization event
  agentEventLogger.logEvent({
    eventType: 'state.changed',
    agentId: 'protocol',
    workspaceId: 'system',
    severity: 'info',
    payload: {
      previousState: 'uninitialized',
      newState: 'initialized',
      agentCount: Object.keys(agentCards).length,
      validCount,
      escalationRules: totalRules,
    },
  });

  return {
    protocolVersion: '1.0.0',
    registeredAgents: Object.keys(agentCards).length,
    validAgents: validCount,
    invalidAgents: Object.keys(agentCards).length - validCount,
    totalEscalationRules: totalRules,
    activeEscalations: escalationManager.getActiveEscalations().length,
    totalEventsLogged: agentEventLogger.eventCount,
    validationErrors,
    validationWarnings,
    initializedAt: new Date().toISOString(),
  };
}
