/**
 * Performance Guard Service
 * Phase 58: Protect system performance during scaling
 */

import { getSupabaseServer } from '@/lib/supabase';

// Scaling tiers
export type ScalingTier = 'soft_launch' | 'hard_launch' | 'growth_phase';

export interface TierLimits {
  max_clients: number;
  ai_tokens_daily: number;
  visual_jobs_per_day: number;
  cron_frequency: string;
  concurrent_jobs: number;
  api_rate_limit: number; // requests per minute
}

export interface PerformanceStatus {
  tier: ScalingTier;
  healthy: boolean;
  warnings: string[];
  metrics: {
    response_time_avg_ms: number;
    error_rate_percent: number;
    queue_depth: number;
    active_jobs: number;
    cpu_usage_percent: number;
    memory_usage_percent: number;
  };
}

// Tier configurations
export const SCALING_TIERS: Record<ScalingTier, TierLimits> = {
  soft_launch: {
    max_clients: 5,
    ai_tokens_daily: 500000,
    visual_jobs_per_day: 30,
    cron_frequency: 'daily',
    concurrent_jobs: 3,
    api_rate_limit: 60,
  },
  hard_launch: {
    max_clients: 50,
    ai_tokens_daily: 5000000,
    visual_jobs_per_day: 200,
    cron_frequency: 'hourly',
    concurrent_jobs: 10,
    api_rate_limit: 300,
  },
  growth_phase: {
    max_clients: 100,
    ai_tokens_daily: 15000000,
    visual_jobs_per_day: 600,
    cron_frequency: 'every_30_minutes',
    concurrent_jobs: 25,
    api_rate_limit: 600,
  },
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  response_time_warning_ms: 500,
  response_time_critical_ms: 2000,
  error_rate_warning_percent: 1,
  error_rate_critical_percent: 5,
  queue_depth_warning: 50,
  queue_depth_critical: 200,
  memory_warning_percent: 70,
  memory_critical_percent: 90,
};

// Current tier (could be stored in env or database)
let currentTier: ScalingTier = 'soft_launch';

/**
 * Get current scaling tier
 */
export function getCurrentTier(): ScalingTier {
  const envTier = process.env.SCALING_TIER as ScalingTier | undefined;
  return envTier || currentTier;
}

/**
 * Set scaling tier
 */
export function setScalingTier(tier: ScalingTier): void {
  currentTier = tier;
}

/**
 * Get limits for current tier
 */
export function getCurrentLimits(): TierLimits {
  return SCALING_TIERS[getCurrentTier()];
}

/**
 * Check if operation is within limits
 */
export function isWithinLimits(
  operation: 'ai_tokens' | 'visual_jobs' | 'concurrent_jobs' | 'api_rate',
  currentValue: number
): { allowed: boolean; limit: number; remaining: number } {
  const limits = getCurrentLimits();

  let limit: number;
  switch (operation) {
    case 'ai_tokens':
      limit = limits.ai_tokens_daily;
      break;
    case 'visual_jobs':
      limit = limits.visual_jobs_per_day;
      break;
    case 'concurrent_jobs':
      limit = limits.concurrent_jobs;
      break;
    case 'api_rate':
      limit = limits.api_rate_limit;
      break;
    default:
      limit = 0;
  }

  return {
    allowed: currentValue < limit,
    limit,
    remaining: Math.max(0, limit - currentValue),
  };
}

/**
 * Get performance status
 */
export async function getPerformanceStatus(): Promise<PerformanceStatus> {
  const warnings: string[] = [];

  // Mock metrics - in production, these would come from monitoring
  const metrics = {
    response_time_avg_ms: 150,
    error_rate_percent: 0.2,
    queue_depth: 5,
    active_jobs: 2,
    cpu_usage_percent: 35,
    memory_usage_percent: 45,
  };

  // Check thresholds
  if (metrics.response_time_avg_ms > PERFORMANCE_THRESHOLDS.response_time_warning_ms) {
    warnings.push(`Response time elevated: ${metrics.response_time_avg_ms}ms`);
  }

  if (metrics.error_rate_percent > PERFORMANCE_THRESHOLDS.error_rate_warning_percent) {
    warnings.push(`Error rate elevated: ${metrics.error_rate_percent}%`);
  }

  if (metrics.queue_depth > PERFORMANCE_THRESHOLDS.queue_depth_warning) {
    warnings.push(`Queue depth high: ${metrics.queue_depth} jobs`);
  }

  if (metrics.memory_usage_percent > PERFORMANCE_THRESHOLDS.memory_warning_percent) {
    warnings.push(`Memory usage high: ${metrics.memory_usage_percent}%`);
  }

  const healthy = warnings.length === 0;

  return {
    tier: getCurrentTier(),
    healthy,
    warnings,
    metrics,
  };
}

