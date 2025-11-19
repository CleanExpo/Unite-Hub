/**
 * Model Router - Intelligent Model Selection with Cost Optimization
 *
 * Priority Order:
 * 1. Assigned model (if specified)
 * 2. OpenRouter model (cheapest that works)
 * 3. Google AI (fallback)
 * 4. Always ensure a model is available
 */

import Anthropic from "@anthropic-ai/sdk";
import { getOpenRouterClient } from "../openrouter";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openRouter = getOpenRouterClient();

// Model pricing (per 1M tokens) - Updated 2025-11-19
const MODEL_COSTS = {
  // FREE OpenRouter Models (BEST: $0 cost!) - Updated 2025-11-19
  "sherlock-think-alpha": { input: 0, output: 0 },          // FREE: Reasoning, 1.8M context, multimodal
  "sherlock-dash-alpha": { input: 0, output: 0 },           // FREE: Non-reasoning, 1.8M context, multimodal
  "kat-coder-pro-free": { input: 0, output: 0 },            // FREE: Coding specialist, 256K context
  "gemma-3n-e2b-it-free": { input: 0, output: 0 },          // FREE: Google DeepMind, 8K context, multimodal
  "mai-ds-r1-free": { input: 0, output: 0 },                // FREE: Microsoft reasoning, 163K context

  // Anthropic Claude (Direct API)
  "claude-opus-4": { input: 15, output: 75 },
  "claude-sonnet-4.5": { input: 3, output: 15 },
  "claude-haiku-4.5": { input: 0.8, output: 4 },

  // Google Gemini 2.0 (OpenRouter)
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.3 },   // Ultra-cheap, 25% cheaper than 1.5
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },          // Balanced, 1M context

  // Google Gemini 2.5 (OpenRouter)
  "gemini-2.5-flash-image": { input: 0.3, output: 2.5, inputImages: 1.238, outputImages: 0.03 }, // Image generation, 33K context

  // Google Gemini 3.0 (OpenRouter)
  "gemini-3.0-pro": { input: 2, output: 12 },               // Advanced reasoning, beats GPT-4

  // Budget OpenRouter Models
  "qwen3-vl-8b-thinking": { input: 0.035, output: 0.138 },  // Qwen VL reasoning, 8B params
  "llama-3.3-nemotron-super-49b": { input: 0.1, output: 0.4 }, // NVIDIA, 130K context, balanced
  "deepseek-v3.2-exp": { input: 0.27, output: 0.4 },        // DeepSeek, 163K context, sparse attention
  "grok-4-fast": { input: 0.2, output: 0.5 },               // xAI, 2M context, multimodal reasoning
  "kimi-k2-thinking": { input: 0.5, output: 2.5 },          // Reasoning, 262K context, MoE architecture
  "llama-3.3-70b": { input: 0.35, output: 0.4 },

  // Legacy Gemini 1.5 (deprecated - use 2.0 instead)
  "gemini-flash-lite": { input: 0.05, output: 0.2 },        // DEPRECATED: Use gemini-2.0-flash-lite
  "gemini-flash": { input: 0.1, output: 0.4 },              // DEPRECATED: Use gemini-2.0-flash
};

export type TaskType =
  // FINAL EXECUTION TASKS (Big 4 Only - Anthropic/ChatGPT/Perplexity/Gemini)
  | "extract_intent"          // Ultra-cheap (Gemini 2.0 Flash-Lite)
  | "tag_generation"          // Ultra-cheap (Gemini 2.0 Flash-Lite)
  | "sentiment_analysis"      // Ultra-cheap (Gemini 2.0 Flash-Lite)
  | "email_intelligence"      // Budget (Gemini 2.0 Flash)
  | "contact_scoring"         // Budget (Gemini 2.0 Flash)
  | "generate_persona"        // Standard (Gemini 3.0 Pro)
  | "generate_strategy"       // Standard (Gemini 3.0 Pro)
  | "generate_content"        // Premium (Claude Opus 4)
  | "security_audit"          // Ultra-premium (Claude Sonnet 4.5)
  | "codebase_analysis"       // Ultra-premium (Gemini 3.0 Pro)

  // PREPROCESSING TASKS (FREE/Budget models for heavy lifting)
  | "preprocess_data"         // Data cleaning, normalization (FREE models OK)
  | "extract_raw_data"        // Raw extraction before validation (FREE models OK)
  | "summarize_context"       // Context summarization to reduce tokens (FREE models OK)
  | "filter_candidates";      // Initial filtering before final selection (FREE models OK)

