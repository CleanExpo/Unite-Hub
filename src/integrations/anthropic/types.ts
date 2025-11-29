/**
 * Anthropic Integration Types
 *
 * Type definitions for Anthropic API rate limiting and usage tracking.
 *
 * @module integrations/anthropic/types
 */

import { MessageCreateParams, Message } from '@anthropic-ai/sdk/resources/messages';

/**
 * Supported Claude models
 */
export type ClaudeModel =
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-haiku-4-5-20251001';

/**
 * Model-specific rate limit configurations
 * Based on Anthropic's tier limits
 */
export interface ModelRateLimitConfig {
  model: ClaudeModel;
  requestsPerMinute: number;    // Max requests per minute
  tokensPerMinute: number;       // Max tokens per minute
  tokensPerDay: number;          // Max tokens per day
  concurrentRequests: number;    // Max concurrent requests
}

/**
 * Default rate limit configurations per model
 * Tier 2 limits (adjust based on your tier)
 */
export const MODEL_RATE_LIMITS: Record<ClaudeModel, ModelRateLimitConfig> = {
  'claude-opus-4-5-20251101': {
    model: 'claude-opus-4-5-20251101',
    requestsPerMinute: 50,
    tokensPerMinute: 40000,
    tokensPerDay: 1000000,
    concurrentRequests: 5,
  },
  'claude-sonnet-4-5-20250929': {
    model: 'claude-sonnet-4-5-20250929',
    requestsPerMinute: 50,
    tokensPerMinute: 40000,
    tokensPerDay: 1000000,
    concurrentRequests: 5,
  },
  'claude-haiku-4-5-20251001': {
    model: 'claude-haiku-4-5-20251001',
    requestsPerMinute: 50,
    tokensPerMinute: 50000,
    tokensPerDay: 5000000,
    concurrentRequests: 5,
  },
};

/**
 * Rate limit state for a model
 */
export interface ModelRateLimitState {
  requestCount: number;         // Requests in current minute
  tokenCount: number;           // Tokens in current minute
  dailyTokenCount: number;      // Tokens in current day
  activeRequests: number;       // Currently executing requests
  lastMinuteReset: number;      // Timestamp of last minute reset
  lastDayReset: number;         // Timestamp of last day reset
}

/**
 * Retry options for API calls
 */
export interface RetryOptions {
  maxRetries?: number;          // Max retry attempts (default: 3)
  initialDelayMs?: number;      // Initial delay in ms (default: 1000)
  maxDelayMs?: number;          // Max delay in ms (default: 60000)
  backoffMultiplier?: number;   // Backoff multiplier (default: 2)
  jitterFactor?: number;        // Jitter factor 0-1 (default: 0.1)
  retryOn?: number[];           // HTTP status codes to retry (default: [429, 500, 502, 503, 504])
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  retryOn: [429, 500, 502, 503, 504],
};

/**
 * Usage statistics for a model
 */
export interface ModelUsageStats {
  model: ClaudeModel;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
  rateLimitHits: number;        // Number of times rate limit was hit
  retriesPerformed: number;     // Number of retries performed
  averageLatencyMs: number;     // Average request latency
}

/**
 * Overall usage statistics
 */
export interface UsageStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreationTokens: number;
  totalCacheReadTokens: number;
  totalRateLimitHits: number;
  totalRetries: number;
  averageLatencyMs: number;
  modelStats: Record<ClaudeModel, ModelUsageStats>;
}

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;              // Reason if not allowed
  retryAfterMs?: number;        // Milliseconds until retry allowed
  currentUsage?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    dailyTokens: number;
    concurrentRequests: number;
  };
}

/**
 * API call result with retry metadata
 */
export interface ApiCallResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  retries: number;
  latencyMs: number;
  rateLimitHit: boolean;
}

/**
 * Prompt caching configuration
 */
export interface PromptCachingConfig {
  enabled: boolean;
  cacheControlIndices?: number[];  // Indices of system messages to cache
}

/**
 * Extended message create params with caching
 */
export type MessageCreateParamsWithCaching = MessageCreateParams & {
  system?: Array<{
    type: 'text';
    text: string;
    cache_control?: { type: 'ephemeral' };
  }>;
};

/**
 * Rate limiter event types
 */
export type RateLimiterEvent =
  | 'rate_limit_hit'
  | 'retry_attempted'
  | 'request_success'
  | 'request_error';

/**
 * Event callback for rate limiter
 */
export type RateLimiterEventCallback = (
  event: RateLimiterEvent,
  data: {
    model?: ClaudeModel;
    retries?: number;
    latencyMs?: number;
    error?: Error;
  }
) => void;

/**
 * Anthropic API error codes
 */
export const ANTHROPIC_ERROR_CODES = {
  RATE_LIMITED: 'ANTHROPIC_RATE_LIMITED',
  INVALID_REQUEST: 'ANTHROPIC_INVALID_REQUEST',
  AUTHENTICATION_ERROR: 'ANTHROPIC_AUTHENTICATION_ERROR',
  SERVER_ERROR: 'ANTHROPIC_SERVER_ERROR',
  OVERLOADED: 'ANTHROPIC_OVERLOADED',
  TIMEOUT: 'ANTHROPIC_TIMEOUT',
} as const;

export type AnthropicErrorCode = typeof ANTHROPIC_ERROR_CODES[keyof typeof ANTHROPIC_ERROR_CODES];

/**
 * Extended error with retry information
 */
export interface AnthropicApiError extends Error {
  code: AnthropicErrorCode;
  statusCode?: number;
  retryable: boolean;
  retryAfterMs?: number;
}
