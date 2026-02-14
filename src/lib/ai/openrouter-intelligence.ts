/**
 * OpenRouter Multi-Model Intelligence System
 * Cost-optimized AI routing for marketing intelligence
 *
 * Model Selection Strategy:
 * - Claude 3.5 Sonnet: Creative content, brand voice
 * - GPT-4 Turbo: Pattern recognition, keyword research
 * - Gemini Pro 1.5: Large context analysis (1M tokens)
 * - Llama 3 70B: Bulk content generation
 * - Claude 3 Opus: Complex technical analysis
 */

export interface OpenRouterConfig {
  apiKey: string;
  baseURL: string;
  defaultModel: string;
  fallbackModels: string[];
}

export interface ModelPricing {
  prompt: number; // $ per million tokens
  completion: number; // $ per million tokens
}

export interface AITaskConfig {
  task: 'content' | 'seo' | 'analysis' | 'bulk' | 'technical' | 'visual';
  priority: 'cost' | 'quality' | 'speed';
  contextSize?: 'small' | 'medium' | 'large' | 'xlarge';
}

export class OpenRouterIntelligence {
  private config: OpenRouterConfig;
  private readonly MODEL_MAP: Record<string, { model: string; pricing: ModelPricing; maxTokens: number }> = {
    // Content generation (creative writing, social media)
    'content-quality': {
      model: 'anthropic/claude-sonnet-4-5',
      pricing: { prompt: 3, completion: 15 },
      maxTokens: 200000
    },
    'content-cost': {
      model: 'meta-llama/llama-3-70b-instruct',
      pricing: { prompt: 0.50, completion: 0.50 },
      maxTokens: 8000
    },

    // SEO & keyword research
    'seo-quality': {
      model: 'openai/gpt-4-turbo',
      pricing: { prompt: 10, completion: 30 },
      maxTokens: 128000
    },
    'seo-cost': {
      model: 'openai/gpt-3.5-turbo',
      pricing: { prompt: 0.50, completion: 1.50 },
      maxTokens: 16000
    },

    // Analysis & competitor intelligence
    'analysis-quality': {
      model: 'anthropic/claude-opus-4-5',
      pricing: { prompt: 15, completion: 75 },
      maxTokens: 200000
    },
    'analysis-large-context': {
      model: 'google/gemini-pro-1.5',
      pricing: { prompt: 1.25, completion: 5 },
      maxTokens: 1000000 // 1M token context!
    },

    // Bulk content generation
    'bulk-cost': {
      model: 'meta-llama/llama-3-70b-instruct',
      pricing: { prompt: 0.50, completion: 0.50 },
      maxTokens: 8000
    },

    // Technical SEO audits
    'technical-quality': {
      model: 'anthropic/claude-opus-4-5',
      pricing: { prompt: 15, completion: 75 },
      maxTokens: 200000
    },

    // Visual analysis (Pinterest, Instagram)
    'visual-quality': {
      model: 'openai/gpt-4-vision-preview',
      pricing: { prompt: 10, completion: 30 },
      maxTokens: 128000
    },

    // Fast, lightweight tasks
    'quick-cost': {
      model: 'anthropic/claude-haiku-4-5',
      pricing: { prompt: 0.80, completion: 4 },
      maxTokens: 200000
    }
  };

  constructor(apiKey?: string) {
    this.config = {
      apiKey: apiKey || process.env.OPENROUTER_API_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultModel: 'anthropic/claude-sonnet-4-5',
      fallbackModels: [
        'openai/gpt-4-turbo',
        'meta-llama/llama-3-70b-instruct'
      ]
    };

    if (!this.config.apiKey) {
      throw new Error('OPENROUTER_API_KEY is required');
    }
  }

