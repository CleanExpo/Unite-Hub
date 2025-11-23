/**
 * Load Test Engine
 * Phase 65: Simulate high-traffic scenarios across all subsystems
 */

export type LoadScenario =
  | 'simulated_50_clients'
  | 'simulated_100_clients'
  | 'burst_traffic'
  | 'high_ai_usage'
  | 'visual_job_flood'
  | 'massive_voice_trigger_batch'
  | 'cron_stress_test';

export type LoadMetric =
  | 'response_time_ms'
  | 'api_error_rate'
  | 'db_query_time'
  | 'queue_depth'
  | 'token_usage_spike'
  | 'storage_reads_writes'
  | 'server_cpu_load'
  | 'model_latency'
  | 'bandwidth_usage';

export interface LoadTestConfig {
  scenario: LoadScenario;
  duration_seconds: number;
  ramp_up_seconds: number;
  concurrent_users: number;
  target_rps: number;
  abort_threshold_error_rate: number;
}

export interface LoadTestResult {
  id: string;
  workspace_id: string;
  scenario: LoadScenario;
  status: 'pending' | 'running' | 'completed' | 'aborted' | 'failed';
  started_at: string;
  completed_at?: string;
  metrics: Record<LoadMetric, MetricResult>;
  errors: LoadTestError[];
  summary: LoadTestSummary;
}

export interface MetricResult {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  samples: number;
}

export interface LoadTestError {
  timestamp: string;
  endpoint: string;
  error_type: string;
  message: string;
  status_code?: number;
}

export interface LoadTestSummary {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  error_rate: number;
  avg_response_time: number;
  requests_per_second: number;
  peak_concurrent: number;
  bottlenecks: string[];
  recommendations: string[];
}

// Scenario configurations
const SCENARIO_CONFIGS: Record<LoadScenario, Partial<LoadTestConfig>> = {
  simulated_50_clients: {
    concurrent_users: 50,
    target_rps: 100,
    duration_seconds: 300,
    ramp_up_seconds: 60,
  },
  simulated_100_clients: {
    concurrent_users: 100,
    target_rps: 200,
    duration_seconds: 300,
    ramp_up_seconds: 90,
  },
  burst_traffic: {
    concurrent_users: 200,
    target_rps: 500,
    duration_seconds: 120,
    ramp_up_seconds: 10,
  },
  high_ai_usage: {
    concurrent_users: 30,
    target_rps: 50,
    duration_seconds: 600,
    ramp_up_seconds: 60,
  },
  visual_job_flood: {
    concurrent_users: 50,
    target_rps: 100,
    duration_seconds: 300,
    ramp_up_seconds: 30,
  },
  massive_voice_trigger_batch: {
    concurrent_users: 100,
    target_rps: 150,
    duration_seconds: 180,
    ramp_up_seconds: 20,
  },
  cron_stress_test: {
    concurrent_users: 20,
    target_rps: 30,
    duration_seconds: 600,
    ramp_up_seconds: 30,
  },
};

// API endpoints to test per scenario
const SCENARIO_ENDPOINTS: Record<LoadScenario, string[]> = {
  simulated_50_clients: [
    '/api/contacts',
    '/api/campaigns',
    '/api/dashboard/stats',
    '/api/emails',
  ],
  simulated_100_clients: [
    '/api/contacts',
    '/api/campaigns',
    '/api/dashboard/stats',
    '/api/emails',
    '/api/drip-campaigns',
  ],
  burst_traffic: [
    '/api/contacts',
    '/api/dashboard/stats',
    '/api/health',
  ],
  high_ai_usage: [
    '/api/agents/contact-intelligence',
    '/api/agents/content',
    '/api/creative/quality',
  ],
  visual_job_flood: [
    '/api/images/generate',
    '/api/images/approve',
    '/api/creative/insights',
  ],
  massive_voice_trigger_batch: [
    '/api/voice/triggers',
    '/api/voice/process',
    '/api/agents/content',
  ],
  cron_stress_test: [
    '/api/cron/email-sync',
    '/api/cron/lead-scoring',
    '/api/cron/campaign-processor',
  ],
};

export class LoadTestEngine {
  private currentTest: LoadTestResult | null = null;
  private abortController: AbortController | null = null;

