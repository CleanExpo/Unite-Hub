/**
 * Guardian I09: Performance Model
 *
 * Defines load profiles, SLO configurations, and SLO evaluation logic.
 * Purely computational — no database writes.
 */

export type ProfileType = 'burst' | 'steady' | 'spikey' | 'custom';
export type TargetEntityType = 'scenario' | 'regression_pack' | 'pipeline_phase';
export type LoadPattern = 'burst' | 'steady' | 'spikey';
export type SloOutcome = 'pass' | 'fail' | 'inconclusive';
export type BudgetState = 'ok' | 'warning' | 'exceeded';

export interface GuardianLoadConfig {
  rps?: number; // Requests per second
  concurrency?: number; // Max concurrent requests
  durationSeconds: number; // Total duration
  warmupSeconds?: number; // Warmup period before measurement
  pattern?: LoadPattern; // Load pattern type
}

export interface GuardianSloConfig {
  p95Ms?: number; // 95th percentile latency threshold (ms)
  maxMs?: number; // Max latency threshold (ms)
  errorRate?: number; // Max acceptable error rate (0-1)
}

export interface GuardianAiBudget {
  maxTokens?: number;
  maxCostUsd?: number;
}

export interface GuardianPerformanceProfile {
  id: string;
  name: string;
  profileType: ProfileType;
  targetEntityType: TargetEntityType;
  targetEntityId?: string;
  loadConfig: GuardianLoadConfig;
  sloConfig: GuardianSloConfig;
  aiBudget?: GuardianAiBudget;
}

export interface GuardianLatencyStats {
  p50: number;
  p95: number;
  max: number;
}

export interface GuardianPerformanceLatencySummary {
  overall: GuardianLatencyStats;
  byPhase?: Record<string, GuardianLatencyStats>;
}

export interface GuardianSloResult {
  outcome: SloOutcome;
  failedCriteria: string[];
}

/**
 * Calculate latency percentile from sorted latencies
 */
function calculatePercentile(latencies: number[], percentile: number): number {
  if (latencies.length === 0) {
return 0;
}
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Calculate latency statistics from raw latencies
 */
export function calculateLatencyStats(latencies: number[]): GuardianLatencyStats {
  if (latencies.length === 0) {
    return { p50: 0, p95: 0, max: 0 };
  }

  return {
    p50: calculatePercentile(latencies, 50),
    p95: calculatePercentile(latencies, 95),
    max: Math.max(...latencies),
  };
}

/**
 * Evaluate SLO against measured latency and error rate
 *
 * Returns:
 * - 'pass': All configured thresholds met
 * - 'fail': One or more thresholds exceeded
 * - 'inconclusive': Some thresholds missing/unavailable for comparison
 */
export function evaluateSlo(
  latencySummary: GuardianPerformanceLatencySummary,
  errorRate: number,
  sloConfig: GuardianSloConfig
): GuardianSloResult {
  const failedCriteria: string[] = [];
  let hasAllCriteria = true;

  // Check p95 threshold
  if (sloConfig.p95Ms !== undefined) {
    if (latencySummary.overall.p95 > sloConfig.p95Ms) {
      failedCriteria.push(`p95 latency ${latencySummary.overall.p95}ms exceeds threshold ${sloConfig.p95Ms}ms`);
    }
  } else {
    hasAllCriteria = false;
  }

  // Check max latency threshold
  if (sloConfig.maxMs !== undefined) {
    if (latencySummary.overall.max > sloConfig.maxMs) {
      failedCriteria.push(`max latency ${latencySummary.overall.max}ms exceeds threshold ${sloConfig.maxMs}ms`);
    }
  } else {
    hasAllCriteria = false;
  }

  // Check error rate threshold
  if (sloConfig.errorRate !== undefined) {
    if (errorRate > sloConfig.errorRate) {
      failedCriteria.push(`error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(sloConfig.errorRate * 100).toFixed(2)}%`);
    }
  } else {
    hasAllCriteria = false;
  }

  // Determine outcome
  let outcome: SloOutcome = 'inconclusive';
  if (failedCriteria.length > 0) {
    outcome = 'fail';
  } else if (hasAllCriteria) {
    outcome = 'pass';
  }

  return {
    outcome,
    failedCriteria,
  };
}

/**
 * Estimate cost for token usage
 * Based on Claude Sonnet 4.5 pricing (approximate)
 */
export function estimateCost(tokens: number): number {
  // Approximate: $3/$15 per 1M tokens (input/output at ~2:1 ratio)
  const avgRate = 3 / 1000000; // Conservative average
  return tokens * avgRate;
}

/**
 * Evaluate AI budget state based on usage
 */
export function evaluateAiBudgetState(
  usage: { totalTokens: number; estimatedCostUsd: number },
  budget?: GuardianAiBudget
): { state: BudgetState; reason?: string } {
  if (!budget) {
    return { state: 'ok' };
  }

  // Check token limit
  if (budget.maxTokens && usage.totalTokens > budget.maxTokens) {
    const percentage = ((usage.totalTokens / budget.maxTokens) * 100).toFixed(1);
    return { state: 'exceeded', reason: `${percentage}% of token budget used` };
  }

  // Check cost limit
  if (budget.maxCostUsd && usage.estimatedCostUsd > budget.maxCostUsd) {
    const percentage = ((usage.estimatedCostUsd / budget.maxCostUsd) * 100).toFixed(1);
    return { state: 'exceeded', reason: `${percentage}% of cost budget used` };
  }

  // Warning thresholds (80% of limits)
  const tokenWarningThreshold = budget.maxTokens ? 0.8 * budget.maxTokens : undefined;
  const costWarningThreshold = budget.maxCostUsd ? 0.8 * budget.maxCostUsd : undefined;

  if (tokenWarningThreshold && usage.totalTokens > tokenWarningThreshold) {
    return { state: 'warning', reason: `${(usage.totalTokens / budget.maxTokens! * 100).toFixed(1)}% of token budget used` };
  }

  if (costWarningThreshold && usage.estimatedCostUsd > costWarningThreshold) {
    return { state: 'warning', reason: `${(usage.estimatedCostUsd / budget.maxCostUsd! * 100).toFixed(1)}% of cost budget used` };
  }

  return { state: 'ok' };
}
