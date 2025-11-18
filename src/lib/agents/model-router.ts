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
  // Anthropic Claude (Direct API)
  "claude-opus-4": { input: 15, output: 75 },
  "claude-sonnet-4.5": { input: 3, output: 15 },
  "claude-haiku-4.5": { input: 0.8, output: 4 },

  // Google Gemini 2.0 (OpenRouter)
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.3 },  // BEST: Ultra-cheap, 25% cheaper than 1.5
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },          // BEST: Balanced, 1M context

  // Google Gemini 3.0 (OpenRouter)
  "gemini-3.0-pro": { input: 2, output: 12 },               // BEST: Advanced reasoning, beats GPT-4

  // Legacy Gemini 1.5 (deprecated - use 2.0 instead)
  "gemini-flash-lite": { input: 0.05, output: 0.2 },        // DEPRECATED: Use gemini-2.0-flash-lite
  "gemini-flash": { input: 0.1, output: 0.4 },              // DEPRECATED: Use gemini-2.0-flash

  // Other OpenRouter models
  "sherlock-think-alpha": { input: 1, output: 5 },
  "llama-3.3-70b": { input: 0.35, output: 0.4 },
};

export type TaskType =
  | "extract_intent"          // Ultra-cheap
  | "tag_generation"          // Ultra-cheap
  | "sentiment_analysis"      // Ultra-cheap
  | "email_intelligence"      // Budget
  | "contact_scoring"         // Budget
  | "generate_persona"        // Standard
  | "generate_strategy"       // Standard
  | "generate_content"        // Premium (Extended Thinking)
  | "security_audit"          // Ultra-premium
  | "codebase_analysis";      // Ultra-premium

export type ModelName =
  | "claude-opus-4"
  | "claude-sonnet-4.5"
  | "claude-haiku-4.5"
  | "gemini-2.0-flash-lite"       // BEST: Ultra-cheap ($0.075/$0.30)
  | "gemini-2.0-flash"            // BEST: Balanced ($0.10/$0.40)
  | "gemini-3.0-pro"              // BEST: Advanced reasoning ($2/$12)
  | "gemini-flash-lite"           // DEPRECATED
  | "gemini-flash"                // DEPRECATED
  | "sherlock-think-alpha"
  | "llama-3.3-70b";

export interface RouteOptions {
  task: TaskType;
  prompt: string;
  context?: string;
  assignedModel?: ModelName;        // Force specific model (highest priority)
  preferredModel?: ModelName;       // Preferred but not forced
  fallback?: ModelName;             // Fallback if preferred fails
  thinkingBudget?: number;          // Enable Extended Thinking (Opus only)
  maxTokens?: number;
  temperature?: number;
}

export interface ModelResponse {
  model: ModelName;
  response: string;
  reasoning?: string;               // For Extended Thinking
  tokensUsed: { input: number; output: number };
  costEstimate: number;
  latencyMs: number;
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
   * Select optimal model based on task type
   * Default to cheapest model that can successfully complete the task
   */
  private selectOptimalModel(task: TaskType, options: RouteOptions): ModelName {
    // Prefer user's preferred model if specified
    if (options.preferredModel) {
      return options.preferredModel;
    }

    // Auto-select BEST model for each task (optimized for cost + performance)
    const taskToModelMap: Record<TaskType, ModelName> = {
      // Ultra-cheap tasks → Gemini 2.0 Flash-Lite (BEST: 50% cheaper than Haiku)
      extract_intent: "gemini-2.0-flash-lite",
      tag_generation: "gemini-2.0-flash-lite",
      sentiment_analysis: "gemini-2.0-flash-lite",

      // Budget tasks → Gemini 2.0 Flash (BEST: 7x cheaper than Haiku, better multimodal)
      email_intelligence: "gemini-2.0-flash",
      contact_scoring: "gemini-2.0-flash",

      // Standard tasks → Gemini 3.0 Pro (BEST: Advanced reasoning, beats GPT-4)
      generate_persona: "gemini-3.0-pro",
      generate_strategy: "gemini-3.0-pro",

      // Premium tasks → Claude Opus (BEST: Extended Thinking for complex content)
      generate_content: "claude-opus-4",

      // Ultra-premium tasks → Gemini 3.0 Pro (BEST: 1M context + reasoning mode)
      security_audit: "gemini-3.0-pro",
      codebase_analysis: "gemini-3.0-pro",
    };

    return taskToModelMap[task] || "gemini-2.0-flash";
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

    // OpenRouter models (Gemini 2.0, Gemini 3.0, etc.)
    if (
      [
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
        "gemini-3.0-pro",
        "gemini-flash-lite",      // Legacy
        "gemini-flash",           // Legacy
        "sherlock-think-alpha",
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

    return {
      model,
      response,
      reasoning,
      tokensUsed,
      costEstimate,
      latencyMs: Date.now() - startTime,
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
      // Gemini 2.0 (BEST: Latest, optimized pricing)
      "gemini-2.0-flash-lite": "google/gemini-2.0-flash-lite",
      "gemini-2.0-flash": "google/gemini-2.0-flash",

      // Gemini 3.0 (BEST: Advanced reasoning)
      "gemini-3.0-pro": "google/gemini-3-pro-preview",

      // Legacy Gemini 1.5 (deprecated)
      "gemini-flash-lite": "google/gemini-flash-1.5",
      "gemini-flash": "google/gemini-flash-1.5",

      // Other models
      "sherlock-think-alpha": "openrouter/sherlock-think-alpha",
      "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct",
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

    return {
      model,
      response,
      tokensUsed,
      costEstimate,
      latencyMs: Date.now() - startTime,
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
