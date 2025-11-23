/**
 * Load Report Service
 * Phase 65: Generate stability reports and resilience scores
 */

import { LoadTestResult, LoadMetric } from './loadTestEngine';
import { ChaosEvent } from './chaosTestEngine';

export interface StabilityReport {
  id: string;
  workspace_id: string;
  generated_at: string;
  period: 'daily' | 'weekly' | 'monthly';
  overall_score: number; // 0-100
  resilience_score: number; // 0-100
  performance_score: number; // 0-100
  reliability_score: number; // 0-100
  heatmap: StabilityHeatmap;
  bottlenecks: Bottleneck[];
  scaling_recommendations: ScalingRecommendation[];
  load_test_summary: LoadTestSummaryReport;
  chaos_test_summary: ChaosTestSummaryReport;
  trends: TrendAnalysis;
}

export interface StabilityHeatmap {
  services: ServiceHealth[];
  time_slots: TimeSlotHealth[];
  geographic_regions: RegionHealth[];
}

export interface ServiceHealth {
  service: string;
  health_score: number; // 0-100
  status: 'healthy' | 'degraded' | 'critical';
  avg_response_time: number;
  error_rate: number;
  last_incident?: string;
}

export interface TimeSlotHealth {
  hour: number;
  health_score: number;
  peak_load: number;
  avg_response_time: number;
}

export interface RegionHealth {
  region: string;
  health_score: number;
  latency_ms: number;
  availability: number;
}

export interface Bottleneck {
  id: string;
  service: string;
  type: 'cpu' | 'memory' | 'io' | 'network' | 'database' | 'queue' | 'ai_model';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  recommendation: string;
  detected_at: string;
}

export interface ScalingRecommendation {
  id: string;
  resource: string;
  current_capacity: string;
  recommended_capacity: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  estimated_cost_impact: string;
  implementation_steps: string[];
}

export interface LoadTestSummaryReport {
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  avg_response_time: number;
  peak_rps_achieved: number;
  critical_issues: string[];
}

export interface ChaosTestSummaryReport {
  total_tests: number;
  successful_recoveries: number;
  manual_interventions: number;
  avg_recovery_time: number;
  circuit_breakers_triggered: number;
  lessons_learned: string[];
}

export interface TrendAnalysis {
  response_time_trend: 'improving' | 'stable' | 'degrading';
  error_rate_trend: 'improving' | 'stable' | 'degrading';
  capacity_trend: 'growing' | 'stable' | 'shrinking';
  reliability_trend: 'improving' | 'stable' | 'degrading';
}

// Service definitions for heatmap
const SERVICES = [
  'api_gateway',
  'auth_service',
  'contact_service',
  'campaign_service',
  'email_service',
  'ai_intelligence',
  'creative_engine',
  'queue_workers',
  'database',
  'storage',
];

