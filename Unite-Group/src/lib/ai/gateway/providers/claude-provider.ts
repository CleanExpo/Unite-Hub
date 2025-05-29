/**
 * Claude Provider Implementation
 * Unite Group AI Gateway - Anthropic Claude Integration
 */

import {
  AIRequest,
  AIResponse,
  AIServiceConfig,
  ClaudeConfig,
  AIError,
  AIUsage
} from '../types';

export class ClaudeProvider {
  private config: ClaudeConfig;
  private baseURL = 'https://api.anthropic.com/v1';

  constructor(config: AIServiceConfig) {
    this.config = config as ClaudeConfig;
    
    if (!this.config.apiKey) {
      throw new Error('Claude API key is required');
    }
  }

  /**
   * Generate text using Claude API
   */
  async generateText(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const response = await this.makeRequest(request);
      
      return {
        id: `claude_${Date.now()}`,
        requestId: request.id,
        provider: 'claude',
        content: response.content[0]?.text || '',
        usage: this.parseUsage(response.usage),
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        metadata: {
          model: response.model,
          stopReason: response.stop_reason,
          stopSequence: response.stop_sequence
        }
      };
    } catch (error) {
      throw this.handleError(error, request.id);
    }
  }

  /**
   * Make HTTP request to Claude API
   */
  private async makeRequest(request: AIRequest): Promise<any> {
    const endpoint = this.getEndpoint(request.type);
    const payload = this.buildPayload(request);

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': this.config.version || '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get API endpoint based on request type
   */
  private getEndpoint(requestType: string): string {
    switch (requestType) {
      case 'text_generation':
      case 'text_completion':
      case 'text_analysis':
      case 'text_summarization':
      case 'question_answering':
      case 'code_generation':
        return '/messages';
      default:
        return '/messages';
    }
  }

  /**
   * Build request payload for Claude API
   */
  private buildPayload(request: AIRequest): any {
    const { prompt, options = {} } = request;
    
    const messages: any[] = [];
    
    // Add context messages if provided
    if (options.context && Array.isArray(options.context)) {
      options.context.forEach((contextItem, index) => {
        messages.push({
          role: index % 2 === 0 ? 'user' : 'assistant',
          content: contextItem
        });
      });
    }

    // Add main prompt
    messages.push({
      role: 'user',
      content: prompt
    });

    const payload: any = {
      model: options.model || this.config.model || 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens || this.config.maxTokens || 2000,
      messages,
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      top_p: options.topP ?? 1.0,
      stream: options.stream || false
    };

    // Add system prompt if provided
    if (options.systemPrompt) {
      payload.system = options.systemPrompt;
    }

    // Add stop sequences if provided
    if (options.stop && Array.isArray(options.stop)) {
      payload.stop_sequences = options.stop;
    }

    return payload;
  }

  /**
   * Parse usage information from Claude response
   */
  private parseUsage(usage: any): AIUsage {
    if (!usage) {
      return {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        model: this.config.model || 'unknown'
      };
    }

    const cost = this.calculateCost(usage, this.config.model || 'claude-3-sonnet-20240229');

    return {
      promptTokens: usage.input_tokens || 0,
      completionTokens: usage.output_tokens || 0,
      totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
      cost,
      model: this.config.model || 'unknown'
    };
  }

  /**
   * Calculate cost based on token usage and model
   */
  private calculateCost(usage: any, model: string): number {
    // Claude pricing (as of 2024 - these should be updated regularly)
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 }, // per 1K tokens
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
      'claude-2.1': { input: 0.008, output: 0.024 },
      'claude-2.0': { input: 0.008, output: 0.024 },
      'claude-instant-1.2': { input: 0.0008, output: 0.0024 }
    };

    const modelPricing = pricing[model] || pricing['claude-3-sonnet-20240229']; // Default to Sonnet pricing
    
    const inputCost = (usage.input_tokens / 1000) * modelPricing.input;
    const outputCost = (usage.output_tokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: unknown, requestId: string): AIError {
    let code = 'UNKNOWN_ERROR';
    let message = 'Unknown error occurred';
    let retryable = false;

    if (error instanceof Error) {
      message = error.message;

      // Parse Claude specific errors
      if (message.includes('401')) {
        code = 'AUTHENTICATION_ERROR';
      } else if (message.includes('429')) {
        code = 'RATE_LIMIT_EXCEEDED';
        retryable = true;
      } else if (message.includes('400')) {
        code = 'INVALID_REQUEST';
      } else if (message.includes('500') || message.includes('502') || message.includes('503')) {
        code = 'NETWORK_ERROR';
        retryable = true;
      } else if (message.includes('timeout')) {
        code = 'TIMEOUT_ERROR';
        retryable = true;
      } else if (message.includes('overloaded')) {
        code = 'MODEL_UNAVAILABLE';
        retryable = true;
      }
    }

    return {
      code,
      message,
      provider: 'claude',
      requestId,
      retryable,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check for Claude service
   */
  async healthCheck(): Promise<void> {
    try {
      // Claude doesn't have a dedicated health endpoint, so we make a minimal request
      const testRequest: AIRequest = {
        id: 'health_check',
        provider: 'claude',
        type: 'text_generation',
        prompt: 'Hello',
        options: { maxTokens: 5 },
        timestamp: new Date().toISOString()
      };

      await this.generateText(testRequest);
    } catch (error) {
      throw new Error(`Claude health check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analyze text sentiment using Claude
   */
  async analyzeSentiment(text: string): Promise<{ sentiment: string; confidence: number; explanation: string }> {
    const request: AIRequest = {
      id: `sentiment_${Date.now()}`,
      provider: 'claude',
      type: 'text_analysis',
      prompt: `Analyze the sentiment of the following text. Respond with a JSON object containing:
- sentiment: "positive", "negative", or "neutral"
- confidence: a number between 0 and 1
- explanation: a brief explanation

Text: "${text}"

JSON Response:`,
      options: {
        maxTokens: 200,
        temperature: 0.3
      },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.generateText(request);
      
      // Try to extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          sentiment: result.sentiment || 'neutral',
          confidence: result.confidence || 0.5,
          explanation: result.explanation || 'Sentiment analysis completed'
        };
      }
      
      // Fallback parsing
      const sentiment = response.content.toLowerCase().includes('positive') ? 'positive' :
                       response.content.toLowerCase().includes('negative') ? 'negative' : 'neutral';
      
      return {
        sentiment,
        confidence: 0.7,
        explanation: response.content.substring(0, 100) + '...'
      };
    } catch (error) {
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        explanation: 'Unable to analyze sentiment'
      };
    }
  }

  /**
   * Generate summary using Claude
   */
  async generateSummary(text: string, maxLength = 200): Promise<string> {
    const request: AIRequest = {
      id: `summary_${Date.now()}`,
      provider: 'claude',
      type: 'text_summarization',
      prompt: `Please provide a concise summary of the following text in approximately ${maxLength} characters:

${text}

Summary:`,
      options: {
        maxTokens: Math.ceil(maxLength / 4), // Rough estimation: 4 chars per token
        temperature: 0.3
      },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.generateText(request);
      return response.content.trim();
    } catch (error) {
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate code using Claude
   */
  async generateCode(prompt: string, language = 'javascript'): Promise<{ code: string; explanation: string }> {
    const request: AIRequest = {
      id: `code_${Date.now()}`,
      provider: 'claude',
      type: 'code_generation',
      prompt: `Generate ${language} code for the following request and provide a brief explanation.

Request: ${prompt}

Please respond with:
1. The code (wrapped in \`\`\`${language} tags)
2. A brief explanation of the code

Response:`,
      options: {
        maxTokens: 1000,
        temperature: 0.2
      },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.generateText(request);
      
      // Extract code from markdown code blocks
      const codeMatch = response.content.match(/```(?:\w+)?\s*([\s\S]*?)```/);
      const code = codeMatch ? codeMatch[1].trim() : '// Code generation failed';
      
      // Extract explanation (text after code block or before it)
      const explanation = response.content
        .replace(/```(?:\w+)?\s*[\s\S]*?```/, '')
        .trim() || 'No explanation provided';
      
      return { code, explanation };
    } catch (error) {
      throw new Error(`Failed to generate code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Translate text using Claude
   */
  async translateText(text: string, targetLanguage: string): Promise<string> {
    const request: AIRequest = {
      id: `translate_${Date.now()}`,
      provider: 'claude',
      type: 'text_translation',
      prompt: `Translate the following text to ${targetLanguage}. Only provide the translation, no additional commentary:

Text: "${text}"

Translation:`,
      options: {
        maxTokens: Math.max(100, text.length * 2), // Allow for language expansion
        temperature: 0.3
      },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.generateText(request);
      return response.content.trim();
    } catch (error) {
      throw new Error(`Failed to translate text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract entities from text using Claude
   */
  async extractEntities(text: string): Promise<{ entities: Array<{ type: string; value: string; confidence: number }> }> {
    const request: AIRequest = {
      id: `entities_${Date.now()}`,
      provider: 'claude',
      type: 'entity_extraction',
      prompt: `Extract named entities from the following text. Identify people, organizations, locations, dates, and other important entities.

Respond with a JSON object containing an "entities" array where each entity has:
- type: the entity type (PERSON, ORGANIZATION, LOCATION, DATE, etc.)
- value: the entity text
- confidence: confidence score (0-1)

Text: "${text}"

JSON Response:`,
      options: {
        maxTokens: 500,
        temperature: 0.2
      },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.generateText(request);
      
      // Try to extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          entities: result.entities || []
        };
      }
      
      return { entities: [] };
    } catch (error) {
      return { entities: [] };
    }
  }

  /**
   * Get provider configuration
   */
  getConfig(): ClaudeConfig {
    return { ...this.config };
  }

  /**
   * Update provider configuration
   */
  updateConfig(updates: Partial<ClaudeConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

export default ClaudeProvider;
