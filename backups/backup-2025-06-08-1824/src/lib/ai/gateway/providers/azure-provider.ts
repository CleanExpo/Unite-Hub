/**
 * Azure AI Provider Implementation
 * Unite Group AI Gateway - Microsoft Azure AI Integration
 */

import {
  AIRequest,
  AIResponse,
  AIServiceConfig,
  AzureConfig,
  AIError,
  AIUsage
} from '../types';

export class AzureProvider {
  private config: AzureConfig;
  private baseURL: string;

  constructor(config: AIServiceConfig) {
    this.config = config as AzureConfig;
    
    if (!this.config.apiKey) {
      throw new Error('Azure AI API key is required');
    }

    // Construct Azure OpenAI endpoint
    this.baseURL = this.config.endpoint || 
      `https://${this.config.resourceName}.openai.azure.com`;
  }

  /**
   * Generate text using Azure OpenAI API
   */
  async generateText(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const response = await this.makeRequest(request);
      
      return {
        id: `azure_${Date.now()}`,
        requestId: request.id,
        provider: 'azure',
        content: response.choices[0]?.message?.content || response.choices[0]?.text || '',
        usage: this.parseUsage(response.usage),
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        metadata: {
          model: response.model,
          finishReason: response.choices[0]?.finish_reason,
          deployment: this.config.deploymentName
        }
      };
    } catch (error) {
      throw this.handleError(error, request.id);
    }
  }

  /**
   * Make HTTP request to Azure OpenAI API
   */
  private async makeRequest(request: AIRequest): Promise<any> {
    const endpoint = this.getEndpoint(request.type);
    const payload = this.buildPayload(request);

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'api-key': this.config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Azure AI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get API endpoint based on request type
   */
  private getEndpoint(requestType: string): string {
    const apiVersion = this.config.apiVersion || '2024-02-15-preview';
    const deployment = this.config.deploymentName || this.config.model;

    switch (requestType) {
      case 'text_generation':
      case 'text_completion':
      case 'text_analysis':
      case 'question_answering':
        return `/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
      case 'text_summarization':
        return `/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
      case 'code_generation':
        return `/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
      default:
        return `/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    }
  }

  /**
   * Build request payload for Azure OpenAI API
   */
  private buildPayload(request: AIRequest): any {
    const { prompt, options = {} } = request;
    
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
      messages,
      max_tokens: options.maxTokens || this.config.maxTokens || 2000,
      temperature: options.temperature ?? this.config.temperature ?? 0.7,
      top_p: options.topP ?? 1.0,
      frequency_penalty: options.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? 0,
      stop: options.stop || null,
      stream: options.stream || false
    };
  }

  /**
   * Parse usage information from Azure OpenAI response
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

    const cost = this.calculateCost(usage, this.config.model || 'gpt-35-turbo');

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
    // Azure OpenAI pricing (as of 2024 - these should be updated regularly)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-35-turbo': { input: 0.0015, output: 0.002 },
      'gpt-35-turbo-16k': { input: 0.003, output: 0.004 }
    };

    const modelPricing = pricing[model] || pricing['gpt-35-turbo']; // Default to GPT-3.5 pricing
    
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

      // Parse Azure specific errors
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
      } else if (message.includes('quota')) {
        code = 'QUOTA_EXCEEDED';
        retryable = true;
      }
    }

    return {
      code,
      message,
      provider: 'azure',
      requestId,
      retryable,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check for Azure OpenAI service
   */
  async healthCheck(): Promise<void> {
    try {
      // Make a minimal request to test connectivity
      const testRequest: AIRequest = {
        id: 'health_check',
        provider: 'azure',
        type: 'text_generation',
        prompt: 'Hello',
        options: { maxTokens: 5 },
        timestamp: new Date().toISOString()
      };

      await this.generateText(testRequest);
    } catch (error) {
      throw new Error(`Azure AI health check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analyze text sentiment using Azure OpenAI
   */
  async analyzeSentiment(text: string): Promise<{ sentiment: string; confidence: number; explanation: string }> {
    const request: AIRequest = {
      id: `sentiment_${Date.now()}`,
      provider: 'azure',
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
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        explanation: 'Unable to analyze sentiment'
      };
    }
  }

  /**
   * Generate summary using Azure OpenAI
   */
  async generateSummary(text: string, maxLength = 200): Promise<string> {
    const request: AIRequest = {
      id: `summary_${Date.now()}`,
      provider: 'azure',
      type: 'text_summarization',
      prompt: `Please provide a concise summary of the following text in approximately ${maxLength} characters:

${text}

Summary:`,
      options: {
        maxTokens: Math.ceil(maxLength / 4),
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
   * Generate code using Azure OpenAI
   */
  async generateCode(prompt: string, language = 'javascript'): Promise<{ code: string; explanation: string }> {
    const request: AIRequest = {
      id: `code_${Date.now()}`,
      provider: 'azure',
      type: 'code_generation',
      prompt: `Generate ${language} code for the following request and provide a brief explanation:

Request: ${prompt}

Please respond with a JSON object containing:
{
  "code": "// Your generated code here",
  "explanation": "Brief explanation of the code"
}`,
      options: {
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
   * Process document using Azure Document Intelligence
   */
  async processDocument(documentUrl: string): Promise<{ text: string; entities: any[]; structure: any }> {
    // This would integrate with Azure Document Intelligence
    // For now, return a mock response
    return {
      text: 'Mock extracted text from document',
      entities: [],
      structure: {
        pages: 1,
        tables: 0,
        forms: 0
      }
    };
  }

  /**
   * Get provider configuration
   */
  getConfig(): AzureConfig {
    return { ...this.config };
  }

  /**
   * Update provider configuration
   */
  updateConfig(updates: Partial<AzureConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

export default AzureProvider;
