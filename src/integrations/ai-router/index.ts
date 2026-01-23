/**
 * AI Router - Unified Multi-Provider AI Routing System
 *
 * Intelligently routes AI requests to the optimal provider/model based on:
 * - Task requirements (creative, SEO, analysis, bulk, etc.)
 * - Cost constraints
 * - Context size
 * - Special capabilities (vision, web search)
 *
 * Supported Providers:
 * - OpenRouter (Claude, GPT-4, Gemini, Llama)
 * - Perplexity (Sonar, Sonar Pro)
 * - Anthropic (Direct Claude API) - Optional
 */

import OpenRouterIntelligence from '@/lib/ai/openrouter-intelligence';
import { PerplexitySonar } from '@/lib/ai/perplexity-sonar';
import type {
  AIProvider,
  AIModel,
  TaskType,
  Priority,
  ContextSize,
  ModelCapability,
  TaskConfig,
  RouteDecision,
  AIRequest,
  AIResponse,
  UsageStats,
} from './types';

export * from './types';

/**
 * Model capability registry
 * Defines costs, limits, and optimal use cases for each model
 */
const MODEL_REGISTRY: Record<AIModel, ModelCapability> = {
  // OpenRouter - Claude 4.5 Models (January 2026)
  'claude-sonnet-4-5': {
    provider: 'openrouter',
    model: 'claude-sonnet-4-5',
    maxTokens: 1000000, // 1M context
    supportsVision: true,
    supportsWebSearch: false,
    costPerMillionPrompt: 3,
    costPerMillionCompletion: 15,
    optimalFor: ['creative-content', 'general'],
  },
  'claude-opus-4-5': {
    provider: 'openrouter',
    model: 'claude-opus-4-5',
    maxTokens: 200000,
    supportsVision: true,
    supportsWebSearch: false,
    costPerMillionPrompt: 15,
    costPerMillionCompletion: 75,
    optimalFor: ['technical-analysis', 'competitor-analysis'],
  },
  'claude-haiku-4-5': {
    provider: 'openrouter',
    model: 'claude-haiku-4-5',
    maxTokens: 200000,
    supportsVision: true,
    supportsWebSearch: false,
    costPerMillionPrompt: 1,
    costPerMillionCompletion: 5,
    optimalFor: ['bulk-generation'],
  },

  // OpenRouter - GPT Models
  'gpt-4-turbo': {
    provider: 'openrouter',
    model: 'gpt-4-turbo',
    maxTokens: 128000,
    supportsVision: false,
    supportsWebSearch: false,
    costPerMillionPrompt: 10,
    costPerMillionCompletion: 30,
    optimalFor: ['seo-research', 'competitor-analysis'],
  },
  'gpt-4-vision': {
    provider: 'openrouter',
    model: 'gpt-4-vision',
    maxTokens: 128000,
    supportsVision: true,
    supportsWebSearch: false,
    costPerMillionPrompt: 10,
    costPerMillionCompletion: 30,
    optimalFor: ['visual-analysis'],
  },
  'gpt-3.5-turbo': {
    provider: 'openrouter',
    model: 'gpt-3.5-turbo',
    maxTokens: 16000,
    supportsVision: false,
    supportsWebSearch: false,
    costPerMillionPrompt: 0.50,
    costPerMillionCompletion: 1.50,
    optimalFor: ['bulk-generation'],
  },

  // OpenRouter - Gemini
  'gemini-pro-1.5': {
    provider: 'openrouter',
    model: 'gemini-pro-1.5',
    maxTokens: 1000000,
    supportsVision: false,
    supportsWebSearch: false,
    costPerMillionPrompt: 1.25,
    costPerMillionCompletion: 5,
    optimalFor: ['competitor-analysis', 'technical-analysis'],
  },

  // OpenRouter - Llama
  'llama-3-70b': {
    provider: 'openrouter',
    model: 'llama-3-70b',
    maxTokens: 8000,
    supportsVision: false,
    supportsWebSearch: false,
    costPerMillionPrompt: 0.50,
    costPerMillionCompletion: 0.50,
    optimalFor: ['bulk-generation'],
  },

  // Perplexity - Sonar
  'sonar': {
    provider: 'perplexity',
    model: 'sonar',
    maxTokens: 4096,
    supportsVision: false,
    supportsWebSearch: true,
    costPerMillionPrompt: 1.33,
    costPerMillionCompletion: 1.33,
    optimalFor: ['web-search', 'seo-research'],
  },
  'sonar-pro': {
    provider: 'perplexity',
    model: 'sonar-pro',
    maxTokens: 4096,
    supportsVision: false,
    supportsWebSearch: true,
    costPerMillionPrompt: 4,
    costPerMillionCompletion: 20,
    optimalFor: ['web-search', 'seo-research', 'competitor-analysis'],
  },
};

