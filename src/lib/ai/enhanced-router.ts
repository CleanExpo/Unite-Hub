/**
 * Enhanced AI Router with Multi-Provider Intelligence
 *
 * Routes AI requests to the optimal provider based on:
 * 1. Task source (Gmail → Gemini 3, generic → OpenRouter)
 * 2. Feature requirements (Extended Thinking → Anthropic)
 * 3. Cost optimization (70-80% savings target)
 * 4. Daily budget constraints
 *
 * Routing Priority:
 * - Gemini 3: Gmail/Google Workspace tasks (20% of traffic)
 * - OpenRouter: Standard AI operations (70% of traffic)
 * - Anthropic Direct: Extended Thinking, Caching (10% of traffic)
 *
 * See:
 * - docs/GEMINI_3_INTEGRATION_STRATEGY.md
 * - docs/OPENROUTER_FIRST_STRATEGY.md
 */

import { callGemini3, checkGeminiDailyBudget, type ThinkingLevel } from '@/lib/google/gemini-client';
import Anthropic from "@anthropic-ai/sdk";
import { callAnthropicWithRetry, checkAnthropicAvailability } from "@/lib/anthropic/rate-limiter";
import { getAnthropicClient, isAnthropicAvailable } from '@/lib/anthropic/client';
import { ANTHROPIC_MODELS } from '@/lib/anthropic/models';
import OpenAI from 'openai';
import { getSupabaseAdmin } from '@/lib/supabase';

// OpenRouter client
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://unite-hub.com.au",
    "X-Title": "Unite-Hub AI",
  }
});

// Helper function to get Anthropic client (with fallback handling)
function getAnthropicClientSafe(): Anthropic | null {
  try {
    if (!isAnthropicAvailable()) {
      console.warn('⚠️ Anthropic unavailable (circuit breaker or not configured)');
      return null;
    }
    return getAnthropicClient();
  } catch (error) {
    console.error('❌ Failed to get Anthropic client:', error);
    return null;
  }
}

export type AIProvider = 'gemini' | 'openrouter' | 'anthropic_direct';
export type TaskSource = 'gmail' | 'calendar' | 'drive' | 'generic';
export type TaskComplexity = 'quick' | 'standard' | 'complex';

export interface EnhancedRouterOptions {
  taskType: TaskComplexity;
  prompt: string;
  systemPrompt?: string;
  source?: TaskSource;
  requiresExtendedThinking?: boolean;
  requiresCaching?: boolean;
  hasPDF?: boolean;
  hasImages?: boolean;
  maxTokens?: number;
  workspaceId?: string;
  attachments?: Array<{ mimeType: string; data: string }>;
}

export interface AIResponse {
  result: string;
  provider: AIProvider;
  cost: number;
  tokens: {
    input: number;
    output: number;
  };
  latency: number;
  modelId: string;
}

/**
 * Intelligently route AI request to optimal provider
 *
 * @example
 * // Gmail email classification
 * const response = await enhancedRouteAI({
 *   taskType: 'quick',
 *   source: 'gmail',
 *   prompt: 'Classify this email intent...'
 * });
 * // Routes to: Gemini 3 (low thinking, $0.002/request)
 *
 * @example
 * // Complex analysis with Extended Thinking
 * const response = await enhancedRouteAI({
 *   taskType: 'complex',
 *   requiresExtendedThinking: true,
 *   prompt: 'Analyze this strategic business plan...'
 * });
 * // Routes to: Anthropic Direct (Opus 4 + thinking)
 *
 * @example
 * // Standard content generation
 * const response = await enhancedRouteAI({
 *   taskType: 'standard',
 *   prompt: 'Generate personalized email...'
 * });
 * // Routes to: OpenRouter (Claude 3.5 Sonnet, $0.003/request)
 */
