/**
 * Unified LLM Provider Client
 *
 * Central client for all LLM calls (Claude, OpenAI, Gemini).
 * Handles:
 * - Provider routing (cost optimization)
 * - Extended Thinking for complex tasks
 * - Prompt caching for efficiency
 * - Rate limiting and retries
 * - Cost tracking and budgeting
 *
 * Architecture:
 * - Use Claude for most tasks (best quality/cost)
 * - Use Extended Thinking for complex analysis/strategy
 * - Implement caching to reduce token usage
 */

import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

// ============================================================================
// TYPES
// ============================================================================

export interface LLMRequest {
  model?: 'claude-sonnet' | 'claude-opus';
  systemPrompt: string;
  userMessage: string;
  useExtendedThinking?: boolean;
  thinkingBudget?: number;
  maxTokens?: number;
  temperature?: number;
  tools?: Anthropic.Tool[];
}

export interface LLMResponse {
  content: string;
  thinkingContent?: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  cacheHitTokens?: number;
  model: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODEL_CONFIGS = {
  'claude-sonnet': {
    id: 'claude-sonnet-4-5-20250929',
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
    maxTokens: 4096,
    supportsThinking: false,
  },
  'claude-opus': {
    id: 'claude-opus-4-1-20250805',
    costPer1kInputTokens: 0.015,
    costPer1kOutputTokens: 0.075,
    maxTokens: 8192,
    supportsThinking: true,
  },
};

const THINKING_TOKEN_COST = 0.000075; // $7.50 per 100k tokens

// ============================================================================
// MAIN CLIENT
// ============================================================================

export class LLMProviderClient {
  private anthropic: Anthropic;
  private costTracker: Map<string, number> = new Map();

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Execute LLM request with automatic routing and optimization
   */
  async executeRequest(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model || 'claude-sonnet';
    const config = MODEL_CONFIGS[model];

    if (!config) {
      throw new Error(`Unknown model: ${model}`);
    }

    // Prepare system prompt with caching if long
    const systemPrompts = [
      {
        type: 'text' as const,
        text: request.systemPrompt,
        cache_control: { type: 'ephemeral' as const },
      },
    ];

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: request.userMessage,
      },
    ];

