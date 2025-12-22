/**
 * API Fallback Handler
 *
 * Graceful degradation when primary APIs are unavailable
 * Provides backup implementations for critical operations
 *
 * Phase 24: Resilient API Integration & Fallback Strategies
 */

/**
 * Fallback strategy type
 */
export type FallbackStrategy = "fail" | "degrade" | "queue" | "cache";

/**
 * API fallback configuration
 */
export interface FallbackConfig {
  service: string;
  fallbackStrategy: FallbackStrategy;
  retryCount: number;
  retryDelay: number; // milliseconds
  fallbackService?: string;
  cacheResults?: boolean;
  cacheTtl?: number; // milliseconds
}

/**
 * Fallback operation result
 */
export interface FallbackResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: "primary" | "fallback" | "cache";
  retriesUsed: number;
  responseTime: number; // milliseconds
}

/**
 * API Fallback Handler
 */
export class ApiFallbackHandler {
  private cache: Map<string, { data: unknown; expiry: number }> = new Map();
  private configs: Map<string, FallbackConfig> = new Map();
  private failureTracking: Map<
    string,
    { count: number; lastFailure: Date }
  > = new Map();

  constructor() {
    this.initializeConfigs();
  }

  /**
   * Initialize fallback configurations
   */
  private initializeConfigs(): void {
    // Anthropic Claude - no fallback for critical decisions
    this.registerConfig({
      service: "anthropic",
      fallbackStrategy: "fail",
      retryCount: 3,
      retryDelay: 1000,
    });

    // OpenAI - fallback to Anthropic for transcription
    this.registerConfig({
      service: "openai",
      fallbackStrategy: "queue",
      retryCount: 2,
      retryDelay: 500,
      fallbackService: "anthropic",
      cacheResults: true,
      cacheTtl: 3600000, // 1 hour
    });

    // Stripe - fallback to queue for processing
    this.registerConfig({
      service: "stripe",
      fallbackStrategy: "queue",
      retryCount: 5,
      retryDelay: 2000,
      cacheResults: false,
    });

    // SendGrid - fallback to SMTP
    this.registerConfig({
      service: "sendgrid",
      fallbackStrategy: "degrade",
      retryCount: 3,
      retryDelay: 1000,
      fallbackService: "smtp",
      cacheResults: false,
    });

    // Redis - fallback to in-memory cache
    this.registerConfig({
      service: "redis",
      fallbackStrategy: "degrade",
      retryCount: 2,
      retryDelay: 500,
      fallbackService: "memory",
      cacheResults: true,
      cacheTtl: 300000, // 5 minutes
    });

    // OpenRouter - fallback to OpenAI
    this.registerConfig({
      service: "openrouter",
      fallbackStrategy: "degrade",
      retryCount: 2,
      retryDelay: 500,
      fallbackService: "openai",
      cacheResults: true,
      cacheTtl: 1800000, // 30 minutes
    });
  }

  /**
   * Register fallback configuration
   */
  registerConfig(config: FallbackConfig): void {
    this.configs.set(config.service, config);
  }

