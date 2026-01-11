/**
 * Metrics Exporter to Datadog
 *
 * This module exports application metrics to Datadog for monitoring:
 * - HTTP request metrics (latency, status codes, throughput)
 * - Database query metrics (execution time, connection pool)
 * - Cache metrics (hit rate, miss rate)
 * - AI token usage and cost tracking
 * - Custom business metrics
 * - SLA tracking (latency percentiles)
 * - Error rates per endpoint
 *
 * @module lib/apm/metrics-exporter
 */

 


// ============================================================================
// TYPES
// ============================================================================

export interface MetricPoint {
  metric: string;
  points: Array<[number, number]>; // [timestamp, value]
  type: 'gauge' | 'count' | 'rate' | 'histogram';
  tags?: string[];
  host?: string;
  interval?: number;
}

export interface MetricsSeries {
  series: MetricPoint[];
}

export interface HttpMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
}

export interface DatabaseMetrics {
  operation: string;
  table: string;
  duration: number;
  rowCount?: number;
  timestamp: number;
}

export interface CacheMetrics {
  operation: 'hit' | 'miss' | 'set' | 'delete';
  key: string;
  duration: number;
  timestamp: number;
}

export interface AITokenMetrics {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  operation: string;
  timestamp: number;
}

export interface BusinessMetric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

// ============================================================================
// METRICS EXPORTER CLASS
// ============================================================================

class MetricsExporter {
  private static instance: MetricsExporter;
  private apiKey: string | null = null;
  private apiUrl = 'https://api.datadoghq.com';
  private enabled = false;
  private batchSize = 100;
  private flushInterval = 10000; // 10 seconds
  private metricsQueue: MetricPoint[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): MetricsExporter {
    if (!MetricsExporter.instance) {
      MetricsExporter.instance = new MetricsExporter();
    }
    return MetricsExporter.instance;
  }

  /**
   * Initialize metrics exporter
   */
  public initialize(apiKey: string, options?: { apiUrl?: string; batchSize?: number }): void {
    this.apiKey = apiKey;
    this.enabled = true;

    if (options?.apiUrl) {
      this.apiUrl = options.apiUrl;
    }

    if (options?.batchSize) {
      this.batchSize = options.batchSize;
    }

    // Start periodic flush
    this.startFlushTimer();

    console.log('[MetricsExporter] Initialized successfully');
  }

  /**
   * Check if metrics exporter is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        console.error('[MetricsExporter] Failed to flush metrics:', error);
      });
    }, this.flushInterval);
  }

  /**
   * Stop flush timer
   */
  public stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Export HTTP request metrics
   */
  public exportHttpMetrics(metrics: HttpMetrics): void {
    if (!this.enabled) {
return;
}

    const tags = [
      `method:${metrics.method}`,
      `path:${metrics.path}`,
      `status:${metrics.statusCode}`,
      `status_class:${Math.floor(metrics.statusCode / 100)}xx`,
    ];

    // Request duration histogram
    this.addMetric({
      metric: 'unite_hub.http.request.duration',
      points: [[metrics.timestamp, metrics.duration]],
      type: 'histogram',
      tags,
    });

    // Request count
    this.addMetric({
      metric: 'unite_hub.http.request.count',
      points: [[metrics.timestamp, 1]],
      type: 'count',
      tags,
    });

    // Error count (if status >= 400)
    if (metrics.statusCode >= 400) {
      this.addMetric({
        metric: 'unite_hub.http.request.errors',
        points: [[metrics.timestamp, 1]],
        type: 'count',
        tags,
      });
    }
  }

  /**
   * Export database query metrics
   */
  public exportDatabaseMetrics(metrics: DatabaseMetrics): void {
    if (!this.enabled) {
return;
}

    const tags = [
      `operation:${metrics.operation}`,
      `table:${metrics.table}`,
    ];

    // Query duration histogram
    this.addMetric({
      metric: 'unite_hub.database.query.duration',
      points: [[metrics.timestamp, metrics.duration]],
      type: 'histogram',
      tags,
    });

    // Query count
    this.addMetric({
      metric: 'unite_hub.database.query.count',
      points: [[metrics.timestamp, 1]],
      type: 'count',
      tags,
    });

    // Row count (if available)
    if (metrics.rowCount !== undefined) {
      this.addMetric({
        metric: 'unite_hub.database.query.rows',
        points: [[metrics.timestamp, metrics.rowCount]],
        type: 'gauge',
        tags,
      });
    }
  }

  /**
   * Export cache metrics
   */
  public exportCacheMetrics(metrics: CacheMetrics): void {
    if (!this.enabled) {
return;
}

    const tags = [
      `operation:${metrics.operation}`,
    ];

    // Cache operation duration
    this.addMetric({
      metric: 'unite_hub.cache.operation.duration',
      points: [[metrics.timestamp, metrics.duration]],
      type: 'histogram',
      tags,
    });

    // Cache hit/miss count
    if (metrics.operation === 'hit' || metrics.operation === 'miss') {
      this.addMetric({
        metric: `unite_hub.cache.${metrics.operation}`,
        points: [[metrics.timestamp, 1]],
        type: 'count',
        tags,
      });

      // Calculate hit rate
      this.addMetric({
        metric: 'unite_hub.cache.hit_rate',
        points: [[metrics.timestamp, metrics.operation === 'hit' ? 1 : 0]],
        type: 'rate',
        tags,
      });
    }
  }

