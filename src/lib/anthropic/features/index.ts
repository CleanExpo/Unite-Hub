/**
 * Anthropic API Features - Centralized Exports
 *
 * This module provides all the new Anthropic API features (2025-2026):
 * - Prompt Caching (90% cost savings)
 * - Extended Thinking (reasoning capabilities)
 * - Model Constants (Claude 4.5 family)
 * - Effort Parameter (Opus 4.5 only)
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

// Prompt Caching
export {
  // Types
  type CacheTTL,
  type CacheControl,
  type CacheableTextBlock,
  type CacheableSystemPrompt,
  type CacheStats,
  // Helpers
  createCacheControl,
  createCacheableText,
  createCacheableSystemPrompt,
  withSystemPromptCache,
  withMessageCacheBreakpoint,
  calculateCacheSavings,
  logCacheStats,
  // Configs
  AGENT_SYSTEM_CACHE_CONFIG,
  TOOLS_CACHE_CONFIG,
  DOCUMENT_CACHE_CONFIG,
  CONVERSATION_CACHE_CONFIG,
} from "./prompt-cache";

// Extended Thinking
export {
  // Types
  type ThinkingConfig,
  type ThinkingBlock,
  type RedactedThinkingBlock,
  type TextBlock,
  type ContentBlock,
  type ThinkingResponse,
  // Constants
  THINKING_SUPPORTED_MODELS,
  INTERLEAVED_THINKING_HEADER,
  THINKING_BUDGETS,
  // Helpers
  createThinkingConfig,
  withThinking,
  supportsThinking,
  extractThinking,
  preserveThinkingBlocks,
  hasRedactedThinking,
  getInterleavedThinkingHeaders,
  withInterleavedThinking,
  recommendThinkingBudget,
  validateThinkingBudget,
  // Configs
  QUICK_THINKING_CONFIG,
  DEEP_THINKING_CONFIG,
  AGENT_THINKING_CONFIG,
} from "./extended-thinking";

// Model Constants
export {
  // Model IDs
  CLAUDE_MODELS,
  type ClaudeModel,
  MODEL_ALIASES,
  // Capabilities
  type ModelCapabilities,
  MODEL_CAPABILITIES,
  // Effort Parameter
  type EffortLevel,
  type EffortConfig,
  createEffortConfig,
  withEffort,
  // Helpers
  getModelCapabilities,
  modelSupports,
  selectModelForTask,
  estimateCost,
} from "./models";

// MCP Connector
export {
  // Types
  type MCPServerConfig,
  type MCPServersParam,
  // Pre-configured Servers
  PRECONFIGURED_MCP_SERVERS,
  // Helpers
  buildMCPServersParam,
  withMCPServers,
  createToolSearchTool,
  hasMCPToolCalls,
  extractMCPToolResults,
  checkMCPServerHealth,
  checkAllMCPServersHealth,
} from "./mcp-connector";

// Code Execution
export {
  // Types
  type CodeExecutionResult,
  type CodeExecutionToolConfig,
  // Tool Definition
  createCodeExecutionTool,
  createWebSearchTool,
  // Helpers
  parseCodeExecutionResult,
  isCodeExecutionToolUse,
  extractCodeExecutionHistory,
  withCodeExecution,
  // Templates
  CODE_TEMPLATES,
} from "./code-execution";

// Files API
export {
  // Types
  type UploadedFile,
  type FileReference,
  type SupportedMimeType,
  // File Management
  uploadFile,
  uploadFileFromBuffer,
  deleteFile,
  listFiles,
  getFile,
  // Message Content Helpers
  createFileReference,
  createFileWithTextContent,
  createMultiFileContent,
  // Utilities
  getMimeType,
  isSupportedFileType,
  getMaxFileSize,
  // File Cache
  getCachedFileId,
  cacheFileId,
  cleanupFileCache,
  hashFileBuffer,
} from "./files-api";
