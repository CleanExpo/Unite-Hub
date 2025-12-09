/**
 * Scaling Policy Engine
 * Phase 66: Core engine for scaling recommendations based on system metrics
 */

export type ScalingTierId = 'soft_launch' | 'hard_launch' | 'growth_phase';

export type RecommendationType =
  | 'enable_supabase_pooler'
  | 'add_redis_cache'
  | 'enable_cdn_for_assets'
  | 'increase_worker_concurrency'
  | 'split_cron_schedules'
  | 'tighten_rate_limits'
  | 'raise_token_budgets'
  | 'lower_token_budgets'
  | 'pause_new_client_invites';

export interface ScalingTier {
  id: ScalingTierId;
  label: string;
  target_clients: string;
  max_cpu: number;
  max_error_rate: number;
  max_ai_latency_ms: number;
}

export interface ScalingPolicy {
  id: string;
  workspace_id: string;
  current_tier: ScalingTierId;
  clients_count: number;
  thresholds: TierThresholds;
  created_at: string;
  updated_at: string;
}

export interface TierThresholds {
  cpu_warning: number;
  cpu_critical: number;
  error_rate_warning: number;
  error_rate_critical: number;
  ai_latency_warning: number;
  ai_latency_critical: number;
  queue_depth_warning: number;
  queue_depth_critical: number;
}

export interface SystemMetrics {
  cpu_utilization: number;
  error_rate: number;
  ai_latency_ms: number;
  queue_depth: number;
  token_usage: number;
  storage_usage_gb: number;
  bandwidth_usage_mb: number;
  active_clients: number;
}

export interface ScalingRecommendation {
  id: string;
  workspace_id: string;
  type: RecommendationType;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  confidence: number;
  evidence: string[];
  implementation_steps: string[];
  estimated_cost_impact: string;
  priority: number;
  status: 'pending' | 'accepted' | 'deferred' | 'rejected';
  created_at: string;
}

export interface ScalingDecision {
  id: string;
  workspace_id: string;
  recommendation_id: string;
  action: 'accepted' | 'deferred' | 'rejected';
  reason?: string;
  sip_id?: string;
  decided_at: string;
  decided_by: string;
}

export interface CapacityStatus {
  tier: ScalingTier;
  utilization: {
    cpu: { value: number; status: 'healthy' | 'warning' | 'critical' };
    errors: { value: number; status: 'healthy' | 'warning' | 'critical' };
    ai_latency: { value: number; status: 'healthy' | 'warning' | 'critical' };
    queue: { value: number; status: 'healthy' | 'warning' | 'critical' };
  };
  overall_health: 'healthy' | 'warning' | 'critical';
  headroom_percent: number;
  can_accept_new_clients: boolean;
}

// Tier definitions
export const SCALING_TIERS: Record<ScalingTierId, ScalingTier> = {
  soft_launch: {
    id: 'soft_launch',
    label: 'Soft Launch (1–5 clients)',
    target_clients: '1-5',
    max_cpu: 0.50,
    max_error_rate: 0.02,
    max_ai_latency_ms: 2000,
  },
  hard_launch: {
    id: 'hard_launch',
    label: 'Hard Launch (5–50 clients)',
    target_clients: '5-50',
    max_cpu: 0.70,
    max_error_rate: 0.03,
    max_ai_latency_ms: 2500,
  },
  growth_phase: {
    id: 'growth_phase',
    label: 'Growth Phase (50–100 clients)',
    target_clients: '50-100',
    max_cpu: 0.80,
    max_error_rate: 0.05,
    max_ai_latency_ms: 3000,
  },
};

// Headroom thresholds
const HEADROOM = {
  warning_at: 0.80,
  critical_at: 0.90,
};

