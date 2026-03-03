/**
 * Anthropic API Type Definitions
 * Bleeding Edge 2025/2026 Specification
 *
 * VERIFIED via Brave Search: 2025-01-23
 * Sources:
 * - docs.anthropic.com/en/docs/build-with-claude/computer-use
 * - docs.anthropic.com/en/docs/build-with-claude/extended-thinking
 * - docs.anthropic.com/en/docs/build-with-claude/prompt-caching
 * - platform.claude.com/docs/en/release-notes/overview
 */

// ============================================================================
// Model Identifiers (Verified 2025)
// ============================================================================

export const CLAUDE_MODELS = {
  // Claude 4.5 Family (Latest)
  OPUS_4_5: 'claude-opus-4-5-20251101',
  SONNET_4_5: 'claude-sonnet-4-5-20250929',
  HAIKU_4_5: 'claude-haiku-4-5-20251001',

  // Claude 4 Family
  OPUS_4_1: 'claude-opus-4-1-20250805',
  OPUS_4: 'claude-opus-4-20250514',
  SONNET_4: 'claude-sonnet-4-20250514',

  // Claude 3.7 (Extended Thinking Pioneer)
  SONNET_3_7: 'claude-3-7-sonnet-20250219',
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

// ============================================================================
// Beta Headers (Verified 2025-01-23)
// ============================================================================

export const BETA_HEADERS = {
  // Computer Use - Model-specific headers
  COMPUTER_USE_OPUS_4_5: 'computer-use-2025-11-24',
  COMPUTER_USE_STANDARD: 'computer-use-2025-01-24',

  // Extended Thinking
  INTERLEAVED_THINKING: 'interleaved-thinking-2025-05-14',

  // Output Extensions
  OUTPUT_128K: 'output-128k-2025-02-19',

  // Advanced Tool Use (Opus 4.5 / Sonnet 4.5)
  ADVANCED_TOOL_USE: 'advanced-tool-use-2025-11-20',

  // Structured Outputs
  STRUCTURED_OUTPUTS: 'structured-outputs-2025-11-13',

  // Context Management (Memory & Editing)
  CONTEXT_MANAGEMENT: 'context-management-2025-06-27',

  // Effort Parameter (Opus 4.5 Only)
  EFFORT: 'effort-2025-11-24',

  // DEPRECATED - Prompt caching is now GA, no header needed
  // PROMPT_CACHING: 'prompt-caching-2024-07-31', // NO LONGER REQUIRED
} as const;

export type BetaHeader = (typeof BETA_HEADERS)[keyof typeof BETA_HEADERS];

// ============================================================================
// Computer Use Types
// ============================================================================

export const COMPUTER_TOOL_VERSIONS = {
  OPUS_4_5: 'computer_20251124', // Includes zoom action
  STANDARD: 'computer_20250124',
} as const;

export type ComputerAction =
  | 'key'
  | 'type'
  | 'cursor_position'
  | 'mouse_move'
  | 'left_click'
  | 'left_click_drag'
  | 'right_click'
  | 'middle_click'
  | 'double_click'
  | 'triple_click'
  | 'scroll'
  | 'wait'
  | 'screenshot'
  | 'zoom'; // Only available with computer_20251124 (Opus 4.5)

export interface ComputerToolInput {
  action: ComputerAction;
  coordinate?: [number, number];
  text?: string;
  duration?: number;
  scroll_direction?: 'up' | 'down' | 'left' | 'right';
  scroll_amount?: number;
  start_coordinate?: [number, number];
  zoom_factor?: number; // Opus 4.5 only
}

export interface ComputerToolDefinition {
  type: 'computer_20251124' | 'computer_20250124';
  name: 'computer';
  display_width_px: number;
  display_height_px: number;
  display_number?: number;
}

// ============================================================================
// Extended Thinking Types
// ============================================================================

export interface ThinkingConfig {
  type: 'enabled' | 'disabled';
  /**
   * Maximum tokens for internal reasoning
   * - Minimum: 1,024 tokens
   * - Maximum: 128,000 tokens
   * - Must be less than max_tokens (unless using interleaved thinking)
   */
  budget_tokens: number;
}

export const THINKING_LIMITS = {
  MIN_BUDGET_TOKENS: 1024,
  MAX_BUDGET_TOKENS: 128000,
} as const;

export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | ContentBlock[];
  is_error?: boolean;
}

export type ContentBlock = ThinkingBlock | TextBlock | ToolUseBlock | ToolResultBlock;

// ============================================================================
// Prompt Caching Types (GA - No Beta Header Required)
// ============================================================================

export interface CacheControl {
  type: 'ephemeral';
  /**
   * Optional TTL for extended cache duration
   * - Default: 5 minutes
   * - Extended: '1h' (1 hour) - additional cost
   */
  ttl?: '1h';
}

export interface CacheableContent {
  type: 'text';
  text: string;
  cache_control?: CacheControl;
}

export interface CacheableToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  cache_control?: CacheControl;
}

// ============================================================================
// Messages API Types
// ============================================================================

export type MessageRole = 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string | ContentBlock[];
}