/**
 * Task type to model mapping
 * Defines primary and fallback models for each task type
 */
const TASK_MODEL_MAP: Record<
  TaskType,
  {
    costOptimal: AIModel;
    qualityOptimal: AIModel;
    speedOptimal: AIModel;
  }
> = {
  'creative-content': {
    costOptimal: 'llama-3-70b',
    qualityOptimal: 'claude-sonnet-4-5',
    speedOptimal: 'claude-haiku-4-5',
  },
  'seo-research': {
    costOptimal: 'sonar',
    qualityOptimal: 'sonar-pro',
    speedOptimal: 'gpt-4-turbo',
  },
  'competitor-analysis': {
    costOptimal: 'gemini-pro-1.5',
    qualityOptimal: 'claude-opus-4-5',
    speedOptimal: 'gpt-4-turbo',
  },
  'technical-analysis': {
    costOptimal: 'gemini-pro-1.5',
    qualityOptimal: 'claude-opus-4-5',
    speedOptimal: 'gpt-4-turbo',
  },
  'bulk-generation': {
    costOptimal: 'llama-3-70b',
    qualityOptimal: 'claude-haiku-4-5',
    speedOptimal: 'llama-3-70b',
  },
  'visual-analysis': {
    costOptimal: 'gpt-4-vision',
    qualityOptimal: 'gpt-4-vision',
    speedOptimal: 'gpt-4-vision',
  },
  'web-search': {
    costOptimal: 'sonar',
    qualityOptimal: 'sonar-pro',
    speedOptimal: 'sonar',
  },
  general: {
    costOptimal: 'claude-haiku-4-5',
    qualityOptimal: 'claude-sonnet-4-5',
    speedOptimal: 'claude-haiku-4-5',
  },
};

/**
 * AIRouter - Intelligent multi-provider routing
 */
export class AIRouter {
  private openRouter: OpenRouterIntelligence;
  private perplexity: PerplexitySonar;
  private usageStats: UsageStats;

