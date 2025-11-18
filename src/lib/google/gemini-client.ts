/**
 * Google Gemini 3 Pro Client
 *
 * Provides intelligent routing to Gemini 3 for Gmail/Google Workspace integration.
 * Use this client for:
 * - Gmail email intelligence extraction
 * - Google Calendar event processing
 * - Google Drive PDF/document analysis
 * - Complex multimodal tasks (images, PDFs, videos)
 *
 * Cost: $2/MTok input, $12/MTok output (<200K tokens)
 *       $4/MTok input, $18/MTok output (>200K tokens)
 *
 * See: docs/GEMINI_3_INTEGRATION_STRATEGY.md
 */

import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdmin } from '@/lib/supabase';

// Initialize Gemini client with v1alpha for media_resolution support
export const geminiClient = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || '',
  apiVersion: "v1alpha" // Required for media_resolution parameter
});

export type ThinkingLevel = 'low' | 'high';
export type MediaResolution = 'media_resolution_low' | 'media_resolution_medium' | 'media_resolution_high';

export interface GeminiOptions {
  prompt: string;
  systemPrompt?: string;
  thinkingLevel?: ThinkingLevel;
  mediaResolution?: MediaResolution;
  maxTokens?: number;
  attachments?: Array<{
    mimeType: string;
    data: string; // Base64 encoded
  }>;
  temperature?: number; // Keep at 1.0 for Gemini 3 (default)
  workspaceId?: string; // For cost tracking
}

export interface GeminiResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number; // USD
  thinkingLevel: ThinkingLevel;
  modelId: string;
}

/**
 * Call Gemini 3 Pro with intelligent defaults
 *
 * @example
 * // Email classification (low thinking, fast)
 * const result = await callGemini3({
 *   prompt: 'Classify this email intent: ...',
 *   thinkingLevel: 'low',
 *   maxTokens: 512
 * });
 *
 * @example
 * // PDF analysis (high thinking, medium resolution)
 * const result = await callGemini3({
 *   prompt: 'Analyze this contract and extract key terms',
 *   thinkingLevel: 'high',
 *   mediaResolution: 'media_resolution_medium',
 *   attachments: [{ mimeType: 'application/pdf', data: base64Pdf }],
 *   maxTokens: 4096
 * });
 */
export async function callGemini3(options: GeminiOptions): Promise<GeminiResponse> {
  const {
    prompt,
    systemPrompt,
    thinkingLevel = 'low',
    mediaResolution,
    maxTokens = 2048,
    attachments = [],
    temperature = 1.0, // CRITICAL: Keep at 1.0 for Gemini 3
    workspaceId
  } = options;

  // Validate API key
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not configured in environment variables');
  }

  // Build content parts
  const parts: any[] = [
    { text: prompt }
  ];

  // Add attachments with media resolution
  if (attachments.length > 0) {
    for (const attachment of attachments) {
      const part: any = {
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      };

      // Add media resolution if specified
      if (mediaResolution) {
        part.mediaResolution = {
          level: mediaResolution
        };
      }

      parts.push(part);
    }
  }

  const startTime = Date.now();

  try {
    // Generate content with Gemini 3 Pro
    const response = await geminiClient.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{
        parts
      }],
      config: {
        systemInstruction: systemPrompt ? {
          parts: [{ text: systemPrompt }]
        } : undefined,
        thinkingLevel,
        maxOutputTokens: maxTokens,
        temperature // Keep at 1.0 - DO NOT change for Gemini 3
      }
    });

    const latency = Date.now() - startTime;

    // Extract usage statistics
    const usage = {
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      totalTokens: response.usage?.totalTokens || 0
    };

    // Calculate cost
    const cost = calculateGeminiCost(usage);

    // Track usage in database
    await trackGeminiUsage({
      provider: 'google_gemini',
      model: 'gemini-3-pro-preview',
      workspaceId,
      thinkingLevel,
      mediaResolution,
      tokensInput: usage.promptTokens,
      tokensOutput: usage.completionTokens,
      cost,
      latency,
      success: true
    });

    return {
      text: response.text || '',
      usage,
      cost,
      thinkingLevel,
      modelId: 'gemini-3-pro-preview'
    };
  } catch (error: any) {
    // Track failed request
    await trackGeminiUsage({
      provider: 'google_gemini',
      model: 'gemini-3-pro-preview',
      workspaceId,
      thinkingLevel,
      mediaResolution,
      tokensInput: 0,
      tokensOutput: 0,
      cost: 0,
      latency: Date.now() - startTime,
      success: false,
      errorMessage: error.message
    });

    console.error('Gemini 3 API error:', error);
    throw new Error(`Gemini 3 API call failed: ${error.message}`);
  }
}