export type ModelName =
  // FREE Models (OpenRouter)
  | "sherlock-think-alpha"        // FREE: Reasoning, 1.8M context
  | "sherlock-dash-alpha"         // FREE: Fast, 1.8M context
  | "kat-coder-pro-free"          // FREE: Coding specialist, 256K context
  | "gemma-3n-e2b-it-free"        // FREE: Google DeepMind, 8K context
  | "mai-ds-r1-free"              // FREE: Microsoft reasoning, 163K context

  // Anthropic Claude (Direct)
  | "claude-opus-4"
  | "claude-sonnet-4.5"
  | "claude-haiku-4.5"

  // Google Gemini (OpenRouter)
  | "gemini-2.0-flash-lite"       // Ultra-cheap ($0.075/$0.30)
  | "gemini-2.0-flash"            // Balanced ($0.10/$0.40)
  | "gemini-2.5-flash-image"      // Image generation ($0.30/$2.50)
  | "gemini-3.0-pro"              // Advanced reasoning ($2/$12)

  // Budget OpenRouter Models
  | "qwen3-vl-8b-thinking"        // Qwen VL reasoning ($0.035/$0.138)
  | "llama-3.3-nemotron-super-49b" // NVIDIA balanced ($0.10/$0.40)
  | "deepseek-v3.2-exp"           // DeepSeek sparse ($0.27/$0.40)
  | "grok-4-fast"                 // xAI multimodal ($0.20/$0.50)
  | "kimi-k2-thinking"            // Reasoning ($0.50/$2.50)
  | "llama-3.3-70b"

  // Deprecated
  | "gemini-flash-lite"           // DEPRECATED
  | "gemini-flash";               // DEPRECATED

export type CostTier = "free" | "budget" | "premium";

export interface RouteOptions {
  task: TaskType;
  prompt: string;
  context?: string;
  assignedModel?: ModelName;        // Force specific model (highest priority)
  preferredModel?: ModelName;       // Preferred but not forced
  preferredTier?: CostTier;         // Prefer models in this cost tier
  fallback?: ModelName;             // Fallback if preferred fails
  thinkingBudget?: number;          // Enable Extended Thinking (Opus only)
  maxTokens?: number;
  temperature?: number;
  onProgress?: (progress: { stage: string; progress: number; model?: string }) => void; // Progress callback
}

export interface ModelResponse {
  model: ModelName;
  response: string;
  reasoning?: string;               // For Extended Thinking
  tokensUsed: { input: number; output: number };
  costEstimate: number;
  latencyMs: number;
  tier: CostTier;                   // Cost tier used
}

export class ModelRouter {
  /**
   * Route task to the optimal model based on priority order:
   * 1. Assigned model (if specified)
   * 2. OpenRouter model (cheapest that works)
   * 3. Anthropic (fallback)
   * 4. Always ensure a model is available
   */
  async route(options: RouteOptions): Promise<ModelResponse> {
    const startTime = Date.now();

    // 1. Use assigned model if specified (highest priority)
    if (options.assignedModel) {
      console.log(`🎯 Using assigned model: ${options.assignedModel}`);
      return await this.callModel(options.assignedModel, options, startTime);
    }

    // 2. Auto-select based on task type and cost optimization
    const recommendedModel = this.selectOptimalModel(options.task, options);

    try {
      console.log(`💡 Recommended model: ${recommendedModel}`);
      return await this.callModel(recommendedModel, options, startTime);
    } catch (error) {
      console.error(`❌ ${recommendedModel} failed:`, error);

      // 3. Try fallback model if specified
      if (options.fallback) {
        console.log(`🔄 Trying fallback: ${options.fallback}`);
        try {
          return await this.callModel(options.fallback, options, startTime);
        } catch (fallbackError) {
          console.error(`❌ Fallback ${options.fallback} failed:`, fallbackError);
        }
      }

      // 4. Final fallback: Claude Haiku (cheapest Anthropic, most reliable)
      console.log(`🆘 Using emergency fallback: claude-haiku-4.5`);
      return await this.callModel("claude-haiku-4.5", options, startTime);
    }
  }