  constructor(config?: {
    openrouterKey?: string;
    perplexityKey?: string;
  }) {
    this.openRouter = new OpenRouterIntelligence(config?.openrouterKey);
    this.perplexity = new PerplexitySonar(config?.perplexityKey);

    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      byProvider: {
        openrouter: { requests: 0, tokens: 0, cost: 0 },
        perplexity: { requests: 0, tokens: 0, cost: 0 },
        anthropic: { requests: 0, tokens: 0, cost: 0 },
      },
      byModel: {} as any,
      byTaskType: {} as any,
    };
  }

  /**
   * Route a request to the optimal model
   */
  route(taskConfig: TaskConfig): RouteDecision {
    const {
      task,
      priority = 'quality',
      contextSize = 'medium',
      requiresVision = false,
      requiresWebSearch = false,
      maxBudget,
    } = taskConfig;

    // Web search always goes to Perplexity
    if (requiresWebSearch) {
      const model: AIModel = priority === 'cost' ? 'sonar' : 'sonar-pro';
      return {
        provider: 'perplexity',
        model,
        estimatedCost: this.estimateCost(model, 1000, 500), // Rough estimate
        reasoning: 'Task requires web search - routing to Perplexity Sonar',
      };
    }

    // Vision always goes to GPT-4 Vision
    if (requiresVision) {
      return {
        provider: 'openrouter',
        model: 'gpt-4-vision',
        estimatedCost: this.estimateCost('gpt-4-vision', 1000, 500),
        reasoning: 'Task requires vision capabilities - routing to GPT-4 Vision',
      };
    }

    // Extra-large context requires Gemini
    if (contextSize === 'xlarge') {
      return {
        provider: 'openrouter',
        model: 'gemini-pro-1.5',
        estimatedCost: this.estimateCost('gemini-pro-1.5', 10000, 2000),
        reasoning: 'Large context window required (>200K tokens) - routing to Gemini Pro 1.5',
      };
    }

    // Get optimal model for task and priority
    const taskModels = TASK_MODEL_MAP[task];
    let selectedModel: AIModel;

    switch (priority) {
      case 'cost':
        selectedModel = taskModels.costOptimal;
        break;
      case 'speed':
        selectedModel = taskModels.speedOptimal;
        break;
      case 'quality':
      default:
        selectedModel = taskModels.qualityOptimal;
        break;
    }

    // Check budget constraints
    if (maxBudget) {
      const estimatedCost = this.estimateCost(selectedModel, 1000, 1000);
      if (estimatedCost > maxBudget) {
        // Fallback to cost-optimal model
        selectedModel = taskModels.costOptimal;
      }
    }

    const capability = MODEL_REGISTRY[selectedModel];

    return {
      provider: capability.provider,
      model: selectedModel,
      estimatedCost: this.estimateCost(selectedModel, 1000, 1000),
      reasoning: `Optimal for ${task} with ${priority} priority`,
    };
  }

  /**
   * Execute AI request with automatic routing
   */
  async execute(
    taskConfig: TaskConfig,
    request: AIRequest
  ): Promise<AIResponse> {
    const decision = this.route(taskConfig);
    const startTime = Date.now();

    let response: AIResponse;

    try {
      if (decision.provider === 'perplexity') {
        response = await this.executePerplexity(decision.model as 'sonar' | 'sonar-pro', request);
      } else if (decision.provider === 'openrouter') {
        response = await this.executeOpenRouter(decision.model, request, taskConfig.task);
      } else {
        throw new Error(`Provider ${decision.provider} not implemented`);
      }

      // Update usage stats
      this.updateUsageStats(taskConfig.task, decision.provider, decision.model, response);

      return response;
    } catch (error: any) {
      throw new Error(`AI Router execution failed: ${error.message}`);
    } finally {
      const latency = Date.now() - startTime;
      console.log(`✅ AI Router: ${decision.model} completed in ${latency}ms`);
    }
  }

  /**
   * Execute request via Perplexity
   */
  private async executePerplexity(
    model: 'sonar' | 'sonar-pro',
    request: AIRequest
  ): Promise<AIResponse> {
    const result = await this.perplexity.search(request.prompt, {
      model,
      maxTokens: request.maxTokens || 2048,
      organizationId: request.organizationId,
      workspaceId: request.workspaceId,
      clientId: request.clientId,
    });

    // Perplexity doesn't return token counts, estimate from content
    const estimatedTokens = Math.ceil((result.answer.length + request.prompt.length) / 4);

    return {
      content: result.answer,
      provider: 'perplexity',
      model,
      tokensUsed: {
        prompt: Math.ceil(request.prompt.length / 4),
        completion: Math.ceil(result.answer.length / 4),
        total: estimatedTokens,
      },
      cost: this.estimateCost(model, estimatedTokens / 2, estimatedTokens / 2),
      latency: 0, // Tracked externally
      citations: result.citations,
    };
  }

  /**
   * Execute request via OpenRouter
   */
  private async executeOpenRouter(
    model: AIModel,
    request: AIRequest,
    taskType: TaskType
  ): Promise<AIResponse> {
    // Map to OpenRouter model format
    const openRouterModel = this.mapToOpenRouterModel(model);

    // Build tracking params
    const trackingParams = request.organizationId && request.workspaceId
      ? {
          organizationId: request.organizationId,
          workspaceId: request.workspaceId,
          clientId: request.clientId,
        }
      : undefined;

    // Call OpenRouter (uses internal method)
    const content = await (this.openRouter as any).callOpenRouter(
      openRouterModel,
      request.prompt,
      request.images ? request.images.map(url => ({ type: 'image_url', image_url: url })) : undefined,
      trackingParams
    );

    // Estimate tokens (OpenRouter returns this in response, but we need to parse it)
    const estimatedTokens = Math.ceil((content.length + request.prompt.length) / 4);

    return {
      content,
      provider: 'openrouter',
      model,
      tokensUsed: {
        prompt: Math.ceil(request.prompt.length / 4),
        completion: Math.ceil(content.length / 4),
        total: estimatedTokens,
      },
      cost: this.estimateCost(model, estimatedTokens / 2, estimatedTokens / 2),
      latency: 0, // Tracked externally
    };
  }

  /**
   * Map AI model to OpenRouter format
   */
  private mapToOpenRouterModel(model: AIModel): string {
    const mapping: Record<string, string> = {
      'claude-sonnet-4-5': 'anthropic/claude-sonnet-4-5-20250929',
      'claude-opus-4-5': 'anthropic/claude-opus-4-5-20251101',
      'claude-haiku-4-5': 'anthropic/claude-haiku-4-5-20251001',
      'gpt-4-turbo': 'openai/gpt-4-turbo',
      'gpt-4-vision': 'openai/gpt-4-vision-preview',
      'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
      'gemini-pro-1.5': 'google/gemini-pro-1.5',
      'llama-3-70b': 'meta-llama/llama-3-70b-instruct',
    };

    return mapping[model] || model;
  }

  /**
   * Estimate cost for a request
   */
  estimateCost(
    model: AIModel,
    promptTokens: number,
    completionTokens: number
  ): number {
    const capability = MODEL_REGISTRY[model];
    if (!capability) {
return 0;
}

    const promptCost = (promptTokens / 1_000_000) * capability.costPerMillionPrompt;
    const completionCost = (completionTokens / 1_000_000) * capability.costPerMillionCompletion;

    return promptCost + completionCost;
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(
    taskType: TaskType,
    provider: AIProvider,
    model: AIModel,
    response: AIResponse
  ): void {
    this.usageStats.totalRequests++;
    this.usageStats.totalTokens += response.tokensUsed.total;
    this.usageStats.totalCost += response.cost;

    // By provider
    if (!this.usageStats.byProvider[provider]) {
      this.usageStats.byProvider[provider] = { requests: 0, tokens: 0, cost: 0 };
    }
    this.usageStats.byProvider[provider].requests++;
    this.usageStats.byProvider[provider].tokens += response.tokensUsed.total;
    this.usageStats.byProvider[provider].cost += response.cost;

    // By model
    if (!this.usageStats.byModel[model]) {
      this.usageStats.byModel[model] = { requests: 0, tokens: 0, cost: 0 };
    }
    this.usageStats.byModel[model].requests++;
    this.usageStats.byModel[model].tokens += response.tokensUsed.total;
    this.usageStats.byModel[model].cost += response.cost;

    // By task type
    if (!this.usageStats.byTaskType[taskType]) {
      this.usageStats.byTaskType[taskType] = { requests: 0, tokens: 0, cost: 0 };
    }
    this.usageStats.byTaskType[taskType].requests++;
    this.usageStats.byTaskType[taskType].tokens += response.tokensUsed.total;
    this.usageStats.byTaskType[taskType].cost += response.cost;
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): UsageStats {
    return { ...this.usageStats };
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats(): void {
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      byProvider: {
        openrouter: { requests: 0, tokens: 0, cost: 0 },
        perplexity: { requests: 0, tokens: 0, cost: 0 },
        anthropic: { requests: 0, tokens: 0, cost: 0 },
      },
      byModel: {} as any,
      byTaskType: {} as any,
    };
  }

  /**
   * Get available models for a task type
   */
  getAvailableModels(taskType: TaskType): AIModel[] {
    return Object.entries(MODEL_REGISTRY)
      .filter(([_, capability]) => capability.optimalFor.includes(taskType))
      .map(([model]) => model as AIModel);
  }

  /**
   * Get model capability details
   */
  getModelCapability(model: AIModel): ModelCapability | undefined {
    return MODEL_REGISTRY[model];
  }
}

/**
 * Helper function: Create router instance
 */
export function createAIRouter(config?: {
  openrouterKey?: string;
  perplexityKey?: string;
}): AIRouter {
  return new AIRouter(config);
}

/**
 * Helper function: Quick route decision
 */
export function quickRoute(taskType: TaskType, priority: Priority = 'quality'): RouteDecision {
  const router = createAIRouter();
  return router.route({ task: taskType, priority });
}

/**
 * Helper function: Estimate cost for a task
 */
export function estimateTaskCost(
  taskType: TaskType,
  priority: Priority,
  promptTokens: number,
  completionTokens: number
): number {
  const router = createAIRouter();
  const decision = router.route({ task: taskType, priority });
  return router.estimateCost(decision.model, promptTokens, completionTokens);
}

export default AIRouter;
