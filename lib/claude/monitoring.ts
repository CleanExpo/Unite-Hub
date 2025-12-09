// Monitoring and error tracking for Claude AI integration

export interface AIMetrics {
  endpoint: string;
  duration: number;
  tokens?: number;
  success: boolean;
  error?: string;
  timestamp: Date;
  model: string;
  metadata?: Record<string, any>;
}

export class AIMonitor {
  private metrics: AIMetrics[] = [];
  private maxMetrics: number = 1000;

  // Log a request
  logRequest(metric: Omit<AIMetrics, 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      timestamp: new Date(),
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log to console if enabled
    if (this.shouldLog()) {
      this.logToConsole(metric);
    }
  }

  // Get metrics for a specific endpoint
  getEndpointMetrics(endpoint: string): AIMetrics[] {
    return this.metrics.filter((m) => m.endpoint === endpoint);
  }

  // Get average response time
  getAverageResponseTime(endpoint?: string): number {
    const relevantMetrics = endpoint
      ? this.getEndpointMetrics(endpoint)
      : this.metrics;

    if (relevantMetrics.length === 0) {
return 0;
}

    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / relevantMetrics.length;
  }

  // Get success rate
  getSuccessRate(endpoint?: string): number {
    const relevantMetrics = endpoint
      ? this.getEndpointMetrics(endpoint)
      : this.metrics;

    if (relevantMetrics.length === 0) {
return 0;
}

    const successful = relevantMetrics.filter((m) => m.success).length;
    return (successful / relevantMetrics.length) * 100;
  }

  // Get error rate
  getErrorRate(endpoint?: string): number {
    return 100 - this.getSuccessRate(endpoint);
  }

  // Get recent errors
  getRecentErrors(limit: number = 10): AIMetrics[] {
    return this.metrics
      .filter((m) => !m.success)
      .slice(-limit)
      .reverse();
  }

  // Get total token usage (approximate)
  getTotalTokens(endpoint?: string): number {
    const relevantMetrics = endpoint
      ? this.getEndpointMetrics(endpoint)
      : this.metrics;

    return relevantMetrics.reduce((sum, m) => sum + (m.tokens || 0), 0);
  }

  // Get metrics summary
  getSummary(): {
    totalRequests: number;
    successRate: number;
    errorRate: number;
    avgResponseTime: number;
    totalTokens: number;
    byEndpoint: Record<string, {
      requests: number;
      successRate: number;
      avgResponseTime: number;
    }>;
  } {
    const endpoints = [...new Set(this.metrics.map((m) => m.endpoint))];

    const byEndpoint: Record<string, any> = {};
    endpoints.forEach((endpoint) => {
      const endpointMetrics = this.getEndpointMetrics(endpoint);
      byEndpoint[endpoint] = {
        requests: endpointMetrics.length,
        successRate: this.getSuccessRate(endpoint),
        avgResponseTime: this.getAverageResponseTime(endpoint),
      };
    });

    return {
      totalRequests: this.metrics.length,
      successRate: this.getSuccessRate(),
      errorRate: this.getErrorRate(),
      avgResponseTime: this.getAverageResponseTime(),
      totalTokens: this.getTotalTokens(),
      byEndpoint,
    };
  }

  // Clear metrics
  clear(): void {
    this.metrics = [];
  }

  // Export metrics
  export(): AIMetrics[] {
    return [...this.metrics];
  }

  // Import metrics
  import(metrics: AIMetrics[]): void {
    this.metrics = metrics.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  }

  // Private helper methods
  private shouldLog(): boolean {
    return process.env.CLAUDE_ENABLE_LOGGING !== 'false';
  }

  private logToConsole(metric: Omit<AIMetrics, 'timestamp'>): void {
    const emoji = metric.success ? '✓' : '✗';
    const color = metric.success ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(
      `${color}${emoji}${reset} [Claude AI] ${metric.endpoint} - ${metric.duration}ms ${
        metric.error ? `- ${metric.error}` : ''
      }`
    );
  }
}

// Global monitor instance
export const aiMonitor = new AIMonitor();

// Performance tracking decorator
export function trackPerformance<T extends (...args: any[]) => Promise<any>>(
  endpoint: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;

    try {
      const result = await fn(...args);
      success = true;
      return result;
    } catch (err: any) {
      error = err.message;
      throw err;
    } finally {
      const duration = Date.now() - startTime;

      aiMonitor.logRequest({
        endpoint,
        duration,
        success,
        error,
        model: 'claude-sonnet-4-5-20250929',
      });
    }
  }) as T;
}

// Error logger
export class ErrorLogger {
  private errors: Array<{
    error: Error;
    context: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }> = [];
  private maxErrors: number = 100;

  log(error: Error, context: string, metadata?: Record<string, any>): void {
    this.errors.push({
      error,
      context,
      timestamp: new Date(),
      metadata,
    });

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console
    console.error(`[Claude AI Error] ${context}:`, error.message);

    // Report to error tracking service if enabled
    if (this.shouldReport()) {
      this.reportError(error, context, metadata);
    }
  }

  getRecentErrors(limit: number = 10): typeof this.errors {
    return this.errors.slice(-limit).reverse();
  }

  getErrorsByContext(context: string): typeof this.errors {
    return this.errors.filter((e) => e.context === context);
  }

  clear(): void {
    this.errors = [];
  }

  private shouldReport(): boolean {
    return (
      process.env.NODE_ENV === 'production' &&
      process.env.CLAUDE_REPORT_ERRORS !== 'false'
    );
  }

  private reportError(
    error: Error,
    context: string,
    metadata?: Record<string, any>
  ): void {
    // Implement error reporting to your service here
    // Example: Sentry, Bugsnag, etc.
    console.log('Reporting error to tracking service:', {
      error: error.message,
      context,
      metadata,
    });
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

// Usage tracking
export class UsageTracker {
  private usage: Array<{
    feature: string;
    user?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }> = [];

  track(
    feature: string,
    user?: string,
    metadata?: Record<string, any>
  ): void {
    this.usage.push({
      feature,
      user,
      timestamp: new Date(),
      metadata,
    });
  }

  getUsageByFeature(feature: string): number {
    return this.usage.filter((u) => u.feature === feature).length;
  }

  getUsageByUser(user: string): typeof this.usage {
    return this.usage.filter((u) => u.user === user);
  }

  getMostUsedFeatures(limit: number = 5): Array<{ feature: string; count: number }> {
    const counts: Record<string, number> = {};

    this.usage.forEach((u) => {
      counts[u.feature] = (counts[u.feature] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  clear(): void {
    this.usage = [];
  }
}

// Global usage tracker instance
export const usageTracker = new UsageTracker();

// Health check
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: {
    successRate: number;
    avgResponseTime: number;
    recentErrors: number;
  };
}> {
  const summary = aiMonitor.getSummary();
  const recentErrors = aiMonitor.getRecentErrors(10).length;

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (summary.successRate < 50 || summary.avgResponseTime > 30000) {
    status = 'unhealthy';
  } else if (summary.successRate < 80 || summary.avgResponseTime > 10000) {
    status = 'degraded';
  }

  return {
    status,
    metrics: {
      successRate: summary.successRate,
      avgResponseTime: summary.avgResponseTime,
      recentErrors,
    },
  };
}