  /**
   * Select optimal model based on task requirements
   */
  selectModel(taskConfig: AITaskConfig): string {
    const { task, priority, contextSize } = taskConfig;

    // Large context always uses Gemini
    if (contextSize === 'xlarge') {
      return this.MODEL_MAP['analysis-large-context'].model;
    }

    // Task-based selection with priority
    switch (task) {
      case 'content':
        return priority === 'cost'
          ? this.MODEL_MAP['content-cost'].model
          : this.MODEL_MAP['content-quality'].model;

      case 'seo':
        return priority === 'cost'
          ? this.MODEL_MAP['seo-cost'].model
          : this.MODEL_MAP['seo-quality'].model;

      case 'analysis':
        return this.MODEL_MAP['analysis-quality'].model;

      case 'bulk':
        return this.MODEL_MAP['bulk-cost'].model;

      case 'technical':
        return this.MODEL_MAP['technical-quality'].model;

      case 'visual':
        return this.MODEL_MAP['visual-quality'].model;

      default:
        return this.config.defaultModel;
    }
  }

  /**
   * Generate social media content
   */
  async generateSocialContent(params: {
    platform: 'youtube' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'x' | 'reddit' | 'pinterest';
    contentType: 'post' | 'caption' | 'description' | 'script' | 'hashtags';
    topic: string;
    brandVoice?: string;
    targetAudience?: string;
    keywords?: string[];
    // Cost tracking (optional)
    organizationId?: string;
    workspaceId?: string;
    clientId?: string;
  }): Promise<string> {
    const model = this.selectModel({ task: 'content', priority: 'quality' });

    const platformGuidelines = this.getPlatformGuidelines(params.platform, params.contentType);

    const prompt = `
You are an expert social media content creator for ${params.platform}.

Task: Create ${params.contentType} for ${params.topic}

Platform Guidelines:
${platformGuidelines}

Brand Voice: ${params.brandVoice || 'Professional yet approachable'}
Target Audience: ${params.targetAudience || 'Service-based business owners'}
${params.keywords ? `Keywords to include: ${params.keywords.join(', ')}` : ''}

Requirements:
- Follow platform best practices
- Optimize for engagement
- Include call-to-action
- Use appropriate tone
- ${params.contentType === 'hashtags' ? 'Provide 10-15 relevant hashtags' : 'Keep within character limits'}

Generate compelling content:`;

    const trackingParams = params.organizationId && params.workspaceId
      ? {
          organizationId: params.organizationId,
          workspaceId: params.workspaceId,
          clientId: params.clientId
        }
      : undefined;

    return this.callOpenRouter(model, prompt, undefined, trackingParams);
  }

  /**
   * SEO keyword research and analysis
   */
  async analyzeKeywords(params: {
    seedKeywords: string[];
    industry: string;
    location?: string;
    competitorDomains?: string[];
  }): Promise<{
    primaryKeywords: string[];
    secondaryKeywords: string[];
    longTailKeywords: string[];
    localKeywords: string[];
    contentGaps: string[];
  }> {
    const model = this.selectModel({ task: 'seo', priority: 'quality' });

    const prompt = `
Analyze SEO keywords for a ${params.industry} business${params.location ? ` in ${params.location}` : ''}.

Seed Keywords: ${params.seedKeywords.join(', ')}
${params.competitorDomains ? `Competitor Domains: ${params.competitorDomains.join(', ')}` : ''}

Provide comprehensive keyword analysis:

1. Primary Keywords (10-15):
   - High search volume
   - High commercial intent
   - Achievable difficulty

2. Secondary Keywords (15-20):
   - Medium search volume
   - Related topics
   - Lower competition

3. Long-Tail Keywords (20-30):
   - Specific queries
   - Lower competition
   - High conversion potential

4. Local Keywords (if applicable):
   - Location-based variations
   - "near me" opportunities
   - Local service queries

5. Content Gaps:
   - Topics competitors are missing
   - Emerging trends
   - Question-based queries

Format as JSON.`;

    const response = await this.callOpenRouter(model, prompt);
    return JSON.parse(response);
  }

