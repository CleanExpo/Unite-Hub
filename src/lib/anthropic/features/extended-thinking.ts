/**
 * Extended Thinking Utilities for Anthropic Claude API
 *
 * Provides helpers for using Claude's extended thinking capabilities,
 * including interleaved thinking for tool use workflows.
 *
 * @see https://platform.claude.com/docs/en/build-with-claude/extended-thinking
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import type {
  MessageCreateParamsNonStreaming,
  MessageCreateParamsStreaming,
} from "@anthropic-ai/sdk/resources/messages";

// ============================================================================
// Types
// ============================================================================

export interface ThinkingConfig {
  type: "enabled";
  budget_tokens: number;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
  signature: string;
}

export interface RedactedThinkingBlock {
  type: "redacted_thinking";
  data: string;
}

export interface TextBlock {
  type: "text";
  text: string;
}

export type ContentBlock = ThinkingBlock | RedactedThinkingBlock | TextBlock;

export interface ThinkingResponse {
  thinking: string | null;
  text: string;
  hasRedactedThinking: boolean;
  thinkingBlocks: (ThinkingBlock | RedactedThinkingBlock)[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Models that support extended thinking
 */
export const THINKING_SUPPORTED_MODELS = [
  "claude-opus-4-5-20251101",
  "claude-opus-4-1-20250805",
  "claude-opus-4-20250514",
  "claude-sonnet-4-5-20250929",
  "claude-sonnet-4-20250514",
  "claude-haiku-4-5-20251001",
] as const;

/**
 * Beta header required for interleaved thinking
 */
export const INTERLEAVED_THINKING_HEADER = "interleaved-thinking-2025-05-14";

/**
 * Recommended budget tokens for different use cases
 */
export const THINKING_BUDGETS = {
  /** Quick analysis, simple questions */
  MINIMAL: 1024,
  /** Standard reasoning tasks */
  STANDARD: 5000,
  /** Complex multi-step problems */
  COMPLEX: 10000,
  /** Deep analysis, math, coding */
  DEEP: 16000,
  /** Maximum for non-interleaved */
  MAXIMUM: 32000,
} as const;

// ============================================================================
// Configuration Helpers
// ============================================================================

/**
 * Create a thinking configuration object
 *
 * @param budgetTokens - Maximum tokens for thinking (min: 1024)
 * @returns Thinking configuration for API request
 *
 * @example
 * const thinking = createThinkingConfig(10000);
 * // { type: "enabled", budget_tokens: 10000 }
 */
export function createThinkingConfig(budgetTokens: number): ThinkingConfig {
  // Enforce minimum of 1024 tokens
  const budget = Math.max(1024, budgetTokens);

  return {
    type: "enabled",
    budget_tokens: budget,
  };
}

/**
 * Add extended thinking to message params
 *
 * @param params - Original message create params
 * @param budgetTokens - Thinking budget (default: 10000)
 * @returns Modified params with thinking enabled
 *
 * @example
 * const params = withThinking({
 *   model: "claude-opus-4-5-20251101",
 *   max_tokens: 16000,
 *   messages: [{ role: "user", content: "Solve this complex math problem..." }]
 * }, 10000);
 */
export function withThinking<
  T extends Partial<MessageCreateParamsNonStreaming | MessageCreateParamsStreaming>
>(params: T, budgetTokens: number = THINKING_BUDGETS.COMPLEX): T & { thinking: ThinkingConfig } {
  return {
    ...params,
    thinking: createThinkingConfig(budgetTokens),
  };
}

/**
 * Check if a model supports extended thinking
 *
 * @param model - Model ID to check
 * @returns True if model supports extended thinking
 */
export function supportsThinking(model: string): boolean {
  return THINKING_SUPPORTED_MODELS.some((m) => model.includes(m) || m.includes(model));
}

// ============================================================================
// Response Processing Helpers
// ============================================================================

/**
 * Extract thinking content from API response
 *
 * @param content - Content blocks from API response
 * @returns Processed thinking response
 *
 * @example
 * const response = await client.messages.create({ ... });
 * const { thinking, text, hasRedactedThinking } = extractThinking(response.content);
 */
export function extractThinking(content: ContentBlock[]): ThinkingResponse {
  const thinkingBlocks: (ThinkingBlock | RedactedThinkingBlock)[] = [];
  let thinking: string | null = null;
  let text = "";
  let hasRedactedThinking = false;

  for (const block of content) {
    if (block.type === "thinking") {
      thinkingBlocks.push(block);
      thinking = (thinking || "") + block.thinking;
    } else if (block.type === "redacted_thinking") {
      thinkingBlocks.push(block);
      hasRedactedThinking = true;
    } else if (block.type === "text") {
      text += block.text;
    }
  }

  return {
    thinking,
    text,
    hasRedactedThinking,
    thinkingBlocks,
  };
}

