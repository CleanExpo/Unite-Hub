// Export all Claude AI utilities
export * from './client';
export * from './prompts';
export * from './streaming';
export * from './context';
export * from './types';
export * from './utils';
export * from './client-helpers';
export * from './hooks';

// Re-export commonly used items
export {
  anthropic,
  CLAUDE_MODEL,
  createMessage,
  createStreamingMessage,
  extractTextContent,
  parseJSONResponse,
  rateLimiter,
} from './client';

export {
  AUTO_REPLY_SYSTEM_PROMPT,
  PERSONA_SYSTEM_PROMPT,
  STRATEGY_SYSTEM_PROMPT,
  CAMPAIGN_SYSTEM_PROMPT,
  HOOKS_SYSTEM_PROMPT,
  MINDMAP_SYSTEM_PROMPT,
  buildAutoReplyUserPrompt,
  buildPersonaUserPrompt,
  buildStrategyUserPrompt,
  buildCampaignUserPrompt,
  buildHooksUserPrompt,
  buildMindmapUserPrompt,
} from './prompts';

export {
  handleStreamResponse,
  streamToNextResponse,
  StreamingJSONParser,
  ClientStreamParser,
  createStreamingResponse,
  batchStreamOperations,
} from './streaming';

export {
  ConversationContext,
  SessionManager,
  sessionManager,
  ContextBuilder,
  TokenCounter,
} from './context';

export {
  generateAutoReply,
  generatePersona,
  generateStrategy,
  generateCampaign,
  generateHooks,
  generateMindmap,
  aiClient,
  handleAIError,
} from './client-helpers';

export {
  useAutoReply,
  usePersona,
  useStrategy,
  useCampaign,
  useHooks,
  useMindmap,
  useAIPipeline,
} from './hooks';

export {
  validateEmailData,
  formatEmailTemplate,
  getPersonaSummary,
  getKeyPlatforms,
  getTopHooks,
  groupHooksByPlatform,
  groupHooksByFunnelStage,
  getMindmapStats,
  retryWithBackoff,
  sanitizeInput,
} from './utils';

export type { ContextType, ContextEntry } from './context';
export type * from './types';
