/**
 * OpenAI Provider Implementation
 * Unite Group AI Gateway - OpenAI Integration
 */

import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIServiceConfig,
  OpenAIConfig,
  AIError,
  AIUsage
} from '../types';

export class OpenAIProvider {
  private config: OpenAIConfig;
  private baseURL = 'https://api.openai.com/v1';

  constructor(config: AIServiceConfig) {
    this.config = config as OpenAIConfig;
    
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }

  /**
   * Generate text using OpenAI API
   */
  async generateText(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const response = await this.makeRequest(request);
      
      return {
        id: `openai_${Date.now()}`,
        requestId: request.id,
        provider: 'openai',
        content: response.choices[0]?.message?.content || response.choices[0]?.text || '',
        usage: this.parseUsage(response.usage),
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        metadata: {
          model: response.model,
          finishReason: response.choices[0]?.finish_reason
        }
      };
    } catch (error) {
      throw this.handleError(error, request.id);
    }
  }

  /**
   * Make HTTP request to OpenAI API
   */
  private async makeRequest(request: AIRequest): Promise<any> {
    const endpoint = this.getEndpoint(request.type);
    const payload = this.buildPayload(request);

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...(this.config.organization && { 'OpenAI-Organization': this.config.organization })
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
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
      case 'question_answering':
        return '/chat/completions';
      case 'text_summarization':
        return '/chat/completions';
      case 'code_generation':
        return '/chat/completions';
      default:
        return '/chat/completions';
    }
  }

  /**
   * Build request payload for OpenAI API
   */
  private buildPayload(request: AIRequest): any {
    const { prompt, options = {} } = request;
    
    // Determine if we should use chat format or completion format
    const useChat = true; // Modern OpenAI models prefer chat format

    if (useChat) {
      const messages: any[] = [];
      
      // Add system message if provided
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }

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

      return {
        model: options.model || this.config.model || 'gpt-4',
        messages,
        max_tokens: options.maxTokens || this.config.maxTokens || 2000,
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        top_p: options.topP ?? 1.0,
        frequency_penalty: options.frequencyPenalty ?? 0,
        presence_penalty: options.presencePenalty ?? 0,
        stop: options.stop || null,
        stream: options.stream || false,
        ...(options.format === 'json' && { response_format: { type: 'json_object' } })
      };
    } else {
      // Legacy completion format (for older models)
      return {
        model: options.model || this.config.model || 'gpt-3.5-turbo-instruct',
        prompt,
        max_tokens: options.maxTokens || this.config.maxTokens || 2000,
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        top_p: options.topP ?? 1.0,
        frequency_penalty: options.frequencyPenalty ?? 0,
        presence_penalty: options.presencePenalty ?? 0,
        stop: options.stop || null,
        stream: options.stream || false
      };
    }
  }

  /**
   * Parse usage information from OpenAI response
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

    const cost = this.calculateCost(usage, this.config.model || 'gpt-4');

    return {
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
      cost,
      model: this.config.model || 'unknown'
    };
  }

  /**
   * Calculate cost based on token usage and model
   */
  private calculateCost(usage: any, model: string): number {
    // OpenAI pricing (as of 2024 - these should be updated regularly)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
      'gpt-3.5-turbo-instruct': { input: 0.0015, output: 0.002 }
    };

    const modelPricing = pricing[model] || pricing['gpt-4']; // Default to GPT-4 pricing
    
    const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
    const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;
    
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

      // Parse OpenAI specific errors
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
      } else if (message.includes('content_filter') || message.includes('content_policy')) {
        code = 'CONTENT_FILTERED';
      }
    }

    return {
      code,
      message,
      provider: 'openai',
      requestId,
      retryable,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check for OpenAI service
   */
  async healthCheck(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...(this.config.organization && { 'OpenAI-Organization': this.config.organization })
        }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`OpenAI health check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...(this.config.organization && { 'OpenAI-Organization': this.config.organization })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get models: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to get OpenAI models:', error);
      return [];
    }
  }

  /**
   * Analyze text sentiment using OpenAI
   */
  async analyzeSentiment(text: string): Promise<{ sentiment: string; confidence: number; explanation: string }> {
    const request: AIRequest = {
      id: `sentiment_${Date.now()}`,
      provider: 'openai',
      type: 'text_analysis',
      prompt: `Analyze the sentiment of the following text and respond with a JSON object containing sentiment (positive/negative/neutral), confidence (0-1), and explanation:

Text: "${text}"

Response format:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.85,
  "explanation": "Brief explanation of the sentiment analysis"
}`,
      options: {
        format: 'json',
        maxTokens: 200,
        temperature: 0.3
      },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.generateText(request);
      const result = JSON.parse(response.content);
      
      return {
        sentiment: result.sentiment || 'neutral',
        confidence: result.confidence || 0.5,
        explanation: result.explanation || 'Sentiment analysis completed'
      };
    } catch (error) {
      // Fallback to simple sentiment analysis
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        explanation: 'Unable to analyze sentiment'
      };
    }
  }

  /**
   * Generate summary using OpenAI
   */
  async generateSummary(text: string, maxLength = 200): Promise<string> {
    const request: AIRequest = {
      id: `summary_${Date.now()}`,
      provider: 'openai',
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
   * Generate code using OpenAI
   */
  async generateCode(prompt: string, language = 'javascript'): Promise<{ code: string; explanation: string }> {
    const request: AIRequest = {
      id: `code_${Date.now()}`,
      provider: 'openai',
      type: 'code_generation',
      prompt: `Generate ${language} code for the following request and provide a brief explanation:

Request: ${prompt}

Please respond with a JSON object containing:
{
  "code": "// Your generated code here",
  "explanation": "Brief explanation of the code"
}`,
      options: {
        format: 'json',
        maxTokens: 1000,
        temperature: 0.2
      },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await this.generateText(request);
      const result = JSON.parse(response.content);
      
      return {
        code: result.code || '// Code generation failed',
        explanation: result.explanation || 'No explanation provided'
      };
    } catch (error) {
      throw new Error(`Failed to generate code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get provider configuration
   */
  getConfig(): OpenAIConfig {
    return { ...this.config };
  }

  /**
   * Update provider configuration
   */
  updateConfig(updates: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

export default OpenAIProvider;
