/**
 * Hook Lifecycle System (Workforce Engine)
 *
 * Implements PreToolUse/PostToolUse/PreExecution/PostExecution lifecycle hooks
 * for validation, auditing, and transformation of agent actions.
 *
 * Maps Claude Code's hook concept to Unite-Hub:
 * - PreToolUse  → pre-tool-use phase
 * - PostToolUse → post-tool-use phase
 * - SubagentStart → pre-execution phase
 * - SubagentStop  → post-execution phase
 * + pre-handoff / post-handoff phases (Unite-Hub specific)
 *
 * @module lib/agents/workforce/hooks
 */

import { randomUUID } from 'crypto';
import type {
  HookDefinition,
  HookContext,
  HookResult,
  HookPhase,
  HookAction,
  HookExecutionResult,
} from './types';

// ============================================================================
// Hook System
// ============================================================================

export class HookSystem {
  private hooks: Map<string, HookDefinition> = new Map();

  /**
   * Register a hook.
   */
  register(hook: HookDefinition): void {
    this.hooks.set(hook.id, hook);
  }

  /**
   * Unregister a hook by ID.
   */
  unregister(hookId: string): void {
    this.hooks.delete(hookId);
  }

  /**
   * Execute all hooks matching a phase and agent.
   *
   * Hooks run in priority order (lowest first).
   * - If any hook returns 'block', execution stops and shouldProceed = false
   * - If any hook returns 'modify', modified inputs are passed to subsequent hooks
   * - All results are collected in the audit trail
   */
  async execute(
    phase: HookPhase,
    context: HookContext
  ): Promise<HookExecutionResult> {
    const matchingHooks = this.getMatchingHooks(phase, context.agentId);
    const results: HookResult[] = [];
    let currentInputs = { ...context.inputs };
    let finalAction: HookAction = 'allow';

    for (const hook of matchingHooks) {
      const start = Date.now();

      try {
        const hookCtx: HookContext = {
          ...context,
          inputs: currentInputs,
          hookChain: [...results],
        };

        const result = await hook.handler(hookCtx);
        result.executionTimeMs = Date.now() - start;
        results.push(result);

        // Handle blocking
        if (result.action === 'block') {
          finalAction = 'block';
          break;
        }

        // Handle modification
        if (result.action === 'modify' && result.modifiedInputs) {
          currentInputs = { ...currentInputs, ...result.modifiedInputs };
          if (finalAction !== 'block') finalAction = 'modify';
        }

        // Track audit actions
        if (result.action === 'audit' && finalAction === 'allow') {
          finalAction = 'audit';
        }
      } catch (error) {
        // Hook errors should not crash the pipeline — log and continue
        results.push({
          hookId: hook.id,
          action: 'audit',
          reason: `Hook error: ${error instanceof Error ? error.message : String(error)}`,
          executionTimeMs: Date.now() - start,
          metadata: { error: true },
        });
      }
    }

    return {
      action: finalAction,
      inputs: currentInputs,
      results,
      shouldProceed: finalAction !== 'block',
      auditTrail: results,
    };
  }

  /**
   * Get all hooks matching a phase and agent, sorted by priority.
   */
  private getMatchingHooks(phase: HookPhase, agentId: string): HookDefinition[] {
    return Array.from(this.hooks.values())
      .filter(
        (h) =>
          h.enabled &&
          h.phase === phase &&
          (h.agentIds.includes('*') || h.agentIds.includes(agentId))
      )
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get all hooks for a specific phase.
   */
  getHooksForPhase(phase: HookPhase): HookDefinition[] {
    return Array.from(this.hooks.values()).filter(
      (h) => h.phase === phase && h.enabled
    );
  }

  /**
   * Get all hooks for a specific agent.
   */
  getHooksForAgent(agentId: string): HookDefinition[] {
    return Array.from(this.hooks.values()).filter(
      (h) =>
        h.enabled &&
        (h.agentIds.includes('*') || h.agentIds.includes(agentId))
    );
  }

  /**
   * Enable or disable a hook.
   */
  setEnabled(hookId: string, enabled: boolean): void {
    const hook = this.hooks.get(hookId);
    if (hook) {
      hook.enabled = enabled;
    }
  }

  /**
   * Get a hook by ID.
   */
  getHook(hookId: string): HookDefinition | undefined {
    return this.hooks.get(hookId);
  }

  /**
   * List all registered hooks.
   */
  listHooks(): HookDefinition[] {
    return Array.from(this.hooks.values());
  }

  /**
   * Get hook count.
   */
  get hookCount(): number {
    return this.hooks.size;
  }

  /**
   * Get counts by phase.
   */
  getCountsByPhase(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const hook of this.hooks.values()) {
      if (hook.enabled) {
        counts[hook.phase] = (counts[hook.phase] || 0) + 1;
      }
    }
    return counts;
  }
}

