/**
 * LLM Orchestration System
 *
 * Unified exports for the LLM routing, execution, and model discovery system.
 * Provides cost-optimized model selection with quality guarantees.
 *
 * @example
 * import {
 *   executeTask,
 *   routeTask,
 *   getModelRecommendations,
 *   scheduledModelScout,
 *   MODEL_REGISTRY,
 * } from '@/lib/llm';
 *
 * // Route a task to optimal model
 * const routing = routeTask('marketing_copy');
 *
 * // Execute with automatic routing
 * const result = await executeTask({
 *   task_type: 'seo_content',
 *   content: 'Write an article about...',
 * });
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Model types
  ModelId,
  ModelProvider,
  CostTier,
  CapabilityLevel,
  ModelCapabilities,
  ModelPricing,
  ModelDefinition,
  // Task types
  TaskType,
  TaskRouting,
  RoutingResult,
  // Execution types
  ExecutionOptions,
  ExecutionResult,
  // Cost types
  CostReport,
  CostOptimizationRule,
  // Discovery types
  DiscoveredModel,
  DiscoveryReport,
  // Strategy types
  MarketingStrategy,
  StrategyModelMapping,
  // Pipeline types
  PipelineStep,
  Pipeline,
  PipelineExecution,
  // OpenRouter types
  OpenRouterConfig,
  OpenRouterMessage,
  OpenRouterRequest,
  OpenRouterResponse,
  OpenRouterModel,
} from './types';

// ============================================================================
// Core Orchestrator Exports
// ============================================================================

export {
  // Registries
  MODEL_REGISTRY,
  TASK_ROUTING,
  STRATEGY_MODEL_MAP,
  // Client
  getOpenRouterClient,
  // Routing
  routeTask,
  getModelForStrategy,
  getModelRecommendations,
  // Execution
  executeTask,
  runTask,
  // Cost tracking
  recordCost,
  getCostReport,
} from './orchestrator';

// ============================================================================
// Model Scout Exports
// ============================================================================

export {
  runModelDiscovery,
  scheduledModelScout,
  getModelStats,
  compareModelValue,
} from './agents/model-scout';

// ============================================================================
// Convenience Re-exports
// ============================================================================

/**
 * Quick access to model IDs for type checking
 */
export const MODEL_IDS = [
  'claude_opus_4_5',
  'claude_sonnet_4_5',
  'claude_haiku_4_5',
  'deepseek_v3_0324',
  'deepseek_r1',
  'mistral_large_2411',
  'gemini_2_flash',
  'qwen_qwq_32b',
] as const;

/**
 * Quick access to task types for type checking
 */
export const TASK_TYPES = [
  'deep_strategy',
  'marketing_copy',
  'seo_content',
  'code_generation',
  'bulk_generation',
  'reasoning_heavy',
  'routing_classification',
  'multimodal_analysis',
] as const;

/**
 * Quick access to cost tiers for reference
 */
export const COST_TIERS = {
  ultra_economy: { max_cost_per_1k: 0.001, description: 'Gemini Flash tier' },
  economy: { max_cost_per_1k: 0.005, description: 'Haiku tier' },
  ultra_efficient: { max_cost_per_1k: 0.01, description: 'DeepSeek V3 tier' },
  efficient_premium: { max_cost_per_1k: 0.03, description: 'DeepSeek R1 tier' },
  standard_efficient: { max_cost_per_1k: 0.05, description: 'Mistral Large tier' },
  standard: { max_cost_per_1k: 0.15, description: 'Sonnet tier' },
  premium: { max_cost_per_1k: 1.0, description: 'Opus tier' },
} as const;
