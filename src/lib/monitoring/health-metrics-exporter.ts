/**
 * Health Metrics Exporter
 * Converts health check data to Datadog format
 */

import { DatadogClient } from './datadog-client';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'HealthMetricsExporter' });

interface HealthSnapshot {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: DependencyCheck;
    cache: DependencyCheck;
    ai_services: DependencyCheck;
    external_apis: DependencyCheck;
  };
}

interface DependencyCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms: number;
  error?: string;
  timestamp: string;
}

interface RouteCheckResult {
  route: string;
  method: string;
  status: 'accessible' | 'error';
  response_time_ms?: number;
  error?: string;
}

interface RouteHealthSnapshot {
  total_routes_in_system: number;
  checked: number;
  healthy: number;
  unhealthy: number;
  routes_sampled: RouteCheckResult[];
  timestamp: string;
}

export class HealthMetricsExporter {
  private datadogClient: DatadogClient;
  private serviceName: string;
  private environment: string;

  constructor(datadogClient: DatadogClient) {
    this.datadogClient = datadogClient;
    this.serviceName = process.env.DATADOG_SERVICE_NAME || 'unite-hub';
    this.environment = process.env.NODE_ENV || 'production';
  }

  /**
   * Export complete health snapshot to Datadog
   */
  async exportHealthMetrics(healthSnapshot: HealthSnapshot): Promise<void> {
    try {
      const timestamp = Math.floor(new Date(healthSnapshot.timestamp).getTime() / 1000);

      // Overall health status (0 = healthy, 1 = degraded, 2 = unhealthy)
      const statusValue = this.statusToValue(healthSnapshot.status);
      this.datadogClient.queueMetric(
        'health.overall.status',
        statusValue,
        [`environment:${this.environment}`],
        'gauge'
      );

      // Export dependency checks
      await this.exportDependencyStatus({
        database: healthSnapshot.checks.database,
        cache: healthSnapshot.checks.cache,
        ai_services: healthSnapshot.checks.ai_services,
        external_apis: healthSnapshot.checks.external_apis,
      });

      // Export check latencies
      await this.exportCheckLatencies([
        { name: 'database', ...healthSnapshot.checks.database },
        { name: 'cache', ...healthSnapshot.checks.cache },
        { name: 'ai_services', ...healthSnapshot.checks.ai_services },
        { name: 'external_apis', ...healthSnapshot.checks.external_apis },
      ]);

      logger.info('Health metrics exported to Datadog', {
        status: healthSnapshot.status,
      });
    } catch (error) {
      logger.error('Failed to export health metrics', { error });
    }
  }

  /**
   * Export per-check latency metrics
   */
  async exportCheckLatencies(
    checkResults: Array<DependencyCheck & { name: string }>
  ): Promise<void> {
    for (const check of checkResults) {
      const metricName = `health.check.${check.name}.latency_ms`;
      const tags = [
        `check_type:${check.name}`,
        `status:${check.status}`,
        `environment:${this.environment}`,
      ];

      this.datadogClient.queueMetric(metricName, check.latency_ms, tags, 'gauge');

      // Also track as histogram for percentile calculations
      this.datadogClient.queueMetric(
        `health.check.latency_ms`,
        check.latency_ms,
        [...tags, `check:${check.name}`],
        'gauge'
      );
    }
  }

  /**
   * Export route-level health metrics
   */
  async exportRouteHealth(routeSnapshot: RouteHealthSnapshot): Promise<void> {
    try {
      const tags = [`environment:${this.environment}`];

      // Total routes in system
      this.datadogClient.queueMetric(
        'health.routes.total',
        routeSnapshot.total_routes_in_system,
        tags,
        'gauge'
      );

      // Routes checked
      this.datadogClient.queueMetric(
        'health.routes.checked',
        routeSnapshot.checked,
        tags,
        'gauge'
      );

      // Healthy routes
      this.datadogClient.queueMetric(
        'health.routes.healthy',
        routeSnapshot.healthy,
        tags,
        'gauge'
      );

      // Unhealthy routes
      this.datadogClient.queueMetric(
        'health.routes.unhealthy',
        routeSnapshot.unhealthy,
        tags,
        'gauge'
      );

      // Success rate
      const successRate =
        routeSnapshot.checked > 0
          ? (routeSnapshot.healthy / routeSnapshot.checked) * 100
          : 100;

      this.datadogClient.queueMetric(
        'health.routes.success_rate',
        successRate,
        tags,
        'gauge'
      );

      // Per-route metrics
      for (const route of routeSnapshot.routes_sampled) {
        if (route.response_time_ms !== undefined) {
          const routeTags = [
            `route:${this.sanitizeRouteName(route.route)}`,
            `method:${route.method}`,
            `status:${route.status}`,
            `environment:${this.environment}`,
          ];

          this.datadogClient.queueMetric(
            'health.route.latency_ms',
            route.response_time_ms,
            routeTags,
            'gauge'
          );

          // Track route status (0 = accessible, 1 = error)
          this.datadogClient.queueMetric(
            'health.route.status',
            route.status === 'accessible' ? 0 : 1,
            routeTags,
            'gauge'
          );
        }
      }

      logger.info('Route health metrics exported to Datadog', {
        total: routeSnapshot.total_routes_in_system,
        healthy: routeSnapshot.healthy,
        unhealthy: routeSnapshot.unhealthy,
      });
    } catch (error) {
      logger.error('Failed to export route health metrics', { error });
    }
  }

