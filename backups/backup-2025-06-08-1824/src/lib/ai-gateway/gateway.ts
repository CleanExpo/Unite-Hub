/**
 * AI Gateway Core
 * Production-ready AI Gateway with failover, caching, and monitoring
 */

import { 
  OpenAIProvider, 
  ClaudeProvider, 
  GoogleAIProvider, 
  AzureOpenAIProvider, 
  AI_PROVIDERS,
  type AIRequest,
  type AIResponse 
} from './providers';

interface GatewayMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCost: number;
  averageResponseTime: number;
  providerStats: Record<string, {
    requests: number;
    failures: number;
    totalCost: number;
    averageResponseTime: number;
    lastUsed: string;
  }>;
  cacheHits: number;
  cacheMisses: number;
}

interface CacheEntry {
  response: AIResponse;
  timestamp: number;
  ttl: number;
}

interface ProviderError {
  provider: string;
  error: string;
  timestamp: number;
}

export class AIGateway {
  private providers: Map<string, any>;
  private cache: Map<string, CacheEntry>;
  private metrics: GatewayMetrics;
  private errors: ProviderError[];
  private circuitBreakers: Map<string, { failures: number; lastFailure: number; isOpen: boolean }>;
  private rateLimits: Map<string, { requests: number; resetTime: number }>;

  constructor() {
    this.providers = new Map();
    this.cache = new Map();
    this.errors = [];
    this.circuitBreakers = new Map();
    this.rateLimits = new Map();
    
    // Initialize providers
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('claude', new ClaudeProvider());
    this.providers.set('google', new GoogleAIProvider());
    this.providers.set('azure', new AzureOpenAIProvider());

    // Initialize metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalCost: 0,
      averageResponseTime: 0,
      providerStats: {},
      cacheHits: 0,
      cacheMisses: 0,
    };

    // Initialize circuit breakers
    Object.keys(AI_PROVIDERS).forEach(providerId => {
      this.circuitBreakers.set(providerId, {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
      });
      this.metrics.providerStats[providerId] = {
        requests: 0,
        failures: 0,
        totalCost: 0,
        averageResponseTime: 0,
        lastUsed: '',
      };
    });

