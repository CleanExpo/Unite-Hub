/**
 * Anthropic API Client
 * Bleeding Edge 2025/2026 Implementation
 *
 * Features:
 * - Extended Thinking with budget_tokens
 * - Prompt Caching (GA - ephemeral)
 * - Computer Use (Beta)
 * - Interleaved Thinking
 * - 128K Output
 * - Advanced Tool Use
 */

import type {
  ClaudeModel,
  MessagesRequest,
  MessagesResponse,
  StreamEvent,
  BetaFeatureConfig,
  ThinkingConfig,
  CacheableToolDefinition,
  ComputerToolDefinition,
} from './types';

import {
  CLAUDE_MODELS,
  BETA_HEADERS,
  buildBetaHeader,
  createCacheableSystemPrompt,
  createThinkingConfig,
  THINKING_LIMITS,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

export interface AnthropicClientConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: ClaudeModel;
  defaultMaxTokens?: number;
  features?: BetaFeatureConfig;
}

const DEFAULT_CONFIG: Required<Omit<AnthropicClientConfig, 'apiKey'>> = {
  baseUrl: 'https://api.anthropic.com/v1',
  defaultModel: CLAUDE_MODELS.SONNET_4_5,
  defaultMaxTokens: 4096,
  features: {
    promptCaching: {
      enabled: true,
      cacheSystemPrompt: true,
      cacheTools: true,
    },
  },
};

// ============================================================================
// Client Class
// ============================================================================

export class AnthropicClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: ClaudeModel;
  private defaultMaxTokens: number;
  private features: BetaFeatureConfig;

  constructor(config: AnthropicClientConfig = {}) {
    const apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is required. Set it in environment variables or pass to constructor.'
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_CONFIG.baseUrl;
    this.defaultModel = config.defaultModel ?? DEFAULT_CONFIG.defaultModel;
    this.defaultMaxTokens = config.defaultMaxTokens ?? DEFAULT_CONFIG.defaultMaxTokens;
    this.features = config.features ?? DEFAULT_CONFIG.features;
  }

  // ==========================================================================
  // Core API Methods
  // ==========================================================================

  /**
   * Send a message to Claude
   */
  async messages(
    request: Partial<MessagesRequest> & { messages: MessagesRequest['messages'] }
  ): Promise<MessagesResponse> {
    const fullRequest: MessagesRequest = {
      model: request.model ?? this.defaultModel,
      max_tokens: request.max_tokens ?? this.defaultMaxTokens,
      ...request,
    };

    const headers = this.buildHeaders(fullRequest.model as ClaudeModel);

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fullRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AnthropicAPIError(error);
    }

    return response.json();
  }

  /**
   * Stream a message from Claude
   */
  async *stream(
    request: Partial<MessagesRequest> & { messages: MessagesRequest['messages'] }
  ): AsyncGenerator<StreamEvent> {
    const fullRequest: MessagesRequest = {
      model: request.model ?? this.defaultModel,
      max_tokens: request.max_tokens ?? this.defaultMaxTokens,
      stream: true,
      ...request,
    };

    const headers = this.buildHeaders(fullRequest.model as ClaudeModel);

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fullRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AnthropicAPIError(error);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const event: StreamEvent = JSON.parse(data);
            yield event;
          } catch {
            // Skip malformed events
          }
        }
      }
    }
  }

  // ==========================================================================
  // Extended Thinking Methods
  // ==========================================================================

  /**
   * Send a message with extended thinking enabled
   *
   * @param messages - Conversation messages
   * @param budgetTokens - Thinking budget (1024-128000)
   * @param options - Additional options
   */
  async thinkingMessage(
    messages: MessagesRequest['messages'],
    budgetTokens: number = 10000,
    options: {
      model?: ClaudeModel;
      maxTokens?: number;
      systemPrompt?: string;
      interleaved?: boolean;
    } = {}
  ): Promise<MessagesResponse> {
    const model = options.model ?? this.defaultModel;
    const maxTokens = options.maxTokens ?? this.defaultMaxTokens;

    // Build thinking config with validation
    const thinking = createThinkingConfig(budgetTokens, maxTokens, options.interleaved ?? false);

    // Apply caching to system prompt if enabled
    const system = options.systemPrompt
      ? this.features.promptCaching?.cacheSystemPrompt
        ? createCacheableSystemPrompt(options.systemPrompt)
        : options.systemPrompt
      : undefined;

    // Override features for interleaved thinking
    const featuresOverride = options.interleaved
      ? { ...this.features, extendedThinking: { enabled: true, budgetTokens, interleaved: true } }
      : this.features;

    const headers = this.buildHeaders(model, featuresOverride);

    const request = {
      model,
      max_tokens: maxTokens,
      messages,
      thinking,
      ...(system && { system }),
    };

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AnthropicAPIError(error);
    }

    return response.json();
  }

  /**
   * Extract thinking content from response
   */
  static extractThinking(response: MessagesResponse): string[] {
    return response.content
      .filter((block): block is { type: 'thinking'; thinking: string } => block.type === 'thinking')
      .map((block) => block.thinking);
  }

  /**
   * Extract text content from response
   */
  static extractText(response: MessagesResponse): string {
    return response.content
      .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
      .map((block) => block.text)
      .join('');
  }

  // ==========================================================================
  // Tool Use Methods
  // ==========================================================================

  /**
   * Send a message with tools
   */
  async toolMessage(
    messages: MessagesRequest['messages'],
    tools: (CacheableToolDefinition | ComputerToolDefinition)[],
    options: {
      model?: ClaudeModel;
      maxTokens?: number;
      systemPrompt?: string;
      toolChoice?: 'auto' | 'any' | 'none' | { name: string };
    } = {}
  ): Promise<MessagesResponse> {
    const model = options.model ?? this.defaultModel;
    const maxTokens = options.maxTokens ?? this.defaultMaxTokens;

    // Apply caching to tools if enabled
    const cachedTools = this.features.promptCaching?.cacheTools
      ? tools.map((tool) => ({
          ...tool,
          cache_control: { type: 'ephemeral' as const },
        }))
      : tools;

    const system = options.systemPrompt
      ? this.features.promptCaching?.cacheSystemPrompt
        ? createCacheableSystemPrompt(options.systemPrompt)
        : options.systemPrompt
      : undefined;

    const toolChoice = options.toolChoice
      ? typeof options.toolChoice === 'string'
        ? { type: options.toolChoice as 'auto' | 'any' | 'none' }
        : { type: 'tool' as const, name: options.toolChoice.name }
      : undefined;

    const request = {
      model,
      max_tokens: maxTokens,
      messages,
      tools: cachedTools,
      ...(toolChoice && { tool_choice: toolChoice }),
      ...(system && { system }),
    };

    const headers = this.buildHeaders(model);

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AnthropicAPIError(error);
    }

    return response.json();
  }

  /**
   * Extract tool use blocks from response
   */
  static extractToolUse(response: MessagesResponse): Array<{
    id: string;
    name: string;
    input: Record<string, unknown>;
  }> {
    return response.content
      .filter(
        (
          block
        ): block is {
          type: 'tool_use';
          id: string;
          name: string;
          input: Record<string, unknown>;
        } => block.type === 'tool_use'
      )
      .map(({ id, name, input }) => ({ id, name, input }));
  }

  // ==========================================================================
  // Computer Use Methods
  // ==========================================================================

  /**
   * Create a computer use session
   */
  createComputerTool(
    displayWidth: number,
    displayHeight: number,
    options: {
      displayNumber?: number;
      model?: ClaudeModel;
    } = {}
  ): ComputerToolDefinition {
    const model = options.model ?? this.defaultModel;

    // Use appropriate tool version based on model
    const toolType = model === CLAUDE_MODELS.OPUS_4_5 ? 'computer_20251124' : 'computer_20250124';

    return {
      type: toolType,
      name: 'computer',
      display_width_px: displayWidth,
      display_height_px: displayHeight,
      ...(options.displayNumber !== undefined && { display_number: options.displayNumber }),
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private buildHeaders(model: ClaudeModel, featuresOverride?: BetaFeatureConfig): HeadersInit {
    const features = featuresOverride ?? this.features;
    const betaHeader = buildBetaHeader(features, model);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    };

    if (betaHeader) {
      headers['anthropic-beta'] = betaHeader;
    }

    return headers;
  }
}