/**
 * Check if system should throttle
 */
export function shouldThrottle(currentLoad: number): boolean {
  const limits = getCurrentLimits();
  const concurrentLimit = limits.concurrent_jobs;

  // Throttle if at 80% capacity
  return currentLoad >= concurrentLimit * 0.8;
}

/**
 * Get throttle delay based on load
 */
export function getThrottleDelay(currentLoad: number): number {
  const limits = getCurrentLimits();
  const loadPercent = (currentLoad / limits.concurrent_jobs) * 100;

  if (loadPercent < 50) return 0;
  if (loadPercent < 70) return 100;
  if (loadPercent < 90) return 500;
  return 2000;
}

/**
 * Check tier upgrade eligibility
 */
export function checkTierUpgradeEligibility(): {
  eligible: boolean;
  nextTier: ScalingTier | null;
  requirements: string[];
} {
  const current = getCurrentTier();

  if (current === 'growth_phase') {
    return {
      eligible: false,
      nextTier: null,
      requirements: ['Already at maximum tier'],
    };
  }

  const nextTier: ScalingTier = current === 'soft_launch' ? 'hard_launch' : 'growth_phase';
  const requirements: string[] = [];

  // Example requirements for upgrade
  if (current === 'soft_launch') {
    requirements.push('Complete soft launch with 5 stabilized clients');
    requirements.push('Achieve 80% trial completion rate');
    requirements.push('Zero critical incidents for 30 days');
    requirements.push('Database pooling enabled');
  } else if (current === 'hard_launch') {
    requirements.push('Complete hard launch with 50 active clients');
    requirements.push('Average momentum score above 70');
    requirements.push('Redis caching implemented');
    requirements.push('CDN configured for assets');
  }

  return {
    eligible: false, // Would be calculated based on actual metrics
    nextTier,
    requirements,
  };
}

/**
 * Get infrastructure recommendations for tier
 */
export function getInfrastructureRecommendations(tier: ScalingTier): string[] {
  switch (tier) {
    case 'soft_launch':
      return [
        'Vercel Pro plan',
        'Supabase Free/Pro tier',
        'Basic monitoring with Vercel Analytics',
      ];
    case 'hard_launch':
      return [
        'Vercel Pro with increased limits',
        'Supabase Pro with connection pooler',
        'Redis for session/cache (Upstash)',
        'Error tracking (Sentry)',
        'APM monitoring consideration',
      ];
    case 'growth_phase':
      return [
        'Vercel Enterprise or dedicated',
        'Supabase Pro with read replicas',
        'Redis cluster for high availability',
        'Full APM (Datadog/New Relic)',
        'CDN for static assets (Cloudflare)',
        'Queue system (BullMQ/Inngest)',
      ];
    default:
      return [];
  }
}

/**
 * Log performance event
 */
export async function logPerformanceEvent(
  eventType: 'throttle' | 'limit_reached' | 'tier_change' | 'warning',
  details: Record<string, unknown>
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase.from('performance_events').insert({
    event_type: eventType,
    tier: getCurrentTier(),
    details,
    created_at: new Date().toISOString(),
  });
}

export default {
  SCALING_TIERS,
  PERFORMANCE_THRESHOLDS,
  getCurrentTier,
  setScalingTier,
  getCurrentLimits,
  isWithinLimits,
  getPerformanceStatus,
  shouldThrottle,
  getThrottleDelay,
  checkTierUpgradeEligibility,
  getInfrastructureRecommendations,
  logPerformanceEvent,
};
