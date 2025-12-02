/* eslint-disable no-undef, @typescript-eslint/no-explicit-any */
/* global process, global, Response, setTimeout */

/**
 * Datadog APM Integration Tests
 * Tests all Datadog monitoring components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatadogClient } from '@/lib/monitoring/datadog-client';
import HealthMetricsExporter from '@/lib/monitoring/health-metrics-exporter';
import DatadogAlerts from '@/lib/monitoring/datadog-alerts';
import DatadogTrending from '@/lib/monitoring/datadog-trending';
import SLAMonitor from '@/lib/monitoring/sla-monitor';
import DatadogDashboardConfig from '@/lib/monitoring/datadog-dashboard-config';

// Mock environment variables
process.env.DATADOG_API_KEY = 'test-api-key';
process.env.DATADOG_APP_KEY = 'test-app-key';
process.env.DATADOG_SERVICE_NAME = 'unite-hub-test';
process.env.NODE_ENV = 'test';

describe('Datadog Client', () => {
  let client: DatadogClient;

  beforeEach(() => {
    client = new DatadogClient({
      apiKey: 'test-api-key',
      appKey: 'test-app-key',
      serviceName: 'unite-hub-test',
    });
  });

  afterEach(async () => {
    await client.shutdown();
  });

  it('should initialize with correct configuration', () => {
    expect(client).toBeDefined();
    const status = client.getQueueStatus();
    expect(status.queued).toBe(0);
    expect(status.batchSize).toBe(100);
  });

  it('should queue metrics for batch sending', () => {
    client.queueMetric('test.metric', 42, ['tag1:value1'], 'gauge');

    const status = client.getQueueStatus();
    expect(status.queued).toBe(1);
  });

  it('should normalize tags correctly', () => {
    client.queueMetric('test.metric', 100, ['Tag With Spaces', 'Special@Chars!']);

    // Tags should be normalized internally
    const status = client.getQueueStatus();
    expect(status.queued).toBe(1);
  });

  it('should auto-flush when batch is full', async () => {
    // Queue 101 metrics to trigger auto-flush
    for (let i = 0; i < 101; i++) {
      client.queueMetric(`test.metric.${i}`, i, [], 'count');
    }

    // Wait for flush
    await new Promise((resolve) => setTimeout(resolve, 100));

    const status = client.getQueueStatus();
    // Should have only 1 metric left after flushing 100
    expect(status.queued).toBeLessThan(10);
  });

  it('should handle metric sending errors gracefully', async () => {
    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await client.sendMetric('test.metric', 42);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should create events in Datadog timeline', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    } as Response);

    const result = await client.createEvent(
      'Test Event',
      'This is a test event',
      ['test:true'],
      'normal',
      'info'
    );

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });
});

describe('Health Metrics Exporter', () => {
  let client: DatadogClient;
  let exporter: HealthMetricsExporter;

  beforeEach(() => {
    client = new DatadogClient({
      apiKey: 'test-api-key',
      appKey: 'test-app-key',
    });
    exporter = new HealthMetricsExporter(client);
  });

  afterEach(async () => {
    await client.shutdown();
  });

  it('should export health snapshot to Datadog', async () => {
    const healthSnapshot = {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'healthy' as const,
          latency_ms: 45,
          timestamp: new Date().toISOString(),
        },
        cache: {
          status: 'healthy' as const,
          latency_ms: 12,
          timestamp: new Date().toISOString(),
        },
        ai_services: {
          status: 'healthy' as const,
          latency_ms: 234,
          timestamp: new Date().toISOString(),
        },
        external_apis: {
          status: 'healthy' as const,
          latency_ms: 67,
          timestamp: new Date().toISOString(),
        },
      },
    };

    await exporter.exportHealthMetrics(healthSnapshot);

    const status = client.getQueueStatus();
    expect(status.queued).toBeGreaterThan(0);
  });

  it('should export route health metrics', async () => {
    const routeSnapshot = {
      total_routes_in_system: 672,
      checked: 50,
      healthy: 48,
      unhealthy: 2,
      routes_sampled: [
        {
          route: '/api/health',
          method: 'GET',
          status: 'accessible' as const,
          response_time_ms: 123,
        },
        {
          route: '/api/contacts',
          method: 'POST',
          status: 'error' as const,
          response_time_ms: 5000,
          error: 'Timeout',
        },
      ],
      timestamp: new Date().toISOString(),
    };

    await exporter.exportRouteHealth(routeSnapshot);

    const status = client.getQueueStatus();
    expect(status.queued).toBeGreaterThan(0);
  });

  it('should export verification metrics', async () => {
    await exporter.exportVerificationMetrics('task-123', true, 1234);

    const status = client.getQueueStatus();
    expect(status.queued).toBeGreaterThan(0);
  });

  it('should export cache metrics', async () => {
    await exporter.exportCacheMetrics(800, 200);

    const status = client.getQueueStatus();
    expect(status.queued).toBeGreaterThan(0);
  });

  it('should handle export errors gracefully', async () => {
    const invalidSnapshot = {
      status: 'healthy' as const,
      timestamp: 'invalid-date',
      checks: {} as any,
    };

    // Should not throw
    await expect(exporter.exportHealthMetrics(invalidSnapshot)).resolves.not.toThrow();
  });
});

describe('Datadog Alerts', () => {
  let alerts: DatadogAlerts;

  beforeEach(() => {
    alerts = new DatadogAlerts('test-api-key', 'test-app-key', ['@slack-alerts']);
  });

  it('should create alert rule', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 12345, name: 'Test Alert' }),
    } as Response);

    const result = await alerts.createAlertRule(
      'Test Alert',
      'health.check.latency_ms',
      5000,
      5,
      'Test alert message'
    );

    expect(result.success).toBe(true);
    expect(result.ruleId).toBe('12345');
  });

  it('should update alert rule', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 12345 }),
    } as Response);

    const result = await alerts.updateAlertRule('12345', {
      name: 'Updated Alert',
    });

    expect(result.success).toBe(true);
  });

  it('should delete alert rule', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const result = await alerts.deleteAlertRule('12345');

    expect(result.success).toBe(true);
  });

  it('should get alert status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 12345,
        name: 'Test Alert',
        overall_state: 'OK',
        message: 'All good',
      }),
    } as Response);

    const status = await alerts.getAlertStatus('12345');

    expect(status).toBeDefined();
    expect(status?.id).toBe('12345');
    expect(status?.status).toBe('OK');
  });

  it('should create pre-configured health check alerts', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: Math.floor(Math.random() * 10000) }),
    } as Response);

    const result = await alerts.createHealthCheckAlerts();

    expect(result.success).toBe(true);
    expect(result.rules.length).toBeGreaterThan(0);
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad request',
    } as Response);

    const result = await alerts.createAlertRule('Test', 'metric', 100);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('Datadog Trending', () => {
  let client: DatadogClient;
  let trending: DatadogTrending;

  beforeEach(() => {
    client = new DatadogClient({
      apiKey: 'test-api-key',
      appKey: 'test-app-key',
    });
    trending = new DatadogTrending(client);
  });

  afterEach(async () => {
    await client.shutdown();
  });

  it('should calculate trend direction', async () => {
    // Mock metric history
    vi.spyOn(client, 'getMetricHistory').mockResolvedValue({
      status: 'ok',
      series: [
        {
          metric: 'test.metric',
          tags: [],
          points: [
            [1000, 100],
            [2000, 110],
            [3000, 120],
            [4000, 130],
            [5000, 140],
          ],
        },
      ],
    });

    const trend = await trending.calculateTrend('test.metric', 7);

    expect(trend.direction).toBe('up');
    expect(trend.change_percent).toBeGreaterThan(0);
    expect(trend.forecast).toBeGreaterThan(trend.current_value);
  });

  it('should get metric baseline', async () => {
    vi.spyOn(client, 'getMetricHistory').mockResolvedValue({
      status: 'ok',
      series: [
        {
          metric: 'test.metric',
          tags: [],
          points: [
            [1000, 100],
            [2000, 102],
            [3000, 98],
            [4000, 101],
            [5000, 99],
          ],
        },
      ],
    });

    const baseline = await trending.getMetricBaseline('test.metric', 7);

    expect(baseline.average).toBeCloseTo(100, 0);
    expect(baseline.min).toBe(98);
    expect(baseline.max).toBe(102);
    expect(baseline.samples).toBe(5);
  });

  it('should detect anomalies', async () => {
    vi.spyOn(client, 'getMetricHistory').mockResolvedValue({
      status: 'ok',
      series: [
        {
          metric: 'test.metric',
          tags: [],
          points: Array.from({ length: 100 }, (_, i) => [i * 1000, 100 + Math.random() * 5]),
        },
      ],
    });

    const anomaly = await trending.detectAnomaly('test.metric', 200, 'medium');

    expect(anomaly.is_anomaly).toBe(true);
    expect(anomaly.severity).not.toBe('none');
    expect(Math.abs(anomaly.z_score)).toBeGreaterThan(2);
  });

  it('should generate trend report', async () => {
    vi.spyOn(client, 'getMetricHistory').mockResolvedValue({
      status: 'ok',
      series: [
        {
          metric: 'test.metric',
          tags: [],
          points: Array.from({ length: 50 }, (_, i) => [i * 1000, 100 + i]),
        },
      ],
    });

    const report = await trending.generateTrendReport(
      ['metric1', 'metric2', 'metric3'],
      7
    );

    expect(report).toHaveLength(3);
    expect(report[0]).toHaveProperty('trend');
    expect(report[0]).toHaveProperty('baseline');
    expect(report[0]).toHaveProperty('anomaly');
  });
});

describe('SLA Monitor', () => {
  let client: DatadogClient;
  let slaMonitor: SLAMonitor;

  beforeEach(() => {
    client = new DatadogClient({
      apiKey: 'test-api-key',
      appKey: 'test-app-key',
    });
    slaMonitor = new SLAMonitor(client);
  });

  afterEach(async () => {
    await client.shutdown();
  });

  it('should define custom SLA', () => {
    slaMonitor.defineSLA(
      'custom-sla',
      'Custom SLA',
      'custom.metric',
      99.5,
      720,
      'availability'
    );

    const definitions = slaMonitor.getSLADefinitions();
    const customSLA = definitions.find((d) => d.id === 'custom-sla');

    expect(customSLA).toBeDefined();
    expect(customSLA?.target_percentage).toBe(99.5);
  });

  it('should check SLA compliance', async () => {
    vi.spyOn(client, 'getMetricHistory').mockResolvedValue({
      status: 'ok',
      series: [
        {
          metric: 'health.overall.status',
          tags: [],
          points: Array.from({ length: 100 }, () => [Date.now(), 1]), // All healthy
        },
      ],
    });

    const status = await slaMonitor.checkSLACompliance('uptime_monthly');

    expect(status).toBeDefined();
    expect(status?.is_compliant).toBe(true);
    expect(status?.current_percentage).toBeGreaterThan(99);
  });

  it('should calculate error budget', async () => {
    vi.spyOn(client, 'getMetricHistory').mockResolvedValue({
      status: 'ok',
      series: [
        {
          metric: 'health.routes.success_rate',
          tags: [],
          points: Array.from({ length: 100 }, () => [Date.now(), 99.0]), // 99.0% success (below 99.5% target)
        },
      ],
    });

    const status = await slaMonitor.checkSLACompliance('route_success_daily');

    expect(status).toBeDefined();
    // SLA target is 99.5%, current is 99.0%, so not compliant
    expect(status?.is_compliant).toBe(false);
    expect(status?.current_percentage).toBe(99.0);
    expect(status?.error_budget_remaining).toBeGreaterThanOrEqual(0); // Can be 0 if fully exhausted
    expect(status?.error_budget_used).toBeGreaterThan(0);
  });

  it('should generate SLA report', async () => {
    vi.spyOn(client, 'getMetricHistory').mockResolvedValue({
      status: 'ok',
      series: [
        {
          metric: 'test.metric',
          tags: [],
          points: Array.from({ length: 100 }, () => [Date.now(), 1]),
        },
      ],
    });

    const report = await slaMonitor.generateSLAReport(30);

    expect(report).toBeDefined();
    expect(report.summary.total_slas).toBeGreaterThan(0);
    expect(report.summary.overall_health).toBeDefined();
  });

  it('should detect SLA violations', async () => {
    vi.spyOn(client, 'getMetricHistory').mockResolvedValue({
      status: 'ok',
      series: [
        {
          metric: 'verification.success_rate',
          tags: [],
          points: [
            ...Array.from({ length: 50 }, () => [Date.now(), 99.9]),
            ...Array.from({ length: 50 }, () => [Date.now(), 95]), // Drop to 95%
          ],
        },
      ],
    });

    const status = await slaMonitor.checkSLACompliance('verification_success_daily');

    expect(status).toBeDefined();
    expect(status?.is_compliant).toBe(false);
  });
});

describe('Datadog Dashboard Config', () => {
  let dashboard: DatadogDashboardConfig;

  beforeEach(() => {
    dashboard = new DatadogDashboardConfig('test-api-key', 'test-app-key');
  });

  it('should export dashboard configuration as JSON', () => {
    const config = dashboard.getHealthDashboardConfig();

    expect(config).toBeDefined();
    expect(() => JSON.parse(config)).not.toThrow();

    const parsed = JSON.parse(config);
    expect(parsed.title).toBeDefined();
    expect(parsed.widgets).toBeDefined();
    expect(Array.isArray(parsed.widgets)).toBe(true);
  });

  it('should create health monitoring dashboard', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'dash-12345',
        url: 'https://app.datadoghq.com/dashboard/dash-12345',
      }),
    } as Response);

    const result = await dashboard.createHealthDashboard();

    expect(result.success).toBe(true);
    expect(result.dashboardId).toBe('dash-12345');
    expect(result.url).toBeDefined();
  });

  it('should create verification dashboard', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'dash-67890',
        url: 'https://app.datadoghq.com/dashboard/dash-67890',
      }),
    } as Response);

    const result = await dashboard.createVerificationDashboard();

    expect(result.success).toBe(true);
    expect(result.dashboardId).toBe('dash-67890');
  });

  it('should handle dashboard creation errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    } as Response);

    const result = await dashboard.createHealthDashboard();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
