/**
 * Structured Agent Event Logging (Agents Protocol v1.0)
 *
 * Every agent MUST log key lifecycle events using this schema.
 * Events enable observability, debugging, and protocol compliance auditing.
 *
 * Log Format: [TIMESTAMP] [AGENT_ID] [EVENT_TYPE] [DETAIL]
 *
 * Event flow:
 *   task.received → task.started → (delegation.sent)? → task.completed | task.failed
 *   escalation.triggered → escalation.resolved
 *   handoff.initiated → handoff.completed | handoff.failed
 */

import { randomUUID } from 'crypto';

// ============================================================================
// Event Types
// ============================================================================

export type AgentEventType =
  // Task lifecycle
  | 'task.received'
  | 'task.started'
  | 'task.completed'
  | 'task.failed'
  // Delegation
  | 'delegation.sent'
  | 'delegation.received'
  | 'delegation.completed'
  // Handoff
  | 'handoff.initiated'
  | 'handoff.accepted'
  | 'handoff.rejected'
  | 'handoff.completed'
  | 'handoff.failed'
  // Escalation
  | 'escalation.triggered'
  | 'escalation.resolved'
  // Errors
  | 'error.encountered'
  | 'error.recovered'
  // State
  | 'state.changed'
  // Verification
  | 'verification.started'
  | 'verification.completed'
  // Permission
  | 'permission.checked'
  | 'permission.denied';

export type EventSeverity = 'debug' | 'info' | 'warn' | 'error';

// ============================================================================
// Event Interface
// ============================================================================

export interface AgentEvent {
  /** Unique event identifier */
  eventId: string;
  /** Event type classification */
  eventType: AgentEventType;
  /** Agent that generated this event */
  agentId: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Workspace ID for multi-tenant isolation */
  workspaceId: string;
  /** Event severity level */
  severity: EventSeverity;
  /** Correlation ID linking related events across agents */
  correlationId?: string;
  /** Event payload (varies by event type) */
  payload: Record<string, unknown>;
  /** Duration in milliseconds (for completed events) */
  durationMs?: number;
}

// ============================================================================
// Event Payloads (typed helpers)
// ============================================================================

export interface TaskEventPayload {
  taskId: string;
  taskType?: string;
  description?: string;
  confidence?: number;
  result?: unknown;
  error?: string;
}

export interface DelegationEventPayload {
  targetAgentId: string;
  taskDescription: string;
  effortLevel?: string;
}

export interface HandoffEventPayload {
  sourceAgentId: string;
  targetAgentId: string;
  reason: string;
  completedSteps: number;
  remainingSteps: number;
}

export interface EscalationEventPayload {
  trigger: string;
  severity: string;
  targetAgentId: string;
  currentValue: number;
  threshold: number;
  reason: string;
}

export interface ErrorEventPayload {
  operation: string;
  errorMessage: string;
  errorCode?: string;
  category: 'transient' | 'permanent' | 'configuration';
  attemptNumber?: number;
  impact?: string;
}

export interface StateChangePayload {
  previousState: string;
  newState: string;
  reason?: string;
}

export interface PermissionEventPayload {
  action: string;
  resource: string;
  result: 'allow' | 'deny';
  reason?: string;
}

// ============================================================================
// Event Logger
// ============================================================================

const DEFAULT_BUFFER_SIZE = 1000;

export class AgentEventLogger {
  private events: AgentEvent[] = [];
  private maxBufferSize: number;
  private listeners: ((event: AgentEvent) => void)[] = [];

  constructor(maxBufferSize: number = DEFAULT_BUFFER_SIZE) {
    this.maxBufferSize = maxBufferSize;
  }