  /**
   * Get cost tier for a model
   */
  private getModelTier(model: ModelName): CostTier {
    const freeModels: ModelName[] = [
      "sherlock-think-alpha",
      "sherlock-dash-alpha",
      "kat-coder-pro-free",
      "gemma-3n-e2b-it-free",
      "mai-ds-r1-free",
    ];

    const premiumModels: ModelName[] = [
      "claude-opus-4",
      "claude-sonnet-4.5",
      "gemini-3.0-pro",
    ];

    if (freeModels.includes(model)) return "free";
    if (premiumModels.includes(model)) return "premium";
    return "budget";
  }

  /**
   * Select optimal model based on task type
   * Default to cheapest model that can successfully complete the task
   */
  private selectOptimalModel(task: TaskType, options: RouteOptions): ModelName {
    // Prefer user's preferred model if specified
    if (options.preferredModel) {
      return options.preferredModel;
    }

    // If preferred tier specified, select best model in that tier
    if (options.preferredTier) {
      return this.selectModelByTier(task, options.preferredTier);
    }

    // CRITICAL ARCHITECTURE RULE:
    // ALL FINAL EXECUTION TASKS → Big 4 ONLY (Anthropic/ChatGPT/Perplexity/Gemini)
    // FREE/Budget models → Preprocessing/heavy lifting ONLY, NEVER final execution
    const taskToModelMap: Record<TaskType, ModelName> = {
      // ============================================
      // FINAL EXECUTION - BIG 4 GATEKEEPERS
      // ============================================

      // Ultra-cheap tasks → Gemini 2.0 (Big 4 gatekeeper)
      extract_intent: "gemini-2.0-flash-lite",
      tag_generation: "gemini-2.0-flash-lite",
      sentiment_analysis: "gemini-2.0-flash-lite",

      // Budget tasks → Gemini 2.0 Flash (Big 4 gatekeeper)
      email_intelligence: "gemini-2.0-flash",
      contact_scoring: "gemini-2.0-flash",

      // Standard tasks → Gemini 3.0 Pro (Big 4 gatekeeper)
      generate_persona: "gemini-3.0-pro",
      generate_strategy: "gemini-3.0-pro",

      // Premium tasks → Claude Opus (Big 4 gatekeeper)
      generate_content: "claude-opus-4",

      // Ultra-premium tasks → Claude Sonnet (Big 4 gatekeeper)
      security_audit: "claude-sonnet-4.5",
      codebase_analysis: "gemini-3.0-pro",

      // ============================================
      // PREPROCESSING - FREE/BUDGET MODELS ALLOWED
      // ============================================

      // Data preprocessing → FREE Sherlock Dash (context reduction)
      preprocess_data: "sherlock-dash-alpha",
      extract_raw_data: "sherlock-dash-alpha",
      summarize_context: "sherlock-think-alpha",
      filter_candidates: "sherlock-dash-alpha",
    };

    return taskToModelMap[task] || "gemini-2.0-flash";
  }

