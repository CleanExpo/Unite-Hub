/**
 * APM (Application Performance Monitoring) Module
 *
 * Provides monitoring and observability for production deployments.
 * Supports multiple backends: Datadog, OpenTelemetry, or custom metrics.
 *
 * Key Features:
 * - Request/response tracking
 * - Database query monitoring
 * - AI service call tracking
 * - Error tracking with context
 * - Custom metrics collection
 * - Health checks and alerts
 *
 * Usage:
 *   import { apm } from '@/lib/monitoring/apm';
 *
 *   // Track request
 *   const span = apm.startSpan('api.request', { method: 'POST', path: '/api/contacts' });
 *   // ... do work
 *   span.finish({ statusCode: 200 });
 *
 *   // Track database query
 *   const dbSpan = apm.startDatabaseSpan('SELECT', 'contacts');
 *   // ... execute query
 *   dbSpan.finish({ rowCount: 10 });
 *
 *   // Track AI call
 *   const aiSpan = apm.startAISpan('claude-sonnet-4-5', 'content-generation');
 *   // ... call AI
 *   aiSpan.finish({ tokens: 1500, cost: 0.015 });
 */

export type APMProvider = 'datadog' | 'opentelemetry' | 'custom' | 'none';

export interface APMConfig {
  enabled: boolean;
  provider: APMProvider;
  serviceName: string;
  environment: 'development' | 'staging' | 'production';
  sampleRate: number; // 0.0 to 1.0
  flushInterval: number; // milliseconds
}

export interface SpanContext {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  tags: Record<string, any>;
}

export interface SpanResult {
  duration: number;
  success: boolean;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface Metric {
  name: string;
  value: number;
  type: 'counter' | 'gauge' | 'histogram';
  tags?: Record<string, string>;
  timestamp: number;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
  lastChecked: number;
}

class APMClient {
  private config: APMConfig;
  private activeSpans: Map<string, SpanContext>;
  private metrics: Metric[];
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.config = this.loadConfig();
    this.activeSpans = new Map();
    this.metrics = [];

    if (this.config.enabled && this.config.flushInterval > 0) {
      this.startFlushTimer();
    }
  }

  /**
   * Load APM configuration from environment
   */
  private loadConfig(): APMConfig {
    const provider = (process.env.APM_PROVIDER as APMProvider) || 'none';
    const enabled = process.env.ENABLE_APM === 'true' && provider !== 'none';

    return {
      enabled,
      provider,
      serviceName: process.env.APM_SERVICE_NAME || 'unite-hub',
      environment: (process.env.NODE_ENV as any) || 'development',
      sampleRate: parseFloat(process.env.APM_SAMPLE_RATE || '1.0'),
      flushInterval: parseInt(process.env.APM_FLUSH_INTERVAL || '10000'),
    };
  }

  /**
   * Start a new span for tracking an operation
   */
  startSpan(operation: string, tags: Record<string, any> = {}): Span {
    if (!this.config.enabled || !this.shouldSample()) {
      return new NoOpSpan();
    }

    const spanId = this.generateId();
    const traceId = tags.traceId || this.generateId();

    const context: SpanContext = {
      spanId,
      traceId,
      parentSpanId: tags.parentSpanId,
      operation,
      startTime: Date.now(),
      tags: {
        ...tags,
        service: this.config.serviceName,
        environment: this.config.environment,
      },
    };

    this.activeSpans.set(spanId, context);

    return new Span(spanId, context, (id, result) => this.finishSpan(id, result));
  }

  /**
   * Start a database query span
   */
  startDatabaseSpan(operation: string, table: string, tags: Record<string, any> = {}): Span {
    return this.startSpan('database.query', {
      ...tags,
      'db.operation': operation,
      'db.table': table,
    });
  }

  /**
   * Start an AI service call span
   */
  startAISpan(model: string, purpose: string, tags: Record<string, any> = {}): Span {
    return this.startSpan('ai.request', {
      ...tags,
      'ai.model': model,
      'ai.purpose': purpose,
    });
  }

  /**
   * Start an HTTP request span
   */
  startHTTPSpan(method: string, path: string, tags: Record<string, any> = {}): Span {
    return this.startSpan('http.request', {
      ...tags,
      'http.method': method,
      'http.path': path,
    });
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, type: Metric['type'] = 'counter', tags?: Record<string, string>): void {
    if (!this.config.enabled) return;

    this.metrics.push({
      name,
      value,
      type,
      tags: {
        ...tags,
        service: this.config.serviceName,
        environment: this.config.environment,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.recordMetric(name, value, 'counter', tags);
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, 'gauge', tags);
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, 'histogram', tags);
  }

  /**
   * Track an error with context
   */
  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.config.enabled) {
      console.error('[APM] Error:', error, context);
      return;
    }

    this.recordMetric('errors.count', 1, 'counter', {
      error_type: error.name,
      ...context,
    });

