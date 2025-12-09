/**
 * Proposal Engine Integration - Phase 11 Week 1-2
 *
 * Connects StrategyPlannerService with proposal generation and execution.
 */

import { StrategyPlannerService, AuditSignal, OperatorFeedback, StrategyProposal } from "./strategyPlannerService";
import { StrategyGraphService } from "./strategyGraphService";
import { getSupabaseServer } from "@/lib/supabase";

export interface ProposalInput {
  organizationId: string;
  signals: AuditSignal[];
  feedback?: OperatorFeedback[];
  autoMaterialize?: boolean;
}

export interface ProposalExecutionResult {
  proposal: StrategyProposal;
  materialized: boolean;
  nodeIds?: string[];
  edgeIds?: string[];
}

export class ProposalEngine {
  private plannerService: StrategyPlannerService;
  private graphService: StrategyGraphService;

  constructor() {
    this.plannerService = new StrategyPlannerService();
    this.graphService = new StrategyGraphService();
  }

  /**
   * Generate and optionally execute a strategy proposal
   */
  async processSignals(input: ProposalInput): Promise<ProposalExecutionResult> {
    const { organizationId, signals, feedback, autoMaterialize } = input;

    // Generate proposal from signals
    const proposal = await this.plannerService.generateProposalFromSignals(
      organizationId,
      signals,
      feedback
    );

    let result: ProposalExecutionResult = {
      proposal,
      materialized: false,
    };

    // Auto-materialize if requested and proposal passes quality checks
    if (autoMaterialize && this.shouldAutoMaterialize(proposal)) {
      const { nodeIds, edgeIds } = await this.plannerService.materializeProposal(proposal);
      result = {
        ...result,
        materialized: true,
        nodeIds,
        edgeIds,
      };
    }

    return result;
  }

