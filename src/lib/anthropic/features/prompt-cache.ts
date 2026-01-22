/**
 * Prompt Caching Utilities for Anthropic Claude API
 *
 * Implements prompt caching for 90% cost savings on cache hits.
 * Supports both 5-minute (default) and 1-hour TTL caching.
 *
 * @see https://platform.claude.com/docs/en/build-with-claude/prompt-caching
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import type { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/messages";

// ============================================================================
// Types
// ============================================================================

export type CacheTTL = "5m" | "1h";

export interface CacheControl {
  type: "ephemeral";
  ttl?: "1h"; // Only needed for 1-hour cache
}

export interface CacheableTextBlock {
  type: "text";
  text: string;
  cache_control?: CacheControl;
}

export interface CacheableSystemPrompt {
  type: "text";
  text: string;
  cache_control?: CacheControl;
}

export interface CacheStats {
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  input_tokens: number;
  output_tokens: number;
}

// ============================================================================
// Cache Control Helpers
// ============================================================================

/**
 * Create a cache control object for prompt caching
 *
 * @param ttl - Time to live: "5m" (default) or "1h" (extended)
 * @returns Cache control object for API request
 */
export function createCacheControl(ttl: CacheTTL = "5m"): CacheControl {
  if (ttl === "1h") {
    return { type: "ephemeral", ttl: "1h" };
  }
  return { type: "ephemeral" };
}

/**
 * Create a cacheable text block for system prompts
 *
 * @param text - The text content to cache
 * @param ttl - Cache TTL (default: 5m)
 * @returns Cacheable text block
 */
export function createCacheableText(
  text: string,
  ttl: CacheTTL = "5m"
): CacheableTextBlock {
  return {
    type: "text",
    text,
    cache_control: createCacheControl(ttl),
  };
}

/**
 * Create a cacheable system prompt array
 *
 * Use this to create system prompts with caching enabled.
 * Place the most stable content first (instructions) and
 * dynamic content last for optimal cache hits.
 *
 * @param blocks - Array of text blocks with optional caching
 * @returns System prompt array ready for API request
 *
 * @example
 * const system = createCacheableSystemPrompt([
 *   { text: "You are a helpful assistant.", cache: true, ttl: "1h" },
 *   { text: largeContextDocument, cache: true, ttl: "5m" },
 *   { text: "Current date: " + new Date().toISOString(), cache: false }
 * ]);
 */
export function createCacheableSystemPrompt(
  blocks: Array<{
    text: string;
    cache?: boolean;
    ttl?: CacheTTL;
  }>
): CacheableSystemPrompt[] {
  return blocks.map((block) => {
    if (block.cache) {
      return {
        type: "text" as const,
        text: block.text,
        cache_control: createCacheControl(block.ttl || "5m"),
      };
    }
    return {
      type: "text" as const,
      text: block.text,
    };
  });
}

// ============================================================================
// Cache-Enabled Message Helpers
// ============================================================================

/**
 * Wrap message params with prompt caching for system prompt
 *
 * @param params - Original message create params
 * @param ttl - Cache TTL for system prompt
 * @returns Modified params with caching enabled
 */
export function withSystemPromptCache<
  T extends Partial<MessageCreateParamsNonStreaming>
>(params: T, ttl: CacheTTL = "5m"): T {
  if (!params.system) {
    return params;
  }

  // If system is a string, convert to cacheable block
  if (typeof params.system === "string") {
    return {
      ...params,
      system: [createCacheableText(params.system, ttl)],
    };
  }

  // If system is already an array, add cache control to last block
  if (Array.isArray(params.system)) {
    const systemBlocks = [...params.system];
    const lastIndex = systemBlocks.length - 1;

    if (lastIndex >= 0 && systemBlocks[lastIndex]) {
      systemBlocks[lastIndex] = {
        ...systemBlocks[lastIndex],
        cache_control: createCacheControl(ttl),
      };
    }

    return {
      ...params,
      system: systemBlocks,
    };
  }

  return params;
}

/**
 * Add cache breakpoint to messages for long conversations
 *
 * Useful for caching conversation history in multi-turn conversations.
 * Place cache breakpoint after stable parts of the conversation.
 *
 * @param messages - Array of messages
 * @param breakpointIndex - Index after which to place cache breakpoint
 * @param ttl - Cache TTL
 * @returns Modified messages with cache breakpoint
 */
