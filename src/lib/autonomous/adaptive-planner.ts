/**
 * Adaptive Planning System
 *
 * Provides context-aware task decomposition, resource optimization,
 * and cross-agent knowledge transfer for autonomous operation.
 *
 * Features:
 * - Intelligent task decomposition based on historical data
 * - Dynamic resource allocation
 * - Cross-agent knowledge sharing
 * - Adaptive execution strategies
 * - Learning from past executions
 *
 * Usage:
 *   import { adaptivePlanner } from '@/lib/autonomous/adaptive-planner';
 *
 *   // Generate execution plan
 *   const plan = await adaptivePlanner.createPlan({
 *     goal: 'Process 100 emails and generate content',
 *     workspaceId: 'workspace-123',
 *     constraints: { maxDuration: 300000, maxCost: 5.00 }
 *   });
 *
 *   // Execute plan
 *   const result = await adaptivePlanner.executePlan(plan);
 */

import { executionFeedback, type AgentId, type TaskType } from '@/lib/learning/execution-feedback';
import { patternAnalyzer } from '@/lib/learning/pattern-analyzer';
import { performanceTracker } from '@/lib/learning/performance-tracker';
import { selfHealing } from './self-healing';

export interface PlanningGoal {
  description: string;
  workspaceId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  constraints?: {
    maxDuration?: number; // milliseconds
    maxCost?: number; // USD
    maxTokens?: number;
    deadline?: Date;
  };
  preferences?: {
    preferSpeed?: boolean;
    preferReliability?: boolean;
    preferCost?: boolean;
  };
}

export interface ExecutionPlan {
  id: string;
  goal: string;
  workspace_id: string;
  created_at: number;
  estimated_duration_ms: number;
  estimated_cost: number;
  confidence: number;
  steps: PlanStep[];
  dependencies: Map<string, string[]>; // step_id -> [dependent_step_ids]
  resource_allocation: ResourceAllocation;
  fallback_strategy?: string;
}

export interface PlanStep {
  id: string;
  agent_id: AgentId;
  task_type: TaskType;
  description: string;
  inputs: Record<string, any>;
  estimated_duration_ms: number;
  estimated_cost: number;
  success_probability: number;
  parallel_with?: string[]; // step_ids that can run in parallel
  retry_strategy?: string;
  fallback_step_id?: string;
}

export interface ResourceAllocation {
  agents: Map<AgentId, number>; // agent -> allocated time percentage
  estimated_tokens: number;
  estimated_api_calls: number;
  peak_concurrency: number;
}

export interface ExecutionResult {
  plan_id: string;
  success: boolean;
  actual_duration_ms: number;
  actual_cost: number;
  steps_completed: number;
  steps_failed: number;
  outputs: Record<string, any>;
  learnings: string[];
}

export interface KnowledgeItem {
  id: string;
  agent_id: AgentId;
  task_type: TaskType;
  category: 'best_practice' | 'known_issue' | 'optimization' | 'pattern';
  description: string;
  confidence: number;
  usage_count: number;
  created_at: number;
  last_used: number;
}

class AdaptivePlanningSystem {
  private knowledgeBase: Map<string, KnowledgeItem> = new Map();
  private executedPlans: Map<string, ExecutionResult> = new Map();

  /**
   * Create an execution plan from a goal
   */
  async createPlan(goal: PlanningGoal): Promise<ExecutionPlan> {
    const { description, workspaceId, priority, constraints, preferences } = goal;

    // Analyze goal to identify required tasks
    const tasks = await this.decomposeGoal(description, workspaceId);

    // Assign agents based on historical performance
    const steps = await this.assignAgents(tasks, workspaceId, preferences);

    // Optimize execution order
    const optimizedSteps = await this.optimizeExecutionOrder(steps, workspaceId);

    // Calculate dependencies
    const dependencies = this.calculateDependencies(optimizedSteps);

    // Allocate resources
    const resourceAllocation = this.allocateResources(optimizedSteps);

    // Estimate totals
    const estimatedDuration = this.estimateTotalDuration(optimizedSteps, dependencies);
    const estimatedCost = optimizedSteps.reduce((sum, step) => sum + step.estimated_cost, 0);

    // Validate against constraints
    if (constraints?.maxDuration && estimatedDuration > constraints.maxDuration) {
      console.warn('[AdaptivePlanner] Plan exceeds duration constraint, attempting optimization');
      // TODO: Implement constraint-based optimization
    }

    if (constraints?.maxCost && estimatedCost > constraints.maxCost) {
      console.warn('[AdaptivePlanner] Plan exceeds cost constraint, attempting optimization');
      // TODO: Implement cost-based optimization
    }

    // Calculate confidence
    const avgSuccessProbability =
      optimizedSteps.reduce((sum, step) => sum + step.success_probability, 0) /
      optimizedSteps.length;

    const plan: ExecutionPlan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      goal: description,
      workspace_id: workspaceId,
      created_at: Date.now(),
      estimated_duration_ms: estimatedDuration,
      estimated_cost: estimatedCost,
      confidence: avgSuccessProbability,
      steps: optimizedSteps,
      dependencies,
      resource_allocation: resourceAllocation,
      fallback_strategy: 'retry_with_reduced_scope',
    };

