/**
 * Agent Enforcement Hooks
 *
 * Safety gates and enforcement hooks that are injected into:
 * - Global Autonomy Engine
 * - Orchestrator
 * - Reasoning Engine
 * - Desktop Agent
 * - Synthex Agent
 * - Email Agent
 * - Content Agent
 * - Insights Agent
 *
 * These hooks intercept execution and enforce safety rules.
 */

import { safetyEnforcementManager } from './safetyEnforcementManager';
import { cascadeFailureModel } from './cascadeFailureModel';

export interface ExecutionContext {
  agentName: string;
  taskId: string;
  workspaceId: string;
  riskScore: number;
  uncertaintyScore: number;
  affectedAgents?: string[];
  metadata?: Record<string, any>;
}

export interface SafetyGateResult {
  allowed: boolean;
  reason?: string;
  action?: string;
  mustValidate?: boolean;
}

/**
 * Safety gate that checks if execution should proceed
 */
export async function checkExecutionSafetyGate(
  context: ExecutionContext
): Promise<SafetyGateResult> {
  const enforcement = safetyEnforcementManager.getEnforcementState();

  // Check 1: Is autonomy halted globally?
  if (enforcement.autonomyHalted) {
    return {
      allowed: false,
      reason: 'Global autonomy is halted by safety enforcement',
      action: 'halt_autonomy',
    };
  }

  // Check 2: Is the specific agent blocked?
  if (safetyEnforcementManager.isAgentBlocked(context.agentName)) {
    return {
      allowed: false,
      reason: `Agent '${context.agentName}' is blocked by safety enforcement`,
      action: 'block_agent',
    };
  }

  // Check 3: Is validation mode enabled?
  if (safetyEnforcementManager.isValidationModeEnabled()) {
    return {
      allowed: true,
      mustValidate: true,
      reason: 'Validation mode enabled - requires approval before execution',
    };
  }

  // Check 4: Is orchestrator paused?
  if (enforcement.orchestratorPaused && context.agentName === 'orchestrator') {
    return {
      allowed: false,
      reason: 'Orchestrator is paused by safety enforcement',
      action: 'pause_workflow',
    };
  }

  // Check 5: Is reasoning engine halted?
  if (safetyEnforcementManager.isReasoningEngineHalted() && context.agentName === 'reasoning-engine') {
    return {
      allowed: false,
      reason: 'Reasoning engine is halted by safety enforcement',
      action: 'halt_autonomy',
    };
  }

  // Check 6: Risk score exceeding threshold?
  if (context.riskScore >= 60) {
    return {
      allowed: true,
      mustValidate: true,
      reason: `High risk detected (${context.riskScore}%) - requires approval`,
    };
  }

  // Check 7: Uncertainty exceeding threshold?
  if (context.uncertaintyScore >= 70) {
    return {
      allowed: true,
      mustValidate: true,
      reason: `High uncertainty detected (${context.uncertaintyScore}%) - requires approval`,
    };
  }

  // All checks passed
  return { allowed: true };
}

/**
 * Pre-execution safety hook - validate before starting task
 */
export async function preExecutionSafetyHook(
  context: ExecutionContext
): Promise<SafetyGateResult> {
  const safetyGate = await checkExecutionSafetyGate(context);

  if (!safetyGate.allowed) {
    console.warn(`[SAFETY] Execution blocked for ${context.agentName}:${context.taskId}`, {
      reason: safetyGate.reason,
    });
  }

  return safetyGate;
}

/**
 * Post-execution safety hook - validate after task completion
 */
