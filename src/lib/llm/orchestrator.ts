/**
 * LLM Orchestrator
 *
 * Core routing engine and OpenRouter client for unified LLM access
 * Implements cost-optimized model selection with quality guarantees
 */

import type {
  ModelId,
  ModelDefinition,
  TaskType,
  TaskRouting,
  RoutingResult,
  ExecutionOptions,
  ExecutionResult,
  CostReport,
  OpenRouterRequest,
  OpenRouterResponse,
  OpenRouterMessage,
  MarketingStrategy,
} from './types';

// ============================================================================
// Model Registry
// ============================================================================

export const MODEL_REGISTRY: Record<ModelId, ModelDefinition> = {
  claude_opus_4_5: {
    id: 'claude_opus_4_5',
    label: 'Claude 4.5 Opus',
    provider: 'anthropic',
    openrouter_slug: 'anthropic/claude-opus-4-5-20251101',
    family: 'claude',
    version: '4.5',
    release_date: '2025-11-01',
    capabilities: {
      modes: ['text', 'tool_use', 'vision'],
      reasoning: 'frontier',
      coding: 'frontier',
      math: 'strong',
      multilingual: 'strong',
      vision: 'strong',
      audio: 'none',
      video: 'none',
      context_window_tokens: 200000,
      max_output_tokens: 32000,
    },
    pricing: { input_per_million: 15.0, output_per_million: 75.0, currency: 'USD' },
    cost_tier: 'premium',
    recommended_roles: ['global_orchestrator', 'strategy_brain', 'architecture_designer', 'critical_code_reviewer'],
    quality_score: 98,
    speed_score: 70,
    value_score: 65,
  },
  claude_sonnet_4_5: {
    id: 'claude_sonnet_4_5',
    label: 'Claude 4.5 Sonnet',
    provider: 'anthropic',
    openrouter_slug: 'anthropic/claude-sonnet-4-5-20250929',
    family: 'claude',
    version: '4.5',
    release_date: '2025-09-29',
    capabilities: {
      modes: ['text', 'tool_use', 'vision'],
      reasoning: 'high',
      coding: 'strong',
      math: 'strong',
      multilingual: 'strong',
      vision: 'moderate',
      audio: 'none',
      video: 'none',
      context_window_tokens: 200000,
      max_output_tokens: 16000,
    },
    pricing: { input_per_million: 3.0, output_per_million: 15.0, currency: 'USD' },
    cost_tier: 'standard',
    recommended_roles: ['default_agent', 'execution_planner', 'content_planner', 'mid_complexity_coder'],
    quality_score: 90,
    speed_score: 85,
    value_score: 88,
  },
  claude_haiku_4_5: {
    id: 'claude_haiku_4_5',
    label: 'Claude 4.5 Haiku',
    provider: 'anthropic',
    openrouter_slug: 'anthropic/claude-haiku-4-5-20251001',
    family: 'claude',
    version: '4.5',
    release_date: '2025-10-01',
    capabilities: {
      modes: ['text', 'tool_use', 'vision'],
      reasoning: 'moderate',
      coding: 'moderate',
      math: 'moderate',
      multilingual: 'good',
      vision: 'moderate',
      audio: 'none',
      video: 'none',
      context_window_tokens: 200000,
      max_output_tokens: 8000,
    },
    pricing: { input_per_million: 0.25, output_per_million: 1.25, currency: 'USD' },
    cost_tier: 'economy',
    recommended_roles: ['router_assistant', 'bulk_scorer', 'sanity_checker', 'light_copy_editor'],
    quality_score: 75,
    speed_score: 95,
    value_score: 95,
  },
  deepseek_v3_0324: {
    id: 'deepseek_v3_0324',
    label: 'DeepSeek V3 (0324)',
    provider: 'deepseek',
    openrouter_slug: 'deepseek/deepseek-chat-v3-0324',
    family: 'deepseek',
    version: '3.0324',
    release_date: '2025-03-24',
    capabilities: {
      modes: ['text', 'tool_use'],
      reasoning: 'frontier',
      coding: 'frontier',
      math: 'frontier',
      multilingual: 'good',
      vision: 'none',
      audio: 'none',
      video: 'none',
      context_window_tokens: 128000,
      max_output_tokens: 16000,
    },
    pricing: { input_per_million: 0.27, output_per_million: 1.1, currency: 'USD' },
    cost_tier: 'ultra_efficient',
    recommended_roles: ['reasoning_engine', 'agentic_workflow_core', 'data_analysis_coder', 'complex_code_generator'],
    quality_score: 92,
    speed_score: 88,
    value_score: 99,
  },
  deepseek_r1: {
    id: 'deepseek_r1',
    label: 'DeepSeek R1',
    provider: 'deepseek',
    openrouter_slug: 'deepseek/deepseek-r1',
    family: 'deepseek',
    version: 'r1',
    release_date: '2025-01-20',
    capabilities: {
      modes: ['text', 'reasoning_traces'],
      reasoning: 'frontier_plus',
      coding: 'frontier',
      math: 'frontier_plus',
      multilingual: 'good',
      vision: 'none',
      audio: 'none',
      video: 'none',
      context_window_tokens: 64000,
      max_output_tokens: 32000,
    },
    pricing: { input_per_million: 0.55, output_per_million: 2.19, currency: 'USD' },
    cost_tier: 'efficient_premium',
    recommended_roles: ['deep_reasoning', 'mathematical_proof', 'complex_planning', 'multi_step_logic'],
    quality_score: 96,
    speed_score: 60,
    value_score: 94,
  },
  mistral_large_2411: {
    id: 'mistral_large_2411',
    label: 'Mistral Large (2411)',
    provider: 'mistral',
    openrouter_slug: 'mistralai/mistral-large-2411',
    family: 'mistral',
    version: '2411',
    release_date: '2024-11-01',
    capabilities: {
      modes: ['text', 'tool_use'],
      reasoning: 'high',
      coding: 'strong',
      math: 'strong',
      multilingual: 'very_strong',
      vision: 'basic',
      audio: 'none',
      video: 'none',
      context_window_tokens: 128000,
      max_output_tokens: 16000,
    },
    pricing: { input_per_million: 2.0, output_per_million: 6.0, currency: 'USD' },
    cost_tier: 'standard_efficient',
    recommended_roles: ['multilingual_content', 'fast_general_agent', 'bulk_generation'],
    quality_score: 85,
    speed_score: 90,
    value_score: 87,
  },
  gemini_2_flash: {
    id: 'gemini_2_flash',
    label: 'Gemini 2.0 Flash',
    provider: 'google',
    openrouter_slug: 'google/gemini-2.0-flash-001',
    family: 'gemini',
    version: '2.0-flash',
    release_date: '2025-02-01',
    capabilities: {
      modes: ['text', 'tool_use', 'vision', 'audio'],
      reasoning: 'high',
      coding: 'strong',
      math: 'strong',
      multilingual: 'very_strong',
      vision: 'strong',
      audio: 'native',
      video: 'understanding',
      context_window_tokens: 1000000,
      max_output_tokens: 8000,
    },
    pricing: { input_per_million: 0.1, output_per_million: 0.4, currency: 'USD' },
    cost_tier: 'ultra_economy',
    recommended_roles: ['bulk_processing', 'multimodal_analysis', 'long_context_tasks'],
    quality_score: 82,
    speed_score: 95,
    value_score: 98,
  },
  qwen_qwq_32b: {
    id: 'qwen_qwq_32b',
    label: 'Qwen QwQ 32B',
    provider: 'qwen',
    openrouter_slug: 'qwen/qwq-32b',
    family: 'qwen',
    version: 'qwq-32b',
    release_date: '2025-03-01',
    capabilities: {
      modes: ['text', 'reasoning_traces'],
      reasoning: 'frontier',
      coding: 'strong',
      math: 'frontier',
      multilingual: 'strong',
      vision: 'none',
      audio: 'none',
      video: 'none',
      context_window_tokens: 128000,
      max_output_tokens: 32000,
    },
    pricing: { input_per_million: 0.2, output_per_million: 0.6, currency: 'USD' },
    cost_tier: 'ultra_efficient',
    recommended_roles: ['reasoning_tasks', 'math_problems', 'logical_analysis'],
    quality_score: 88,
    speed_score: 80,
    value_score: 96,
  },
};