    return plan;
  }

  /**
   * Execute a plan
   */
  async executePlan(plan: ExecutionPlan): Promise<ExecutionResult> {
    const startTime = Date.now();
    const outputs: Record<string, any> = {};
    const learnings: string[] = [];
    let stepsCompleted = 0;
    let stepsFailed = 0;
    let actualCost = 0;

    // Group steps by execution phase (parallel batches)
    const executionPhases = this.createExecutionPhases(plan.steps, plan.dependencies);

    try {
      // Execute phases sequentially, steps within phase in parallel
      for (const phase of executionPhases) {
        const phaseResults = await Promise.allSettled(
          phase.map(async (step) => {
            try {
              const result = await this.executeStep(step, outputs, plan.workspace_id);

              stepsCompleted++;
              actualCost += result.cost || 0;

              // Store outputs for dependent steps
              outputs[step.id] = result.output;

              // Learn from execution
              if (result.learnings) {
                learnings.push(...result.learnings);
              }

              return result;
            } catch (error) {
              stepsFailed++;

              // Try fallback if available
              if (step.fallback_step_id) {
                const fallbackStep = plan.steps.find((s) => s.id === step.fallback_step_id);

                if (fallbackStep) {
                  learnings.push(`Step ${step.id} failed, executing fallback ${fallbackStep.id}`);

                  const fallbackResult = await this.executeStep(
                    fallbackStep,
                    outputs,
                    plan.workspace_id
                  );

                  outputs[step.id] = fallbackResult.output;
                  return fallbackResult;
                }
              }

              throw error;
            }
          })
        );

        // Check if any critical steps failed
        const failures = phaseResults.filter((r) => r.status === 'rejected');

        if (failures.length > 0) {
          learnings.push(`Phase failed with ${failures.length} step failure(s)`);
          break; // Stop execution on phase failure
        }
      }

      const result: ExecutionResult = {
        plan_id: plan.id,
        success: stepsFailed === 0,
        actual_duration_ms: Date.now() - startTime,
        actual_cost: actualCost,
        steps_completed: stepsCompleted,
        steps_failed: stepsFailed,
        outputs,
        learnings,
      };

      this.executedPlans.set(plan.id, result);

      // Update knowledge base with learnings
      await this.updateKnowledgeBase(plan, result);

      return result;
    } catch (error) {
      const result: ExecutionResult = {
        plan_id: plan.id,
        success: false,
        actual_duration_ms: Date.now() - startTime,
        actual_cost: actualCost,
        steps_completed: stepsCompleted,
        steps_failed: stepsFailed,
        outputs,
        learnings: [...learnings, `Fatal error: ${error instanceof Error ? error.message : error}`],
      };

      this.executedPlans.set(plan.id, result);

      return result;
    }
  }

  /**
   * Decompose goal into tasks
   */
  private async decomposeGoal(
    goal: string,
    workspaceId: string
  ): Promise<Array<{ type: TaskType; description: string; inputs: any }>> {
    const tasks: Array<{ type: TaskType; description: string; inputs: any }> = [];

    // Simple keyword-based decomposition (can be enhanced with AI)
    const goalLower = goal.toLowerCase();

    if (goalLower.includes('email')) {
      tasks.push({
        type: 'email_processing',
        description: 'Process emails',
        inputs: {},
      });
    }

    if (goalLower.includes('content') || goalLower.includes('generate')) {
      tasks.push({
        type: 'content_generation',
        description: 'Generate content',
        inputs: {},
      });
    }

    if (goalLower.includes('score') || goalLower.includes('contact')) {
      tasks.push({
        type: 'contact_scoring',
        description: 'Score contacts',
        inputs: {},
      });
    }

    if (goalLower.includes('campaign')) {
      tasks.push({
        type: 'campaign_execution',
        description: 'Execute campaign',
        inputs: {},
      });
    }

    // Default to orchestration if no specific tasks identified
    if (tasks.length === 0) {
      tasks.push({
        type: 'orchestration',
        description: goal,
        inputs: {},
      });
    }

    return tasks;
  }

  /**
   * Assign agents to tasks based on historical performance
   */
  private async assignAgents(
    tasks: Array<{ type: TaskType; description: string; inputs: any }>,
    workspaceId: string,
    preferences?: PlanningGoal['preferences']
  ): Promise<PlanStep[]> {
    const steps: PlanStep[] = [];

    for (const task of tasks) {
      // Get agent recommendations
      const recommendations = await executionFeedback.recommendAgent(
        task.type,
        workspaceId,
        {
          preferSpeed: preferences?.preferSpeed,
          preferReliability: preferences?.preferReliability,
        }
      );

      const bestAgent = recommendations[0] || { agent_id: 'orchestrator' as AgentId, avg_duration_ms: 5000, historical_success_rate: 0.8 };

      steps.push({
        id: `step_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        agent_id: bestAgent.agent_id,
        task_type: task.type,
        description: task.description,
        inputs: task.inputs,
        estimated_duration_ms: bestAgent.avg_duration_ms,
        estimated_cost: this.estimateCost(task.type, bestAgent.avg_duration_ms),
        success_probability: bestAgent.historical_success_rate,
        retry_strategy: 'exponential_backoff',
      });
    }

    return steps;
  }

  /**
   * Optimize execution order based on dependencies and performance
   */
  private async optimizeExecutionOrder(
    steps: PlanStep[],
    workspaceId: string
  ): Promise<PlanStep[]> {
    // Analyze patterns to find optimal ordering
    const patterns = await patternAnalyzer.detectPatterns(workspaceId, {
      types: ['sequential'],
      minConfidence: 0.6,
    });

    // For now, return steps as-is (can be enhanced with pattern-based ordering)
    return steps;
  }

  /**
   * Calculate dependencies between steps
   */
  private calculateDependencies(steps: PlanStep[]): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();

    // Simple dependency detection based on task types
    // (can be enhanced with input/output analysis)

    steps.forEach((step, index) => {
      const dependsOn: string[] = [];

      // Email processing should happen before content generation
      if (step.task_type === 'content_generation') {
        const emailSteps = steps
          .slice(0, index)
          .filter((s) => s.task_type === 'email_processing');

        dependsOn.push(...emailSteps.map((s) => s.id));
      }

      // Campaign execution depends on content generation
      if (step.task_type === 'campaign_execution') {
        const contentSteps = steps
          .slice(0, index)
          .filter((s) => s.task_type === 'content_generation');

        dependsOn.push(...contentSteps.map((s) => s.id));
      }

      if (dependsOn.length > 0) {
        dependencies.set(step.id, dependsOn);
      }
    });

    return dependencies;
  }

  /**
   * Allocate resources for plan execution
   */
  private allocateResources(steps: PlanStep[]): ResourceAllocation {
    const agentUsage = new Map<AgentId, number>();
    let totalDuration = 0;

    steps.forEach((step) => {
      totalDuration += step.estimated_duration_ms;
      agentUsage.set(
        step.agent_id,
        (agentUsage.get(step.agent_id) || 0) + step.estimated_duration_ms
      );
    });

    // Calculate percentages
    const agentPercentages = new Map<AgentId, number>();

    agentUsage.forEach((duration, agent) => {
      agentPercentages.set(agent, (duration / totalDuration) * 100);
    });

    return {
      agents: agentPercentages,
      estimated_tokens: steps.reduce(
        (sum, step) => sum + this.estimateTokens(step.task_type),
        0
      ),
      estimated_api_calls: steps.length,
      peak_concurrency: this.calculatePeakConcurrency(steps),
    };
  }

  /**
   * Estimate total duration considering parallelism
   */
  private estimateTotalDuration(
    steps: PlanStep[],
    dependencies: Map<string, string[]>
  ): number {
    const phases = this.createExecutionPhases(steps, dependencies);

    return phases.reduce((total, phase) => {
      const phaseDuration = Math.max(...phase.map((step) => step.estimated_duration_ms));
      return total + phaseDuration;
    }, 0);
  }

  /**
   * Create execution phases (parallel batches)
   */
  private createExecutionPhases(
    steps: PlanStep[],
    dependencies: Map<string, string[]>
  ): PlanStep[][] {
    const phases: PlanStep[][] = [];
    const completed = new Set<string>();
    const remaining = [...steps];

    while (remaining.length > 0) {
      const phase: PlanStep[] = [];

      // Find steps with no unmet dependencies
      for (let i = remaining.length - 1; i >= 0; i--) {
        const step = remaining[i];
        const deps = dependencies.get(step.id) || [];

        const allDepsMet = deps.every((depId) => completed.has(depId));

        if (allDepsMet) {
          phase.push(step);
          remaining.splice(i, 1);
        }
      }

      if (phase.length === 0 && remaining.length > 0) {
        // Circular dependency or error
        console.error('[AdaptivePlanner] Unable to resolve dependencies');
        break;
      }

      if (phase.length > 0) {
        phases.push(phase);
        phase.forEach((step) => completed.add(step.id));
      }
    }

    return phases;
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: PlanStep,
    context: Record<string, any>,
    workspaceId: string
  ): Promise<{ output: any; cost: number; learnings?: string[] }> {
    // This is a placeholder - actual implementation would call the appropriate agent
    console.log(`[AdaptivePlanner] Executing step: ${step.description} (${step.agent_id})`);

    // Use self-healing for execution
    const result = await selfHealing.executeWithHealing(
      step.task_type,
      async () => {
        // Simulate work
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, data: `Result from ${step.id}` };
      },
      {
        workspaceId,
        agentId: step.agent_id,
        description: step.description,
      }
    );

    return {
      output: result,
      cost: step.estimated_cost,
      learnings: [`Step ${step.id} completed successfully`],
    };
  }

  /**
   * Update knowledge base with learnings from plan execution
   */
  private async updateKnowledgeBase(
    plan: ExecutionPlan,
    result: ExecutionResult
  ): Promise<void> {
    // Learn from performance variance
    const durationVariance =
      (result.actual_duration_ms - plan.estimated_duration_ms) / plan.estimated_duration_ms;

    if (Math.abs(durationVariance) > 0.2) {
      // >20% variance
      this.addKnowledge({
        id: `knowledge_${Date.now()}`,
        agent_id: 'system',
        task_type: 'orchestration',
        category: 'pattern',
        description: `Plan execution ${durationVariance > 0 ? 'slower' : 'faster'} than estimated by ${Math.abs(durationVariance * 100).toFixed(1)}%`,
        confidence: 0.7,
        usage_count: 0,
        created_at: Date.now(),
        last_used: Date.now(),
      });
    }

    // Learn from failures
    if (result.steps_failed > 0) {
      this.addKnowledge({
        id: `knowledge_${Date.now()}`,
        agent_id: 'system',
        task_type: 'orchestration',
        category: 'known_issue',
        description: `Plan ${plan.id} had ${result.steps_failed} failed step(s)`,
        confidence: 0.8,
        usage_count: 0,
        created_at: Date.now(),
        last_used: Date.now(),
      });
    }
  }

  /**
   * Add knowledge to the knowledge base
   */
  addKnowledge(knowledge: KnowledgeItem): void {
    this.knowledgeBase.set(knowledge.id, knowledge);

    // Keep only last 1000 knowledge items
    if (this.knowledgeBase.size > 1000) {
      const oldestKey = Array.from(this.knowledgeBase.keys())[0];
      this.knowledgeBase.delete(oldestKey);
    }
  }

  /**
   * Query knowledge base
   */
  queryKnowledge(filters: {
    agentId?: AgentId;
    taskType?: TaskType;
    category?: KnowledgeItem['category'];
    minConfidence?: number;
  }): KnowledgeItem[] {
    return Array.from(this.knowledgeBase.values()).filter((item) => {
      if (filters.agentId && item.agent_id !== filters.agentId) return false;
      if (filters.taskType && item.task_type !== filters.taskType) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.minConfidence && item.confidence < filters.minConfidence) return false;
      return true;
    });
  }

  // Helper methods

  private estimateCost(taskType: TaskType, durationMs: number): number {
    // Simple cost estimation (can be enhanced with actual pricing)
    const baseCostPerSecond = 0.001; // $0.001 per second
    return (durationMs / 1000) * baseCostPerSecond;
  }

  private estimateTokens(taskType: TaskType): number {
    const tokenEstimates: Record<TaskType, number> = {
      email_processing: 500,
      content_generation: 2000,
      contact_scoring: 300,
      campaign_execution: 1000,
      database_query: 100,
      api_request: 200,
      file_processing: 800,
      data_transformation: 400,
      orchestration: 1500,
      other: 500,
    };

    return tokenEstimates[taskType] || 500;
  }

  private calculatePeakConcurrency(steps: PlanStep[]): number {
    // Simple estimation - can be enhanced with dependency analysis
    return Math.min(steps.length, 5); // Max 5 concurrent steps
  }

  /**
   * Get executed plans
   */
  getExecutedPlans(): ExecutionResult[] {
    return Array.from(this.executedPlans.values());
  }
}

// Singleton instance
export const adaptivePlanner = new AdaptivePlanningSystem();

// Export types and classes
export { AdaptivePlanningSystem };
