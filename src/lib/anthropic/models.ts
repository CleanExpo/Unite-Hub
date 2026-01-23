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
  // Claude Opus 4 (Most capable, extended thinking)
  OPUS_4_5: 'claude-opus-4-5-20251101',
  OPUS_4: 'claude-opus-4-5-20251101',
  
  // Claude Sonnet 4 (Balanced capability/cost)
  SONNET_4_5: 'claude-sonnet-4-5-20250929',
  SONNET_4: 'claude-sonnet-4-5-20250929',
  
  // Claude Sonnet 3.5 (Previous generation)
  SONNET_3_5_V2: 'claude-3-5-sonnet-20241022',
  SONNET_3_5_V1: 'claude-3-5-sonnet-20240620',
  
  // Claude Haiku 3/4 (Fast, cost-effective)
  HAIKU_4_5: 'claude-haiku-4-5-20251001',
  HAIKU_3_5: 'claude-3-5-haiku-20241022',
  HAIKU_3: 'claude-3-haiku-20240307',
  
  // Claude Opus 3 (Previous generation)
  OPUS_3: 'claude-3-opus-20240229',
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
  [ANTHROPIC_MODELS.HAIKU_4_5]: { input: 1, output: 5 },
  [ANTHROPIC_MODELS.HAIKU_3_5]: { input: 0.25, output: 1.25 },
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