export async function postExecutionSafetyHook(params: {
  agentName: string;
  taskId: string;
  workspaceId: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  // Log execution result
  console.log(`[SAFETY] Task completed: ${params.agentName}:${params.taskId}`, {
    success: params.success,
    error: params.error,
  });

  // If task failed, it may indicate need for enforcement
  if (!params.success && params.error) {
    console.warn(`[SAFETY] Task failure - potential enforcement trigger`, {
      agent: params.agentName,
      error: params.error,
    });
  }
}

/**
 * Orchestrator-specific enforcement hook
 * Prevents orchestrator from starting new tasks if enforcement is active
 */
export async function orchestratorEnforcementHook(params: {
  workspaceId: string;
  taskCount: number;
  activeAgents: string[];
}): Promise<{
  canProceed: boolean;
  reason?: string;
  throttleLevel?: number;
}> {
  const enforcement = safetyEnforcementManager.getEnforcementState();

  // If orchestrator is paused, don't start new tasks
  if (enforcement.orchestratorPaused) {
    return {
      canProceed: false,
      reason: 'Orchestrator is paused by safety enforcement',
    };
  }

  // If autonomy is halted, don't start new tasks
  if (enforcement.autonomyHalted) {
    return {
      canProceed: false,
      reason: 'Autonomy is halted globally',
    };
  }

  // If validation mode is enabled, require approval before proceeding
  if (enforcement.validationModeEnabled) {
    return {
      canProceed: true,
      reason: 'Validation mode active - approval required',
      throttleLevel: 50, // 50% throttle under validation mode
    };
  }

  // Check if any agents are blocked
  const blockedAgents = params.activeAgents.filter(agent =>
    safetyEnforcementManager.isAgentBlocked(agent)
  );

  if (blockedAgents.length > 0) {
    return {
      canProceed: true,
      reason: `Blocked agents detected: ${blockedAgents.join(', ')}`,
      throttleLevel: 25, // 25% throttle due to blocked agents
    };
  }

  return { canProceed: true };
}

/**
 * Autonomy engine enforcement hook
 * Prevents autonomy runs if enforcement is active
 */
export async function autonomyEngineEnforcementHook(params: {
  workspaceId: string;
  autonomyScore: number;
  riskScore: number;
  uncertaintyScore: number;
}): Promise<{
  canRun: boolean;
  reason?: string;
  mustValidate?: boolean;
}> {
  // If autonomy is halted, reject
  if (safetyEnforcementManager.isAutonomyHalted()) {
    return {
      canRun: false,
      reason: 'Autonomy is halted by safety enforcement',
    };
  }

  // If validation mode is enabled, require approval
  if (safetyEnforcementManager.isValidationModeEnabled()) {
    return {
      canRun: true,
      mustValidate: true,
      reason: 'Validation mode active - approval required before autonomy run',
    };
  }

  // Check risk score
  if (params.riskScore >= 70) {
    return {
      canRun: true,
      mustValidate: true,
      reason: `High risk score (${params.riskScore}%) - requires approval`,
    };
  }

  return { canRun: true };
}

/**
 * Reasoning engine enforcement hook
 * Prevents reasoning if memory corruption is detected or reasoning is halted
 */
export async function reasoningEngineEnforcementHook(params: {
  workspaceId: string;
  memoryCorruptionScore: number;
  taskCount: number;
}): Promise<{
  canReason: boolean;
  reason?: string;
}> {
  // If reasoning engine is halted, reject
  if (safetyEnforcementManager.isReasoningEngineHalted()) {
    return {
      canReason: false,
      reason: 'Reasoning engine is halted due to memory corruption detection',
    };
  }

  // If memory corruption score is high, halt reasoning
  if (params.memoryCorruptionScore >= 60) {
    return {
      canReason: false,
      reason: `Memory corruption detected (${params.memoryCorruptionScore}%) - reasoning halted`,
    };
  }

  return { canReason: true };
}

/**
 * Desktop agent enforcement hook
 * Prevents desktop agent from executing if blocked
 */
export async function desktopAgentEnforcementHook(params: {
  workspaceId: string;
  actionType: string;
  targetSystem?: string;
}): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const context: ExecutionContext = {
    agentName: 'desktop-agent',
    taskId: params.actionType,
    workspaceId: params.workspaceId,
    riskScore: 40,
    uncertaintyScore: 30,
    metadata: { actionType: params.actionType, targetSystem: params.targetSystem },
  };

  const result = await checkExecutionSafetyGate(context);
  return {
    allowed: result.allowed,
    reason: result.reason,
  };
}

/**
 * Synthex agent enforcement hook
 * Prevents synthex agent from operating if autonomy is halted
 */
export async function synthexAgentEnforcementHook(params: {
  workspaceId: string;
  taskType: string;
}): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const context: ExecutionContext = {
    agentName: 'synthex-agent',
    taskId: params.taskType,
    workspaceId: params.workspaceId,
    riskScore: 35,
    uncertaintyScore: 40,
    metadata: { taskType: params.taskType },
  };

  const result = await checkExecutionSafetyGate(context);
  return {
    allowed: result.allowed,
    reason: result.reason,
  };
}

/**
 * General agent enforcement hook factory
 * Creates enforcement hooks for any agent
 */
export function createAgentEnforcementHook(agentName: string) {
  return async (params: {
    workspaceId: string;
    taskId: string;
    riskScore?: number;
    uncertaintyScore?: number;
  }): Promise<SafetyGateResult> => {
    const context: ExecutionContext = {
      agentName,
      taskId: params.taskId,
      workspaceId: params.workspaceId,
      riskScore: params.riskScore || 30,
      uncertaintyScore: params.uncertaintyScore || 30,
    };

    return checkExecutionSafetyGate(context);
  };
}

/**
 * Safety gate status reporter for debugging
 */
export function getEnforcementStatus(): {
  autonomyHalted: boolean;
  orchestratorPaused: boolean;
  validationModeEnabled: boolean;
  reasoningEngineHalted: boolean;
  blockedAgents: string[];
  throttlingAgents: string[];
} {
  const state = safetyEnforcementManager.getEnforcementState();

  return {
    autonomyHalted: state.autonomyHalted,
    orchestratorPaused: state.orchestratorPaused,
    validationModeEnabled: state.validationModeEnabled,
    reasoningEngineHalted: state.reasoningEngineHalted,
    blockedAgents: Object.entries(state.agentBlocked)
      .filter(([_, blocked]) => blocked)
      .map(([agent]) => agent),
    throttlingAgents: Object.entries(state.throttlingActive)
      .filter(([_, active]) => active)
      .map(([agent]) => agent),
  };
}
