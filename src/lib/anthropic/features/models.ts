/**
 * Anthropic Model Constants and Utilities
 *
 * Centralized model definitions for Claude 4.5 family (Jan 2026).
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

// ============================================================================
// Model IDs (January 2026)
// ============================================================================

export const CLAUDE_MODELS = {
  /** Flagship model - best intelligence, effort parameter, thinking preservation */
  OPUS_4_5: "claude-opus-4-5-20251101",

  /** Best coding model - 1M context, agent capabilities */
  SONNET_4_5: "claude-sonnet-4-5-20250929",

  /** Fast model - speed optimization, structured outputs */
  HAIKU_4_5: "claude-haiku-4-5-20251001",

  /** Previous Opus - extended thinking, interleaved thinking */
  OPUS_4_1: "claude-opus-4-1-20250805",

  /** Previous Opus - tool use, complex reasoning */
  OPUS_4: "claude-opus-4-20250514",

  /** Previous Sonnet */
  SONNET_4: "claude-sonnet-4-20250514",
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

// ============================================================================
// Model Aliases (for convenience)
// ============================================================================

export const MODEL_ALIASES = {
  /** Default model for most tasks */
  DEFAULT: CLAUDE_MODELS.SONNET_4_5,

  /** Best model for complex reasoning */
  BEST: CLAUDE_MODELS.OPUS_4_5,

  /** Fastest model for quick tasks */
  FAST: CLAUDE_MODELS.HAIKU_4_5,

  /** Best for coding tasks */
  CODING: CLAUDE_MODELS.SONNET_4_5,

  /** Best for agents */
  AGENT: CLAUDE_MODELS.SONNET_4_5,

  /** Best for extended thinking */
  THINKING: CLAUDE_MODELS.OPUS_4_5,
} as const;

// ============================================================================
// Model Capabilities
// ============================================================================

export interface ModelCapabilities {
  contextWindow: number;
  maxOutputTokens: number;
  supportsThinking: boolean;
  supportsInterleavedThinking: boolean;
  supportsEffortParameter: boolean;
  supportsStructuredOutputs: boolean;
  supportsVision: boolean;
  supportsComputerUse: boolean;
  inputPricePerMTok: number;
  outputPricePerMTok: number;
  cacheHitPricePerMTok: number;
}

export const MODEL_CAPABILITIES: Record<ClaudeModel, ModelCapabilities> = {
  [CLAUDE_MODELS.OPUS_4_5]: {
    contextWindow: 200000,
    maxOutputTokens: 32000,
    supportsThinking: true,
    supportsInterleavedThinking: true,
    supportsEffortParameter: true,
    supportsStructuredOutputs: true,
    supportsVision: true,
    supportsComputerUse: true,
    inputPricePerMTok: 15,
    outputPricePerMTok: 75,
    cacheHitPricePerMTok: 1.5,
  },
  [CLAUDE_MODELS.SONNET_4_5]: {
    contextWindow: 1000000, // 1M context
    maxOutputTokens: 16000,
    supportsThinking: true,
    supportsInterleavedThinking: true,
    supportsEffortParameter: false,
    supportsStructuredOutputs: true,
    supportsVision: true,
    supportsComputerUse: true,
    inputPricePerMTok: 3,
    outputPricePerMTok: 15,
    cacheHitPricePerMTok: 0.3,
  },
  [CLAUDE_MODELS.HAIKU_4_5]: {
    contextWindow: 200000,
    maxOutputTokens: 8000,
    supportsThinking: true,
    supportsInterleavedThinking: false,
    supportsEffortParameter: false,
    supportsStructuredOutputs: true,
    supportsVision: true,
    supportsComputerUse: false,
    inputPricePerMTok: 1,
    outputPricePerMTok: 5,
    cacheHitPricePerMTok: 0.1,
  },
  [CLAUDE_MODELS.OPUS_4_1]: {
    contextWindow: 200000,
    maxOutputTokens: 32000,
    supportsThinking: true,
    supportsInterleavedThinking: true,
    supportsEffortParameter: false,
    supportsStructuredOutputs: true,
    supportsVision: true,
    supportsComputerUse: true,
    inputPricePerMTok: 15,
    outputPricePerMTok: 75,
    cacheHitPricePerMTok: 1.5,
  },
  [CLAUDE_MODELS.OPUS_4]: {
    contextWindow: 200000,
    maxOutputTokens: 32000,
    supportsThinking: true,
    supportsInterleavedThinking: true,
    supportsEffortParameter: false,
    supportsStructuredOutputs: true,
    supportsVision: true,
    supportsComputerUse: true,
    inputPricePerMTok: 15,
    outputPricePerMTok: 75,
    cacheHitPricePerMTok: 1.5,
  },
  [CLAUDE_MODELS.SONNET_4]: {
    contextWindow: 200000,
    maxOutputTokens: 16000,
    supportsThinking: true,
    supportsInterleavedThinking: true,
    supportsEffortParameter: false,
    supportsStructuredOutputs: true,
    supportsVision: true,
    supportsComputerUse: true,
    inputPricePerMTok: 3,
    outputPricePerMTok: 15,
    cacheHitPricePerMTok: 0.3,
  },
};

