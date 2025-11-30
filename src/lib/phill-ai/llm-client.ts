/**
 * Phill AI - Multi-Tier LLM Client
 * OpenRouter integration with cost-optimized model routing
 *
 * Tier 1 (FREE - 95%): DeepSeek V3.1, Llama 4, Gemini 2.5 Pro
 * Tier 2 (Low Cost - 4%): DeepSeek paid, Qwen, Claude Sonnet
 * Tier 3 (Premium - 1%): Claude Opus 4.5, GPT-5.1, Gemini 3 Pro
 */

import OpenAI from 'openai';

// Model configuration interface
export interface ModelConfig {
  id: string;
  name: string;
  context: number;
  costInput: number;
  costOutput: number;
  features: string[];
  bestFor: string[];
  outputLimit?: number;
  benchmarks?: { swe_bench?: number };
}

// Model definitions by tier
export const LLM_MODELS: {
  tier1: Record<string, ModelConfig>;
  tier2: Record<string, ModelConfig>;
  tier3: Record<string, ModelConfig>;
} = {
  // Tier 1: FREE Models (95% of tasks)
  tier1: {
    'deepseek-v3.1-free': {
      id: 'deepseek/deepseek-chat-v3.1:free',
      name: 'DeepSeek V3.1 FREE',
      context: 131072,
      costInput: 0,
      costOutput: 0,
      features: ['thinking_mode', 'tool_calling', 'code_agents'],
      bestFor: ['code_generation', 'reasoning', 'documentation', 'first_drafts'],
    },
    'deepseek-r1-free': {
      id: 'deepseek/deepseek-r1-0528:free',
      name: 'DeepSeek R1-0528 FREE',
      context: 131072,
      costInput: 0,
      costOutput: 0,
      features: ['deep_reasoning', 'math', 'logic'],
      bestFor: ['complex_reasoning', 'mathematical_proofs', 'deep_analysis'],
    },
    'llama-4-maverick': {
      id: 'meta-llama/llama-4-maverick:free',
      name: 'Llama 4 Maverick FREE',
      context: 1000000,
      costInput: 0,
      costOutput: 0,
      features: ['long_context', 'multimodal'],
      bestFor: ['long_documents', 'general_tasks', 'creative_content'],
    },
    'llama-4-scout': {
      id: 'meta-llama/llama-4-scout:free',
      name: 'Llama 4 Scout FREE',
      context: 10000000,
      costInput: 0,
      costOutput: 0,
      features: ['massive_context', 'multimodal'],
      bestFor: ['massive_codebases', 'full_repo_analysis'],
    },
    'gemini-2.5-pro-free': {
      id: 'google/gemini-2.5-pro-exp-03-25:free',
      name: 'Gemini 2.5 Pro FREE',
      context: 1000000,
      costInput: 0,
      costOutput: 0,
      features: ['multimodal', 'image_understanding'],
      bestFor: ['design_analysis', 'image_tasks', 'seo_metadata'],
    },
    'mistral-small-free': {
      id: 'mistralai/mistral-small-3.1-24b-instruct:free',
      name: 'Mistral Small 3.1 FREE',
      context: 128000,
      costInput: 0,
      costOutput: 0,
      features: ['fast', 'efficient'],
      bestFor: ['quick_tasks', 'simple_instructions'],
    },
  },

  // Tier 2: Refinement Models (4% of tasks)
  tier2: {
    'deepseek-v3.1': {
      id: 'deepseek/deepseek-chat-v3.1',
      name: 'DeepSeek V3.1',
      context: 131072,
      costInput: 0.216,
      costOutput: 0.80,
      features: ['thinking_mode', 'tool_calling', 'code_agents'],
      bestFor: ['production_code', 'agent_workflows'],
    },
    'qwen3-235b': {
      id: 'qwen/qwen3-235b-a22b',
      name: 'Qwen3 235B',
      context: 131072,
      costInput: 0.30,
      costOutput: 1.20,
      features: ['thinking_mode', 'multilingual_119'],
      bestFor: ['multilingual', 'complex_reasoning'],
    },
    'claude-sonnet-4': {
      id: 'anthropic/claude-sonnet-4',
      name: 'Claude Sonnet 4',
      context: 200000,
      costInput: 3.00,
      costOutput: 15.00,
      features: ['hybrid_reasoning', 'tool_use'],
      bestFor: ['code_review', 'quality_check'],
    },
  },

  // Tier 3: Premium Models (1% of tasks - critical only)
  tier3: {
    'claude-opus-4.5': {
      id: 'anthropic/claude-opus-4.5',
      name: 'Claude Opus 4.5',
      context: 200000,
      outputLimit: 64000,
      costInput: 5.00,
      costOutput: 25.00,
      features: ['best_coding', 'extended_thinking', 'prompt_injection_resistant'],
      benchmarks: { swe_bench: 80.9 },
      bestFor: ['security_review', 'production_validation', 'critical_code'],
    },
    'gpt-5.1': {
      id: 'openai/gpt-5.1',
      name: 'GPT-5.1',
      context: 128000,
      costInput: 1.25,
      costOutput: 10.00,
      features: ['conversational', 'creative'],
      bestFor: ['general_tasks', 'creative_content'],
    },
    'gemini-3-pro': {
      id: 'google/gemini-3-pro',
      name: 'Gemini 3 Pro',
      context: 1000000,
      costInput: 2.00,
      costOutput: 12.00,
      features: ['multimodal', 'long_context', 'agentic'],
      bestFor: ['multimodal_validation', 'image_review'],
    },
  },
};