// Recommendation configurations
const RECOMMENDATION_CONFIGS: Record<RecommendationType, {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  cost_impact: string;
  steps: string[];
}> = {
  enable_supabase_pooler: {
    title: 'Enable Supabase Connection Pooler',
    description: 'Reduce database connection overhead by 60-80% with connection pooling',
    impact: 'high',
    risk: 'low',
    effort: 'low',
    cost_impact: 'Included in plan',
    steps: [
      'Go to Supabase Dashboard → Settings → Database',
      'Enable connection pooler',
      'Update DATABASE_URL to use pooler endpoint',
      'Test with load test scenario',
    ],
  },
  add_redis_cache: {
    title: 'Add Redis Cache Layer',
    description: 'Cache frequently accessed data to reduce database load and improve response times',
    impact: 'high',
    risk: 'medium',
    effort: 'medium',
    cost_impact: '+$10-30/month',
    steps: [
      'Provision Upstash Redis or similar',
      'Add REDIS_URL to environment',
      'Implement caching for hot paths',
      'Add cache invalidation logic',
    ],
  },
  enable_cdn_for_assets: {
    title: 'Enable CDN for Static Assets',
    description: 'Serve images and static files from edge locations for faster global delivery',
    impact: 'medium',
    risk: 'low',
    effort: 'low',
    cost_impact: '+$5-20/month',
    steps: [
      'Configure Vercel Edge Network or Cloudflare',
      'Set cache headers for static assets',
      'Update asset URLs to use CDN',
    ],
  },
  increase_worker_concurrency: {
    title: 'Increase Worker Concurrency',
    description: 'Add more concurrent workers to process queue jobs faster',
    impact: 'high',
    risk: 'low',
    effort: 'low',
    cost_impact: '+$20-50/month',
    steps: [
      'Increase Vercel function concurrency limit',
      'Add worker scaling configuration',
      'Monitor queue depth after change',
    ],
  },
  split_cron_schedules: {
    title: 'Split Cron Job Schedules',
    description: 'Distribute cron jobs across time to avoid resource spikes',
    impact: 'medium',
    risk: 'low',
    effort: 'low',
    cost_impact: 'No change',
    steps: [
      'Review current cron schedules',
      'Identify overlapping jobs',
      'Stagger start times by 5-10 minutes',
    ],
  },
  tighten_rate_limits: {
    title: 'Tighten API Rate Limits',
    description: 'Reduce per-client rate limits to protect system stability',
    impact: 'medium',
    risk: 'medium',
    effort: 'low',
    cost_impact: 'No change',
    steps: [
      'Review current rate limit configuration',
      'Reduce limits by 20-30%',
      'Add rate limit headers to responses',
      'Notify affected clients',
    ],
  },
  raise_token_budgets: {
    title: 'Raise AI Token Budgets',
    description: 'Increase per-client token allocation to improve AI response quality',
    impact: 'medium',
    risk: 'medium',
    effort: 'low',
    cost_impact: '+$50-200/month',
    steps: [
      'Review current token usage patterns',
      'Increase budget by 25-50%',
      'Monitor cost impact',
    ],
  },
  lower_token_budgets: {
    title: 'Lower AI Token Budgets',
    description: 'Reduce per-client token allocation to control costs',
    impact: 'medium',
    risk: 'medium',
    effort: 'low',
    cost_impact: '-$30-100/month',
    steps: [
      'Identify high-usage clients',
      'Implement prompt optimization',
      'Reduce budget by 20-30%',
    ],
  },
  pause_new_client_invites: {
    title: 'Pause New Client Invites',
    description: 'Temporarily stop accepting new clients until capacity issues are resolved',
    impact: 'high',
    risk: 'high',
    effort: 'low',
    cost_impact: 'Revenue impact',
    steps: [
      'Disable invite links',
      'Queue interested prospects',
      'Resolve capacity issues',
      'Re-enable invites',
    ],
  },
};

export class ScalingPolicyEngine {
  /**
   * Determine current tier based on client count
   */
  getCurrentTier(clientCount: number): ScalingTier {
    if (clientCount <= 5) {
return SCALING_TIERS.soft_launch;
}
    if (clientCount <= 50) {
return SCALING_TIERS.hard_launch;
}
    return SCALING_TIERS.growth_phase;
  }

  /**
   * Calculate capacity status from metrics
   */
  calculateCapacityStatus(
    metrics: SystemMetrics,
    tier?: ScalingTier
  ): CapacityStatus {
    const currentTier = tier || this.getCurrentTier(metrics.active_clients);

    // Calculate utilization for each metric
    const cpuUtilization = metrics.cpu_utilization / currentTier.max_cpu;
    const errorUtilization = metrics.error_rate / currentTier.max_error_rate;
    const latencyUtilization = metrics.ai_latency_ms / currentTier.max_ai_latency_ms;
    const queueUtilization = Math.min(metrics.queue_depth / 100, 1); // Normalize to 100

    const getStatus = (util: number): 'healthy' | 'warning' | 'critical' => {
      if (util >= HEADROOM.critical_at) {
return 'critical';
}
      if (util >= HEADROOM.warning_at) {
return 'warning';
}
      return 'healthy';
    };

    const utilization = {
      cpu: { value: metrics.cpu_utilization, status: getStatus(cpuUtilization) },
      errors: { value: metrics.error_rate, status: getStatus(errorUtilization) },
      ai_latency: { value: metrics.ai_latency_ms, status: getStatus(latencyUtilization) },
      queue: { value: metrics.queue_depth, status: getStatus(queueUtilization) },
    };

    // Overall health is the worst status
    const statuses = [utilization.cpu.status, utilization.errors.status, utilization.ai_latency.status, utilization.queue.status];
    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (statuses.includes('critical')) {
overallHealth = 'critical';
} else if (statuses.includes('warning')) {
overallHealth = 'warning';
}

    // Calculate headroom
    const maxUtilization = Math.max(cpuUtilization, errorUtilization, latencyUtilization, queueUtilization);
    const headroomPercent = Math.max(0, (1 - maxUtilization) * 100);

    return {
      tier: currentTier,
      utilization,
      overall_health: overallHealth,
      headroom_percent: Math.round(headroomPercent),
      can_accept_new_clients: overallHealth !== 'critical' && headroomPercent > 10,
    };
  }

