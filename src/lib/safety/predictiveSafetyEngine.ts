/**
 * Predictive Safety Engine
 *
 * Central predictive safety layer responsible for forecasting unsafe system states,
 * monitoring cross-agent signals, and enforcing early intervention rules to prevent
 * cascade failures and dangerous autonomous actions.
 *
 * Core responsibilities:
 * - Predict unsafe workflows and system states
 * - Detect agent cascade risks in real-time
 * - Throttle/block/override agent actions
 * - Trigger global safety interventions
 * - Maintain safety event ledger and audit trail
 */

import { getSupabaseServer } from '@/lib/supabase';
import { cascadeFailureModel } from './cascadeFailureModel';
import { safetyInterventionController } from './safetyInterventionController';
import { safetyArchiveBridge } from './safetyArchiveBridge';

export interface SafetyPrediction {
  predictionId: string;
  predictionType: string;
  probability: number; // 0-100
  confidence: number; // 0-100
  affectedAgents: string[];
  affectedSystems: string[];
  contributingFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  primaryRiskFactor: string;
  recommendedAction: 'block' | 'throttle' | 'pause' | 'halt' | 'validate' | 'monitor';
  actionPriority: 'low' | 'medium' | 'high' | 'critical';
  timeWindowMinutes: number;
  expiresAt: string;
}

export interface SafetyEvent {
  eventId: string;
  eventType: string;
  severity: number; // 1-5
  riskLevel: number; // 0-100
  source: string;
  detectedAt: string;
  intervention?: string;
  interventionExecuted: boolean;
  resolved: boolean;
  resolvedAt?: string;
}

export interface SafetyStatus {
  activeEvents: number;
  highRiskEvents: number;
  pendingPredictions: number;
  expiredPredictions: number;
  recentInterventions: number;
  avgRiskReduction: number;
  overallStatus: 'CRITICAL' | 'HIGH_RISK' | 'WARN' | 'HEALTHY';
}

class PredictiveSafetyEngine {
  /**
   * Perform comprehensive safety analysis and predict unsafe states
   */
  async analyzeSafety(params: {
    workspaceId: string;
    lookbackMinutes?: number;
  }): Promise<{
    predictions: SafetyPrediction[];
    cascadeRiskScore: number;
    cascadeMatrix: Map<string, Map<string, number>>;
    recommendedInterventions: Array<{
      action: string;
      priority: string;
      expectedRiskReduction: number;
    }>;
  }> {
    const supabase = await getSupabaseServer();
    const lookbackMinutes = params.lookbackMinutes || 60;

    try {
      // 1. Analyze cascade failure risks
      const cascadeAnalysis = await cascadeFailureModel.analyzeCascadeRisks({
        workspaceId: params.workspaceId,
        lookbackMinutes,
      });

      // 2. Generate safety predictions
      const predictions = await this.generateSafetyPredictions({
        workspaceId: params.workspaceId,
        cascadeAnalysis,
      });

      // 3. Calculate overall cascade risk
      const cascadeRiskScore = this.calculateCascadeRiskScore(cascadeAnalysis, predictions);

      // 4. Generate intervention recommendations
      const recommendedInterventions = this.generateInterventionRecommendations(
        predictions,
        cascadeRiskScore,
        cascadeAnalysis
      );

      return {
        predictions,
        cascadeRiskScore,
        cascadeMatrix: cascadeAnalysis.agentImpactMatrix,
        recommendedInterventions,
      };
    } catch (error) {
      console.error('Error analyzing safety:', error);
      throw error;
    }
  }

