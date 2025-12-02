/**
 * Datadog Dashboard Configuration
 * Creates and manages Datadog dashboards for health monitoring
 */

import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'DatadogDashboard' });

interface DashboardWidget {
  id?: number;
  definition: {
    type: string;
    title?: string;
    requests?: Array<{
      q?: string;
      formulas?: Array<{ formula: string }>;
      queries?: Array<{ query: string; data_source: string; name: string }>;
    }>;
    time?: { live_span: string };
    yaxis?: { min: string; max: string };
    markers?: Array<{ value: string; display_type: string; label: string }>;
  };
  layout?: { x: number; y: number; width: number; height: number };
}

interface DashboardConfig {
  title: string;
  description: string;
  widgets: DashboardWidget[];
  layout_type: 'ordered' | 'free';
  template_variables?: Array<{
    name: string;
    prefix?: string;
    default?: string;
  }>;
}

export class DatadogDashboardConfig {
  private apiKey: string;
  private appKey: string;
  private baseUrl: string;
  private serviceName: string;
  private environment: string;

  constructor(apiKey?: string, appKey?: string) {
    this.apiKey = apiKey || process.env.DATADOG_API_KEY || '';
    this.appKey = appKey || process.env.DATADOG_APP_KEY || '';
    this.baseUrl = `https://api.${process.env.DATADOG_SITE || 'datadoghq.com'}`;
    this.serviceName = process.env.DATADOG_SERVICE_NAME || 'unite-hub';
    this.environment = process.env.NODE_ENV || 'production';
  }