/**
 * Calculate cost for Gemini 3 Pro usage
 *
 * Pricing:
 * - <200K tokens: $2/MTok input, $12/MTok output
 * - >200K tokens: $4/MTok input, $18/MTok output
 */
export function calculateGeminiCost(usage: {
  promptTokens: number;
  completionTokens: number;
}): number {
  const { promptTokens, completionTokens } = usage;
  const totalTokens = promptTokens + completionTokens;

  // Determine pricing tier
  const isHighVolume = totalTokens > 200000;

  const inputRate = isHighVolume ? 4 / 1_000_000 : 2 / 1_000_000;
  const outputRate = isHighVolume ? 18 / 1_000_000 : 12 / 1_000_000;

  const inputCost = promptTokens * inputRate;
  const outputCost = completionTokens * outputRate;

  return inputCost + outputCost;
}

/**
 * Track Gemini usage in database for cost monitoring
 */
async function trackGeminiUsage(data: {
  provider: string;
  model: string;
  workspaceId?: string;
  thinkingLevel: ThinkingLevel;
  mediaResolution?: MediaResolution;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  latency: number;
  success: boolean;
  errorMessage?: string;
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
      metadata: {
        thinking_level: data.thinkingLevel,
        media_resolution: data.mediaResolution
      },
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to track Gemini usage:', error);
    // Don't throw - tracking failure shouldn't break the request
  }
}

/**
 * Check if daily Gemini budget has been exceeded
 * Returns fallback strategy if budget exceeded
 */
export async function checkGeminiDailyBudget(): Promise<{
  budgetExceeded: boolean;
  remainingBudget?: number;
  fallbackTo?: 'openrouter' | 'anthropic';
}> {
  try {
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('cost_usd')
      .eq('provider', 'google_gemini')
      .gte('created_at', `${today}T00:00:00`);

    if (error) throw error;

    const todayCost = data?.reduce((sum, row) => sum + (row.cost_usd || 0), 0) || 0;
    const GEMINI_DAILY_BUDGET = parseFloat(process.env.GEMINI_DAILY_BUDGET || '20');

    // Alert at 80% threshold
    if (todayCost >= GEMINI_DAILY_BUDGET * 0.8 && todayCost < GEMINI_DAILY_BUDGET) {
      console.warn(`⚠️ Gemini budget at ${(todayCost / GEMINI_DAILY_BUDGET * 100).toFixed(1)}% (${todayCost.toFixed(2)}/${GEMINI_DAILY_BUDGET})`);
    }

    // Hard stop at 100%
    if (todayCost >= GEMINI_DAILY_BUDGET) {
      console.error(`🚫 Gemini daily budget exceeded: ${todayCost.toFixed(2)}/${GEMINI_DAILY_BUDGET}`);
      return {
        budgetExceeded: true,
        fallbackTo: 'openrouter' // Fallback to cost-effective OpenRouter
      };
    }

    return {
      budgetExceeded: false,
      remainingBudget: GEMINI_DAILY_BUDGET - todayCost
    };
  } catch (error) {
    console.error('Failed to check Gemini budget:', error);
    return { budgetExceeded: false }; // Fail open
  }
}

/**
 * Thought Signatures handling for Gemini 3
 *
 * Note: Gemini 3 uses thought signatures differently than Claude.
 * This is a compatibility layer for multi-turn conversations.
 */
export interface ThoughtSignature {
  signature?: string;
  turn?: number;
}

/**
 * Handle thought signatures in multi-turn conversations
 * For function calling and sequential reasoning
 */
export function extractThoughtSignature(response: any): ThoughtSignature | null {
  // Gemini 3 may return thought signatures in response metadata
  const signature = response.thoughtSignature;

  if (!signature) return null;

  return {
    signature,
    turn: response.turn || 1
  };
}

/**
 * Prepare conversation history with thought signatures
 * Required for maintaining reasoning context across turns
 */
export function prepareConversationHistory(
  messages: Array<{ role: 'user' | 'model'; content: string; thoughtSignature?: string }>
): any[] {
  return messages.map(msg => {
    const parts: any[] = [{ text: msg.content }];

    // Add thought signature if present
    if (msg.thoughtSignature) {
      parts.push({
        thoughtSignature: msg.thoughtSignature
      });
    }

    return {
      role: msg.role,
      parts
    };
  });
}

export default {
  callGemini3,
  calculateGeminiCost,
  checkGeminiDailyBudget,
  extractThoughtSignature,
  prepareConversationHistory
};
