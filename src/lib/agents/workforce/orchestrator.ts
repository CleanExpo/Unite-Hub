/**
 * Workforce Orchestrator (Workforce Engine)
 *
 * High-level coordinator that composes skills + agents + hooks into
 * executable workflows with parallel workstreams.
 *
 * Does NOT replace orchestrator-router.ts — it's a higher-level layer.
 * Individual workstreams delegate single-intent execution to the existing
 * router, planner, and executor infrastructure.
 *
 * Execution per workstream:
 * 1. Spawn agent → 2. Pre-execution hooks → 3. Load memory → 4. Load skills
 * 5. Build context → 6. Execute → 7. Post-execution hooks → 8. Verify output
 * 9. Store results → 10. Update metrics
 *
 * @module lib/agents/workforce/orchestrator
 */

import { randomUUID } from 'crypto';
import type {
  WorkflowDefinition,
  Workstream,
  WorkstreamStep,
  WorkstreamStatus,
} from './types';
import { workforceRegistry } from './registry';
import { lifecycleManager } from './agent-lifecycle';
import { hookSystem } from './hooks';
import { memoryManager } from './memory';
import { skillLoader } from './skill-loader';
import { agentEventLogger } from '../protocol/events';
import { verifyAgentOutput } from '../protocol/verification';
import { handoffManager } from '../protocol/handoff';
import { escalationManager } from '../protocol/escalation';
import type { UnifiedAgentId } from '../unified-registry';
import {
  orchestrate as routerOrchestrate,
  classifyIntent,
  type OrchestratorResult as RouterResult,
} from '../orchestrator-router';

// ============================================================================
// Types
// ============================================================================

/**
 * Request to the Workforce Orchestrator.
 */
export interface WorkforceRequest {
  /** Workspace scope */
  workspaceId: string;
  /** The objective/task to accomplish */
  objective: string;
  /** Optional context from previous operations */
  context?: Record<string, unknown>;
  /** Force a specific agent (bypass matching) */
  forceAgentId?: string;
  /** Maximum parallel workstreams (default: 3) */
  maxParallel?: number;
  /** Session ID for memory persistence */
  sessionId?: string;
}

/**
 * Result from the Workforce Orchestrator.
 */
export interface WorkforceResult {
  /** Whether the workflow succeeded */
  success: boolean;
  /** The executed workflow definition */
  workflow: WorkflowDefinition;
  /** Combined outputs from all workstreams */
  outputs: Record<string, unknown>;
  /** Errors from any workstream */
  errors: string[];
  /** Total execution time in milliseconds */
  totalExecutionTimeMs: number;
  /** Estimated token usage */
  tokensUsed: number;
  /** Agents that participated */
  agentsUsed: string[];
  /** Skills that were loaded */
  skillsLoaded: string[];
  /** Memory entries created during execution */
  memoriesCreated: number;
}

// ============================================================================
// Workforce Orchestrator
// ============================================================================

export class WorkforceOrchestrator {
  /**
   * Plan a workflow from an objective.
   * Decomposes the objective into workstreams using workforce matching.
   */
  async plan(request: WorkforceRequest): Promise<WorkflowDefinition> {
    const workflowId = randomUUID();
    const now = new Date().toISOString();

    // Classify intent using the router's pattern matching
    const intentResult = classifyIntent(request.objective);

    // Match the best agent+skills for this objective
    const match = request.forceAgentId
      ? {
          agentId: request.forceAgentId,
          confidence: 1.0,
          skills: [] as string[],
          hooks: [] as string[],
          reasoning: `Forced agent: ${request.forceAgentId}`,
        }
      : workforceRegistry.matchWorkforce(request.objective);

    // Merge router intent confidence with workforce match confidence
    const effectiveConfidence = Math.max(match.confidence, intentResult.confidence);

    // Create workstream with enriched context
    const workstream: Workstream = {
      id: randomUUID(),
      name: `${match.agentId}: ${request.objective.slice(0, 60)}`,
      agentId: match.agentId,
      skillIds: match.skills,
      steps: [
        {
          stepNumber: 1,
          action: request.objective,
          inputs: {
            objective: request.objective,
            context: request.context || {},
            intent: intentResult.intent,
            intentConfidence: intentResult.confidence,
          },
          hooks: match.hooks,
          status: 'pending',
        },
      ],
      dependsOn: [],
      status: 'pending',
    };

    const workflow: WorkflowDefinition = {
      id: workflowId,
      name: `Workflow: ${request.objective.slice(0, 80)}`,
      description: match.reasoning,
      workstreams: [workstream],
      workspaceId: request.workspaceId,
      objective: request.objective,
      createdAt: now,
      status: 'pending',
    };

    // Log workflow planned
    agentEventLogger.logEvent({
      eventType: 'task.received',
      agentId: 'workforce-orchestrator',
      workspaceId: request.workspaceId,
      severity: 'info',
      correlationId: workflowId,
      payload: {
        workflowId,
        objective: request.objective,
        matchedAgent: match.agentId,
        confidence: effectiveConfidence,
        intent: intentResult.intent,
        intentConfidence: intentResult.confidence,
        skillCount: match.skills.length,
        hookCount: match.hooks.length,
      },
    });

    return workflow;
  }

