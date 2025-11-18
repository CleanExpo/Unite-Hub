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

// Model pricing (per 1M tokens)
const MODEL_COSTS = {
  // Anthropic
  "claude-opus-4": { input: 15, output: 75 },
  "claude-sonnet-4.5": { input: 3, output: 15 },
  "claude-haiku-4.5": { input: 0.8, output: 4 },

  // OpenRouter (via OPENROUTER_API_KEY)
  "gemini-flash-lite": { input: 0.05, output: 0.2 },
  "gemini-flash": { input: 0.1, output: 0.4 },
  "sherlock-think-alpha": { input: 1, output: 5 },
  "llama-3.3-70b": { input: 0.35, output: 0.4 },

  // Google Direct API (future - not implemented yet)
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-2.0-pro": { input: 1.25, output: 5 },
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
  | "gemini-flash-lite"
  | "gemini-flash"
  | "sherlock-think-alpha"
  | "llama-3.3-70b"
  | "gemini-2.0-flash"
  | "gemini-2.0-pro";

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

    // Auto-select based on task type (cheapest that works)
    const taskToModelMap: Record<TaskType, ModelName> = {
      // Ultra-cheap tasks → Gemini Flash Lite (OpenRouter)
      extract_intent: "gemini-flash-lite",
      tag_generation: "gemini-flash-lite",
      sentiment_analysis: "gemini-flash-lite",

      // Budget tasks → Claude Haiku
      email_intelligence: "claude-haiku-4.5",
      contact_scoring: "claude-haiku-4.5",

      // Standard tasks → Claude Sonnet
      generate_persona: "claude-sonnet-4.5",
      generate_strategy: "claude-sonnet-4.5",

      // Premium tasks → Claude Opus (with Extended Thinking)
      generate_content: "claude-opus-4",

      // Ultra-premium tasks → Sherlock Think Alpha (1.84M context)
      security_audit: "sherlock-think-alpha",
      codebase_analysis: "sherlock-think-alpha",
    };

    return taskToModelMap[task] || "claude-sonnet-4.5";
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

    // OpenRouter models
    if (
      ["gemini-flash-lite", "gemini-flash", "sherlock-think-alpha", "llama-3.3-70b"].includes(
        model
      )
    ) {
      return await this.callOpenRouter(model, fullPrompt, options, startTime);
    }

    // Google Direct API models (not implemented yet - future enhancement)
    if (model.startsWith("gemini-2.0-")) {
      throw new Error(`Google Direct API not implemented yet. Use OpenRouter variant instead.`);
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
      "gemini-flash-lite": "google/gemini-2.0-flash-lite",
      "gemini-flash": "google/gemini-2.0-flash",
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