// ============================================================================
// Task Routing Configuration
// ============================================================================

export const TASK_ROUTING: Record<TaskType, TaskRouting> = {
  deep_strategy: {
    description: 'High-stakes strategic reasoning, planning, architecture design',
    min_quality_score: 90,
    priority_models: ['claude_opus_4_5', 'deepseek_r1', 'deepseek_v3_0324'],
    fallback_models: ['claude_sonnet_4_5'],
    cost_ceiling_per_1k_tokens: 0.1,
  },
  marketing_copy: {
    description: 'Landing pages, emails, brand messaging, content creation',
    min_quality_score: 80,
    priority_models: ['deepseek_v3_0324', 'claude_sonnet_4_5', 'mistral_large_2411'],
    fallback_models: ['claude_haiku_4_5', 'gemini_2_flash'],
    cost_ceiling_per_1k_tokens: 0.02,
  },
  seo_content: {
    description: 'SEO-optimised articles, pillar pages, location pages',
    min_quality_score: 85,
    priority_models: ['deepseek_v3_0324', 'claude_sonnet_4_5'],
    fallback_models: ['mistral_large_2411'],
    cost_ceiling_per_1k_tokens: 0.02,
  },
  code_generation: {
    description: 'New features, scripts, components',
    min_quality_score: 90,
    priority_models: ['deepseek_v3_0324', 'claude_sonnet_4_5', 'claude_opus_4_5'],
    fallback_models: ['mistral_large_2411'],
    cost_ceiling_per_1k_tokens: 0.05,
  },
  bulk_generation: {
    description: 'High volume content - product descriptions, social posts, variations',
    min_quality_score: 70,
    priority_models: ['gemini_2_flash', 'claude_haiku_4_5', 'deepseek_v3_0324'],
    fallback_models: ['mistral_large_2411'],
    cost_ceiling_per_1k_tokens: 0.005,
  },
  reasoning_heavy: {
    description: 'Complex multi-step reasoning, mathematical analysis',
    min_quality_score: 92,
    priority_models: ['deepseek_r1', 'qwen_qwq_32b', 'claude_opus_4_5'],
    fallback_models: ['deepseek_v3_0324'],
    cost_ceiling_per_1k_tokens: 0.08,
  },
  routing_classification: {
    description: 'Fast scoring, classification, intent detection',
    min_quality_score: 70,
    priority_models: ['gemini_2_flash', 'claude_haiku_4_5'],
    fallback_models: ['deepseek_v3_0324'],
    cost_ceiling_per_1k_tokens: 0.002,
  },
  multimodal_analysis: {
    description: 'Image/video understanding, document analysis',
    min_quality_score: 80,
    priority_models: ['gemini_2_flash', 'claude_sonnet_4_5', 'claude_opus_4_5'],
    fallback_models: [],
    cost_ceiling_per_1k_tokens: 0.02,
  },
};