    // Clean up cache periodically
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Process AI request with failover and caching
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);
    
    this.metrics.totalRequests++;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return { ...cached, cached: true };
    }
    
    this.metrics.cacheMisses++;

    // Get ordered list of providers to try
    const providersToTry = this.getAvailableProviders(request.provider);
    
    let lastError: Error | null = null;

    // Try each provider in order
    for (const providerId of providersToTry) {
      try {
        // Check rate limits
        if (this.isRateLimited(providerId)) {
          continue;
        }

        // Check circuit breaker
        if (this.isCircuitBreakerOpen(providerId)) {
          continue;
        }

        const provider = this.providers.get(providerId);
        if (!provider) continue;

        const response = await provider.generateCompletion(request);
        
        // Update metrics for successful request
        this.updateSuccessMetrics(providerId, response, startTime);
        
        // Cache the response
        this.saveToCache(cacheKey, response);
        
        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        this.handleProviderError(providerId, lastError);
      }
    }

    // All providers failed
    this.metrics.failedRequests++;
    throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Get available providers ordered by priority
   */
  private getAvailableProviders(preferredProvider?: string): string[] {
    const providers = Object.entries(AI_PROVIDERS)
      .sort(([, a], [, b]) => a.priority - b.priority)
      .map(([id]) => id);

    // If a specific provider is requested, try it first
    if (preferredProvider && providers.includes(preferredProvider)) {
      return [preferredProvider, ...providers.filter(p => p !== preferredProvider)];
    }

    return providers;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: AIRequest): string {
    const key = `${request.prompt}_${request.model || 'default'}_${request.maxTokens || 1000}_${request.temperature || 0.7}`;
    return Buffer.from(key).toString('base64');
  }

  /**
   * Get response from cache
   */
  private getFromCache(key: string): AIResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  /**
   * Save response to cache
   */
  private saveToCache(key: string, response: AIResponse): void {
    const ttl = 60 * 60 * 1000; // 1 hour
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Check if provider is rate limited
   */
  private isRateLimited(providerId: string): boolean {
    const limit = this.rateLimits.get(providerId);
    if (!limit) return false;

    const now = Date.now();
    if (now > limit.resetTime) {
      this.rateLimits.delete(providerId);
      return false;
    }

    return limit.requests >= this.getRateLimit(providerId);
  }

  /**
   * Get rate limit for provider
   */
  private getRateLimit(providerId: string): number {
    const limits = {
      openai: 3000, // requests per minute
      claude: 1000,
      google: 1500,
      azure: 3000,
    };
    return limits[providerId as keyof typeof limits] || 1000;
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBreakerOpen(providerId: string): boolean {
    const breaker = this.circuitBreakers.get(providerId);
    if (!breaker) return false;

    // Reset circuit breaker after 5 minutes
    if (breaker.isOpen && Date.now() - breaker.lastFailure > 5 * 60 * 1000) {
      breaker.isOpen = false;
      breaker.failures = 0;
    }

    return breaker.isOpen;
  }

  /**
   * Handle provider error
   */
  private handleProviderError(providerId: string, error: Error): void {
    const now = Date.now();
    
    // Update circuit breaker
    const breaker = this.circuitBreakers.get(providerId);
    if (breaker) {
      breaker.failures++;
      breaker.lastFailure = now;
      
      // Open circuit breaker after 5 failures
      if (breaker.failures >= 5) {
        breaker.isOpen = true;
      }
    }

    // Update provider stats
    const stats = this.metrics.providerStats[providerId];
    if (stats) {
      stats.failures++;
    }

    // Log error
    this.errors.push({
      provider: providerId,
      error: error.message,
      timestamp: now,
    });

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  /**
   * Update metrics for successful request
   */
  private updateSuccessMetrics(providerId: string, response: AIResponse, startTime: number): void {
    const responseTime = Date.now() - startTime;
    
    this.metrics.successfulRequests++;
    this.metrics.totalCost += response.usage.cost;
    
    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.successfulRequests;

    // Update provider stats
    const stats = this.metrics.providerStats[providerId];
    if (stats) {
      stats.requests++;
      stats.totalCost += response.usage.cost;
      stats.lastUsed = new Date().toISOString();
      
      // Update provider average response time
      const providerTotalTime = stats.averageResponseTime * (stats.requests - 1) + responseTime;
      stats.averageResponseTime = providerTotalTime / stats.requests;
    }
  }

  /**
   * Get gateway metrics
   */
  getMetrics(): GatewayMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent errors
   */
  getErrors(): ProviderError[] {
    return this.errors.slice(-50); // Return last 50 errors
  }

  /**
   * Check provider health
   */
  async checkProviderHealth(providerId?: string): Promise<Record<string, boolean>> {
    const providersToCheck = providerId ? [providerId] : Array.from(this.providers.keys());
    const healthStatus: Record<string, boolean> = {};

    await Promise.all(
      providersToCheck.map(async (id) => {
        try {
          const provider = this.providers.get(id);
          if (provider && provider.healthCheck) {
            healthStatus[id] = await provider.healthCheck();
          } else {
            healthStatus[id] = false;
          }
        } catch {
          healthStatus[id] = false;
        }
      })
    );

    return healthStatus;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalCost: 0,
      averageResponseTime: 0,
      providerStats: {},
      cacheHits: 0,
      cacheMisses: 0,
    };

    // Reinitialize provider stats
    Object.keys(AI_PROVIDERS).forEach(providerId => {
      this.metrics.providerStats[providerId] = {
        requests: 0,
        failures: 0,
        totalCost: 0,
        averageResponseTime: 0,
        lastUsed: '',
      };
    });
  }
}

// Global gateway instance
export const aiGateway = new AIGateway();