// ============================================================================
// Built-in Hook Factories
// ============================================================================

/**
 * Blocked commands from agentSafety.ts
 * (Inlined to avoid circular dependency — these match the source of truth)
 */
const BLOCKED_COMMANDS = [
  'file_delete',
  'registry_edit',
  'network_reconfig',
  'system_shutdown',
  'execute_arbitrary_binary',
];

const APPROVAL_REQUIRED_COMMANDS = [
  'open_app',
  'close_app',
  'launch_url',
  'system_command',
];

/**
 * Creates a safety validation hook that checks actions against blocked/approval-required commands.
 * Wraps the safety logic from agentSafety.ts.
 */
export function createSafetyHook(config?: {
  blockedCommands?: string[];
  approvalRequiredCommands?: string[];
}): HookDefinition {
  const blocked = config?.blockedCommands || BLOCKED_COMMANDS;
  const needsApproval = config?.approvalRequiredCommands || APPROVAL_REQUIRED_COMMANDS;

  return {
    id: 'built-in:safety',
    name: 'Safety Validator',
    phase: 'pre-tool-use',
    agentIds: ['*'],
    priority: 1, // Runs first
    enabled: true,
    handler: async (ctx: HookContext): Promise<HookResult> => {
      const action = ctx.action.toLowerCase();

      if (blocked.some((cmd) => action.includes(cmd))) {
        return {
          hookId: 'built-in:safety',
          action: 'block',
          reason: `Blocked command: ${ctx.action}`,
          executionTimeMs: 0,
          metadata: { blockedCommand: ctx.action },
        };
      }

      if (needsApproval.some((cmd) => action.includes(cmd))) {
        return {
          hookId: 'built-in:safety',
          action: 'audit',
          reason: `Requires approval: ${ctx.action}`,
          executionTimeMs: 0,
          metadata: { requiresApproval: true, command: ctx.action },
        };
      }

      return {
        hookId: 'built-in:safety',
        action: 'allow',
        executionTimeMs: 0,
      };
    },
  };
}

/**
 * Creates an audit logging hook that records all actions.
 * Logs via agentEventLogger from protocol/events.ts.
 */
export function createAuditHook(): HookDefinition {
  return {
    id: 'built-in:audit',
    name: 'Audit Logger',
    phase: 'post-execution',
    agentIds: ['*'],
    priority: 100, // Runs last
    enabled: true,
    handler: async (ctx: HookContext): Promise<HookResult> => {
      // Lazy import to avoid circular dependency
      const { agentEventLogger } = await import('../protocol/events');

      agentEventLogger.logEvent({
        eventType: 'permission.checked',
        agentId: ctx.agentId,
        workspaceId: ctx.workspaceId,
        severity: 'info',
        correlationId: ctx.correlationId,
        payload: {
          action: ctx.action,
          inputs: Object.keys(ctx.inputs),
          hookChainLength: ctx.hookChain.length,
          timestamp: ctx.timestamp,
        },
      });

      return {
        hookId: 'built-in:audit',
        action: 'audit',
        executionTimeMs: 0,
        metadata: { logged: true },
      };
    },
  };
}

/**
 * Creates a permission checking hook that validates actions against Agent Card permissions.
 */
export function createPermissionHook(): HookDefinition {
  return {
    id: 'built-in:permission',
    name: 'Permission Checker',
    phase: 'pre-execution',
    agentIds: ['*'],
    priority: 2, // After safety, before others
    enabled: true,
    handler: async (ctx: HookContext): Promise<HookResult> => {
      // Lazy import to avoid circular dependency
      const { getAgentCard } = await import('../unified-registry');

      try {
        const card = getAgentCard(ctx.agentId as any);
        if (!card) {
          return {
            hookId: 'built-in:permission',
            action: 'allow', // Unknown agents default to allow
            executionTimeMs: 0,
            metadata: { agentNotFound: true },
          };
        }

        const { permissions } = card;
        const action = ctx.action.toLowerCase();

        // Check permission mappings
        if (action.includes('database.read') && !permissions.canReadDatabase) {
          return {
            hookId: 'built-in:permission',
            action: 'block',
            reason: `Agent ${ctx.agentId} lacks database read permission`,
            executionTimeMs: 0,
          };
        }

        if (action.includes('database.write') && !permissions.canWriteDatabase) {
          return {
            hookId: 'built-in:permission',
            action: 'block',
            reason: `Agent ${ctx.agentId} lacks database write permission`,
            executionTimeMs: 0,
          };
        }

        if (action.includes('external_api') && !permissions.canCallExternalAPIs) {
          return {
            hookId: 'built-in:permission',
            action: 'block',
            reason: `Agent ${ctx.agentId} lacks external API permission`,
            executionTimeMs: 0,
          };
        }

        if (action.includes('send_message') || action.includes('send_email')) {
          if (!permissions.canSendMessages) {
            return {
              hookId: 'built-in:permission',
              action: 'block',
              reason: `Agent ${ctx.agentId} lacks message sending permission`,
              executionTimeMs: 0,
            };
          }
        }

        return {
          hookId: 'built-in:permission',
          action: 'allow',
          executionTimeMs: 0,
        };
      } catch {
        // If we can't check, allow with audit
        return {
          hookId: 'built-in:permission',
          action: 'audit',
          reason: 'Permission check failed - allowing with audit',
          executionTimeMs: 0,
        };
      }
    },
  };
}