// ============================================================================
// Strategy to Model Mapping
// ============================================================================

export const STRATEGY_MODEL_MAP: Record<MarketingStrategy, { preferred_models: ModelId[]; tasks: string[] }> = {
  blue_ocean_strategy: {
    preferred_models: ['claude_opus_4_5', 'deepseek_r1'],
    tasks: ['market_analysis', 'category_design', 'competitive_mapping'],
  },
  latent_demand_strategy: {
    preferred_models: ['deepseek_v3_0324', 'claude_sonnet_4_5'],
    tasks: ['trend_detection', 'semantic_gap_analysis', 'intent_clustering'],
  },
  ai_engine_optimisation: {
    preferred_models: ['claude_opus_4_5', 'claude_sonnet_4_5'],
    tasks: ['content_structuring', 'schema_generation', 'entity_profiling'],
  },
  consumer_psychology: {
    preferred_models: ['claude_sonnet_4_5', 'deepseek_v3_0324'],
    tasks: ['emotional_mapping', 'conversion_analysis', 'trust_signal_design'],
  },
  trend_detection: {
    preferred_models: ['deepseek_v3_0324', 'gemini_2_flash'],
    tasks: ['social_monitoring', 'keyword_tracking', 'sentiment_analysis'],
  },
};

// ============================================================================
// OpenRouter Client
// ============================================================================

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface OpenRouterClientOptions {
  apiKey?: string;
  siteUrl?: string;
  appName?: string;
}

class OpenRouterClient {
  private apiKey: string;
  private siteUrl: string;
  private appName: string;

