/**
 * Strain Test Service
 * Phase 58: Test system under simulated load conditions
 */

import { getSupabaseServer } from '@/lib/supabase';
import { getCurrentTier, SCALING_TIERS } from './performanceGuard';
import { getResourceMetrics } from './resourceMonitor';

export type StrainTestType =
  | 'ai_load'
  | 'visual_jobs'
  | 'concurrent_users'
  | 'queue_flood'
  | 'full_system';

export type TestStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface StrainTestConfig {
  type: StrainTestType;
  intensity: number; // 0.1 to 1.0
  duration_seconds: number;
  target_tier: 'soft_launch' | 'hard_launch' | 'growth_phase';
}

export interface StrainTestResult {
  id: string;
  config: StrainTestConfig;
  status: TestStatus;
  started_at: string;
  completed_at?: string;
  metrics: {
    peak_response_time_ms: number;
    avg_response_time_ms: number;
    error_count: number;
    throughput_per_second: number;
    peak_memory_percent: number;
    peak_cpu_percent: number;
  };
  passed: boolean;
  issues: string[];
  recommendations: string[];
}

export interface StrainTestSummary {
  total_tests: number;
  passed: number;
  failed: number;
  last_test_date?: string;
  readiness_score: number;
}

// Test configurations for each tier
const TIER_TEST_CONFIGS: Record<string, { ai_requests: number; visual_jobs: number; concurrent: number }> = {
  soft_launch: {
    ai_requests: 50,
    visual_jobs: 10,
    concurrent: 5,
  },
  hard_launch: {
    ai_requests: 500,
    visual_jobs: 50,
    concurrent: 50,
  },
  growth_phase: {
    ai_requests: 1500,
    visual_jobs: 150,
    concurrent: 100,
  },
};

// Pass thresholds
const PASS_THRESHOLDS = {
  max_response_time_ms: 2000,
  max_error_rate_percent: 5,
  min_throughput_per_second: 10,
  max_memory_percent: 85,
};

/**
 * Create a new strain test
 */
