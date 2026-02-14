/**
 * Agent Lifecycle Manager (Workforce Engine)
 *
 * Manages agent spawning, state transitions, permission enforcement,
 * and tool restrictions. Uses Protocol v1.0 Agent Cards as the source
 * of truth for boundaries and permissions.
 *
 * State transition matrix:
 *   idle → active, maintenance, offline
 *   active → busy, idle, degraded, offline
 *   busy → active, degraded, offline
 *   degraded → idle, active, offline, maintenance
 *   offline → idle
 *   maintenance → idle, offline
 *
 * @module lib/agents/workforce/agent-lifecycle
 */

import type { AgentCard, AgentState } from '../protocol';
import {
  getAgentCard,
  setAgentState,
  incrementActiveExecutions,
  decrementActiveExecutions,
  updateAgentMetrics,
  type UnifiedAgentId,
} from '../unified-registry';
import { agentEventLogger } from '../protocol/events';
import { skillLoader } from './skill-loader';

// ============================================================================
// Types
// ============================================================================

/**
 * A running agent instance with loaded skills and active tasks.
 */
export interface AgentInstance {
  /** The agent's Protocol v1.0 card */
  card: AgentCard;
  /** Names of skills loaded for this agent */
  loadedSkills: string[];
  /** Currently executing tasks: taskId → metadata */
  activeTasks: Map<string, { taskId: string; startedAt: string; correlationId: string }>;
  /** Session-scoped state (cleared when agent stops) */
  sessionState: Record<string, unknown>;
  /** When this instance was spawned */
  spawnedAt: string;
  /** Last heartbeat timestamp */
  lastHeartbeat: string;
}

/**
 * Valid state transitions matrix.
 */
export const STATE_TRANSITIONS: Record<AgentState, AgentState[]> = {
  idle: ['active', 'maintenance', 'offline'],
  active: ['busy', 'idle', 'degraded', 'offline'],
  busy: ['active', 'degraded', 'offline'],
  degraded: ['idle', 'active', 'offline', 'maintenance'],
  offline: ['idle'],
  maintenance: ['idle', 'offline'],
};

// ============================================================================
// Lifecycle Manager
// ============================================================================

type StateChangeListener = (
  agentId: string,
  oldState: AgentState,
  newState: AgentState
) => void;

export class AgentLifecycleManager {
  private instances: Map<string, AgentInstance> = new Map();
  private stateListeners: StateChangeListener[] = [];

  /**
   * Spawn an agent instance from its Agent Card.
   * Loads required skills and sets initial state to 'idle'.
   */
  async spawn(agentId: string): Promise<AgentInstance> {
    // Check if already spawned
    const existing = this.instances.get(agentId);
    if (existing) return existing;

    // Get the Agent Card
    const card = getAgentCard(agentId as UnifiedAgentId);

    // Load skills for this agent
    const skills = await skillLoader.loadForAgent(agentId);
    const loadedSkills = skills.map((s) => s.manifest.name);

    const now = new Date().toISOString();
    const instance: AgentInstance = {
      card,
      loadedSkills,
      activeTasks: new Map(),
      sessionState: {},
      spawnedAt: now,
      lastHeartbeat: now,
    };

    this.instances.set(agentId, instance);

    // Set state to idle via unified registry
    setAgentState(agentId as UnifiedAgentId, 'idle');

    // Log spawn event
    agentEventLogger.logEvent({
      eventType: 'state.changed',
      agentId,
      workspaceId: 'system',
      severity: 'info',
      payload: {
        previousState: 'offline',
        newState: 'idle',
        loadedSkills,
        reason: 'Agent spawned',
      },
    });

    return instance;
  }

  /**
   * Transition agent state with validation against the transition matrix.
   */
  transitionState(agentId: string, newState: AgentState, reason?: string): void {
    const instance = this.instances.get(agentId);
    if (!instance) {
      throw new Error(`Agent not spawned: ${agentId}`);
    }

    const oldState = instance.card.currentState;

    // Validate transition
    const allowedTransitions = STATE_TRANSITIONS[oldState];
    if (!allowedTransitions.includes(newState)) {
      throw new Error(
        `Invalid state transition for ${agentId}: ${oldState} → ${newState}. ` +
        `Allowed: ${allowedTransitions.join(', ')}`
      );
    }

    // Apply transition
    setAgentState(agentId as UnifiedAgentId, newState);

    // Log state change
    agentEventLogger.logStateChange(agentId, 'system', {
      previousState: oldState,
      newState,
      reason: reason || `Transition: ${oldState} → ${newState}`,
    });

    // Notify listeners
    for (const listener of this.stateListeners) {
      try {
        listener(agentId, oldState, newState);
      } catch {
        // Don't let listener errors break the state transition
      }
    }
  }