/**
 * Preserve thinking blocks for tool use continuation
 *
 * When using tools with extended thinking, you must pass back
 * all thinking blocks from the last assistant message.
 *
 * @param content - Content blocks from assistant response
 * @returns Content blocks to include in next request
 */
export function preserveThinkingBlocks(content: ContentBlock[]): ContentBlock[] {
  // Return all blocks - thinking, redacted_thinking, tool_use, and text
  // The API will handle filtering as needed
  return content;
}

/**
 * Check if response contains redacted thinking
 *
 * Redacted thinking occurs when Claude's internal reasoning
 * is flagged by safety systems. The content is encrypted but
 * can still be used in subsequent requests.
 *
 * @param content - Content blocks from API response
 * @returns True if response contains redacted thinking
 */
export function hasRedactedThinking(content: ContentBlock[]): boolean {
  return content.some((block) => block.type === "redacted_thinking");
}

// ============================================================================
// Interleaved Thinking Helpers
// ============================================================================

/**
 * Create headers for interleaved thinking support
 *
 * Interleaved thinking allows Claude to think between tool calls,
 * enabling more sophisticated reasoning in agentic workflows.
 *
 * @returns Headers object with interleaved thinking beta
 */
export function getInterleavedThinkingHeaders(): Record<string, string> {
  return {
    "anthropic-beta": INTERLEAVED_THINKING_HEADER,
  };
}

/**
 * Add interleaved thinking support to request options
 *
 * @param options - Existing request options
 * @returns Options with interleaved thinking header
 */
export function withInterleavedThinking<T extends { headers?: Record<string, string> }>(
  options: T
): T {
  return {
    ...options,
    headers: {
      ...options.headers,
      "anthropic-beta": INTERLEAVED_THINKING_HEADER,
    },
  };
}

// ============================================================================
// Budget Calculation Helpers
// ============================================================================

/**
 * Calculate recommended thinking budget based on task complexity
 *
 * @param taskDescription - Brief description of the task
 * @param contextLength - Approximate context length in tokens
 * @returns Recommended budget tokens
 */
export function recommendThinkingBudget(
  taskDescription: string,
  contextLength: number = 0
): number {
  const lowerTask = taskDescription.toLowerCase();

  // Complex tasks that benefit from more thinking
  const complexIndicators = [
    "math",
    "calculate",
    "prove",
    "analyze",
    "debug",
    "refactor",
    "architect",
    "design",
    "optimize",
    "complex",
    "multi-step",
    "reasoning",
  ];

  const isComplex = complexIndicators.some((indicator) =>
    lowerTask.includes(indicator)
  );

  // Base budget on complexity
  let budget = isComplex ? THINKING_BUDGETS.COMPLEX : THINKING_BUDGETS.STANDARD;

  // Increase budget for longer contexts
  if (contextLength > 50000) {
    budget = Math.min(budget * 1.5, THINKING_BUDGETS.DEEP);
  } else if (contextLength > 100000) {
    budget = THINKING_BUDGETS.MAXIMUM;
  }

  return Math.round(budget);
}

/**
 * Validate thinking budget against max_tokens
 *
 * budget_tokens must be less than max_tokens for non-interleaved thinking.
 * With interleaved thinking, budget can exceed max_tokens.
 *
 * @param budgetTokens - Proposed thinking budget
 * @param maxTokens - max_tokens value in request
 * @param interleaved - Whether using interleaved thinking
 * @returns Valid budget tokens value
 */
export function validateThinkingBudget(
  budgetTokens: number,
  maxTokens: number,
  interleaved: boolean = false
): number {
  // Minimum budget is 1024
  const budget = Math.max(1024, budgetTokens);

  // For non-interleaved, budget must be less than max_tokens
  if (!interleaved && budget >= maxTokens) {
    return Math.max(1024, maxTokens - 1000);
  }

  return budget;
}

// ============================================================================
// Pre-built Configurations
// ============================================================================

/**
 * Configuration for quick reasoning tasks
 */
export const QUICK_THINKING_CONFIG: ThinkingConfig = {
  type: "enabled",
  budget_tokens: THINKING_BUDGETS.STANDARD,
};

/**
 * Configuration for complex analysis tasks
 */
export const DEEP_THINKING_CONFIG: ThinkingConfig = {
  type: "enabled",
  budget_tokens: THINKING_BUDGETS.DEEP,
};

/**
 * Configuration for agent tool use with interleaved thinking
 */
export const AGENT_THINKING_CONFIG: ThinkingConfig = {
  type: "enabled",
  budget_tokens: THINKING_BUDGETS.COMPLEX,
};
