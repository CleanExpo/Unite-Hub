/**
 * Datadog Client Wrapper
 * Provides efficient API client for sending metrics, events, and retrieving data
 */

import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'DatadogClient' });

interface DatadogMetric {
  metric: string;
  points: Array<[number, number]>; // [timestamp, value]
  type?: 'gauge' | 'count' | 'rate';
  tags?: string[];
  host?: string;
  interval?: number;
}

interface DatadogEvent {
  title: string;
  text: string;
  date_happened?: number; // Unix timestamp
  priority?: 'normal' | 'low';
  tags?: string[];
  alert_type?: 'info' | 'warning' | 'error' | 'success';
  aggregation_key?: string;
}

interface DatadogConfig {
  apiKey: string;
  appKey: string;
  site?: string; // Default: datadoghq.com
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
}

interface MetricQueryResponse {
  status: string;
  series: Array<{
    metric: string;
    points: Array<[number, number]>;
    tags: string[];
  }>;
}

export class DatadogClient {
  private config: Required<DatadogConfig>;
  private baseUrl: string;
  private metricsBatch: DatadogMetric[] = [];
  private batchSize = 100;
  private batchFlushInterval = 10000; // 10 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  private retryAttempts = 3;
  private retryDelay = 1000; // Start with 1 second

  constructor(config: DatadogConfig) {
    this.config = {
      apiKey: config.apiKey,
      appKey: config.appKey,
      site: config.site || 'datadoghq.com',
      serviceName: config.serviceName || 'unite-hub',
      serviceVersion: config.serviceVersion || '1.0.0',
      environment: config.environment || process.env.NODE_ENV || 'production',
    };

    this.baseUrl = `https://api.${this.config.site}`;

    // Start batch flush timer
    this.startBatchFlush();

    logger.info('Datadog client initialized', {
      service: this.config.serviceName,
      version: this.config.serviceVersion,
      environment: this.config.environment,
    });
  }

  /**
   * Send a single metric immediately
   */
  async sendMetric(
    metricName: string,
    value: number,
    tags: string[] = [],
    type: 'gauge' | 'count' | 'rate' = 'gauge'
  ): Promise<{ success: boolean; error?: string }> {
    const metric: DatadogMetric = {
      metric: metricName,
      points: [[Math.floor(Date.now() / 1000), value]],
      type,
      tags: this.normalizeTags([
        ...tags,
        `service:${this.config.serviceName}`,
        `version:${this.config.serviceVersion}`,
        `env:${this.config.environment}`,
      ]),
    };

    return this.sendMetricsNow([metric]);
  }

  /**
   * Queue metric for batch sending
   */
  queueMetric(
    metricName: string,
    value: number,
    tags: string[] = [],
    type: 'gauge' | 'count' | 'rate' = 'gauge'
  ): void {
    const metric: DatadogMetric = {
      metric: metricName,
      points: [[Math.floor(Date.now() / 1000), value]],
      type,
      tags: this.normalizeTags([
        ...tags,
        `service:${this.config.serviceName}`,
        `version:${this.config.serviceVersion}`,
        `env:${this.config.environment}`,
      ]),
    };

    this.metricsBatch.push(metric);

    // Auto-flush if batch is full
    if (this.metricsBatch.length >= this.batchSize) {
      this.flushMetrics().catch((error) => {
        logger.error('Failed to flush metrics batch', { error });
      });
    }
  }

  /**
   * Send multiple metrics in batch
   */
  async sendMetrics(metrics: DatadogMetric[]): Promise<{ success: boolean; error?: string }> {
    const normalizedMetrics = metrics.map((m) => ({
      ...m,
      tags: this.normalizeTags([
        ...(m.tags || []),
        `service:${this.config.serviceName}`,
        `version:${this.config.serviceVersion}`,
        `env:${this.config.environment}`,
      ]),
    }));

    return this.sendMetricsNow(normalizedMetrics);
  }

