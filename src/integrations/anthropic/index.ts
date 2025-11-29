/**
 * Anthropic Integration
 *
 * Main exports for Anthropic API rate limiting and usage tracking.
 *
 * @module integrations/anthropic
 */

export {
  AnthropicRateLimiter,
  callAnthropicWithRetry,
  getAnthropicRateLimiter,
} from './rate-limiter';

export type {
  ClaudeModel,
  ModelRateLimitConfig,
  ModelRateLimitState,
  ModelUsageStats,
  UsageStats,
  RateLimitCheckResult,
  ApiCallResult,
  RetryOptions,
  PromptCachingConfig,
  MessageCreateParamsWithCaching,
  RateLimiterEvent,
  RateLimiterEventCallback,
  AnthropicApiError,
  AnthropicErrorCode,
} from './types';

export {
  MODEL_RATE_LIMITS,
  DEFAULT_RETRY_OPTIONS,
  ANTHROPIC_ERROR_CODES,
} from './types';