  /**
   * Export AI token usage metrics
   */
  public exportAITokenMetrics(metrics: AITokenMetrics): void {
    if (!this.enabled) {
return;
}

    const tags = [
      `model:${metrics.model}`,
      `operation:${metrics.operation}`,
    ];

    // Input tokens
    this.addMetric({
      metric: 'unite_hub.ai.tokens.input',
      points: [[metrics.timestamp, metrics.inputTokens]],
      type: 'count',
      tags,
    });

    // Output tokens
    this.addMetric({
      metric: 'unite_hub.ai.tokens.output',
      points: [[metrics.timestamp, metrics.outputTokens]],
      type: 'count',
      tags,
    });

    // Total tokens
    this.addMetric({
      metric: 'unite_hub.ai.tokens.total',
      points: [[metrics.timestamp, metrics.inputTokens + metrics.outputTokens]],
      type: 'count',
      tags,
    });

    // Cost
    this.addMetric({
      metric: 'unite_hub.ai.cost',
      points: [[metrics.timestamp, metrics.cost]],
      type: 'count',
      tags,
    });
  }

  /**
   * Export custom business metric
   */
  public exportBusinessMetric(metric: BusinessMetric): void {
    if (!this.enabled) {
return;
}

    const tags = Object.entries(metric.tags).map(([key, value]) => `${key}:${value}`);

    this.addMetric({
      metric: `unite_hub.business.${metric.name}`,
      points: [[metric.timestamp, metric.value]],
      type: 'gauge',
      tags,
    });
  }

  /**
   * Export SLA latency percentile
   */
  public exportLatencyPercentile(
    endpoint: string,
    percentile: number,
    value: number,
    timestamp: number
  ): void {
    if (!this.enabled) {
return;
}

    const tags = [
      `endpoint:${endpoint}`,
      `percentile:p${percentile}`,
    ];

    this.addMetric({
      metric: 'unite_hub.sla.latency',
      points: [[timestamp, value]],
      type: 'gauge',
      tags,
    });
  }

  /**
   * Export error rate per endpoint
   */
  public exportErrorRate(
    endpoint: string,
    errorRate: number,
    timestamp: number
  ): void {
    if (!this.enabled) {
return;
}

    const tags = [`endpoint:${endpoint}`];

    this.addMetric({
      metric: 'unite_hub.errors.rate',
      points: [[timestamp, errorRate]],
      type: 'rate',
      tags,
    });
  }

  /**
   * Add metric to queue
   */
  private addMetric(metric: MetricPoint): void {
    this.metricsQueue.push(metric);

    // Flush if queue exceeds batch size
    if (this.metricsQueue.length >= this.batchSize) {
      this.flush().catch((error) => {
        console.error('[MetricsExporter] Failed to flush metrics:', error);
      });
    }
  }

  /**
   * Flush metrics to Datadog
   */
  public async flush(): Promise<void> {
    if (!this.enabled || !this.apiKey || this.metricsQueue.length === 0) {
      return;
    }

    const metricsToSend = this.metricsQueue.splice(0, this.batchSize);

    try {
      const response = await fetch(`${this.apiUrl}/api/v1/series`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          series: metricsToSend,
        } as MetricsSeries),
      });

      if (!response.ok) {
        throw new Error(`Failed to send metrics: ${response.status} ${response.statusText}`);
      }

      console.debug(`[MetricsExporter] Sent ${metricsToSend.length} metrics to Datadog`);
    } catch (error) {
      console.error('[MetricsExporter] Failed to send metrics:', error);
      // Re-add metrics to queue for retry
      this.metricsQueue.unshift(...metricsToSend);
    }
  }

  /**
   * Get queue size
   */
  public getQueueSize(): number {
    return this.metricsQueue.length;
  }

  /**
   * Clear queue
   */
  public clearQueue(): void {
    this.metricsQueue = [];
  }

  /**
   * Shutdown exporter
   */
  public async shutdown(): Promise<void> {
    this.stopFlushTimer();
    await this.flush();
    this.enabled = false;
    console.log('[MetricsExporter] Shutdown complete');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const metricsExporter = MetricsExporter.getInstance();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Initialize metrics exporter with environment configuration
 */
export function initializeMetricsExporter(): void {
  const apiKey = process.env.DATADOG_API_KEY;

  if (!apiKey) {
    console.warn('[MetricsExporter] DATADOG_API_KEY not set - metrics export disabled');
    return;
  }

  metricsExporter.initialize(apiKey, {
    apiUrl: process.env.DATADOG_API_URL,
    batchSize: parseInt(process.env.DATADOG_METRICS_BATCH_SIZE || '100', 10),
  });
}

/**
 * Track API endpoint performance
 */
export function trackApiPerformance(
  method: string,
  path: string,
  statusCode: number,
  duration: number
): void {
  metricsExporter.exportHttpMetrics({
    method,
    path,
    statusCode,
    duration,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(
  operation: string,
  table: string,
  duration: number,
  rowCount?: number
): void {
  metricsExporter.exportDatabaseMetrics({
    operation,
    table,
    duration,
    rowCount,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Track cache operation
 */
export function trackCacheOperation(
  operation: 'hit' | 'miss' | 'set' | 'delete',
  key: string,
  duration: number
): void {
  metricsExporter.exportCacheMetrics({
    operation,
    key,
    duration,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Track AI token usage
 */
export function trackAITokens(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cost: number,
  operation: string
): void {
  metricsExporter.exportAITokenMetrics({
    model,
    inputTokens,
    outputTokens,
    cost,
    operation,
    timestamp: Date.now() / 1000,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default metricsExporter;
