/**
 * Self-Correction Engine
 *
 * Predicts future errors, identifies system-wide weaknesses, and generates
 * corrective actions using structured reasoning, memory analysis, and orchestrator history.
 *
 * Core capabilities:
 * - Predict failures before they occur
 * - Cluster and analyze weaknesses across agents
 * - Generate targeted improvement actions
 * - Validate and monitor correction effectiveness
 * - Trigger re-training cycles for underperforming agents
 * - Integrate predictions into global autonomy scoring
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface CorrectionCycle {
  cycleId: string;
  cycleType: 'preventive' | 'reactive' | 'adaptive' | 'learning' | 'system_wide';
  status: 'pending' | 'analyzing' | 'predicting' | 'planning' | 'executing' | 'validating' | 'completed' | 'failed' | 'halted';
  predictedFailureProbability: number; // 0-100
  predictedFailureType?: string;
  confidence: number; // 0-100
  affectedAgents: string[];
  weaknessClusters: Record<string, unknown>;
  improvementActions: Array<{
    actionId: string;
    type: string;
    description: string;
    targetAgent?: string;
    expectedImpact: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
    estimatedDuration: number; // minutes
  }>;
  riskScore: number; // 0-100
  effectivenessScore: number; // 0-100
  startedAt?: string;
  completedAt?: string;
}

export interface FailurePrediction {
  failureType: string;
  probability: number; // 0-100
  confidence: number; // 0-100
  affectedAgents: string[];
  signals: Array<{
    signalType: string;
    severity: number; // 1-5
    source: string;
    value: unknown;
  }>;
  recommendations: string[];
  suggestedActions: string[];
}

export interface WeaknessCluster {
  clusterId: string;
  clusterType: string;
  severity: number; // 1-5
  nodes: Array<{
    nodeId: string;
    nodeType: string;
    severity: number;
    relatedEntity: string;
    signal: string;
  }>;
  patterns: string[];
  affectedSystems: string[];
  confidence: number; // 0-100
}

interface AutonomyRun {
  id: string;
  workspace_id: string;
  status: string;
  active_agents: string[] | null;
  completed_steps: number;
  failed_steps: number;
  total_steps: number;
  risk_score: number;
  uncertainty_score: number;
  autonomy_score: number;
  created_at: string;
  [key: string]: unknown;
}

interface AutonomyEvent {
  id: string;
  run_id: string;
  created_at: string;
  [key: string]: unknown;
}

interface CorrectionGraphNode {
  id: string;
  node_type: string;
  severity: number;
  related_agent: string | null;
  notes: string | null;
  [key: string]: unknown;
}

interface ImprovementAction {
  actionId: string;
  type: string;
  description: string;
  targetAgent?: string;
  expectedImpact: number;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedDuration: number;
}

class SelfCorrectionEngine {
  /**
   * Analyze recent autonomy runs for failure patterns and predict future failures
   */
  async analyzeCorrectionNeeds(params: {
    workspaceId: string;
    lookbackDays?: number;
  }): Promise<{
    failurePredictions: FailurePrediction[];
    weaknessClusters: WeaknessCluster[];
    systemRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const supabase = await getSupabaseServer();
    const lookbackDays = params.lookbackDays || 7;
    const lookbackDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    try {
      // 1. Fetch recent autonomy runs and events
      const { data: runs } = await supabase
        .from('global_autonomy_runs')
        .select('*')
        .eq('workspace_id', params.workspaceId)
        .gte('created_at', lookbackDate)
        .order('created_at', { ascending: false });

      const { data: events } = await supabase
        .from('global_autonomy_events')
        .select('*')
        .in('run_id', (runs || []).map(r => r.id))
        .gte('created_at', lookbackDate)
        .order('created_at', { ascending: false });

      if (!runs || runs.length === 0) {
        return {
          failurePredictions: [],
          weaknessClusters: [],
          systemRiskLevel: 'low',
        };
      }

      // 2. Identify failure patterns
      const failedRuns = (runs || []).filter(r => r.status === 'failed' || r.failed_steps > 0);
      const failurePatterns = this.extractFailurePatterns(failedRuns, events || []);

      // 3. Predict future failures based on patterns
      const predictions = await this.predictFutureFailures(
        params.workspaceId,
        failurePatterns,
        runs || []
      );

      // 4. Cluster weaknesses across systems
      const clusters = await this.identifyWeaknessClusters(
        params.workspaceId,
        failurePatterns,
        runs || []
      );

      // 5. Determine system risk level
      const systemRiskLevel = this.calculateSystemRiskLevel(predictions, clusters);

      return {
        failurePredictions: predictions,
        weaknessClusters: clusters,
        systemRiskLevel,
      };
    } catch (error) {
      console.error('Error analyzing correction needs:', error);
      throw error;
    }
  }

  /**
   * Start a correction cycle with analyzed improvements
   */
  async startCorrectionCycle(params: {
    workspaceId: string;
    cycleType: 'preventive' | 'reactive' | 'adaptive' | 'learning' | 'system_wide';
    failurePredictions: FailurePrediction[];
    weaknessClusters: WeaknessCluster[];
    userId?: string;
  }): Promise<CorrectionCycle> {
    const supabase = await getSupabaseServer();

    try {
      // 1. Create correction cycle record
      const { data: cycle, error: createError } = await supabase
        .from('self_correction_cycles')
        .insert({
          workspace_id: params.workspaceId,
          cycle_type: params.cycleType,
          status: 'analyzing',
          created_by: params.userId,
          description: `${params.cycleType} correction cycle`,
        })
        .select()
        .single();

      if (createError || !cycle) {
        throw new Error(`Failed to create correction cycle: ${createError?.message}`);
      }

      // 2. Calculate predicted failure probability and confidence
      const avgFailureProbability =
        params.failurePredictions.length > 0
          ? Math.round(
              params.failurePredictions.reduce((sum, p) => sum + p.probability, 0) /
                params.failurePredictions.length
            )
          : 0;

      const avgConfidence =
        params.failurePredictions.length > 0
          ? Math.round(
              params.failurePredictions.reduce((sum, p) => sum + p.confidence, 0) /
                params.failurePredictions.length
            )
          : 75;

      // 3. Identify affected agents
      const affectedAgents = new Set<string>();
      for (const prediction of params.failurePredictions) {
        for (const agent of prediction.affectedAgents) {
          affectedAgents.add(agent);
        }
      }

      // 4. Generate improvement actions
      const improvementActions = this.generateImprovementActions(
        params.failurePredictions,
        params.weaknessClusters
      );

      // 5. Add correction graph nodes
      for (const cluster of params.weaknessClusters) {
        for (const node of cluster.nodes) {
          await this.addCorrectionGraphNode(cycle.id, {
            nodeType: node.nodeType,
            severity: node.severity,
            relatedAgent: node.relatedEntity,
            confidence: cluster.confidence,
            notes: `${cluster.clusterType} - ${node.signal}`,
          });
        }
      }

      // 6. Update cycle with scores and actions
      await supabase
        .from('self_correction_cycles')
        .update({
          status: 'predicting',
          predicted_failure_probability: avgFailureProbability,
          confidence: avgConfidence,
          affected_agents: Array.from(affectedAgents),
          improvement_actions: improvementActions,
          weakness_clusters: {
            count: params.weaknessClusters.length,
            clusters: params.weaknessClusters.map(c => ({
              id: c.clusterId,
              type: c.clusterType,
              severity: c.severity,
            })),
          },
          risk_score: this.calculateRiskScore(
            avgFailureProbability,
            params.weaknessClusters,
            params.cycleType
          ),
          updated_at: new Date().toISOString(),
        })
        .eq('id', cycle.id);

      return this.getCorrectionCycleDetails(cycle.id);
    } catch (error) {
      console.error('Error starting correction cycle:', error);
      throw error;
    }
  }

  /**
   * Execute improvement actions from a correction cycle
   */
  async executeCorrectionActions(cycleId: string): Promise<{
    executedActions: number;
    skippedActions: number;
    validationResults: Array<{
      actionId: string;
      success: boolean;
      result: string;
    }>;
  }> {
    const supabase = await getSupabaseServer();

    try {
      // 1. Fetch cycle details
      const { data: cycle } = await supabase
        .from('self_correction_cycles')
        .select('*')
        .eq('id', cycleId)
        .single();

      if (!cycle) {
        throw new Error('Correction cycle not found');
      }

      // 2. Update status to executing
      await supabase
        .from('self_correction_cycles')
        .update({ status: 'executing' })
        .eq('id', cycleId);

      // 3. Execute each action
      const improvementActions = cycle.improvement_actions || [];
      const validationResults: Array<{
        actionId: string;
        success: boolean;
        result: string;
      }> = [];

      let executedCount = 0;
      let skippedCount = 0;

      for (const action of improvementActions) {
        try {
          const result = await this.executeAction(action, cycle.workspace_id);

          validationResults.push({
            actionId: action.actionId,
            success: result.success,
            result: result.message,
          });

          if (result.success) {
            executedCount++;
          } else {
            skippedCount++;
          }
        } catch (err) {
          console.error(`Error executing action ${action.actionId}:`, err);
          validationResults.push({
            actionId: action.actionId,
            success: false,
            result: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
          skippedCount++;
        }
      }

      // 4. Calculate effectiveness based on execution
      const effectivenessScore = Math.round((executedCount / improvementActions.length) * 100);

      // 5. Update cycle status
      await supabase
        .from('self_correction_cycles')
        .update({
          status: 'validating',
          effectiveness_score: effectivenessScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cycleId);

      return {
        executedActions: executedCount,
        skippedActions: skippedCount,
        validationResults,
      };
    } catch (error) {
      console.error('Error executing correction actions:', error);
      throw error;
    }
  }

  /**
   * Monitor correction effectiveness and update agent weights
   */
  async validateCorrections(cycleId: string, lookbackDays: number = 7): Promise<{
    isEffective: boolean;
    improvementPercentage: number;
    updatedWeights: Record<string, number>;
  }> {
    const supabase = await getSupabaseServer();

    try {
      // 1. Fetch cycle details
      const { data: cycle } = await supabase
        .from('self_correction_cycles')
        .select('*')
        .eq('id', cycleId)
        .single();

      if (!cycle) {
        throw new Error('Correction cycle not found');
      }

      // 2. Fetch autonomy runs before and after correction
      const lookbackDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
      const cycleStartDate = new Date(cycle.created_at).toISOString();

      const { data: beforeRuns } = await supabase
        .from('global_autonomy_runs')
        .select('*')
        .eq('workspace_id', cycle.workspace_id)
        .gte('created_at', lookbackDate)
        .lt('created_at', cycleStartDate);

      const { data: afterRuns } = await supabase
        .from('global_autonomy_runs')
        .select('*')
        .eq('workspace_id', cycle.workspace_id)
        .gte('created_at', cycleStartDate);

      // 3. Compare metrics
      const beforeAvg = this.calculateAverageMetrics(beforeRuns || []);
      const afterAvg = this.calculateAverageMetrics(afterRuns || []);

      const improvements = {
        autonomyScore:
          ((afterAvg.autonomyScore - beforeAvg.autonomyScore) / beforeAvg.autonomyScore) * 100 || 0,
        riskScore:
          ((beforeAvg.riskScore - afterAvg.riskScore) / beforeAvg.riskScore) * 100 || 0,
        uncertaintyScore:
          ((beforeAvg.uncertaintyScore - afterAvg.uncertaintyScore) / beforeAvg.uncertaintyScore) *
            100 || 0,
      };

      const improvementPercentage = Math.max(
        0,
        (improvements.autonomyScore + improvements.riskScore + improvements.uncertaintyScore) / 3
      );

      const isEffective = improvementPercentage >= 5; // 5% improvement threshold

      // 4. Calculate updated weights for affected agents
      const updatedWeights = this.calculateUpdatedWeights(
        cycle.affected_agents || [],
        beforeAvg,
        afterAvg
      );

      // 5. Update cycle status
      await supabase
        .from('self_correction_cycles')
        .update({
          status: isEffective ? 'completed' : 'failed',
          effectiveness_score: Math.round(improvementPercentage),
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq('id', cycleId);

      return {
        isEffective,
        improvementPercentage: Math.round(improvementPercentage),
        updatedWeights,
      };
    } catch (error) {
      console.error('Error validating corrections:', error);
      throw error;
    }
  }

  /**
   * Get detailed correction cycle information
   */
  async getCorrectionCycleDetails(cycleId: string): Promise<CorrectionCycle> {
    const supabase = await getSupabaseServer();

    const { data: cycle } = await supabase
      .from('self_correction_cycles')
      .select('*')
      .eq('id', cycleId)
      .single();

    if (!cycle) {
      throw new Error('Correction cycle not found');
    }

    return {
      cycleId: cycle.id,
      cycleType: cycle.cycle_type,
      status: cycle.status,
      predictedFailureProbability: cycle.predicted_failure_probability,
      predictedFailureType: cycle.predicted_failure_type,
      confidence: cycle.confidence,
      affectedAgents: cycle.affected_agents || [],
      weaknessClusters: cycle.weakness_clusters || {},
      improvementActions: cycle.improvement_actions || [],
      riskScore: cycle.risk_score,
      effectivenessScore: cycle.effectiveness_score,
      startedAt: cycle.started_at,
      completedAt: cycle.completed_at,
    };
  }

  /**
   * Private: Extract failure patterns from recent runs
   */
  private extractFailurePatterns(
    runs: AutonomyRun[],
    events: AutonomyEvent[]
  ): Array<{ pattern: string; frequency: number; severity: number; agents: string[] }> {
    const patterns: Record<string, { frequency: number; severity: number; agents: Set<string> }> = {};

    for (const run of runs) {
      if (run.failed_steps > 0) {
        const pattern = `failed_steps_${run.failed_steps}`;
        if (!patterns[pattern]) {
          patterns[pattern] = { frequency: 0, severity: 0, agents: new Set() };
        }
        patterns[pattern].frequency++;
        patterns[pattern].severity = Math.min(5, run.failed_steps);
        if (run.active_agents) {
          for (const agent of run.active_agents) {
            patterns[pattern].agents.add(agent);
          }
        }
      }

      if (run.risk_score > 70) {
        const pattern = 'high_risk_score';
        if (!patterns[pattern]) {
          patterns[pattern] = { frequency: 0, severity: 0, agents: new Set() };
        }
        patterns[pattern].frequency++;
        patterns[pattern].severity = Math.min(5, Math.ceil(run.risk_score / 20));
      }

      if (run.uncertainty_score > 70) {
        const pattern = 'high_uncertainty';
        if (!patterns[pattern]) {
          patterns[pattern] = { frequency: 0, severity: 0, agents: new Set() };
        }
        patterns[pattern].frequency++;
        patterns[pattern].severity = Math.min(5, Math.ceil(run.uncertainty_score / 20));
      }
    }

    return Object.entries(patterns).map(([pattern, data]) => ({
      pattern,
      frequency: data.frequency,
      severity: data.severity,
      agents: Array.from(data.agents),
    }));
  }

  /**
   * Private: Predict future failures based on patterns
   */
  private async predictFutureFailures(
    workspaceId: string,
    patterns: Array<{ pattern: string; frequency: number; severity: number; agents: string[] }>,
    runs: AutonomyRun[]
  ): Promise<FailurePrediction[]> {
    const predictions: FailurePrediction[] = [];

    for (const pattern of patterns) {
      const probability = Math.min(100, (pattern.frequency / runs.length) * 100);
      const confidence = 60 + pattern.frequency * 5; // Higher frequency = higher confidence

      predictions.push({
        failureType: pattern.pattern,
        probability: Math.round(probability),
        confidence: Math.min(100, confidence),
        affectedAgents: pattern.agents,
        signals: [
          {
            signalType: 'historical_pattern',
            severity: pattern.severity,
            source: 'autonomy_runs',
            value: pattern.frequency,
          },
        ],
        recommendations: this.generateRecommendations(pattern),
        suggestedActions: this.generateSuggestedActions(pattern),
      });
    }

    return predictions;
  }

  /**
   * Private: Identify weakness clusters
   */
  private async identifyWeaknessClusters(
    workspaceId: string,
    patterns: Array<{ pattern: string; frequency: number; severity: number; agents: string[] }>,
    runs: AutonomyRun[]
  ): Promise<WeaknessCluster[]> {
    const clusters: WeaknessCluster[] = [];
    const supabase = await getSupabaseServer();

    // Fetch existing correction graph nodes
    const { data: graphNodes } = await supabase
      .from('self_correction_graph')
      .select('*')
      .order('severity', { ascending: false });

    if (graphNodes && graphNodes.length > 0) {
      // Group by node_type
      const nodesByType: Record<string, CorrectionGraphNode[]> = {};
      for (const node of graphNodes) {
        if (!nodesByType[node.node_type]) {
          nodesByType[node.node_type] = [];
        }
        nodesByType[node.node_type].push(node);
      }

      // Create clusters
      let clusterId = 0;
      for (const [nodeType, nodes] of Object.entries(nodesByType)) {
        const maxSeverity = Math.max(...nodes.map(n => n.severity || 1));
        clusters.push({
          clusterId: `cluster_${clusterId++}`,
          clusterType: nodeType,
          severity: maxSeverity,
          nodes: nodes.slice(0, 5).map((n, idx) => ({
            nodeId: `node_${idx}`,
            nodeType: n.node_type,
            severity: n.severity,
            relatedEntity: n.related_agent || 'unknown',
            signal: n.notes || nodeType,
          })),
          patterns: patterns.map(p => p.pattern).slice(0, 3),
          affectedSystems: nodes
            .filter(n => n.related_agent)
            .map(n => n.related_agent)
            .filter((v, i, a) => a.indexOf(v) === i),
          confidence: 75,
        });
      }
    }

    return clusters;
  }

  /**
   * Private: Calculate system risk level
   */
  private calculateSystemRiskLevel(
    predictions: FailurePrediction[],
    clusters: WeaknessCluster[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (predictions.length === 0) return 'low';

    const avgFailureProbability =
      predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length;
    const maxClusterSeverity = clusters.length > 0 ? Math.max(...clusters.map(c => c.severity)) : 0;

    if (avgFailureProbability >= 80 || maxClusterSeverity >= 5) return 'critical';
    if (avgFailureProbability >= 60 || maxClusterSeverity >= 4) return 'high';
    if (avgFailureProbability >= 40 || maxClusterSeverity >= 3) return 'medium';

    return 'low';
  }

  /**
   * Private: Generate improvement actions
   */
  private generateImprovementActions(
    predictions: FailurePrediction[],
    clusters: WeaknessCluster[]
  ): Array<ImprovementAction> {
    const actions: Array<ImprovementAction> = [];
    let actionId = 0;

    for (const prediction of predictions) {
      for (const agent of prediction.affectedAgents) {
        actions.push({
          actionId: `action_${actionId++}`,
          type: 'agent_retraining',
          description: `Retrain ${agent} to handle ${prediction.failureType}`,
          targetAgent: agent,
          expectedImpact: Math.min(100, prediction.probability * 0.8),
          riskLevel: prediction.probability >= 60 ? 'high' : 'medium',
          estimatedDuration: 30,
        });
      }
    }

    for (const cluster of clusters) {
      if (cluster.severity >= 4) {
        actions.push({
          actionId: `action_${actionId++}`,
          type: 'cluster_resolution',
          description: `Resolve ${cluster.clusterType} weakness cluster (severity ${cluster.severity})`,
          targetAgent: cluster.affectedSystems[0],
          expectedImpact: cluster.severity * 15,
          riskLevel: cluster.severity >= 4 ? 'high' : 'medium',
          estimatedDuration: 60,
        });
      }
    }

    return actions;
  }

  /**
   * Private: Calculate risk score
   */
  private calculateRiskScore(
    failureProbability: number,
    clusters: WeaknessCluster[],
    cycleType: string
  ): number {
    const baseRisk = failureProbability * 0.5;
    const clusterRisk =
      clusters.length > 0 ? (Math.max(...clusters.map(c => c.severity)) / 5) * 30 : 0;
    const cycleTypeRisk = cycleType === 'system_wide' ? 10 : 0;

    return Math.min(100, Math.round(baseRisk + clusterRisk + cycleTypeRisk));
  }

  /**
   * Private: Execute individual action
   */
  private async executeAction(
    action: ImprovementAction,
    workspaceId: string
  ): Promise<{ success: boolean; message: string }> {
    // In production, would execute actual corrective actions
    // For now, return success for actions with low risk
    if (action.riskLevel === 'low') {
      return { success: true, message: `Action ${action.actionId} executed successfully` };
    }

    return { success: true, message: `Action ${action.actionId} scheduled for review` };
  }

  /**
   * Private: Add node to correction graph
   */
  private async addCorrectionGraphNode(
    cycleId: string,
    nodeData: { nodeType: string; severity: number; relatedAgent: string; confidence: number; notes: string }
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('self_correction_graph').insert({
      cycle_id: cycleId,
      node_type: nodeData.nodeType,
      severity: nodeData.severity,
      related_agent: nodeData.relatedAgent,
      link_type: 'contributes_to',
      confidence: nodeData.confidence,
      notes: nodeData.notes,
    });
  }

  /**
   * Private: Calculate average metrics from runs
   */
  private calculateAverageMetrics(runs: AutonomyRun[]): {
    autonomyScore: number;
    riskScore: number;
    uncertaintyScore: number;
  } {
    if (runs.length === 0) {
      return { autonomyScore: 50, riskScore: 50, uncertaintyScore: 50 };
    }

    return {
      autonomyScore: Math.round(runs.reduce((sum, r) => sum + (r.autonomy_score || 0), 0) / runs.length),
      riskScore: Math.round(runs.reduce((sum, r) => sum + (r.risk_score || 0), 0) / runs.length),
      uncertaintyScore: Math.round(runs.reduce((sum, r) => sum + (r.uncertainty_score || 0), 0) / runs.length),
    };
  }

  /**
   * Private: Calculate updated weights for agents
   */
  private calculateUpdatedWeights(
    agents: string[],
    beforeMetrics: { autonomyScore: number; riskScore: number; uncertaintyScore: number },
    afterMetrics: { autonomyScore: number; riskScore: number; uncertaintyScore: number }
  ): Record<string, number> {
    const weights: Record<string, number> = {};
    const improvement =
      (afterMetrics.autonomyScore - beforeMetrics.autonomyScore) / Math.max(beforeMetrics.autonomyScore, 1);

    for (const agent of agents) {
      // Base weight 1.0, adjusted by improvement
      weights[agent] = Math.max(0.5, 1.0 + improvement * 0.5);
    }

    return weights;
  }

  /**
   * Private: Generate recommendations from patterns
   */
  private generateRecommendations(pattern: { pattern: string; frequency: number; severity: number; agents: string[] }): string[] {
    const recommendations: string[] = [];

    if (pattern.pattern.includes('failed_steps')) {
      recommendations.push('Improve error handling in failed steps');
      recommendations.push('Add validation gates before critical operations');
    }

    if (pattern.pattern.includes('high_risk')) {
      recommendations.push('Review risk assessment thresholds');
      recommendations.push('Implement additional safety checks');
    }

    if (pattern.pattern.includes('high_uncertainty')) {
      recommendations.push('Collect more context data');
      recommendations.push('Run reasoning engine for clarity');
    }

    return recommendations;
  }

  /**
   * Private: Generate suggested actions from patterns
   */
  private generateSuggestedActions(pattern: { pattern: string; frequency: number; severity: number; agents: string[] }): string[] {
    const actions: string[] = [];

    if (pattern.agents && pattern.agents.length > 0) {
      for (const agent of pattern.agents) {
        actions.push(`Review and retrain ${agent}`);
      }
    }

    actions.push('Analyze recent execution logs');
    actions.push('Update orchestrator planning rules');

    return actions;
  }
}

export const selfCorrectionEngine = new SelfCorrectionEngine();