// ============================================================================
// Error Class
// ============================================================================

export class AnthropicAPIError extends Error {
  public readonly type: string;
  public readonly statusCode?: number;

  constructor(error: {
    error?: { type: string; message: string };
    type?: string;
    message?: string;
  }) {
    const errorType = error.error?.type ?? error.type ?? 'unknown_error';
    const message = error.error?.message ?? error.message ?? 'Unknown error';

    super(`Anthropic API Error (${errorType}): ${message}`);
    this.name = 'AnthropicAPIError';
    this.type = errorType;
  }

  isRateLimited(): boolean {
    return this.type === 'rate_limit_error';
  }

  isOverloaded(): boolean {
    return this.type === 'overloaded_error';
  }

  isAuthError(): boolean {
    return this.type === 'authentication_error';
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a pre-configured client for extended thinking tasks
 */
export function createThinkingClient(apiKey?: string): AnthropicClient {
  return new AnthropicClient({
    apiKey,
    defaultModel: CLAUDE_MODELS.SONNET_4_5,
    defaultMaxTokens: 16384,
    features: {
      promptCaching: {
        enabled: true,
        cacheSystemPrompt: true,
      },
      extendedThinking: {
        enabled: true,
        budgetTokens: 16000,
      },
    },
  });
}

/**
 * Create a pre-configured client for computer use
 */
export function createComputerUseClient(apiKey?: string): AnthropicClient {
  return new AnthropicClient({
    apiKey,
    defaultModel: CLAUDE_MODELS.SONNET_4_5,
    defaultMaxTokens: 4096,
    features: {
      computerUse: {
        enabled: true,
        displayWidth: 1920,
        displayHeight: 1080,
      },
      promptCaching: {
        enabled: true,
        cacheSystemPrompt: true,
        cacheTools: true,
      },
    },
  });
}

/**
 * Create a pre-configured client for maximum output (128K)
 */
export function createLongOutputClient(apiKey?: string): AnthropicClient {
  return new AnthropicClient({
    apiKey,
    defaultModel: CLAUDE_MODELS.SONNET_4_5,
    defaultMaxTokens: 128000,
    features: {
      output128k: true,
      promptCaching: {
        enabled: true,
        cacheSystemPrompt: true,
      },
    },
  });
}

// Re-export types and constants
export { CLAUDE_MODELS, BETA_HEADERS, THINKING_LIMITS };
export type { ClaudeModel, BetaFeatureConfig, ThinkingConfig };