export interface MessagesRequestBase {
  model: ClaudeModel;
  max_tokens: number;
  messages: Message[];
  system?: string | CacheableContent[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
  metadata?: {
    user_id?: string;
  };
}

export interface MessagesRequestWithThinking extends MessagesRequestBase {
  thinking: ThinkingConfig;
}

export interface MessagesRequestWithTools extends MessagesRequestBase {
  tools: (CacheableToolDefinition | ComputerToolDefinition)[];
  tool_choice?:
    | { type: 'auto' }
    | { type: 'any' }
    | { type: 'none' }
    | { type: 'tool'; name: string };
}

export type MessagesRequest =
  | MessagesRequestBase
  | MessagesRequestWithThinking
  | MessagesRequestWithTools;

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface MessagesResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  stop_sequence?: string;
  usage: Usage;
}

// ============================================================================
// Streaming Types
// ============================================================================

export type StreamEventType =
  | 'message_start'
  | 'content_block_start'
  | 'content_block_delta'
  | 'content_block_stop'
  | 'message_delta'
  | 'message_stop'
  | 'ping'
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  message?: MessagesResponse;
  index?: number;
  content_block?: ContentBlock;
  delta?: {
    type: 'text_delta' | 'thinking_delta' | 'input_json_delta';
    text?: string;
    thinking?: string;
    partial_json?: string;
  };
  usage?: Usage;
  error?: {
    type: string;
    message: string;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export interface AnthropicError {
  type: 'error';
  error: {
    type:
      | 'invalid_request_error'
      | 'authentication_error'
      | 'permission_error'
      | 'not_found_error'
      | 'rate_limit_error'
      | 'api_error'
      | 'overloaded_error';
    message: string;
  };
}

// ============================================================================
// Beta Feature Configuration
// ============================================================================

export interface BetaFeatureConfig {
  computerUse?: {
    enabled: boolean;
    displayWidth: number;
    displayHeight: number;
    displayNumber?: number;
  };
  extendedThinking?: {
    enabled: boolean;
    budgetTokens: number;
    interleaved?: boolean;
  };
  promptCaching?: {
    enabled: boolean;
    cacheSystemPrompt?: boolean;
    cacheTools?: boolean;
    ttl?: '1h';
  };
  output128k?: boolean;
  advancedToolUse?: boolean;
  structuredOutputs?: boolean;
  contextManagement?: boolean;
  effort?: boolean; // Opus 4.5 only
}

/**
 * Build the anthropic-beta header string from enabled features
 */
export function buildBetaHeader(
  features: BetaFeatureConfig,
  model: ClaudeModel
): string | undefined {
  const headers: string[] = [];

  if (features.computerUse?.enabled) {
    const header =
      model === CLAUDE_MODELS.OPUS_4_5
        ? BETA_HEADERS.COMPUTER_USE_OPUS_4_5
        : BETA_HEADERS.COMPUTER_USE_STANDARD;
    headers.push(header);
  }

  if (features.extendedThinking?.interleaved) {
    headers.push(BETA_HEADERS.INTERLEAVED_THINKING);
  }

  if (features.output128k) {
    headers.push(BETA_HEADERS.OUTPUT_128K);
  }

  if (features.advancedToolUse) {
    headers.push(BETA_HEADERS.ADVANCED_TOOL_USE);
  }

  if (features.structuredOutputs) {
    headers.push(BETA_HEADERS.STRUCTURED_OUTPUTS);
  }

  if (features.contextManagement) {
    headers.push(BETA_HEADERS.CONTEXT_MANAGEMENT);
  }

  if (features.effort && model === CLAUDE_MODELS.OPUS_4_5) {
    headers.push(BETA_HEADERS.EFFORT);
  }

  return headers.length > 0 ? headers.join(',') : undefined;
}

// ============================================================================
// Request Builder Utilities
// ============================================================================

/**
 * Create a cacheable system prompt
 */
export function createCacheableSystemPrompt(systemPrompt: string, ttl?: '1h'): CacheableContent[] {
  return [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: {
        type: 'ephemeral',
        ...(ttl && { ttl }),
      },
    },
  ];
}

/**
 * Create a thinking config with validation
 */
export function createThinkingConfig(
  budgetTokens: number,
  maxTokens: number,
  interleaved = false
): ThinkingConfig {
  // Validate budget tokens
  if (budgetTokens < THINKING_LIMITS.MIN_BUDGET_TOKENS) {
    throw new Error(`budget_tokens must be at least ${THINKING_LIMITS.MIN_BUDGET_TOKENS}`);
  }

  if (budgetTokens > THINKING_LIMITS.MAX_BUDGET_TOKENS) {
    throw new Error(`budget_tokens cannot exceed ${THINKING_LIMITS.MAX_BUDGET_TOKENS}`);
  }

  // For non-interleaved thinking, budget must be less than max_tokens
  if (!interleaved && budgetTokens >= maxTokens) {
    throw new Error(
      'budget_tokens must be less than max_tokens (unless using interleaved thinking)'
    );
  }

  return {
    type: 'enabled',
    budget_tokens: budgetTokens,
  };
}
