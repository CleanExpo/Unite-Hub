/**
 * Inter-Agent Message Protocol (Agents Protocol v1.0)
 *
 * Structured message format for all agent-to-agent communication.
 * Every inter-agent message MUST use this format to prevent the
 * "game of telephone" problem where information degrades between agents.
 *
 * Rules:
 * - Direct addressing only (every message has sender + receiver)
 * - Structured over freeform (no natural language between agents)
 * - Minimum viable context (only what the receiver needs)
 * - Large outputs go to filesystem, references go in messages
 * - Acknowledge receipt before beginning work
 */

import { randomUUID } from 'crypto';

// ============================================================================
// Message Types
// ============================================================================

export type MessageType =
  | 'request'       // Agent requesting another agent to perform a task
  | 'response'      // Response to a request
  | 'handoff'       // Transferring execution to another agent
  | 'escalation'    // Escalating an issue to a higher-level agent or human
  | 'notification'  // Informational notification (no response expected)
  | 'heartbeat'     // Agent health check
  | 'delegation'    // Delegating a subtask to a sub-agent
  | 'completion';   // Task completion notification

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

// ============================================================================
// Message Metadata
// ============================================================================

export interface MessageMetadata {
  /** ISO-8601 timestamp when message was created */
  createdAt: string;
  /** ISO-8601 timestamp when message expires (optional) */
  expiresAt?: string;
  /** Number of times this message has been retried */
  retryCount: number;
  /** Correlation ID for tracking related messages across agents */
  correlationId: string;
  /** Parent message ID (for threading/replies) */
  parentMessageId?: string;
  /** Conversation thread ID (groups related messages) */
  threadId?: string;
  /** Tags for categorization and filtering */
  tags?: string[];
}

// ============================================================================
// Core Message Interface
// ============================================================================

export interface AgentMessage<T = unknown> {
  /** Unique message identifier */
  messageId: string;
  /** Message type classification */
  type: MessageType;
  /** Sender agent ID */
  senderId: string;
  /** Receiver agent ID */
  receiverId: string;
  /** Message priority */
  priority: MessagePriority;
  /** Typed message payload */
  payload: T;
  /** Message metadata for tracking and correlation */
  metadata: MessageMetadata;
  /** Workspace ID for multi-tenant isolation */
  workspaceId: string;
}

// ============================================================================
// Typed Payloads
// ============================================================================

export interface RequestPayload {
  /** Action being requested */
  action: string;
  /** Input parameters for the action */
  inputs: Record<string, unknown>;
  /** Expected response format/schema */
  expectedResponseSchema?: Record<string, unknown>;
  /** Timeout in milliseconds */
  timeoutMs?: number;
  /** Context from previous steps or related operations */
  context?: Record<string, unknown>;
  /** Effort level for the task */
  effortLevel?: 'simple' | 'moderate' | 'complex' | 'intensive';
}

export interface ResponsePayload {
  /** Whether the request was fulfilled successfully */
  success: boolean;
  /** Response data (typed per action) */
  data?: unknown;
  /** Error message if request failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: string;
  /** Self-assessed confidence score (0-1) */
  confidence?: number;
  /** Execution time in milliseconds */
  executionTimeMs?: number;
  /** Issues encountered during execution */
  issues?: string[];
  /** Suggestions for the requesting agent */
  suggestions?: string[];
}

export interface HandoffPayload {
  /** Reason for the handoff */
  reason: 'low_confidence' | 'capability_mismatch' | 'error_threshold' | 'explicit_request' | 'context_overflow';
  /** Current task state snapshot */
  taskState: Record<string, unknown>;
  /** Steps completed before handoff */
  completedSteps: unknown[];
  /** Steps remaining after handoff */
  remainingSteps: unknown[];
  /** Key decisions made that constrain remaining work */
  decisions?: string[];
  /** Artifacts produced (file paths or references) */
  artifacts?: string[];
  /** Notes for the receiving agent */
  notes?: string;
}

export interface EscalationPayload {
  /** Human-readable escalation reason */
  reason: string;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Trigger that caused escalation */
  trigger: 'confidence_threshold' | 'error_count' | 'execution_time' | 'capability_boundary' | 'safety_concern' | 'ambiguity';
  /** Error details if triggered by errors */
  errorDetails?: unknown;
  /** What the agent already tried */
  attemptedSolutions?: string[];
  /** Agent's suggested resolution */
  suggestedResolution?: string;
  /** Current execution context */
  context: Record<string, unknown>;
  /** Impact of this escalation on the overall task */
  impact?: string;
}

export interface NotificationPayload {
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** Notification level */
  level: 'info' | 'warning' | 'error';
  /** Additional structured data */
  data?: Record<string, unknown>;
}

export interface HeartbeatPayload {
  /** Agent's current state */
  state: 'idle' | 'active' | 'busy' | 'degraded';
  /** Active execution count */
  activeExecutions: number;
  /** System metrics */
  metrics?: {
    memoryUsageMb?: number;
    uptimeMs?: number;
    queueDepth?: number;
  };
}

