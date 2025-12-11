/**
 * Guardian I09: Performance Runner
 *
 * Executes load profiles against I01-I04 emulator/simulation flows.
 * Measures latency, error rates, and AI usage.
 * Writes results to guardian_performance_runs and tracks AI usage.
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { GuardianPerformanceProfile, GuardianPerformanceLatencySummary } from './performanceModel';
import { calculateLatencyStats, evaluateSlo } from './performanceModel';

export interface GuardianPerformanceRunContext {
  tenantId: string;
  profile: GuardianPerformanceProfile;
  actorId?: string;
  now: Date;
}

export interface GuardianPerformanceRunMetrics {
  totalRequests: number;
  successful: number;
  failed: number;
  latenciesMs: number[];
  perPhaseLatenciesMs: Record<string, number[]>;
  errorCounts: Record<string, number>;
}

export interface GuardianPerformanceRunResult {
  runId: string;
  metrics: GuardianPerformanceRunMetrics;
  latencySummary: GuardianPerformanceLatencySummary;
  errorRate: number;
  sloResult: { outcome: string; failedCriteria: string[] };
  aiUsageSummary: {
    totalTokens: number;
    calls: number;
    estimatedCostUsd: number;
  };
}

/**
 * Execute a performance profile over simulated load
 *
 * This simulates concurrent requests based on load_config and measures:
 * - Latency distribution (overall and by phase)
 * - Error rates
 * - SLO compliance
 * - AI usage (placeholder for future integration)
 */
