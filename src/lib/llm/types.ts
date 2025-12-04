/**
 * LLM Orchestration System - Type Definitions
 *
 * Unified type system for model routing, cost optimization, and task execution
 */

// ============================================================================
// Model Types
// ============================================================================

export type ModelId =
  | 'claude_opus_4_5'
  | 'claude_sonnet_4_5'
  | 'claude_haiku_4_5'
  | 'deepseek_v3_0324'
  | 'deepseek_r1'
  | 'mistral_large_2411'
  | 'gemini_2_flash'
  | 'qwen_qwq_32b';

export type ModelProvider = 'anthropic' | 'deepseek' | 'mistral' | 'google' | 'qwen';

export type CostTier =
  | 'ultra_economy'
  | 'economy'
  | 'ultra_efficient'
  | 'efficient_premium'
  | 'standard_efficient'
  | 'standard'
  | 'premium';

export type CapabilityLevel =
  | 'none'
  | 'basic'
  | 'moderate'
  | 'good'
  | 'strong'
  | 'very_strong'
  | 'high'
  | 'frontier'
  | 'frontier_plus'
  | 'native'
  | 'understanding';

export interface ModelCapabilities {
  modes: ('text' | 'tool_use' | 'vision' | 'audio' | 'video' | 'reasoning_traces')[];
  reasoning: CapabilityLevel;
  coding: CapabilityLevel;
  math: CapabilityLevel;
  multilingual: CapabilityLevel;
  vision: CapabilityLevel;
  audio: CapabilityLevel;
  video: CapabilityLevel;
  context_window_tokens: number;
  max_output_tokens: number;
}

export interface ModelPricing {
  input_per_million: number;
  output_per_million: number;
  currency: 'USD';
}

export interface ModelDefinition {
  id: ModelId;
  label: string;
  provider: ModelProvider;
  openrouter_slug: string;
  family: string;
  version: string;
  release_date: string;
  capabilities: ModelCapabilities;
  pricing: ModelPricing;
  cost_tier: CostTier;
  recommended_roles: string[];
  quality_score: number;
  speed_score: number;
  value_score: number;
}

// ============================================================================
// Task Types
// ============================================================================

export type TaskType =
  | 'deep_strategy'
  | 'marketing_copy'
  | 'seo_content'
  | 'code_generation'
  | 'bulk_generation'
  | 'reasoning_heavy'
  | 'routing_classification'
  | 'multimodal_analysis';

export interface TaskRouting {
  description: string;
  min_quality_score: number;
  priority_models: ModelId[];
  fallback_models: ModelId[];
  cost_ceiling_per_1k_tokens: number;
}

export interface RoutingResult {
  model_id: ModelId;
  model_slug: string;
  reasoning: string;
  estimated_cost_per_1k: number;
  quality_score: number;
  fallback_available: boolean;
}

// ============================================================================
// Execution Types
// ============================================================================

export interface ExecutionOptions {
  task_type: TaskType;
  content: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  constraints?: {
    max_cost_usd?: number;
    min_quality_score?: number;
    required_capabilities?: string[];
    prefer_speed?: boolean;
  };
}

export interface ExecutionResult {
  model_id: ModelId;
  model_slug: string;
  response: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  cost_usd: number;
  latency_ms: number;
  metadata: {
    routing_reason: string;
    fallback_used: boolean;
    retries: number;
  };
}

// ============================================================================
// Cost Types
// ============================================================================

export interface CostReport {
  period: 'daily' | 'weekly' | 'monthly';
  total_usd: number;
  by_model: Record<ModelId, number>;
  by_task: Record<TaskType, number>;
  budget_remaining_usd: number;
  budget_utilization_percent: number;
  projected_monthly_usd: number;
}

export interface CostOptimizationRule {
  rule_id: string;
  condition: string;
  action: 'select_cheapest_above_quality_floor' | 'select_highest_quality_within_budget' | 'select_best_value_score';
  quality_floor?: number;
  budget_multiplier?: number;
}

// ============================================================================
// Discovery Types
// ============================================================================

export interface DiscoveredModel {
  id: string;
  name: string;
  provider: string;
  openrouter_slug?: string;
  source: 'openrouter' | 'huggingface' | 'github' | 'arxiv';
  discovered_at: string;
  pricing?: ModelPricing;
  capabilities?: Partial<ModelCapabilities>;
  benchmark_scores?: Record<string, number>;
  recommendation: 'auto_add' | 'notify_admin' | 'ignore';
}

export interface DiscoveryReport {
  scan_timestamp: string;
  new_models: DiscoveredModel[];
  price_changes: Array<{
    model_id: string;
    old_pricing: ModelPricing;
    new_pricing: ModelPricing;
    change_percent: number;
  }>;
  capability_updates: Array<{
    model_id: string;
    new_capabilities: string[];
  }>;
  recommendations: string[];
}

// ============================================================================
// Strategy Integration Types
// ============================================================================

export type MarketingStrategy =
  | 'blue_ocean_strategy'
  | 'latent_demand_strategy'
  | 'ai_engine_optimisation'
  | 'consumer_psychology'
  | 'trend_detection';

export interface StrategyModelMapping {
  required_model_tier: CostTier | 'premium' | 'standard' | 'efficient';
  preferred_models: ModelId[];
  tasks: string[];
}

// ============================================================================
// Pipeline Types
// ============================================================================

export interface PipelineStep {
  step: number;
  name: string;
  model_task?: TaskType;
  source?: string;
  parallel?: boolean;
  output: string;
}

export interface Pipeline {
  id: string;
  description: string;
  steps: PipelineStep[];
}

export interface PipelineExecution {
  pipeline_id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  current_step: number;
  outputs: Record<string, unknown>;
  total_cost_usd: number;
  errors?: string[];
}

// ============================================================================
// OpenRouter Types
// ============================================================================

export interface OpenRouterConfig {
  base_url: string;
  models_endpoint: string;
  chat_endpoint: string;
  rate_limits: {
    requests_per_minute: number;
    tokens_per_minute: number;
  };
  retry_policy: {
    max_retries: number;
    backoff_ms: number[];
  };
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    context_length: number;
    max_completion_tokens: number;
  };
}
