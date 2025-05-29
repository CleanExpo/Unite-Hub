/**
 * AI Service Gateway
 * Unite Group Advanced AI Service Gateway Implementation
 */

import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIServiceConfig,
  AIGatewayInterface,
  AIHealthStatus,
  AIMetrics,
  AIUsage,
  AIError,
  AIBatchRequest,
  AIBatchOptions,
  AIContentModerationResult,
  AIAuditLog,
  AICacheConfig,
  AIRoutingRule,
  AISecurityConfig,
  AIRequestType,
  AIRequestOptions,
  AIEvent,
  AIEventHandler,
  AIErrorCode
} from './types';

import { OpenAIProvider } from './providers/openai-provider';
import { ClaudeProvider } from './providers/claude-provider';
import { GoogleAIProvider } from './providers/google-provider';
import { AzureProvider } from './providers/azure-provider';
import { AICache } from './cache/ai-cache';
import { AIRouter } from './routing/ai-router';
import { AIMonitor } from './monitoring/ai-monitor';
import { AISecurityManager } from './security/ai-security';

export interface AIGatewayConfig {
  providers: AIServiceConfig[];
  cache?: AICacheConfig;
  routing?: AIRoutingRule[];
  security?: AISecurityConfig;
  monitoring?: {
    enabled: boolean;
    metricsRetentionDays: number;
    healthCheckIntervalSeconds: number;
  };
  fallback?: {
    enabled: boolean;
    providers: AIProvider[];
    maxRetries: number;
  };
}

export const DEFAULT_GATEWAY_CONFIG: Partial<AIGatewayConfig> = {
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 10000,
    keyStrategy: 'hash'
  },
  monitoring: {
    enabled: true,
    metricsRetentionDays: 30,
    healthCheckIntervalSeconds: 60
  },
  fallback: {
    enabled: true,
    providers: ['openai', 'claude'],
    maxRetries: 3
  }
};

export class AIGateway implements AIGatewayInterface {
  private providers: Map<AIProvider, any> = new Map();
  private cache: AICache;
  private router: AIRouter;
  private monitor: AIMonitor;
  private security: AISecurityManager;
  private config: AIGatewayConfig;
  private eventHandlers: Map<string, AIEventHandler[]> = new Map();
  private isInitialized = false;

  constructor(config: AIGatewayConfig) {
    this.config = { ...DEFAULT_GATEWAY_CONFIG, ...config };
    
    // Initialize core components
    this.cache = new AICache(this.config.cache);
    this.router = new AIRouter(this.config.routing || []);
    this.monitor = new AIMonitor(this.config.monitoring);
    this.security = new AISecurityManager(this.config.security);

    // Initialize providers
    this.initializeProviders();
    
    // Start monitoring if enabled
    if (this.config.monitoring?.enabled) {
      this.startHealthMonitoring();
    }

    this.isInitialized = true;
  }

