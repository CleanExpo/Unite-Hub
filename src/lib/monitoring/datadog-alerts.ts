/**
 * Datadog Alert Configuration
 * Manages alert rules and monitors in Datadog
 */

import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'DatadogAlerts' });

interface AlertRule {
  id?: string;
  name: string;
  type: 'metric alert' | 'service check' | 'event alert';
  query: string;
  message: string;
  tags: string[];
  options: {
    thresholds: {
      critical?: number;
      warning?: number;
      ok?: number;
    };
    notify_no_data?: boolean;
    no_data_timeframe?: number;
    require_full_window?: boolean;
    notify_audit?: boolean;
    include_tags?: boolean;
  };
  priority?: number;
}

interface AlertStatus {
  id: string;
  name: string;
  status: 'OK' | 'Alert' | 'Warn' | 'No Data' | 'Skipped';
  message: string;
  last_triggered_ts?: number;
}

export class DatadogAlerts {
  private apiKey: string;
  private appKey: string;
  private baseUrl: string;
  private serviceName: string;
  private environment: string;
  private notificationChannels: string[];

  constructor(
    apiKey: string,
    appKey: string,
    notificationChannels: string[] = []
  ) {
    this.apiKey = apiKey || process.env.DATADOG_API_KEY || '';
    this.appKey = appKey || process.env.DATADOG_APP_KEY || '';
    this.baseUrl = `https://api.${process.env.DATADOG_SITE || 'datadoghq.com'}`;
    this.serviceName = process.env.DATADOG_SERVICE_NAME || 'unite-hub';
    this.environment = process.env.NODE_ENV || 'production';
    this.notificationChannels = notificationChannels;

    if (!this.apiKey || !this.appKey) {
      logger.warn('Datadog API keys not configured, alerts will not work');
    }
  }

