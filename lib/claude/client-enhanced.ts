/**
 * Enhanced Anthropic Client with Latest Features
 *
 * New Features (2025):
 * - ✅ Prompt Caching (reduce costs by 90% for repeated prompts)
 * - ✅ Token Counting (estimate costs before API calls)
 * - ✅ Extended Thinking (for complex reasoning tasks)
 * - ✅ PDF Support (native document handling)
 * - ✅ Vision Support (image analysis)
 */

import Anthropic from "@anthropic-ai/sdk";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";

// Lazy-initialized Anthropic client
let _anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    _anthropic = new Anthropic({
      apiKey,
      // Enable beta features
      defaultHeaders: {
        "anthropic-beta": "prompt-caching-2024-07-31,pdfs-2024-09-25,extended-thinking-2025-01-16"
      }
    });
  }
  return _anthropic;
}

// Backward compatible export using Proxy
export const anthropic = new Proxy({} as Anthropic, {
  get(_, prop) {
    return getAnthropicClient()[prop as keyof Anthropic];
  },
});

// Model configuration
export const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';
export const CLAUDE_OPUS = 'claude-opus-4-5-20251101';
export const CLAUDE_HAIKU = 'claude-haiku-4-5-20251001';

// Default message parameters
export const DEFAULT_PARAMS = {
  model: CLAUDE_MODEL,
  max_tokens: 4096,
  temperature: 0.7,
};

// Streaming configuration
export const STREAMING_PARAMS = {
  ...DEFAULT_PARAMS,
  stream: true,
};

/**
 * Create a message with Claude
 * @param messages - Conversation messages
 * @param systemPrompt - System prompt (supports caching)
 * @param options - Additional options
 */
export async function createMessage(
  messages: Anthropic.MessageParam[],
  systemPrompt?: string | Anthropic.TextBlockParam[],
  options?: Partial<Anthropic.MessageCreateParams>
): Promise<Anthropic.Message> {
  const params: Anthropic.MessageCreateParams = {
    ...DEFAULT_PARAMS,
    messages,
    ...(systemPrompt && {
      system: typeof systemPrompt === 'string'
        ? systemPrompt
        : systemPrompt
    }),
    ...options,
  };

  return await anthropic.messages.create(params);
}

/**
 * Create a message with Prompt Caching
 * Caches the system prompt and reduces costs by 90% for repeated calls
 *
 * @param messages - Conversation messages
 * @param systemPrompt - System prompt to cache
 * @param options - Additional options
 */
export async function createMessageWithCaching(
  messages: Anthropic.MessageParam[],
  systemPrompt: string,
  options?: Partial<Anthropic.MessageCreateParams>
): Promise<Anthropic.Message> {
  const params: Anthropic.MessageCreateParams = {
    ...DEFAULT_PARAMS,
    messages,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" }
      }
    ],
    ...options,
  };

  return await anthropic.messages.create(params);
}

/**
 * Create a message with Extended Thinking
 * Enables Claude to use internal reasoning for complex tasks
 *
 * @param messages - Conversation messages
 * @param systemPrompt - System prompt
 * @param thinkingBudget - Max thinking tokens (default: 10000)
 */
export async function createMessageWithThinking(
  messages: Anthropic.MessageParam[],
  systemPrompt?: string,
  thinkingBudget: number = 10000
): Promise<Anthropic.Message> {
  const params: Anthropic.MessageCreateParams = {
    ...DEFAULT_PARAMS,
    messages,
    ...(systemPrompt && { system: systemPrompt }),
    thinking: {
      type: "enabled",
      budget_tokens: thinkingBudget
    }
  } as any; // Cast needed for beta feature

  return await anthropic.messages.create(params);
}

/**
 * Create a streaming message with Claude
 */
export async function createStreamingMessage(
  messages: Anthropic.MessageParam[],
  systemPrompt?: string,
  options?: Partial<Anthropic.MessageCreateParams>
): Promise<Anthropic.MessageStream> {
  const params: Anthropic.MessageCreateParams = {
    ...STREAMING_PARAMS,
    messages,
    ...(systemPrompt && { system: systemPrompt }),
    ...options,
  };

  return anthropic.messages.stream(params);
}

/**
 * Count tokens in messages
 * Useful for estimating costs before making API calls
 */
export async function countTokens(
  messages: Anthropic.MessageParam[],
  system?: string
): Promise<number> {
  const response = await anthropic.messages.countTokens({
    model: CLAUDE_MODEL,
    messages,
    ...(system && { system })
  } as any); // Cast needed for beta feature

  return response.input_tokens;
}

/**
 * Create a message with vision (image analysis)
 */
export async function createMessageWithVision(
  messages: Array<{
    role: "user" | "assistant";
    content: Array<{
      type: "text" | "image";
      text?: string;
      source?: {
        type: "base64";
        media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        data: string;
      };
    }>;
  }>,
  systemPrompt?: string,
  options?: Partial<Anthropic.MessageCreateParams>
): Promise<Anthropic.Message> {
  const params: Anthropic.MessageCreateParams = {
    ...DEFAULT_PARAMS,
    messages: messages as any,
    ...(systemPrompt && { system: systemPrompt }),
    ...options,
  };

  return await anthropic.messages.create(params);
}

/**
 * Create a message with PDF document
 * Supports native PDF analysis
 */
export async function createMessageWithPDF(
  pdfBase64: string,
  query: string,
  systemPrompt?: string
): Promise<Anthropic.Message> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: [
        {
          type: "document" as any,
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: pdfBase64
          }
        },
        {
          type: "text",
          text: query
        }
      ]
    }
  ];

  const params: Anthropic.MessageCreateParams = {
    ...DEFAULT_PARAMS,
    messages: messages as any,
    ...(systemPrompt && { system: systemPrompt }),
  };

  return await anthropic.messages.create(params);
}

/**
 * Helper to extract text content from message
 */
export function extractTextContent(message: Anthropic.Message): string {
  const textContent = message.content.find(
    (block) => block.type === 'text'
  ) as Anthropic.TextBlock | undefined;
  return textContent?.text || '';
}

/**
 * Helper to extract thinking content from message
 */
export function extractThinkingContent(message: Anthropic.Message): string | null {
  const thinkingBlock = message.content.find(
    (block: any) => block.type === 'thinking'
  );
  return (thinkingBlock as any)?.thinking || null;
}

/**
 * Helper to parse JSON response
 */
export function parseJSONResponse<T>(message: Anthropic.Message): T {
  const text = extractTextContent(message);

  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error}`);
  }
}

/**
 * Estimate cost for a message
 *
 * Pricing (Sonnet 4.5, as of 2025):
 * - Input: $3 per million tokens
 * - Output: $15 per million tokens
 * - Cached input: $0.30 per million tokens (90% savings)
 * For other models, use getModelPricing() from @/lib/anthropic/models
 */
export async function estimateCost(
  messages: Anthropic.MessageParam[],
  system?: string,
  outputTokens: number = 1000,
  useCaching: boolean = false
): Promise<{
  inputCost: number;
  outputCost: number;
  totalCost: number;
  inputTokens: number;
}> {
  const inputTokens = await countTokens(messages, system);

  const inputCostPerToken = useCaching ? 0.30 / 1_000_000 : 3 / 1_000_000;
  const outputCostPerToken = 15 / 1_000_000;

  const inputCost = inputTokens * inputCostPerToken;
  const outputCost = outputTokens * outputCostPerToken;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    inputTokens
  };
}

// Rate limiting helper (kept for backward compatibility)
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number = 100, timeWindowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkLimit();
    }

    this.requests.push(now);
  }
}

export const rateLimiter = new RateLimiter();