  constructor(options: OpenRouterClientOptions = {}) {
    this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY || '';
    this.siteUrl = options.siteUrl || 'https://synthex.com.au';
    this.appName = options.appName || 'Synthex Marketing Engine';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': this.siteUrl,
      'X-Title': this.appName,
    };
  }

  async chat(
    modelSlug: string,
    messages: OpenRouterMessage[],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<OpenRouterResponse> {
    const request: OpenRouterRequest = {
      model: modelSlug,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    };

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async listModels(): Promise<Array<{ id: string; name: string; pricing: { prompt: string; completion: string } }>> {
    const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  }
}

// Singleton client instance
let clientInstance: OpenRouterClient | null = null;

export function getOpenRouterClient(options?: OpenRouterClientOptions): OpenRouterClient {
  if (!clientInstance) {
    clientInstance = new OpenRouterClient(options);
  }
  return clientInstance;
}

// ============================================================================
// Routing Engine
// ============================================================================

/**
 * Calculate cost per 1k tokens for a model
 */
function calculateCostPer1k(model: ModelDefinition): number {
  // Assume average 50/50 split between input and output
  const avgCost = (model.pricing.input_per_million + model.pricing.output_per_million) / 2;
  return avgCost / 1000; // Convert to per-1k tokens
}

/**
 * Route a task to the optimal model
 */
export function routeTask(taskType: TaskType, constraints?: { maxCostPer1k?: number; minQuality?: number }): RoutingResult {
  const routing = TASK_ROUTING[taskType];
  const maxCost = constraints?.maxCostPer1k ?? routing.cost_ceiling_per_1k_tokens;
  const minQuality = constraints?.minQuality ?? routing.min_quality_score;

  // Try priority models first
  for (const modelId of routing.priority_models) {
    const model = MODEL_REGISTRY[modelId];
    const costPer1k = calculateCostPer1k(model);

    if (model.quality_score >= minQuality && costPer1k <= maxCost) {
      return {
        model_id: modelId,
        model_slug: model.openrouter_slug,
        reasoning: `Selected ${model.label} for ${taskType}: quality ${model.quality_score}/100, cost $${costPer1k.toFixed(4)}/1k tokens`,
        estimated_cost_per_1k: costPer1k,
        quality_score: model.quality_score,
        fallback_available: routing.fallback_models.length > 0,
      };
    }
  }

  // Try fallback models
  for (const modelId of routing.fallback_models) {
    const model = MODEL_REGISTRY[modelId];
    const costPer1k = calculateCostPer1k(model);

    if (model.quality_score >= minQuality * 0.9) {
      // Allow 10% quality reduction for fallback
      return {
        model_id: modelId,
        model_slug: model.openrouter_slug,
        reasoning: `Fallback to ${model.label} for ${taskType}: quality ${model.quality_score}/100, cost $${costPer1k.toFixed(4)}/1k tokens`,
        estimated_cost_per_1k: costPer1k,
        quality_score: model.quality_score,
        fallback_available: false,
      };
    }
  }

  // Default to DeepSeek V3 as ultimate fallback (best value)
  const defaultModel = MODEL_REGISTRY['deepseek_v3_0324'];
  return {
    model_id: 'deepseek_v3_0324',
    model_slug: defaultModel.openrouter_slug,
    reasoning: `Default fallback to ${defaultModel.label}: best value model`,
    estimated_cost_per_1k: calculateCostPer1k(defaultModel),
    quality_score: defaultModel.quality_score,
    fallback_available: false,
  };
}

/**
 * Get model recommendation for a marketing strategy
 */
export function getModelForStrategy(strategy: MarketingStrategy): { model: ModelId; reasoning: string } {
  const mapping = STRATEGY_MODEL_MAP[strategy];
  if (!mapping) {
    return {
      model: 'claude_sonnet_4_5',
      reasoning: `No specific mapping for ${strategy}, using default Sonnet`,
    };
  }

  const preferredModel = mapping.preferred_models[0];
  const model = MODEL_REGISTRY[preferredModel];

  return {
    model: preferredModel,
    reasoning: `${model.label} recommended for ${strategy} - optimized for ${mapping.tasks.join(', ')}`,
  };
}

/**
 * Get all model recommendations for different scenarios
 */
export function getModelRecommendations(): Array<{ scenario: string; model: ModelId; cost: string; quality: number }> {
  return [
    {
      scenario: 'Marketing copy (cost-optimized)',
      model: 'deepseek_v3_0324',
      cost: '$0.27/M in, $1.10/M out',
      quality: 92,
    },
    {
      scenario: 'Bulk content generation',
      model: 'gemini_2_flash',
      cost: '$0.10/M in, $0.40/M out',
      quality: 82,
    },
    {
      scenario: 'Deep reasoning/strategy',
      model: 'deepseek_r1',
      cost: '$0.55/M in, $2.19/M out',
      quality: 96,
    },
    {
      scenario: 'Code generation',
      model: 'deepseek_v3_0324',
      cost: '$0.27/M in, $1.10/M out',
      quality: 92,
    },
    {
      scenario: 'Premium/critical tasks',
      model: 'claude_opus_4_5',
      cost: '$15/M in, $75/M out',
      quality: 98,
    },
    {
      scenario: 'Fast classification',
      model: 'gemini_2_flash',
      cost: '$0.10/M in, $0.40/M out',
      quality: 82,
    },
  ];
}

// ============================================================================
// Task Execution
// ============================================================================

/**
 * Execute a task with automatic model routing
 */
export async function executeTask(options: ExecutionOptions): Promise<ExecutionResult> {
  const startTime = Date.now();
  const routing = routeTask(options.task_type, {
    maxCostPer1k: options.constraints?.max_cost_usd,
    minQuality: options.constraints?.min_quality_score,
  });

  const client = getOpenRouterClient();
  const messages: OpenRouterMessage[] = [];

  if (options.system_prompt) {
    messages.push({ role: 'system', content: options.system_prompt });
  }
  messages.push({ role: 'user', content: options.content });

  let retries = 0;
  const maxRetries = 3;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      const response = await client.chat(routing.model_slug, messages, {
        temperature: options.temperature ?? 0.7,
        maxTokens: options.max_tokens ?? 4096,
      });

      const latencyMs = Date.now() - startTime;
      const model = MODEL_REGISTRY[routing.model_id];

      // Calculate actual cost
      const inputCost = (response.usage.prompt_tokens / 1_000_000) * model.pricing.input_per_million;
      const outputCost = (response.usage.completion_tokens / 1_000_000) * model.pricing.output_per_million;
      const totalCost = inputCost + outputCost;

      return {
        model_id: routing.model_id,
        model_slug: routing.model_slug,
        response: response.choices[0]?.message?.content || '',
        usage: {
          input_tokens: response.usage.prompt_tokens,
          output_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
        },
        cost_usd: totalCost,
        latency_ms: latencyMs,
        metadata: {
          routing_reason: routing.reasoning,
          fallback_used: retries > 0,
          retries,
        },
      };
    } catch (error) {
      lastError = error as Error;
      retries++;
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }

  throw lastError || new Error('Task execution failed after retries');
}