  /**
   * Export dependency status as gauges
   */
  async exportDependencyStatus(dependencies: Record<string, DependencyCheck>): Promise<void> {
    for (const [name, check] of Object.entries(dependencies)) {
      const statusValue = this.statusToValue(check.status);
      const tags = [
        `dependency:${name}`,
        `status:${check.status}`,
        `environment:${this.environment}`,
      ];

      // Dependency health gauge (0 = healthy, 1 = degraded, 2 = unhealthy)
      this.datadogClient.queueMetric(
        `health.dependency.${name}.status`,
        statusValue,
        tags,
        'gauge'
      );

      // Dependency availability (0 = down, 1 = up)
      const isAvailable = check.status !== 'unhealthy' ? 1 : 0;
      this.datadogClient.queueMetric(
        `health.dependency.${name}.available`,
        isAvailable,
        tags,
        'gauge'
      );

      // Create event if dependency is unhealthy
      if (check.status === 'unhealthy' && check.error) {
        await this.datadogClient.createEvent(
          `Dependency ${name} is unhealthy`,
          check.error,
          tags,
          'normal',
          'error'
        );
      }
    }
  }

  /**
   * Export verification metrics
   */
  async exportVerificationMetrics(
    taskId: string,
    success: boolean,
    duration_ms: number
  ): Promise<void> {
    const tags = [
      `task_id:${taskId}`,
      `success:${success}`,
      `environment:${this.environment}`,
    ];

    // Verification success/failure count
    this.datadogClient.queueMetric(
      'verification.executions',
      1,
      tags,
      'count'
    );

    // Verification duration
    this.datadogClient.queueMetric(
      'verification.duration_ms',
      duration_ms,
      tags,
      'gauge'
    );

    // Success rate (as gauge for easier trending)
    this.datadogClient.queueMetric(
      'verification.success_rate',
      success ? 100 : 0,
      tags,
      'gauge'
    );
  }

  /**
   * Export alert processing metrics
   */
  async exportAlertMetrics(
    alertType: string,
    processingTime_ms: number,
    success: boolean
  ): Promise<void> {
    const tags = [
      `alert_type:${alertType}`,
      `success:${success}`,
      `environment:${this.environment}`,
    ];

    this.datadogClient.queueMetric(
      'alerts.processed',
      1,
      tags,
      'count'
    );

    this.datadogClient.queueMetric(
      'alerts.processing_time_ms',
      processingTime_ms,
      tags,
      'gauge'
    );
  }

  /**
   * Export cache metrics
   */
  async exportCacheMetrics(hits: number, misses: number): Promise<void> {
    const tags = [`environment:${this.environment}`];

    this.datadogClient.queueMetric('cache.hits', hits, tags, 'count');
    this.datadogClient.queueMetric('cache.misses', misses, tags, 'count');

    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;

    this.datadogClient.queueMetric('cache.hit_rate', hitRate, tags, 'gauge');
  }

  /**
   * Convert status string to numeric value
   */
  private statusToValue(status: 'healthy' | 'degraded' | 'unhealthy'): number {
    switch (status) {
      case 'healthy':
        return 0;
      case 'degraded':
        return 1;
      case 'unhealthy':
        return 2;
      default:
        return 2;
    }
  }

  /**
   * Sanitize route name for Datadog tags
   */
  private sanitizeRouteName(route: string): string {
    return route
      .replace(/^\/api\//, '')
      .replace(/\//g, '_')
      .replace(/[^a-z0-9_]/gi, '')
      .toLowerCase();
  }
}

export default HealthMetricsExporter;