  /**
   * Execute a planned workflow.
   * Runs workstreams respecting dependency order, parallel where possible.
   */
  async execute(workflow: WorkflowDefinition): Promise<WorkforceResult> {
    const startTime = Date.now();
    const outputs: Record<string, unknown> = {};
    const errors: string[] = [];
    const agentsUsed = new Set<string>();
    const skillsLoaded = new Set<string>();
    let memoriesCreated = 0;
    let tokensUsed = 0;

    workflow.status = 'active';

    // Log workflow started
    agentEventLogger.logTaskStarted('workforce-orchestrator', workflow.workspaceId, {
      workflowId: workflow.id,
      objective: workflow.objective,
      workstreamCount: workflow.workstreams.length,
    });

    // Group workstreams by dependency level for parallel execution
    const levels = this.topologicalSort(workflow.workstreams);

    for (const level of levels) {
      // Execute all workstreams in this level in parallel
      const results = await Promise.allSettled(
        level.map((ws) =>
          this.executeWorkstream(ws, workflow.workspaceId, {
            ...outputs,
            ...(workflow.workstreams
              .filter((w) => w.status === 'completed')
              .reduce((acc, w) => ({ ...acc, [w.id]: w.output }), {})),
          })
        )
      );

      for (let i = 0; i < results.length; i++) {
        const ws = level[i];
        const result = results[i];

        if (result.status === 'fulfilled') {
          const wsResult = result.value;
          outputs[ws.id] = wsResult.output;
          agentsUsed.add(ws.agentId);
          wsResult.skillsLoaded.forEach((s: string) => skillsLoaded.add(s));
          tokensUsed += wsResult.tokensUsed;
          memoriesCreated += wsResult.memoriesCreated;
        } else {
          errors.push(`Workstream "${ws.name}" failed: ${result.reason}`);
          ws.status = 'failed';
          ws.error = String(result.reason);
        }
      }
    }

    // Determine overall status
    const allCompleted = workflow.workstreams.every((w) => w.status === 'completed');
    const anyFailed = workflow.workstreams.some((w) => w.status === 'failed');
    workflow.status = allCompleted ? 'completed' : anyFailed ? 'failed' : 'completed';

    const totalExecutionTimeMs = Date.now() - startTime;

    // Log workflow completed
    if (allCompleted) {
      agentEventLogger.logTaskCompleted('workforce-orchestrator', workflow.workspaceId, {
        workflowId: workflow.id,
        duration: totalExecutionTimeMs,
        agentsUsed: Array.from(agentsUsed),
      });
    } else {
      agentEventLogger.logTaskFailed(
        'workforce-orchestrator',
        workflow.workspaceId,
        errors.join('; '),
        { workflowId: workflow.id, duration: totalExecutionTimeMs }
      );
    }

    return {
      success: allCompleted,
      workflow,
      outputs,
      errors,
      totalExecutionTimeMs,
      tokensUsed,
      agentsUsed: Array.from(agentsUsed),
      skillsLoaded: Array.from(skillsLoaded),
      memoriesCreated,
    };
  }

  /**
   * Plan and execute in one call.
   */
  async run(request: WorkforceRequest): Promise<WorkforceResult> {
    const workflow = await this.plan(request);
    return this.execute(workflow);
  }