  /**
   * Check if a permission is allowed for an agent.
   * Maps action strings to Agent Card permission booleans.
   */
  checkPermission(
    agentId: string,
    action: string,
    _resource?: string
  ): { allowed: boolean; reason?: string } {
    const instance = this.instances.get(agentId);
    if (!instance) {
      return { allowed: false, reason: `Agent not spawned: ${agentId}` };
    }

    const { permissions } = instance.card;
    const actionLower = action.toLowerCase();

    const permissionMap: Record<string, boolean> = {
      'database.read': permissions.canReadDatabase,
      'database.write': permissions.canWriteDatabase,
      'external_api.call': permissions.canCallExternalAPIs,
      'send_message': permissions.canSendMessages,
      'send_email': permissions.canSendMessages,
      'modify_files': permissions.canModifyFiles,
      'execute_commands': permissions.canExecuteCommands,
      'spawn_subagent': instance.card.boundaries.canSpawnSubAgents,
    };

    for (const [key, allowed] of Object.entries(permissionMap)) {
      if (actionLower.includes(key) && !allowed) {
        return {
          allowed: false,
          reason: `Agent ${agentId} lacks permission: ${key}`,
        };
      }
    }

    // Check if it's a high-risk action needing approval
    if (permissions.requiresApprovalForHighRisk) {
      const approvalRequired = permissions.approvalRequiredCommands || [];
      if (approvalRequired.some((cmd) => actionLower.includes(cmd))) {
        return {
          allowed: false,
          reason: `Action requires approval: ${action}`,
        };
      }
    }

    // Check blocked commands
    const blocked = permissions.blockedCommands || [];
    if (blocked.some((cmd) => actionLower.includes(cmd))) {
      return {
        allowed: false,
        reason: `Action is blocked: ${action}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if an agent can execute a specific tool/command.
   */
  checkToolAccess(
    agentId: string,
    toolName: string
  ): { allowed: boolean; blocked: boolean; requiresApproval: boolean } {
    const instance = this.instances.get(agentId);
    if (!instance) {
      return { allowed: false, blocked: true, requiresApproval: false };
    }

    const { permissions } = instance.card;
    const toolLower = toolName.toLowerCase();

    const blocked = (permissions.blockedCommands || []).some(
      (cmd) => toolLower.includes(cmd)
    );
    const requiresApproval = (permissions.approvalRequiredCommands || []).some(
      (cmd) => toolLower.includes(cmd)
    );

    return {
      allowed: !blocked,
      blocked,
      requiresApproval,
    };
  }

  /**
   * Record a heartbeat from an agent.
   */
  heartbeat(agentId: string): void {
    const instance = this.instances.get(agentId);
    if (instance) {
      instance.lastHeartbeat = new Date().toISOString();
    }
  }

  /**
   * Get a running agent instance.
   */
  getInstance(agentId: string): AgentInstance | undefined {
    return this.instances.get(agentId);
  }

  /**
   * Get all active (spawned) instances.
   */
  getActiveInstances(): AgentInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Start a task on an agent. Validates concurrency limits.
   */
  startTask(agentId: string, taskId: string, correlationId: string): void {
    const instance = this.instances.get(agentId);
    if (!instance) {
      throw new Error(`Agent not spawned: ${agentId}`);
    }

    // Check concurrency limit
    const maxConcurrent = instance.card.boundaries.maxConcurrentSubAgents;
    if (instance.activeTasks.size >= maxConcurrent) {
      throw new Error(
        `Agent ${agentId} at max concurrency: ${instance.activeTasks.size}/${maxConcurrent}`
      );
    }

    instance.activeTasks.set(taskId, {
      taskId,
      startedAt: new Date().toISOString(),
      correlationId,
    });

    // Update global state
    incrementActiveExecutions(agentId as UnifiedAgentId);

    // Transition to active/busy
    const currentState = instance.card.currentState;
    if (currentState === 'idle') {
      this.transitionState(agentId, 'active', `Started task: ${taskId}`);
    } else if (instance.activeTasks.size >= maxConcurrent) {
      if (currentState === 'active') {
        this.transitionState(agentId, 'busy', 'At max concurrency');
      }
    }
  }

  /**
   * Complete a task on an agent. Updates metrics.
   */
  completeTask(
    agentId: string,
    taskId: string,
    success: boolean,
    executionTimeMs: number
  ): void {
    const instance = this.instances.get(agentId);
    if (!instance) return;

    instance.activeTasks.delete(taskId);

    // Update global state and metrics
    decrementActiveExecutions(agentId as UnifiedAgentId);
    updateAgentMetrics(agentId as UnifiedAgentId, executionTimeMs, success);

    // Transition state based on remaining tasks
    if (instance.activeTasks.size === 0) {
      const currentState = instance.card.currentState;
      if (currentState === 'active' || currentState === 'busy') {
        this.transitionState(agentId, 'idle', `Completed task: ${taskId}`);
      }
    } else {
      const currentState = instance.card.currentState;
      if (currentState === 'busy') {
        this.transitionState(agentId, 'active', 'Below max concurrency');
      }
    }
  }

  /**
   * Gracefully stop an agent instance.
   */
  stop(agentId: string, reason?: string): void {
    const instance = this.instances.get(agentId);
    if (!instance) return;

    // Log stop event
    agentEventLogger.logEvent({
      eventType: 'state.changed',
      agentId,
      workspaceId: 'system',
      severity: 'info',
      payload: {
        previousState: instance.card.currentState,
        newState: 'offline',
        reason: reason || 'Agent stopped',
        activeTasksDropped: instance.activeTasks.size,
      },
    });

    // Set state to offline
    setAgentState(agentId as UnifiedAgentId, 'offline');

    // Remove instance
    this.instances.delete(agentId);
  }

  /**
   * Detect stale agents (no heartbeat within threshold).
   */
  detectStaleAgents(thresholdMs: number = 60_000): string[] {
    const now = Date.now();
    const stale: string[] = [];

    for (const [agentId, instance] of this.instances) {
      const lastBeat = new Date(instance.lastHeartbeat).getTime();
      if (now - lastBeat > thresholdMs) {
        stale.push(agentId);
      }
    }

    return stale;
  }

  /**
   * Register a state transition listener.
   * Returns an unsubscribe function.
   */
  onStateChange(listener: StateChangeListener): () => void {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get count of spawned instances.
   */
  get instanceCount(): number {
    return this.instances.size;
  }

  /**
   * Get instance counts by state.
   */
  getCountsByState(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const instance of this.instances.values()) {
      const state = instance.card.currentState;
      counts[state] = (counts[state] || 0) + 1;
    }
    return counts;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const lifecycleManager = new AgentLifecycleManager();
