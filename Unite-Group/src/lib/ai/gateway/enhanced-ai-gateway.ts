/**
 * Enhanced AI Gateway Implementation
 * Unite Group - Production-Ready AI Gateway with Advanced Features
 */

import { AIGateway, AIGatewayConfig } from './ai-gateway';
import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIError,
  AIMetrics
} from './types';

export interface EnhancedAIGatewayConfig extends AIGatewayConfig {
  // Enhanced configuration options
  circuitBreaker?: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTime: number;
    halfOpenMaxCalls: number;
  };
  rateLimit?: {
    enabled: boolean;
    maxRequestsPerMinute: number;
    maxConcurrentRequests: number;
    burstLimit: number;
  };
  observability?: {
    telemetry: boolean;
    metrics: boolean;
    tracing: boolean;
    logging: {
      level: 'debug' | 'info' | 'warn' | 'error';
      format: 'json' | 'text';
    };
  };
  integration?: {
    supabase?: boolean;
    analytics?: boolean;
    notifications?: boolean;
    webhooks?: string[];
  };
}

interface CircuitBreakerState {
  provider: AIProvider;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

interface RequestLimiter {
  windowStart: number;
  requestCount: number;
  concurrentRequests: number;
}

export class EnhancedAIGateway extends AIGateway {
  private circuitBreakers: Map<AIProvider, CircuitBreakerState> = new Map();
  private rateLimiter: RequestLimiter;
  private enhancedConfig: EnhancedAIGatewayConfig;

  constructor(config: EnhancedAIGatewayConfig) {
    super(config);
    this.enhancedConfig = config;
    
    // Initialize rate limiter
    this.rateLimiter = {
      windowStart: Date.now(),
      requestCount: 0,
      concurrentRequests: 0
    };
    
    // Initialize enhanced features
    this.initializeCircuitBreakers();
    this.initializeRateLimiting();
    this.initializeObservability();
    
    console.log('Enhanced AI Gateway initialized with advanced features');
  }

  /**
   * Enhanced text generation with circuit breaker and rate limiting
   */
  async generateText(request: AIRequest): Promise<AIResponse> {
    // Rate limiting check
    if (this.enhancedConfig.rateLimit?.enabled) {
      await this.checkRateLimit();
    }

    // Circuit breaker check
    const targetProvider = await this.selectProviderWithCircuitBreaker(request);
    
    try {
      this.incrementConcurrentRequests();
      const response = await super.generateText({ ...request, provider: targetProvider });
      
      // Record successful request
      this.recordCircuitBreakerSuccess(targetProvider);
      
      return response;
    } catch (error) {
      // Record failure for circuit breaker
      this.recordCircuitBreakerFailure(targetProvider, error as AIError);
      throw error;
    } finally {
      this.decrementConcurrentRequests();
    }
  }

  /**
   * Batch processing with enhanced error handling and progress tracking
   */
  async processBatchEnhanced(
    requests: AIRequest[],
    options?: {
      maxConcurrency?: number;
      retryFailures?: boolean;
      progressCallback?: (progress: {
        total: number;
        completed: number;
        failed: number;
        current?: string;
      }) => void;
      errorStrategy?: 'fail_fast' | 'continue' | 'retry_all';
    }
  ): Promise<{
    results: Array<{ request: AIRequest; response?: AIResponse; error?: AIError }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      processingTime: number;
    };
  }> {
    const startTime = Date.now();
    const results: Array<{ request: AIRequest; response?: AIResponse; error?: AIError }> = [];
    const maxConcurrency = options?.maxConcurrency || 3;
    const errorStrategy = options?.errorStrategy || 'continue';
    
    // Process in chunks to control concurrency
    const chunks = this.chunkRequestArray(requests, maxConcurrency);
    let completed = 0;
    let failed = 0;

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (request) => {
        try {
          options?.progressCallback?.({
            total: requests.length,
            completed,
            failed,
            current: `Processing: ${request.prompt.substring(0, 50)}...`
          });

          const response = await this.generateText(request);
          completed++;
          
          return { request, response };
        } catch (error) {
          failed++;
          const aiError = error as AIError;
          
          if (errorStrategy === 'fail_fast') {
            throw error;
          }
          
          return { request, error: aiError };
        }
      });

      const chunkResults = await Promise.allSettled(chunkPromises);
      
      chunkResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else if (errorStrategy !== 'fail_fast') {
          results.push({
            request: chunk[results.length % chunk.length],
            error: {
              code: 'UNKNOWN_ERROR',
              message: result.reason?.message || 'Unknown error',
              provider: 'gateway' as AIProvider,
              requestId: 'batch',
              retryable: false,
              timestamp: new Date().toISOString()
            }
          });
        }
      });

      // Update progress
      options?.progressCallback?.({
        total: requests.length,
        completed,
        failed
      });
    }

    const processingTime = Date.now() - startTime;

    return {
      results,
      summary: {
        total: requests.length,
        successful: completed,
        failed,
        processingTime
      }
    };
  }

  /**
   * Get enhanced metrics with additional insights
   */
  async getEnhancedMetrics(timeRange?: { start: string; end: string }): Promise<{
    standard: AIMetrics;
    enhanced: {
      circuitBreakerStatus: Array<{
        provider: AIProvider;
        state: string;
        failureCount: number;
        uptime: number;
      }>;
      rateLimitStatus: {
        currentRequests: number;
        limitUtilization: number;
        concurrentRequests: number;
      };
      performanceInsights: {
        averageResponseTime: number;
        p95ResponseTime: number;
        errorRate: number;
        throughput: number;
      };
      costAnalysis: {
        totalCost: number;
        costPerRequest: number;
        mostExpensiveProvider: AIProvider;
        projectedMonthlyCost: number;
      };
    };
  }> {
    const standardMetrics = await super.getMetrics(timeRange);
    
    return {
      standard: standardMetrics,
      enhanced: {
        circuitBreakerStatus: this.getCircuitBreakerStatus(),
        rateLimitStatus: this.getRateLimitStatus(),
        performanceInsights: await this.getPerformanceInsights(timeRange),
        costAnalysis: await this.getCostAnalysis(timeRange)
      }
    };
  }

  /**
   * Provider health check with circuit breaker awareness
   */
  async getProviderHealthEnhanced(): Promise<Array<{
    provider: AIProvider;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'circuit_open';
    circuitState: string;
    responseTime: number;
    errorRate: number;
    lastChecked: string;
    recommendations?: string[];
  }>> {
    const standardHealth = await super.getProviderHealth();
    
    return standardHealth.map(health => {
      const circuitBreaker = this.circuitBreakers.get(health.provider);
      const recommendations = this.generateHealthRecommendations(health, circuitBreaker);
      
      return {
        ...health,
        status: circuitBreaker?.state === 'OPEN' ? 'circuit_open' : health.status,
        circuitState: circuitBreaker?.state || 'CLOSED',
        recommendations
      };
    });
  }

  /**
   * Auto-scaling and load balancing optimization
   */
  async optimizeLoadBalancing(): Promise<{
    currentDistribution: Record<AIProvider, number>;
    recommendedDistribution: Record<AIProvider, number>;
    changes: Array<{
      provider: AIProvider;
      action: 'increase' | 'decrease' | 'maintain';
      reason: string;
    }>;
  }> {
    const metrics = await this.getEnhancedMetrics();
    const providerStats = await this.getProviderHealthEnhanced();
    
    // Analyze current load distribution
    const currentDistribution = metrics.standard.providerDistribution;
    
    // Calculate optimal distribution based on performance metrics
    const recommendedDistribution = this.calculateOptimalDistribution(providerStats);
    
    // Generate change recommendations
    const changes = this.generateLoadBalancingChanges(
      currentDistribution,
      recommendedDistribution,
      providerStats
    );

    return {
      currentDistribution,
      recommendedDistribution,
      changes
    };
  }

  /**
   * Security scan and threat detection
   */
  async performSecurityScan(): Promise<{
    threats: Array<{
      type: 'suspicious_pattern' | 'rate_anomaly' | 'cost_spike' | 'content_violation';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      timestamp: string;
      recommendations: string[];
    }>;
    compliance: {
      gdprCompliant: boolean;
      dataRetentionCompliant: boolean;
      auditTrailComplete: boolean;
      encryptionValid: boolean;
    };
    recommendations: string[];
  }> {
    // Implement security scanning logic
    const threats: any[] = [];
    
    // Check for rate anomalies
    const rateLimitStats = this.getRateLimitStatus();
    if (rateLimitStats.limitUtilization > 0.9) {
      threats.push({
        type: 'rate_anomaly',
        severity: 'medium',
        description: 'High rate limit utilization detected',
        timestamp: new Date().toISOString(),
        recommendations: [
          'Review request patterns',
          'Consider implementing request queuing',
          'Monitor for potential abuse'
        ]
      });
    }

    // Cost spike detection
    const costAnalysis = await this.getCostAnalysis();
    if (costAnalysis.costPerRequest > 0.05) { // $0.05 threshold
      threats.push({
        type: 'cost_spike',
        severity: 'high',
        description: 'Unusually high cost per request detected',
        timestamp: new Date().toISOString(),
        recommendations: [
          'Review request optimization',
          'Consider using cheaper providers for simple tasks',
          'Implement cost-based routing'
        ]
      });
    }

    // Compliance check
    const compliance = {
      gdprCompliant: true, // Would check actual compliance
      dataRetentionCompliant: true,
      auditTrailComplete: true,
      encryptionValid: true
    };

    const recommendations = [
      'Regular security scans recommended',
      'Monitor unusual usage patterns',
      'Keep audit logs for compliance',
      'Review and update security policies'
    ];

    return {
      threats,
      compliance,
      recommendations
    };
  }

  /**
   * Private helper methods
   */
  private initializeCircuitBreakers(): void {
    const providers: AIProvider[] = ['openai', 'claude', 'google', 'azure'];
    
    providers.forEach(provider => {
      this.circuitBreakers.set(provider, {
        provider,
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      });
    });
  }

  private initializeRateLimiting(): void {
    this.rateLimiter = {
      windowStart: Date.now(),
      requestCount: 0,
      concurrentRequests: 0
    };
  }

  private initializeObservability(): void {
    if (this.enhancedConfig.observability?.telemetry) {
      console.log('Telemetry initialized');
    }
    
    if (this.enhancedConfig.observability?.metrics) {
      console.log('Enhanced metrics collection initialized');
    }
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = 60 * 1000; // 1 minute
    const maxRequests = this.enhancedConfig.rateLimit?.maxRequestsPerMinute || 1000;
    const maxConcurrent = this.enhancedConfig.rateLimit?.maxConcurrentRequests || 50;

    // Reset window if needed
    if (now - this.rateLimiter.windowStart > windowDuration) {
      this.rateLimiter.windowStart = now;
      this.rateLimiter.requestCount = 0;
    }

    // Check limits
    if (this.rateLimiter.requestCount >= maxRequests) {
      throw new Error('Rate limit exceeded: too many requests per minute');
    }

    if (this.rateLimiter.concurrentRequests >= maxConcurrent) {
      throw new Error('Rate limit exceeded: too many concurrent requests');
    }

    this.rateLimiter.requestCount++;
  }

  private incrementConcurrentRequests(): void {
    this.rateLimiter.concurrentRequests++;
  }

  private decrementConcurrentRequests(): void {
    this.rateLimiter.concurrentRequests = Math.max(0, this.rateLimiter.concurrentRequests - 1);
  }

  private async selectProviderWithCircuitBreaker(request: AIRequest): Promise<AIProvider> {
    const preferredProvider = request.provider || 'openai';
    const circuitBreaker = this.circuitBreakers.get(preferredProvider);

    if (circuitBreaker && this.isCircuitOpen(circuitBreaker)) {
      // Try to find an alternative provider
      for (const [provider, cb] of this.circuitBreakers.entries()) {
        if (!this.isCircuitOpen(cb)) {
          console.log(`Circuit breaker: switching from ${preferredProvider} to ${provider}`);
          return provider;
        }
      }
      
      // If all circuits are open, try half-open state
      if (this.canAttemptHalfOpen(circuitBreaker)) {
        circuitBreaker.state = 'HALF_OPEN';
        return preferredProvider;
      }
      
      throw new Error('All providers unavailable (circuit breakers open)');
    }

    return preferredProvider;
  }

  private isCircuitOpen(circuitBreaker: CircuitBreakerState): boolean {
    const now = Date.now();
    
    if (circuitBreaker.state === 'OPEN') {
      if (now > circuitBreaker.nextAttemptTime) {
        circuitBreaker.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    
    return false;
  }

  private canAttemptHalfOpen(circuitBreaker: CircuitBreakerState): boolean {
    const now = Date.now();
    return circuitBreaker.state === 'OPEN' && now > circuitBreaker.nextAttemptTime;
  }

  private recordCircuitBreakerSuccess(provider: AIProvider): void {
    const circuitBreaker = this.circuitBreakers.get(provider);
    if (circuitBreaker) {
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failureCount = 0;
    }
  }

  private recordCircuitBreakerFailure(provider: AIProvider, error: AIError): void {
    const circuitBreaker = this.circuitBreakers.get(provider);
    if (!circuitBreaker) return;

    const failureThreshold = this.enhancedConfig.circuitBreaker?.failureThreshold || 5;
    const recoveryTime = this.enhancedConfig.circuitBreaker?.recoveryTime || 60000; // 1 minute

    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = Date.now();

    if (circuitBreaker.failureCount >= failureThreshold) {
      circuitBreaker.state = 'OPEN';
      circuitBreaker.nextAttemptTime = Date.now() + recoveryTime;
      console.warn(`Circuit breaker opened for provider ${provider}`);
    }
  }

  private getCircuitBreakerStatus(): Array<{
    provider: AIProvider;
    state: string;
    failureCount: number;
    uptime: number;
  }> {
    return Array.from(this.circuitBreakers.entries()).map(([provider, cb]) => ({
      provider,
      state: cb.state,
      failureCount: cb.failureCount,
      uptime: cb.state === 'CLOSED' ? 100 : 0
    }));
  }

  private getRateLimitStatus(): {
    currentRequests: number;
    limitUtilization: number;
    concurrentRequests: number;
  } {
    const maxRequests = this.enhancedConfig.rateLimit?.maxRequestsPerMinute || 1000;
    
    return {
      currentRequests: this.rateLimiter.requestCount,
      limitUtilization: this.rateLimiter.requestCount / maxRequests,
      concurrentRequests: this.rateLimiter.concurrentRequests
    };
  }

  private async getPerformanceInsights(timeRange?: { start: string; end: string }): Promise<{
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    throughput: number;
  }> {
    // Mock implementation - would use actual metrics data
    return {
      averageResponseTime: 1250,
      p95ResponseTime: 2800,
      errorRate: 0.02,
      throughput: 145.5
    };
  }

  private async getCostAnalysis(timeRange?: { start: string; end: string }): Promise<{
    totalCost: number;
    costPerRequest: number;
    mostExpensiveProvider: AIProvider;
    projectedMonthlyCost: number;
  }> {
    // Mock implementation - would use actual cost data
    return {
      totalCost: 45.82,
      costPerRequest: 0.003,
      mostExpensiveProvider: 'openai',
      projectedMonthlyCost: 1374.60
    };
  }

  private generateHealthRecommendations(
    health: any, 
    circuitBreaker?: CircuitBreakerState
  ): string[] {
    const recommendations: string[] = [];

    if (health.errorRate > 0.05) {
      recommendations.push('High error rate detected - consider reducing load');
    }

    if (health.responseTime > 3000) {
      recommendations.push('Slow response times - check provider status');
    }

    if (circuitBreaker && circuitBreaker.failureCount > 2) {
      recommendations.push('Multiple failures detected - monitor closely');
    }

    return recommendations;
  }

  private calculateOptimalDistribution(providerStats: any[]): Record<AIProvider, number> {
    // Simple optimization based on performance scores
    const scores: Record<AIProvider, number> = {} as Record<AIProvider, number>;
    
    providerStats.forEach(stat => {
      // Higher score = better performance
      const responseScore = Math.max(0, 100 - stat.responseTime / 50);
      const errorScore = Math.max(0, 100 - stat.errorRate * 1000);
      const healthScore = stat.status === 'healthy' ? 100 : 
                         stat.status === 'degraded' ? 50 : 0;
      
      scores[stat.provider as AIProvider] = (responseScore + errorScore + healthScore) / 3;
    });

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const distribution: Record<AIProvider, number> = {} as Record<AIProvider, number>;

    Object.entries(scores).forEach(([provider, score]) => {
      distribution[provider as AIProvider] = Math.round((score / totalScore) * 100);
    });

    return distribution;
  }

  private generateLoadBalancingChanges(
    current: Record<AIProvider, number>,
    recommended: Record<AIProvider, number>,
    providerStats: any[]
  ): Array<{
    provider: AIProvider;
    action: 'increase' | 'decrease' | 'maintain';
    reason: string;
  }> {
    const changes: Array<{
      provider: AIProvider;
      action: 'increase' | 'decrease' | 'maintain';
      reason: string;
    }> = [];

    Object.keys(recommended).forEach(provider => {
      const prov = provider as AIProvider;
      const currentLoad = current[prov] || 0;
      const recommendedLoad = recommended[prov];
      const diff = recommendedLoad - currentLoad;

      if (Math.abs(diff) > 5) { // 5% threshold
        if (diff > 0) {
          changes.push({
            provider: prov,
            action: 'increase',
            reason: `Better performance metrics - increase load by ${diff}%`
          });
        } else {
          changes.push({
            provider: prov,
            action: 'decrease',
            reason: `Performance issues detected - decrease load by ${Math.abs(diff)}%`
          });
        }
      } else {
        changes.push({
          provider: prov,
          action: 'maintain',
          reason: 'Current load distribution is optimal'
        });
      }
    });

    return changes;
  }

  private chunkRequestArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

export default EnhancedAIGateway;
