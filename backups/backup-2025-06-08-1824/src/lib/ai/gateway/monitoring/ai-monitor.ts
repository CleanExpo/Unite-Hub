/**
 * AI Monitor Implementation
 * Unite Group AI Gateway - Performance Monitoring and Metrics
 */

import {
  AIRequest,
  AIResponse,
  AIError,
  AIProvider,
  AIMetrics,
  AIUsage
} from '../types';

interface RequestMetric {
  id: string;
  provider: AIProvider;
  requestType: string;
  startTime: number;
  endTime?: number;
  responseTime?: number;
  success: boolean;
  error?: AIError;
  usage?: AIUsage;
  timestamp: string;
}

interface ProviderMetrics {
  provider: AIProvider;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  averageResponseTime: number;
  errorRate: number;
  totalTokensUsed: number;
  totalCost: number;
  lastRequestTime?: string;
}

export class AIMonitor {
  private metrics: Map<string, RequestMetric> = new Map();
  private providerMetrics: Map<AIProvider, ProviderMetrics> = new Map();
  private config: {
    enabled: boolean;
    retentionDays: number;
    healthCheckInterval: number;
  };
  private cleanupInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config?: {
    enabled?: boolean;
    metricsRetentionDays?: number;
    healthCheckIntervalSeconds?: number;
  }) {
    this.config = {
      enabled: config?.enabled ?? true,
      retentionDays: config?.metricsRetentionDays ?? 30,
      healthCheckInterval: (config?.healthCheckIntervalSeconds ?? 60) * 1000
    };

    if (this.config.enabled) {
      this.startCleanupTimer();
    }
  }

  /**
   * Record a request and its outcome
   */
  recordRequest(request: AIRequest, response: AIResponse | null, error: AIError | null): void {
    if (!this.config.enabled) return;

    const endTime = Date.now();
    const startTime = request.metadata?.startTime as number || endTime;
    const responseTime = endTime - startTime;

    const metric: RequestMetric = {
      id: request.id,
      provider: request.provider,
      requestType: request.type,
      startTime,
      endTime,
      responseTime,
      success: response !== null && error === null,
      error: error || undefined,
      usage: response?.usage,
      timestamp: new Date().toISOString()
    };

    this.metrics.set(request.id, metric);
    this.updateProviderMetrics(metric);
  }

  /**
   * Update provider-specific metrics
   */
  private updateProviderMetrics(metric: RequestMetric): void {
    let providerMetric = this.providerMetrics.get(metric.provider);
    
    if (!providerMetric) {
      providerMetric = {
        provider: metric.provider,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        errorRate: 0,
        totalTokensUsed: 0,
        totalCost: 0
      };
      this.providerMetrics.set(metric.provider, providerMetric);
    }

    // Update counts
    providerMetric.totalRequests++;
    providerMetric.lastRequestTime = metric.timestamp;

    if (metric.success) {
      providerMetric.successfulRequests++;
    } else {
      providerMetric.failedRequests++;
    }

    // Update response time
    if (metric.responseTime) {
      providerMetric.totalResponseTime += metric.responseTime;
      providerMetric.averageResponseTime = providerMetric.totalResponseTime / providerMetric.totalRequests;
    }

    // Update error rate
    providerMetric.errorRate = providerMetric.failedRequests / providerMetric.totalRequests;

    // Update usage and cost
    if (metric.usage) {
      providerMetric.totalTokensUsed += metric.usage.totalTokens;
      if (metric.usage.cost) {
        providerMetric.totalCost += metric.usage.cost;
      }
    }
  }

  /**
   * Get comprehensive metrics for a time range
   */
  getMetrics(timeRange?: { start: string; end: string }): AIMetrics {
    const startTime = timeRange?.start ? new Date(timeRange.start) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endTime = timeRange?.end ? new Date(timeRange.end) : new Date();

    const relevantMetrics = Array.from(this.metrics.values()).filter(metric => {
      const metricTime = new Date(metric.timestamp);
      return metricTime >= startTime && metricTime <= endTime;
    });

    const requestCount = relevantMetrics.length;
    const successCount = relevantMetrics.filter(m => m.success).length;
    const errorCount = requestCount - successCount;

    const totalResponseTime = relevantMetrics
      .filter(m => m.responseTime)
      .reduce((sum, m) => sum + (m.responseTime || 0), 0);
    
    const averageResponseTime = relevantMetrics.length > 0 ? totalResponseTime / relevantMetrics.length : 0;

    const totalTokensUsed = relevantMetrics
      .filter(m => m.usage)
      .reduce((sum, m) => sum + (m.usage?.totalTokens || 0), 0);

    const totalCost = relevantMetrics
      .filter(m => m.usage?.cost)
      .reduce((sum, m) => sum + (m.usage?.cost || 0), 0);

    // Provider distribution
    const providerDistribution: Record<AIProvider, number> = {} as Record<AIProvider, number>;
    for (const metric of relevantMetrics) {
      providerDistribution[metric.provider] = (providerDistribution[metric.provider] || 0) + 1;
    }

    // Request type distribution
    const requestTypeDistribution: Record<string, number> = {};
    for (const metric of relevantMetrics) {
      requestTypeDistribution[metric.requestType] = (requestTypeDistribution[metric.requestType] || 0) + 1;
    }

    // Error distribution
    const errorDistribution: Record<string, number> = {};
    for (const metric of relevantMetrics) {
      if (metric.error) {
        errorDistribution[metric.error.code] = (errorDistribution[metric.error.code] || 0) + 1;
      }
    }

    return {
      requestCount,
      successCount,
      errorCount,
      averageResponseTime,
      totalTokensUsed,
      totalCost,
      providerDistribution,
      requestTypeDistribution,
      errorDistribution,
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      }
    };
  }

  /**
   * Get usage statistics
   */
  getUsage(userId?: string, timeRange?: { start: string; end: string }): AIUsage {
    const startTime = timeRange?.start ? new Date(timeRange.start) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endTime = timeRange?.end ? new Date(timeRange.end) : new Date();

    const relevantMetrics = Array.from(this.metrics.values()).filter(metric => {
      const metricTime = new Date(metric.timestamp);
      return metricTime >= startTime && metricTime <= endTime && metric.usage;
    });

    // Filter by userId if provided
    if (userId) {
      // This would need to be implemented with user tracking
      // For now, return all metrics
    }

    const totalPromptTokens = relevantMetrics.reduce((sum, m) => sum + (m.usage?.promptTokens || 0), 0);
    const totalCompletionTokens = relevantMetrics.reduce((sum, m) => sum + (m.usage?.completionTokens || 0), 0);
    const totalTokens = totalPromptTokens + totalCompletionTokens;
    const totalCost = relevantMetrics.reduce((sum, m) => sum + (m.usage?.cost || 0), 0);

    return {
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      totalTokens,
      cost: totalCost,
      model: 'mixed' // Multiple models used
    };
  }

  /**
   * Get error rate for a specific provider
   */
  getErrorRate(provider: AIProvider): number {
    const providerMetric = this.providerMetrics.get(provider);
    return providerMetric?.errorRate || 0;
  }

  /**
   * Get provider performance summary
   */
  getProviderSummary(provider: AIProvider): ProviderMetrics | null {
    return this.providerMetrics.get(provider) || null;
  }

  /**
   * Get all provider summaries
   */
  getAllProviderSummaries(): ProviderMetrics[] {
    return Array.from(this.providerMetrics.values());
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10): Array<{ metric: RequestMetric; error: AIError }> {
    const errorMetrics = Array.from(this.metrics.values())
      .filter(m => m.error)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return errorMetrics.map(metric => ({
      metric,
      error: metric.error!
    }));
  }

  /**
   * Get slowest requests
   */
  getSlowestRequests(limit = 10): RequestMetric[] {
    return Array.from(this.metrics.values())
      .filter(m => m.responseTime)
      .sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0))
      .slice(0, limit);
  }

  /**
   * Get most expensive requests
   */
  getMostExpensiveRequests(limit = 10): RequestMetric[] {
    return Array.from(this.metrics.values())
      .filter(m => m.usage?.cost)
      .sort((a, b) => (b.usage?.cost || 0) - (a.usage?.cost || 0))
      .slice(0, limit);
  }

  /**
   * Get real-time statistics
   */
  getRealTimeStats(): {
    activeRequests: number;
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    currentCost: number;
  } {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const recentMetrics = Array.from(this.metrics.values()).filter(metric => {
      return new Date(metric.timestamp) >= oneMinuteAgo;
    });

    const activeRequests = recentMetrics.filter(m => !m.endTime).length;
    const requestsPerMinute = recentMetrics.length;
    const completedMetrics = recentMetrics.filter(m => m.endTime);
    
    const averageResponseTime = completedMetrics.length > 0 
      ? completedMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / completedMetrics.length
      : 0;

    const errorRate = recentMetrics.length > 0 
      ? recentMetrics.filter(m => !m.success).length / recentMetrics.length
      : 0;

    const currentCost = recentMetrics.reduce((sum, m) => sum + (m.usage?.cost || 0), 0);

    return {
      activeRequests,
      requestsPerMinute,
      averageResponseTime,
      errorRate,
      currentCost
    };
  }

  /**
   * Generate performance alerts
   */
  checkAlerts(): Array<{
    type: 'error_rate' | 'response_time' | 'cost' | 'provider_down';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    provider?: AIProvider;
    value: number;
    threshold: number;
  }> {
    const alerts: Array<{
      type: 'error_rate' | 'response_time' | 'cost' | 'provider_down';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      provider?: AIProvider;
      value: number;
      threshold: number;
    }> = [];

    // Check error rates
    for (const [provider, metrics] of this.providerMetrics.entries()) {
      if (metrics.errorRate > 0.5) {
        alerts.push({
          type: 'error_rate',
          severity: 'critical',
          message: `High error rate for ${provider}: ${(metrics.errorRate * 100).toFixed(1)}%`,
          provider,
          value: metrics.errorRate,
          threshold: 0.5
        });
      } else if (metrics.errorRate > 0.2) {
        alerts.push({
          type: 'error_rate',
          severity: 'high',
          message: `Elevated error rate for ${provider}: ${(metrics.errorRate * 100).toFixed(1)}%`,
          provider,
          value: metrics.errorRate,
          threshold: 0.2
        });
      }

      // Check response times
      if (metrics.averageResponseTime > 10000) { // 10 seconds
        alerts.push({
          type: 'response_time',
          severity: 'high',
          message: `Slow response time for ${provider}: ${metrics.averageResponseTime.toFixed(0)}ms`,
          provider,
          value: metrics.averageResponseTime,
          threshold: 10000
        });
      }
    }

    // Check recent cost spikes
    const recentCost = this.getRealTimeStats().currentCost;
    if (recentCost > 10) { // $10 per minute threshold
      alerts.push({
        type: 'cost',
        severity: 'medium',
        message: `High cost rate: $${recentCost.toFixed(2)} per minute`,
        value: recentCost,
        threshold: 10
      });
    }

    return alerts;
  }

  /**
   * Export metrics data
   */
  exportMetrics(): {
    metrics: RequestMetric[];
    providerSummaries: ProviderMetrics[];
    exportedAt: string;
    totalRecords: number;
  } {
    return {
      metrics: Array.from(this.metrics.values()),
      providerSummaries: Array.from(this.providerMetrics.values()),
      exportedAt: new Date().toISOString(),
      totalRecords: this.metrics.size
    };
  }

  /**
   * Import metrics data
   */
  importMetrics(data: {
    metrics: RequestMetric[];
    providerSummaries?: ProviderMetrics[];
  }): void {
    // Import individual metrics
    for (const metric of data.metrics) {
      this.metrics.set(metric.id, metric);
    }

    // Import or recalculate provider summaries
    if (data.providerSummaries) {
      for (const summary of data.providerSummaries) {
        this.providerMetrics.set(summary.provider, summary);
      }
    } else {
      // Recalculate provider metrics
      this.providerMetrics.clear();
      for (const metric of data.metrics) {
        this.updateProviderMetrics(metric);
      }
    }
  }

  /**
   * Clear old metrics based on retention policy
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    
    for (const [id, metric] of this.metrics.entries()) {
      if (new Date(metric.timestamp) < cutoffTime) {
        this.metrics.delete(id);
      }
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    // Clean up old metrics every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.providerMetrics.clear();
  }

  /**
   * Get monitoring configuration
   */
  getConfig(): typeof this.config {
    return { ...this.config };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(updates: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...updates };
    
    if (!this.config.enabled && this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    } else if (this.config.enabled && !this.cleanupInterval) {
      this.startCleanupTimer();
    }
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    this.metrics.clear();
    this.providerMetrics.clear();
  }
}

export default AIMonitor;
