/**
 * Production AI Gateway Implementation
 * Unite Group - Simplified Production-Ready AI Gateway
 */

import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIError,
  AIMetrics,
  AIUsage
} from './types';

export interface ProductionAIGatewayConfig {
  providers: Array<{
    provider: AIProvider;
    apiKey: string;
    model: string;
    enabled: boolean;
    weight: number; // Load balancing weight
    maxRetries: number;
  }>;
  fallback: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number; // ms
  };
  rateLimit: {
    enabled: boolean;
    maxRequestsPerMinute: number;
    maxConcurrentRequests: number;
  };
  cache: {
    enabled: boolean;
    ttl: number; // seconds
    maxSize: number;
  };
  monitoring: {
    enabled: boolean;
    logRequests: boolean;
    trackMetrics: boolean;
  };
}

interface ProviderStatus {
  provider: AIProvider;
  healthy: boolean;
  lastError?: string;
  lastErrorTime?: number;
  requestCount: number;
  errorCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
}

interface CacheEntry {
  response: AIResponse;
  timestamp: number;
  ttl: number;
}

interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  cacheHits: number;
  cacheMisses: number;
}

export class ProductionAIGateway {
  private config: ProductionAIGatewayConfig;
  private providerStatus: Map<AIProvider, ProviderStatus> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private metrics: RequestMetrics;
  private concurrentRequests = 0;
  private requestWindow: number[] = [];

  constructor(config: ProductionAIGatewayConfig) {
    this.config = config;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    // Initialize provider status
    config.providers.forEach(providerConfig => {
      this.providerStatus.set(providerConfig.provider, {
        provider: providerConfig.provider,
        healthy: true,
        requestCount: 0,
        errorCount: 0,
        totalResponseTime: 0,
        averageResponseTime: 0
      });
    });

    console.log('Production AI Gateway initialized');
  }

  /**
   * Process AI request with fallback and error handling
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Check rate limits
      if (this.config.rateLimit.enabled) {
        await this.checkRateLimit();
      }

      // Check cache first
      if (this.config.cache.enabled) {
        const cached = this.getCachedResponse(request);
        if (cached) {
          this.metrics.cacheHits++;
          return {
            ...cached,
            cached: true,
            processingTime: Date.now() - startTime
          };
        }
        this.metrics.cacheMisses++;
      }

      // Select provider and process request
      const response = await this.processWithFallback(request);
      
      // Cache successful response
      if (this.config.cache.enabled && response) {
        this.setCachedResponse(request, response);
      }

      // Update metrics
      this.updateMetrics(true, Date.now() - startTime);
      
      return response;

    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime);
      throw this.createAIError(error, request.id);
    }
  }

  /**
   * Process request with automatic fallback on failures
   */
  private async processWithFallback(request: AIRequest): Promise<AIResponse> {
    const availableProviders = this.getHealthyProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No healthy AI providers available');
    }

    let lastError: Error | null = null;
    
    // Try each provider in order of preference
    for (const provider of availableProviders) {
      try {
        console.log(`Attempting request with provider: ${provider.provider}`);
        
        const response = await this.makeProviderRequest(provider, request);
        
        // Mark provider as healthy on success
        this.markProviderHealthy(provider.provider);
        
        return response;
        
      } catch (error) {
        lastError = error as Error;
        
        // Mark provider as unhealthy if it's a 503 or similar error
        if (this.isProviderError(error)) {
          this.markProviderUnhealthy(provider.provider, error as Error);
        }
        
        console.warn(`Provider ${provider.provider} failed:`, error);
        
        // If not the last provider, wait before trying next
        if (provider !== availableProviders[availableProviders.length - 1]) {
          await this.delay(this.config.fallback.retryDelay);
        }
      }
    }