  /**
   * Create a new alert rule
   */
  async createAlertRule(
    name: string,
    metric: string,
    threshold: number,
    duration: number = 5,
    message?: string
  ): Promise<{ success: boolean; ruleId?: string; error?: string }> {
    try {
      const rule: AlertRule = {
        name,
        type: 'metric alert',
        query: `avg(last_${duration}m):avg:${metric}{service:${this.serviceName},env:${this.environment}} > ${threshold}`,
        message: message || this.buildDefaultMessage(name, metric, threshold),
        tags: [`service:${this.serviceName}`, `env:${this.environment}`],
        options: {
          thresholds: {
            critical: threshold,
            warning: threshold * 0.8,
          },
          notify_no_data: true,
          no_data_timeframe: 20,
          require_full_window: false,
          notify_audit: true,
          include_tags: true,
        },
      };

      const response = await this.apiRequest('/api/v1/monitor', 'POST', rule);

      if (response.id) {
        logger.info('Alert rule created', { name, ruleId: response.id });
        return { success: true, ruleId: String(response.id) };
      }

      return { success: false, error: 'No rule ID returned' };
    } catch (error) {
      logger.error('Failed to create alert rule', { name, error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update existing alert rule
   */
  async updateAlertRule(
    ruleId: string,
    newConfig: Partial<AlertRule>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiRequest(
        `/api/v1/monitor/${ruleId}`,
        'PUT',
        newConfig
      );

      if (response.id) {
        logger.info('Alert rule updated', { ruleId });
        return { success: true };
      }

      return { success: false, error: 'Update failed' };
    } catch (error) {
      logger.error('Failed to update alert rule', { ruleId, error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(ruleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.apiRequest(`/api/v1/monitor/${ruleId}`, 'DELETE');
      logger.info('Alert rule deleted', { ruleId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete alert rule', { ruleId, error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get alert status
   */
  async getAlertStatus(ruleId: string): Promise<AlertStatus | null> {
    try {
      const response = await this.apiRequest(`/api/v1/monitor/${ruleId}`, 'GET');

      return {
        id: String(response.id),
        name: response.name,
        status: response.overall_state || 'No Data',
        message: response.message,
        last_triggered_ts: response.last_triggered_ts,
      };
    } catch (error) {
      logger.error('Failed to get alert status', { ruleId, error });
      return null;
    }
  }

  /**
   * Get all alerts for service
   */
  async getAllAlerts(): Promise<AlertStatus[]> {
    try {
      const response = await this.apiRequest(
        `/api/v1/monitor?tags=service:${this.serviceName}`,
        'GET'
      );

      if (!Array.isArray(response)) {
        return [];
      }

      return response.map((monitor) => ({
        id: String(monitor.id),
        name: monitor.name,
        status: monitor.overall_state || 'No Data',
        message: monitor.message,
        last_triggered_ts: monitor.last_triggered_ts,
      }));
    } catch (error) {
      logger.error('Failed to get all alerts', { error });
      return [];
    }
  }

  /**
   * Create pre-configured health check alerts
   */
  async createHealthCheckAlerts(): Promise<{ success: boolean; rules: string[] }> {
    const rules: string[] = [];

    try {
      // Alert 1: Health check latency > 5 seconds (critical)
      const latencyCritical = await this.createAlertRule(
        'Health Check Latency Critical',
        'health.check.latency_ms',
        5000,
        5,
        `{{#is_alert}}
Health check latency exceeded 5 seconds!
Current value: {{value}}ms
Service: ${this.serviceName}
Environment: ${this.environment}

${this.notificationChannels.join(' ')}
{{/is_alert}}`
      );
      if (latencyCritical.ruleId) {
rules.push(latencyCritical.ruleId);
}

      // Alert 2: Health check latency > 3 seconds (warning)
      const latencyWarning = await this.createAlertRule(
        'Health Check Latency Warning',
        'health.check.latency_ms',
        3000,
        5,
        `{{#is_warning}}
Health check latency elevated (>3s)
Current value: {{value}}ms
${this.notificationChannels.join(' ')}
{{/is_warning}}`
      );
      if (latencyWarning.ruleId) {
rules.push(latencyWarning.ruleId);
}

      // Alert 3: Route success rate < 95%
      const routeSuccess = await this.createAlertRule(
        'Route Success Rate Critical',
        'health.routes.success_rate',
        95,
        10,
        `{{#is_alert}}
Route success rate dropped below 95%!
Current: {{value}}%
${this.notificationChannels.join(' ')}
{{/is_alert}}`
      );
      if (routeSuccess.ruleId) {
rules.push(routeSuccess.ruleId);
}

      // Alert 4: Database response time > 2 seconds
      const dbLatency = await this.createAlertRule(
        'Database Latency Warning',
        'health.check.database.latency_ms',
        2000,
        5,
        `{{#is_alert}}
Database response time exceeded 2 seconds
Current value: {{value}}ms
${this.notificationChannels.join(' ')}
{{/is_alert}}`
      );
      if (dbLatency.ruleId) {
rules.push(dbLatency.ruleId);
}

      // Alert 5: Cache hit rate < 75%
      const cacheHitRate = await this.createAlertRule(
        'Cache Hit Rate Low',
        'cache.hit_rate',
        75,
        15,
        `{{#is_alert}}
Cache hit rate dropped below 75%
Current: {{value}}%
This may indicate cache eviction or misconfiguration
${this.notificationChannels.join(' ')}
{{/is_alert}}`
      );
      if (cacheHitRate.ruleId) {
rules.push(cacheHitRate.ruleId);
}

      // Alert 6: Dependency health degraded
      const depHealth = await this.createAlertRule(
        'Dependency Health Degraded',
        'health.dependency.*.status',
        1, // 1 = degraded, 2 = unhealthy
        5,
        `{{#is_alert}}
One or more dependencies are degraded or unhealthy
Status value: {{value}} (0=healthy, 1=degraded, 2=unhealthy)
${this.notificationChannels.join(' ')}
{{/is_alert}}`
      );
      if (depHealth.ruleId) {
rules.push(depHealth.ruleId);
}

      logger.info('Health check alerts created', { count: rules.length });
      return { success: true, rules };
    } catch (error) {
      logger.error('Failed to create health check alerts', { error });
      return { success: false, rules };
    }
  }

  /**
   * Create verification system alerts
   */
  async createVerificationAlerts(): Promise<{ success: boolean; rules: string[] }> {
    const rules: string[] = [];

    try {
      // Alert: Verification success rate < 99.9%
      const verificationSuccess = await this.createAlertRule(
        'Verification Success Rate Critical',
        'verification.success_rate',
        99.9,
        30,
        `{{#is_alert}}
Verification success rate dropped below 99.9%!
Current: {{value}}%
Immediate investigation required
${this.notificationChannels.join(' ')}
{{/is_alert}}`
      );
      if (verificationSuccess.ruleId) {
rules.push(verificationSuccess.ruleId);
}

      logger.info('Verification alerts created', { count: rules.length });
      return { success: true, rules };
    } catch (error) {
      logger.error('Failed to create verification alerts', { error });
      return { success: false, rules };
    }
  }

  /**
   * Test alert notification
   */
  async testAlert(ruleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Mute alert temporarily to avoid spam
      await this.apiRequest(`/api/v1/monitor/${ruleId}/mute`, 'POST', {
        scope: `service:${this.serviceName}`,
      });

      // Trigger a test
      // Note: Datadog doesn't have a direct test endpoint, so we log it
      logger.info('Alert test triggered', { ruleId });

      // Unmute after 1 minute
      setTimeout(async () => {
        await this.apiRequest(`/api/v1/monitor/${ruleId}/unmute`, 'POST', {
          scope: `service:${this.serviceName}`,
        });
      }, 60000);

      return { success: true };
    } catch (error) {
      logger.error('Failed to test alert', { ruleId, error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * Make API request to Datadog
   */
  private async apiRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'DD-API-KEY': this.apiKey,
      'DD-APPLICATION-KEY': this.appKey,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Datadog API error: ${response.status} - ${error}`);
    }

    if (method === 'DELETE') {
      return {};
    }

    return await response.json();
  }

  /**
   * Build default alert message
   */
  private buildDefaultMessage(name: string, metric: string, threshold: number): string {
    return `{{#is_alert}}
Alert: ${name}
Metric: ${metric}
Threshold exceeded: {{value}} > ${threshold}
Service: ${this.serviceName}
Environment: ${this.environment}

${this.notificationChannels.join(' ')}
{{/is_alert}}

{{#is_recovery}}
Recovered: ${name}
Metric: ${metric}
Current value: {{value}}
{{/is_recovery}}`;
  }
}

// Initialize default instance
let alertsManager: DatadogAlerts | null = null;

/**
 * Initialize Datadog alerts manager
 */
export function initializeDatadogAlerts(
  apiKey?: string,
  appKey?: string,
  notificationChannels?: string[]
): DatadogAlerts {
  alertsManager = new DatadogAlerts(
    apiKey || process.env.DATADOG_API_KEY || '',
    appKey || process.env.DATADOG_APP_KEY || '',
    notificationChannels || []
  );

  return alertsManager;
}

/**
 * Get alerts manager instance
 */
export function getDatadogAlerts(): DatadogAlerts {
  if (!alertsManager) {
    throw new Error('Datadog alerts not initialized. Call initializeDatadogAlerts() first.');
  }
  return alertsManager;
}

export default DatadogAlerts;