  /**
   * Generate scaling recommendations based on metrics
   */
  generateRecommendations(
    workspaceId: string,
    metrics: SystemMetrics,
    capacityStatus: CapacityStatus
  ): ScalingRecommendation[] {
    const recommendations: ScalingRecommendation[] = [];
    let priority = 1;

    // Database bottleneck
    if (capacityStatus.utilization.cpu.status !== 'healthy' || metrics.queue_depth > 50) {
      recommendations.push(this.createRecommendation(
        workspaceId,
        'enable_supabase_pooler',
        priority++,
        ['CPU utilization at ' + (metrics.cpu_utilization * 100).toFixed(1) + '%', 'Queue depth: ' + metrics.queue_depth],
        85
      ));
    }

    // High latency
    if (capacityStatus.utilization.ai_latency.status !== 'healthy') {
      recommendations.push(this.createRecommendation(
        workspaceId,
        'add_redis_cache',
        priority++,
        ['AI latency: ' + metrics.ai_latency_ms + 'ms', 'Exceeds tier limit: ' + capacityStatus.tier.max_ai_latency_ms + 'ms'],
        80
      ));
    }

    // Queue backlog
    if (metrics.queue_depth > 75) {
      recommendations.push(this.createRecommendation(
        workspaceId,
        'increase_worker_concurrency',
        priority++,
        ['Queue depth: ' + metrics.queue_depth, 'Jobs backing up'],
        75
      ));
    }

    // High error rate
    if (capacityStatus.utilization.errors.status === 'critical') {
      recommendations.push(this.createRecommendation(
        workspaceId,
        'tighten_rate_limits',
        priority++,
        ['Error rate: ' + (metrics.error_rate * 100).toFixed(2) + '%', 'Exceeds critical threshold'],
        70
      ));
    }

    // Near capacity
    if (capacityStatus.headroom_percent < 10) {
      recommendations.push(this.createRecommendation(
        workspaceId,
        'pause_new_client_invites',
        priority++,
        ['Headroom: ' + capacityStatus.headroom_percent + '%', 'System at capacity'],
        90
      ));
    }

    // Token budget adjustments
    if (metrics.token_usage > 50000) {
      recommendations.push(this.createRecommendation(
        workspaceId,
        'lower_token_budgets',
        priority++,
        ['Token usage spike: ' + metrics.token_usage, 'Cost control needed'],
        65
      ));
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Create a recommendation object
   */
  private createRecommendation(
    workspaceId: string,
    type: RecommendationType,
    priority: number,
    evidence: string[],
    confidence: number
  ): ScalingRecommendation {
    const config = RECOMMENDATION_CONFIGS[type];
    return {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workspace_id: workspaceId,
      type,
      title: config.title,
      description: config.description,
      impact: config.impact,
      risk: config.risk,
      effort: config.effort,
      confidence,
      evidence,
      implementation_steps: config.steps,
      estimated_cost_impact: config.cost_impact,
      priority,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Get tier upgrade path
   */
  getTierUpgradePath(currentTier: ScalingTierId): ScalingTierId | null {
    if (currentTier === 'soft_launch') {
return 'hard_launch';
}
    if (currentTier === 'hard_launch') {
return 'growth_phase';
}
    return null;
  }

  /**
   * Check if upgrade to next tier is recommended
   */
  shouldUpgradeTier(metrics: SystemMetrics, currentTier: ScalingTierId): boolean {
    const tier = SCALING_TIERS[currentTier];
    const clientRanges = {
      soft_launch: 5,
      hard_launch: 50,
      growth_phase: 100,
    };

    return metrics.active_clients >= clientRanges[currentTier] * 0.9;
  }

  /**
   * Get all available tiers
   */
  getAllTiers(): ScalingTier[] {
    return Object.values(SCALING_TIERS);
  }

  /**
   * Get recommendation config
   */
  getRecommendationConfig(type: RecommendationType) {
    return RECOMMENDATION_CONFIGS[type];
  }
}

export default ScalingPolicyEngine;