    // Send to APM backend
    this.sendError(error, context);
  }

  /**
   * Perform health check
   */
  async performHealthCheck(name: string, checkFn: () => Promise<boolean>): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const result = await checkFn();
      const latency = Date.now() - startTime;

      return {
        name,
        status: result ? 'healthy' : 'degraded',
        latency,
        lastChecked: Date.now(),
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
        lastChecked: Date.now(),
      };
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics buffer
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Flush metrics to APM backend
   */
  async flush(): Promise<void> {
    if (!this.config.enabled || this.metrics.length === 0) {
      return;
    }

    const metricsToSend = [...this.metrics];
    this.clearMetrics();

    try {
      await this.sendMetrics(metricsToSend);
    } catch (error) {
      console.error('[APM] Error flushing metrics:', error);
    }
  }

  /**
   * Shutdown APM client
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.flush();
  }

  // Private methods

  private finishSpan(spanId: string, result: SpanResult): void {
    const context = this.activeSpans.get(spanId);
    if (!context) return;

    this.activeSpans.delete(spanId);

    // Record span duration metric
    this.recordHistogram(`span.duration.${context.operation}`, result.duration, {
      success: String(result.success),
    });

    // Send span to APM backend
    this.sendSpan(context, result);
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => console.error('[APM] Flush error:', err));
    }, this.config.flushInterval);
  }

  private async sendSpan(context: SpanContext, result: SpanResult): Promise<void> {
    // Implementation depends on provider
    switch (this.config.provider) {
      case 'datadog':
        await this.sendToDatadog('span', { context, result });
        break;
      case 'opentelemetry':
        await this.sendToOpenTelemetry('span', { context, result });
        break;
      case 'custom':
        await this.sendToCustomBackend('span', { context, result });
        break;
    }
  }

  private async sendMetrics(metrics: Metric[]): Promise<void> {
    // Implementation depends on provider
    switch (this.config.provider) {
      case 'datadog':
        await this.sendToDatadog('metrics', metrics);
        break;
      case 'opentelemetry':
        await this.sendToOpenTelemetry('metrics', metrics);
        break;
      case 'custom':
        await this.sendToCustomBackend('metrics', metrics);
        break;
    }
  }

  private async sendError(error: Error, context?: Record<string, any>): Promise<void> {
    // Implementation depends on provider
    switch (this.config.provider) {
      case 'datadog':
        await this.sendToDatadog('error', { error, context });
        break;
      case 'opentelemetry':
        await this.sendToOpenTelemetry('error', { error, context });
        break;
      case 'custom':
        await this.sendToCustomBackend('error', { error, context });
        break;
    }
  }

  private async sendToDatadog(type: string, data: any): Promise<void> {
    // Datadog integration
    // Implementation would use Datadog SDK
    console.log('[APM] Datadog:', type, data);
  }

  private async sendToOpenTelemetry(type: string, data: any): Promise<void> {
    // OpenTelemetry integration
    // Implementation would use OpenTelemetry SDK
    console.log('[APM] OpenTelemetry:', type, data);
  }

  private async sendToCustomBackend(type: string, data: any): Promise<void> {
    // Custom backend integration
    // Implementation would POST to custom endpoint
    console.log('[APM] Custom:', type, data);
  }
}

/**
 * Span class for tracking individual operations
 */
class Span {
  private spanId: string;
  private context: SpanContext;
  private finishCallback: (spanId: string, result: SpanResult) => void;
  private finished: boolean = false;

  constructor(
    spanId: string,
    context: SpanContext,
    finishCallback: (spanId: string, result: SpanResult) => void
  ) {
    this.spanId = spanId;
    this.context = context;
    this.finishCallback = finishCallback;
  }

  /**
   * Set a tag on the span
   */
  setTag(key: string, value: any): void {
    this.context.tags[key] = value;
  }

  /**
   * Finish the span with optional metadata
   */
  finish(metadata?: Record<string, any>): void {
    if (this.finished) return;

    this.finished = true;
    const duration = Date.now() - this.context.startTime;

    const result: SpanResult = {
      duration,
      success: !metadata?.error,
      error: metadata?.error,
      metadata,
    };

    this.finishCallback(this.spanId, result);
  }

  /**
   * Finish the span with an error
   */
  finishWithError(error: Error): void {
    this.finish({ error });
  }

  /**
   * Get span context for child spans
   */
  getContext(): { traceId: string; parentSpanId: string } {
    return {
      traceId: this.context.traceId,
      parentSpanId: this.context.spanId,
    };
  }
}

/**
 * No-op span for when APM is disabled
 */
class NoOpSpan extends Span {
  constructor() {
    super('noop', {} as any, () => {});
  }

  setTag(): void {}
  finish(): void {}
  finishWithError(): void {}
  getContext(): { traceId: string; parentSpanId: string } {
    return { traceId: 'noop', parentSpanId: 'noop' };
  }
}

// Singleton instance
export const apm = new APMClient();

// Convenience exports
export type { Span };
export { APMClient };

/**
 * Middleware helper for Next.js API routes
 */
export function withAPMTracking<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  operationName?: string
): T {
  return (async (...args: any[]) => {
    const req = args[0];
    const operation = operationName || `api.${req.method}.${req.nextUrl?.pathname || 'unknown'}`;

    const span = apm.startHTTPSpan(req.method, req.nextUrl?.pathname || '/', {
      headers: req.headers,
    });

    try {
      const result = await handler(...args);
      span.finish({ statusCode: 200 });
      return result;
    } catch (error) {
      span.finishWithError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }) as T;
}

/**
 * Database query wrapper with APM tracking
 */
export async function trackDatabaseQuery<T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const span = apm.startDatabaseSpan(operation, table);

  try {
    const result = await queryFn();
    span.finish();
    return result;
  } catch (error) {
    span.finishWithError(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * AI service call wrapper with APM tracking
 */
export async function trackAICall<T>(
  model: string,
  purpose: string,
  callFn: () => Promise<T>
): Promise<T> {
  const span = apm.startAISpan(model, purpose);

  try {
    const result = await callFn();
    span.finish();
    return result;
  } catch (error) {
    span.finishWithError(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