/**
 * Creates a rate limiting hook that enforces maxRequestsPerMinute.
 * Uses an in-memory sliding window counter.
 */
export function createRateLimitHook(): HookDefinition {
  // Sliding window: agentId -> timestamp[]
  const windows: Map<string, number[]> = new Map();

  return {
    id: 'built-in:rate-limit',
    name: 'Rate Limiter',
    phase: 'pre-tool-use',
    agentIds: ['*'],
    priority: 3,
    enabled: true,
    handler: async (ctx: HookContext): Promise<HookResult> => {
      const { getAgentCard } = await import('../unified-registry');

      try {
        const card = getAgentCard(ctx.agentId as any);
        if (!card) {
          return { hookId: 'built-in:rate-limit', action: 'allow', executionTimeMs: 0 };
        }

        const maxRpm = card.boundaries.maxRequestsPerMinute;
        const now = Date.now();
        const windowStart = now - 60_000;

        // Get or create window for this agent
        let timestamps = windows.get(ctx.agentId) || [];
        timestamps = timestamps.filter((t) => t > windowStart);
        timestamps.push(now);
        windows.set(ctx.agentId, timestamps);

        if (timestamps.length > maxRpm) {
          return {
            hookId: 'built-in:rate-limit',
            action: 'block',
            reason: `Rate limit exceeded: ${timestamps.length}/${maxRpm} requests/minute`,
            executionTimeMs: 0,
            metadata: { currentRate: timestamps.length, limit: maxRpm },
          };
        }

        return { hookId: 'built-in:rate-limit', action: 'allow', executionTimeMs: 0 };
      } catch {
        return { hookId: 'built-in:rate-limit', action: 'allow', executionTimeMs: 0 };
      }
    },
  };
}

/**
 * Creates a token budget hook that tracks cumulative tokens and enforces limits.
 */
export function createTokenBudgetHook(): HookDefinition {
  // Track tokens per agent per task: correlationId -> tokenCount
  const tokenUsage: Map<string, number> = new Map();

  return {
    id: 'built-in:token-budget',
    name: 'Token Budget Enforcer',
    phase: 'pre-tool-use',
    agentIds: ['*'],
    priority: 4,
    enabled: true,
    handler: async (ctx: HookContext): Promise<HookResult> => {
      const { getAgentCard } = await import('../unified-registry');

      try {
        const card = getAgentCard(ctx.agentId as any);
        if (!card) {
          return { hookId: 'built-in:token-budget', action: 'allow', executionTimeMs: 0 };
        }

        const maxTokens = card.boundaries.maxTokensPerRequest;
        const key = `${ctx.agentId}:${ctx.correlationId}`;
        const currentUsage = tokenUsage.get(key) || 0;

        // Estimate tokens from input size
        const inputStr = JSON.stringify(ctx.inputs);
        const estimatedTokens = Math.ceil(inputStr.length / 4);
        const newTotal = currentUsage + estimatedTokens;

        tokenUsage.set(key, newTotal);

        if (newTotal > maxTokens) {
          return {
            hookId: 'built-in:token-budget',
            action: 'block',
            reason: `Token budget exceeded: ${newTotal}/${maxTokens} tokens`,
            executionTimeMs: 0,
            metadata: { currentTokens: newTotal, limit: maxTokens },
          };
        }

        return { hookId: 'built-in:token-budget', action: 'allow', executionTimeMs: 0 };
      } catch {
        return { hookId: 'built-in:token-budget', action: 'allow', executionTimeMs: 0 };
      }
    },
  };
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const hookSystem = new HookSystem();