  /**
   * Competitor analysis
   */
  async analyzeCompetitor(params: {
    competitorDomain: string;
    yourDomain?: string;
    industry: string;
    analysisType: 'seo' | 'content' | 'social' | 'full';
  }): Promise<any> {
    const model = this.selectModel({
      task: 'analysis',
      priority: 'quality',
      contextSize: params.analysisType === 'full' ? 'large' : 'medium'
    });

    const prompt = `
Analyze competitor: ${params.competitorDomain}
Industry: ${params.industry}
${params.yourDomain ? `Compare with: ${params.yourDomain}` : ''}
Analysis Type: ${params.analysisType}

Provide detailed competitive intelligence:

${params.analysisType === 'seo' || params.analysisType === 'full' ? `
SEO Analysis:
- Estimated domain authority
- Top ranking keywords (estimated)
- Content strategy patterns
- Backlink profile insights
- Technical SEO strengths/weaknesses
` : ''}

${params.analysisType === 'content' || params.analysisType === 'full' ? `
Content Analysis:
- Content types and frequency
- Topic clusters
- Content gaps vs your site
- Engagement patterns
- Content quality assessment
` : ''}

${params.analysisType === 'social' || params.analysisType === 'full' ? `
Social Media Analysis:
- Platform presence
- Posting frequency
- Engagement rates (estimated)
- Content mix
- Growth patterns
` : ''}

Provide actionable recommendations.
Format as structured JSON.`;

    const response = await this.callOpenRouter(model, prompt);
    return JSON.parse(response);
  }

  /**
   * Bulk content generation (cost-optimized)
   */
  async generateBulkContent(params: {
    count: number;
    template: string;
    variables: Record<string, string[]>;
  }): Promise<string[]> {
    const model = this.selectModel({ task: 'bulk', priority: 'cost' });

    const prompt = `
Generate ${params.count} variations of content using this template:

Template: ${params.template}

Variables:
${Object.entries(params.variables).map(([key, values]) => `${key}: ${values.join(', ')}`).join('\n')}

Requirements:
- Create ${params.count} unique variations
- Maintain template structure
- Use different variable combinations
- Ensure natural language flow

Return as JSON array of strings.`;

    const response = await this.callOpenRouter(model, prompt);
    return JSON.parse(response);
  }

  /**
   * Visual content analysis (Pinterest, Instagram)
   */
  async analyzeVisualContent(params: {
    imageUrl: string;
    platform: 'pinterest' | 'instagram';
    analysisGoal: 'optimization' | 'description' | 'hashtags' | 'alt-text';
  }): Promise<string> {
    const model = this.MODEL_MAP['visual-quality'].model;

    const prompt = `
Analyze this image for ${params.platform}:
${params.imageUrl}

Goal: ${params.analysisGoal}

${params.analysisGoal === 'optimization' ? 'Provide optimization recommendations for maximum engagement.' : ''}
${params.analysisGoal === 'description' ? 'Write compelling image description.' : ''}
${params.analysisGoal === 'hashtags' ? 'Suggest 15-20 relevant hashtags.' : ''}
${params.analysisGoal === 'alt-text' ? 'Write SEO-optimized alt text.' : ''}

Platform best practices for ${params.platform}:
${this.getPlatformGuidelines(params.platform, 'image')}`;

    return this.callOpenRouter(model, prompt, [{ type: 'image_url', image_url: params.imageUrl }]);
  }

