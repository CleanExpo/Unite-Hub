/**
 * Anthropic API Module
 * Bleeding Edge 2025/2026 Implementation
 *
 * @module @/lib/anthropic
 */

// Client
export {
  AnthropicClient,
  AnthropicAPIError,
  createThinkingClient,
  createComputerUseClient,
  createLongOutputClient,
  CLAUDE_MODELS,
  BETA_HEADERS,
  THINKING_LIMITS,
} from './client';

export type { AnthropicClientConfig } from './client';

// Types
export {
  buildBetaHeader,
  createCacheableSystemPrompt,
  createThinkingConfig,
  COMPUTER_TOOL_VERSIONS,
} from './types';

export type {
  // Models
  ClaudeModel,
  BetaHeader,

  // Messages
  Message,
  MessageRole,
  MessagesRequest,
  MessagesRequestBase,
  MessagesRequestWithThinking,
  MessagesRequestWithTools,
  MessagesResponse,
  Usage,

  // Content Blocks
  ContentBlock,
  ThinkingBlock,
  TextBlock,
  ToolUseBlock,
  ToolResultBlock,

  // Thinking
  ThinkingConfig,

  // Caching
  CacheControl,
  CacheableContent,
  CacheableToolDefinition,

  // Computer Use
  ComputerAction,
  ComputerToolInput,
  ComputerToolDefinition,

  // Streaming
  StreamEvent,
  StreamEventType,

  // Features
  BetaFeatureConfig,

  // Errors
  AnthropicError,
} from './types';
