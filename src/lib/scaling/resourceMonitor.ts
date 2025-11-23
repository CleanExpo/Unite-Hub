/**
 * Resource Monitor Service
 * Phase 58: Track system resources during scaling
 */

import { getSupabaseServer } from '@/lib/supabase';
import { getCurrentTier, SCALING_TIERS } from './performanceGuard';

export interface ResourceMetrics {
  ai_token_usage: number;
  ai_token_limit: number;
  bandwidth_mb: number;
  storage_mb: number;
  queue_depth: number;
  cron_load: number;
  visual_job_count: number;
  visual_job_risk_score: number;
}

export interface ResourceAlert {
  id: string;
  type: 'warning' | 'critical';
  resource: string;
  message: string;
  value: number;
  threshold: number;
  created_at: string;
}

export interface ResourceTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change_percent: number;
  period: string;
}

// Resource thresholds
export const RESOURCE_THRESHOLDS = {
  ai_tokens: {
    warning: 0.7,
    critical: 0.9,
  },
  bandwidth_mb: {
    warning: 1000,
    critical: 5000,
  },
  storage_mb: {
    warning: 5000,
    critical: 10000,
  },
  queue_depth: {
    warning: 50,
    critical: 200,
  },
  cron_load: {
    warning: 0.7,
    critical: 0.9,
  },
  visual_job_risk: {
    warning: 0.6,
    critical: 0.8,
  },
};

/**
 * Get current resource metrics
 */
export async function getResourceMetrics(): Promise<ResourceMetrics> {
  const tier = getCurrentTier();
  const limits = SCALING_TIERS[tier];

  // Mock metrics - in production would come from monitoring
  return {
    ai_token_usage: 125000,
    ai_token_limit: limits.ai_tokens_daily,
    bandwidth_mb: 250,
    storage_mb: 1200,
    queue_depth: 8,
    cron_load: 0.3,
    visual_job_count: 12,
    visual_job_risk_score: 0.2,
  };
}

/**
 * Check resource health
 */
export async function checkResourceHealth(): Promise<{
  healthy: boolean;
  alerts: ResourceAlert[];
}> {
  const metrics = await getResourceMetrics();
  const alerts: ResourceAlert[] = [];

  // Check AI tokens
  const tokenPercent = metrics.ai_token_usage / metrics.ai_token_limit;
  if (tokenPercent >= RESOURCE_THRESHOLDS.ai_tokens.critical) {
    alerts.push({
      id: `ai-tokens-${Date.now()}`,
      type: 'critical',
      resource: 'ai_tokens',
      message: `AI token usage critical: ${(tokenPercent * 100).toFixed(1)}% of daily limit`,
      value: tokenPercent,
      threshold: RESOURCE_THRESHOLDS.ai_tokens.critical,
      created_at: new Date().toISOString(),
    });
  } else if (tokenPercent >= RESOURCE_THRESHOLDS.ai_tokens.warning) {
    alerts.push({
      id: `ai-tokens-${Date.now()}`,
      type: 'warning',
      resource: 'ai_tokens',
      message: `AI token usage elevated: ${(tokenPercent * 100).toFixed(1)}% of daily limit`,
      value: tokenPercent,
      threshold: RESOURCE_THRESHOLDS.ai_tokens.warning,
      created_at: new Date().toISOString(),
    });
  }

  // Check queue depth
  if (metrics.queue_depth >= RESOURCE_THRESHOLDS.queue_depth.critical) {
    alerts.push({
      id: `queue-${Date.now()}`,
      type: 'critical',
      resource: 'queue_depth',
      message: `Queue depth critical: ${metrics.queue_depth} jobs waiting`,
      value: metrics.queue_depth,
      threshold: RESOURCE_THRESHOLDS.queue_depth.critical,
      created_at: new Date().toISOString(),
    });
  } else if (metrics.queue_depth >= RESOURCE_THRESHOLDS.queue_depth.warning) {
    alerts.push({
      id: `queue-${Date.now()}`,
      type: 'warning',
      resource: 'queue_depth',
      message: `Queue depth elevated: ${metrics.queue_depth} jobs waiting`,
      value: metrics.queue_depth,
      threshold: RESOURCE_THRESHOLDS.queue_depth.warning,
      created_at: new Date().toISOString(),
    });
  }

  // Check visual job risk
  if (metrics.visual_job_risk_score >= RESOURCE_THRESHOLDS.visual_job_risk.critical) {
    alerts.push({
      id: `visual-risk-${Date.now()}`,
      type: 'critical',
      resource: 'visual_jobs',
      message: `Visual job risk critical: ${(metrics.visual_job_risk_score * 100).toFixed(0)}%`,
      value: metrics.visual_job_risk_score,
      threshold: RESOURCE_THRESHOLDS.visual_job_risk.critical,
      created_at: new Date().toISOString(),
    });
  }

  // Check storage
  if (metrics.storage_mb >= RESOURCE_THRESHOLDS.storage_mb.critical) {
    alerts.push({
      id: `storage-${Date.now()}`,
      type: 'critical',
      resource: 'storage',
      message: `Storage usage critical: ${metrics.storage_mb}MB`,
      value: metrics.storage_mb,
      threshold: RESOURCE_THRESHOLDS.storage_mb.critical,
      created_at: new Date().toISOString(),
    });
  }

  return {
    healthy: alerts.filter((a) => a.type === 'critical').length === 0,
    alerts,
  };
}

