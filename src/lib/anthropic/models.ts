/**
 * Anthropic Model Constants
 * 
 * Centralized list of valid Anthropic model names.
 * Use these constants to prevent typos and ensure correct model references.
 * 
 * Last updated: 2025-11-25
 * @see https://docs.anthropic.com/en/docs/models-overview
 */

export const ANTHROPIC_MODELS = {
  // ─── LATEST (Default for Nexus 2.0) ────────────────────────────────
  // These are the standard models for all Unite-Hub AI features.
  
  // Claude Opus 4 — Deep thinking, complex reasoning, strategic analysis
  // Use for: Extended thinking, business strategy, complex code generation
  OPUS: 'claude-opus-4-6-20250514',
  OPUS_4: 'claude-opus-4-6-20250514',
  
  // Claude Sonnet 4 — Balanced capability and speed
  // Use for: Content generation, chat, analysis, most AI features
  SONNET: 'claude-sonnet-4-5-20250514',
  SONNET_4: 'claude-sonnet-4-5-20250514',
  
  // Claude Haiku 4 — Fast, cost-effective
  // Use for: Autocomplete, quick suggestions, classification, summarization
  HAIKU: 'claude-haiku-4-5-20250514',
  HAIKU_4: 'claude-haiku-4-5-20250514',

  // ─── PREVIOUS GENERATION (kept for backwards compatibility) ────────
  OPUS_4_5: 'claude-opus-4-5-20251101',
  SONNET_4_5: 'claude-sonnet-4-5-20250929',
  SONNET_3_5_V2: 'claude-3-5-sonnet-20241022',
  SONNET_3_5_V1: 'claude-3-5-sonnet-20240620',
  HAIKU_4_5: 'claude-haiku-4-5-20251001',
  HAIKU_3_5: 'claude-3-5-haiku-20241022',
  HAIKU_3: 'claude-3-haiku-20240307',
  OPUS_3: 'claude-3-opus-20240229',
} as const;

/**
 * Model routing for Nexus 2.0 features
 * 
 * Maps feature → model. Optimises for cost/quality trade-off.
 */
export const NEXUS_AI_ROUTING = {
  // Block editor AI
  'editor.autocomplete': ANTHROPIC_MODELS.HAIKU,      // Fast, cheap — inline completions
  'editor.expand': ANTHROPIC_MODELS.SONNET,            // Good quality writing
  'editor.rewrite': ANTHROPIC_MODELS.SONNET,           // Rewriting/improving text
  'editor.summarize': ANTHROPIC_MODELS.HAIKU,          // Quick summaries
  'editor.translate': ANTHROPIC_MODELS.HAIKU,          // Translation
  
  // Database AI
  'database.autofill': ANTHROPIC_MODELS.HAIKU,         // Fill empty cells
  'database.analyze': ANTHROPIC_MODELS.SONNET,         // Analyze trends
  'database.formula': ANTHROPIC_MODELS.SONNET,         // Generate formulas
  
  // Chat / Assistant
  'chat.general': ANTHROPIC_MODELS.SONNET,             // General chat
  'chat.strategy': ANTHROPIC_MODELS.OPUS,              // Business strategy
  'chat.code': ANTHROPIC_MODELS.OPUS,                  // Code generation
  
  // Search & Navigation
  'search.semantic': ANTHROPIC_MODELS.HAIKU,           // Search queries
  'search.answer': ANTHROPIC_MODELS.SONNET,            // Answer questions
  
  // Business Intelligence
  'intel.report': ANTHROPIC_MODELS.OPUS,               // Generate reports
  'intel.forecast': ANTHROPIC_MODELS.SONNET,           // Revenue forecasting
  'intel.insight': ANTHROPIC_MODELS.SONNET,            // Business insights
} as const;

export type AnthropicModelName = typeof ANTHROPIC_MODELS[keyof typeof ANTHROPIC_MODELS];

/**
 * Model pricing per million tokens (USD)
 */