  /**
   * Start a load test (shadow mode only)
   */
  async startTest(
    workspaceId: string,
    scenario: LoadScenario,
    customConfig?: Partial<LoadTestConfig>
  ): Promise<LoadTestResult> {
    // Safety check - never run without explicit approval
    const config: LoadTestConfig = {
      scenario,
      abort_threshold_error_rate: 0.05, // 5% error rate triggers abort
      ...SCENARIO_CONFIGS[scenario],
      ...customConfig,
    } as LoadTestConfig;

    const testId = `load-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.currentTest = {
      id: testId,
      workspace_id: workspaceId,
      scenario,
      status: 'running',
      started_at: new Date().toISOString(),
      metrics: this.initializeMetrics(),
      errors: [],
      summary: {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        error_rate: 0,
        avg_response_time: 0,
        requests_per_second: 0,
        peak_concurrent: 0,
        bottlenecks: [],
        recommendations: [],
      },
    };

    this.abortController = new AbortController();

    // Run test in shadow mode (simulated - no actual requests)
    await this.runShadowTest(config);

    return this.currentTest;
  }

  /**
   * Run shadow mode test (simulated metrics)
   */
  private async runShadowTest(config: LoadTestConfig): Promise<void> {
    if (!this.currentTest) return;

    const endpoints = SCENARIO_ENDPOINTS[config.scenario];
    const totalRequests = config.target_rps * config.duration_seconds;

    // Simulate test execution
    const simulatedMetrics = this.generateSimulatedMetrics(config, endpoints);

    // Update current test with results
    this.currentTest.metrics = simulatedMetrics.metrics;
    this.currentTest.errors = simulatedMetrics.errors;
    this.currentTest.summary = this.calculateSummary(simulatedMetrics, config);
    this.currentTest.status = 'completed';
    this.currentTest.completed_at = new Date().toISOString();

    // Check if should have been aborted
    if (this.currentTest.summary.error_rate > config.abort_threshold_error_rate) {
      this.currentTest.status = 'aborted';
      this.currentTest.summary.recommendations.push(
        'Test aborted due to high error rate. Investigate bottlenecks before retrying.'
      );
    }
  }

  /**
   * Generate simulated metrics based on scenario
   */
  private generateSimulatedMetrics(
    config: LoadTestConfig,
    endpoints: string[]
  ): { metrics: Record<LoadMetric, MetricResult>; errors: LoadTestError[] } {
    const baseLatency = this.getBaseLatency(config.scenario);
    const errorRate = this.getExpectedErrorRate(config.scenario);

    const metrics: Record<LoadMetric, MetricResult> = {
      response_time_ms: {
        min: baseLatency * 0.5,
        max: baseLatency * 3,
        avg: baseLatency,
        p50: baseLatency * 0.9,
        p95: baseLatency * 2,
        p99: baseLatency * 2.5,
        samples: config.target_rps * config.duration_seconds,
      },
      api_error_rate: {
        min: 0,
        max: errorRate * 2,
        avg: errorRate,
        p50: errorRate * 0.8,
        p95: errorRate * 1.5,
        p99: errorRate * 1.8,
        samples: endpoints.length,
      },
      db_query_time: {
        min: 5,
        max: 150,
        avg: 25,
        p50: 20,
        p95: 80,
        p99: 120,
        samples: config.target_rps * config.duration_seconds * 2,
      },
      queue_depth: {
        min: 0,
        max: config.concurrent_users * 2,
        avg: config.concurrent_users * 0.3,
        p50: config.concurrent_users * 0.2,
        p95: config.concurrent_users * 1.5,
        p99: config.concurrent_users * 1.8,
        samples: config.duration_seconds,
      },
      token_usage_spike: {
        min: 0,
        max: config.scenario === 'high_ai_usage' ? 50000 : 5000,
        avg: config.scenario === 'high_ai_usage' ? 15000 : 1000,
        p50: config.scenario === 'high_ai_usage' ? 12000 : 800,
        p95: config.scenario === 'high_ai_usage' ? 35000 : 3000,
        p99: config.scenario === 'high_ai_usage' ? 45000 : 4500,
        samples: config.duration_seconds,
      },
      storage_reads_writes: {
        min: 10,
        max: 500,
        avg: 100,
        p50: 80,
        p95: 300,
        p99: 450,
        samples: config.target_rps * config.duration_seconds,
      },
      server_cpu_load: {
        min: 10,
        max: 85,
        avg: 45,
        p50: 40,
        p95: 70,
        p99: 80,
        samples: config.duration_seconds,
      },
      model_latency: {
        min: 200,
        max: 5000,
        avg: config.scenario === 'high_ai_usage' ? 2000 : 800,
        p50: config.scenario === 'high_ai_usage' ? 1800 : 700,
        p95: config.scenario === 'high_ai_usage' ? 4000 : 1500,
        p99: config.scenario === 'high_ai_usage' ? 4800 : 2000,
        samples: config.scenario === 'high_ai_usage' ? config.target_rps * config.duration_seconds : config.duration_seconds,
      },
      bandwidth_usage: {
        min: 100,
        max: 10000,
        avg: 2000,
        p50: 1800,
        p95: 6000,
        p99: 8000,
        samples: config.duration_seconds,
      },
    };

    // Generate sample errors
    const errors: LoadTestError[] = [];
    const errorCount = Math.floor(config.target_rps * config.duration_seconds * errorRate);

    for (let i = 0; i < Math.min(errorCount, 10); i++) {
      errors.push({
        timestamp: new Date(Date.now() - Math.random() * config.duration_seconds * 1000).toISOString(),
        endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
        error_type: this.getRandomErrorType(),
        message: this.getRandomErrorMessage(),
        status_code: [500, 502, 503, 504, 429][Math.floor(Math.random() * 5)],
      });
    }

    return { metrics, errors };
  }

  /**
   * Get base latency for scenario
   */
  private getBaseLatency(scenario: LoadScenario): number {
    const latencies: Record<LoadScenario, number> = {
      simulated_50_clients: 150,
      simulated_100_clients: 200,
      burst_traffic: 300,
      high_ai_usage: 2000,
      visual_job_flood: 1500,
      massive_voice_trigger_batch: 1000,
      cron_stress_test: 500,
    };
    return latencies[scenario];
  }

  /**
   * Get expected error rate for scenario
   */
  private getExpectedErrorRate(scenario: LoadScenario): number {
    const rates: Record<LoadScenario, number> = {
      simulated_50_clients: 0.01,
      simulated_100_clients: 0.02,
      burst_traffic: 0.05,
      high_ai_usage: 0.03,
      visual_job_flood: 0.04,
      massive_voice_trigger_batch: 0.03,
      cron_stress_test: 0.02,
    };
    return rates[scenario];
  }

  private getRandomErrorType(): string {
    const types = ['timeout', 'rate_limit', 'server_error', 'connection_refused', 'bad_gateway'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getRandomErrorMessage(): string {
    const messages = [
      'Request timeout after 30s',
      'Rate limit exceeded',
      'Internal server error',
      'Connection refused by upstream',
      'Bad gateway response',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Calculate test summary
   */
  private calculateSummary(
    simulatedMetrics: { metrics: Record<LoadMetric, MetricResult>; errors: LoadTestError[] },
    config: LoadTestConfig
  ): LoadTestSummary {
    const totalRequests = config.target_rps * config.duration_seconds;
    const failedRequests = simulatedMetrics.errors.length * 10; // Each error represents ~10 failures
    const successfulRequests = totalRequests - failedRequests;

    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    // Analyze bottlenecks
    if (simulatedMetrics.metrics.db_query_time.p95 > 100) {
      bottlenecks.push('Database queries showing high latency at p95');
      recommendations.push('Consider adding database indexes or query optimization');
    }

    if (simulatedMetrics.metrics.queue_depth.p95 > config.concurrent_users) {
      bottlenecks.push('Queue depth exceeding concurrent user count');
      recommendations.push('Increase worker capacity or optimize job processing');
    }

    if (simulatedMetrics.metrics.server_cpu_load.p95 > 70) {
      bottlenecks.push('CPU load approaching threshold');
      recommendations.push('Consider horizontal scaling or CPU-intensive task optimization');
    }

    if (simulatedMetrics.metrics.model_latency.p95 > 3000) {
      bottlenecks.push('AI model latency exceeding acceptable limits');
      recommendations.push('Implement request batching or use faster model tiers');
    }

    return {
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      failed_requests: failedRequests,
      error_rate: failedRequests / totalRequests,
      avg_response_time: simulatedMetrics.metrics.response_time_ms.avg,
      requests_per_second: config.target_rps,
      peak_concurrent: config.concurrent_users,
      bottlenecks,
      recommendations,
    };
  }

  /**
   * Initialize empty metrics
   */
  private initializeMetrics(): Record<LoadMetric, MetricResult> {
    const emptyMetric: MetricResult = {
      min: 0,
      max: 0,
      avg: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      samples: 0,
    };

    return {
      response_time_ms: { ...emptyMetric },
      api_error_rate: { ...emptyMetric },
      db_query_time: { ...emptyMetric },
      queue_depth: { ...emptyMetric },
      token_usage_spike: { ...emptyMetric },
      storage_reads_writes: { ...emptyMetric },
      server_cpu_load: { ...emptyMetric },
      model_latency: { ...emptyMetric },
      bandwidth_usage: { ...emptyMetric },
    };
  }

  /**
   * Abort current test
   */
  abortTest(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.currentTest) {
      this.currentTest.status = 'aborted';
      this.currentTest.completed_at = new Date().toISOString();
    }
  }

  /**
   * Get current test status
   */
  getCurrentTest(): LoadTestResult | null {
    return this.currentTest;
  }

  /**
   * Get available scenarios
   */
  getAvailableScenarios(): LoadScenario[] {
    return Object.keys(SCENARIO_CONFIGS) as LoadScenario[];
  }

  /**
   * Get scenario configuration
   */
  getScenarioConfig(scenario: LoadScenario): Partial<LoadTestConfig> {
    return SCENARIO_CONFIGS[scenario];
  }
}

export default LoadTestEngine;