  /**
   * Select best model in a specific cost tier for a task
   */
  private selectModelByTier(task: TaskType, tier: CostTier): ModelName {
    const tierModels: Record<CostTier, Record<string, ModelName>> = {
      free: {
        reasoning: "sherlock-think-alpha",
        fast: "sherlock-dash-alpha",
        coding: "kat-coder-pro-free",
        multimodal: "gemma-3n-e2b-it-free",
        default: "sherlock-dash-alpha",
      },
      budget: {
        reasoning: "kimi-k2-thinking",
        fast: "gemini-2.0-flash",
        coding: "qwen3-vl-8b-thinking",
        multimodal: "grok-4-fast",
        default: "gemini-2.0-flash",
      },
      premium: {
        reasoning: "claude-opus-4",
        fast: "claude-sonnet-4.5",
        coding: "gemini-3.0-pro",
        multimodal: "gemini-3.0-pro",
        default: "claude-sonnet-4.5",
      },
    };

    // Select sub-tier based on task type
    const taskRequirements: Record<TaskType, keyof typeof tierModels.free> = {
      // Final execution tasks (Big 4 only)
      extract_intent: "fast",
      tag_generation: "fast",
      sentiment_analysis: "fast",
      email_intelligence: "fast",
      contact_scoring: "fast",
      generate_persona: "reasoning",
      generate_strategy: "reasoning",
      generate_content: "reasoning",
      security_audit: "reasoning",
      codebase_analysis: "coding",

      // Preprocessing tasks (FREE models allowed)
      preprocess_data: "fast",
      extract_raw_data: "fast",
      summarize_context: "reasoning",
      filter_candidates: "fast",
    };

    const requirement = taskRequirements[task] || "default";
    return tierModels[tier][requirement];
  }