export const MODEL_PRICING = {
  [ANTHROPIC_MODELS.OPUS_4_5]: { input: 15, output: 75, thinking: 7.5 },
  [ANTHROPIC_MODELS.OPUS_4]: { input: 15, output: 75, thinking: 7.5 },
  [ANTHROPIC_MODELS.SONNET_4_5]: { input: 3, output: 15 },
  [ANTHROPIC_MODELS.SONNET_4]: { input: 3, output: 15 },
  [ANTHROPIC_MODELS.SONNET_3_5_V2]: { input: 3, output: 15 },
  [ANTHROPIC_MODELS.SONNET_3_5_V1]: { input: 3, output: 15 },
  [ANTHROPIC_MODELS.HAIKU_4_5]: { input: 0.80, output: 4 },
  [ANTHROPIC_MODELS.HAIKU_3_5]: { input: 0.80, output: 4 },
  [ANTHROPIC_MODELS.HAIKU_3]: { input: 0.25, output: 1.25 },
  [ANTHROPIC_MODELS.OPUS_3]: { input: 15, output: 75 },
} as const;

/**
 * Model capabilities
 */
export const MODEL_CAPABILITIES = {
  [ANTHROPIC_MODELS.OPUS_4_5]: {
    extendedThinking: true,
    promptCaching: true,
    vision: true,
    maxTokens: 200000,
    outputTokens: 16384,
  },
  [ANTHROPIC_MODELS.OPUS_4]: {
    extendedThinking: true,
    promptCaching: true,
    vision: true,
    maxTokens: 200000,
    outputTokens: 16384,
  },
  [ANTHROPIC_MODELS.SONNET_4_5]: {
    extendedThinking: false,
    promptCaching: true,
    vision: true,
    maxTokens: 200000,
    outputTokens: 16384,
  },
  [ANTHROPIC_MODELS.SONNET_4]: {
    extendedThinking: false,
    promptCaching: true,
    vision: true,
    maxTokens: 200000,
    outputTokens: 8192,
  },
  [ANTHROPIC_MODELS.SONNET_3_5_V2]: {
    extendedThinking: false,
    promptCaching: true,
    vision: true,
    maxTokens: 200000,
    outputTokens: 8192,
  },
  [ANTHROPIC_MODELS.SONNET_3_5_V1]: {
    extendedThinking: false,
    promptCaching: true,
    vision: true,
    maxTokens: 200000,
    outputTokens: 8192,
  },
  [ANTHROPIC_MODELS.HAIKU_4_5]: {
    extendedThinking: false,
    promptCaching: true,
    vision: true,
    maxTokens: 200000,
    outputTokens: 8192,
  },
  [ANTHROPIC_MODELS.HAIKU_3_5]: {
    extendedThinking: false,
    promptCaching: true,
    vision: true,
    maxTokens: 200000,
    outputTokens: 8192,
  },
  [ANTHROPIC_MODELS.HAIKU_3]: {
    extendedThinking: false,
    promptCaching: false,
    vision: true,
    maxTokens: 200000,
    outputTokens: 4096,
  },
  [ANTHROPIC_MODELS.OPUS_3]: {
    extendedThinking: false,
    promptCaching: false,
    vision: true,
    maxTokens: 200000,
    outputTokens: 4096,
  },
} as const;

/**
 * Validate if a model name is valid
 */
export function isValidModel(model: string): model is AnthropicModelName {
  return Object.values(ANTHROPIC_MODELS).includes(model as AnthropicModelName);
}

/**
 * Get model pricing
 */
export function getModelPricing(model: string) {
  if (!isValidModel(model)) {
    console.warn(`Unknown model: ${model}, using Sonnet 4.5 pricing as fallback`);
    return MODEL_PRICING[ANTHROPIC_MODELS.SONNET_4_5];
  }
  return MODEL_PRICING[model];
}

/**
 * Get model capabilities
 */
export function getModelCapabilities(model: string) {
  if (!isValidModel(model)) {
    console.warn(`Unknown model: ${model}, using Sonnet 4.5 capabilities as fallback`);
    return MODEL_CAPABILITIES[ANTHROPIC_MODELS.SONNET_4_5];
  }
  return MODEL_CAPABILITIES[model];
}

/**
 * Recommended models for specific use cases
 */
export const RECOMMENDED_MODELS = {
  // For extended thinking tasks
  DEEP_ANALYSIS: ANTHROPIC_MODELS.OPUS_4_5,
  
  // For balanced performance
  STANDARD: ANTHROPIC_MODELS.SONNET_4_5,
  
  // For fast, simple tasks
  QUICK: ANTHROPIC_MODELS.HAIKU_4_5,
  
  // For cost-sensitive operations
  COST_EFFECTIVE: ANTHROPIC_MODELS.HAIKU_3_5,
} as const;
