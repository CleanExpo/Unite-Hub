/**
 * Client Capacity Planner
 * Phase 66: Plan client capacity for different tiers with headroom detection
 */

import { ScalingTierId, SCALING_TIERS } from './scalingPolicyEngine';

export interface ClientCapacityPlan {
  tier_id: ScalingTierId;
  tier_label: string;
  current_clients: number;
  max_clients: number;
  utilization_percent: number;
  headroom_clients: number;
  status: 'green' | 'amber' | 'red';
  can_onboard: boolean;
  next_milestone: string;
  recommendations: string[];
}

export interface TierCapacityConfig {
  tier_id: ScalingTierId;
  min_clients: number;
  max_clients: number;
  soft_limit: number; // Warning threshold
  hard_limit: number; // Critical threshold
  resources: {
    db_connections: number;
    worker_concurrency: number;
    cache_size_mb: number;
    storage_gb: number;
    monthly_token_budget: number;
  };
}

// Tier capacity configurations
const TIER_CONFIGS: Record<ScalingTierId, TierCapacityConfig> = {
  soft_launch: {
    tier_id: 'soft_launch',
    min_clients: 1,
    max_clients: 5,
    soft_limit: 4, // 80%
    hard_limit: 5, // 100%
    resources: {
      db_connections: 10,
      worker_concurrency: 2,
      cache_size_mb: 128,
      storage_gb: 10,
      monthly_token_budget: 100000,
    },
  },
  hard_launch: {
    tier_id: 'hard_launch',
    min_clients: 5,
    max_clients: 50,
    soft_limit: 40, // 80%
    hard_limit: 45, // 90%
    resources: {
      db_connections: 50,
      worker_concurrency: 5,
      cache_size_mb: 512,
      storage_gb: 50,
      monthly_token_budget: 500000,
    },
  },
  growth_phase: {
    tier_id: 'growth_phase',
    min_clients: 50,
    max_clients: 100,
    soft_limit: 80, // 80%
    hard_limit: 90, // 90%
    resources: {
      db_connections: 100,
      worker_concurrency: 10,
      cache_size_mb: 2048,
      storage_gb: 200,
      monthly_token_budget: 2000000,
    },
  },
};

export class ClientCapacityPlanner {
  /**
   * Generate capacity plan for current client count
   */
  generateCapacityPlan(currentClients: number): ClientCapacityPlan {
    const tier = this.getTierForClientCount(currentClients);
    const config = TIER_CONFIGS[tier.id];

    const utilizationPercent = (currentClients / config.max_clients) * 100;
    const headroomClients = config.max_clients - currentClients;

    let status: 'green' | 'amber' | 'red' = 'green';
    if (currentClients >= config.hard_limit) status = 'red';
    else if (currentClients >= config.soft_limit) status = 'amber';

    const recommendations: string[] = [];
    const nextMilestone = this.getNextMilestone(currentClients, config);

    // Generate recommendations based on status
    if (status === 'red') {
      recommendations.push('Consider upgrading to next tier immediately');
      recommendations.push('Pause new client invitations');
      recommendations.push('Review resource allocation');
    } else if (status === 'amber') {
      recommendations.push('Plan for tier upgrade within 2 weeks');
      recommendations.push('Monitor resource utilization closely');
      recommendations.push('Prepare infrastructure for scaling');
    } else {
      recommendations.push('Capacity healthy - continue normal operations');
      if (headroomClients <= 2) {
        recommendations.push('Consider early planning for next tier');
      }
    }

    return {
      tier_id: tier.id,
      tier_label: tier.label,
      current_clients: currentClients,
      max_clients: config.max_clients,
      utilization_percent: Math.round(utilizationPercent),
      headroom_clients: headroomClients,
      status,
      can_onboard: status !== 'red',
      next_milestone: nextMilestone,
      recommendations,
    };
  }

  /**
   * Get tier for client count
   */
  getTierForClientCount(clientCount: number): typeof SCALING_TIERS[ScalingTierId] {
    if (clientCount <= 5) return SCALING_TIERS.soft_launch;
    if (clientCount <= 50) return SCALING_TIERS.hard_launch;
    return SCALING_TIERS.growth_phase;
  }