  /**
   * Accept multi-step strategy inputs and convert to executable graph
   */
  async acceptMultiStepStrategy(
    organizationId: string,
    steps: MultiStepInput[]
  ): Promise<{ nodeIds: string[]; edgeIds: string[] }> {
    const nodeIds: string[] = [];
    const edgeIds: string[] = [];
    const nodeMap = new Map<number, string>();

    // Create nodes for each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const node = await this.graphService.createNode({
        organization_id: organizationId,
        name: step.name,
        description: step.description,
        node_type: step.nodeType || "ACTION",
        domain: step.domain || "general",
        priority: step.priority || 50,
        risk_level: step.riskLevel || "MEDIUM_RISK",
        estimated_duration_hours: step.estimatedHours,
        deadline: step.deadline,
        tags: step.tags || [],
      });
      nodeIds.push(node.id);
      nodeMap.set(i, node.id);
    }

    // Create edges based on dependencies
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.dependsOn) {
        for (const depIdx of step.dependsOn) {
          const sourceId = nodeMap.get(i);
          const targetId = nodeMap.get(depIdx);
          if (sourceId && targetId) {
            const edge = await this.graphService.createEdge({
              organization_id: organizationId,
              source_node_id: sourceId,
              target_node_id: targetId,
              edge_type: "DEPENDS_ON",
            });
            edgeIds.push(edge.id);
          }
        }
      }
    }

    return { nodeIds, edgeIds };
  }

  /**
   * Evaluate proposal quality and execution readiness
   */
  async evaluateProposal(proposalId: string): Promise<ProposalEvaluation> {
    const supabase = await getSupabaseServer();

    const { data: proposal } = await supabase
      .from("strategy_proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    const objectives = proposal.objectives || [];
    const tactics = proposal.tactics || [];
    const actions = proposal.actions || [];
    const riskAssessment = proposal.risk_assessment || {};
    const timeline = proposal.timeline || {};

    // Calculate scores
    const completenessScore = this.calculateCompletenessScore(objectives, tactics, actions);
    const riskScore = this.calculateRiskScore(riskAssessment);
    const feasibilityScore = this.calculateFeasibilityScore(timeline, actions);

    const overallScore = completenessScore * 0.3 + riskScore * 0.3 + feasibilityScore * 0.4;

    return {
      proposalId,
      overallScore,
      completenessScore,
      riskScore,
      feasibilityScore,
      recommendation: overallScore >= 70 ? "APPROVE" : overallScore >= 50 ? "REVIEW" : "REVISE",
      issues: this.identifyIssues(proposal),
    };
  }

  /**
   * Get execution recommendations for a proposal
   */
  async getExecutionPlan(proposalId: string): Promise<ExecutionPlan> {
    const supabase = await getSupabaseServer();

    const { data: proposal } = await supabase
      .from("strategy_proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (!proposal) {
      throw new Error("Proposal not found");
    }

    const actions = proposal.actions || [];
    const timeline = proposal.timeline || {};
    const phases = timeline.phases || [];

    // Build execution phases with dependencies
    const executionPhases: ExecutionPhase[] = phases.map((phase: {
      name: string;
      weeks: number;
      actions: number[];
    }, idx: number) => ({
      phaseNumber: idx + 1,
      name: phase.name,
      duration: phase.weeks,
      actions: phase.actions.map((actionIdx: number) => ({
        index: actionIdx,
        ...actions[actionIdx],
      })),
      prerequisites: idx > 0 ? [idx] : [],
    }));

    return {
      proposalId,
      totalDuration: timeline.totalWeeks || 0,
      phases: executionPhases,
      criticalPath: this.identifyCriticalPath(actions),
      resourceRequirements: this.calculateResourceRequirements(actions),
    };
  }

  // Private helper methods

  private shouldAutoMaterialize(proposal: StrategyProposal): boolean {
    // Auto-materialize if confidence is high and risk is low
    const impact = proposal.estimatedImpact;
    const risk = proposal.riskAssessment;

    return (
      impact.confidenceScore >= 70 &&
      risk.overallRisk !== "HIGH_RISK" &&
      proposal.actions.length <= 10
    );
  }

  private calculateCompletenessScore(
    objectives: unknown[],
    tactics: unknown[],
    actions: unknown[]
  ): number {
    let score = 0;
    if (objectives.length > 0) {
score += 30;
}
    if (tactics.length > 0) {
score += 30;
}
    if (actions.length > 0) {
score += 40;
}
    return score;
  }

  private calculateRiskScore(riskAssessment: {
    overallRisk?: string;
    factors?: unknown[];
  }): number {
    const riskScores: Record<string, number> = {
      LOW_RISK: 90,
      MEDIUM_RISK: 60,
      HIGH_RISK: 30,
    };
    return riskScores[riskAssessment.overallRisk || "MEDIUM_RISK"] || 50;
  }

  private calculateFeasibilityScore(
    timeline: { totalWeeks?: number },
    actions: unknown[]
  ): number {
    const weeks = timeline.totalWeeks || 0;
    const actionCount = actions.length;

    // Score based on reasonable timeline
    if (weeks === 0 || actionCount === 0) {
return 50;
}

    const actionsPerWeek = actionCount / weeks;
    if (actionsPerWeek <= 3) {
return 90;
}
    if (actionsPerWeek <= 5) {
return 70;
}
    if (actionsPerWeek <= 8) {
return 50;
}
    return 30;
  }

  private identifyIssues(proposal: {
    objectives?: unknown[];
    tactics?: unknown[];
    actions?: unknown[];
  }): string[] {
    const issues: string[] = [];

    if (!proposal.objectives?.length) {
      issues.push("No objectives defined");
    }
    if (!proposal.tactics?.length) {
      issues.push("No tactics defined");
    }
    if (!proposal.actions?.length) {
      issues.push("No actions defined");
    }

    return issues;
  }

  private identifyCriticalPath(actions: { dependencies?: number[] }[]): number[] {
    // Simple critical path: actions with most dependencies
    const dependencyCounts = actions.map((_, idx) => {
      return actions.filter(a => a.dependencies?.includes(idx)).length;
    });

    // Return indices sorted by dependency count (most dependent first)
    return dependencyCounts
      .map((count, idx) => ({ idx, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => item.idx);
  }

  private calculateResourceRequirements(actions: { assignTo?: string }[]): ResourceRequirement[] {
    const assignmentCounts = new Map<string, number>();

    for (const action of actions) {
      if (action.assignTo) {
        assignmentCounts.set(
          action.assignTo,
          (assignmentCounts.get(action.assignTo) || 0) + 1
        );
      }
    }

    return Array.from(assignmentCounts.entries()).map(([assignee, count]) => ({
      resource: assignee,
      allocation: count,
      utilization: Math.min(count / actions.length * 100, 100),
    }));
  }
}

// Types

export interface MultiStepInput {
  name: string;
  description?: string;
  nodeType?: string;
  domain?: string;
  priority?: number;
  riskLevel?: string;
  estimatedHours?: number;
  deadline?: string;
  tags?: string[];
  dependsOn?: number[];
}

export interface ProposalEvaluation {
  proposalId: string;
  overallScore: number;
  completenessScore: number;
  riskScore: number;
  feasibilityScore: number;
  recommendation: "APPROVE" | "REVIEW" | "REVISE";
  issues: string[];
}

export interface ExecutionPhase {
  phaseNumber: number;
  name: string;
  duration: number;
  actions: Array<{ index: number; name?: string; description?: string }>;
  prerequisites: number[];
}

export interface ExecutionPlan {
  proposalId: string;
  totalDuration: number;
  phases: ExecutionPhase[];
  criticalPath: number[];
  resourceRequirements: ResourceRequirement[];
}

export interface ResourceRequirement {
  resource: string;
  allocation: number;
  utilization: number;
}

export default ProposalEngine;