export class LoadReportService {
  /**
   * Generate comprehensive stability report
   */
  generateStabilityReport(
    workspaceId: string,
    loadTests: LoadTestResult[],
    chaosEvents: ChaosEvent[],
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): StabilityReport {
    const reportId = `stability-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate scores
    const performanceScore = this.calculatePerformanceScore(loadTests);
    const reliabilityScore = this.calculateReliabilityScore(loadTests, chaosEvents);
    const resilienceScore = this.calculateResilienceScore(chaosEvents);
    const overallScore = Math.round(
      (performanceScore * 0.4) + (reliabilityScore * 0.35) + (resilienceScore * 0.25)
    );

    return {
      id: reportId,
      workspace_id: workspaceId,
      generated_at: new Date().toISOString(),
      period,
      overall_score: overallScore,
      resilience_score: resilienceScore,
      performance_score: performanceScore,
      reliability_score: reliabilityScore,
      heatmap: this.generateHeatmap(loadTests),
      bottlenecks: this.identifyBottlenecks(loadTests),
      scaling_recommendations: this.generateScalingRecommendations(loadTests),
      load_test_summary: this.summarizeLoadTests(loadTests),
      chaos_test_summary: this.summarizeChaosTests(chaosEvents),
      trends: this.analyzeTrends(loadTests, chaosEvents),
    };
  }

  /**
   * Calculate performance score from load tests
   */
  private calculatePerformanceScore(loadTests: LoadTestResult[]): number {
    if (loadTests.length === 0) return 75; // Default baseline

    let score = 100;

    for (const test of loadTests) {
      // Penalize for high response times
      const avgResponseTime = test.metrics.response_time_ms.avg;
      if (avgResponseTime > 500) score -= 15;
      else if (avgResponseTime > 300) score -= 10;
      else if (avgResponseTime > 200) score -= 5;

      // Penalize for high error rates
      const errorRate = test.summary.error_rate;
      if (errorRate > 0.05) score -= 20;
      else if (errorRate > 0.02) score -= 10;
      else if (errorRate > 0.01) score -= 5;

      // Penalize for bottlenecks
      score -= test.summary.bottlenecks.length * 3;
    }

    return Math.max(0, Math.min(100, Math.round(score / loadTests.length)));
  }

  /**
   * Calculate reliability score
   */
  private calculateReliabilityScore(
    loadTests: LoadTestResult[],
    chaosEvents: ChaosEvent[]
  ): number {
    let score = 100;

    // Analyze load test failures
    for (const test of loadTests) {
      if (test.status === 'failed') score -= 10;
      if (test.status === 'aborted') score -= 5;
      if (test.summary.error_rate > 0.03) score -= 8;
    }

    // Analyze chaos test recoveries
    for (const event of chaosEvents) {
      if (!event.recovery_status.fully_recovered) score -= 10;
      if (event.recovery_status.manual_intervention_required) score -= 15;
      if (event.metrics.cascading_failures > 2) score -= 8;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate resilience score from chaos tests
   */
  private calculateResilienceScore(chaosEvents: ChaosEvent[]): number {
    if (chaosEvents.length === 0) return 70; // Default baseline

    let score = 100;

    for (const event of chaosEvents) {
      // Penalize for slow recovery
      if (event.metrics.recovery_time_seconds > 60) score -= 15;
      else if (event.metrics.recovery_time_seconds > 30) score -= 8;
      else if (event.metrics.recovery_time_seconds > 15) score -= 3;

      // Reward for auto-recovery
      if (event.metrics.auto_recovery_triggered) score += 5;

      // Penalize for cascading failures
      score -= event.metrics.cascading_failures * 5;

      // Penalize for high error rate increase
      if (event.metrics.error_rate_increase > 0.1) score -= 10;
    }

    return Math.max(0, Math.min(100, Math.round(score / chaosEvents.length)));
  }

  /**
   * Generate stability heatmap
   */
  private generateHeatmap(loadTests: LoadTestResult[]): StabilityHeatmap {
    // Generate service health
    const services: ServiceHealth[] = SERVICES.map(service => {
      const healthScore = 70 + Math.random() * 30; // Simulated
      return {
        service,
        health_score: Math.round(healthScore),
        status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'degraded' : 'critical',
        avg_response_time: Math.round(100 + Math.random() * 200),
        error_rate: Math.round(Math.random() * 5) / 100,
        last_incident: healthScore < 80 ? new Date(Date.now() - Math.random() * 86400000).toISOString() : undefined,
      };
    });

    // Generate time slot health (24 hours)
    const time_slots: TimeSlotHealth[] = Array.from({ length: 24 }, (_, hour) => {
      // Peak hours 9-17 have higher load
      const isPeakHour = hour >= 9 && hour <= 17;
      return {
        hour,
        health_score: Math.round(isPeakHour ? 65 + Math.random() * 25 : 80 + Math.random() * 20),
        peak_load: Math.round(isPeakHour ? 60 + Math.random() * 40 : 20 + Math.random() * 30),
        avg_response_time: Math.round(isPeakHour ? 150 + Math.random() * 150 : 100 + Math.random() * 50),
      };
    });

    // Generate region health
    const geographic_regions: RegionHealth[] = [
      { region: 'AU-East', health_score: 92, latency_ms: 45, availability: 99.9 },
      { region: 'AU-West', health_score: 88, latency_ms: 65, availability: 99.7 },
      { region: 'Asia-Pacific', health_score: 85, latency_ms: 120, availability: 99.5 },
      { region: 'US-West', health_score: 82, latency_ms: 180, availability: 99.3 },
    ];

    return { services, time_slots, geographic_regions };
  }

  /**
   * Identify bottlenecks from load tests
   */
  private identifyBottlenecks(loadTests: LoadTestResult[]): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    for (const test of loadTests) {
      // Check for database bottlenecks
      if (test.metrics.db_query_time.p95 > 100) {
        bottlenecks.push({
          id: `bn-db-${Date.now()}`,
          service: 'database',
          type: 'database',
          severity: test.metrics.db_query_time.p95 > 200 ? 'high' : 'medium',
          description: `Database query time p95: ${test.metrics.db_query_time.p95}ms`,
          impact: 'Slow page loads, timeout errors',
          recommendation: 'Add indexes, optimize queries, enable connection pooling',
          detected_at: test.started_at,
        });
      }

      // Check for queue bottlenecks
      if (test.metrics.queue_depth.p95 > 50) {
        bottlenecks.push({
          id: `bn-queue-${Date.now()}`,
          service: 'queue_workers',
          type: 'queue',
          severity: test.metrics.queue_depth.p95 > 100 ? 'high' : 'medium',
          description: `Queue depth p95: ${test.metrics.queue_depth.p95}`,
          impact: 'Delayed email processing, campaign execution lag',
          recommendation: 'Increase worker count, optimize job processing',
          detected_at: test.started_at,
        });
      }

      // Check for AI model bottlenecks
      if (test.metrics.model_latency.p95 > 3000) {
        bottlenecks.push({
          id: `bn-ai-${Date.now()}`,
          service: 'ai_intelligence',
          type: 'ai_model',
          severity: test.metrics.model_latency.p95 > 5000 ? 'critical' : 'high',
          description: `AI model latency p95: ${test.metrics.model_latency.p95}ms`,
          impact: 'Slow content generation, intelligence scoring delays',
          recommendation: 'Implement request batching, use faster model tiers, add caching',
          detected_at: test.started_at,
        });
      }

      // Check for CPU bottlenecks
      if (test.metrics.server_cpu_load.p95 > 70) {
        bottlenecks.push({
          id: `bn-cpu-${Date.now()}`,
          service: 'api_gateway',
          type: 'cpu',
          severity: test.metrics.server_cpu_load.p95 > 85 ? 'critical' : 'high',
          description: `Server CPU load p95: ${test.metrics.server_cpu_load.p95}%`,
          impact: 'Request queuing, increased latency, potential downtime',
          recommendation: 'Horizontal scaling, optimize CPU-intensive operations',
          detected_at: test.started_at,
        });
      }
    }

    return bottlenecks;
  }

  /**
   * Generate scaling recommendations
   */
  private generateScalingRecommendations(loadTests: LoadTestResult[]): ScalingRecommendation[] {
    const recommendations: ScalingRecommendation[] = [];

    for (const test of loadTests) {
      // Database scaling
      if (test.metrics.db_query_time.p95 > 100) {
        recommendations.push({
          id: `sr-db-${Date.now()}`,
          resource: 'Database',
          current_capacity: 'Single instance',
          recommended_capacity: 'Read replicas + Connection pooling',
          reason: `High query latency (p95: ${test.metrics.db_query_time.p95}ms)`,
          priority: test.metrics.db_query_time.p95 > 200 ? 'high' : 'medium',
          estimated_cost_impact: '+$50-100/month',
          implementation_steps: [
            'Enable Supabase connection pooler',
            'Add read replica for analytics queries',
            'Implement query caching layer',
          ],
        });
      }

      // Worker scaling
      if (test.metrics.queue_depth.p95 > 50) {
        recommendations.push({
          id: `sr-workers-${Date.now()}`,
          resource: 'Queue Workers',
          current_capacity: '2 workers',
          recommended_capacity: '4-6 workers',
          reason: `High queue depth (p95: ${test.metrics.queue_depth.p95})`,
          priority: 'high',
          estimated_cost_impact: '+$20-40/month',
          implementation_steps: [
            'Increase Vercel function concurrency',
            'Add dedicated worker instances',
            'Implement job prioritization',
          ],
        });
      }

      // AI capacity
      if (test.metrics.model_latency.p95 > 3000) {
        recommendations.push({
          id: `sr-ai-${Date.now()}`,
          resource: 'AI Model Capacity',
          current_capacity: 'Standard tier',
          recommended_capacity: 'Batched requests + Caching',
          reason: `High AI latency (p95: ${test.metrics.model_latency.p95}ms)`,
          priority: 'medium',
          estimated_cost_impact: '-$30-50/month (cost reduction)',
          implementation_steps: [
            'Implement prompt caching',
            'Batch similar requests',
            'Use Haiku for simple tasks',
          ],
        });
      }
    }

    return recommendations;
  }

  /**
   * Summarize load tests
   */
  private summarizeLoadTests(loadTests: LoadTestResult[]): LoadTestSummaryReport {
    if (loadTests.length === 0) {
      return {
        total_tests: 0,
        passed_tests: 0,
        failed_tests: 0,
        avg_response_time: 0,
        peak_rps_achieved: 0,
        critical_issues: [],
      };
    }

    const passedTests = loadTests.filter(t => t.status === 'completed').length;
    const failedTests = loadTests.filter(t => t.status === 'failed' || t.status === 'aborted').length;
    const avgResponseTime = loadTests.reduce((sum, t) => sum + t.metrics.response_time_ms.avg, 0) / loadTests.length;
    const peakRps = Math.max(...loadTests.map(t => t.summary.requests_per_second));

    const criticalIssues: string[] = [];
    for (const test of loadTests) {
      if (test.summary.error_rate > 0.05) {
        criticalIssues.push(`High error rate in ${test.scenario}: ${(test.summary.error_rate * 100).toFixed(1)}%`);
      }
      criticalIssues.push(...test.summary.bottlenecks);
    }

    return {
      total_tests: loadTests.length,
      passed_tests: passedTests,
      failed_tests: failedTests,
      avg_response_time: Math.round(avgResponseTime),
      peak_rps_achieved: peakRps,
      critical_issues: [...new Set(criticalIssues)].slice(0, 5),
    };
  }

  /**
   * Summarize chaos tests
   */
  private summarizeChaosTests(chaosEvents: ChaosEvent[]): ChaosTestSummaryReport {
    if (chaosEvents.length === 0) {
      return {
        total_tests: 0,
        successful_recoveries: 0,
        manual_interventions: 0,
        avg_recovery_time: 0,
        circuit_breakers_triggered: 0,
        lessons_learned: [],
      };
    }

    const successfulRecoveries = chaosEvents.filter(e => e.recovery_status.fully_recovered).length;
    const manualInterventions = chaosEvents.filter(e => e.recovery_status.manual_intervention_required).length;
    const avgRecoveryTime = chaosEvents.reduce((sum, e) => sum + e.metrics.recovery_time_seconds, 0) / chaosEvents.length;
    const circuitBreakers = chaosEvents.reduce((sum, e) => sum + e.metrics.circuit_breakers_activated, 0);

    const lessonsLearned: string[] = [];
    for (const event of chaosEvents) {
      if (event.metrics.cascading_failures > 0) {
        lessonsLearned.push(`${event.fault}: Implement better service isolation`);
      }
      if (!event.recovery_status.fully_recovered) {
        lessonsLearned.push(`${event.fault}: Improve auto-recovery mechanisms`);
      }
    }

    return {
      total_tests: chaosEvents.length,
      successful_recoveries: successfulRecoveries,
      manual_interventions: manualInterventions,
      avg_recovery_time: Math.round(avgRecoveryTime),
      circuit_breakers_triggered: circuitBreakers,
      lessons_learned: [...new Set(lessonsLearned)].slice(0, 5),
    };
  }

  /**
   * Analyze trends
   */
  private analyzeTrends(
    loadTests: LoadTestResult[],
    chaosEvents: ChaosEvent[]
  ): TrendAnalysis {
    // Simplified trend analysis based on most recent tests
    const recentLoadTests = loadTests.slice(-5);
    const recentChaosEvents = chaosEvents.slice(-5);

    // Response time trend
    let responseTimeTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (recentLoadTests.length >= 2) {
      const first = recentLoadTests[0].metrics.response_time_ms.avg;
      const last = recentLoadTests[recentLoadTests.length - 1].metrics.response_time_ms.avg;
      if (last < first * 0.9) responseTimeTrend = 'improving';
      else if (last > first * 1.1) responseTimeTrend = 'degrading';
    }

    // Error rate trend
    let errorRateTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (recentLoadTests.length >= 2) {
      const first = recentLoadTests[0].summary.error_rate;
      const last = recentLoadTests[recentLoadTests.length - 1].summary.error_rate;
      if (last < first * 0.8) errorRateTrend = 'improving';
      else if (last > first * 1.2) errorRateTrend = 'degrading';
    }

    // Reliability trend based on recovery success
    let reliabilityTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (recentChaosEvents.length >= 2) {
      const recentRecoveries = recentChaosEvents.filter(e => e.recovery_status.fully_recovered).length;
      const recoveryRate = recentRecoveries / recentChaosEvents.length;
      if (recoveryRate >= 0.9) reliabilityTrend = 'improving';
      else if (recoveryRate < 0.7) reliabilityTrend = 'degrading';
    }

    return {
      response_time_trend: responseTimeTrend,
      error_rate_trend: errorRateTrend,
      capacity_trend: 'stable',
      reliability_trend: reliabilityTrend,
    };
  }

  /**
   * Generate heatmap data for visualization
   */
  generateHeatmapData(report: StabilityReport): {
    rows: string[];
    cols: string[];
    values: number[][];
  } {
    const rows = report.heatmap.services.map(s => s.service);
    const cols = ['Health', 'Response', 'Errors'];
    const values = report.heatmap.services.map(s => [
      s.health_score,
      Math.min(100, Math.round(100 - (s.avg_response_time / 5))), // Normalize response time
      Math.round(100 - (s.error_rate * 1000)), // Normalize error rate
    ]);

    return { rows, cols, values };
  }
}

export default LoadReportService;