/**
 * Simple wrapper for executeTask
 */
export async function runTask(taskType: TaskType, content: string, systemPrompt?: string): Promise<string> {
  const result = await executeTask({
    task_type: taskType,
    content,
    system_prompt: systemPrompt,
  });
  return result.response;
}

// ============================================================================
// Cost Tracking
// ============================================================================

// In-memory cost tracking (would be persisted to database in production)
const costTracker: {
  daily: Record<string, { byModel: Record<ModelId, number>; byTask: Record<TaskType, number>; total: number }>;
} = {
  daily: {},
};

/**
 * Record a cost event
 */
export function recordCost(date: string, modelId: ModelId, taskType: TaskType, costUsd: number): void {
  if (!costTracker.daily[date]) {
    costTracker.daily[date] = {
      byModel: {} as Record<ModelId, number>,
      byTask: {} as Record<TaskType, number>,
      total: 0,
    };
  }

  const day = costTracker.daily[date];
  day.byModel[modelId] = (day.byModel[modelId] || 0) + costUsd;
  day.byTask[taskType] = (day.byTask[taskType] || 0) + costUsd;
  day.total += costUsd;
}

/**
 * Get cost report for a period
 */
export function getCostReport(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): CostReport {
  const today = new Date().toISOString().split('T')[0];
  const dayData = costTracker.daily[today] || {
    byModel: {} as Record<ModelId, number>,
    byTask: {} as Record<TaskType, number>,
    total: 0,
  };

  const monthlyBudget = parseFloat(process.env.MONTHLY_BUDGET_USD || '500');

  return {
    period,
    total_usd: dayData.total,
    by_model: dayData.byModel,
    by_task: dayData.byTask,
    budget_remaining_usd: monthlyBudget - dayData.total,
    budget_utilization_percent: (dayData.total / monthlyBudget) * 100,
    projected_monthly_usd: dayData.total * 30, // Simple projection
  };
}