export type Tier = 'tier1' | 'tier2' | 'tier3';
export type ModelKey = string;

export interface LLMClientConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultTier?: Tier;
  siteUrl?: string;
  siteName?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  tier?: Tier;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  tier: Tier;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

/**
 * Multi-tier LLM client using OpenRouter
 */
export class PhillAIClient {
  private client: OpenAI;
  private defaultTier: Tier;
  private siteUrl: string;
  private siteName: string;

  constructor(config: LLMClientConfig = {}) {
    const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required');
    }

    this.client = new OpenAI({
      baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': config.siteUrl || 'https://synthex.social',
        'X-Title': config.siteName || 'Phill AI Agent System',
      },
    });

    this.defaultTier = config.defaultTier || 'tier1';
    this.siteUrl = config.siteUrl || 'https://synthex.social';
    this.siteName = config.siteName || 'Phill AI Agent System';
  }

  /**
   * Get model configuration by tier and key
   */
  getModel(tier: Tier, key?: string): ModelConfig {
    const tierModels = LLM_MODELS[tier];
    if (key && tierModels[key]) {
      return tierModels[key];
    }
    // Return primary model for tier
    const keys = Object.keys(tierModels);
    return tierModels[keys[0]];
  }

  /**
   * Select optimal model based on task requirements
   */
  selectModel(options: {
    taskType: 'code' | 'design' | 'reasoning' | 'content' | 'security' | 'general';
    contextLength?: number;
    isCritical?: boolean;
    hasImages?: boolean;
    requiresRefinement?: boolean;
  }): { modelId: string; tier: Tier } {
    const { taskType, contextLength = 0, isCritical, hasImages, requiresRefinement } = options;

    // Always use Opus for security and critical tasks
    if (isCritical || taskType === 'security') {
      return { modelId: LLM_MODELS.tier3['claude-opus-4.5'].id, tier: 'tier3' };
    }

    // Use Gemini for image tasks
    if (hasImages) {
      return requiresRefinement
        ? { modelId: LLM_MODELS.tier3['gemini-3-pro'].id, tier: 'tier3' }
        : { modelId: LLM_MODELS.tier1['gemini-2.5-pro-free'].id, tier: 'tier1' };
    }

    // Use Llama Scout for massive context
    if (contextLength > 500000) {
      return { modelId: LLM_MODELS.tier1['llama-4-scout'].id, tier: 'tier1' };
    }

    // Use DeepSeek R1 for reasoning/math
    if (taskType === 'reasoning') {
      return { modelId: LLM_MODELS.tier1['deepseek-r1-free'].id, tier: 'tier1' };
    }

    // Refinement tier for production-ready work
    if (requiresRefinement) {
      return taskType === 'code'
        ? { modelId: LLM_MODELS.tier2['deepseek-v3.1'].id, tier: 'tier2' }
        : { modelId: LLM_MODELS.tier2['qwen3-235b'].id, tier: 'tier2' };
    }

    // Default: FREE DeepSeek V3.1 for everything else
    return { modelId: LLM_MODELS.tier1['deepseek-v3.1-free'].id, tier: 'tier1' };
  }

  /**
   * Send chat completion request
   */
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const tier = options.tier || this.defaultTier;
    const modelConfig = this.getModel(tier);
    const model = options.model || modelConfig.id;

    const response = await this.client.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: false, // Always non-streaming for this method
    });

    const choice = response.choices[0];
    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    // Calculate estimated cost
    const costConfig = this.findModelConfig(model);
    const estimatedCost = costConfig
      ? (usage.prompt_tokens / 1000000) * costConfig.costInput +
        (usage.completion_tokens / 1000000) * costConfig.costOutput
      : 0;

    return {
      content: choice.message.content || '',
      model,
      tier,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCost,
      },
    };
  }

  /**
   * Find model configuration by ID
   */
  private findModelConfig(modelId: string): ModelConfig | null {
    const tiers: Tier[] = ['tier1', 'tier2', 'tier3'];
    for (const tier of tiers) {
      const tierModels = LLM_MODELS[tier];
      for (const key of Object.keys(tierModels)) {
        const model = tierModels[key];
        if (model.id === modelId) {
          return model;
        }
      }
    }
    return null;
  }

  /**
   * Quick helper for FREE tier completion
   */
  async free(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: ChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.chat(messages, { tier: 'tier1' });
    return response.content;
  }

  /**
   * Quick helper for critical/security tasks (always Opus)
   */
  async critical(prompt: string, systemPrompt?: string): Promise<ChatResponse> {
    const messages: ChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return this.chat(messages, {
      tier: 'tier3',
      model: LLM_MODELS.tier3['claude-opus-4.5'].id,
    });
  }
}

// Export singleton instance
let clientInstance: PhillAIClient | null = null;

export function getPhillAIClient(config?: LLMClientConfig): PhillAIClient {
  if (!clientInstance) {
    clientInstance = new PhillAIClient(config);
  }
  return clientInstance;
}

export default PhillAIClient;
