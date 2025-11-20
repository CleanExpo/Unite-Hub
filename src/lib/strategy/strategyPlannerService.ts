/**
 * Strategy Planner Service - Phase 11 Week 1-2
 *
 * Converts audit signals, SEO/GEO metrics, and operator feedback
 * into multi-step strategy proposals.
 */

import { getSupabaseServer } from "@/lib/supabase";
import {
  StrategyGraphService,
  NodeType,
  RiskLevel,
  CreateNodeRequest,
  CreateEdgeRequest,
} from "./strategyGraphService";

// Types
export interface AuditSignal {
  type: "SEO" | "GEO" | "CONTENT" | "TECHNICAL" | "BACKLINK" | "LOCAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  metric: string;
  currentValue: number;
  targetValue: number;
  description: string;
  domain: string;
}

export interface OperatorFeedback {
  feedbackType: "APPROVAL" | "REJECTION" | "MODIFICATION" | "ESCALATION";
  context: string;
  suggestedAction?: string;
  priority?: number;
}

export interface StrategyProposal {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  objectives: ProposedObjective[];
  tactics: ProposedTactic[];
  actions: ProposedAction[];
  metrics: ProposedMetric[];
  estimatedImpact: ImpactEstimate;
  riskAssessment: RiskAssessment;
  timeline: TimelineEstimate;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE";
  created_at: string;
}

export interface ProposedObjective {
  name: string;
  description: string;
  domain: string;
  priority: number;
  targetMetrics: { metric: string; target: number }[];
}

export interface ProposedTactic {
  name: string;
  description: string;
  objectiveRef: number;
  riskLevel: RiskLevel;
  estimatedHours: number;
}

export interface ProposedAction {
  name: string;
  description: string;
  tacticRef: number;
  assignTo?: string;
  deadline?: string;
  dependencies?: number[];
}

export interface ProposedMetric {
  name: string;
  description: string;
  objectiveRef: number;
  baseline: number;
  target: number;
  unit: string;
}

export interface ImpactEstimate {
  trafficIncrease: number;
  conversionImprovement: number;
  revenueImpact: number;
  timeToValue: number;
  confidenceScore: number;
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  factors: { factor: string; level: RiskLevel; mitigation: string }[];
}

export interface TimelineEstimate {
  totalWeeks: number;
  phases: { name: string; weeks: number; actions: number[] }[];
}

export interface PlannerConfig {
  autoApproveThreshold?: number;
  maxActionsPerProposal?: number;
  priorityWeights?: {
    severity: number;
    impact: number;
    effort: number;
  };
}

export class StrategyPlannerService {
  private graphService: StrategyGraphService;
  private config: Required<PlannerConfig>;

  constructor(config?: PlannerConfig) {
    this.graphService = new StrategyGraphService();
    this.config = {
      autoApproveThreshold: config?.autoApproveThreshold ?? 80,
      maxActionsPerProposal: config?.maxActionsPerProposal ?? 20,
      priorityWeights: config?.priorityWeights ?? {
        severity: 0.4,
        impact: 0.35,
        effort: 0.25,
      },
    };
  }

  /**
   * Generate a strategy proposal from audit signals
   */
  async generateProposalFromSignals(
    organizationId: string,
    signals: AuditSignal[],
    feedback?: OperatorFeedback[]
  ): Promise<StrategyProposal> {
    // Group signals by domain
    const signalsByDomain = this.groupSignalsByDomain(signals);

    // Prioritize signals
    const prioritizedSignals = this.prioritizeSignals(signals);

    // Generate objectives from high-priority signals
    const objectives = this.generateObjectives(prioritizedSignals.slice(0, 5));

    // Generate tactics for each objective
    const tactics = this.generateTactics(objectives, signalsByDomain);

    // Generate actions for each tactic
    const actions = this.generateActions(tactics, prioritizedSignals);

    // Generate metrics
    const metrics = this.generateMetrics(objectives, signals);

    // Calculate impact estimate
    const estimatedImpact = this.calculateImpactEstimate(signals, actions);

    // Assess risks
    const riskAssessment = this.assessRisks(signals, tactics);

    // Estimate timeline
    const timeline = this.estimateTimeline(actions);

    // Apply operator feedback adjustments
    if (feedback && feedback.length > 0) {
      this.applyFeedbackAdjustments(objectives, tactics, actions, feedback);
    }

    const proposal: StrategyProposal = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      title: this.generateProposalTitle(objectives),
      description: this.generateProposalDescription(signals, objectives),
      objectives,
      tactics,
      actions: actions.slice(0, this.config.maxActionsPerProposal),
      metrics,
      estimatedImpact,
      riskAssessment,
      timeline,
      status: "DRAFT",
      created_at: new Date().toISOString(),
    };