  /**
   * Execute operation with fallback handling
   */
  async execute<T>(
    service: string,
    operation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>
  ): Promise<FallbackResult<T>> {
    const startTime = performance.now();
    const config = this.configs.get(service);
    const cacheKey = `${service}:${operation.toString()}`;

    // Check cache first
    if (config?.cacheResults) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          source: "cache",
          retriesUsed: 0,
          responseTime: performance.now() - startTime,
        };
      }
    }

    // Try primary operation with retries
    for (let attempt = 0; attempt <= (config?.retryCount || 3); attempt++) {
      try {
        const result = await operation();
        // Cache result if configured
        if (config?.cacheResults && config.cacheTtl) {
          this.setCache(cacheKey, result, config.cacheTtl);
        }
        // Clear failure tracking on success
        this.failureTracking.delete(service);

        return {
          success: true,
          data: result,
          source: "primary",
          retriesUsed: attempt,
          responseTime: performance.now() - startTime,
        };
      } catch {
        // Track failure
        this.trackFailure(service);

        if (attempt < (config?.retryCount || 3)) {
          await this.delay(config?.retryDelay || 1000);
        }
      }
    }

    // Primary failed - check strategy
    if (config?.fallbackStrategy === "fail") {
      return {
        success: false,
        error: `Service ${service} unavailable and no fallback configured`,
        source: "primary",
        retriesUsed: config.retryCount,
        responseTime: performance.now() - startTime,
      };
    }

    // Try fallback operation
    if (fallbackOperation || config?.fallbackService) {
      try {
        const result = await (fallbackOperation || this.getFallbackOperation(config!.fallbackService!))();
        return {
          success: true,
          data: result,
          source: "fallback",
          retriesUsed: config?.retryCount || 3,
          responseTime: performance.now() - startTime,
        };
      } catch (error) {
        return {
          success: false,
          error: `Primary and fallback services failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          source: "fallback",
          retriesUsed: (config?.retryCount || 3) + 1,
          responseTime: performance.now() - startTime,
        };
      }
    }

    return {
      success: false,
      error: `Service ${service} unavailable`,
      source: "primary",
      retriesUsed: config?.retryCount || 3,
      responseTime: performance.now() - startTime,
    };
  }

  /**
   * Get fallback operation for service
   */
  private getFallbackOperation(service: string): () => Promise<unknown> {
    return async () => {
      throw new Error(`No fallback operation for ${service}`);
    };
  }

  /**
   * Cache management
   */
  private setCache(key: string, value: unknown, ttl: number): void {
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttl,
    });
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Track service failures
   */
  private trackFailure(service: string): void {
    const current = this.failureTracking.get(service) || {
      count: 0,
      lastFailure: new Date(),
    };
    current.count++;
    current.lastFailure = new Date();
    this.failureTracking.set(service, current);
  }

  /**
   * Get service health status based on failure tracking
   */
  getServiceHealth(service: string): {
    healthy: boolean;
    failureCount: number;
    lastFailure?: Date;
  } {
    const tracking = this.failureTracking.get(service);
    return {
      healthy: !tracking || tracking.count === 0,
      failureCount: tracking?.count || 0,
      lastFailure: tracking?.lastFailure,
    };
  }

  /**
   * Reset service health tracking
   */
  resetServiceHealth(service: string): void {
    this.failureTracking.delete(service);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance
 */
export const apiFallbackHandler = new ApiFallbackHandler();

/**
 * Helper functions for common operations
 */

/**
 * Execute with fallback for email
 */
export async function sendEmailWithFallback(
  primarySend: () => Promise<void>,
  fallbackSend?: () => Promise<void>
): Promise<FallbackResult<void>> {
  return apiFallbackHandler.execute("email", primarySend, fallbackSend);
}

/**
 * Execute with fallback for transcription
 */
export async function transcribeWithFallback(
  primaryTranscribe: () => Promise<string>,
  fallbackTranscribe?: () => Promise<string>
): Promise<FallbackResult<string>> {
  return apiFallbackHandler.execute("transcribe", primaryTranscribe, fallbackTranscribe);
}

/**
 * Execute with fallback for payment
 */
export async function processPaymentWithFallback(
  primaryProcess: () => Promise<{ transactionId: string }>,
  queueAsBackup?: () => Promise<{ transactionId: string }>
): Promise<FallbackResult<{ transactionId: string }>> {
  return apiFallbackHandler.execute("payment", primaryProcess, queueAsBackup);
}

/**
 * Execute with fallback for caching
 */
export async function getCacheWithFallback(
  primaryGet: () => Promise<unknown>,
  fallbackGet?: () => Promise<unknown>
): Promise<FallbackResult<unknown>> {
  return apiFallbackHandler.execute("cache", primaryGet, fallbackGet);
}