  /**
   * Initialize AI providers based on configuration
   */
  private initializeProviders(): void {
    for (const providerConfig of this.config.providers) {
      try {
        const provider = this.createProvider(providerConfig);
        this.providers.set(providerConfig.provider, provider);
        console.log(`AI Provider initialized: ${providerConfig.provider}`);
      } catch (error) {
        console.error(`Failed to initialize provider ${providerConfig.provider}:`, error);
        this.emitEvent('provider_initialization_failed', {
          provider: providerConfig.provider,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * Create provider instance based on configuration
   */
  private createProvider(config: AIServiceConfig): any {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'claude':
        return new ClaudeProvider(config);
      case 'google':
        return new GoogleAIProvider(config);
      case 'azure':
        return new AzureProvider(config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  /**
   * Generate text using AI providers
   */
  async generateText(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      this.validateRequest(request);

      // Security check
      await this.security.validateRequest(request);

      // Check cache first
      if (this.config.cache?.enabled) {
        const cached = await this.cache.get(request);
        if (cached) {
          this.emitEvent('cache_hit', { requestId: request.id });
          return {
            ...cached,
            cached: true,
            processingTime: Date.now() - startTime
          };
        }
        this.emitEvent('cache_miss', { requestId: request.id });
      }

      // Route to appropriate provider
      const targetProvider = await this.router.selectProvider(request);
      const provider = this.providers.get(targetProvider);

      if (!provider) {
        throw this.createError('MODEL_UNAVAILABLE', `Provider ${targetProvider} not available`, request.id);
      }

      // Execute request
      this.emitEvent('request_started', { requestId: request.id, provider: targetProvider });
      
      const response = await this.executeWithFallback(provider, request, targetProvider);
      
      // Cache successful response
      if (this.config.cache?.enabled && response) {
        await this.cache.set(request, response);
      }

      // Log audit trail
      await this.security.logRequest(request, response);

      // Update metrics
      this.monitor.recordRequest(request, response, null);

      this.emitEvent('request_completed', { 
        requestId: request.id, 
        provider: targetProvider,
        processingTime: response.processingTime
      });

      return response;

    } catch (error) {
      const aiError = this.handleError(error, request.id);
      
      // Update error metrics
      this.monitor.recordRequest(request, null, aiError);
      
      this.emitEvent('request_failed', { 
        requestId: request.id, 
        error: aiError.message,
        code: aiError.code
      });

      throw aiError;
    }
  }

  /**
   * Execute request with fallback providers
   */
  private async executeWithFallback(
    primaryProvider: any, 
    request: AIRequest, 
    providerName: AIProvider
  ): Promise<AIResponse> {
    const fallbackProviders = this.config.fallback?.providers || [];
    const maxRetries = this.config.fallback?.maxRetries || 3;
    
    let lastError: Error | null = null;
    let attempt = 0;

    // Try primary provider first
    try {
      return await primaryProvider.generateText(request);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Primary provider ${providerName} failed:`, error);
    }

    // Try fallback providers if enabled
    if (this.config.fallback?.enabled && fallbackProviders.length > 0) {
      for (const fallbackProviderName of fallbackProviders) {
        if (fallbackProviderName === providerName) continue; // Skip if same as primary
        
        const fallbackProvider = this.providers.get(fallbackProviderName);
        if (!fallbackProvider) continue;

        attempt++;
        if (attempt > maxRetries) break;

        try {
          console.log(`Trying fallback provider: ${fallbackProviderName}`);
          const response = await fallbackProvider.generateText({
            ...request,
            provider: fallbackProviderName
          });
          
          this.emitEvent('fallback_success', {
            originalProvider: providerName,
            fallbackProvider: fallbackProviderName,
            attempt
          });

          return response;
        } catch (error) {
          lastError = error as Error;
          console.warn(`Fallback provider ${fallbackProviderName} failed:`, error);
        }
      }
    }

    // All providers failed
    throw lastError || new Error('All AI providers failed');
  }

  /**
   * Analyze text using AI providers
   */
  async analyzeText(
    text: string, 
    analysisType: string, 
    options?: AIRequestOptions
  ): Promise<AIResponse> {
    const request: AIRequest = {
      id: this.generateRequestId(),
      provider: 'openai', // Will be routed appropriately
      type: 'text_analysis',
      prompt: `Analyze the following text for ${analysisType}:\n\n${text}`,
      options,
      timestamp: new Date().toISOString()
    };

    return this.generateText(request);
  }

  /**
   * Process image using AI providers
   */
  async processImage(
    image: ImageData, 
    tasks: string[], 
    options?: AIRequestOptions
  ): Promise<AIResponse> {
    const request: AIRequest = {
      id: this.generateRequestId(),
      provider: 'google', // Google Vision API is preferred for images
      type: 'image_analysis',
      prompt: `Process image with tasks: ${tasks.join(', ')}`,
      options: {
        ...options,
        format: 'json'
      },
      metadata: {
        imageData: image,
        tasks
      },
      timestamp: new Date().toISOString()
    };

    return this.generateText(request);
  }

  /**
   * Process batch requests
   */
  async processBatch(
    requests: AIRequest[], 
    options?: AIBatchOptions
  ): Promise<AIBatchRequest> {
    const batchId = this.generateRequestId();
    const maxConcurrency = options?.maxConcurrency || 5;
    
    const batchRequest: AIBatchRequest = {
      id: batchId,
      requests,
      options: {
        maxConcurrency,
        retryFailures: options?.retryFailures ?? true,
        continueOnError: options?.continueOnError ?? true
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
      results: [],
      errors: []
    };

    // Process batch asynchronously
    this.processBatchAsync(batchRequest);

    return batchRequest;
  }

  /**
   * Process batch requests asynchronously
   */
  private async processBatchAsync(batchRequest: AIBatchRequest): Promise<void> {
    batchRequest.status = 'running';
    batchRequest.startedAt = new Date().toISOString();

    const { requests, options } = batchRequest;
    const results: any[] = [];
    const errors: AIError[] = [];

    try {
      // Process requests with controlled concurrency
      const chunks = this.chunkArray(requests, options.maxConcurrency);
      
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (request) => {
          try {
            const response = await this.generateText(request);
            results.push({
              requestId: request.id,
              response,
              processingTime: response.processingTime
            });
          } catch (error) {
            const aiError = this.handleError(error, request.id);
            errors.push(aiError);
            
            if (!options.continueOnError) {
              throw aiError;
            }
          }
        });

        await Promise.all(chunkPromises);

        // Report progress
        if (options.progressCallback) {
          options.progressCallback({
            total: requests.length,
            completed: results.length,
            failed: errors.length,
            pending: requests.length - results.length - errors.length
          });
        }
      }

      batchRequest.status = 'completed';
    } catch (error) {
      batchRequest.status = 'failed';
      errors.push(this.handleError(error, batchRequest.id));
    }

    batchRequest.results = results;
    batchRequest.errors = errors;
    batchRequest.completedAt = new Date().toISOString();

    this.emitEvent('batch_completed', {
      batchId: batchRequest.id,
      status: batchRequest.status,
      successCount: results.length,
      errorCount: errors.length
    });
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: string): Promise<AIBatchRequest> {
    // This would typically query from a database or cache
    // For now, return a mock response
    throw new Error('Batch status tracking not implemented yet');
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(): Promise<AIHealthStatus[]> {
    const healthStatuses: AIHealthStatus[] = [];

    for (const [providerName, provider] of this.providers.entries()) {
      try {
        const startTime = Date.now();
        
        // Simple health check - attempt a basic request
        await provider.healthCheck?.() || this.performBasicHealthCheck(provider);
        
        const responseTime = Date.now() - startTime;
        
        healthStatuses.push({
          provider: providerName,
          status: 'healthy',
          responseTime,
          errorRate: this.monitor.getErrorRate(providerName),
          lastChecked: new Date().toISOString()
        });
      } catch (error) {
        healthStatuses.push({
          provider: providerName,
          status: 'unhealthy',
          responseTime: -1,
          errorRate: this.monitor.getErrorRate(providerName),
          lastChecked: new Date().toISOString(),
          details: {
            error: error instanceof Error ? error.message : String(error)
          }
        });
      }
    }

    return healthStatuses;
  }

  /**
   * Get AI metrics
   */
  async getMetrics(timeRange?: { start: string; end: string }): Promise<AIMetrics> {
    return this.monitor.getMetrics(timeRange);
  }

  /**
   * Get usage statistics
   */
  async getUsage(userId?: string, timeRange?: { start: string; end: string }): Promise<AIUsage> {
    return this.monitor.getUsage(userId, timeRange);
  }

  /**
   * Update configuration
   */
  async updateConfig(config: Partial<AIServiceConfig>): Promise<void> {
    // Update provider configuration
    // This would typically persist to database
    this.emitEvent('config_changed', { config });
  }

  /**
   * Add new provider
   */
  async addProvider(config: AIServiceConfig): Promise<void> {
    try {
      const provider = this.createProvider(config);
      this.providers.set(config.provider, provider);
      
      this.emitEvent('provider_added', { provider: config.provider });
    } catch (error) {
      throw this.createError('INVALID_REQUEST', `Failed to add provider: ${error}`, 'system');
    }
  }

  /**
   * Remove provider
   */
  async removeProvider(provider: AIProvider): Promise<void> {
    if (this.providers.delete(provider)) {
      this.emitEvent('provider_removed', { provider });
    } else {
      throw this.createError('INVALID_REQUEST', `Provider ${provider} not found`, 'system');
    }
  }

  /**
   * Moderate content
   */
  async moderateContent(content: string): Promise<AIContentModerationResult> {
    return this.security.moderateContent(content);
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(filter?: Record<string, unknown>): Promise<AIAuditLog[]> {
    return this.security.getAuditLogs(filter);
  }

  /**
   * Clear cache
   */
  async clearCache(pattern?: string): Promise<void> {
    await this.cache.clear(pattern);
    this.emitEvent('cache_cleared', { pattern });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ size: number; hitRate: number; missRate: number }> {
    return this.cache.getStats();
  }

  /**
   * Event handling
   */
  addEventListener(eventType: string, handler: AIEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  removeEventListener(eventType: string, handler: AIEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Utility methods
   */
  private validateRequest(request: AIRequest): void {
    if (!request.id || !request.prompt || !request.type) {
      throw this.createError('INVALID_REQUEST', 'Missing required request fields', request.id);
    }

    if (request.prompt.length > 100000) { // 100K character limit
      throw this.createError('INVALID_REQUEST', 'Prompt too long', request.id);
    }
  }

  private generateRequestId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private createError(code: AIErrorCode, message: string, requestId: string): AIError {
    return {
      code,
      message,
      provider: 'gateway' as AIProvider,
      requestId,
      retryable: ['RATE_LIMIT_EXCEEDED', 'TIMEOUT_ERROR', 'NETWORK_ERROR'].includes(code),
      timestamp: new Date().toISOString()
    };
  }

  private handleError(error: unknown, requestId: string): AIError {
    if (error && typeof error === 'object' && 'code' in error) {
      return error as AIError;
    }

    return this.createError(
      'UNKNOWN_ERROR',
      error instanceof Error ? error.message : String(error),
      requestId
    );
  }

  private emitEvent(type: string, data: Record<string, unknown>): void {
    const event: AIEvent = {
      type: type as any,
      data,
      timestamp: new Date().toISOString(),
      source: 'ai-gateway'
    };

    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      });
    }
  }

  private async performBasicHealthCheck(provider: any): Promise<void> {
    // Basic health check - attempt a minimal request
    const testRequest: AIRequest = {
      id: 'health_check',
      provider: 'openai' as AIProvider,
      type: 'text_generation',
      prompt: 'Hello',
      options: { maxTokens: 1 },
      timestamp: new Date().toISOString()
    };

    await provider.generateText(testRequest);
  }

  private startHealthMonitoring(): void {
    const interval = (this.config.monitoring?.healthCheckIntervalSeconds || 60) * 1000;
    
    setInterval(async () => {
      try {
        const healthStatuses = await this.getProviderHealth();
        
        for (const status of healthStatuses) {
          if (status.status !== 'healthy') {
            this.emitEvent('provider_health_changed', {
              provider: status.provider,
              status: status.status,
              details: status.details
            });
          }
        }
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, interval);
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    // Clear all providers
    this.providers.clear();
    
    // Clear event handlers
    this.eventHandlers.clear();
    
    // Cleanup components
    await this.cache?.destroy?.();
    await this.monitor?.destroy?.();
    await this.security?.destroy?.();

    this.isInitialized = false;
  }

  /**
   * Health check for the gateway itself
   */
  async healthCheck(): Promise<{ status: string; providers: number; uptime: number }> {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      providers: this.providers.size,
      uptime: process.uptime()
    };
  }
}

// Export singleton instance
let gatewayInstance: AIGateway | null = null;

export function getAIGateway(config?: AIGatewayConfig): AIGateway {
  if (!gatewayInstance && config) {
    gatewayInstance = new AIGateway(config);
  }
  return gatewayInstance!;
}

export function createAIGateway(config: AIGatewayConfig): AIGateway {
  return new AIGateway(config);
}

export default AIGateway;
