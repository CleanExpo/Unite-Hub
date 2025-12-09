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
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { getOpenRouterClient } from "../openrouter";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openRouter = getOpenRouterClient();

// Model pricing (per 1M tokens) - Updated 2025-11-19
const MODEL_COSTS = {
  // ============================================
  // BIG 4 GATEKEEPERS (Latest Flagship Models ONLY)
  // ============================================

  // Anthropic Claude (Direct API) - Big 4 Gatekeeper #1
  "claude-opus-4.5": { input: 15, output: 75 },             // Flagship: Latest Opus with Extended Thinking
  "claude-opus-4.1": { input: 15, output: 75 },             // Flagship: Extended Thinking
  "claude-sonnet-4.5": { input: 3, output: 15 },            // Flagship: Balanced
  "claude-haiku-4.5": { input: 0.8, output: 4 },            // Flagship: Fast

  // OpenAI ChatGPT (via OpenRouter) - Big 4 Gatekeeper #2
  "gpt-5.1": { input: 1.25, output: 10 },                   // Flagship: GPT-5 full
  "gpt-5-mini": { input: 0.15, output: 0.6 },               // Flagship: GPT-5 mini

  // Google Gemini (via OpenRouter) - Big 4 Gatekeeper #3
  "gemini-3.0-pro": { input: 2, output: 12 },               // Flagship: Advanced reasoning
  "gemini-2.5-flash-image": { input: 0.3, output: 2.5, inputImages: 1.238, outputImages: 0.03 }, // Flagship: Nano Banana

  // Perplexity (via OpenRouter) - Big 4 Gatekeeper #4
  "perplexity-sonar": { input: 1, output: 5 },              // Flagship: Sonar

  // ============================================
  // SUB-AGENTS (Earlier/Lower Models)
  // ============================================

  // Google Gemini Sub-Agents
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.3 },   // Sub-agent: Ultra-cheap
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },          // Sub-agent: Balanced

  // ============================================
  // FREE MODELS (Preprocessing/Heavy Lifting)
  // ============================================

  "sherlock-think-alpha": { input: 0, output: 0 },          // FREE: Reasoning, 1.8M context
  "sherlock-dash-alpha": { input: 0, output: 0 },           // FREE: Fast, 1.8M context
  "kat-coder-pro-free": { input: 0, output: 0 },            // FREE: Coding specialist
  "gemma-3n-e2b-it-free": { input: 0, output: 0 },          // FREE: Google DeepMind
  "mai-ds-r1-free": { input: 0, output: 0 },                // FREE: Microsoft reasoning

  // ============================================
  // BUDGET MODELS (Preprocessing/Sub-Agents)
  // ============================================

  "qwen3-vl-8b-thinking": { input: 0.035, output: 0.138 },  // Budget: Qwen VL
  "llama-3.3-nemotron-super-49b": { input: 0.1, output: 0.4 }, // Budget: NVIDIA
  "deepseek-v3.2-exp": { input: 0.27, output: 0.4 },        // Budget: DeepSeek
  "grok-4-fast": { input: 0.2, output: 0.5 },               // Budget: xAI Grok
  "kimi-k2-thinking": { input: 0.5, output: 2.5 },          // Budget: Kimi
  "llama-3.3-70b": { input: 0.35, output: 0.4 },            // Budget: Meta

  // Deprecated
  "gemini-flash-lite": { input: 0.05, output: 0.2 },        // DEPRECATED
  "gemini-flash": { input: 0.1, output: 0.4 },              // DEPRECATED
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
  // ============================================
  // BIG 4 GATEKEEPERS (Latest Flagship Models ONLY)
  // ============================================

  // Anthropic Claude (Direct API) - Big 4 Gatekeeper #1
  | "claude-opus-4.5"             // Flagship: Latest Opus (Nov 2024) with Extended Thinking
  | "claude-opus-4.1"             // Flagship: Extended Thinking, best reasoning
  | "claude-sonnet-4.5"           // Flagship: Balanced performance
  | "claude-haiku-4.5"            // Flagship: Fast responses

  // OpenAI ChatGPT (via OpenRouter) - Big 4 Gatekeeper #2
  | "gpt-5.1"                     // Flagship: Latest GPT-5 full model
  | "gpt-5-mini"                  // Flagship: GPT-5 mini variant

  // Google Gemini (via OpenRouter) - Big 4 Gatekeeper #3
  | "gemini-3.0-pro"              // Flagship: Advanced reasoning ($2/$12)
  | "gemini-2.5-flash-image"      // Flagship: "Nano Banana" image generation

  // Perplexity (via OpenRouter) - Big 4 Gatekeeper #4
  | "perplexity-sonar"            // Flagship: Sonar model

  // ============================================
  // SUB-AGENTS (Earlier/Lower Models - Preprocessing Only)
  // ============================================

  // Google Gemini Sub-Agents (Preprocessing/Low-tier tasks)
  | "gemini-2.0-flash-lite"       // Sub-agent: Ultra-cheap ($0.075/$0.30)
  | "gemini-2.0-flash"            // Sub-agent: Balanced ($0.10/$0.40)

  // ============================================
  // FREE MODELS (Preprocessing/Heavy Lifting ONLY)
  // ============================================

  // FREE Models (OpenRouter)
  | "sherlock-think-alpha"        // FREE: Reasoning, 1.8M context
  | "sherlock-dash-alpha"         // FREE: Fast, 1.8M context
  | "kat-coder-pro-free"          // FREE: Coding specialist, 256K context
  | "gemma-3n-e2b-it-free"        // FREE: Google DeepMind, 8K context
  | "mai-ds-r1-free"              // FREE: Microsoft reasoning, 163K context

  // ============================================
  // BUDGET MODELS (Preprocessing/Sub-Agent Tasks)
  // ============================================

  // Budget OpenRouter Models
  | "qwen3-vl-8b-thinking"        // Budget: Qwen VL reasoning ($0.035/$0.138)
  | "llama-3.3-nemotron-super-49b" // Budget: NVIDIA balanced ($0.10/$0.40)
  | "deepseek-v3.2-exp"           // Budget: DeepSeek sparse ($0.27/$0.40)
  | "grok-4-fast"                 // Budget: xAI multimodal ($0.20/$0.50)
  | "kimi-k2-thinking"            // Budget: Reasoning ($0.50/$2.50)
  | "llama-3.3-70b"               // Budget: Meta instruct ($0.35/$0.40)

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
      // Big 4 Flagship Models
      "claude-opus-4.5",
      "claude-opus-4.1",
      "claude-sonnet-4.5",
      "claude-haiku-4.5",
      "gpt-5.1",
      "gpt-5-mini",
      "gemini-3.0-pro",
      "gemini-2.5-flash-image",
      "perplexity-sonar",
    ];

    if (freeModels.includes(model)) {
return "free";
}
    if (premiumModels.includes(model)) {
return "premium";
}
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

      // Premium tasks → Claude Opus 4.5 (Big 4 flagship gatekeeper - LATEST)
      generate_content: "claude-opus-4.5",

      // Ultra-premium tasks → Claude Sonnet 4.5 (Big 4 flagship gatekeeper)
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
        reasoning: "claude-opus-4.5",
        fast: "claude-sonnet-4.5",
        coding: "gemini-3.0-pro",
        multimodal: "gemini-2.5-flash-image",
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

    // OpenRouter models (Big 4 Gatekeepers, FREE models, Gemini, etc.)
    if (
      [
        // Big 4 Flagship Models (via OpenRouter)
        "gpt-5.1",
        "gpt-5-mini",
        "gemini-3.0-pro",
        "gemini-2.5-flash-image",
        "perplexity-sonar",
        // Sub-Agents (Gemini 2.0)
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
        // FREE Models
        "sherlock-think-alpha",
        "sherlock-dash-alpha",
        "kat-coder-pro-free",
        "gemma-3n-e2b-it-free",
        "mai-ds-r1-free",
        // Budget Models
        "qwen3-vl-8b-thinking",
        "llama-3.3-nemotron-super-49b",
        "deepseek-v3.2-exp",
        "grok-4-fast",
        "kimi-k2-thinking",
        "llama-3.3-70b",
        // Legacy
        "gemini-flash-lite",
        "gemini-flash",
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
      "claude-opus-4.5": "claude-opus-4-5-20251101",
      "claude-opus-4.1": "claude-opus-4-5-20251101",
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

    // Enable Extended Thinking for Opus models if requested
    if ((model === "claude-opus-4.5" || model === "claude-opus-4.1") && options.thinkingBudget) {
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
      // ============================================
      // BIG 4 FLAGSHIP MODELS (via OpenRouter)
      // ============================================

      // OpenAI ChatGPT (Big 4 Gatekeeper #2)
      "gpt-5.1": "openai/gpt-5",
      "gpt-5-mini": "openai/gpt-5-mini",

      // Google Gemini (Big 4 Gatekeeper #3)
      "gemini-3.0-pro": "google/gemini-3-pro-preview",
      "gemini-2.5-flash-image": "google/gemini-2.5-flash-image-preview",

      // Perplexity (Big 4 Gatekeeper #4)
      "perplexity-sonar": "perplexity/sonar",

      // ============================================
      // SUB-AGENTS (Gemini 2.0)
      // ============================================

      "gemini-2.0-flash-lite": "google/gemini-2.0-flash-lite",
      "gemini-2.0-flash": "google/gemini-2.0-flash",

      // ============================================
      // FREE MODELS (Preprocessing)
      // ============================================

      "sherlock-think-alpha": "openrouter/sherlock-think-alpha",
      "sherlock-dash-alpha": "openrouter/sherlock-dash-alpha",
      "kat-coder-pro-free": "kwaipilot/kat-coder-pro:free",
      "gemma-3n-e2b-it-free": "google/gemma-3n-e2b-it:free",
      "mai-ds-r1-free": "microsoft/mai-ds-r1:free",

      // ============================================
      // BUDGET MODELS (Preprocessing/Sub-Agents)
      // ============================================

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
    if (!costs) {
return 0;
}

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
 *   assignedModel: "claude-opus-4.1",
 *   thinkingBudget: 5000,
 * });
 */
export async function routeToModel(options: RouteOptions): Promise<ModelResponse> {
  const router = getModelRouter();
  return await router.route(options);
}
