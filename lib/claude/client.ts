/**
 * Anthropic Claude Client
 *
 * ✅ UPGRADED WITH LATEST FEATURES (2025)
 * - Prompt Caching (90% cost reduction)
 * - Token Counting
 * - Extended Thinking
 * - PDF Support
 * - Vision Support
 *
 * See client-enhanced.ts for new features.
 * This file maintains backward compatibility.
 */

// Re-export everything from enhanced client
export * from './client-enhanced';

// Maintain backward compatibility with existing code
import { anthropic, createMessage, createStreamingMessage, extractTextContent, parseJSONResponse, rateLimiter, CLAUDE_MODEL, DEFAULT_PARAMS, STREAMING_PARAMS } from './client-enhanced';

export {
  anthropic,
  createMessage,
  createStreamingMessage,
  extractTextContent,
  parseJSONResponse,
  rateLimiter,
  CLAUDE_MODEL,
  DEFAULT_PARAMS,
  STREAMING_PARAMS
};

// Export enhanced features
export {
  createMessageWithCaching,
  createMessageWithThinking,
  createMessageWithVision,
  createMessageWithPDF,
  countTokens,
  estimateCost,
  extractThinkingContent,
  CLAUDE_OPUS,
  CLAUDE_HAIKU
} from './client-enhanced';