    try {
      let response;

      if (request.useExtendedThinking && config.supportsThinking) {
        // Use Extended Thinking for complex tasks
        response = await callAnthropicWithRetry(async () => {
          return await this.anthropic.messages.create({
            model: config.id,
            max_tokens: request.maxTokens || 8192,
            thinking: {
              type: 'enabled',
              budget_tokens: request.thinkingBudget || 5000,
            },
            system: systemPrompts,
            messages,
          });
        });
      } else {
        // Standard request
        response = await callAnthropicWithRetry(async () => {
          return await this.anthropic.messages.create({
            model: config.id,
            max_tokens: request.maxTokens || config.maxTokens,
            temperature: request.temperature || 1,
            system: systemPrompts,
            messages,
            tools: request.tools,
          });
        });
      }

      // Extract content
      let content = '';
      let thinkingContent = '';

      for (const block of response.content) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'thinking') {
          thinkingContent += block.thinking;
        }
      }

      // Calculate costs
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const cacheReadTokens = (response.usage as any).cache_read_input_tokens || 0;
      const cacheCreationTokens = (response.usage as any).cache_creation_input_tokens || 0;

      let cost = 0;
      cost += (inputTokens / 1000) * config.costPer1kInputTokens;
      cost += (outputTokens / 1000) * config.costPer1kOutputTokens;

      // Thinking tokens cost
      if ((response.usage as any).thinking_tokens) {
        cost += ((response.usage as any).thinking_tokens / 100000) * 7.5;
      }

      // Cache reads cost less (90% cheaper)
      if (cacheReadTokens > 0) {
        cost -= (cacheReadTokens / 1000) * config.costPer1kInputTokens * 0.9;
      }

      // Track cost
      this.trackCost(model, cost);

      return {
        content,
        thinkingContent: thinkingContent || undefined,
        inputTokens,
        outputTokens,
        cost,
        cacheHitTokens: cacheReadTokens || undefined,
        model: config.id,
      };
    } catch (error) {
      console.error('LLM request failed:', error);
      throw error;
    }
  }

  /**
   * Content generation (blog posts, social media, emails)
   */
  async generateContent(
    contentType: string,
    topic: string,
    brandContext: Record<string, any>,
    count: number = 1
  ): Promise<LLMResponse> {
    const systemPrompt = `You are an expert ${contentType} writer creating content for ${brandContext.businessName}.

Brand Context:
- Tagline: ${brandContext.tagline}
- Value Proposition: ${brandContext.valueProposition}
- Target Audience: ${brandContext.targetAudience}
- Tone: ${brandContext.tone}
- Industry: ${brandContext.industry}

Create ${count} high-quality, engaging pieces of ${contentType} content optimized for the target audience.
Return JSON array with each piece having: title, body, cta, seoKeywords.`;

    const userMessage = `Create ${count} ${contentType} pieces about: ${topic}`;

    return this.executeRequest({
      model: 'claude-sonnet',
      systemPrompt,
      userMessage,
      maxTokens: Math.min(4000, 500 * count),
    });
  }

  /**
   * SEO research and keyword analysis
   */
  async researchSEO(
    domain: string,
    targetKeywords: string[],
    industry: string
  ): Promise<LLMResponse> {
    const systemPrompt = `You are an expert SEO strategist analyzing keywords and creating optimization strategy.

Focus on:
1. Keyword difficulty and search volume
2. Related keywords and semantic variations
3. Content recommendations
4. Technical SEO considerations
5. Competitive analysis frameworks

Return structured JSON with: primaryKeywords, secondaryKeywords, contentStrategy, technicalRecommendations.`;

    const userMessage = `Analyze SEO opportunities for ${domain} (${industry} industry) targeting: ${targetKeywords.join(', ')}`;

    return this.executeRequest({
      model: 'claude-sonnet',
      systemPrompt,
      userMessage,
      maxTokens: 3000,
    });
  }

  /**
   * Strategic analysis requiring deep thinking
   */
  async analyzeStrategy(
    businessContext: Record<string, any>,
    analysis: string
  ): Promise<LLMResponse> {
    const systemPrompt = `You are a strategic business advisor with deep expertise in marketing, growth, and operations.

Business Context:
${JSON.stringify(businessContext, null, 2)}

Provide deep, thoughtful analysis with actionable recommendations.`;

    return this.executeRequest({
      model: 'claude-opus',
      systemPrompt,
      userMessage: analysis,
      useExtendedThinking: true,
      thinkingBudget: 8000,
      maxTokens: 3000,
    });
  }

  /**
   * Email sequence generation
   */
  async generateEmailSequence(
    type: string,
    count: number,
    brandContext: Record<string, any>
  ): Promise<LLMResponse> {
    const systemPrompt = `You are an expert email copywriter creating a ${type} sequence.

Brand Voice: ${brandContext.tone}
Industry: ${brandContext.industry}
Target Audience: ${brandContext.targetAudience}

Create an engaging sequence that builds relationship and drives action.
Return JSON array with each email having: subject, preview, body, cta.`;

    const userMessage = `Create a ${count}-email ${type} sequence for ${brandContext.businessName}`;

    return this.executeRequest({
      model: 'claude-sonnet',
      systemPrompt,
      userMessage,
      maxTokens: Math.min(4000, 800 * count),
    });
  }

  /**
   * Analytics and insights
   */
  async analyzeMetrics(metrics: Record<string, any>, focus: string): Promise<LLMResponse> {
    const systemPrompt = `You are a data analyst expert at turning metrics into actionable insights.

Analyze the provided metrics and deliver:
1. Key performance indicators summary
2. Trends and patterns
3. Optimization opportunities
4. Recommended actions

Return JSON with: summary, trends, opportunities, recommendations.`;

    const userMessage = `Analyze these metrics for ${focus}:

${JSON.stringify(metrics, null, 2)}`;

    return this.executeRequest({
      model: 'claude-sonnet',
      systemPrompt,
      userMessage,
      maxTokens: 2000,
    });
  }

  /**
   * Get cost tracking for tenant
   */
  getCostTracking(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of this.costTracker) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Reset cost tracking (daily)
   */
  resetCostTracking() {
    this.costTracker.clear();
  }

  // Private methods

  private trackCost(model: string, cost: number) {
    const current = this.costTracker.get(model) || 0;
    this.costTracker.set(model, current + cost);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let clientInstance: LLMProviderClient | null = null;

export function getLLMClient(): LLMProviderClient {
  if (!clientInstance) {
    clientInstance = new LLMProviderClient();
  }
  return clientInstance;
}
