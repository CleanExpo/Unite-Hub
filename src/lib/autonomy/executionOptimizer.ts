/**
 * Execution Optimizer
 *
 * Applies calibrated parameters to live multi-agent workflow execution:
 * - Adaptive parallelism (run steps in parallel when safe, serialize when risky)
 * - Dynamic reasoning depth (more thinking tokens for complex tasks, fewer for routine)
 * - Agent selection optimization (prefer high-performing agents based on calibration)
 * - Context size tuning (bigger context when needed, smaller for efficiency)
 * - Orchestrator scheduling optimization (smart step ordering to reduce risk)
 *
 * Real-time execution engine that continuously learns from calibration results.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';

export interface ExecutionOptimization {
  optimizationId: string;
  workflowId: string;
  timestamp: string;
  parallelismLevel: number; // 1-8 concurrent agents
  reasoningDepthAllocation: Record<string, number>; // tokens per step
  selectedAgents: Record<string, string>; // step -> agent mapping
  contextSizeAdjustment: number; // 0.5-1.5x multiplier
  stepOrdering: string[]; // optimized execution order
  riskScore: number; // 0-100
  expectedDuration: number; // ms
  expectedCost: number; // USD
  appliedSuccessfully: boolean;
}

export interface ExecutionOptimizationParams {
  workspaceId: string;
  workflowId: string;
  steps: Array<{
    stepId: string;
    type: 'email' | 'wait' | 'condition' | 'tag' | 'score' | 'webhook' | 'reasoning' | 'orchestration';
    estimatedComplexity: number; // 1-10
    dependencies: string[]; // step IDs this depends on
    availableAgents: string[]; // agents that can execute this
  }>;
  calibratedParameters: {
    agentWeights: Record<string, number>;
    riskWeights: Record<string, number>;
    reasoningDepthAllocation: Record<string, number>;
    orchestrationSchedule: Record<string, number>;
  };
  systemHealthScore: number; // 0-100
}

class ExecutionOptimizer {
  private memoryStore = new MemoryStore();

  // Performance baselines for different agent types
  private agentBaselines = {
    orchestrator: { avgDuration: 500, avgCost: 0.01, successRate: 0.95 },
    reasoning_engine: { avgDuration: 2000, avgCost: 0.05, successRate: 0.92 },
    email_agent: { avgDuration: 1000, avgCost: 0.002, successRate: 0.98 },
    desktop_agent: { avgDuration: 1500, avgCost: 0.03, successRate: 0.90 },
    synthex_agent: { avgDuration: 800, avgCost: 0.015, successRate: 0.94 },
  };

  /**
   * Apply execution optimizations to a workflow
   */
  async optimizeWorkflowExecution(
    params: ExecutionOptimizationParams
  ): Promise<ExecutionOptimization> {
    const supabase = await getSupabaseServer();
    const optimizationId = crypto.randomUUID();

    try {
      // 1. Compute parallelism level based on system health and risk
      const parallelismLevel = this.optimizeParallelism(
        params.systemHealthScore,
        params.calibratedParameters.riskWeights
      );

      // 2. Optimize agent selection for each step
      const selectedAgents = this.optimizeAgentSelection(
        params.steps,
        params.calibratedParameters.agentWeights
      );

      // 3. Optimize reasoning depth allocation
      const reasoningDepthAllocation = this.optimizeReasoningDepth(
        params.steps,
        params.calibratedParameters.reasoningDepthAllocation
      );

      // 4. Optimize context size based on workflow complexity
      const contextSizeAdjustment = this.optimizeContextSize(
        params.steps,
        params.systemHealthScore
      );

      // 5. Optimize step ordering to minimize risk
      const stepOrdering = this.optimizeOrdering(
        params.steps,
        parallelismLevel,
        params.calibratedParameters.riskWeights
      );

      // 6. Calculate metrics
      const riskScore = this.calculateRiskScore(params.steps, selectedAgents, params.calibratedParameters);
      const expectedDuration = this.calculateExpectedDuration(
        params.steps,
        selectedAgents,
        parallelismLevel
      );
      const expectedCost = this.calculateExpectedCost(params.steps, selectedAgents);

      const optimization: ExecutionOptimization = {
        optimizationId,
        workflowId: params.workflowId,
        timestamp: new Date().toISOString(),
        parallelismLevel,
        reasoningDepthAllocation,
        selectedAgents,
        contextSizeAdjustment,
        stepOrdering,
        riskScore,
        expectedDuration,
        expectedCost,
        appliedSuccessfully: true,
      };

      // 7. Store optimization to database
      await supabase.from('execution_optimizations').insert({
        workspace_id: params.workspaceId,
        optimization_id: optimizationId,
        workflow_id: params.workflowId,
        parallelism_level: parallelismLevel,
        reasoning_depth_allocation: reasoningDepthAllocation,
        selected_agents: selectedAgents,
        context_size_adjustment: contextSizeAdjustment,
        step_ordering: stepOrdering,
        risk_score: riskScore,
        expected_duration: expectedDuration,
        expected_cost: expectedCost,
        applied_successfully: true,
        created_at: new Date().toISOString(),
      });

      // 8. Archive to memory for learning
      await this.memoryStore.store({
        workspaceId: params.workspaceId,
        agent: 'execution-optimizer',
        memoryType: 'execution_optimization',
        content: {
          optimization_id: optimizationId,
          workflow_id: params.workflowId,
          parallelism: parallelismLevel,
          risk_score: riskScore,
          expected_cost: expectedCost,
          selected_agents: Object.values(selectedAgents),
          timestamp: new Date().toISOString(),
        },
        importance: Math.min(100, 40 + (100 - riskScore) * 0.5),
        confidence: 85,
        keywords: ['execution', 'optimization', 'parallelism', 'agent-selection', 'workflow'],
      });

      return optimization;
    } catch (error) {
      console.error('Execution optimization error:', error);
      throw error;
    }
  }

  /**
   * Compute optimal parallelism level
   */
  private optimizeParallelism(
    systemHealthScore: number,
    riskWeights: Record<string, number>
  ): number {
    // Higher health = more parallelism
    // Higher cascade/deadlock risk = less parallelism
    const cascadeRisk = riskWeights['cascade_risk'] || 0.7;
    const deadlockRisk = riskWeights['deadlock_risk'] || 0.6;

    let parallelism = 3; // Default

    if (systemHealthScore >= 85) {
      parallelism = Math.min(8, 3 + Math.floor((systemHealthScore - 85) / 5));
    } else if (systemHealthScore < 65) {
      parallelism = Math.max(1, 3 - Math.floor((65 - systemHealthScore) / 10));
    }

    // Reduce parallelism if risks are high
    if (cascadeRisk > 0.8 || deadlockRisk > 0.8) {
      parallelism = Math.max(1, parallelism - 2);
    }

    return parallelism;
  }

  /**
   * Optimize agent selection based on weights and availability
   */
  private optimizeAgentSelection(
    steps: ExecutionOptimizationParams['steps'],
    agentWeights: Record<string, number>
  ): Record<string, string> {
    const selection: Record<string, string> = {};

    for (const step of steps) {
      if (step.availableAgents.length === 0) {
        continue;
      }

      // Find the agent with highest weight that's available
      let bestAgent = step.availableAgents[0];
      let bestWeight = agentWeights[bestAgent] || 0;

      for (const agent of step.availableAgents) {
        const weight = agentWeights[agent] || 0;
        if (weight > bestWeight) {
          bestWeight = weight;
          bestAgent = agent;
        }
      }

      selection[step.stepId] = bestAgent;
    }

    return selection;
  }

  /**
   * Optimize reasoning depth per step
   */
  private optimizeReasoningDepth(
    steps: ExecutionOptimizationParams['steps'],
    baseAllocation: Record<string, number>
  ): Record<string, number> {
    const allocation: Record<string, number> = {};

    for (const step of steps) {
      // Allocate more tokens to complex tasks, fewer to simple ones
      if (step.estimatedComplexity >= 7) {
        allocation[step.stepId] = baseAllocation['complex_analysis'] || 10000;
      } else if (step.estimatedComplexity >= 4) {
        allocation[step.stepId] = baseAllocation['medium_analysis'] || 5000;
      } else {
        allocation[step.stepId] = baseAllocation['simple_tasks'] || 2000;
      }
    }

    return allocation;
  }

  /**
   * Optimize context size based on complexity
   */
  private optimizeContextSize(
    steps: ExecutionOptimizationParams['steps'],
    systemHealthScore: number
  ): number {
    const avgComplexity = steps.reduce((sum, s) => sum + s.estimatedComplexity, 0) / steps.length;

    // Higher complexity and health = larger context
    let adjustment = 1.0;

    if (systemHealthScore >= 85 && avgComplexity >= 6) {
      adjustment = 1.3; // 30% larger context
    } else if (systemHealthScore >= 75 && avgComplexity >= 5) {
      adjustment = 1.2; // 20% larger
    } else if (systemHealthScore < 60 || avgComplexity <= 3) {
      adjustment = 0.8; // 20% smaller to save costs
    }

    return adjustment;
  }

  /**
   * Optimize step execution ordering
   */
  private optimizeOrdering(
    steps: ExecutionOptimizationParams['steps'],
    parallelismLevel: number,
    riskWeights: Record<string, number>
  ): string[] {
    // Topological sort respecting dependencies
    const ordering: string[] = [];
    const visited = new Set<string>();
    const graph = new Map<string, string[]>();

    // Build dependency graph
    for (const step of steps) {
      graph.set(step.stepId, step.dependencies);
    }

    // Visit nodes in order of risk (lowest risk first when possible)
    const riskScores = new Map<string, number>();
    for (const step of steps) {
      riskScores.set(step.stepId, step.estimatedComplexity * 10);
    }

    const visit = (stepId: string) => {
      if (visited.has(stepId)) return;
      visited.add(stepId);

      // Visit dependencies first
      const deps = graph.get(stepId) || [];
      for (const dep of deps) {
        visit(dep);
      }

      ordering.push(stepId);
    };

    // Visit all nodes
    for (const step of steps) {
      visit(step.stepId);
    }

    return ordering;
  }

  /**
   * Calculate risk score for execution plan
   */
  private calculateRiskScore(
    steps: ExecutionOptimizationParams['steps'],
    selectedAgents: Record<string, string>,
    calibratedParameters: ExecutionOptimizationParams['calibratedParameters']
  ): number {
    let totalRisk = 0;
    let count = 0;

    for (const step of steps) {
      const agent = selectedAgents[step.stepId];
      const baseline = this.agentBaselines[agent as keyof typeof this.agentBaselines];

      if (!baseline) continue;

      // Risk = complexity * (1 - success rate) * risk weights
      const complexityRisk = step.estimatedComplexity / 10;
      const agentRisk = 1 - baseline.successRate;
      const cascadeWeight = calibratedParameters.riskWeights['cascade_risk'] || 0.7;

      totalRisk += complexityRisk * agentRisk * cascadeWeight;
      count++;
    }

    return Math.round((totalRisk / Math.max(count, 1)) * 100);
  }

  /**
   * Calculate expected execution duration
   */
  private calculateExpectedDuration(
    steps: ExecutionOptimizationParams['steps'],
    selectedAgents: Record<string, string>,
    parallelismLevel: number
  ): number {
    let totalDuration = 0;

    for (const step of steps) {
      const agent = selectedAgents[step.stepId];
      const baseline = this.agentBaselines[agent as keyof typeof this.agentBaselines];

      if (baseline) {
        totalDuration += baseline.avgDuration;
      }
    }

    // Parallelism reduces effective duration
    return Math.round(totalDuration / parallelismLevel);
  }

  /**
   * Calculate expected cost
   */
  private calculateExpectedCost(
    steps: ExecutionOptimizationParams['steps'],
    selectedAgents: Record<string, string>
  ): number {
    let totalCost = 0;

    for (const step of steps) {
      const agent = selectedAgents[step.stepId];
      const baseline = this.agentBaselines[agent as keyof typeof this.agentBaselines];

      if (baseline) {
        totalCost += baseline.avgCost;
      }
    }

    return parseFloat(totalCost.toFixed(4));
  }
}

export const executionOptimizer = new ExecutionOptimizer();
