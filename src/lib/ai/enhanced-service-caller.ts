/**
 * Enhanced AI Service Caller
 *
 * High-level abstraction for calling AI services with automatic retry,
 * error recovery, and consistent patterns across all agents.
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Schema cache detection and handling
 * - Environment validation before calls
 * - Consistent error handling
 * - Cost tracking and logging
 * - Model selection based on task complexity
 *
 * Usage:
 *   import { callAIService, AIServiceOptions } from '@/lib/ai/enhanced-service-caller';
 *
 *   const result = await callAIService({
 *     model: 'sonnet', // or 'opus', 'haiku'
 *     systemPrompt: 'You are an email intelligence agent...',
 *     userMessage: emailContent,
 *     maxTokens: 2048,
 *     options: { thinking: false, caching: true }
 *   });
 */

import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '../anthropic/rate-limiter';
import { validateEnvironmentOrThrow, isCategoryConfigured } from '../config/environment-validator';

export type AIModel = 'opus' | 'sonnet' | 'haiku';

export interface AIServiceOptions {
  /** Use Extended Thinking (Opus only, expensive) */
  thinking?: boolean;
  /** Thinking token budget (if thinking enabled) */
  thinkingBudget?: number;
  /** Enable prompt caching (90% cost savings) */
  caching?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Additional metadata for logging */
  metadata?: Record<string, any>;
}

export interface AIServiceRequest {
  /** Model to use: 'opus' (Extended Thinking), 'sonnet' (standard), 'haiku' (quick) */
  model?: AIModel;
  /** System prompt (can be cached) */
  systemPrompt: string;
  /** User message */
  userMessage: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Service options */
  options?: AIServiceOptions;
}

export interface AIServiceResult {
  /** Generated text response */
  content: string;
  /** Thinking content (if Extended Thinking used) */
  thinking?: string;
  /** Model used */
  model: string;
  /** Usage statistics */
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    thinkingTokens?: number;
  };
  /** Cost in USD */
  estimatedCost: number;
  /** Number of retry attempts */
  attempts: number;
  /** Total time in milliseconds */
  totalTime: number;
}

/**
 * Model ID mapping
 */
const MODEL_IDS: Record<AIModel, string> = {
  opus: 'claude-opus-4-5-20251101',
  sonnet: 'claude-sonnet-4-5-20250929',
  haiku: 'claude-haiku-4-5-20251001',
};

/**
 * Model pricing (per million tokens)
 */
const MODEL_PRICING: Record<AIModel, { input: number; output: number }> = {
  opus: { input: 3.0, output: 15.0 },
  sonnet: { input: 0.8, output: 4.0 },
  haiku: { input: 0.15, output: 0.5 },
};

/**
 * Calculate estimated cost
 */
function calculateCost(
  model: AIModel,
  usage: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
  }
): number {
  const pricing = MODEL_PRICING[model];
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;

  // Extended Thinking tokens are expensive (27x more than non-thinking)
  const thinkingCost = usage.thinkingTokens
    ? (usage.thinkingTokens / 1_000_000) * 7.5 // $7.50/MTok for thinking
    : 0;

  return inputCost + outputCost + thinkingCost;
}

/**
 * Detect and handle Supabase schema cache issues
 */
function detectSchemaCacheIssue(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('relation') &&
      message.includes('does not exist') &&
      message.includes('cache')
    );
  }
  return false;
}

/**
 * Main AI service caller with enhanced error recovery
 */