  /**
   * Log a raw event
   */
  logEvent(event: Omit<AgentEvent, 'eventId' | 'timestamp'>): AgentEvent {
    const fullEvent: AgentEvent = {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      ...event,
    };

    this.events.push(fullEvent);

    // Trim buffer if exceeded
    if (this.events.length > this.maxBufferSize) {
      this.events = this.events.slice(-this.maxBufferSize);
    }

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(fullEvent);
      } catch {
        // Don't let listener errors break logging
      }
    }

    return fullEvent;
  }

  // --- Convenience methods for common events ---

  logTaskReceived(
    agentId: string,
    workspaceId: string,
    payload: TaskEventPayload,
    correlationId?: string
  ): AgentEvent {
    return this.logEvent({
      eventType: 'task.received',
      agentId,
      workspaceId,
      severity: 'info',
      correlationId,
      payload,
    });
  }

  logTaskStarted(
    agentId: string,
    workspaceId: string,
    payload: TaskEventPayload,
    correlationId?: string
  ): AgentEvent {
    return this.logEvent({
      eventType: 'task.started',
      agentId,
      workspaceId,
      severity: 'info',
      correlationId,
      payload,
    });
  }

  logTaskCompleted(
    agentId: string,
    workspaceId: string,
    payload: TaskEventPayload,
    durationMs: number,
    correlationId?: string
  ): AgentEvent {
    return this.logEvent({
      eventType: 'task.completed',
      agentId,
      workspaceId,
      severity: 'info',
      correlationId,
      payload,
      durationMs,
    });
  }

  logTaskFailed(
    agentId: string,
    workspaceId: string,
    payload: TaskEventPayload,
    durationMs?: number,
    correlationId?: string
  ): AgentEvent {
    return this.logEvent({
      eventType: 'task.failed',
      agentId,
      workspaceId,
      severity: 'error',
      correlationId,
      payload,
      durationMs,
    });
  }

  logDelegation(
    agentId: string,
    workspaceId: string,
    payload: DelegationEventPayload,
    correlationId?: string
  ): AgentEvent {
    return this.logEvent({
      eventType: 'delegation.sent',
      agentId,
      workspaceId,
      severity: 'info',
      correlationId,
      payload,
    });
  }

  logEscalation(
    agentId: string,
    workspaceId: string,
    payload: EscalationEventPayload,
    correlationId?: string
  ): AgentEvent {
    return this.logEvent({
      eventType: 'escalation.triggered',
      agentId,
      workspaceId,
      severity: payload.severity === 'critical' ? 'error' : 'warn',
      correlationId,
      payload,
    });
  }

  logError(
    agentId: string,
    workspaceId: string,
    payload: ErrorEventPayload,
    correlationId?: string
  ): AgentEvent {
    return this.logEvent({
      eventType: 'error.encountered',
      agentId,
      workspaceId,
      severity: 'error',
      correlationId,
      payload,
    });
  }

  logStateChange(
    agentId: string,
    workspaceId: string,
    payload: StateChangePayload,
    correlationId?: string
  ): AgentEvent {
    return this.logEvent({
      eventType: 'state.changed',
      agentId,
      workspaceId,
      severity: 'info',
      correlationId,
      payload,
    });
  }

  logPermissionCheck(
    agentId: string,
    workspaceId: string,
    payload: PermissionEventPayload,
    correlationId?: string
  ): AgentEvent {
    return this.logEvent({
      eventType: payload.result === 'deny' ? 'permission.denied' : 'permission.checked',
      agentId,
      workspaceId,
      severity: payload.result === 'deny' ? 'warn' : 'debug',
      correlationId,
      payload,
    });
  }

  // --- Query methods ---

  /**
   * Get recent events, optionally filtered
   */
  getRecentEvents(options?: {
    agentId?: string;
    eventType?: AgentEventType;
    severity?: EventSeverity;
    workspaceId?: string;
    limit?: number;
    since?: string;
  }): AgentEvent[] {
    let filtered = this.events;

    if (options?.agentId) {
      filtered = filtered.filter((e) => e.agentId === options.agentId);
    }
    if (options?.eventType) {
      filtered = filtered.filter((e) => e.eventType === options.eventType);
    }
    if (options?.severity) {
      filtered = filtered.filter((e) => e.severity === options.severity);
    }
    if (options?.workspaceId) {
      filtered = filtered.filter((e) => e.workspaceId === options.workspaceId);
    }
    if (options?.since) {
      filtered = filtered.filter((e) => e.timestamp >= options.since!);
    }

    const limit = options?.limit || 100;
    return filtered.slice(-limit);
  }

  /**
   * Get all events with a specific correlation ID
   */
  getEventsByCorrelation(correlationId: string): AgentEvent[] {
    return this.events.filter((e) => e.correlationId === correlationId);
  }

  /**
   * Get event counts by type for an agent
   */
  getEventCounts(agentId: string): Record<AgentEventType, number> {
    const counts = {} as Record<AgentEventType, number>;

    for (const event of this.events) {
      if (event.agentId === agentId) {
        counts[event.eventType] = (counts[event.eventType] || 0) + 1;
      }
    }

    return counts;
  }

  /**
   * Get error rate for an agent (errors / total tasks)
   */
  getErrorRate(agentId: string): number {
    const counts = this.getEventCounts(agentId);
    const totalTasks = (counts['task.completed'] || 0) + (counts['task.failed'] || 0);
    if (totalTasks === 0) return 0;
    return (counts['task.failed'] || 0) / totalTasks;
  }

  // --- Listener management ---

  /**
   * Register an event listener (for real-time monitoring)
   */
  onEvent(listener: (event: AgentEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Clear all events (for testing)
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Get total event count
   */
  get eventCount(): number {
    return this.events.length;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const agentEventLogger = new AgentEventLogger();
