/**
 * Strategy Planner Integration - Phase 11 Week 3-4
 *
 * Integrates simulation results into StrategyPlannerService
 * for better proposal sequencing.
 */

import { getSupabaseServer } from "@/lib/supabase";
import { StrategySimulationService, SimulationResult, PathResult } from "./strategySimulationService";
import { StrategyEvaluationService, PathEvaluation } from "./strategyEvaluationService";

export interface OptimizedProposal {
  proposalId: string;
  originalSequence: string[];
  optimizedSequence: string[];
  simulationRunId: string;
  bestPathId: string;
  expectedValue: number;
  confidenceInterval: [number, number];
  improvements: ProposalImprovement[];
}

export interface ProposalImprovement {
  type: "REORDER" | "PARALLELIZE" | "REMOVE" | "ADD_DEPENDENCY";
  description: string;
  impactEstimate: number;
  confidence: number;
}

export interface SequenceOptimizationConfig {
  maxIterations?: number;
  parallelizationThreshold?: number;
  riskTolerance?: number;
  timeWeight?: number;
  valueWeight?: number;
}

export class StrategyPlannerIntegration {
  private simulationService: StrategySimulationService;
  private evaluationService: StrategyEvaluationService;
  private defaultConfig: Required<SequenceOptimizationConfig> = {
    maxIterations: 100,
    parallelizationThreshold: 0.8,
    riskTolerance: 0.5,
    timeWeight: 0.3,
    valueWeight: 0.5,
  };

  constructor() {
    this.simulationService = new StrategySimulationService();
    this.evaluationService = new StrategyEvaluationService();
  }