  /**
   * Call OpenRouter API
   *
   * Optional cost tracking parameters:
   * @param organizationId - Organization ID for cost tracking
   * @param workspaceId - Workspace ID for cost tracking
   * @param clientId - Client ID for cost tracking (optional)
   */
  private async callOpenRouter(
    model: string,
    prompt: string,
    additionalContent?: any[],
    trackingParams?: {
      organizationId: string;
      workspaceId: string;
      clientId?: string;
    }
  ): Promise<string> {
    const messages = [
      {
        role: 'user',
        content: additionalContent
          ? [{ type: 'text', text: prompt }, ...additionalContent]
          : prompt
      }
    ];

    const startTime = Date.now();

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://unite-group.in',
        'X-Title': 'Unite-Hub Marketing Intelligence'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    // Track costs if tracking params provided
    if (trackingParams) {
      try {
        const { CostTracker } = await import('@/lib/accounting/cost-tracker');

        const usage = data.usage || {};
        const promptTokens = usage.prompt_tokens || 0;
        const completionTokens = usage.completion_tokens || 0;
        const totalTokens = usage.total_tokens || promptTokens + completionTokens;

        // Calculate cost
        const cost = this.calculateCost(model, promptTokens, completionTokens);

        // Track expense
        await CostTracker.trackExpense({
          organizationId: trackingParams.organizationId,
          workspaceId: trackingParams.workspaceId,
          clientId: trackingParams.clientId,
          expenseType: 'openrouter',
          description: `${model} - ${totalTokens} tokens`,
          amount: cost,
          tokensUsed: totalTokens,
          apiEndpoint: '/chat/completions',
          metadata: {
            model,
            promptTokens,
            completionTokens,
            responseTime,
          }
        });
      } catch (trackingError) {
        // Log but don't throw - cost tracking should never break the app
        console.error('❌ Cost tracking failed (non-critical):', trackingError);
      }
    }

    return data.choices[0].message.content;
  }

  /**
   * Get platform-specific guidelines
   */
  private getPlatformGuidelines(platform: string, contentType: string): string {
    const guidelines: Record<string, Record<string, string>> = {
      youtube: {
        description: '5000 char max. First 150 chars critical. Include timestamps, links, CTAs.',
        script: '8-12 min ideal. Hook in first 15 sec. Pattern interrupt every 30 sec.',
        hashtags: '3-5 hashtags max in description. Use broad + niche.'
      },
      facebook: {
        post: '40-80 chars optimal. Questions drive 100% more engagement.',
        caption: '250 chars max before "See More". Front-load key info.',
        hashtags: '1-2 hashtags max. Overstuffing kills reach.'
      },
      instagram: {
        caption: '2200 char max. First 125 chars matter most. Line breaks for readability.',
        hashtags: '20-30 hashtags. Mix popular (1M+) + niche (10K-100K).',
        image: '1080x1080 for feed. 1080x1920 for stories/reels. Bright, high-contrast.'
      },
      linkedin: {
        post: '1300 chars sweet spot. First 2 lines hook. Use emojis sparingly.',
        hashtags: '3-5 relevant hashtags. Professional, industry-specific.',
        image: '1200x627 for links. Professional, on-brand.'
      },
      tiktok: {
        script: '21-34 sec ideal. Hook in 1-3 sec. Trending audio boosts reach 30%.',
        caption: '150 chars max. Ask question or tease content.',
        hashtags: '3-5 hashtags. 1 trending + niche. #FYP doesn\'t help.'
      },
      x: {
        post: '71-100 chars get 17% more engagement. One idea per tweet.',
        hashtags: '1-2 hashtags max. Overuse kills engagement 17%.'
      },
      reddit: {
        post: 'Title: 60-80 chars. Body: Value first. NO direct promotion.',
        caption: 'Authentic voice. Disclose affiliation. Provide proof/sources.'
      },
      pinterest: {
        description: '500 chars max. Keyword-rich. Include CTA.',
        hashtags: '5-10 hashtags. Descriptive, searchable.',
        image: '1000x1500 vertical. Text overlay for clarity. Bright, branded.'
      }
    };

    return guidelines[platform]?.[contentType] || 'Follow platform best practices.';
  }

  /**
   * Calculate estimated cost for operation
   */
  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const modelKey = Object.keys(this.MODEL_MAP).find(
      key => this.MODEL_MAP[key].model === model
    );

    if (!modelKey) return 0;

    const pricing = this.MODEL_MAP[modelKey].pricing;
    const promptCost = (promptTokens / 1000000) * pricing.prompt;
    const completionCost = (completionTokens / 1000000) * pricing.completion;

    return promptCost + completionCost;
  }
}

export default OpenRouterIntelligence;
