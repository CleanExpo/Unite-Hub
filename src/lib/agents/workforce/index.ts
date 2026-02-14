/**
 * Workforce Engine — Barrel Export + Initialization
 *
 * Re-exports all workforce modules and provides the `initializeWorkforce()`
 * function that bootstraps the entire engine at application startup.
 *
 * Usage:
 *   import { initializeWorkforce, workforceOrchestrator } from '@/lib/agents/workforce';
 *   const status = await initializeWorkforce('workspace-uuid');
 *   const result = await workforceOrchestrator.run({ workspaceId, objective: '...' });
 *
 * @module lib/agents/workforce
 */

// ============================================================================
// Type Exports
// ============================================================================
export type {
  // Skill types
  SkillManifest,
  LoadedSkill,
  // Hook types
  HookPhase,
  HookAction,
  HookDefinition,
  HookContext,
  HookResult,
  HookHandler,
  HookExecutionResult,
  // Workflow types
  WorkstreamStatus,
  WorkstreamStep,
  Workstream,
  WorkflowDefinition,
  // Memory types
  MemoryScope,
  WorkforceMemoryEntry,
  ScopeIdentifier,
} from './types';

// ============================================================================
// Skill Loader
// ============================================================================
export { SkillLoader, skillLoader } from './skill-loader';

// ============================================================================
// Hook System
// ============================================================================
export {
  HookSystem,
  hookSystem,
  createSafetyHook,
  createAuditHook,
  createPermissionHook,
  createRateLimitHook,
  createTokenBudgetHook,
} from './hooks';

// ============================================================================
// Enhanced Hooks (PII, Brand Voice, Critic, Draft, Health)
// ============================================================================
export {
  createPIIRedactionHook,
  createBrandVoiceHook,
  createCriticReviewHook,
  createDraftTrackingHook,
  createHealthMonitorHook,
  createAllEnhancedHooks,
} from './enhanced-hooks';

// ============================================================================
// Memory Manager
// ============================================================================
export { WorkforceMemoryManager, memoryManager } from './memory';

// ============================================================================
// Agent Lifecycle
// ============================================================================
export {
  AgentLifecycleManager,
  lifecycleManager,
  STATE_TRANSITIONS,
  type AgentInstance,
} from './agent-lifecycle';

// ============================================================================
// Workforce Registry
// ============================================================================
export {
  WorkforceRegistry,
  workforceRegistry,
  type WorkforceCapability,
  type WorkforceStatus,
  type WorkforceMatch,
} from './registry';

// ============================================================================
// Workforce Orchestrator
// ============================================================================
export {
  WorkforceOrchestrator,
  workforceOrchestrator,
  type WorkforceRequest,
  type WorkforceResult,
} from './orchestrator';

// ============================================================================
// Workforce AI Caller
// ============================================================================
export {
  WorkforceAICaller,
  createWorkforceAICaller,
  type WorkforceAIRequest,
  type WorkforceAIResult,
} from './ai-caller';

// ============================================================================
// Initialization
// ============================================================================

import { initializeProtocol, type ProtocolHealthSummary } from '../protocol';
import { AGENT_CARDS } from '../unified-registry';
import { skillLoader } from './skill-loader';
import { hookSystem } from './hooks';
import {
  createSafetyHook,
  createAuditHook,
  createPermissionHook,
  createRateLimitHook,
  createTokenBudgetHook,
} from './hooks';
import { workforceRegistry, type WorkforceStatus } from './registry';
import { createAllEnhancedHooks } from './enhanced-hooks';

/**
 * Full initialization result combining protocol health and workforce status.
 */
export interface WorkforceInitResult {
  /** Protocol v1.0 health summary */
  protocol: ProtocolHealthSummary;
  /** Workforce engine status */
  workforce: WorkforceStatus;
  /** Number of skills indexed */
  skillsIndexed: number;
  /** Number of hooks registered */
  hooksRegistered: number;
  /** Initialization timestamp */
  initializedAt: string;
}

/** Track whether initialization has already run */
let initialized = false;
let cachedResult: WorkforceInitResult | null = null;

/**
 * Initialize the Workforce Engine.
 *
 * Call this once at application startup. Subsequent calls return the cached result.
 *
 * Steps:
 * 1. Initialize Protocol v1.0 (validate Agent Cards, register escalation rules)
 * 2. Build skill index (scan .claude/skills/ for SKILL.md files)
 * 3. Register default hooks (safety, audit, permission, rate-limit, token-budget)
 * 4. Initialize workforce registry (build capability index)
 *
 * @param workspaceId - Default workspace ID for initialization context
 * @returns Combined protocol health + workforce status
 */
export async function initializeWorkforce(
  workspaceId: string
): Promise<WorkforceInitResult> {
  // Return cached result if already initialized
  if (initialized && cachedResult) {
    return cachedResult;
  }

  // 1. Initialize Protocol v1.0
  const protocolHealth = initializeProtocol(AGENT_CARDS);

  // 2. Build skill index
  await skillLoader.buildIndex();

  // 3. Register default hooks (5 built-in + 5 enhanced)
  const defaultHooks = [
    createSafetyHook(),
    createAuditHook(),
    createPermissionHook(),
    createRateLimitHook(),
    createTokenBudgetHook(),
  ];

  // Enhanced hooks: PII redaction, brand voice, critic review, draft tracking, health monitor
  const enhancedHooks = createAllEnhancedHooks();

  for (const hook of [...defaultHooks, ...enhancedHooks]) {
    try {
      hookSystem.register(hook);
    } catch {
      // Hook may already be registered from a previous partial init
    }
  }

  // 4. Initialize workforce registry
  const workforceStatus = await workforceRegistry.initialize(workspaceId);

  const result: WorkforceInitResult = {
    protocol: protocolHealth,
    workforce: workforceStatus,
    skillsIndexed: skillLoader.skillCount,
    hooksRegistered: hookSystem.listHooks().length,
    initializedAt: new Date().toISOString(),
  };

  initialized = true;
  cachedResult = result;

  return result;
}

/**
 * Reset initialization state (for testing or hot reload).
 */
export function resetWorkforce(): void {
  initialized = false;
  cachedResult = null;
  skillLoader.clearCache();
}

/**
 * Check if the workforce engine is initialized.
 */
export function isWorkforceInitialized(): boolean {
  return initialized;
}

/**
 * Ensure workforce is initialized (lazy init).
 * Safe to call from any API route — only runs init once.
 * Handles concurrent calls safely (returns in-flight promise).
 */
let initPromise: Promise<WorkforceInitResult> | null = null;

export async function ensureWorkforceReady(
  workspaceId: string
): Promise<WorkforceInitResult> {
  if (initialized && cachedResult) {
    return cachedResult;
  }
  // Deduplicate concurrent init calls
  if (!initPromise) {
    initPromise = initializeWorkforce(workspaceId).finally(() => {
      initPromise = null;
    });
  }
  return initPromise;
}
