/**
 * AI Capacity Planner
 * Phase 66: Specialized capacity planning for AI workloads
 */

import { ScalingTierId } from './scalingPolicyEngine';

export type AIProvider = 'claude' | 'gemini' | 'openai' | 'elevenlabs' | 'perplexity';

export interface AICapacityConfig {
  provider: AIProvider;
  tier_budgets: Record<ScalingTierId, {
    monthly_tokens: number;
    max_requests_per_minute: number;
    max_latency_ms: number;
    cost_per_1k_tokens: number;
  }>;
}

export interface AIUsageMetrics {
  provider: AIProvider;
  tokens_used: number;
  tokens_budget: number;
  requests_count: number;
  avg_latency_ms: number;
  error_rate: number;
  cost_to_date: number;
}

export interface AICapacityStatus {
  provider: AIProvider;
  utilization_percent: number;
  status: 'healthy' | 'warning' | 'critical';
  remaining_budget: number;
  projected_overage: boolean;
  recommendations: string[];
}

export interface AICapacityPlan {
  tier_id: ScalingTierId;
  providers: AICapacityStatus[];
  total_monthly_budget: number;
  total_used: number;
  overall_status: 'healthy' | 'warning' | 'critical';
  cost_projection: number;
}

// AI provider configurations per tier
const AI_CONFIGS: Record<AIProvider, AICapacityConfig> = {
  claude: {
    provider: 'claude',
    tier_budgets: {
      soft_launch: {
        monthly_tokens: 50000,
        max_requests_per_minute: 10,
        max_latency_ms: 2000,
        cost_per_1k_tokens: 0.015,
      },
      hard_launch: {
        monthly_tokens: 300000,
        max_requests_per_minute: 30,
        max_latency_ms: 2500,
        cost_per_1k_tokens: 0.015,
      },
      growth_phase: {
        monthly_tokens: 1000000,
        max_requests_per_minute: 60,
        max_latency_ms: 3000,
        cost_per_1k_tokens: 0.012, // Volume discount
      },
    },
  },
  gemini: {
    provider: 'gemini',
    tier_budgets: {
      soft_launch: {
        monthly_tokens: 20000,
        max_requests_per_minute: 15,
        max_latency_ms: 1500,
        cost_per_1k_tokens: 0.001,
      },
      hard_launch: {
        monthly_tokens: 100000,
        max_requests_per_minute: 40,
        max_latency_ms: 2000,
        cost_per_1k_tokens: 0.001,
      },
      growth_phase: {
        monthly_tokens: 500000,
        max_requests_per_minute: 100,
        max_latency_ms: 2500,
        cost_per_1k_tokens: 0.0008,
      },
    },
  },
  openai: {
    provider: 'openai',
    tier_budgets: {
      soft_launch: {
        monthly_tokens: 30000,
        max_requests_per_minute: 20,
        max_latency_ms: 1500,
        cost_per_1k_tokens: 0.01,
      },
      hard_launch: {
        monthly_tokens: 150000,
        max_requests_per_minute: 50,
        max_latency_ms: 2000,
        cost_per_1k_tokens: 0.01,
      },
      growth_phase: {
        monthly_tokens: 600000,
        max_requests_per_minute: 100,
        max_latency_ms: 2500,
        cost_per_1k_tokens: 0.008,
      },
    },
  },
  elevenlabs: {
    provider: 'elevenlabs',
    tier_budgets: {
      soft_launch: {
        monthly_tokens: 10000, // Characters for voice
        max_requests_per_minute: 5,
        max_latency_ms: 3000,
        cost_per_1k_tokens: 0.30,
      },
      hard_launch: {
        monthly_tokens: 50000,
        max_requests_per_minute: 15,
        max_latency_ms: 4000,
        cost_per_1k_tokens: 0.25,
      },
      growth_phase: {
        monthly_tokens: 200000,
        max_requests_per_minute: 30,
        max_latency_ms: 5000,
        cost_per_1k_tokens: 0.20,
      },
    },
  },
  perplexity: {
    provider: 'perplexity',
    tier_budgets: {
      soft_launch: {
        monthly_tokens: 5000,
        max_requests_per_minute: 5,
        max_latency_ms: 2000,
        cost_per_1k_tokens: 0.005,
      },
      hard_launch: {
        monthly_tokens: 25000,
        max_requests_per_minute: 15,
        max_latency_ms: 2500,
        cost_per_1k_tokens: 0.005,
      },
      growth_phase: {
        monthly_tokens: 100000,
        max_requests_per_minute: 30,
        max_latency_ms: 3000,
        cost_per_1k_tokens: 0.004,
      },
    },
  },
};