export interface DelegationPayload {
  /** Objective for the delegated task */
  objective: string;
  /** Expected output format */
  outputFormat: Record<string, unknown>;
  /** Tools guidance for the sub-agent */
  toolsGuidance?: string[];
  /** Boundaries - what NOT to do */
  boundaries?: string[];
  /** Effort level */
  effortLevel: 'simple' | 'moderate' | 'complex' | 'intensive';
  /** Deadline if applicable */
  deadlineMs?: number;
}

export interface CompletionPayload {
  /** Task identifier that was completed */
  taskId: string;
  /** Completion status */
  status: 'success' | 'partial' | 'failed';
  /** Result summary */
  summary: string;
  /** Output data or file references */
  output?: unknown;
  /** Self-assessed confidence */
  confidence: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
}

// ============================================================================
// Message Builder Functions
// ============================================================================

function generateId(): string {
  return randomUUID();
}

export function createMessage<T>(
  type: MessageType,
  senderId: string,
  receiverId: string,
  payload: T,
  workspaceId: string,
  options?: {
    priority?: MessagePriority;
    correlationId?: string;
    parentMessageId?: string;
    threadId?: string;
    expiresAt?: string;
    tags?: string[];
  }
): AgentMessage<T> {
  return {
    messageId: generateId(),
    type,
    senderId,
    receiverId,
    priority: options?.priority || 'normal',
    payload,
    metadata: {
      createdAt: new Date().toISOString(),
      expiresAt: options?.expiresAt,
      retryCount: 0,
      correlationId: options?.correlationId || generateId(),
      parentMessageId: options?.parentMessageId,
      threadId: options?.threadId || generateId(),
      tags: options?.tags,
    },
    workspaceId,
  };
}

export function createRequestMessage(
  senderId: string,
  receiverId: string,
  action: string,
  inputs: Record<string, unknown>,
  workspaceId: string,
  options?: {
    priority?: MessagePriority;
    correlationId?: string;
    timeoutMs?: number;
    context?: Record<string, unknown>;
    effortLevel?: RequestPayload['effortLevel'];
  }
): AgentMessage<RequestPayload> {
  return createMessage(
    'request',
    senderId,
    receiverId,
    {
      action,
      inputs,
      timeoutMs: options?.timeoutMs,
      context: options?.context,
      effortLevel: options?.effortLevel,
    },
    workspaceId,
    {
      priority: options?.priority,
      correlationId: options?.correlationId,
    }
  );
}

export function createResponseMessage(
  senderId: string,
  receiverId: string,
  requestMessage: AgentMessage<RequestPayload>,
  response: Omit<ResponsePayload, 'success'> & { success: boolean }
): AgentMessage<ResponsePayload> {
  return createMessage(
    'response',
    senderId,
    receiverId,
    response,
    requestMessage.workspaceId,
    {
      correlationId: requestMessage.metadata.correlationId,
      parentMessageId: requestMessage.messageId,
      threadId: requestMessage.metadata.threadId,
    }
  );
}

export function createHandoffMessage(
  senderId: string,
  receiverId: string,
  payload: HandoffPayload,
  workspaceId: string,
  correlationId?: string
): AgentMessage<HandoffPayload> {
  return createMessage(
    'handoff',
    senderId,
    receiverId,
    payload,
    workspaceId,
    {
      priority: 'high',
      correlationId,
    }
  );
}

export function createEscalationMessage(
  senderId: string,
  receiverId: string,
  payload: EscalationPayload,
  workspaceId: string,
  correlationId?: string
): AgentMessage<EscalationPayload> {
  return createMessage(
    'escalation',
    senderId,
    receiverId,
    payload,
    workspaceId,
    {
      priority: payload.severity === 'critical' ? 'urgent' : 'high',
      correlationId,
    }
  );
}

export function createDelegationMessage(
  senderId: string,
  receiverId: string,
  payload: DelegationPayload,
  workspaceId: string,
  correlationId?: string
): AgentMessage<DelegationPayload> {
  return createMessage(
    'delegation',
    senderId,
    receiverId,
    payload,
    workspaceId,
    {
      priority: 'normal',
      correlationId,
    }
  );
}

export function createNotificationMessage(
  senderId: string,
  receiverId: string,
  title: string,
  body: string,
  level: NotificationPayload['level'],
  workspaceId: string,
  data?: Record<string, unknown>
): AgentMessage<NotificationPayload> {
  return createMessage(
    'notification',
    senderId,
    receiverId,
    { title, body, level, data },
    workspaceId,
    {
      priority: level === 'error' ? 'high' : 'normal',
    }
  );
}

export function createCompletionMessage(
  senderId: string,
  receiverId: string,
  payload: CompletionPayload,
  workspaceId: string,
  correlationId?: string
): AgentMessage<CompletionPayload> {
  return createMessage(
    'completion',
    senderId,
    receiverId,
    payload,
    workspaceId,
    {
      correlationId,
    }
  );
}