  /**
   * Call specific model
   */
  private async callModel(
    model: ModelName,
    options: RouteOptions,
    startTime: number
  ): Promise<ModelResponse> {
    const fullPrompt = options.context
      ? `${options.prompt}\n\n---\n\nContext:\n${options.context}`
      : options.prompt;

    // Anthropic models
    if (model.startsWith("claude-")) {
      return await this.callAnthropic(model, fullPrompt, options, startTime);
    }

    // OpenRouter models (FREE models, Gemini, Kimi, etc.)
    if (
      [
        // FREE Models
        "sherlock-think-alpha",
        "sherlock-dash-alpha",
        "kat-coder-pro-free",
        "gemma-3n-e2b-it-free",
        "mai-ds-r1-free",
        // Gemini Models
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
        "gemini-2.5-flash-image",
        "gemini-3.0-pro",
        "gemini-flash-lite",      // Legacy
        "gemini-flash",           // Legacy
        // Budget Models
        "qwen3-vl-8b-thinking",
        "llama-3.3-nemotron-super-49b",
        "deepseek-v3.2-exp",
        "grok-4-fast",
        "kimi-k2-thinking",
        "llama-3.3-70b",
      ].includes(model)
    ) {
      return await this.callOpenRouter(model, fullPrompt, options, startTime);
    }

    throw new Error(`Unknown model: ${model}`);
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(
    model: ModelName,
    prompt: string,
    options: RouteOptions,
    startTime: number
  ): Promise<ModelResponse> {
    const anthropicModel = {
      "claude-opus-4": "claude-opus-4-1-20250805",
      "claude-sonnet-4.5": "claude-sonnet-4-5-20250929",
      "claude-haiku-4.5": "claude-haiku-4-5-20251001",
    }[model];

    if (!anthropicModel) {
      throw new Error(`Invalid Anthropic model: ${model}`);
    }

    const messageOptions: any = {
      model: anthropicModel,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature !== undefined ? options.temperature : 0.7,
      messages: [{ role: "user", content: prompt }],
    };

    // Enable Extended Thinking for Opus if requested
    if (model === "claude-opus-4" && options.thinkingBudget) {
      messageOptions.thinking = {
        type: "enabled",
        budget_tokens: options.thinkingBudget,
      };
    }

    const message = await anthropic.messages.create(messageOptions);

    const response = message.content.find((c) => c.type === "text")?.text || "";
    const reasoning =
      message.content.find((c) => c.type === "thinking")?.thinking || undefined;

    const tokensUsed = {
      input: message.usage.input_tokens,
      output: message.usage.output_tokens,
    };

    const costEstimate = this.calculateCost(model, tokensUsed);
    const tier = this.getModelTier(model);

    // Report progress if callback provided
    if (options.onProgress) {
      options.onProgress({
        stage: "completed",
        progress: 100,
        model,
      });
    }

    return {
      model,
      response,
      reasoning,
      tokensUsed,
      costEstimate,
      latencyMs: Date.now() - startTime,
      tier,
    };
  }

  /**
   * Call OpenRouter API
   */
  private async callOpenRouter(
    model: ModelName,
    prompt: string,
    options: RouteOptions,
    startTime: number
  ): Promise<ModelResponse> {
    if (!openRouter.isAvailable()) {
      throw new Error("OpenRouter API key not configured");
    }

    const openRouterModelMap: Record<string, string> = {
      // FREE Models (Priority 1)
      "sherlock-think-alpha": "openrouter/sherlock-think-alpha",
      "sherlock-dash-alpha": "openrouter/sherlock-dash-alpha",
      "kat-coder-pro-free": "kwaipilot/kat-coder-pro:free",
      "gemma-3n-e2b-it-free": "google/gemma-3n-e2b-it:free",
      "mai-ds-r1-free": "microsoft/mai-ds-r1:free",

      // Gemini 2.0 (Ultra-cheap)
      "gemini-2.0-flash-lite": "google/gemini-2.0-flash-lite",
      "gemini-2.0-flash": "google/gemini-2.0-flash",

      // Gemini 2.5 (Image generation)
      "gemini-2.5-flash-image": "google/gemini-2.5-flash-image-preview",

      // Gemini 3.0 (Advanced reasoning)
      "gemini-3.0-pro": "google/gemini-3-pro-preview",

      // Budget Models
      "qwen3-vl-8b-thinking": "qwen/qwen3-vl-8b-thinking",
      "llama-3.3-nemotron-super-49b": "nvidia/llama-3.3-nemotron-super-49b-v1.5",
      "deepseek-v3.2-exp": "deepseek/deepseek-v3.2-exp",
      "grok-4-fast": "x-ai/grok-4-fast",
      "kimi-k2-thinking": "moonshotai/kimi-k2-thinking",
      "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct",

      // Legacy Gemini 1.5 (deprecated)
      "gemini-flash-lite": "google/gemini-flash-1.5",
      "gemini-flash": "google/gemini-flash-1.5",
    };

    const openRouterModel = openRouterModelMap[model];
    if (!openRouterModel) {
      throw new Error(`Invalid OpenRouter model: ${model}`);
    }

    const response = await openRouter.chat(prompt, {
      model: openRouterModel,
      maxTokens: options.maxTokens || 4096,
      temperature: options.temperature !== undefined ? options.temperature : 0.7,
    });

    // Estimate tokens (OpenRouter doesn't always return usage)
    const tokensUsed = {
      input: Math.ceil(prompt.length / 4),
      output: Math.ceil(response.length / 4),
    };

    const costEstimate = this.calculateCost(model, tokensUsed);
    const tier = this.getModelTier(model);

    // Report progress if callback provided
    if (options.onProgress) {
      options.onProgress({
        stage: "completed",
        progress: 100,
        model,
      });
    }

    return {
      model,
      response,
      tokensUsed,
      costEstimate,
      latencyMs: Date.now() - startTime,
      tier,
    };
  }

  /**
   * Calculate cost estimate
   */
  private calculateCost(
    model: ModelName,
    tokensUsed: { input: number; output: number }
  ): number {
    const costs = MODEL_COSTS[model];
    if (!costs) return 0;

    return (
      (tokensUsed.input / 1_000_000) * costs.input +
      (tokensUsed.output / 1_000_000) * costs.output
    );
  }
}

// Singleton instance
let router: ModelRouter | null = null;

export function getModelRouter(): ModelRouter {
  if (!router) {
    router = new ModelRouter();
  }
  return router;
}

/**
 * Convenience function for routing tasks
 *
 * @example
 * // Simple intent extraction (ultra-cheap)
 * const intent = await routeToModel({
 *   task: "extract_intent",
 *   prompt: "What is the intent of this email?",
 * });
 *
 * @example
 * // Content generation with Extended Thinking (premium)
 * const content = await routeToModel({
 *   task: "generate_content",
 *   prompt: "Write a blog post about AI marketing",
 *   assignedModel: "claude-opus-4",
 *   thinkingBudget: 5000,
 * });
 */
export async function routeToModel(options: RouteOptions): Promise<ModelResponse> {
  const router = getModelRouter();
  return await router.route(options);
}