export async function callAIService(
  request: AIServiceRequest
): Promise<AIServiceResult> {
  const startTime = Date.now();

  // Validate environment before making API calls
  try {
    validateEnvironmentOrThrow();
  } catch (error) {
    throw new Error(
      `Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Check AI category is configured
  if (!isCategoryConfigured('ai')) {
    throw new Error('AI services not configured. ANTHROPIC_API_KEY is missing.');
  }

  // Extract request parameters
  const {
    model = 'sonnet',
    systemPrompt,
    userMessage,
    maxTokens = 2048,
    options = {},
  } = request;

  const {
    thinking = false,
    thinkingBudget = 10000,
    caching = false,
    maxRetries = 3,
    timeout = 60000,
    metadata = {},
  } = options;

  // Validate Extended Thinking only works with Opus
  if (thinking && model !== 'opus') {
    console.warn(
      `⚠️ Extended Thinking requested but model is ${model}. Switching to Opus.`
    );
  }

  const effectiveModel: AIModel = thinking ? 'opus' : model;
  const modelId = MODEL_IDS[effectiveModel];

  // Get Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    ...(caching && {
      defaultHeaders: {
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
    }),
    ...(thinking && {
      defaultHeaders: {
        'anthropic-beta': 'thinking-2025-11-15',
      },
    }),
  });

  // Build system messages
  const systemMessages: Anthropic.Messages.MessageCreateParams['system'] = [];

  if (typeof systemPrompt === 'string') {
    systemMessages.push({
      type: 'text',
      text: systemPrompt,
      ...(caching && { cache_control: { type: 'ephemeral' as const } }),
    });
  }

  // Build message request
  const messageRequest: Anthropic.Messages.MessageCreateParams = {
    model: modelId,
    max_tokens: maxTokens,
    system: systemMessages.length > 0 ? systemMessages : undefined,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
    ...(thinking && {
      thinking: {
        type: 'enabled' as const,
        budget_tokens: thinkingBudget,
      },
    }),
  };

  // Call Anthropic API with retry
  let attempts = 0;
  let lastError: unknown;

  try {
    const result = await callAnthropicWithRetry(
      async () => {
        attempts++;
        return await anthropic.messages.create(messageRequest);
      },
      { maxRetries, timeout }
    );

    // Extract content
    const textContent = result.content.find((c) => c.type === 'text');
    const thinkingContent = result.content.find((c) => c.type === 'thinking');

    const content = textContent && 'text' in textContent ? textContent.text : '';
    const thinkingText =
      thinkingContent && 'thinking' in thinkingContent
        ? thinkingContent.thinking
        : undefined;

    // Extract usage
    const usage = {
      inputTokens: result.usage.input_tokens,
      outputTokens: result.usage.output_tokens,
      cacheReadTokens:
        'cache_read_input_tokens' in result.usage
          ? result.usage.cache_read_input_tokens
          : undefined,
      cacheWriteTokens:
        'cache_creation_input_tokens' in result.usage
          ? result.usage.cache_creation_input_tokens
          : undefined,
      thinkingTokens:
        'thinking_tokens' in result.usage ? result.usage.thinking_tokens : undefined,
    };

    // Calculate cost
    const estimatedCost = calculateCost(effectiveModel, usage);

    const totalTime = Date.now() - startTime;

    // Log result for monitoring
    console.log(
      `✅ AI Service Call Successful: ${effectiveModel} | ${attempts} attempts | ${totalTime}ms | $${estimatedCost.toFixed(4)}`
    );

    return {
      content,
      thinking: thinkingText,
      model: modelId,
      usage,
      estimatedCost,
      attempts,
      totalTime,
    };
  } catch (error) {
    lastError = error;

    // Handle schema cache issues
    if (detectSchemaCacheIssue(error)) {
      console.error(
        '❌ Supabase schema cache issue detected. Wait 1-5 minutes or run: SELECT * FROM table_name LIMIT 1;'
      );
      throw new Error(
        'Database schema cache issue. Please wait a few minutes and retry.'
      );
    }

    // Handle rate limiting
    if (error instanceof Anthropic.APIError && error.status === 429) {
      console.error('❌ Anthropic API rate limit exceeded. Retries exhausted.');
      throw new Error(
        'Anthropic API rate limit exceeded. Please wait and retry later.'
      );
    }

    // Handle authentication errors
    if (error instanceof Anthropic.APIError && error.status === 401) {
      console.error('❌ Anthropic API authentication failed. Check ANTHROPIC_API_KEY.');
      throw new Error('Anthropic API authentication failed. Invalid API key.');
    }

    // Generic error
    const totalTime = Date.now() - startTime;
    console.error(
      `❌ AI Service Call Failed: ${effectiveModel} | ${attempts} attempts | ${totalTime}ms | Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    throw error;
  }
}

/**
 * Quick helper for simple AI calls without Extended Thinking
 */
export async function quickAICall(
  systemPrompt: string,
  userMessage: string,
  model: AIModel = 'sonnet'
): Promise<string> {
  const result = await callAIService({
    model,
    systemPrompt,
    userMessage,
    maxTokens: 2048,
    options: { thinking: false, caching: false },
  });

  return result.content;
}

/**
 * Extended Thinking call for complex tasks (Opus only, expensive)
 */
export async function extendedThinkingCall(
  systemPrompt: string,
  userMessage: string,
  thinkingBudget: number = 10000
): Promise<{ content: string; thinking?: string }> {
  const result = await callAIService({
    model: 'opus',
    systemPrompt,
    userMessage,
    maxTokens: 4096,
    options: { thinking: true, thinkingBudget, caching: true },
  });

  return {
    content: result.content,
    thinking: result.thinking,
  };
}

/**
 * Cached call for repeated operations (90% cost savings)
 */
export async function cachedAICall(
  systemPrompt: string,
  userMessage: string,
  model: AIModel = 'sonnet'
): Promise<string> {
  const result = await callAIService({
    model,
    systemPrompt,
    userMessage,
    maxTokens: 2048,
    options: { thinking: false, caching: true },
  });

  // Log cache performance
  if (result.usage.cacheReadTokens && result.usage.cacheReadTokens > 0) {
    const cacheHitRate =
      (result.usage.cacheReadTokens /
        (result.usage.inputTokens + result.usage.cacheReadTokens)) *
      100;
    console.log(`📊 Cache hit: ${cacheHitRate.toFixed(1)}% | Saved tokens: ${result.usage.cacheReadTokens}`);
  }

  return result.content;
}

/**
 * Batch AI calls with rate limiting
 */
export async function batchAICalls(
  requests: AIServiceRequest[],
  options: { concurrency?: number; delayMs?: number } = {}
): Promise<AIServiceResult[]> {
  const { concurrency = 3, delayMs = 1000 } = options;

  const results: AIServiceResult[] = [];
  const queue = [...requests];

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);

    const batchResults = await Promise.all(
      batch.map(async (request) => {
        try {
          return await callAIService(request);
        } catch (error) {
          console.error(`Batch call failed:`, error);
          throw error;
        }
      })
    );

    results.push(...batchResults);

    // Delay between batches to avoid rate limits
    if (queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