    return proposal;
  }

  /**
   * Convert a proposal to graph nodes
   */
  async materializeProposal(proposal: StrategyProposal): Promise<{
    nodeIds: string[];
    edgeIds: string[];
  }> {
    const nodeIds: string[] = [];
    const edgeIds: string[] = [];
    const nodeMap = new Map<string, string>();

    // Create objective nodes
    for (let i = 0; i < proposal.objectives.length; i++) {
      const obj = proposal.objectives[i];
      const node = await this.graphService.createNode({
        organization_id: proposal.organization_id,
        name: obj.name,
        description: obj.description,
        node_type: "OBJECTIVE",
        domain: obj.domain,
        priority: obj.priority,
        risk_level: "MEDIUM_RISK",
        tags: ["auto-generated", "proposal"],
      });
      nodeIds.push(node.id);
      nodeMap.set(`obj-${i}`, node.id);
    }

    // Create tactic nodes
    for (let i = 0; i < proposal.tactics.length; i++) {
      const tactic = proposal.tactics[i];
      const node = await this.graphService.createNode({
        organization_id: proposal.organization_id,
        name: tactic.name,
        description: tactic.description,
        node_type: "TACTIC",
        domain: proposal.objectives[tactic.objectiveRef]?.domain || "general",
        priority: 50,
        risk_level: tactic.riskLevel,
        estimated_duration_hours: tactic.estimatedHours,
        tags: ["auto-generated", "proposal"],
      });
      nodeIds.push(node.id);
      nodeMap.set(`tactic-${i}`, node.id);

      // Link tactic to objective
      const objNodeId = nodeMap.get(`obj-${tactic.objectiveRef}`);
      if (objNodeId) {
        const edge = await this.graphService.createEdge({
          organization_id: proposal.organization_id,
          source_node_id: node.id,
          target_node_id: objNodeId,
          edge_type: "ENABLES",
        });
        edgeIds.push(edge.id);
      }
    }

    // Create action nodes
    for (let i = 0; i < proposal.actions.length; i++) {
      const action = proposal.actions[i];
      const node = await this.graphService.createNode({
        organization_id: proposal.organization_id,
        name: action.name,
        description: action.description,
        node_type: "ACTION",
        domain: proposal.tactics[action.tacticRef]?.name || "general",
        priority: 50,
        risk_level: "LOW_RISK",
        deadline: action.deadline,
        assigned_to: action.assignTo,
        tags: ["auto-generated", "proposal"],
      });
      nodeIds.push(node.id);
      nodeMap.set(`action-${i}`, node.id);

      // Link action to tactic
      const tacticNodeId = nodeMap.get(`tactic-${action.tacticRef}`);
      if (tacticNodeId) {
        const edge = await this.graphService.createEdge({
          organization_id: proposal.organization_id,
          source_node_id: node.id,
          target_node_id: tacticNodeId,
          edge_type: "ENABLES",
        });
        edgeIds.push(edge.id);
      }

      // Link action dependencies
      if (action.dependencies) {
        for (const depIdx of action.dependencies) {
          const depNodeId = nodeMap.get(`action-${depIdx}`);
          if (depNodeId) {
            const edge = await this.graphService.createEdge({
              organization_id: proposal.organization_id,
              source_node_id: node.id,
              target_node_id: depNodeId,
              edge_type: "DEPENDS_ON",
            });
            edgeIds.push(edge.id);
          }
        }
      }
    }

    // Create metric nodes
    for (let i = 0; i < proposal.metrics.length; i++) {
      const metric = proposal.metrics[i];
      const node = await this.graphService.createNode({
        organization_id: proposal.organization_id,
        name: metric.name,
        description: metric.description,
        node_type: "METRIC",
        domain: proposal.objectives[metric.objectiveRef]?.domain || "general",
        priority: 30,
        risk_level: "LOW_RISK",
        input_data: { baseline: metric.baseline, target: metric.target, unit: metric.unit },
        tags: ["auto-generated", "proposal"],
      });
      nodeIds.push(node.id);

      // Link metric to objective
      const objNodeId = nodeMap.get(`obj-${metric.objectiveRef}`);
      if (objNodeId) {
        const edge = await this.graphService.createEdge({
          organization_id: proposal.organization_id,
          source_node_id: node.id,
          target_node_id: objNodeId,
          edge_type: "MEASURES",
        });
        edgeIds.push(edge.id);
      }
    }

    // Store proposal in database
    await this.storeProposal(proposal, nodeIds);

    return { nodeIds, edgeIds };
  }

  /**
   * Get stored proposals for an organization
   */
  async getProposals(
    organizationId: string,
    status?: StrategyProposal["status"]
  ): Promise<StrategyProposal[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from("strategy_proposals")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get proposals: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      organization_id: row.organization_id,
      title: row.title,
      description: row.description,
      objectives: row.objectives || [],
      tactics: row.tactics || [],
      actions: row.actions || [],
      metrics: row.metrics || [],
      estimatedImpact: row.estimated_impact || {},
      riskAssessment: row.risk_assessment || {},
      timeline: row.timeline || {},
      status: row.status,
      created_at: row.created_at,
    }));
  }

  /**
   * Update proposal status
   */
  async updateProposalStatus(
    proposalId: string,
    status: StrategyProposal["status"]
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from("strategy_proposals")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", proposalId);

    if (error) {
      throw new Error(`Failed to update proposal: ${error.message}`);
    }
  }

  // Private helper methods

  private groupSignalsByDomain(signals: AuditSignal[]): Map<string, AuditSignal[]> {
    const grouped = new Map<string, AuditSignal[]>();
    for (const signal of signals) {
      const existing = grouped.get(signal.domain) || [];
      existing.push(signal);
      grouped.set(signal.domain, existing);
    }
    return grouped;
  }

  private prioritizeSignals(signals: AuditSignal[]): AuditSignal[] {
    const severityScore: Record<string, number> = {
      CRITICAL: 100,
      HIGH: 75,
      MEDIUM: 50,
      LOW: 25,
    };

    return [...signals].sort((a, b) => {
      const scoreA = severityScore[a.severity] || 0;
      const scoreB = severityScore[b.severity] || 0;
      const gapA = Math.abs(a.targetValue - a.currentValue) / Math.max(a.targetValue, 1);
      const gapB = Math.abs(b.targetValue - b.currentValue) / Math.max(b.targetValue, 1);
      return scoreB + gapB * 50 - (scoreA + gapA * 50);
    });
  }

  private generateObjectives(signals: AuditSignal[]): ProposedObjective[] {
    return signals.map((signal, idx) => ({
      name: `Improve ${signal.metric}`,
      description: `${signal.description}. Target: ${signal.targetValue} (current: ${signal.currentValue})`,
      domain: signal.domain,
      priority: 100 - idx * 10,
      targetMetrics: [{ metric: signal.metric, target: signal.targetValue }],
    }));
  }

  private generateTactics(
    objectives: ProposedObjective[],
    signalsByDomain: Map<string, AuditSignal[]>
  ): ProposedTactic[] {
    const tactics: ProposedTactic[] = [];

    objectives.forEach((obj, objIdx) => {
      const domainSignals = signalsByDomain.get(obj.domain) || [];
      const riskLevel = domainSignals.some((s) => s.severity === "CRITICAL")
        ? "HIGH_RISK"
        : domainSignals.some((s) => s.severity === "HIGH")
        ? "MEDIUM_RISK"
        : "LOW_RISK";

      tactics.push({
        name: `${obj.domain} Optimization Strategy`,
        description: `Implement improvements for ${obj.name.toLowerCase()}`,
        objectiveRef: objIdx,
        riskLevel,
        estimatedHours: domainSignals.length * 8,
      });
    });

    return tactics;
  }

  private generateActions(
    tactics: ProposedTactic[],
    signals: AuditSignal[]
  ): ProposedAction[] {
    const actions: ProposedAction[] = [];
    let actionIdx = 0;

    tactics.forEach((tactic, tacticIdx) => {
      // Generate 2-4 actions per tactic
      const relevantSignals = signals.filter(
        (s) => s.domain === tactic.name.split(" ")[0]
      );

      const baseActions = [
        {
          name: `Audit current ${tactic.name.split(" ")[0].toLowerCase()} performance`,
          description: `Comprehensive analysis of current state and gaps`,
        },
        {
          name: `Implement ${tactic.name.split(" ")[0].toLowerCase()} improvements`,
          description: `Execute the optimization strategy`,
        },
        {
          name: `Monitor and adjust ${tactic.name.split(" ")[0].toLowerCase()} metrics`,
          description: `Track progress and iterate on approach`,
        },
      ];

      baseActions.forEach((action, i) => {
        actions.push({
          name: action.name,
          description: action.description,
          tacticRef: tacticIdx,
          dependencies: i > 0 ? [actionIdx - 1] : undefined,
        });
        actionIdx++;
      });
    });

    return actions;
  }

  private generateMetrics(
    objectives: ProposedObjective[],
    signals: AuditSignal[]
  ): ProposedMetric[] {
    return objectives.map((obj, objIdx) => {
      const signal = signals.find(
        (s) => s.domain === obj.domain && s.metric === obj.targetMetrics[0]?.metric
      );
      return {
        name: obj.targetMetrics[0]?.metric || `${obj.domain} Score`,
        description: `Track progress toward ${obj.name.toLowerCase()}`,
        objectiveRef: objIdx,
        baseline: signal?.currentValue || 0,
        target: signal?.targetValue || 100,
        unit: "points",
      };
    });
  }

  private calculateImpactEstimate(
    signals: AuditSignal[],
    actions: ProposedAction[]
  ): ImpactEstimate {
    const criticalCount = signals.filter((s) => s.severity === "CRITICAL").length;
    const highCount = signals.filter((s) => s.severity === "HIGH").length;

    return {
      trafficIncrease: Math.min(criticalCount * 15 + highCount * 8, 100),
      conversionImprovement: Math.min(criticalCount * 10 + highCount * 5, 50),
      revenueImpact: criticalCount * 5000 + highCount * 2000,
      timeToValue: Math.ceil(actions.length / 3) * 2, // weeks
      confidenceScore: Math.max(50, 90 - signals.length * 2),
    };
  }

  private assessRisks(
    signals: AuditSignal[],
    tactics: ProposedTactic[]
  ): RiskAssessment {
    const factors: { factor: string; level: RiskLevel; mitigation: string }[] = [];

    const criticalSignals = signals.filter((s) => s.severity === "CRITICAL");
    if (criticalSignals.length > 0) {
      factors.push({
        factor: "Critical issues require immediate attention",
        level: "HIGH_RISK",
        mitigation: "Prioritize critical fixes in first sprint",
      });
    }

    const highRiskTactics = tactics.filter((t) => t.riskLevel === "HIGH_RISK");
    if (highRiskTactics.length > 0) {
      factors.push({
        factor: "High-risk tactics may impact production",
        level: "HIGH_RISK",
        mitigation: "Implement in staging environment first",
      });
    }

    if (tactics.length > 5) {
      factors.push({
        factor: "Multiple concurrent initiatives",
        level: "MEDIUM_RISK",
        mitigation: "Phase implementation over multiple sprints",
      });
    }

    const overallRisk =
      factors.some((f) => f.level === "HIGH_RISK")
        ? "HIGH_RISK"
        : factors.some((f) => f.level === "MEDIUM_RISK")
        ? "MEDIUM_RISK"
        : "LOW_RISK";

    return { overallRisk, factors };
  }

  private estimateTimeline(actions: ProposedAction[]): TimelineEstimate {
    const actionsPerWeek = 3;
    const totalWeeks = Math.ceil(actions.length / actionsPerWeek);

    const phases: { name: string; weeks: number; actions: number[] }[] = [];
    let currentActionIdx = 0;

    const phaseNames = ["Discovery", "Implementation", "Optimization", "Monitoring"];
    const phaseSizes = [
      Math.ceil(actions.length * 0.2),
      Math.ceil(actions.length * 0.4),
      Math.ceil(actions.length * 0.25),
      actions.length - Math.ceil(actions.length * 0.85),
    ];

    phaseNames.forEach((name, i) => {
      const phaseActions: number[] = [];
      const size = phaseSizes[i];
      for (let j = 0; j < size && currentActionIdx < actions.length; j++) {
        phaseActions.push(currentActionIdx);
        currentActionIdx++;
      }
      if (phaseActions.length > 0) {
        phases.push({
          name,
          weeks: Math.ceil(phaseActions.length / actionsPerWeek),
          actions: phaseActions,
        });
      }
    });

    return { totalWeeks, phases };
  }

  private applyFeedbackAdjustments(
    objectives: ProposedObjective[],
    tactics: ProposedTactic[],
    actions: ProposedAction[],
    feedback: OperatorFeedback[]
  ): void {
    for (const fb of feedback) {
      if (fb.priority !== undefined) {
        // Adjust priorities based on feedback
        objectives.forEach((obj) => {
          if (obj.description.toLowerCase().includes(fb.context.toLowerCase())) {
            obj.priority = Math.min(100, obj.priority + fb.priority);
          }
        });
      }

      if (fb.feedbackType === "ESCALATION") {
        // Mark related tactics as high risk
        tactics.forEach((tactic) => {
          if (tactic.description.toLowerCase().includes(fb.context.toLowerCase())) {
            tactic.riskLevel = "HIGH_RISK";
          }
        });
      }
    }
  }

  private generateProposalTitle(objectives: ProposedObjective[]): string {
    if (objectives.length === 0) return "Strategy Proposal";
    if (objectives.length === 1) return objectives[0].name;
    return `Multi-Domain Strategy: ${objectives[0].domain} + ${objectives.length - 1} more`;
  }

  private generateProposalDescription(
    signals: AuditSignal[],
    objectives: ProposedObjective[]
  ): string {
    const criticalCount = signals.filter((s) => s.severity === "CRITICAL").length;
    const highCount = signals.filter((s) => s.severity === "HIGH").length;

    return `Strategy proposal addressing ${signals.length} audit signals (${criticalCount} critical, ${highCount} high priority) across ${objectives.length} objectives.`;
  }

  private async storeProposal(
    proposal: StrategyProposal,
    nodeIds: string[]
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase.from("strategy_proposals").insert({
      id: proposal.id,
      organization_id: proposal.organization_id,
      title: proposal.title,
      description: proposal.description,
      objectives: proposal.objectives,
      tactics: proposal.tactics,
      actions: proposal.actions,
      metrics: proposal.metrics,
      estimated_impact: proposal.estimatedImpact,
      risk_assessment: proposal.riskAssessment,
      timeline: proposal.timeline,
      node_ids: nodeIds,
      status: proposal.status,
      created_at: proposal.created_at,
    });

    if (error) {
      throw new Error(`Failed to store proposal: ${error.message}`);
    }
  }
}

export default StrategyPlannerService;