  /**
   * Predict unsafe states and forecast failure risks
   */
  private async generateSafetyPredictions(params: {
    workspaceId: string;
    cascadeAnalysis: any;
  }): Promise<SafetyPrediction[]> {
    const supabase = await getSupabaseServer();
    const predictions: SafetyPrediction[] = [];

    // 1. Cascade failure prediction
    if (params.cascadeAnalysis.cascadeRiskScore >= 50) {
      const cascadeProbability = Math.min(
        100,
        params.cascadeAnalysis.cascadeRiskScore + (params.cascadeAnalysis.activeFailureChains || 0) * 5
      );

      predictions.push({
        predictionId: `pred_cascade_${Date.now()}`,
        predictionType: 'cascade_failure',
        probability: Math.round(cascadeProbability),
        confidence: Math.round(params.cascadeAnalysis.cascadeConfidence),
        affectedAgents: params.cascadeAnalysis.vulnerableAgents || [],
        affectedSystems: ['orchestrator', 'autonomy_engine', 'memory_system'],
        contributingFactors: (params.cascadeAnalysis.cascadeFactors || []).map((f: any) => ({
          factor: f.type,
          impact: f.severity * 20,
          description: f.description,
        })),
        primaryRiskFactor: params.cascadeAnalysis.primaryRiskFactor || 'unknown_cascade',
        recommendedAction: cascadeProbability >= 80 ? 'halt' : cascadeProbability >= 70 ? 'pause' : 'throttle',
        actionPriority: cascadeProbability >= 80 ? 'critical' : cascadeProbability >= 70 ? 'high' : 'medium',
        timeWindowMinutes: 15,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
    }

    // 2. Agent deadlock prediction
    if (params.cascadeAnalysis.deadlockRiskScore >= 40) {
      predictions.push({
        predictionId: `pred_deadlock_${Date.now()}`,
        predictionType: 'deadlock',
        probability: Math.round(params.cascadeAnalysis.deadlockRiskScore),
        confidence: 65,
        affectedAgents: params.cascadeAnalysis.deadlockedAgents || [],
        affectedSystems: ['orchestrator'],
        contributingFactors: [
          {
            factor: 'circular_dependencies',
            impact: 40,
            description: 'Agents waiting on each other in circular pattern',
          },
          {
            factor: 'resource_contention',
            impact: 30,
            description: 'Multiple agents competing for same resources',
          },
        ],
        primaryRiskFactor: 'circular_agent_dependencies',
        recommendedAction: 'pause',
        actionPriority: 'high',
        timeWindowMinutes: 10,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
    }

    // 3. Memory corruption prediction
    if (params.cascadeAnalysis.memoryCorruptionScore >= 60) {
      predictions.push({
        predictionId: `pred_memory_${Date.now()}`,
        predictionType: 'memory_corruption',
        probability: Math.round(params.cascadeAnalysis.memoryCorruptionScore),
        confidence: Math.round(params.cascadeAnalysis.memoryConfidence),
        affectedAgents: [],
        affectedSystems: ['memory_system', 'autonomy_engine'],
        contributingFactors: [
          {
            factor: 'contradictions',
            impact: 35,
            description: 'Detected contradictions in memory state',
          },
          {
            factor: 'inconsistency',
            impact: 30,
            description: 'Memory records conflict with current system state',
          },
        ],
        primaryRiskFactor: 'memory_state_corruption',
        recommendedAction: 'validate',
        actionPriority: 'high',
        timeWindowMinutes: 20,
        expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      });
    }

    // 4. Orchestration collapse prediction
    if (params.cascadeAnalysis.orchestrationComplexityScore >= 70) {
      predictions.push({
        predictionId: `pred_orchestration_${Date.now()}`,
        predictionType: 'orchestration_collapse',
        probability: Math.round(params.cascadeAnalysis.orchestrationComplexityScore),
        confidence: 70,
        affectedAgents: params.cascadeAnalysis.overloadedAgents || [],
        affectedSystems: ['orchestrator'],
        contributingFactors: [
          {
            factor: 'task_complexity',
            impact: 40,
            description: 'Orchestrator managing too many concurrent workflows',
          },
          {
            factor: 'dependency_depth',
            impact: 30,
            description: 'Deep task dependency chains creating bottlenecks',
          },
        ],
        primaryRiskFactor: 'orchestration_overload',
        recommendedAction: 'throttle',
        actionPriority: 'medium',
        timeWindowMinutes: 25,
        expiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
      });
    }

    return predictions;
  }

  /**
   * Calculate overall cascade risk score
   */
  private calculateCascadeRiskScore(cascadeAnalysis: any, predictions: SafetyPrediction[]): number {
    const cascadeScore = cascadeAnalysis.cascadeRiskScore || 0;
    const deadlockScore = cascadeAnalysis.deadlockRiskScore || 0;
    const memoryScore = cascadeAnalysis.memoryCorruptionScore || 0;
    const orchestrationScore = cascadeAnalysis.orchestrationComplexityScore || 0;

    // Weighted average of all risk factors
    const overallRisk = Math.round(
      cascadeScore * 0.35 +
      deadlockScore * 0.25 +
      memoryScore * 0.20 +
      orchestrationScore * 0.20
    );

    return Math.min(100, Math.max(0, overallRisk));
  }

  /**
   * Generate intervention recommendations
   */
  private generateInterventionRecommendations(
    predictions: SafetyPrediction[],
    cascadeRiskScore: number,
    cascadeAnalysis: any
  ): Array<{
    action: string;
    priority: string;
    expectedRiskReduction: number;
  }> {
    const recommendations: Array<{
      action: string;
      priority: string;
      expectedRiskReduction: number;
    }> = [];

    // Critical interventions for high cascade risk
    if (cascadeRiskScore >= 80) {
      recommendations.push({
        action: 'halt_global_autonomy',
        priority: 'critical',
        expectedRiskReduction: 60,
      });
      recommendations.push({
        action: 'require_founder_approval',
        priority: 'critical',
        expectedRiskReduction: 40,
      });
    }

    // High-risk interventions
    if (cascadeRiskScore >= 65) {
      recommendations.push({
        action: 'pause_orchestrator',
        priority: 'high',
        expectedRiskReduction: 50,
      });
      recommendations.push({
        action: 'reduce_autonomy_level',
        priority: 'high',
        expectedRiskReduction: 35,
      });
    }

    // Medium-risk interventions
    if (cascadeRiskScore >= 50) {
      recommendations.push({
        action: 'throttle_agents',
        priority: 'medium',
        expectedRiskReduction: 30,
      });
      recommendations.push({
        action: 'increase_monitoring',
        priority: 'medium',
        expectedRiskReduction: 15,
      });
    }

    // Agent-specific interventions
    const highRiskPredictions = predictions.filter(p => p.probability >= 70);
    for (const prediction of highRiskPredictions) {
      if (prediction.affectedAgents && prediction.affectedAgents.length > 0) {
        for (const agent of prediction.affectedAgents) {
          recommendations.push({
            action: `block_agent:${agent}`,
            priority: prediction.actionPriority,
            expectedRiskReduction: Math.round(prediction.probability * 0.7),
          });
        }
      }
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Execute safety intervention
   */
  async executeIntervention(params: {
    workspaceId: string;
    action: 'block_agent' | 'pause_workflow' | 'halt_autonomy' | 'require_approval' | 'throttle' | 'override';
    targetAgent?: string;
    targetWorkflow?: string;
    reason: string;
    userId?: string;
  }): Promise<{
    interventionId: string;
    executed: boolean;
    riskBefore: number;
    riskAfter: number;
  }> {
    const supabase = await getSupabaseServer();

    try {
      // 1. Get current risk assessment
      const currentRisk = await this.assessCurrentRisk(params.workspaceId);

      // 2. Execute intervention
      const intervention = await safetyInterventionController.executeIntervention({
        workspaceId: params.workspaceId,
        action: params.action,
        targetAgent: params.targetAgent,
        targetWorkflow: params.targetWorkflow,
        reason: params.reason,
      });

      // 3. Reassess risk after intervention
      const riskAfter = await this.assessCurrentRisk(params.workspaceId);

      // 4. Archive action to safety ledger
      const ledgerId = await safetyArchiveBridge.recordInterventionAction({
        workspaceId: params.workspaceId,
        action: params.action,
        riskBefore: currentRisk,
        riskAfter,
        reason: params.reason,
        targetAgent: params.targetAgent,
        userId: params.userId,
      });

      // 5. Log to audit trail
      await supabase.from('audit_logs').insert({
        workspace_id: params.workspaceId,
        user_id: params.userId || 'system',
        action: 'safety_intervention_executed',
        resource_type: 'safety_event',
        resource_id: ledgerId,
        details: {
          intervention: params.action,
          riskReduction: currentRisk - riskAfter,
          targetAgent: params.targetAgent,
        },
        timestamp: new Date().toISOString(),
      });

      return {
        interventionId: ledgerId,
        executed: intervention.executed,
        riskBefore: currentRisk,
        riskAfter,
      };
    } catch (error) {
      console.error('Error executing intervention:', error);
      throw error;
    }
  }

  /**
   * Get current safety status
   */
  async getSafetyStatus(workspaceId: string): Promise<SafetyStatus> {
    const supabase = await getSupabaseServer();

    try {
      // Use the database function if available
      const { data: statusData } = await supabase.rpc('get_safety_status', {
        p_workspace_id: workspaceId,
      });

      if (statusData && statusData.length > 0) {
        const status = statusData[0];
        return {
          activeEvents: status.active_events || 0,
          highRiskEvents: status.high_risk_events || 0,
          pendingPredictions: status.pending_predictions || 0,
          expiredPredictions: status.expired_predictions || 0,
          recentInterventions: status.recent_interventions || 0,
          avgRiskReduction: parseFloat(status.avg_risk_reduction) || 0,
          overallStatus: status.status_summary || 'HEALTHY',
        };
      }

      // Fallback manual status calculation
      const { data: events } = await supabase
        .from('safety_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('detected_at', { ascending: false })
        .limit(100);

      const { data: predictions } = await supabase
        .from('safety_predictions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('predicted_at', { ascending: false })
        .limit(50);

      const activeEvents = (events || []).filter(e => !e.resolved).length;
      const highRiskEvents = (events || []).filter(e => !e.resolved && e.risk_level >= 70).length;
      const pendingPredictions = (predictions || []).filter(p => !p.materialized && new Date(p.expires_at) > new Date()).length;

      let overallStatus: 'CRITICAL' | 'HIGH_RISK' | 'WARN' | 'HEALTHY' = 'HEALTHY';
      if (highRiskEvents >= 3 || (events || []).some(e => e.risk_level >= 80)) {
overallStatus = 'CRITICAL';
} else if (highRiskEvents >= 1) {
overallStatus = 'HIGH_RISK';
} else if ((predictions || []).some(p => p.probability >= 70)) {
overallStatus = 'WARN';
}

      return {
        activeEvents,
        highRiskEvents,
        pendingPredictions,
        expiredPredictions: (predictions || []).filter(p => new Date(p.expires_at) <= new Date() && !p.materialized).length,
        recentInterventions: 0,
        avgRiskReduction: 0,
        overallStatus,
      };
    } catch (error) {
      console.error('Error getting safety status:', error);
      throw error;
    }
  }

  /**
   * Assess current system risk level
   */
  private async assessCurrentRisk(workspaceId: string): Promise<number> {
    const supabase = await getSupabaseServer();

    try {
      // Fetch recent autonomy runs to assess risk
      const { data: runs } = await supabase
        .from('global_autonomy_runs')
        .select('risk_score, uncertainty_score')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!runs || runs.length === 0) {
return 50;
}

      const avgRisk = runs.reduce((sum, r) => sum + (r.risk_score || 0), 0) / runs.length;
      const avgUncertainty = runs.reduce((sum, r) => sum + (r.uncertainty_score || 0), 0) / runs.length;

      // Combined risk assessment
      const combinedRisk = Math.round(avgRisk * 0.6 + avgUncertainty * 0.4);

      return Math.min(100, Math.max(0, combinedRisk));
    } catch (error) {
      console.error('Error assessing risk:', error);
      return 50; // Default to medium risk
    }
  }
}

export const predictiveSafetyEngine = new PredictiveSafetyEngine();