export class AICapacityPlanner {
  /**
   * Generate AI capacity plan for tier
   */
  generateAICapacityPlan(
    tierId: ScalingTierId,
    usageMetrics: AIUsageMetrics[]
  ): AICapacityPlan {
    const providerStatuses: AICapacityStatus[] = [];
    let totalBudget = 0;
    let totalUsed = 0;
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

    for (const provider of Object.keys(AI_CONFIGS) as AIProvider[]) {
      const config = AI_CONFIGS[provider].tier_budgets[tierId];
      const usage = usageMetrics.find(m => m.provider === provider);

      const tokensUsed = usage?.tokens_used || 0;
      const utilizationPercent = (tokensUsed / config.monthly_tokens) * 100;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (utilizationPercent >= 90) status = 'critical';
      else if (utilizationPercent >= 75) status = 'warning';

      if (status === 'critical') overallStatus = 'critical';
      else if (status === 'warning' && overallStatus !== 'critical') overallStatus = 'warning';

      const recommendations: string[] = [];
      if (status === 'critical') {
        recommendations.push(`Reduce ${provider} usage or increase budget`);
        recommendations.push('Consider prompt optimization');
      } else if (status === 'warning') {
        recommendations.push(`Monitor ${provider} usage closely`);
      }

      // Check latency
      if (usage && usage.avg_latency_ms > config.max_latency_ms) {
        recommendations.push(`${provider} latency ${usage.avg_latency_ms}ms exceeds target ${config.max_latency_ms}ms`);
      }

      providerStatuses.push({
        provider,
        utilization_percent: Math.round(utilizationPercent),
        status,
        remaining_budget: config.monthly_tokens - tokensUsed,
        projected_overage: utilizationPercent > 100,
        recommendations,
      });

      totalBudget += config.monthly_tokens;
      totalUsed += tokensUsed;
    }

    // Calculate cost projection
    const costProjection = this.calculateCostProjection(tierId, usageMetrics);

    return {
      tier_id: tierId,
      providers: providerStatuses,
      total_monthly_budget: totalBudget,
      total_used: totalUsed,
      overall_status: overallStatus,
      cost_projection: costProjection,
    };
  }

  /**
   * Calculate monthly cost projection
   */
  calculateCostProjection(tierId: ScalingTierId, usageMetrics: AIUsageMetrics[]): number {
    let totalCost = 0;

    for (const usage of usageMetrics) {
      const config = AI_CONFIGS[usage.provider]?.tier_budgets[tierId];
      if (config) {
        totalCost += (usage.tokens_used / 1000) * config.cost_per_1k_tokens;
      }
    }

    return Math.round(totalCost * 100) / 100;
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(provider: AIProvider): AICapacityConfig {
    return AI_CONFIGS[provider];
  }

  /**
   * Get tier budget for provider
   */
  getTierBudget(provider: AIProvider, tierId: ScalingTierId) {
    return AI_CONFIGS[provider].tier_budgets[tierId];
  }

  /**
   * Calculate optimal token allocation
   */
  calculateOptimalAllocation(
    tierId: ScalingTierId,
    totalBudget: number
  ): Record<AIProvider, number> {
    // Default allocation ratios based on typical usage
    const ratios: Record<AIProvider, number> = {
      claude: 0.45, // Primary AI
      gemini: 0.20, // Secondary AI
      openai: 0.20, // Specialized tasks
      elevenlabs: 0.10, // Voice
      perplexity: 0.05, // Search
    };

    const allocation: Record<AIProvider, number> = {} as Record<AIProvider, number>;
    for (const provider of Object.keys(ratios) as AIProvider[]) {
      allocation[provider] = Math.round(totalBudget * ratios[provider]);
    }

    return allocation;
  }

  /**
   * Get scaling recommendations for AI providers
   */
  getAIScalingRecommendations(plan: AICapacityPlan): string[] {
    const recommendations: string[] = [];

    for (const provider of plan.providers) {
      if (provider.status === 'critical') {
        recommendations.push(
          `CRITICAL: ${provider.provider} at ${provider.utilization_percent}% - immediate action needed`
        );
      } else if (provider.status === 'warning') {
        recommendations.push(
          `WARNING: ${provider.provider} at ${provider.utilization_percent}% - monitor closely`
        );
      }
    }

    if (plan.cost_projection > 500) {
      recommendations.push('Cost projection exceeds $500 - review optimization opportunities');
    }

    return recommendations;
  }

  /**
   * Get all provider names
   */
  getAllProviders(): AIProvider[] {
    return Object.keys(AI_CONFIGS) as AIProvider[];
  }
}

export default AICapacityPlanner;