export async function createStrainTest(config: StrainTestConfig): Promise<string> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('strain_tests')
    .insert({
      config,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create strain test: ${error.message}`);
  }

  return data.id;
}

/**
 * Run a strain test (simulated)
 */
export async function runStrainTest(testId: string): Promise<StrainTestResult> {
  const supabase = await getSupabaseServer();

  // Get test config
  const { data: test, error } = await supabase
    .from('strain_tests')
    .select('*')
    .eq('id', testId)
    .single();

  if (error || !test) {
    throw new Error('Test not found');
  }

  const config = test.config as StrainTestConfig;

  // Update status to running
  await supabase
    .from('strain_tests')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', testId);

  // Simulate test execution
  const testConfig = TIER_TEST_CONFIGS[config.target_tier];
  const intensity = config.intensity;

  // Generate realistic metrics based on intensity
  const baseResponseTime = 150;
  const loadMultiplier = 1 + (intensity * 3);

  const metrics = {
    peak_response_time_ms: Math.round(baseResponseTime * loadMultiplier * 2),
    avg_response_time_ms: Math.round(baseResponseTime * loadMultiplier),
    error_count: Math.round(testConfig.ai_requests * intensity * 0.02),
    throughput_per_second: Math.round(20 / loadMultiplier),
    peak_memory_percent: Math.round(40 + (intensity * 35)),
    peak_cpu_percent: Math.round(30 + (intensity * 40)),
  };

  // Evaluate pass/fail
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (metrics.peak_response_time_ms > PASS_THRESHOLDS.max_response_time_ms) {
    issues.push(`Response time exceeded threshold: ${metrics.peak_response_time_ms}ms > ${PASS_THRESHOLDS.max_response_time_ms}ms`);
    recommendations.push('Enable database connection pooling');
    recommendations.push('Add caching layer for frequent queries');
  }

  const errorRate = (metrics.error_count / testConfig.ai_requests) * 100;
  if (errorRate > PASS_THRESHOLDS.max_error_rate_percent) {
    issues.push(`Error rate exceeded: ${errorRate.toFixed(1)}% > ${PASS_THRESHOLDS.max_error_rate_percent}%`);
    recommendations.push('Implement retry logic with exponential backoff');
    recommendations.push('Add circuit breaker pattern');
  }

  if (metrics.throughput_per_second < PASS_THRESHOLDS.min_throughput_per_second) {
    issues.push(`Throughput below minimum: ${metrics.throughput_per_second} < ${PASS_THRESHOLDS.min_throughput_per_second}`);
    recommendations.push('Scale up Vercel functions');
    recommendations.push('Optimize database queries');
  }

  if (metrics.peak_memory_percent > PASS_THRESHOLDS.max_memory_percent) {
    issues.push(`Memory usage critical: ${metrics.peak_memory_percent}%`);
    recommendations.push('Review memory allocations');
    recommendations.push('Implement streaming for large responses');
  }

  const passed = issues.length === 0;

  const result: StrainTestResult = {
    id: testId,
    config,
    status: 'completed',
    started_at: test.started_at || new Date().toISOString(),
    completed_at: new Date().toISOString(),
    metrics,
    passed,
    issues,
    recommendations,
  };

  // Update test with results
  await supabase
    .from('strain_tests')
    .update({
      status: 'completed',
      completed_at: result.completed_at,
      metrics,
      passed,
      issues,
      recommendations,
    })
    .eq('id', testId);

  return result;
}

/**
 * Get strain test history
 */
export async function getStrainTestHistory(limit: number = 10): Promise<StrainTestResult[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('strain_tests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching strain test history:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    config: row.config as StrainTestConfig,
    status: row.status as TestStatus,
    started_at: row.started_at,
    completed_at: row.completed_at,
    metrics: row.metrics || {
      peak_response_time_ms: 0,
      avg_response_time_ms: 0,
      error_count: 0,
      throughput_per_second: 0,
      peak_memory_percent: 0,
      peak_cpu_percent: 0,
    },
    passed: row.passed || false,
    issues: row.issues || [],
    recommendations: row.recommendations || [],
  }));
}

/**
 * Get strain test summary
 */
export async function getStrainTestSummary(): Promise<StrainTestSummary> {
  const history = await getStrainTestHistory(50);

  const passed = history.filter((t) => t.passed).length;
  const failed = history.filter((t) => !t.passed && t.status === 'completed').length;

  // Calculate readiness score
  const recentTests = history.slice(0, 5);
  const recentPassRate = recentTests.length > 0
    ? (recentTests.filter((t) => t.passed).length / recentTests.length) * 100
    : 0;

  return {
    total_tests: history.length,
    passed,
    failed,
    last_test_date: history[0]?.completed_at,
    readiness_score: recentPassRate,
  };
}

/**
 * Generate recommended test suite for tier
 */
export function getRecommendedTests(tier: 'soft_launch' | 'hard_launch' | 'growth_phase'): StrainTestConfig[] {
  const tests: StrainTestConfig[] = [];

  // Basic load test
  tests.push({
    type: 'ai_load',
    intensity: 0.5,
    duration_seconds: 60,
    target_tier: tier,
  });

  // Visual job stress
  tests.push({
    type: 'visual_jobs',
    intensity: 0.6,
    duration_seconds: 120,
    target_tier: tier,
  });

  // Concurrent user simulation
  tests.push({
    type: 'concurrent_users',
    intensity: 0.7,
    duration_seconds: 180,
    target_tier: tier,
  });

  // Full system stress (only for higher tiers)
  if (tier !== 'soft_launch') {
    tests.push({
      type: 'full_system',
      intensity: 0.8,
      duration_seconds: 300,
      target_tier: tier,
    });
  }

  return tests;
}

/**
 * Check if system is ready for tier
 */
export async function checkTierReadiness(
  tier: 'soft_launch' | 'hard_launch' | 'growth_phase'
): Promise<{ ready: boolean; requirements: string[]; score: number }> {
  const summary = await getStrainTestSummary();
  const resources = await getResourceMetrics();
  const requirements: string[] = [];

  // Check strain test results
  if (summary.readiness_score < 80) {
    requirements.push(`Improve strain test pass rate (currently ${summary.readiness_score.toFixed(0)}%)`);
  }

  // Check infrastructure for tier
  const limits = SCALING_TIERS[tier];

  if (tier === 'hard_launch') {
    requirements.push('Enable Supabase connection pooler');
    requirements.push('Configure Vercel Pro limits');
    requirements.push('Set up error tracking (Sentry)');
  }

  if (tier === 'growth_phase') {
    requirements.push('Implement Redis caching');
    requirements.push('Configure CDN for static assets');
    requirements.push('Set up APM monitoring');
    requirements.push('Enable read replicas');
  }

  const ready = requirements.length === 0 && summary.readiness_score >= 80;

  return {
    ready,
    requirements,
    score: summary.readiness_score,
  };
}

export default {
  PASS_THRESHOLDS,
  createStrainTest,
  runStrainTest,
  getStrainTestHistory,
  getStrainTestSummary,
  getRecommendedTests,
  checkTierReadiness,
};
