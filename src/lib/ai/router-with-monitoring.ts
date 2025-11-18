/**
 * AI Router with Cost Monitoring & Budget Enforcement
 * Wraps model-router.ts with automatic usage tracking
 */

import { routeToModel, type RouteOptions, type ModelResponse } from '../agents/model-router';
import { logAIUsage, enforceAIBudget, type UsageLog } from './cost-monitor';

export interface EnhancedRouteOptions extends RouteOptions {
  workspaceId: string;
  userId?: string;
  skipBudgetCheck?: boolean; // For admin operations
}

export interface EnhancedModelResponse extends ModelResponse {
  logId: string | null;
  budgetStatus: {
    spent_usd: number;
    limit_usd: number;
    remaining_usd: number;
    percentage_used: number;
  } | null;
}

/**
 * Route AI request with automatic cost tracking and budget enforcement
 *
 * @example
 * const result = await routeWithMonitoring({
 *   task: 'extract_intent',
 *   prompt: 'What is the intent of this email?',
 *   workspaceId: 'workspace-uuid',
 *   userId: 'user-uuid',
 * });
 */
export async function routeWithMonitoring(
  options: EnhancedRouteOptions
): Promise<EnhancedModelResponse> {
  const { workspaceId, userId, skipBudgetCheck, ...routeOptions } = options;

  // 1. Check budget before making request (unless skipped)
  let budgetStatus = null;
  if (!skipBudgetCheck) {
    try {
      const { allowed, status } = await enforceAIBudget(workspaceId);
      budgetStatus = status;

      if (!allowed) {
        throw new Error(
          `AI budget exceeded: $${status.spent_usd.toFixed(2)} / $${status.limit_usd.toFixed(2)}`
        );
      }
    } catch (error) {
      // If budget check fails, log warning but continue (fail open)
      console.warn('⚠️  Budget check failed:', error);
    }
  }

  // 2. Make AI request
  const startTime = Date.now();
  let response: ModelResponse;
  let success = true;
  let errorMessage: string | undefined;

  try {
    response = await routeToModel(routeOptions);
  } catch (error: any) {
    success = false;
    errorMessage = error.message;
    throw error;
  } finally {
    // 3. Log usage (even if request failed, for audit trail)
    const latencyMs = Date.now() - startTime;

    // Determine provider from model
    const provider = getProviderFromModel(response?.model || options.assignedModel || 'unknown');

    const usageLog: UsageLog = {
      workspace_id: workspaceId,
      user_id: userId,
      provider,
      model_id: response?.model || options.assignedModel || 'unknown',
      task_type: options.task,
      tokens_input: response?.tokensUsed?.input || 0,
      tokens_output: response?.tokensUsed?.output || 0,
      cost_usd: response?.costEstimate || 0,
      latency_ms: latencyMs,
      success,
      error_message: errorMessage,
      metadata: {
        assigned_model: options.assignedModel,
        preferred_model: options.preferredModel,
        thinking_budget: options.thinkingBudget,
      },
    };

    const logId = await logAIUsage(usageLog);

    return {
      ...response!,
      logId,
      budgetStatus,
    };
  }
}

/**
 * Batch route multiple requests with shared budget check
 */
export async function batchRouteWithMonitoring(
  requests: EnhancedRouteOptions[]
): Promise<EnhancedModelResponse[]> {
  // Group by workspace for efficient budget checking
  const workspaceIds = [...new Set(requests.map((r) => r.workspaceId))];

  // Check budget for all workspaces upfront
  for (const workspaceId of workspaceIds) {
    await enforceAIBudget(workspaceId);
  }

  // Process all requests in parallel
  const results = await Promise.allSettled(
    requests.map((request) => routeWithMonitoring({ ...request, skipBudgetCheck: true }))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`Request ${index} failed:`, result.reason);
      throw result.reason;
    }
  });
}

/**
 * Determine provider from model name
 */
function getProviderFromModel(
  model: string
): "openrouter" | "anthropic_direct" | "google_direct" | "openai_direct" {
  if (model.startsWith("claude-")) {
    return "anthropic_direct";
  }
  if (model.startsWith("gemini-") || model.startsWith("sherlock-") || model.startsWith("llama-")) {
    return "openrouter";
  }
  if (model.startsWith("gpt-")) {
    return "openai_direct";
  }
  if (model.includes("google") || model.includes("gemini")) {
    return "google_direct";
  }
  return "openrouter"; // Default to OpenRouter
}

/**
 * Quick helper for common task types
 */
export const aiRouter = {
  /**
   * Extract intent from text (ultra-cheap)
   */
  extractIntent: async (workspaceId: string, text: string, userId?: string) => {
    return routeWithMonitoring({
      task: "extract_intent",
      prompt: `Extract the intent from this text:\n\n${text}`,
      workspaceId,
      userId,
    });
  },

  /**
   * Generate tags for content (ultra-cheap)
   */
  generateTags: async (workspaceId: string, content: string, userId?: string) => {
    return routeWithMonitoring({
      task: "tag_generation",
      prompt: `Generate tags for this content:\n\n${content}`,
      workspaceId,
      userId,
    });
  },

  /**
   * Analyze sentiment (ultra-cheap)
   */
  analyzeSentiment: async (workspaceId: string, text: string, userId?: string) => {
    return routeWithMonitoring({
      task: "sentiment_analysis",
      prompt: `Analyze the sentiment of this text:\n\n${text}`,
      workspaceId,
      userId,
    });
  },

  /**
   * Process email intelligence (budget)
   */
  processEmail: async (workspaceId: string, email: any, userId?: string) => {
    return routeWithMonitoring({
      task: "email_intelligence",
      prompt: `Analyze this email:\n${JSON.stringify(email, null, 2)}`,
      workspaceId,
      userId,
    });
  },

  /**
   * Score contact (budget)
   */
  scoreContact: async (workspaceId: string, contact: any, userId?: string) => {
    return routeWithMonitoring({
      task: "contact_scoring",
      prompt: `Score this contact:\n${JSON.stringify(contact, null, 2)}`,
      workspaceId,
      userId,
    });
  },

  /**
   * Generate persona (standard)
   */
  generatePersona: async (workspaceId: string, data: any, userId?: string) => {
    return routeWithMonitoring({
      task: "generate_persona",
      prompt: `Generate a persona based on:\n${JSON.stringify(data, null, 2)}`,
      workspaceId,
      userId,
    });
  },

  /**
   * Generate strategy (standard)
   */
  generateStrategy: async (workspaceId: string, context: string, userId?: string) => {
    return routeWithMonitoring({
      task: "generate_strategy",
      prompt: `Generate a strategy:\n\n${context}`,
      workspaceId,
      userId,
    });
  },

  /**
   * Generate content with Extended Thinking (premium)
   */
  generateContent: async (
    workspaceId: string,
    prompt: string,
    userId?: string,
    thinkingBudget: number = 5000
  ) => {
    return routeWithMonitoring({
      task: "generate_content",
      prompt,
      workspaceId,
      userId,
      assignedModel: "claude-opus-4",
      thinkingBudget,
    });
  },

  /**
   * Security audit with large context (ultra-premium)
   */
  securityAudit: async (
    workspaceId: string,
    codebase: string,
    focusAreas?: string[],
    userId?: string
  ) => {
    return routeWithMonitoring({
      task: "security_audit",
      prompt: `Security audit${focusAreas ? ` focusing on: ${focusAreas.join(", ")}` : ""}`,
      context: codebase,
      workspaceId,
      userId,
    });
  },
};

/**
 * Export everything from model-router for convenience
 */
export * from '../agents/model-router';
