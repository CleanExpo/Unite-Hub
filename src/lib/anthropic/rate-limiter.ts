/**
 * Anthropic API Rate Limiter with Exponential Backoff
 * Phase 17 - Production reliability for AI services
 *
 * Features:
 * - Exponential backoff with jitter
 * - Rate limit detection
 * - Request timeout handling
 * - Automatic retries (configurable)
 * - Cost tracking
 */

import Anthropic from "@anthropic-ai/sdk";

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeout?: number;
}

export interface RetryResult<T> {
  data: T;
  attempts: number;
  totalTime: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  timeout: 60000, // 60 seconds
};

/**
 * Sleep with optional jitter
 */
function sleep(ms: number, jitter = true): Promise<void> {
  const delay = jitter ? ms + Math.random() * ms * 0.1 : ms;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Calculate backoff delay with exponential growth
 */
function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    // Rate limit errors
    if (error.status === 429) return true;
    // Server errors
    if (error.status >= 500 && error.status < 600) return true;
    // Timeout errors
    if (error.status === 408 || error.status === 504) return true;
  }

  // Network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("econnreset") ||
      message.includes("econnrefused")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Extract rate limit wait time from error
 */
function getRateLimitWait(error: unknown): number | null {
  if (error instanceof Anthropic.APIError && error.status === 429) {
    // Check for retry-after header
    const headers = error.headers;
    if (headers) {
      const retryAfter = headers["retry-after"];
      if (retryAfter) {
        return parseInt(retryAfter, 10) * 1000;
      }
    }
    // Default rate limit wait
    return 60000; // 60 seconds
  }
  return null;
}

/**
 * Call Anthropic API with automatic retry and exponential backoff
 *
 * @example
 * const result = await callAnthropicWithRetry(async () => {
 *   return await anthropic.messages.create({
 *     model: 'claude-sonnet-4-5-20250929',
 *     max_tokens: 2048,
 *     messages: [{ role: 'user', content: 'Hello' }],
 *   });
 * });
 */
export async function callAnthropicWithRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Request timeout")),
          opts.timeout
        );
      });

      // Race between API call and timeout
      const data = await Promise.race([fn(), timeoutPromise]);

      return {
        data,
        attempts: attempt + 1,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error;

      // Log error
      console.error(
        `Anthropic API attempt ${attempt + 1}/${opts.maxRetries + 1} failed:`,
        error instanceof Error ? error.message : error
      );

      // Check if we should retry
      if (attempt < opts.maxRetries && isRetryableError(error)) {
        // Check for rate limit specific wait time
        const rateLimitWait = getRateLimitWait(error);

        if (rateLimitWait) {
          console.log(
            `Rate limited. Waiting ${rateLimitWait / 1000}s before retry...`
          );
          await sleep(rateLimitWait, false);
        } else {
          // Calculate exponential backoff
          const delay = calculateBackoff(
            attempt,
            opts.baseDelay,
            opts.maxDelay
          );
          console.log(
            `Retrying in ${delay / 1000}s (attempt ${attempt + 2}/${
              opts.maxRetries + 1
            })...`
          );
          await sleep(delay);
        }
        continue;
      }

      // Non-retryable error or max retries exceeded
      throw error;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Create Anthropic client with prompt caching enabled
 */
export function createCachedAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: {
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
  });
}

/**
 * Wrapper for messages.create with caching support
 *
 * @example
 * const message = await createCachedMessage(anthropic, {
 *   model: 'claude-sonnet-4-5-20250929',
 *   systemPrompt: 'You are a helpful assistant.',
 *   userMessage: 'What is 2+2?',
 * });
 */
export async function createCachedMessage(
  client: Anthropic,
  params: {
    model: string;
    systemPrompt: string;
    userMessage: string;
    maxTokens?: number;
  }
): Promise<Anthropic.Messages.Message> {
  return callAnthropicWithRetry(async () => {
    return client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens || 2048,
      system: [
        {
          type: "text",
          text: params.systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: params.userMessage,
        },
      ],
    });
  }).then((result) => result.data);
}

/**
 * Track API usage for cost monitoring
 */
export interface UsageStats {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  estimatedCost: number;
}

/**
 * Calculate estimated cost from usage
 * Prices per million tokens (as of 2024):
 * - Claude Sonnet: $3 input, $15 output
 * - Claude Opus: $15 input, $75 output
 * - Cached input: 90% discount
 */
export function calculateCost(
  usage: Anthropic.Messages.Usage,
  model: string
): UsageStats {
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const cacheReadTokens = (usage as any).cache_read_input_tokens || 0;
  const cacheCreationTokens = (usage as any).cache_creation_input_tokens || 0;

  // Base prices per million tokens
  let inputPrice: number;
  let outputPrice: number;

  if (model.includes("opus")) {
    inputPrice = 15;
    outputPrice = 75;
  } else if (model.includes("haiku")) {
    inputPrice = 0.25;
    outputPrice = 1.25;
  } else {
    // Default to Sonnet pricing
    inputPrice = 3;
    outputPrice = 15;
  }

  // Calculate cost
  const uncachedInputCost =
    ((inputTokens - cacheReadTokens - cacheCreationTokens) / 1_000_000) *
    inputPrice;
  const cachedInputCost = (cacheReadTokens / 1_000_000) * inputPrice * 0.1;
  const cacheCreationCost =
    (cacheCreationTokens / 1_000_000) * inputPrice * 1.25;
  const outputCost = (outputTokens / 1_000_000) * outputPrice;

  const estimatedCost =
    uncachedInputCost + cachedInputCost + cacheCreationCost + outputCost;

  return {
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheCreationTokens,
    estimatedCost,
  };
}