export async function enhancedRouteAI(options: EnhancedRouterOptions): Promise<AIResponse> {
  const {
    taskType,
    prompt,
    systemPrompt,
    source = 'generic',
    requiresExtendedThinking = false,
    requiresCaching = false,
    hasPDF = false,
    hasImages = false,
    maxTokens = 2048,
    workspaceId,
    attachments = []
  } = options;

  const startTime = Date.now();

  try {
    // Decision 1: Gemini 3 for Google ecosystem tasks
    if (source === 'gmail' || source === 'calendar' || source === 'drive') {
      console.log('🔀 Routing to Gemini 3 (Google ecosystem task)');

      // Check budget before calling Gemini
      const budgetStatus = await checkGeminiDailyBudget();
      if (budgetStatus.budgetExceeded) {
        console.warn('⚠️ Gemini budget exceeded, falling back to OpenRouter');
        return await routeToOpenRouter({ taskType, prompt, systemPrompt, maxTokens, workspaceId });
      }

      // Determine thinking level based on task complexity
      const thinkingLevel: ThinkingLevel = taskType === 'complex' ? 'high' : 'low';

      // Determine media resolution for PDFs/images
      let mediaResolution: any = undefined;
      if (hasPDF) {
        mediaResolution = 'media_resolution_medium'; // Optimal for PDFs (560 tokens)
      } else if (hasImages) {
        mediaResolution = 'media_resolution_high'; // High quality for images (1120 tokens)
      }

      const response = await callGemini3({
        prompt,
        systemPrompt,
        thinkingLevel,
        mediaResolution,
        maxTokens,
        attachments,
        workspaceId
      });

      return {
        result: response.text,
        provider: 'gemini',
        cost: response.cost,
        tokens: {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens
        },
        latency: Date.now() - startTime,
        modelId: response.modelId
      };
    }

    // Decision 2: Direct Anthropic for advanced features (with fallback)
    if (requiresExtendedThinking || requiresCaching) {
      console.log('🔀 Routing to Anthropic Direct (advanced features)');
      
      // Check if Anthropic is available
      const anthropicClient = getAnthropicClientSafe();
      if (!anthropicClient) {
        console.warn('⚠️ Anthropic unavailable, falling back to OpenRouter');
        return await routeToOpenRouter({ taskType, prompt, systemPrompt, maxTokens, workspaceId });
      }

      try {
        return await routeToAnthropic({
          taskType,
          prompt,
          systemPrompt,
          requiresExtendedThinking,
          requiresCaching,
          maxTokens,
          workspaceId
        });
      } catch (error) {
        console.error('❌ Anthropic failed, falling back to OpenRouter:', error);
        return await routeToOpenRouter({ taskType, prompt, systemPrompt, maxTokens, workspaceId });
      }
    }

    // Decision 3: OpenRouter for cost optimization (default)
    console.log('🔀 Routing to OpenRouter (cost optimization)');
    return await routeToOpenRouter({ taskType, prompt, systemPrompt, maxTokens, workspaceId });

  } catch (error: any) {
    console.error('Enhanced routing error:', error);

    // Fallback to OpenRouter on error
    console.warn('⚠️ Falling back to OpenRouter due to error');
    return await routeToOpenRouter({ taskType, prompt, systemPrompt, maxTokens, workspaceId });
  }
}

/**
 * Route to OpenRouter (70% of traffic)
 * Cost-effective for standard AI operations
 */