    throw lastError || new Error('All AI providers failed');
  }

  /**
   * Make request to specific provider
   */
  private async makeProviderRequest(
    providerConfig: any, 
    request: AIRequest
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      this.concurrentRequests++;
      
      // Mock provider request - replace with actual implementation
      const response = await this.mockProviderRequest(providerConfig, request);
      
      const responseTime = Date.now() - startTime;
      this.updateProviderMetrics(providerConfig.provider, true, responseTime);
      
      return response;
      
    } finally {
      this.concurrentRequests--;
    }
  }

  /**
   * Mock provider request (replace with actual implementations)
   */
  private async mockProviderRequest(
    providerConfig: any, 
    request: AIRequest
  ): Promise<AIResponse> {
    // Simulate provider-specific processing
    const delay = Math.random() * 2000 + 500; // 500-2500ms
    await this.delay(delay);
    
    // Simulate occasional 503 errors
    if (Math.random() < 0.1) { // 10% chance of 503 error
      throw new Error('503 Service Unavailable: Model overloaded');
    }
    
    return {
      id: `resp_${Date.now()}`,
      requestId: request.id,
      content: `Mock response from ${providerConfig.provider} for: ${request.prompt.substring(0, 50)}...`,
      provider: providerConfig.provider,
      usage: {
        promptTokens: Math.floor(request.prompt.length / 4),
        completionTokens: 150,
        totalTokens: Math.floor(request.prompt.length / 4) + 150,
        cost: 0.002,
        model: providerConfig.model
      },
      processingTime: delay,
      cached: false,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get healthy providers sorted by preference
   */
  private getHealthyProviders(): any[] {
    return this.config.providers
      .filter(p => p.enabled)
      .filter(p => {
        const status = this.providerStatus.get(p.provider);
        return status?.healthy !== false;
      })
      .sort((a, b) => {
        // Sort by weight (higher weight = higher priority)
        return b.weight - a.weight;
      });
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old requests from window
    this.requestWindow = this.requestWindow.filter(time => time > oneMinuteAgo);
    
    // Check concurrent requests
    if (this.concurrentRequests >= this.config.rateLimit.maxConcurrentRequests) {
      throw new Error('Rate limit exceeded: too many concurrent requests');
    }
    
    // Check requests per minute
    if (this.requestWindow.length >= this.config.rateLimit.maxRequestsPerMinute) {
      throw new Error('Rate limit exceeded: too many requests per minute');
    }
    
    this.requestWindow.push(now);
  }

  /**
   * Cache management
   */
  private getCachedResponse(request: AIRequest): AIResponse | null {
    const key = this.getCacheKey(request);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.response;
  }

  private setCachedResponse(request: AIRequest, response: AIResponse): void {
    const key = this.getCacheKey(request);
    const entry: CacheEntry = {
      response,
      timestamp: Date.now(),
      ttl: this.config.cache.ttl
    };
    
    // Simple LRU: remove oldest if cache is full
    if (this.cache.size >= this.config.cache.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, entry);
  }

  private getCacheKey(request: AIRequest): string {
    // Simple hash of prompt and key parameters
    const key = `${request.type}-${request.prompt}-${JSON.stringify(request.options || {})}`;
    return Buffer.from(key).toString('base64').substring(0, 32);
  }

  /**
   * Provider health management
   */
  private markProviderUnhealthy(provider: AIProvider, error: Error): void {
    const status = this.providerStatus.get(provider);
    if (status) {
      status.healthy = false;
      status.lastError = error.message;
      status.lastErrorTime = Date.now();
      status.errorCount++;
      
      console.warn(`Marked provider ${provider} as unhealthy: ${error.message}`);
      
      // Auto-recovery after 60 seconds
      setTimeout(() => {
        this.markProviderHealthy(provider);
      }, 60000);
    }
  }

  private markProviderHealthy(provider: AIProvider): void {
    const status = this.providerStatus.get(provider);
    if (status) {
      status.healthy = true;
      delete status.lastError;
      delete status.lastErrorTime;
      
      console.log(`Marked provider ${provider} as healthy`);
    }
  }

  private isProviderError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('503') || 
           message.includes('Service Unavailable') ||
           message.includes('overloaded') ||
           message.includes('rate limit') ||
           message.includes('timeout');
  }

  /**
   * Metrics and monitoring
   */
  private updateMetrics(success: boolean, responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.totalResponseTime += responseTime;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
  }

  private updateProviderMetrics(
    provider: AIProvider, 
    success: boolean, 
    responseTime: number
  ): void {
    const status = this.providerStatus.get(provider);
    if (status) {
      status.requestCount++;
      status.totalResponseTime += responseTime;
      status.averageResponseTime = status.totalResponseTime / status.requestCount;
      
      if (!success) {
        status.errorCount++;
      }
    }
  }

  /**
   * Public API methods
   */
  async getMetrics(): Promise<{
    requests: RequestMetrics;
    providers: Array<{
      provider: AIProvider;
      healthy: boolean;
      requestCount: number;
      errorCount: number;
      errorRate: number;
      averageResponseTime: number;
      lastError?: string;
    }>;
    cache: {
      size: number;
      hitRate: number;
      missRate: number;
    };
  }> {
    const providerMetrics = Array.from(this.providerStatus.entries()).map(([provider, status]) => ({
      provider,
      healthy: status.healthy,
      requestCount: status.requestCount,
      errorCount: status.errorCount,
      errorRate: status.requestCount > 0 ? status.errorCount / status.requestCount : 0,
      averageResponseTime: status.averageResponseTime,
      lastError: status.lastError
    }));

    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    
    return {
      requests: this.metrics,
      providers: providerMetrics,
      cache: {
        size: this.cache.size,
        hitRate: totalCacheRequests > 0 ? this.metrics.cacheHits / totalCacheRequests : 0,
        missRate: totalCacheRequests > 0 ? this.metrics.cacheMisses / totalCacheRequests : 0
      }
    };
  }

  async getProviderHealth(): Promise<Array<{
    provider: AIProvider;
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    errorRate: number;
    requestCount: number;
    lastError?: string;
  }>> {
    return Array.from(this.providerStatus.entries()).map(([provider, status]) => ({
      provider,
      status: status.healthy ? 'healthy' : 'unhealthy',
      responseTime: status.averageResponseTime,
      errorRate: status.requestCount > 0 ? status.errorCount / status.requestCount : 0,
      requestCount: status.requestCount,
      lastError: status.lastError
    }));
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  async resetMetrics(): Promise<void> {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    // Reset provider metrics
    this.providerStatus.forEach(status => {
      status.requestCount = 0;
      status.errorCount = 0;
      status.totalResponseTime = 0;
      status.averageResponseTime = 0;
    });
  }

  /**
   * Utility methods
   */
  private createAIError(error: unknown, requestId: string): AIError {
    const message = error instanceof Error ? error.message : String(error);
    
    return {
      code: message.includes('503') ? 'SERVICE_UNAVAILABLE' :
            message.includes('rate limit') ? 'RATE_LIMIT_EXCEEDED' :
            message.includes('timeout') ? 'TIMEOUT_ERROR' : 'UNKNOWN_ERROR',
      message,
      provider: 'gateway' as AIProvider,
      requestId,
      retryable: true,
      timestamp: new Date().toISOString()
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for the gateway
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    providers: number;
    healthyProviders: number;
    uptime: number;
  }> {
    const healthyProviders = Array.from(this.providerStatus.values()).filter(s => s.healthy).length;
    const totalProviders = this.providerStatus.size;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyProviders === 0) {
      status = 'unhealthy';
    } else if (healthyProviders < totalProviders) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }
    
    return {
      status,
      providers: totalProviders,
      healthyProviders,
      uptime: process.uptime()
    };
  }
}

export default ProductionAIGateway;
