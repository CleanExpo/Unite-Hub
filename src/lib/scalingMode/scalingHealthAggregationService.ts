/**
 * Scaling Health Aggregation Service
 * Phase 86: Aggregate metrics into unified health inputs
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ScalingHealthInputs,
  ScalingHealthScores,
  ScalingModeConfig,
} from './scalingModeTypes';
import { getModeLimits } from './scalingModeConfigService';

/**
 * Collect all health inputs from various sources
 */
export async function collectHealthInputs(
  environment: string
): Promise<ScalingHealthInputs> {
  const supabase = await getSupabaseServer();
  const dataCompleteness: Record<string, boolean> = {};

  // Get active clients count
  const { count: activeClients } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'customer');

  dataCompleteness.active_clients = activeClients !== null;

  // Get today's posts count
  const today = new Date().toISOString().split('T')[0];
  const { count: postsToday } = await supabase
    .from('posting_attempts')
    .select('*', { count: 'exact', head: true })
    .gte('attempted_at', today)
    .in('status', ['published', 'draft_created']);

  dataCompleteness.posts_today = postsToday !== null;

  // Get active warnings
  const { data: warnings } = await supabase
    .from('early_warning_events')
    .select('severity')
    .eq('status', 'active');

  const activeWarnings = warnings?.length || 0;
  const highSeverityWarnings = warnings?.filter(
    w => w.severity === 'high' || w.severity === 'critical'
  ).length || 0;

  dataCompleteness.warnings = warnings !== null;

  // Get churn risk clients (contacts with low engagement)
  const { count: churnRiskClients } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'customer')
    .lt('ai_score', 40);

  dataCompleteness.churn_risk = churnRiskClients !== null;

  // Mock infrastructure metrics (in production, would come from monitoring)
  // These would be replaced with actual Prometheus/Datadog queries
  const cpuUtilisation = 45; // 0-100%
  const avgLatencyMs = 120; // milliseconds
  const errorRate = 0.02; // 0-1

  dataCompleteness.infra_metrics = true;

  // Mock AI spend (in production, would come from cost tracking)
  const aiSpendToday = 15; // USD

  dataCompleteness.ai_spend = true;

  return {
    active_clients: activeClients || 0,
    total_posts_today: postsToday || 0,
    ai_spend_today: aiSpendToday,
    cpu_utilisation: cpuUtilisation,
    avg_latency_ms: avgLatencyMs,
    error_rate: errorRate,
    active_warnings: activeWarnings,
    high_severity_warnings: highSeverityWarnings,
    churn_risk_clients: churnRiskClients || 0,
    data_completeness: dataCompleteness,
  };
}

/**
 * Compute health scores from inputs
 */
export function computeScores(
  inputs: ScalingHealthInputs,
  config: ScalingModeConfig
): ScalingHealthScores {
  const modeLimits = getModeLimits(config, config.current_mode);

  // Infrastructure health score (0-100)
  // Based on CPU, latency, and error rate
  let infraHealth = 100;

  // CPU penalty
  if (inputs.cpu_utilisation > 80) {
    infraHealth -= 40;
  } else if (inputs.cpu_utilisation > 60) {
    infraHealth -= 20;
  } else if (inputs.cpu_utilisation > 40) {
    infraHealth -= 5;
  }

  // Latency penalty
  if (inputs.avg_latency_ms > 500) {
    infraHealth -= 30;
  } else if (inputs.avg_latency_ms > 300) {
    infraHealth -= 15;
  } else if (inputs.avg_latency_ms > 200) {
    infraHealth -= 5;
  }

  // Error rate penalty
  if (inputs.error_rate > 0.1) {
    infraHealth -= 30;
  } else if (inputs.error_rate > 0.05) {
    infraHealth -= 15;
  } else if (inputs.error_rate > 0.02) {
    infraHealth -= 5;
  }

  infraHealth = Math.max(0, infraHealth);

  // AI cost pressure score (0-100, higher = more pressure)
  const aiSpendRatio = inputs.ai_spend_today / modeLimits.max_ai_spend_daily;
  const aiCostPressure = Math.min(100, aiSpendRatio * 100);

  // Warning density score (0-100, higher = more warnings)
  const warningDensity = inputs.active_clients > 0
    ? Math.min(100, (inputs.active_warnings / inputs.active_clients) * 200)
    : 0;

  // Churn risk score (0-100, higher = more risk)
  const churnRisk = inputs.active_clients > 0
    ? Math.min(100, (inputs.churn_risk_clients / inputs.active_clients) * 100)
    : 0;

  // Overall scaling health score
  // Weighted average where infra is positive, others are inverted
  const overallHealth = (
    infraHealth * 0.30 +
    (100 - aiCostPressure) * 0.25 +
    (100 - warningDensity) * 0.25 +
    (100 - churnRisk) * 0.20
  );

  return {
    infra_health_score: Math.round(infraHealth * 100) / 100,
    ai_cost_pressure_score: Math.round(aiCostPressure * 100) / 100,
    warning_density_score: Math.round(warningDensity * 100) / 100,
    churn_risk_score: Math.round(churnRisk * 100) / 100,
    overall_scaling_health_score: Math.round(overallHealth * 100) / 100,
  };
}

/**
 * Calculate safe capacity based on current mode
 */
export function calculateSafeCapacity(
  config: ScalingModeConfig,
  scores: ScalingHealthScores
): number {
  const modeLimits = getModeLimits(config, config.current_mode);
  const maxClients = modeLimits.max_clients;

  // Reduce capacity if health is poor
  const healthMultiplier = scores.overall_scaling_health_score / 100;

  // Never go below 50% of max capacity
  const safeCapacity = Math.max(
    Math.floor(maxClients * 0.5),
    Math.floor(maxClients * healthMultiplier)
  );

  return safeCapacity;
}

/**
 * Calculate data completeness confidence
 */
export function calculateConfidence(
  dataCompleteness: Record<string, boolean>
): number {
  const keys = Object.keys(dataCompleteness);
  if (keys.length === 0) return 0;

  const completedCount = Object.values(dataCompleteness).filter(Boolean).length;
  return Math.round((completedCount / keys.length) * 100) / 100;
}