// ============================================================================
// Effort Parameter (Opus 4.5 only)
// ============================================================================

export type EffortLevel = "low" | "medium" | "high";

export interface EffortConfig {
  effort: EffortLevel;
}

/**
 * Create effort parameter configuration
 *
 * Only supported by Claude Opus 4.5. Controls thoroughness vs speed.
 *
 * @param level - Effort level: low (fast), medium (balanced), high (thorough)
 * @returns Effort configuration for API request
 */
export function createEffortConfig(level: EffortLevel): EffortConfig {
  return { effort: level };
}

/**
 * Add effort parameter to request params (Opus 4.5 only)
 *
 * @param params - Original message create params
 * @param level - Effort level
 * @param model - Model ID (validates Opus 4.5)
 * @returns Modified params with effort parameter
 */
export function withEffort<T extends { model?: string }>(
  params: T,
  level: EffortLevel,
  model?: string
): T & Partial<EffortConfig> {
  const targetModel = model || (params as { model?: string }).model;

  // Only apply effort to Opus 4.5
  if (targetModel !== CLAUDE_MODELS.OPUS_4_5) {
    console.warn(
      `⚠️ Effort parameter only supported by ${CLAUDE_MODELS.OPUS_4_5}, ignoring for ${targetModel}`
    );
    return params;
  }

  return {
    ...params,
    effort: level,
  };
}

// ============================================================================
// Model Selection Helpers
// ============================================================================

/**
 * Get capabilities for a model
 *
 * @param model - Model ID
 * @returns Model capabilities or undefined if unknown
 */
export function getModelCapabilities(
  model: string
): ModelCapabilities | undefined {
  return MODEL_CAPABILITIES[model as ClaudeModel];
}

/**
 * Check if model supports a specific capability
 *
 * @param model - Model ID
 * @param capability - Capability to check
 * @returns True if model supports capability
 */
export function modelSupports(
  model: string,
  capability: keyof Omit<ModelCapabilities, "contextWindow" | "maxOutputTokens" | "inputPricePerMTok" | "outputPricePerMTok" | "cacheHitPricePerMTok">
): boolean {
  const caps = getModelCapabilities(model);
  return caps ? caps[capability] : false;
}

/**
 * Select best model for a task type
 *
 * @param taskType - Type of task
 * @returns Recommended model ID
 */
export function selectModelForTask(
  taskType:
    | "coding"
    | "reasoning"
    | "quick"
    | "agent"
    | "analysis"
    | "general"
): ClaudeModel {
  switch (taskType) {
    case "coding":
      return CLAUDE_MODELS.SONNET_4_5;
    case "reasoning":
      return CLAUDE_MODELS.OPUS_4_5;
    case "quick":
      return CLAUDE_MODELS.HAIKU_4_5;
    case "agent":
      return CLAUDE_MODELS.SONNET_4_5;
    case "analysis":
      return CLAUDE_MODELS.OPUS_4_5;
    case "general":
    default:
      return CLAUDE_MODELS.SONNET_4_5;
  }
}

/**
 * Calculate estimated cost for a request
 *
 * @param model - Model ID
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param cacheHitTokens - Number of cache hit tokens (optional)
 * @returns Estimated cost in USD
 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheHitTokens: number = 0
): number {
  const caps = getModelCapabilities(model);
  if (!caps) {
return 0;
}

  const regularInputTokens = inputTokens - cacheHitTokens;
  const inputCost = (regularInputTokens / 1_000_000) * caps.inputPricePerMTok;
  const outputCost = (outputTokens / 1_000_000) * caps.outputPricePerMTok;
  const cacheCost = (cacheHitTokens / 1_000_000) * caps.cacheHitPricePerMTok;

  return inputCost + outputCost + cacheCost;
}
