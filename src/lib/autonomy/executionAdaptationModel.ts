/**
 * Execution Adaptation Model
 *
 * Adapts workflow execution at runtime based on:
 * - Current system health
 * - Real-time agent performance
 * - Resource availability
 * - Risk conditions
 *
 * Generates adaptation profiles that guide real-time execution decisions.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface AdaptationProfile {
  profileId: string;
  workspaceId: string;
  profileName: string;
  adaptationScore: number; // 0-100
  resourceCostEstimate: number; // USD
  resourceDurationEstimate: number; // ms
  adaptations: {
    parallelismReduction: number; // -50 to +50%
    reasoningTokenReduction: number; // -30 to +30%
    contextSizeReduction: number; // -50 to +50%
    agentSwitchRecommendations: string[]; // agents to prefer
    orderingOptimizations: string[]; // reordering suggestions
  };
  explainabilityNotes: string;
  createdAt: string;
}

export interface AdaptationParams {
  workspaceId: string;
  workflowId: string;
  currentSystemHealth: number;
  recentAgentPerformance: Record<string, { successRate: number; avgDuration: number; avgCost: number }>;
  availableResources: {
    cpu: number; // 0-100%
    memory: number; // 0-100%
    budget: number; // remaining budget in USD
  };
  riskLevel: number; // 0-100
  stepCount: number;
  avgStepComplexity: number;
}

class ExecutionAdaptationModel {
  /**
   * Compute adaptation profile for current conditions
   */
  async computeAdaptationScore(params: AdaptationParams): Promise<AdaptationProfile> {
    const supabase = await getSupabaseServer();
    const profileId = crypto.randomUUID();

    try {
      // 1. Analyze current conditions
      const resourcePressure = Math.max(params.availableResources.cpu, params.availableResources.memory);
      const healthScore = params.currentSystemHealth;
      const riskLevel = params.riskLevel;

      // 2. Compute adaptation scores for each dimension
      const parallelismAdaptation = this.computeParallelismAdaptation(healthScore, riskLevel, resourcePressure);
      const reasoningAdaptation = this.computeReasoningAdaptation(healthScore, params.availableResources.budget);
      const contextAdaptation = this.computeContextAdaptation(healthScore, resourcePressure);
      const agentAdaptation = this.computeAgentAdaptation(params.recentAgentPerformance);
      const orderingAdaptation = this.computeOrderingAdaptation(riskLevel, params.stepCount);

      // 3. Overall adaptation score
      const adaptationScore = Math.round(
        (parallelismAdaptation.score +
          reasoningAdaptation.score +
          contextAdaptation.score +
          agentAdaptation.score +
          orderingAdaptation.score) /
          5
      );

      // 4. Estimate resource impact
      const resourceCostEstimate = this.estimateResourceCost(
        reasoningAdaptation.reduction,
        contextAdaptation.reduction,
        params.stepCount
      );
      const resourceDurationEstimate = this.estimateDuration(
        parallelismAdaptation.reduction,
        params.stepCount
      );

      // 5. Generate explainability
      const explainabilityNotes = this.generateExplanation({
        healthScore,
        riskLevel,
        parallelism: parallelismAdaptation,
        reasoning: reasoningAdaptation,
        context: contextAdaptation,
      });

      const profile: AdaptationProfile = {
        profileId,
        workspaceId: params.workspaceId,
        profileName: `Adaptation-${healthScore > 75 ? 'Aggressive' : healthScore > 50 ? 'Balanced' : 'Conservative'}`,
        adaptationScore,
        resourceCostEstimate,
        resourceDurationEstimate,
        adaptations: {
          parallelismReduction: parallelismAdaptation.reduction,
          reasoningTokenReduction: reasoningAdaptation.reduction,
          contextSizeReduction: contextAdaptation.reduction,
          agentSwitchRecommendations: agentAdaptation.recommendations,
          orderingOptimizations: orderingAdaptation.optimizations,
        },
        explainabilityNotes,
        createdAt: new Date().toISOString(),
      };

      // 6. Store profile
      await supabase.from('execution_adaptation_profiles').insert({
        workspace_id: params.workspaceId,
        profile_id: profileId,
        profile_name: profile.profileName,
        adaptation_score: adaptationScore,
        resource_cost_estimate: resourceCostEstimate,
        resource_duration_estimate: resourceDurationEstimate,
        parallelism_reduction: parallelismAdaptation.reduction,
        reasoning_token_reduction: reasoningAdaptation.reduction,
        context_size_reduction: contextAdaptation.reduction,
        agent_switch_recommendations: agentAdaptation.recommendations,
        ordering_optimizations: orderingAdaptation.optimizations,
        explainability_notes: explainabilityNotes,
        created_at: new Date().toISOString(),
      });

      return profile;
    } catch (error) {
      console.error('Adaptation score error:', error);
      throw error;
    }
  }

  /**
   * Compute parallelism adaptation
   */
  private computeParallelismAdaptation(
    healthScore: number,
    riskLevel: number,
    resourcePressure: number
  ): { score: number; reduction: number } {
    let reduction = 0;

    // High risk = reduce parallelism
    if (riskLevel > 75) {
      reduction = -30; // Reduce to 70% of normal
    } else if (riskLevel > 50) {
      reduction = -15; // Reduce to 85%
    } else if (healthScore > 85) {
      reduction = 20; // Increase to 120%
    }

    // High resource pressure = reduce parallelism
    if (resourcePressure > 80) {
      reduction -= 20;
    }

    return {
      score: Math.max(0, 100 - Math.abs(reduction)),
      reduction: Math.max(-50, Math.min(50, reduction)),
    };
  }

  /**
   * Compute reasoning token adaptation
   */
  private computeReasoningAdaptation(
    healthScore: number,
    budgetRemaining: number
  ): { score: number; reduction: number } {
    let reduction = 0;

    // Low budget = reduce reasoning tokens
    if (budgetRemaining < 10) {
      reduction = -30; // Reduce to 70% of normal
    } else if (budgetRemaining < 25) {
      reduction = -15; // Reduce to 85%
    } else if (healthScore > 85) {
      reduction = 15; // Increase to 115% for better quality
    }

    return {
      score: Math.max(0, 100 - Math.abs(reduction)),
      reduction: Math.max(-30, Math.min(30, reduction)),
    };
  }

  /**
   * Compute context size adaptation
   */
  private computeContextAdaptation(
    healthScore: number,
    resourcePressure: number
  ): { score: number; reduction: number } {
    let reduction = 0;

    // High resource pressure = reduce context
    if (resourcePressure > 85) {
      reduction = -40; // Reduce to 60%
    } else if (resourcePressure > 70) {
      reduction = -20; // Reduce to 80%
    } else if (healthScore > 80) {
      reduction = 20; // Increase to 120% for better reasoning
    }

    return {
      score: Math.max(0, 100 - Math.abs(reduction)),
      reduction: Math.max(-50, Math.min(50, reduction)),
    };
  }

  /**
   * Compute agent selection adaptation
   */
  private computeAgentAdaptation(
    recentPerformance: Record<string, { successRate: number; avgDuration: number; avgCost: number }>
  ): { score: number; recommendations: string[] } {
    const recommendations: string[] = [];

    // Recommend best-performing agents
    const sorted = Object.entries(recentPerformance)
      .sort(([, a], [, b]) => b.successRate - a.successRate)
      .slice(0, 3);

    for (const [agent, perf] of sorted) {
      if (perf.successRate > 0.9) {
        recommendations.push(agent);
      }
    }

    return {
      score: Math.min(100, recommendations.length * 25),
      recommendations,
    };
  }

  /**
   * Compute ordering adaptation
   */
  private computeOrderingAdaptation(
    riskLevel: number,
    stepCount: number
  ): { score: number; optimizations: string[] } {
    const optimizations: string[] = [];

    // High risk = serialize more steps
    if (riskLevel > 75) {
      optimizations.push('serialize_complex_steps');
    }

    // Reduce parallelism thresholds
    if (riskLevel > 50) {
      optimizations.push('reduce_parallel_depth');
    }

    // Optimize for complexity
    if (stepCount > 10) {
      optimizations.push('chunk_steps_by_type');
    }

    return {
      score: Math.min(100, optimizations.length * 30),
      optimizations,
    };
  }

  /**
   * Estimate resource cost impact
   */
  private estimateResourceCost(
    reasoningReduction: number,
    contextReduction: number,
    stepCount: number
  ): number {
    const baseCost = stepCount * 0.005; // $0.005 per step

    // Apply reductions
    const reasoningCostReduction = Math.abs(reasoningReduction) * 0.01;
    const contextCostReduction = Math.abs(contextReduction) * 0.005;

    return Math.max(0, baseCost * (1 - reasoningCostReduction - contextCostReduction));
  }

  /**
   * Estimate duration impact
   */
  private estimateDuration(
    parallelismReduction: number,
    stepCount: number
  ): number {
    const baseMs = stepCount * 300; // 300ms per step on average

    // Negative parallelism reduction = slower (more serial)
    const durationMultiplier = 1 + Math.abs(parallelismReduction) / 100;

    return Math.round(baseMs * durationMultiplier);
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(params: {
    healthScore: number;
    riskLevel: number;
    parallelism: any;
    reasoning: any;
    context: any;
  }): string {
    const lines: string[] = [
      '# Execution Adaptation Profile',
      '',
      `## System Status`,
      `- Health Score: ${params.healthScore}/100`,
      `- Risk Level: ${params.riskLevel}/100`,
      '',
      `## Adaptations Applied`,
    ];

    if (params.parallelism.reduction !== 0) {
      lines.push(
        `- **Parallelism**: ${params.parallelism.reduction > 0 ? '+' : ''}${params.parallelism.reduction}% (${params.parallelism.score}% confidence)`
      );
    }

    if (params.reasoning.reduction !== 0) {
      lines.push(
        `- **Reasoning Tokens**: ${params.reasoning.reduction > 0 ? '+' : ''}${params.reasoning.reduction}% (${params.reasoning.score}% confidence)`
      );
    }

    if (params.context.reduction !== 0) {
      lines.push(
        `- **Context Size**: ${params.context.reduction > 0 ? '+' : ''}${params.context.reduction}% (${params.context.score}% confidence)`
      );
    }

    lines.push(
      '',
      `## Rationale`,
      params.healthScore > 75
        ? 'System is healthy - prioritizing quality and throughput'
        : params.healthScore > 50
        ? 'System is stable - balanced approach'
        : 'System needs attention - prioritizing safety and stability'
    );

    return lines.join('\n');
  }
}

export const executionAdaptationModel = new ExecutionAdaptationModel();