/**
 * Get resource trends
 */
export async function getResourceTrends(): Promise<ResourceTrend[]> {
  // Mock trends - would be calculated from historical data
  return [
    {
      metric: 'ai_tokens',
      direction: 'up',
      change_percent: 15,
      period: 'last_7_days',
    },
    {
      metric: 'storage',
      direction: 'up',
      change_percent: 8,
      period: 'last_7_days',
    },
    {
      metric: 'queue_depth',
      direction: 'stable',
      change_percent: 2,
      period: 'last_7_days',
    },
    {
      metric: 'visual_jobs',
      direction: 'up',
      change_percent: 25,
      period: 'last_7_days',
    },
  ];
}

/**
 * Calculate visual job risk score
 */
export function calculateVisualJobRisk(
  pendingJobs: number,
  failedRecently: number,
  avgProcessingTime: number
): number {
  // Risk factors
  const queueRisk = Math.min(pendingJobs / 50, 1) * 0.4;
  const failureRisk = Math.min(failedRecently / 10, 1) * 0.3;
  const timeRisk = Math.min(avgProcessingTime / 60000, 1) * 0.3; // 60 second baseline

  return queueRisk + failureRisk + timeRisk;
}

/**
 * Get resource utilization summary
 */
export async function getUtilizationSummary(): Promise<{
  overall_percent: number;
  by_resource: { name: string; percent: number; status: string }[];
}> {
  const metrics = await getResourceMetrics();
  const tier = getCurrentTier();
  const limits = SCALING_TIERS[tier];

  const resources = [
    {
      name: 'AI Tokens',
      percent: (metrics.ai_token_usage / limits.ai_tokens_daily) * 100,
    },
    {
      name: 'Visual Jobs',
      percent: (metrics.visual_job_count / limits.visual_jobs_per_day) * 100,
    },
    {
      name: 'Queue',
      percent: Math.min((metrics.queue_depth / 100) * 100, 100),
    },
    {
      name: 'Cron Load',
      percent: metrics.cron_load * 100,
    },
  ];

  const byResource = resources.map((r) => ({
    name: r.name,
    percent: r.percent,
    status:
      r.percent >= 90
        ? 'critical'
        : r.percent >= 70
        ? 'warning'
        : 'healthy',
  }));

  const overall = byResource.reduce((sum, r) => sum + r.percent, 0) / byResource.length;

  return {
    overall_percent: overall,
    by_resource: byResource,
  };
}

/**
 * Log resource snapshot
 */
export async function logResourceSnapshot(): Promise<void> {
  const supabase = await getSupabaseServer();
  const metrics = await getResourceMetrics();

  await supabase.from('resource_snapshots').insert({
    tier: getCurrentTier(),
    metrics,
    created_at: new Date().toISOString(),
  });
}

/**
 * Get historical resource data
 */
export async function getResourceHistory(
  hours: number = 24
): Promise<{ timestamp: string; metrics: ResourceMetrics }[]> {
  const supabase = await getSupabaseServer();

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('resource_snapshots')
    .select('created_at, metrics')
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching resource history:', error);
    return [];
  }

  return (data || []).map((row) => ({
    timestamp: row.created_at,
    metrics: row.metrics as ResourceMetrics,
  }));
}

export default {
  RESOURCE_THRESHOLDS,
  getResourceMetrics,
  checkResourceHealth,
  getResourceTrends,
  calculateVisualJobRisk,
  getUtilizationSummary,
  logResourceSnapshot,
  getResourceHistory,
};