async function routeToOpenRouter(params: {
  taskType: TaskComplexity;
  prompt: string;
  systemPrompt?: string;
  maxTokens: number;
  workspaceId?: string;
}): Promise<AIResponse> {
  const { taskType, prompt, systemPrompt, maxTokens, workspaceId } = params;

  const modelMap = {
    quick: "anthropic/claude-haiku-4-5",         // $0.8/$4 per MTok
    standard: "anthropic/claude-sonnet-4-5",     // $3/$15 per MTok
    complex: "anthropic/claude-opus-4-5",        // $15/$75 per MTok
  };

  const modelId = modelMap[taskType];
  const startTime = Date.now();

  try {
    const response = await openrouter.chat.completions.create({
      model: modelId,
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt }
      ],
      max_tokens: maxTokens,
    });

    const latency = Date.now() - startTime;

    const usage = {
      input: response.usage?.prompt_tokens || 0,
      output: response.usage?.completion_tokens || 0
    };

    const cost = calculateOpenRouterCost(modelId, usage);

    // Track usage
    await trackUsage({
      provider: 'openrouter',
      model: modelId,
      workspaceId,
      tokensInput: usage.input,
      tokensOutput: usage.output,
      cost,
      latency,
      success: true
    });

    return {
      result: response.choices[0].message.content || '',
      provider: 'openrouter',
      cost,
      tokens: usage,
      latency,
      modelId
    };
  } catch (error: any) {
    await trackUsage({
      provider: 'openrouter',
      model: modelId,
      workspaceId,
      tokensInput: 0,
      tokensOutput: 0,
      cost: 0,
      latency: Date.now() - startTime,
      success: false,
      errorMessage: error.message
    });

    throw error;
  }
}

/**
 * Route to Anthropic Direct (10% of traffic)
 * For Extended Thinking and Prompt Caching
 */
async function routeToAnthropic(params: {
  taskType: TaskComplexity;
  prompt: string;
  systemPrompt?: string;
  requiresExtendedThinking: boolean;
  requiresCaching: boolean;
  maxTokens: number;
  workspaceId?: string;
}): Promise<AIResponse> {
  const { taskType, prompt, systemPrompt, requiresExtendedThinking, requiresCaching, maxTokens, workspaceId } = params;

  // Get Anthropic client safely
  const anthropic = getAnthropicClientSafe();
  if (!anthropic) {
    throw new Error('Anthropic client not available');
  }

  // Model selection using constants
  let modelId: string;
  if (requiresExtendedThinking) {
    modelId = ANTHROPIC_MODELS.OPUS_4_5; // Latest Opus - Best for deep thinking
  } else {
    modelId = ANTHROPIC_MODELS.SONNET_4_5; // Best for standard + caching
  }

  const startTime = Date.now();

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
      model: modelId,
      max_tokens: maxTokens,
      ...(requiresExtendedThinking && {
        thinking: {
          type: 'enabled' as const,
          budget_tokens: taskType === 'complex' ? 10000 : 5000,
        }
      }),
      ...(requiresCaching && systemPrompt && {
        system: [{
          type: 'text' as const,
          text: systemPrompt,
          cache_control: { type: 'ephemeral' as const }
        }]
      }),
      ...(!requiresCaching && systemPrompt && {
        system: systemPrompt
      }),
      messages: [
        { role: 'user' as const, content: prompt }
      ],
    })
    });

    const response = result.data;;

    const latency = Date.now() - startTime;

    const usage = {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens
    };

    const cost = calculateAnthropicCost(modelId, response.usage);

    // Track usage
    await trackUsage({
      provider: 'anthropic_direct',
      model: modelId,
      workspaceId,
      tokensInput: usage.input,
      tokensOutput: usage.output,
      cost,
      latency,
      success: true,
      metadata: {
        thinking_tokens: response.usage.thinking_tokens || 0,
        cache_read_tokens: response.usage.cache_read_input_tokens || 0,
        cache_creation_tokens: response.usage.cache_creation_input_tokens || 0
      }
    });

    // Extract text from response
    const text = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    return {
      result: text,
      provider: 'anthropic_direct',
      cost,
      tokens: usage,
      latency,
      modelId
    };
  } catch (error: any) {
    await trackUsage({
      provider: 'anthropic_direct',
      model: modelId,
      workspaceId,
      tokensInput: 0,
      tokensOutput: 0,
      cost: 0,
      latency: Date.now() - startTime,
      success: false,
      errorMessage: error.message
    });

    throw error;
  }
}

