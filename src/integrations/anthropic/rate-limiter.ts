/**
 * Anthropic API Rate Limiter
 *
 * Enhanced rate limiter for Anthropic API with exponential backoff,
 * per-model rate limiting, and usage tracking.
 *
 * @module integrations/anthropic/rate-limiter
 *
 * @example
 * ```typescript
 * import { AnthropicRateLimiter } from '@/integrations/anthropic/rate-limiter';
 *
 * const limiter = AnthropicRateLimiter.getInstance();
 *
 * const result = await limiter.callWithRetry(
 *   async () => anthropic.messages.create({ ... }),
 *   { model: 'claude-sonnet-4-5-20250929' }
 * );
 * ```
 */

import Anthropic from '@anthropic-ai/sdk';
import { Message } from '@anthropic-ai/sdk/resources/messages';
import {
  ClaudeModel,
  ModelRateLimitState,
  ModelUsageStats,
  UsageStats,
  RateLimitCheckResult,
  ApiCallResult,
  RetryOptions,
  RateLimiterEventCallback,
  AnthropicApiError,
  MODEL_RATE_LIMITS,
  DEFAULT_RETRY_OPTIONS,
  ANTHROPIC_ERROR_CODES,
} from './types';

/**
 * Singleton rate limiter for Anthropic API
 */
export class AnthropicRateLimiter {
  private static instance: AnthropicRateLimiter;

  // Rate limit state per model
  private modelStates: Map<ClaudeModel, ModelRateLimitState>;

  // Usage statistics per model
  private usageStats: Map<ClaudeModel, ModelUsageStats>;

  // Event callbacks
  private eventCallbacks: RateLimiterEventCallback[] = [];

