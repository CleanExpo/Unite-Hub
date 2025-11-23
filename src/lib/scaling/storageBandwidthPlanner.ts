/**
 * Storage & Bandwidth Planner
 * Phase 66: Plan storage and bandwidth needs per tier
 */

import { ScalingTierId } from './scalingPolicyEngine';

export interface StorageConfig {
  tier_id: ScalingTierId;
  max_storage_gb: number;
  max_bandwidth_gb: number;
  recommended_cdn: boolean;
  recommended_cache_mb: number;
  max_file_size_mb: number;
  monthly_cost_estimate: number;
}

export interface StorageMetrics {
  storage_used_gb: number;
  bandwidth_used_gb: number;
  file_count: number;
  avg_file_size_mb: number;
  read_operations: number;
  write_operations: number;
}

export interface StorageCapacityStatus {
  tier_id: ScalingTierId;
  storage: {
    used_gb: number;
    max_gb: number;
    utilization_percent: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  bandwidth: {
    used_gb: number;
    max_gb: number;
    utilization_percent: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  overall_status: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
  cost_projection: number;
}

// Storage configurations per tier
const STORAGE_CONFIGS: Record<ScalingTierId, StorageConfig> = {
  soft_launch: {
    tier_id: 'soft_launch',
    max_storage_gb: 10,
    max_bandwidth_gb: 50,
    recommended_cdn: false,
    recommended_cache_mb: 128,
    max_file_size_mb: 10,
    monthly_cost_estimate: 10,
  },
  hard_launch: {
    tier_id: 'hard_launch',
    max_storage_gb: 50,
    max_bandwidth_gb: 250,
    recommended_cdn: true,
    recommended_cache_mb: 512,
    max_file_size_mb: 25,
    monthly_cost_estimate: 50,
  },
  growth_phase: {
    tier_id: 'growth_phase',
    max_storage_gb: 200,
    max_bandwidth_gb: 1000,
    recommended_cdn: true,
    recommended_cache_mb: 2048,
    max_file_size_mb: 50,
    monthly_cost_estimate: 150,
  },
};

export class StorageBandwidthPlanner {
  /**
   * Calculate storage capacity status
   */
  calculateStorageStatus(
    tierId: ScalingTierId,
    metrics: StorageMetrics
  ): StorageCapacityStatus {
    const config = STORAGE_CONFIGS[tierId];

    // Storage utilization
    const storageUtil = (metrics.storage_used_gb / config.max_storage_gb) * 100;
    let storageStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (storageUtil >= 90) storageStatus = 'critical';
    else if (storageUtil >= 75) storageStatus = 'warning';

    // Bandwidth utilization
    const bandwidthUtil = (metrics.bandwidth_used_gb / config.max_bandwidth_gb) * 100;
    let bandwidthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (bandwidthUtil >= 90) bandwidthStatus = 'critical';
    else if (bandwidthUtil >= 75) bandwidthStatus = 'warning';

    // Overall status
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (storageStatus === 'critical' || bandwidthStatus === 'critical') {
      overallStatus = 'critical';
    } else if (storageStatus === 'warning' || bandwidthStatus === 'warning') {
      overallStatus = 'warning';
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (storageStatus === 'critical') {
      recommendations.push('Storage at critical level - archive old files or upgrade tier');
    } else if (storageStatus === 'warning') {
      recommendations.push('Storage approaching limit - plan for cleanup or upgrade');
    }

    if (bandwidthStatus === 'critical') {
      recommendations.push('Bandwidth at critical level - enable CDN or upgrade tier');
    } else if (bandwidthStatus === 'warning') {
      recommendations.push('Bandwidth approaching limit - consider CDN optimization');
    }

    if (config.recommended_cdn && bandwidthUtil > 50) {
      recommendations.push('CDN recommended for this tier - reduces origin bandwidth');
    }

    // Large file detection
    if (metrics.avg_file_size_mb > config.max_file_size_mb * 0.8) {
      recommendations.push('Average file size approaching limit - consider compression');
    }

    // Cost projection
    const costProjection = this.calculateCostProjection(metrics, config);

    return {
      tier_id: tierId,
      storage: {
        used_gb: metrics.storage_used_gb,
        max_gb: config.max_storage_gb,
        utilization_percent: Math.round(storageUtil),
        status: storageStatus,
      },
      bandwidth: {
        used_gb: metrics.bandwidth_used_gb,
        max_gb: config.max_bandwidth_gb,
        utilization_percent: Math.round(bandwidthUtil),
        status: bandwidthStatus,
      },
      overall_status: overallStatus,
      recommendations,
      cost_projection: costProjection,
    };
  }

  /**
   * Calculate cost projection
   */
  private calculateCostProjection(
    metrics: StorageMetrics,
    config: StorageConfig
  ): number {
    // Base cost + overages
    let cost = config.monthly_cost_estimate;

    // Storage overage
    if (metrics.storage_used_gb > config.max_storage_gb) {
      const overage = metrics.storage_used_gb - config.max_storage_gb;
      cost += overage * 0.50; // $0.50 per GB overage
    }

    // Bandwidth overage
    if (metrics.bandwidth_used_gb > config.max_bandwidth_gb) {
      const overage = metrics.bandwidth_used_gb - config.max_bandwidth_gb;
      cost += overage * 0.10; // $0.10 per GB overage
    }

    return Math.round(cost * 100) / 100;
  }

  /**
   * Get storage configuration for tier
   */
  getStorageConfig(tierId: ScalingTierId): StorageConfig {
    return STORAGE_CONFIGS[tierId];
  }

  /**
   * Calculate storage growth rate
   */
  calculateGrowthRate(
    currentUsage: number,
    historicalUsage: { date: string; usage_gb: number }[]
  ): {
    daily_growth_gb: number;
    projected_full_date: Date | null;
    days_until_full: number | null;
  } {
    if (historicalUsage.length < 2) {
      return {
        daily_growth_gb: 0,
        projected_full_date: null,
        days_until_full: null,
      };
    }

    // Calculate average daily growth
    const sorted = historicalUsage.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const daysDiff = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24);
    const dailyGrowth = (last.usage_gb - first.usage_gb) / daysDiff;

    if (dailyGrowth <= 0) {
      return {
        daily_growth_gb: dailyGrowth,
        projected_full_date: null,
        days_until_full: null,
      };
    }

    // Project when storage will be full (assuming max 200GB for growth phase)
    const maxStorage = 200;
    const remaining = maxStorage - currentUsage;
    const daysUntilFull = Math.ceil(remaining / dailyGrowth);
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysUntilFull);

    return {
      daily_growth_gb: Math.round(dailyGrowth * 100) / 100,
      projected_full_date: projectedDate,
      days_until_full: daysUntilFull,
    };
  }

  /**
   * Get CDN recommendations
   */
  getCDNRecommendations(
    tierId: ScalingTierId,
    bandwidthUsedGb: number
  ): {
    should_enable: boolean;
    estimated_savings: number;
    providers: string[];
  } {
    const config = STORAGE_CONFIGS[tierId];
    const utilizationPercent = (bandwidthUsedGb / config.max_bandwidth_gb) * 100;

    const shouldEnable = config.recommended_cdn || utilizationPercent > 60;
    const estimatedSavings = shouldEnable ? bandwidthUsedGb * 0.05 : 0; // ~5% cost reduction

    return {
      should_enable: shouldEnable,
      estimated_savings: Math.round(estimatedSavings * 100) / 100,
      providers: ['Vercel Edge Network', 'Cloudflare', 'AWS CloudFront'],
    };
  }

  /**
   * Get cache recommendations
   */
  getCacheRecommendations(
    tierId: ScalingTierId,
    readOperations: number
  ): {
    recommended_size_mb: number;
    cache_hit_target: number;
    estimated_latency_reduction_ms: number;
  } {
    const config = STORAGE_CONFIGS[tierId];

    // Higher read ops = more cache benefit
    const sizeMultiplier = readOperations > 10000 ? 2 : readOperations > 5000 ? 1.5 : 1;
    const recommendedSize = Math.round(config.recommended_cache_mb * sizeMultiplier);

    return {
      recommended_size_mb: recommendedSize,
      cache_hit_target: 0.85, // 85% hit rate target
      estimated_latency_reduction_ms: readOperations > 5000 ? 100 : 50,
    };
  }

  /**
   * Get all storage configurations
   */
  getAllStorageConfigs(): StorageConfig[] {
    return Object.values(STORAGE_CONFIGS);
  }
}

export default StorageBandwidthPlanner;