/**
 * Calculate OpenRouter cost based on model and usage
 */
function calculateOpenRouterCost(modelId: string, usage: { input: number; output: number }): number {
  const pricing: Record<string, { input: number; output: number }> = {
    "anthropic/claude-haiku-4-5": { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
    "anthropic/claude-sonnet-4-5": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
    "anthropic/claude-opus-4-5": { input: 15 / 1_000_000, output: 75 / 1_000_000 },
  };

  const rates = pricing[modelId] || pricing["anthropic/claude-sonnet-4-5"];
  return (usage.input * rates.input) + (usage.output * rates.output);
}

/**
 * Calculate Anthropic Direct cost
 */
function calculateAnthropicCost(modelId: string, usage: any): number {
  const pricing: Record<string, { input: number; output: number; thinking?: number }> = {
    "claude-opus-4-5-20251101": {
      input: 15 / 1_000_000,
      output: 75 / 1_000_000,
      thinking: 7.50 / 1_000_000 // Extended Thinking tokens
    },
    "claude-opus-4-5-20251101": {
      input: 15 / 1_000_000,
      output: 75 / 1_000_000,
      thinking: 7.50 / 1_000_000 // Extended Thinking tokens
    },
    "claude-sonnet-4-5-20250929": {
      input: 3 / 1_000_000,
      output: 15 / 1_000_000
    }
  };

  const rates = pricing[modelId] || pricing["claude-sonnet-4-5-20250929"];

  let cost = (usage.input_tokens * rates.input) + (usage.output_tokens * rates.output);

  // Add thinking token cost if applicable
  if (usage.thinking_tokens && rates.thinking) {
    cost += usage.thinking_tokens * rates.thinking;
  }

  return cost;
}

/**
 * Track usage in database for cost monitoring
 */
async function trackUsage(data: {
  provider: string;
  model: string;
  workspaceId?: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  latency: number;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}) {
  try {
    const supabase = getSupabaseAdmin();

    await supabase.from('ai_usage_logs').insert({
      provider: data.provider,
      model: data.model,
      workspace_id: data.workspaceId,
      tokens_input: data.tokensInput,
      tokens_output: data.tokensOutput,
      cost_usd: data.cost,
      latency_ms: data.latency,
      success: data.success,
      error_message: data.errorMessage,
      metadata: data.metadata,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to track usage:', error);
    // Don't throw - tracking failure shouldn't break the request
  }
}

/**
 * Get daily AI cost breakdown by provider
 */
export async function getDailyCostBreakdown(): Promise<{
  total: number;
  gemini: number;
  openrouter: number;
  anthropic: number;
  budget: number;
  percentageUsed: number;
}> {
  try {
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('provider, cost_usd')
      .gte('created_at', `${today}T00:00:00`);

    if (error) throw error;

    const costs = {
      gemini: 0,
      openrouter: 0,
      anthropic: 0
    };

    data?.forEach(row => {
      if (row.provider === 'google_gemini') {
        costs.gemini += row.cost_usd || 0;
      } else if (row.provider === 'openrouter') {
        costs.openrouter += row.cost_usd || 0;
      } else if (row.provider === 'anthropic_direct') {
        costs.anthropic += row.cost_usd || 0;
      }
    });

    const total = costs.gemini + costs.openrouter + costs.anthropic;
    const budget = parseFloat(process.env.AI_DAILY_BUDGET || '50');

    return {
      total,
      ...costs,
      budget,
      percentageUsed: (total / budget) * 100
    };
  } catch (error) {
    console.error('Failed to get cost breakdown:', error);
    return {
      total: 0,
      gemini: 0,
      openrouter: 0,
      anthropic: 0,
      budget: 50,
      percentageUsed: 0
    };
  }
}

export default {
  enhancedRouteAI,
  getDailyCostBreakdown
};