  private constructor() {
    this.modelStates = new Map();
    this.usageStats = new Map();

    // Initialize state for all models
    this.initializeModelStates();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AnthropicRateLimiter {
    if (!AnthropicRateLimiter.instance) {
      AnthropicRateLimiter.instance = new AnthropicRateLimiter();
    }
    return AnthropicRateLimiter.instance;
  }

  /**
   * Initialize rate limit state for all models
   */
  private initializeModelStates(): void {
    const now = Date.now();

    Object.keys(MODEL_RATE_LIMITS).forEach((model) => {
      const claudeModel = model as ClaudeModel;

      this.modelStates.set(claudeModel, {
        requestCount: 0,
        tokenCount: 0,
        dailyTokenCount: 0,
        activeRequests: 0,
        lastMinuteReset: now,
        lastDayReset: now,
      });

      this.usageStats.set(claudeModel, {
        model: claudeModel,
        requestCount: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheCreationTokens: 0,
        totalCacheReadTokens: 0,
        rateLimitHits: 0,
        retriesPerformed: 0,
        averageLatencyMs: 0,
      });
    });
  }

  /**
   * Register event callback
   */
  public onEvent(callback: RateLimiterEventCallback): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Emit event to all callbacks
   */
  private emitEvent(
    event: string,
    data: Parameters<RateLimiterEventCallback>[1]
  ): void {
    this.eventCallbacks.forEach((callback) => {
      try {
        callback(event as any, data);
      } catch (error) {
        console.error('Error in rate limiter event callback:', error);
      }
    });
  }

  /**
   * Reset state if time windows have elapsed
   */
  private resetStateIfNeeded(model: ClaudeModel): void {
    const state = this.modelStates.get(model);
    if (!state) return;

    const now = Date.now();
    const minuteMs = 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;

    // Reset minute counters
    if (now - state.lastMinuteReset >= minuteMs) {
      state.requestCount = 0;
      state.tokenCount = 0;
      state.lastMinuteReset = now;
    }

    // Reset daily counters
    if (now - state.lastDayReset >= dayMs) {
      state.dailyTokenCount = 0;
      state.lastDayReset = now;
    }

    this.modelStates.set(model, state);
  }

  /**
   * Check if request is allowed under rate limits
   *
   * @param model - Claude model to check
   * @param estimatedTokens - Estimated token usage (default: 0)
   * @returns Rate limit check result
   */
  public checkModelLimit(
    model: ClaudeModel,
    estimatedTokens: number = 0
  ): RateLimitCheckResult {
    this.resetStateIfNeeded(model);

    const state = this.modelStates.get(model);
    const config = MODEL_RATE_LIMITS[model];

    if (!state || !config) {
      return {
        allowed: false,
        reason: 'Invalid model configuration',
      };
    }

    // Check concurrent requests
    if (state.activeRequests >= config.concurrentRequests) {
      return {
        allowed: false,
        reason: 'Concurrent request limit exceeded',
        retryAfterMs: 1000,
        currentUsage: {
          requestsPerMinute: state.requestCount,
          tokensPerMinute: state.tokenCount,
          dailyTokens: state.dailyTokenCount,
          concurrentRequests: state.activeRequests,
        },
      };
    }

    // Check requests per minute
    if (state.requestCount >= config.requestsPerMinute) {
      const retryAfterMs = 60000 - (Date.now() - state.lastMinuteReset);
      return {
        allowed: false,
        reason: 'Requests per minute limit exceeded',
        retryAfterMs: Math.max(retryAfterMs, 0),
        currentUsage: {
          requestsPerMinute: state.requestCount,
          tokensPerMinute: state.tokenCount,
          dailyTokens: state.dailyTokenCount,
          concurrentRequests: state.activeRequests,
        },
      };
    }

    // Check tokens per minute
    if (state.tokenCount + estimatedTokens > config.tokensPerMinute) {
      const retryAfterMs = 60000 - (Date.now() - state.lastMinuteReset);
      return {
        allowed: false,
        reason: 'Tokens per minute limit exceeded',
        retryAfterMs: Math.max(retryAfterMs, 0),
        currentUsage: {
          requestsPerMinute: state.requestCount,
          tokensPerMinute: state.tokenCount,
          dailyTokens: state.dailyTokenCount,
          concurrentRequests: state.activeRequests,
        },
      };
    }

    // Check daily token limit
    if (state.dailyTokenCount + estimatedTokens > config.tokensPerDay) {
      const dayMs = 24 * 60 * 60 * 1000;
      const retryAfterMs = dayMs - (Date.now() - state.lastDayReset);
      return {
        allowed: false,
        reason: 'Daily token limit exceeded',
        retryAfterMs: Math.max(retryAfterMs, 0),
        currentUsage: {
          requestsPerMinute: state.requestCount,
          tokensPerMinute: state.tokenCount,
          dailyTokens: state.dailyTokenCount,
          concurrentRequests: state.activeRequests,
        },
      };
    }

    return {
      allowed: true,
      currentUsage: {
        requestsPerMinute: state.requestCount,
        tokensPerMinute: state.tokenCount,
        dailyTokens: state.dailyTokenCount,
        concurrentRequests: state.activeRequests,
      },
    };
  }

  /**
   * Track API usage after successful request
   *
   * @param model - Claude model used
   * @param tokens - Token usage from response
   */
  public trackUsage(
    model: ClaudeModel,
    tokens: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    }
  ): void {
    const state = this.modelStates.get(model);
    const stats = this.usageStats.get(model);

    if (!state || !stats) return;

    // Update state
    state.requestCount++;
    state.tokenCount += tokens.input_tokens + tokens.output_tokens;
    state.dailyTokenCount += tokens.input_tokens + tokens.output_tokens;

    // Update usage statistics
    stats.requestCount++;
    stats.totalInputTokens += tokens.input_tokens;
    stats.totalOutputTokens += tokens.output_tokens;
    stats.totalCacheCreationTokens += tokens.cache_creation_input_tokens || 0;
    stats.totalCacheReadTokens += tokens.cache_read_input_tokens || 0;

    this.modelStates.set(model, state);
    this.usageStats.set(model, stats);
  }

  /**
   * Increment active request count
   */
  private incrementActiveRequests(model: ClaudeModel): void {
    const state = this.modelStates.get(model);
    if (state) {
      state.activeRequests++;
      this.modelStates.set(model, state);
    }
  }