  /**
   * Execute a single workstream.
   */
  private async executeWorkstream(
    workstream: Workstream,
    workspaceId: string,
    context: Record<string, unknown>
  ): Promise<{
    output: unknown;
    skillsLoaded: string[];
    tokensUsed: number;
    memoriesCreated: number;
  }> {
    const correlationId = randomUUID();
    const agentId = workstream.agentId;
    const loadedSkillNames: string[] = [];
    let tokensUsed = 0;
    let memoriesCreated = 0;

    workstream.status = 'active';
    workstream.startedAt = new Date().toISOString();

    try {
      // 1. Spawn agent
      const instance = await lifecycleManager.spawn(agentId);

      // 2. Start task on agent
      lifecycleManager.startTask(agentId, workstream.id, correlationId);
      lifecycleManager.heartbeat(agentId);

      // 3. Run pre-execution hooks
      const preHookResult = await hookSystem.execute('pre-execution', {
        agentId,
        workspaceId,
        action: workstream.steps[0]?.action || workstream.name,
        inputs: context,
        hookChain: [],
        timestamp: new Date().toISOString(),
        correlationId,
      });

      if (!preHookResult.shouldProceed) {
        const blockReason = preHookResult.results
          .filter((r) => r.action === 'block')
          .map((r) => r.reason)
          .join('; ');
        throw new Error(`Pre-execution hooks blocked: ${blockReason}`);
      }

      // 4. Load agent memory
      const agentMemory = await memoryManager.getAgentContext(agentId, workspaceId, {
        maxTokens: 2000,
        minImportance: 30,
      });

      // 5. Load skills
      const skills = await skillLoader.loadForAgent(agentId);
      const taskSkills = await skillLoader.matchSkillsForTask(
        workstream.steps[0]?.action || workstream.name
      );
      const allSkills = [...skills, ...taskSkills];
      const uniqueSkills = allSkills.filter(
        (s, i, arr) => arr.findIndex((x) => x.manifest.name === s.manifest.name) === i
      );
      loadedSkillNames.push(...uniqueSkills.map((s) => s.manifest.name));
      tokensUsed += skillLoader.getTokenBudget(uniqueSkills);

      // 6. Build execution context
      const executionContext = {
        agentId,
        workspaceId,
        correlationId,
        objective: workstream.steps[0]?.action || workstream.name,
        skills: uniqueSkills.map((s) => ({
          name: s.manifest.name,
          description: s.manifest.description,
          content: s.content.slice(0, 2000), // Limit skill content
        })),
        memory: agentMemory,
        priorContext: preHookResult.inputs,
        agentRole: instance.card.role,
        agentCapabilities: instance.card.capabilities.map((c) => c.name),
      };

      // 7. Execute steps — delegate to orchestrator-router
      let stepOutput: unknown;
      for (const step of workstream.steps) {
        step.status = 'active';
        const stepStart = Date.now();

        lifecycleManager.heartbeat(agentId);

        // Run pre-tool-use hooks for this step
        const toolHookResult = await hookSystem.execute('pre-tool-use', {
          agentId,
          workspaceId,
          action: step.action,
          inputs: step.inputs,
          hookChain: [],
          timestamp: new Date().toISOString(),
          correlationId,
        });

        if (!toolHookResult.shouldProceed) {
          step.status = 'failed';
          step.executionTimeMs = Date.now() - stepStart;
          throw new Error(
            `Pre-tool-use hooks blocked step ${step.stepNumber}: ` +
            toolHookResult.results.filter((r) => r.action === 'block').map((r) => r.reason).join('; ')
          );
        }

        try {
          // Delegate to orchestrator-router for real agent execution
          const routerResult: RouterResult = await routerOrchestrate({
            workspaceId,
            userPrompt: step.action,
            context: {
              clientId: step.inputs.clientId as string | undefined,
              platform: step.inputs.platform as string | undefined,
              persona: step.inputs.persona as string | undefined,
              playbookId: step.inputs.playbookId as string | undefined,
              mapId: step.inputs.mapId as string | undefined,
            },
          });

          // Track tokens from the router execution
          tokensUsed += routerResult.tokensUsed;

          stepOutput = {
            success: routerResult.success,
            intent: routerResult.intent,
            agentId,
            action: step.action,
            outputs: routerResult.outputs,
            plan: routerResult.plan,
            validation: routerResult.validation,
            errors: routerResult.errors,
            tokensUsed: routerResult.tokensUsed,
            timestamp: new Date().toISOString(),
          };

          // Run post-tool-use hooks
          await hookSystem.execute('post-tool-use', {
            agentId,
            workspaceId,
            action: step.action,
            inputs: { result: stepOutput },
            hookChain: [],
            timestamp: new Date().toISOString(),
            correlationId,
          });

          if (routerResult.success) {
            step.status = 'completed';
          } else {
            step.status = 'failed';
            const routerErrors = routerResult.errors.join('; ');
            step.executionTimeMs = Date.now() - stepStart;
            throw new Error(`Router execution failed: ${routerErrors}`);
          }

          step.result = stepOutput;
          step.executionTimeMs = Date.now() - stepStart;
        } catch (stepError) {
          step.status = 'failed';
          step.executionTimeMs = Date.now() - stepStart;
          throw stepError;
        }
      }

      // 8. Run post-execution hooks
      await hookSystem.execute('post-execution', {
        agentId,
        workspaceId,
        action: workstream.name,
        inputs: { output: stepOutput, context: executionContext },
        hookChain: [],
        timestamp: new Date().toISOString(),
        correlationId,
      });

      // 9. Verify output
      const verification = verifyAgentOutput(
        agentId,
        stepOutput,
        workstream.steps[0]?.action || workstream.name
      );

      if (!verification.passed) {
        console.warn(
          `[WorkforceOrchestrator] Output verification warning for ${agentId}:`,
          verification.issues
        );
      }

      // 10. Store result in memory
      try {
        await memoryManager.set({
          scope: 'agent',
          workspaceId,
          agentId,
          key: `workstream:${workstream.id}`,
          value: {
            objective: workstream.name,
            output: stepOutput,
            verification: {
              score: verification.overallScore,
              passed: verification.passed,
            },
            completedAt: new Date().toISOString(),
          },
          importance: 60,
        });
        memoriesCreated++;
      } catch {
        // Memory storage is best-effort
      }

      // 11. Complete task on agent
      const totalMs = Date.now() - new Date(workstream.startedAt!).getTime();
      lifecycleManager.completeTask(agentId, workstream.id, true, totalMs);

      workstream.status = 'completed';
      workstream.completedAt = new Date().toISOString();
      workstream.output = stepOutput;

      return {
        output: stepOutput,
        skillsLoaded: loadedSkillNames,
        tokensUsed,
        memoriesCreated,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Complete task as failed
      try {
        const totalMs = workstream.startedAt
          ? Date.now() - new Date(workstream.startedAt).getTime()
          : 0;
        lifecycleManager.completeTask(agentId, workstream.id, false, totalMs);
      } catch {
        // Agent may not have been spawned
      }

      // Check escalation
      try {
        const escalation = escalationManager.checkEscalation(
          agentId,
          {
            confidenceScore: 0.3,
            errorCount: 1,
            executionTimeMs: workstream.startedAt
              ? Date.now() - new Date(workstream.startedAt).getTime()
              : 0,
          },
          workspaceId,
          { error: errorMsg, workstreamId: workstream.id }
        );

        if (escalation) {
          console.warn(
            `[WorkforceOrchestrator] Escalation triggered for ${agentId}:`,
            escalation.rule.description
          );
        }
      } catch {
        // Escalation check is best-effort
      }

      workstream.status = 'failed';
      workstream.error = errorMsg;
      workstream.completedAt = new Date().toISOString();

      throw error;
    }
  }

  /**
   * Topological sort of workstreams into dependency levels.
   * Each level contains workstreams that can run in parallel.
   */
  private topologicalSort(workstreams: Workstream[]): Workstream[][] {
    const levels: Workstream[][] = [];
    const completed = new Set<string>();
    let remaining = [...workstreams];

    while (remaining.length > 0) {
      // Find workstreams whose dependencies are all completed
      const ready = remaining.filter((ws) =>
        ws.dependsOn.every((dep) => completed.has(dep))
      );

      if (ready.length === 0 && remaining.length > 0) {
        // Circular dependency or missing dependency — force remaining into one level
        console.warn('[WorkforceOrchestrator] Dependency resolution failed, forcing execution');
        levels.push(remaining);
        break;
      }

      levels.push(ready);
      for (const ws of ready) {
        completed.add(ws.id);
      }
      remaining = remaining.filter((ws) => !completed.has(ws.id));
    }

    return levels;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const workforceOrchestrator = new WorkforceOrchestrator();