  /**
   * Optimize a proposal's action sequence using simulation results
   */
  async optimizeProposalSequence(
    proposalId: string,
    organizationId: string,
    config?: SequenceOptimizationConfig
  ): Promise<OptimizedProposal> {
    const cfg = { ...this.defaultConfig, ...config };
    const supabase = await getSupabaseServer();

    // Get proposal
    const { data: proposal } = await supabase
      .from("strategy_proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    const actions = proposal.actions || [];
    const originalSequence = actions.map((_: unknown, i: number) => `action-${i}`);

    // Create simulation for this proposal
    const simulation = await this.simulationService.createSimulation({
      organization_id: organizationId,
      name: `Optimization for ${proposal.title}`,
      description: `Automated optimization simulation`,
      simulation_type: "MULTI_PATH",
      config: {
        numIterations: cfg.maxIterations,
        riskMultiplier: 1 / cfg.riskTolerance,
      },
      source_proposal_id: proposalId,
    });

    // Run simulation
    const result = await this.simulationService.runSimulation(simulation.id);

    // Evaluate paths
    const evaluations = this.evaluationService.evaluatePaths(result, {
      riskTolerance: cfg.riskTolerance,
      timePreference: cfg.timeWeight,
      valueWeight: cfg.valueWeight,
    });

    // Get best path
    const bestEvaluation = evaluations[0];
    const bestPath = result.paths.find(p => p.pathId === bestEvaluation.pathId)!;

    // Generate optimized sequence
    const { optimizedSequence, improvements } = this.generateOptimizedSequence(
      actions,
      bestPath,
      cfg
    );

    // Update proposal with optimized sequence
    await supabase
      .from("strategy_proposals")
      .update({
        actions: this.reorderActions(actions, optimizedSequence),
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    return {
      proposalId,
      originalSequence,
      optimizedSequence,
      simulationRunId: simulation.id,
      bestPathId: bestPath.pathId,
      expectedValue: result.expectedValue,
      confidenceInterval: result.confidenceInterval,
      improvements,
    };
  }

  /**
   * Analyze and suggest improvements for a proposal based on simulation
   */
  async analyzeProposalWithSimulation(
    proposalId: string,
    organizationId: string
  ): Promise<{
    score: number;
    suggestions: ProposalImprovement[];
    metrics: Record<string, number>;
  }> {
    const supabase = await getSupabaseServer();

    // Get proposal
    const { data: proposal } = await supabase
      .from("strategy_proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    // Create quick simulation
    const simulation = await this.simulationService.createSimulation({
      organization_id: organizationId,
      name: `Analysis for ${proposal.title}`,
      simulation_type: "SINGLE_PATH",
      config: { numIterations: 50 },
      source_proposal_id: proposalId,
    });

    const result = await this.simulationService.runSimulation(simulation.id);
    const evaluations = this.evaluationService.evaluatePaths(result);

    const bestEval = evaluations[0];
    const suggestions: ProposalImprovement[] = [];

    // Analyze weaknesses
    if (bestEval.successProbability < 0.6) {
      suggestions.push({
        type: "ADD_DEPENDENCY",
        description: "Add validation checkpoints to increase success probability",
        impactEstimate: 15,
        confidence: 0.7,
      });
    }

    if (bestEval.duration > 100) {
      suggestions.push({
        type: "PARALLELIZE",
        description: "Identify independent actions that can run in parallel",
        impactEstimate: 20,
        confidence: 0.8,
      });
    }

    if (bestEval.weaknesses.includes("High risk exposure")) {
      suggestions.push({
        type: "REORDER",
        description: "Move high-risk actions earlier for faster feedback",
        impactEstimate: 10,
        confidence: 0.6,
      });
    }

    return {
      score: bestEval.score,
      suggestions,
      metrics: {
        expectedValue: bestEval.expectedValue,
        successProbability: bestEval.successProbability,
        duration: bestEval.duration,
        riskAdjustedValue: bestEval.riskAdjustedValue,
      },
    };
  }

  /**
   * Get optimization recommendations for multiple proposals
   */
  async batchAnalyzeProposals(
    proposalIds: string[],
    organizationId: string
  ): Promise<Map<string, { score: number; priority: number }>> {
    const results = new Map<string, { score: number; priority: number }>();

    for (const proposalId of proposalIds) {
      try {
        const analysis = await this.analyzeProposalWithSimulation(
          proposalId,
          organizationId
        );

        // Calculate priority based on score and potential improvement
        const priority = analysis.score * 0.6 +
          analysis.suggestions.reduce((sum, s) => sum + s.impactEstimate, 0) * 0.4;

        results.set(proposalId, {
          score: analysis.score,
          priority,
        });
      } catch (error) {
        console.error(`Failed to analyze proposal ${proposalId}:`, error);
      }
    }

    return results;
  }

  /**
   * Create a simulation-informed execution plan
   */
  async createExecutionPlan(
    proposalId: string,
    organizationId: string
  ): Promise<{
    phases: ExecutionPhase[];
    criticalPath: string[];
    parallelGroups: string[][];
    totalDuration: number;
    expectedValue: number;
  }> {
    // Run optimization first
    const optimized = await this.optimizeProposalSequence(proposalId, organizationId);
    const result = await this.simulationService.getSimulationResults(optimized.simulationRunId);

    if (!result) {
      throw new Error("Simulation results not found");
    }

    const bestPath = result.paths.find(p => p.pathId === optimized.bestPathId)!;

    // Analyze dependencies to find parallel groups
    const parallelGroups = this.findParallelGroups(bestPath.steps);

    // Build phases
    const phases = this.buildExecutionPhases(bestPath.steps, parallelGroups);

    // Identify critical path
    const criticalPath = this.identifyCriticalPath(bestPath.steps);

    return {
      phases,
      criticalPath,
      parallelGroups,
      totalDuration: bestPath.duration,
      expectedValue: result.expectedValue,
    };
  }

  // Private helpers

  private generateOptimizedSequence(
    actions: { name?: string; dependencies?: number[] }[],
    bestPath: PathResult,
    config: Required<SequenceOptimizationConfig>
  ): { optimizedSequence: string[]; improvements: ProposalImprovement[] } {
    const improvements: ProposalImprovement[] = [];
    const optimizedSequence: string[] = [];

    // Simple optimization: order by success probability * expected value
    const scoredActions = actions.map((action, idx) => {
      const step = bestPath.steps[idx];
      return {
        index: idx,
        score: step ? step.success_probability * (step.expected_value || 1) : 0,
      };
    });

    scoredActions.sort((a, b) => b.score - a.score);
    optimizedSequence.push(...scoredActions.map(a => `action-${a.index}`));

    // Check if reordering improved anything
    const originalOrder = actions.map((_, i) => i);
    const newOrder = scoredActions.map(a => a.index);

    if (JSON.stringify(originalOrder) !== JSON.stringify(newOrder)) {
      improvements.push({
        type: "REORDER",
        description: "Reordered actions by expected impact",
        impactEstimate: 10,
        confidence: 0.7,
      });
    }

    // Check for parallelization opportunities
    const independentActions = actions.filter(a => !a.dependencies?.length);
    if (independentActions.length > 1) {
      improvements.push({
        type: "PARALLELIZE",
        description: `${independentActions.length} actions can run in parallel`,
        impactEstimate: 15,
        confidence: 0.8,
      });
    }

    return { optimizedSequence, improvements };
  }

  private reorderActions(
    actions: unknown[],
    newOrder: string[]
  ): unknown[] {
    const indexMap = newOrder.map(id => parseInt(id.replace("action-", "")));
    return indexMap.map(i => actions[i]);
  }

  private findParallelGroups(steps: { depends_on_steps?: string[] }[]): string[][] {
    const groups: string[][] = [];
    const visited = new Set<number>();

    for (let i = 0; i < steps.length; i++) {
      if (visited.has(i)) {
continue;
}

      const group = [i];
      visited.add(i);

      // Find other steps with same dependencies
      for (let j = i + 1; j < steps.length; j++) {
        if (visited.has(j)) {
continue;
}

        const depsI = steps[i].depends_on_steps || [];
        const depsJ = steps[j].depends_on_steps || [];

        if (JSON.stringify(depsI.sort()) === JSON.stringify(depsJ.sort())) {
          group.push(j);
          visited.add(j);
        }
      }

      if (group.length > 1) {
        groups.push(group.map(idx => `step-${idx}`));
      }
    }

    return groups;
  }

  private buildExecutionPhases(
    steps: { action_name: string; expected_duration_hours?: number | null }[],
    parallelGroups: string[][]
  ): ExecutionPhase[] {
    const phases: ExecutionPhase[] = [];
    const stepsPerPhase = Math.ceil(steps.length / 4);

    const phaseNames = ["Discovery", "Implementation", "Validation", "Deployment"];

    for (let i = 0; i < 4; i++) {
      const start = i * stepsPerPhase;
      const end = Math.min(start + stepsPerPhase, steps.length);
      const phaseSteps = steps.slice(start, end);

      if (phaseSteps.length > 0) {
        phases.push({
          name: phaseNames[i],
          steps: phaseSteps.map(s => s.action_name),
          duration: phaseSteps.reduce((sum, s) => sum + (s.expected_duration_hours || 0), 0),
          parallelizable: parallelGroups.some(g =>
            g.some(id => parseInt(id.replace("step-", "")) >= start &&
                         parseInt(id.replace("step-", "")) < end)
          ),
        });
      }
    }

    return phases;
  }

  private identifyCriticalPath(
    steps: { id: string; depends_on_steps: string[]; expected_duration_hours?: number | null }[]
  ): string[] {
    // Find the longest path through dependencies
    const durations = new Map<string, number>();
    const predecessors = new Map<string, string | null>();

    for (const step of steps) {
      durations.set(step.id, step.expected_duration_hours || 0);
      predecessors.set(step.id, null);
    }

    // Topological sort and calculate longest paths
    for (const step of steps) {
      const currentDuration = durations.get(step.id)!;

      for (const depId of step.depends_on_steps || []) {
        const depDuration = durations.get(depId) || 0;
        if (depDuration + currentDuration > (durations.get(step.id) || 0)) {
          durations.set(step.id, depDuration + currentDuration);
          predecessors.set(step.id, depId);
        }
      }
    }

    // Find longest path
    let maxDuration = 0;
    let endStep = "";
    for (const [stepId, duration] of durations) {
      if (duration > maxDuration) {
        maxDuration = duration;
        endStep = stepId;
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let current: string | null = endStep;
    while (current) {
      path.unshift(current);
      current = predecessors.get(current) || null;
    }

    return path;
  }
}

interface ExecutionPhase {
  name: string;
  steps: string[];
  duration: number;
  parallelizable: boolean;
}

export default StrategyPlannerIntegration;