  /**
   * Create a new dashboard in Datadog
   */
  async createDashboard(
    title: string,
    widgets: DashboardWidget[]
  ): Promise<{ success: boolean; dashboardId?: string; url?: string; error?: string }> {
    try {
      const config = this.buildDashboardConfig(title, widgets);

      const response = await fetch(`${this.baseUrl}/api/v1/dashboard`, {
        method: 'POST',
        headers: {
          'DD-API-KEY': this.apiKey,
          'DD-APPLICATION-KEY': this.appKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Dashboard creation failed: ${error}`);
      }

      const result = await response.json();

      logger.info('Dashboard created', { title, id: result.id });

      return {
        success: true,
        dashboardId: result.id,
        url: result.url,
      };
    } catch (error) {
      logger.error('Failed to create dashboard', { title, error });
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Create health monitoring dashboard
   */
  async createHealthDashboard(): Promise<{
    success: boolean;
    dashboardId?: string;
    url?: string;
    error?: string;
  }> {
    const widgets: DashboardWidget[] = [
      // Row 1: System Health Overview
      this.createStatusWidget('Overall Health Status', 'health.overall.status'),
      this.createTimeseriesWidget(
        'Health Check Latency',
        'health.check.latency_ms',
        'Check Type',
        'check_type'
      ),
      this.createQueryValueWidget('Route Success Rate', 'health.routes.success_rate', '%'),
      this.createQueryValueWidget('Cache Hit Rate', 'cache.hit_rate', '%'),

      // Row 2: Performance Trends (7-day)
      this.createTimeseriesWidget(
        '7-Day Latency Trend',
        'health.check.latency_ms',
        'Overall',
        undefined,
        '7d'
      ),
      this.createTimeseriesWidget(
        '7-Day Success Rate',
        'health.routes.success_rate',
        'Routes',
        undefined,
        '7d'
      ),
      this.createTimeseriesWidget(
        '7-Day Cache Performance',
        'cache.hit_rate',
        'Cache',
        undefined,
        '7d'
      ),

      // Row 3: Dependencies
      this.createHeatmapWidget('Database Health', 'health.dependency.database.status'),
      this.createHeatmapWidget('Cache Health', 'health.dependency.cache.status'),
      this.createHeatmapWidget('AI Services Health', 'health.dependency.ai_services.status'),
      this.createHeatmapWidget('External APIs Health', 'health.dependency.external_apis.status'),

      // Row 4: SLA Status
      this.createSLAWidget('Uptime SLA (99.9%)', 'health.overall.status', 99.9),
      this.createSLAWidget('Route Success SLA (99.5%)', 'health.routes.success_rate', 99.5),

      // Row 5: Route Inventory Heat Map
      this.createRouteHeatmapWidget(),

      // Row 6: Alerts & Events
      this.createEventsWidget(),
    ];

    return this.createDashboard('Unite-Hub Health Monitoring', widgets);
  }

  /**
   * Create verification dashboard
   */
  async createVerificationDashboard(): Promise<{
    success: boolean;
    dashboardId?: string;
    url?: string;
    error?: string;
  }> {
    const widgets: DashboardWidget[] = [
      this.createQueryValueWidget('Verification Success Rate', 'verification.success_rate', '%'),
      this.createTimeseriesWidget(
        'Verification Duration',
        'verification.duration_ms',
        'Task Duration',
        'task_id'
      ),
      this.createQueryValueWidget('Total Verifications', 'verification.executions', ''),
      this.createTimeseriesWidget(
        'Success Rate Trend',
        'verification.success_rate',
        'Verification',
        undefined,
        '7d'
      ),
    ];

    return this.createDashboard('Unite-Hub Verification System', widgets);
  }

  /**
   * Export dashboard configuration as JSON
   */
  exportDashboardConfig(title: string, widgets: DashboardWidget[]): string {
    const config = this.buildDashboardConfig(title, widgets);
    return JSON.stringify(config, null, 2);
  }

  /**
   * Build dashboard configuration object
   */
  private buildDashboardConfig(title: string, widgets: DashboardWidget[]): DashboardConfig {
    return {
      title,
      description: `Health monitoring dashboard for ${this.serviceName} (${this.environment})`,
      widgets,
      layout_type: 'ordered',
      template_variables: [
        {
          name: 'service',
          prefix: 'service',
          default: this.serviceName,
        },
        {
          name: 'env',
          prefix: 'env',
          default: this.environment,
        },
      ],
    };
  }

  /**
   * Create status widget (single value with color)
   */
  private createStatusWidget(title: string, metric: string): DashboardWidget {
    return {
      definition: {
        type: 'query_value',
        title,
        requests: [
          {
            q: `avg:${metric}{service:${this.serviceName},env:${this.environment}}`,
          },
        ],
        time: { live_span: '1h' },
      },
    };
  }

  /**
   * Create timeseries widget
   */
  private createTimeseriesWidget(
    title: string,
    metric: string,
    displayName: string,
    groupBy?: string,
    timespan: string = '4h'
  ): DashboardWidget {
    const query = groupBy
      ? `avg:${metric}{service:${this.serviceName},env:${this.environment}} by {${groupBy}}`
      : `avg:${metric}{service:${this.serviceName},env:${this.environment}}`;

    return {
      definition: {
        type: 'timeseries',
        title,
        requests: [
          {
            q: query,
          },
        ],
        time: { live_span: timespan },
      },
    };
  }

  /**
   * Create query value widget (single metric value)
   */
  private createQueryValueWidget(title: string, metric: string, unit: string): DashboardWidget {
    return {
      definition: {
        type: 'query_value',
        title,
        requests: [
          {
            q: `avg:${metric}{service:${this.serviceName},env:${this.environment}}`,
          },
        ],
        time: { live_span: '1h' },
      },
    };
  }

  /**
   * Create heatmap widget
   */
  private createHeatmapWidget(title: string, metric: string): DashboardWidget {
    return {
      definition: {
        type: 'heatmap',
        title,
        requests: [
          {
            q: `avg:${metric}{service:${this.serviceName},env:${this.environment}}`,
          },
        ],
        time: { live_span: '4h' },
      },
    };
  }

  /**
   * Create SLA compliance widget with threshold markers
   */
  private createSLAWidget(title: string, metric: string, threshold: number): DashboardWidget {
    return {
      definition: {
        type: 'timeseries',
        title,
        requests: [
          {
            q: `avg:${metric}{service:${this.serviceName},env:${this.environment}}`,
          },
        ],
        time: { live_span: '1d' },
        yaxis: {
          min: `${Math.max(0, threshold - 5)}`,
          max: '100',
        },
        markers: [
          {
            value: `y = ${threshold}`,
            display_type: 'error dashed',
            label: `SLA Target (${threshold}%)`,
          },
        ],
      },
    };
  }

  /**
   * Create route inventory heatmap
   */
  private createRouteHeatmapWidget(): DashboardWidget {
    return {
      definition: {
        type: 'heatmap',
        title: 'Route Health Heat Map (672 Routes)',
        requests: [
          {
            q: `avg:health.route.status{service:${this.serviceName},env:${this.environment}} by {route}`,
          },
        ],
        time: { live_span: '1h' },
      },
    };
  }

  /**
   * Create events timeline widget
   */
  private createEventsWidget(): DashboardWidget {
    return {
      definition: {
        type: 'event_timeline',
        title: 'Alerts & Events',
        requests: [
          {
            q: `tags:service:${this.serviceName} tags:env:${this.environment}`,
          },
        ],
        time: { live_span: '1d' },
      },
    };
  }

  /**
   * Get pre-built health dashboard configuration
   */
  getHealthDashboardConfig(): string {
    const widgets = [
      this.createStatusWidget('Overall Health Status', 'health.overall.status'),
      this.createTimeseriesWidget(
        'Health Check Latency',
        'health.check.latency_ms',
        'Latency',
        'check_type'
      ),
      this.createQueryValueWidget('Route Success Rate', 'health.routes.success_rate', '%'),
      this.createQueryValueWidget('Cache Hit Rate', 'cache.hit_rate', '%'),
    ];

    return this.exportDashboardConfig('Unite-Hub Health Monitoring', widgets);
  }
}

// Singleton instance
let dashboardConfig: DatadogDashboardConfig | null = null;

/**
 * Initialize dashboard config
 */
export function initializeDatadogDashboard(apiKey?: string, appKey?: string): DatadogDashboardConfig {
  dashboardConfig = new DatadogDashboardConfig(apiKey, appKey);
  return dashboardConfig;
}

/**
 * Get dashboard config instance
 */
export function getDatadogDashboard(): DatadogDashboardConfig {
  if (!dashboardConfig) {
    throw new Error('Datadog dashboard not initialized. Call initializeDatadogDashboard() first.');
  }
  return dashboardConfig;
}

export default DatadogDashboardConfig;