  /**
   * Get tier configuration
   */
  getTierConfig(tierId: ScalingTierId): TierCapacityConfig {
    return TIER_CONFIGS[tierId];
  }

  /**
   * Get next milestone message
   */
  private getNextMilestone(currentClients: number, config: TierCapacityConfig): string {
    if (currentClients < config.soft_limit) {
      return `${config.soft_limit - currentClients} clients until warning threshold`;
    } else if (currentClients < config.hard_limit) {
      return `${config.hard_limit - currentClients} clients until hard limit`;
    } else if (currentClients < config.max_clients) {
      return `${config.max_clients - currentClients} clients until tier maximum`;
    } else {
      return 'At tier capacity - upgrade required';
    }
  }

  /**
   * Calculate resources needed for client count
   */
  calculateRequiredResources(targetClients: number): TierCapacityConfig['resources'] {
    const tier = this.getTierForClientCount(targetClients);
    return TIER_CONFIGS[tier.id].resources;
  }

  /**
   * Get upgrade requirements
   */
  getUpgradeRequirements(currentTier: ScalingTierId): {
    next_tier: ScalingTierId | null;
    resource_changes: { resource: string; from: number; to: number; unit: string }[];
    estimated_cost_increase: string;
  } | null {
    const nextTierMap: Record<ScalingTierId, ScalingTierId | null> = {
      soft_launch: 'hard_launch',
      hard_launch: 'growth_phase',
      growth_phase: null,
    };

    const nextTier = nextTierMap[currentTier];
    if (!nextTier) return null;

    const currentConfig = TIER_CONFIGS[currentTier];
    const nextConfig = TIER_CONFIGS[nextTier];

    const resourceChanges = [
      {
        resource: 'Database Connections',
        from: currentConfig.resources.db_connections,
        to: nextConfig.resources.db_connections,
        unit: 'connections',
      },
      {
        resource: 'Worker Concurrency',
        from: currentConfig.resources.worker_concurrency,
        to: nextConfig.resources.worker_concurrency,
        unit: 'workers',
      },
      {
        resource: 'Cache Size',
        from: currentConfig.resources.cache_size_mb,
        to: nextConfig.resources.cache_size_mb,
        unit: 'MB',
      },
      {
        resource: 'Storage',
        from: currentConfig.resources.storage_gb,
        to: nextConfig.resources.storage_gb,
        unit: 'GB',
      },
      {
        resource: 'Monthly Token Budget',
        from: currentConfig.resources.monthly_token_budget,
        to: nextConfig.resources.monthly_token_budget,
        unit: 'tokens',
      },
    ];

    // Estimate cost increase
    const costEstimates: Record<ScalingTierId, string> = {
      soft_launch: '$50-100/month',
      hard_launch: '$200-400/month',
      growth_phase: '$500-1000/month',
    };

    return {
      next_tier: nextTier,
      resource_changes: resourceChanges,
      estimated_cost_increase: costEstimates[nextTier],
    };
  }

  /**
   * Project capacity timeline
   */
  projectCapacityTimeline(
    currentClients: number,
    growthRatePerMonth: number
  ): { month: number; clients: number; tier: ScalingTierId; status: 'green' | 'amber' | 'red' }[] {
    const timeline: { month: number; clients: number; tier: ScalingTierId; status: 'green' | 'amber' | 'red' }[] = [];

    for (let month = 0; month <= 12; month++) {
      const projectedClients = Math.round(currentClients + (growthRatePerMonth * month));
      const plan = this.generateCapacityPlan(projectedClients);
      timeline.push({
        month,
        clients: projectedClients,
        tier: plan.tier_id,
        status: plan.status,
      });
    }

    return timeline;
  }

  /**
   * Get all tier configurations
   */
  getAllTierConfigs(): TierCapacityConfig[] {
    return Object.values(TIER_CONFIGS);
  }
}

export default ClientCapacityPlanner;