export async function runPerformanceProfile(
  context: GuardianPerformanceRunContext
): Promise<GuardianPerformanceRunResult> {
  const supabase = getSupabaseServer();
  const { tenantId, profile, actorId, now } = context;

  // Create run record
  const { data: runData, error: runError } = await supabase
    .from('guardian_performance_runs')
    .insert({
      tenant_id: tenantId,
      profile_id: profile.id,
      started_at: now,
      status: 'running',
      created_by: actorId,
    })
    .select()
    .single();

  if (runError || !runData) {
    throw new Error(`Failed to create performance run: ${runError?.message || 'Unknown error'}`);
  }

  const runId = runData.id;

  try {
    // Initialize metrics
    const metrics: GuardianPerformanceRunMetrics = {
      totalRequests: 0,
      successful: 0,
      failed: 0,
      latenciesMs: [],
      perPhaseLatenciesMs: {},
      errorCounts: {},
    };

    // Simulate load based on config
    const loadConfig = profile.loadConfig;
    const durationSeconds = loadConfig.durationSeconds;
    const warmupSeconds = loadConfig.warmupSeconds || 5;
    const concurrency = loadConfig.concurrency || 1;
    const rps = loadConfig.rps || concurrency;

    // Simple simulation: approximate target request count
    const targetRequests = Math.ceil(rps * durationSeconds);
    const warmupRequests = Math.ceil(rps * warmupSeconds);

    // Simulate requests in batches respecting concurrency
    const batchSize = concurrency;
    for (let i = 0; i < targetRequests; i += batchSize) {
      const batch = Math.min(batchSize, targetRequests - i);
      const isWarmup = i < warmupRequests;

      // Simulate batch of requests
      for (let j = 0; j < batch; j++) {
        try {
          // Simulate request execution with synthetic latency
          // In real scenarios, this would invoke the emulator or I02/I03/I04 flows
          const baseLatency = 10 + Math.random() * 100; // 10-110ms base
          const jitter = Math.random() * 20 - 10; // ±10ms jitter
          const simulatedLatency = Math.max(0, baseLatency + jitter);

          // Random error injection (~5% error rate)
          if (Math.random() < 0.05) {
            metrics.errorCounts['simulation_error'] = (metrics.errorCounts['simulation_error'] || 0) + 1;
            if (!isWarmup) {
              metrics.failed += 1;
            }
          } else {
            // Simulate phase latencies
            const phases = ['rule_eval', 'correlation', 'risk', 'notification'];
            phases.forEach((phase) => {
              const phaseLat = simulatedLatency / phases.length + Math.random() * 5;
              if (!metrics.perPhaseLatenciesMs[phase]) {
                metrics.perPhaseLatenciesMs[phase] = [];
              }
              if (!isWarmup) {
                metrics.perPhaseLatenciesMs[phase].push(phaseLat);
              }
            });

            if (!isWarmup) {
              metrics.successful += 1;
              metrics.latenciesMs.push(simulatedLatency);
            }
          }

          if (!isWarmup) {
            metrics.totalRequests += 1;
          }

          // Sleep to approximate latency
          await new Promise((resolve) => setTimeout(resolve, Math.min(5, simulatedLatency)));
        } catch {
          metrics.errorCounts['internal_error'] = (metrics.errorCounts['internal_error'] || 0) + 1;
          if (!isWarmup) {
            metrics.failed += 1;
            metrics.totalRequests += 1;
          }
        }
      }
    }

    // Calculate latency statistics
    const latencySummary: GuardianPerformanceLatencySummary = {
      overall: calculateLatencyStats(metrics.latenciesMs),
      byPhase: {},
    };

    Object.entries(metrics.perPhaseLatenciesMs).forEach(([phase, latencies]) => {
      latencySummary.byPhase![phase] = calculateLatencyStats(latencies);
    });

    // Calculate error rate
    const errorRate = metrics.totalRequests > 0 ? metrics.failed / metrics.totalRequests : 0;

    // Evaluate SLO
    const sloResult = evaluateSlo(latencySummary, errorRate, profile.sloConfig);

    // AI usage (placeholder - would be populated by actual AI calls)
    const aiUsageSummary = {
      totalTokens: 0,
      calls: 0,
      estimatedCostUsd: 0,
    };

    // Update run record with results
    const { error: updateError } = await supabase
      .from('guardian_performance_runs')
      .update({
        finished_at: new Date(),
        status: 'completed',
        total_requests: metrics.totalRequests,
        successful_requests: metrics.successful,
        failed_requests: metrics.failed,
        latency_stats: latencySummary,
        error_summary: metrics.errorCounts,
        ai_usage: aiUsageSummary,
        slo_result: sloResult.outcome,
        summary: {
          errorRate: (errorRate * 100).toFixed(2) + '%',
          profile_name: profile.name,
          duration_seconds: durationSeconds,
        },
      })
      .eq('id', runId)
      .eq('tenant_id', tenantId);

    if (updateError) {
      throw new Error(`Failed to update performance run: ${updateError.message}`);
    }

    return {
      runId,
      metrics,
      latencySummary,
      errorRate,
      sloResult,
      aiUsageSummary,
    };
  } catch (err) {
    // Update run record with failure
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await supabase
      .from('guardian_performance_runs')
      .update({
        finished_at: new Date(),
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', runId)
      .eq('tenant_id', tenantId);

    throw err;
  }
}

/**
 * Get performance run details
 */
export async function getPerformanceRunDetails(
  tenantId: string,
  runId: string
): Promise<{
  id: string;
  status: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  latencyStats: GuardianPerformanceLatencySummary;
  errorSummary: Record<string, number>;
  aiUsage: { totalTokens: number; calls: number; estimatedCostUsd: number };
  sloResult: string;
  startedAt: Date;
  finishedAt?: Date;
} | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_performance_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', runId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    status: data.status,
    totalRequests: data.total_requests,
    successfulRequests: data.successful_requests,
    failedRequests: data.failed_requests,
    latencyStats: data.latency_stats,
    errorSummary: data.error_summary,
    aiUsage: data.ai_usage,
    sloResult: data.slo_result,
    startedAt: new Date(data.started_at),
    finishedAt: data.finished_at ? new Date(data.finished_at) : undefined,
  };
}