  /**
   * Decrement active request count
   */
  private decrementActiveRequests(model: ClaudeModel): void {
    const state = this.modelStates.get(model);
    if (state) {
      state.activeRequests = Math.max(0, state.activeRequests - 1);
      this.modelStates.set(model, state);
    }
  }

  /**
   * Calculate exponential backoff delay with jitter
   *
   * @param attempt - Current retry attempt (0-indexed)
   * @param options - Retry options
   * @returns Delay in milliseconds
   */
  private calculateBackoffDelay(
    attempt: number,
    options: Required<RetryOptions>
  ): number {
    const exponentialDelay = Math.min(
      options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt),
      options.maxDelayMs
    );

    // Add jitter to prevent thundering herd
    const jitter = exponentialDelay * options.jitterFactor * (Math.random() - 0.5);

    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any, retryOn: number[]): boolean {
    // Check HTTP status code
    if (error.status && retryOn.includes(error.status)) {
      return true;
    }

    // Check for network errors
    if (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND'
    ) {
      return true;
    }

    return false;
  }

  /**
   * Get retry-after delay from error response
   */
  private getRetryAfter(error: any): number | null {
    // Check for Retry-After header
    if (error.response?.headers?.['retry-after']) {
      const retryAfter = parseInt(error.response.headers['retry-after'], 10);
      if (!isNaN(retryAfter)) {
        return retryAfter * 1000; // Convert to milliseconds
      }
    }

    // Check for rate limit error with retry info
    if (error.status === 429) {
      return 60000; // Default to 1 minute for rate limit errors
    }

    return null;
  }

  /**
   * Call Anthropic API with retry logic and rate limiting
   *
   * @param fn - Function that makes the API call
   * @param options - Configuration options
   * @returns API call result
   *
   * @example
   * ```typescript
   * const result = await limiter.callWithRetry(
   *   async () => anthropic.messages.create({
   *     model: 'claude-sonnet-4-5-20250929',
   *     max_tokens: 1024,
   *     messages: [{ role: 'user', content: 'Hello' }],
   *   }),
   *   { model: 'claude-sonnet-4-5-20250929' }
   * );
   * ```
   */
  public async callWithRetry<T extends Message>(
    fn: () => Promise<T>,
    options: {
      model: ClaudeModel;
      estimatedTokens?: number;
      retryOptions?: Partial<RetryOptions>;
    }
  ): Promise<ApiCallResult<T>> {
    const retryConfig = {
      ...DEFAULT_RETRY_OPTIONS,
      ...options.retryOptions,
    };

    const startTime = Date.now();
    let retries = 0;
    let rateLimitHit = false;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Check rate limits before attempting request
        const limitCheck = this.checkModelLimit(
          options.model,
          options.estimatedTokens || 0
        );

        if (!limitCheck.allowed) {
          rateLimitHit = true;
          const stats = this.usageStats.get(options.model);
          if (stats) {
            stats.rateLimitHits++;
            this.usageStats.set(options.model, stats);
          }

          this.emitEvent('rate_limit_hit', {
            model: options.model,
            retries: attempt,
          });

          // If we have retries left, wait and try again
          if (attempt < retryConfig.maxRetries) {
            const delayMs = limitCheck.retryAfterMs || this.calculateBackoffDelay(attempt, retryConfig);
            await this.sleep(delayMs);
            retries++;
            continue;
          } else {
            throw new Error(`Rate limit exceeded: ${limitCheck.reason}`);
          }
        }

        // Increment active requests
        this.incrementActiveRequests(options.model);

        try {
          // Execute the API call
          const result = await fn();

          // Track usage
          this.trackUsage(options.model, result.usage);

          // Update average latency
          const latencyMs = Date.now() - startTime;
          const stats = this.usageStats.get(options.model);
          if (stats) {
            const totalLatency = stats.averageLatencyMs * (stats.requestCount - 1);
            stats.averageLatencyMs = (totalLatency + latencyMs) / stats.requestCount;
            this.usageStats.set(options.model, stats);
          }

          this.emitEvent('request_success', {
            model: options.model,
            retries,
            latencyMs,
          });

          return {
            success: true,
            data: result,
            retries,
            latencyMs,
            rateLimitHit,
          };
        } finally {
          // Decrement active requests
          this.decrementActiveRequests(options.model);
        }
      } catch (error: any) {
        lastError = error;

        // Track retry
        const stats = this.usageStats.get(options.model);
        if (stats) {
          stats.retriesPerformed++;
          this.usageStats.set(options.model, stats);
        }

        // Check if error is retryable
        if (!this.isRetryableError(error, retryConfig.retryOn)) {
          this.emitEvent('request_error', {
            model: options.model,
            retries: attempt,
            error,
          });

          return {
            success: false,
            error,
            retries: attempt,
            latencyMs: Date.now() - startTime,
            rateLimitHit,
          };
        }

        // If we have retries left, wait and try again
        if (attempt < retryConfig.maxRetries) {
          this.emitEvent('retry_attempted', {
            model: options.model,
            retries: attempt + 1,
            error,
          });

          // Check for retry-after header
          const retryAfter = this.getRetryAfter(error);
          const delayMs = retryAfter || this.calculateBackoffDelay(attempt, retryConfig);

          await this.sleep(delayMs);
          retries++;
        }
      }
    }

    // All retries exhausted
    this.emitEvent('request_error', {
      model: options.model,
      retries,
      error: lastError,
    });

    return {
      success: false,
      error: lastError,
      retries,
      latencyMs: Date.now() - startTime,
      rateLimitHit,
    };
  }

  /**
   * Get usage statistics for a specific model
   *
   * @param model - Claude model
   * @returns Model usage statistics
   */
  public getModelStats(model: ClaudeModel): ModelUsageStats | undefined {
    return this.usageStats.get(model);
  }

  /**
   * Get overall usage statistics across all models
   *
   * @returns Overall usage statistics
   */
  public getUsageStats(): UsageStats {
    let totalRequests = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheCreationTokens = 0;
    let totalCacheReadTokens = 0;
    let totalRateLimitHits = 0;
    let totalRetries = 0;
    let totalLatencyMs = 0;
    let totalLatencyCount = 0;

    const modelStats: Record<ClaudeModel, ModelUsageStats> = {} as any;

    this.usageStats.forEach((stats, model) => {
      totalRequests += stats.requestCount;
      totalInputTokens += stats.totalInputTokens;
      totalOutputTokens += stats.totalOutputTokens;
      totalCacheCreationTokens += stats.totalCacheCreationTokens;
      totalCacheReadTokens += stats.totalCacheReadTokens;
      totalRateLimitHits += stats.rateLimitHits;
      totalRetries += stats.retriesPerformed;

      if (stats.requestCount > 0) {
        totalLatencyMs += stats.averageLatencyMs * stats.requestCount;
        totalLatencyCount += stats.requestCount;
      }

      modelStats[model] = { ...stats };
    });

    return {
      totalRequests,
      totalInputTokens,
      totalOutputTokens,
      totalCacheCreationTokens,
      totalCacheReadTokens,
      totalRateLimitHits,
      totalRetries,
      averageLatencyMs: totalLatencyCount > 0 ? totalLatencyMs / totalLatencyCount : 0,
      modelStats,
    };
  }

  /**
   * Reset all statistics (for testing)
   */
  public resetStats(): void {
    this.initializeModelStates();
  }

  /**
   * Get current rate limit state for a model
   */
  public getModelState(model: ClaudeModel): ModelRateLimitState | undefined {
    return this.modelStates.get(model);
  }
}

/**
 * Convenience function to call Anthropic API with retry
 */
export async function callAnthropicWithRetry<T extends Message>(
  fn: () => Promise<T>,
  options: {
    model: ClaudeModel;
    estimatedTokens?: number;
    retryOptions?: Partial<RetryOptions>;
  }
): Promise<ApiCallResult<T>> {
  const limiter = AnthropicRateLimiter.getInstance();
  return limiter.callWithRetry(fn, options);
}

/**
 * Get singleton rate limiter instance
 */
export function getAnthropicRateLimiter(): AnthropicRateLimiter {
  return AnthropicRateLimiter.getInstance();
}