export function withMessageCacheBreakpoint<T extends { content: unknown }[]>(
  messages: T,
  breakpointIndex: number,
  ttl: CacheTTL = "5m"
): T {
  if (breakpointIndex < 0 || breakpointIndex >= messages.length) {
    return messages;
  }

  const result = [...messages] as T;
  const targetMessage = result[breakpointIndex];

  if (typeof targetMessage.content === "string") {
    result[breakpointIndex] = {
      ...targetMessage,
      content: [
        {
          type: "text",
          text: targetMessage.content,
          cache_control: createCacheControl(ttl),
        },
      ],
    };
  } else if (Array.isArray(targetMessage.content)) {
    const contentBlocks = [...(targetMessage.content as unknown[])];
    const lastIndex = contentBlocks.length - 1;

    if (lastIndex >= 0) {
      contentBlocks[lastIndex] = {
        ...(contentBlocks[lastIndex] as object),
        cache_control: createCacheControl(ttl),
      };
    }

    result[breakpointIndex] = {
      ...targetMessage,
      content: contentBlocks,
    };
  }

  return result;
}

// ============================================================================
// Cache Statistics Helpers
// ============================================================================

/**
 * Calculate cost savings from cache usage
 *
 * @param stats - Cache statistics from API response
 * @param inputPricePerMTok - Price per million input tokens (default: $3 for Sonnet)
 * @returns Cost savings breakdown
 */
export function calculateCacheSavings(
  stats: CacheStats,
  inputPricePerMTok: number = 3
): {
  cacheHitTokens: number;
  cacheWriteTokens: number;
  regularInputTokens: number;
  estimatedSavingsUSD: number;
  savingsPercentage: number;
} {
  const cacheHitTokens = stats.cache_read_input_tokens || 0;
  const cacheWriteTokens = stats.cache_creation_input_tokens || 0;
  const regularInputTokens =
    stats.input_tokens - cacheHitTokens - cacheWriteTokens;

  // Cache hits are 0.1x price (90% savings)
  // Cache writes are 1.25x price (5m) or 2x price (1h)
  const normalCost = (cacheHitTokens / 1_000_000) * inputPricePerMTok;
  const actualCost = (cacheHitTokens / 1_000_000) * inputPricePerMTok * 0.1;
  const estimatedSavingsUSD = normalCost - actualCost;

  const totalInputTokens = stats.input_tokens;
  const savingsPercentage =
    totalInputTokens > 0 ? (cacheHitTokens / totalInputTokens) * 90 : 0;

  return {
    cacheHitTokens,
    cacheWriteTokens,
    regularInputTokens,
    estimatedSavingsUSD,
    savingsPercentage,
  };
}

/**
 * Log cache statistics in a readable format
 *
 * @param stats - Cache statistics from API response
 * @param label - Optional label for the log
 */
export function logCacheStats(stats: CacheStats, label?: string): void {
  const savings = calculateCacheSavings(stats);

  console.log(`📊 Cache Stats${label ? ` (${label})` : ""}:`);
  console.log(`   Cache Hits: ${savings.cacheHitTokens.toLocaleString()} tokens`);
  console.log(`   Cache Writes: ${savings.cacheWriteTokens.toLocaleString()} tokens`);
  console.log(`   Regular Input: ${savings.regularInputTokens.toLocaleString()} tokens`);
  console.log(`   Output: ${stats.output_tokens.toLocaleString()} tokens`);
  console.log(`   Savings: ~$${savings.estimatedSavingsUSD.toFixed(4)} (${savings.savingsPercentage.toFixed(1)}%)`);
}

// ============================================================================
// Pre-built Cache Configurations
// ============================================================================

/**
 * Standard cache configuration for agent system prompts
 * Uses 1-hour TTL since agent prompts are stable
 */
export const AGENT_SYSTEM_CACHE_CONFIG = {
  ttl: "1h" as CacheTTL,
  description: "Long-running agent system prompts",
};

/**
 * Standard cache configuration for tool definitions
 * Uses 5-minute TTL since tools may change more frequently
 */
export const TOOLS_CACHE_CONFIG = {
  ttl: "5m" as CacheTTL,
  description: "Tool definitions and schemas",
};

/**
 * Standard cache configuration for large document context
 * Uses 1-hour TTL for document analysis tasks
 */
export const DOCUMENT_CACHE_CONFIG = {
  ttl: "1h" as CacheTTL,
  description: "Large document context for analysis",
};

/**
 * Standard cache configuration for conversation history
 * Uses 5-minute TTL since conversations change
 */
export const CONVERSATION_CACHE_CONFIG = {
  ttl: "5m" as CacheTTL,
  description: "Multi-turn conversation history",
};
