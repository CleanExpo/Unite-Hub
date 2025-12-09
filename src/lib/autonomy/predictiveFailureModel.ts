/**
 * Predictive Failure Model
 *
 * Analyzes multi-source signals to predict failures before they occur,
 * enabling proactive intervention and system stabilization.
 *
 * Signal sources:
 * - Recent autonomy run metrics (risk, uncertainty, autonomy scores)
 * - Memory consistency signals (contradictions, outdated info)
 * - Agent performance indicators (success rates, latency trends)
 * - Orchestrator planning metrics (complexity, dependencies)
 * - Error logs and anomaly detections
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface FailurePrediction {
  predictionId: string;
  failureType: string;
  failureCategory:
    | 'agent_failure'
    | 'memory_corruption'
    | 'orchestration_collapse'
    | 'cross_agent_deadlock'
    | 'resource_exhaustion'
    | 'unknown';
  probability: number; // 0-100
  confidence: number; // 0-100
  timeWindow: {
    startTime: string;
    endTime: string;
    windowMinutes: number;
  };
  affectedAgents: string[];
  affectedMemories: string[];
  signals: SignalInput[];
  contributingFactors: ContributingFactor[];
  severity: number; // 1-5
  recommendations: string[];
  createdAt: string;
}

export interface SignalInput {
  signalType:
    | 'high_risk_score'
    | 'high_uncertainty'
    | 'memory_contradiction'
    | 'agent_latency_spike'
    | 'error_rate_increase'
    | 'orchestration_complexity'
    | 'agent_performance_degradation'
    | 'resource_constraint';
  value: number;
  threshold: number;
  severity: number; // 1-5
  source: string;
  timestamp: string;
  weight: number; // 0-1, contribution to overall prediction
}

export interface ContributingFactor {
  factor: string;
  impact: number; // 0-100
  description: string;
  mitigationStrategy: string;
}

interface SignalAnalysis {
  riskSignal: number;
  uncertaintySignal: number;
  memorySignal: number;
  agentPerformanceSignal: number;
  orchestrationSignal: number;
  errorSignal: number;
}

class PredictiveFailureModel {
  /**
   * Predict future failures based on current system signals
   */
  async predictFailures(params: {
    workspaceId: string;
    lookbackMinutes?: number;
    predictionWindowMinutes?: number;
  }): Promise<FailurePrediction[]> {
    const supabase = await getSupabaseServer();
    const lookbackMinutes = params.lookbackMinutes || 60;
    const predictionWindowMinutes = params.predictionWindowMinutes || 30;

    const lookbackDate = new Date(Date.now() - lookbackMinutes * 60 * 1000).toISOString();
    const predictions: FailurePrediction[] = [];

    try {
      // 1. Analyze all signal sources
      const signals = await this.analyzeSignals(params.workspaceId, lookbackDate);

      // 2. Calculate failure probability based on signals
      const failureRiskScore = this.calculateFailureRiskScore(signals);

      // 3. Identify probable failure types
      const failureTypes = this.identifyFailureTypes(signals);

      // 4. Generate predictions for high-risk scenarios
      for (const failureType of failureTypes) {
        const probability = this.calculateFailureProbability(failureType, signals);
        const confidence = this.calculatePredictionConfidence(failureType, signals);

        if (probability >= 30) {
          // Only report predictions >= 30% probability
          const prediction = await this.generateFailurePrediction({
            failureType,
            failureRiskScore,
            signals,
            probability,
            confidence,
            predictionWindowMinutes,
            workspaceId: params.workspaceId,
          });

          predictions.push(prediction);
        }
      }

      return predictions.sort((a, b) => b.probability - a.probability);
    } catch (error) {
      console.error('Error predicting failures:', error);
      throw error;
    }
  }

  /**
   * Analyze all signal sources
   */
  private async analyzeSignals(workspaceId: string, lookbackDate: string): Promise<SignalAnalysis> {
    const supabase = await getSupabaseServer();

    // Fetch recent data
    const [{ data: runs }, { data: memories }, { data: events }] = await Promise.all([
      supabase
        .from('global_autonomy_runs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', lookbackDate)
        .order('created_at', { ascending: false })
        .limit(50),

      supabase
        .from('ai_memory')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('updated_at', lookbackDate)
        .order('updated_at', { ascending: false })
        .limit(50),

      supabase
        .from('global_autonomy_events')
        .select('*')
        .gte('created_at', lookbackDate)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    return {
      riskSignal: this.calculateRiskSignal(runs || []),
      uncertaintySignal: this.calculateUncertaintySignal(runs || []),
      memorySignal: this.calculateMemorySignal(memories || []),
      agentPerformanceSignal: this.calculateAgentPerformanceSignal(runs || []),
      orchestrationSignal: this.calculateOrchestrationSignal(runs || []),
      errorSignal: this.calculateErrorSignal(events || []),
    };
  }

  /**
   * Calculate overall failure risk score
   */
  private calculateFailureRiskScore(signals: SignalAnalysis): number {
    // Weighted sum of all signals
    const weights = {
      risk: 0.25,
      uncertainty: 0.20,
      memory: 0.15,
      agentPerformance: 0.20,
      orchestration: 0.15,
      error: 0.05,
    };

    const score =
      signals.riskSignal * weights.risk +
      signals.uncertaintySignal * weights.uncertainty +
      signals.memorySignal * weights.memory +
      signals.agentPerformanceSignal * weights.agentPerformance +
      signals.orchestrationSignal * weights.orchestration +
      signals.errorSignal * weights.error;

    return Math.min(100, Math.round(score));
  }

  /**
   * Identify probable failure types based on signals
   */
  private identifyFailureTypes(signals: SignalAnalysis): string[] {
    const failureTypes: Set<string> = new Set();

    // High risk score → agent failure
    if (signals.riskSignal >= 70) {
      failureTypes.add('agent_failure');
    }

    // High uncertainty + memory issues → memory corruption
    if (signals.uncertaintySignal >= 75 && signals.memorySignal >= 60) {
      failureTypes.add('memory_corruption');
    }

    // High orchestration + agent performance → orchestration collapse
    if (signals.orchestrationSignal >= 70 && signals.agentPerformanceSignal >= 65) {
      failureTypes.add('orchestration_collapse');
    }

    // Multiple agents with issues → deadlock
    if (signals.agentPerformanceSignal >= 75) {
      failureTypes.add('cross_agent_deadlock');
    }

    // Error spike → resource exhaustion
    if (signals.errorSignal >= 70) {
      failureTypes.add('resource_exhaustion');
    }

    // Default fallback
    if (failureTypes.size === 0) {
      failureTypes.add('unknown');
    }

    return Array.from(failureTypes);
  }

  /**
   * Calculate specific failure probability
   */
  private calculateFailureProbability(failureType: string, signals: SignalAnalysis): number {
    switch (failureType) {
      case 'agent_failure':
        return Math.round(
          signals.riskSignal * 0.6 +
          signals.agentPerformanceSignal * 0.3 +
          signals.errorSignal * 0.1
        );

      case 'memory_corruption':
        return Math.round(
          signals.memorySignal * 0.6 +
          signals.uncertaintySignal * 0.3 +
          signals.riskSignal * 0.1
        );

      case 'orchestration_collapse':
        return Math.round(
          signals.orchestrationSignal * 0.5 +
          signals.agentPerformanceSignal * 0.3 +
          signals.uncertaintySignal * 0.2
        );

      case 'cross_agent_deadlock':
        return Math.round(
          signals.agentPerformanceSignal * 0.5 +
          signals.orchestrationSignal * 0.3 +
          signals.uncertaintySignal * 0.2
        );

      case 'resource_exhaustion':
        return Math.round(
          signals.errorSignal * 0.5 +
          signals.riskSignal * 0.3 +
          signals.agentPerformanceSignal * 0.2
        );

      default:
        return Math.round((signals.riskSignal + signals.uncertaintySignal) / 2 * 0.5);
    }
  }

  /**
   * Calculate prediction confidence
   */
  private calculatePredictionConfidence(failureType: string, signals: SignalAnalysis): number {
    // Confidence based on signal consistency
    const signals_array = [
      signals.riskSignal,
      signals.uncertaintySignal,
      signals.memorySignal,
      signals.agentPerformanceSignal,
      signals.orchestrationSignal,
      signals.errorSignal,
    ];

    const avg = signals_array.reduce((a, b) => a + b) / signals_array.length;
    const variance = signals_array.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / signals_array.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = higher confidence (signals agree)
    const confidence = Math.max(40, 100 - stdDev);

    return Math.round(confidence);
  }

  /**
   * Generate detailed failure prediction
   */
  private async generateFailurePrediction(params: {
    failureType: string;
    failureRiskScore: number;
    signals: SignalAnalysis;
    probability: number;
    confidence: number;
    predictionWindowMinutes: number;
    workspaceId: string;
  }): Promise<FailurePrediction> {
    const supabase = await getSupabaseServer();

    // Get affected agents and memories
    const { data: runs } = await supabase
      .from('global_autonomy_runs')
      .select('active_agents')
      .eq('workspace_id', params.workspaceId)
      .order('created_at', { ascending: false })
      .limit(5);

    const affectedAgents = new Set<string>();
    if (runs) {
      for (const run of runs) {
        if (run.active_agents) {
          for (const agent of run.active_agents) {
            affectedAgents.add(agent);
          }
        }
      }
    }

    // Get affected memories
    const { data: memories } = await supabase
      .from('ai_memory')
      .select('id')
      .eq('workspace_id', params.workspaceId)
      .order('updated_at', { ascending: false })
      .limit(3);

    const affectedMemories = (memories || []).map(m => m.id);

    // Build signal details
    const signalInputs = this.buildSignalInputs(params.signals);

    // Calculate contributing factors
    const contributingFactors = this.getContributingFactors(params.failureType, params.signals);

    // Generate recommendations
    const recommendations = this.generateRecommendations(params.failureType);

    const now = new Date();
    const windowEnd = new Date(now.getTime() + params.predictionWindowMinutes * 60 * 1000);

    return {
      predictionId: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      failureType: params.failureType,
      failureCategory: params.failureType as any,
      probability: params.probability,
      confidence: params.confidence,
      timeWindow: {
        startTime: now.toISOString(),
        endTime: windowEnd.toISOString(),
        windowMinutes: params.predictionWindowMinutes,
      },
      affectedAgents: Array.from(affectedAgents),
      affectedMemories,
      signals: signalInputs,
      contributingFactors,
      severity: this.calculateSeverity(params.probability, params.failureType),
      recommendations,
      createdAt: now.toISOString(),
    };
  }

  /**
   * Private: Calculate risk signal from autonomy runs
   */
  private calculateRiskSignal(runs: any[]): number {
    if (runs.length === 0) {
return 0;
}

    const recentRuns = runs.slice(0, 10);
    const avgRiskScore = recentRuns.reduce((sum, r) => sum + (r.risk_score || 0), 0) / recentRuns.length;

    // Rising trend increases signal
    const trend = this.calculateTrend(recentRuns.map(r => r.risk_score || 0));
    const trendFactor = trend === 'worsening' ? 1.2 : trend === 'improving' ? 0.8 : 1.0;

    return Math.min(100, Math.round(avgRiskScore * trendFactor));
  }

  /**
   * Private: Calculate uncertainty signal
   */
  private calculateUncertaintySignal(runs: any[]): number {
    if (runs.length === 0) {
return 0;
}

    const recentRuns = runs.slice(0, 10);
    const avgUncertainty = recentRuns.reduce((sum, r) => sum + (r.uncertainty_score || 0), 0) / recentRuns.length;

    const trend = this.calculateTrend(recentRuns.map(r => r.uncertainty_score || 0));
    const trendFactor = trend === 'worsening' ? 1.2 : trend === 'improving' ? 0.8 : 1.0;

    return Math.min(100, Math.round(avgUncertainty * trendFactor));
  }

  /**
   * Private: Calculate memory signal
   */
  private calculateMemorySignal(memories: any[]): number {
    if (memories.length === 0) {
return 0;
}

    // Count memories with low confidence
    const lowConfidenceCount = memories.filter(m => (m.confidence || 70) < 50).length;
    const conflictingCount = memories.filter(m => m.memory_type?.includes('contradiction')).length;

    const confidence_signal = (lowConfidenceCount / memories.length) * 50;
    const conflict_signal = conflictingCount * 10;

    return Math.min(100, Math.round(confidence_signal + conflict_signal));
  }

  /**
   * Private: Calculate agent performance signal
   */
  private calculateAgentPerformanceSignal(runs: any[]): number {
    if (runs.length === 0) {
return 0;
}

    const recentRuns = runs.slice(0, 10);

    // Calculate failure rate
    const failureRate =
      recentRuns.filter(r => (r.failed_steps || 0) > 0).length / Math.max(recentRuns.length, 1);

    // Calculate success rate
    const successRates = recentRuns.map(
      r => ((r.completed_steps || 0) / Math.max(r.total_steps || 1, 1)) * 100
    );

    const avgSuccessRate = successRates.reduce((a, b) => a + b, 0) / successRates.length;

    // Convert to performance signal (0-100)
    const performanceSignal = 100 - avgSuccessRate;
    const failureSignal = failureRate * 100;

    return Math.min(100, Math.round((performanceSignal + failureSignal) / 2));
  }

  /**
   * Private: Calculate orchestration signal
   */
  private calculateOrchestrationSignal(runs: any[]): number {
    if (runs.length === 0) {
return 0;
}

    const recentRuns = runs.slice(0, 10);

    // Assess complexity and failure correlation
    const multiAgentRuns = recentRuns.filter(r => (r.active_agents?.length || 0) > 2);
    const failedMultiAgent = multiAgentRuns.filter(r => (r.failed_steps || 0) > 0).length;

    const complexityFactor = (multiAgentRuns.length / recentRuns.length) * 50;
    const failureCorrelation = (failedMultiAgent / Math.max(multiAgentRuns.length, 1)) * 50;

    return Math.min(100, Math.round(complexityFactor + failureCorrelation));
  }

  /**
   * Private: Calculate error signal
   */
  private calculateErrorSignal(events: any[]): number {
    if (events.length === 0) {
return 0;
}

    const recentEvents = events.slice(0, 50);

    // Count high-severity events
    const criticalEvents = recentEvents.filter(e => (e.severity || 0) >= 4).length;
    const errorEvents = recentEvents.filter(e => e.event_type?.includes('error')).length;
    const failureEvents = recentEvents.filter(e => e.event_type?.includes('failed')).length;

    const errorSignal = ((criticalEvents + errorEvents + failureEvents) / recentEvents.length) * 100;

    return Math.min(100, Math.round(errorSignal));
  }

  /**
   * Private: Calculate trend
   */
  private calculateTrend(values: number[]): 'improving' | 'stable' | 'worsening' {
    if (values.length < 3) {
return 'stable';
}

    const recent = values.slice(0, 3);
    const older = values.slice(-3);

    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b) / older.length;

    const change = ((recentAvg - olderAvg) / Math.max(olderAvg, 1)) * 100;

    if (change > 15) {
return 'worsening';
}
    if (change < -15) {
return 'improving';
}

    return 'stable';
  }

  /**
   * Private: Build signal input details
   */
  private buildSignalInputs(signals: SignalAnalysis): SignalInput[] {
    const inputs: SignalInput[] = [];

    if (signals.riskSignal >= 50) {
      inputs.push({
        signalType: 'high_risk_score',
        value: signals.riskSignal,
        threshold: 50,
        severity: Math.min(5, Math.ceil(signals.riskSignal / 20)),
        source: 'global_autonomy_runs',
        timestamp: new Date().toISOString(),
        weight: 0.25,
      });
    }

    if (signals.uncertaintySignal >= 60) {
      inputs.push({
        signalType: 'high_uncertainty',
        value: signals.uncertaintySignal,
        threshold: 60,
        severity: Math.min(5, Math.ceil(signals.uncertaintySignal / 20)),
        source: 'global_autonomy_runs',
        timestamp: new Date().toISOString(),
        weight: 0.20,
      });
    }

    if (signals.memorySignal >= 40) {
      inputs.push({
        signalType: 'memory_contradiction',
        value: signals.memorySignal,
        threshold: 40,
        severity: Math.min(5, Math.ceil(signals.memorySignal / 20)),
        source: 'ai_memory',
        timestamp: new Date().toISOString(),
        weight: 0.15,
      });
    }

    if (signals.agentPerformanceSignal >= 50) {
      inputs.push({
        signalType: 'agent_performance_degradation',
        value: signals.agentPerformanceSignal,
        threshold: 50,
        severity: Math.min(5, Math.ceil(signals.agentPerformanceSignal / 20)),
        source: 'orchestrator_runs',
        timestamp: new Date().toISOString(),
        weight: 0.20,
      });
    }

    if (signals.orchestrationSignal >= 50) {
      inputs.push({
        signalType: 'orchestration_complexity',
        value: signals.orchestrationSignal,
        threshold: 50,
        severity: Math.min(5, Math.ceil(signals.orchestrationSignal / 20)),
        source: 'global_autonomy_runs',
        timestamp: new Date().toISOString(),
        weight: 0.15,
      });
    }

    if (signals.errorSignal >= 30) {
      inputs.push({
        signalType: 'error_rate_increase',
        value: signals.errorSignal,
        threshold: 30,
        severity: Math.min(5, Math.ceil(signals.errorSignal / 20)),
        source: 'global_autonomy_events',
        timestamp: new Date().toISOString(),
        weight: 0.05,
      });
    }

    return inputs;
  }

  /**
   * Private: Get contributing factors
   */
  private getContributingFactors(failureType: string, signals: SignalAnalysis): ContributingFactor[] {
    const factors: ContributingFactor[] = [];

    switch (failureType) {
      case 'agent_failure':
        factors.push({
          factor: 'Agent Performance Degradation',
          impact: signals.agentPerformanceSignal,
          description: 'Recent autonomy runs show declining agent effectiveness',
          mitigationStrategy: 'Review agent logs and retrain if necessary',
        });
        factors.push({
          factor: 'High Risk Factors',
          impact: signals.riskSignal,
          description: 'Risk scores indicate potential failure modes',
          mitigationStrategy: 'Implement additional validation gates',
        });
        break;

      case 'memory_corruption':
        factors.push({
          factor: 'Memory Inconsistencies',
          impact: signals.memorySignal,
          description: 'Detected contradictions in stored memories',
          mitigationStrategy: 'Validate and correct memory records',
        });
        factors.push({
          factor: 'High Uncertainty',
          impact: signals.uncertaintySignal,
          description: 'System uncertainty about current state',
          mitigationStrategy: 'Gather additional context data',
        });
        break;

      case 'orchestration_collapse':
        factors.push({
          factor: 'Complex Orchestration',
          impact: signals.orchestrationSignal,
          description: 'Multi-agent workflows becoming complex',
          mitigationStrategy: 'Simplify orchestration plans',
        });
        factors.push({
          factor: 'Agent Coordination Issues',
          impact: signals.agentPerformanceSignal,
          description: 'Agents struggling with multi-step coordination',
          mitigationStrategy: 'Add explicit inter-agent synchronization',
        });
        break;

      case 'resource_exhaustion':
        factors.push({
          factor: 'High Error Rate',
          impact: signals.errorSignal,
          description: 'Increasing system errors indicate resource stress',
          mitigationStrategy: 'Monitor and reduce concurrent operations',
        });
        break;

      default:
        factors.push({
          factor: 'Unknown Failure Mode',
          impact: 50,
          description: 'Detected anomaly but cause unclear',
          mitigationStrategy: 'Enable detailed logging and diagnostic mode',
        });
    }

    return factors;
  }

  /**
   * Private: Generate recommendations
   */
  private generateRecommendations(failureType: string): string[] {
    const recommendations: string[] = [];

    switch (failureType) {
      case 'agent_failure':
        recommendations.push('Review agent error logs immediately');
        recommendations.push('Temporarily reduce agent autonomy score threshold');
        recommendations.push('Run agent health diagnostics');
        break;

      case 'memory_corruption':
        recommendations.push('Initiate memory validation and correction cycle');
        recommendations.push('Review recent memory updates for conflicts');
        recommendations.push('Consider memory system reset if corruption is severe');
        break;

      case 'orchestration_collapse':
        recommendations.push('Reduce maximum concurrent agents');
        recommendations.push('Simplify active workflows');
        recommendations.push('Review orchestrator task dependencies');
        break;

      case 'cross_agent_deadlock':
        recommendations.push('Identify circular dependencies between agents');
        recommendations.push('Add timeout mechanisms to break deadlocks');
        recommendations.push('Implement task priority queue');
        break;

      case 'resource_exhaustion':
        recommendations.push('Check system resource utilization (CPU, memory)');
        recommendations.push('Reduce batch sizes for parallel operations');
        recommendations.push('Implement rate limiting on agent requests');
        break;

      default:
        recommendations.push('Enable detailed diagnostic logging');
        recommendations.push('Monitor system metrics closely');
        recommendations.push('Prepare for potential system failover');
    }

    return recommendations;
  }

  /**
   * Private: Calculate severity
   */
  private calculateSeverity(probability: number, failureType: string): number {
    // Base severity from probability
    const baseSeverity = Math.ceil(probability / 20);

    // Type-based severity adjustments
    const multipliers: Record<string, number> = {
      orchestration_collapse: 1.5,
      cross_agent_deadlock: 1.5,
      memory_corruption: 1.3,
      resource_exhaustion: 1.2,
      agent_failure: 1.0,
      unknown: 0.9,
    };

    const adjusted = baseSeverity * (multipliers[failureType] || 1.0);

    return Math.min(5, Math.ceil(adjusted));
  }
}

export const predictiveFailureModel = new PredictiveFailureModel();