  /**
   * Create an event in Datadog timeline
   */
  async createEvent(
    title: string,
    text: string,
    tags: string[] = [],
    priority: 'normal' | 'low' = 'normal',
    alertType: 'info' | 'warning' | 'error' | 'success' = 'info'
  ): Promise<{ success: boolean; error?: string }> {
    const event: DatadogEvent = {
      title,
      text,
      date_happened: Math.floor(Date.now() / 1000),
      priority,
      alert_type: alertType,
      tags: this.normalizeTags([
        ...tags,
        `service:${this.config.serviceName}`,
        `env:${this.config.environment}`,
      ]),
    };

    return this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/api/v1/events`, {
        method: 'POST',
        headers: {
          'DD-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Datadog event creation failed: ${error}`);
      }

      logger.info('Event created in Datadog', { title, alertType });
      return { success: true };
    });
  }

  /**
   * Retrieve metric history
   */
  async getMetricHistory(
    metricName: string,
    hours: number = 24
  ): Promise<MetricQueryResponse | null> {
    const now = Math.floor(Date.now() / 1000);
    const from = now - hours * 3600;

    const query = `avg:${metricName}{service:${this.config.serviceName}}`;

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/query?from=${from}&to=${now}&query=${encodeURIComponent(query)}`,
        {
          headers: {
            'DD-API-KEY': this.config.apiKey,
            'DD-APPLICATION-KEY': this.config.appKey,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('Failed to retrieve metric history', { metricName, error });
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('Error retrieving metric history', { metricName, error });
      return null;
    }
  }

  /**
   * Flush queued metrics immediately
   */
  async flushMetrics(): Promise<void> {
    if (this.metricsBatch.length === 0) {
      return;
    }

    const batch = [...this.metricsBatch];
    this.metricsBatch = [];

    const result = await this.sendMetricsNow(batch);

    if (!result.success) {
      logger.error('Failed to flush metrics batch', {
        count: batch.length,
        error: result.error,
      });
      // Re-queue failed metrics
      this.metricsBatch.push(...batch);
    } else {
      logger.debug('Flushed metrics batch', { count: batch.length });
    }
  }

  /**
   * Shutdown client and flush remaining metrics
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flushMetrics();
    logger.info('Datadog client shutdown complete');
  }

  /**
   * Get batch queue status
   */
  getQueueStatus(): { queued: number; batchSize: number } {
    return {
      queued: this.metricsBatch.length,
      batchSize: this.batchSize,
    };
  }

  /**
   * Send metrics immediately with retry logic
   */
  private async sendMetricsNow(
    metrics: DatadogMetric[]
  ): Promise<{ success: boolean; error?: string }> {
    if (metrics.length === 0) {
      return { success: true };
    }

    return this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/api/v1/series`, {
        method: 'POST',
        headers: {
          'DD-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ series: metrics }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Datadog metrics submission failed: ${error}`);
      }

      return { success: true };
    });
  }

  /**
   * Retry logic with exponential backoff
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.retryAttempts) {
        logger.error('Max retry attempts reached', { attempt, error });
        return { success: false, error: String(error) } as T;
      }

      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      logger.warn('Retrying Datadog API call', { attempt, delay });

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.withRetry(fn, attempt + 1);
    }
  }

  /**
   * Normalize tags (lowercase, no spaces)
   */
  private normalizeTags(tags: string[]): string[] {
    return tags.map((tag) =>
      tag
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_:.-]/g, '')
    );
  }

  /**
   * Start automatic batch flushing
   */
  private startBatchFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushMetrics().catch((error) => {
        logger.error('Auto-flush failed', { error });
      });
    }, this.batchFlushInterval);
  }
}

// Singleton instance
let datadogClient: DatadogClient | null = null;

/**
 * Initialize Datadog client
 */
export function initializeDatadog(
  apiKey?: string,
  appKey?: string,
  serviceVersion?: string
): DatadogClient {
  const ddApiKey = apiKey || process.env.DATADOG_API_KEY;
  const ddAppKey = appKey || process.env.DATADOG_APP_KEY;

  if (!ddApiKey || !ddAppKey) {
    throw new Error('Datadog API key and App key are required');
  }

  datadogClient = new DatadogClient({
    apiKey: ddApiKey,
    appKey: ddAppKey,
    serviceVersion: serviceVersion || process.env.npm_package_version,
    environment: process.env.NODE_ENV || 'production',
  });

  return datadogClient;
}

/**
 * Get Datadog client instance
 */
export function getDatadogClient(): DatadogClient {
  if (!datadogClient) {
    throw new Error('Datadog client not initialized. Call initializeDatadog() first.');
  }
  return datadogClient;
}

export default DatadogClient;
