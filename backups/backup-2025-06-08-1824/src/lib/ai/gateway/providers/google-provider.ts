/**
 * Google AI Provider Implementation
 * Unite Group AI Gateway - Google AI Integration
 */

import {
  AIRequest,
  AIResponse,
  AIServiceConfig,
  GoogleAIConfig,
  AIError,
  AIUsage
} from '../types';

export class GoogleAIProvider {
  private config: GoogleAIConfig;
  private baseURL: string;

  constructor(config: AIServiceConfig) {
    this.config = config as GoogleAIConfig;
    
    if (!this.config.apiKey) {
      throw new Error('Google AI API key is required');
    }

    // Set base URL based on the service
    this.baseURL = this.config.endpoint || 
      `https://${this.config.location || 'us-central1'}-aiplatform.googleapis.com/v1`;
  }

  /**
   * Generate text using Google AI API
   */
  async generateText(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const response = await this.makeRequest(request);
      
      return {
        id: `google_${Date.now()}`,
        requestId: request.id,
        provider: 'google',
        content: this.extractContent(response),
        usage: this.parseUsage(response.usage),
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        metadata: {
          model: this.config.model,
          finishReason: response.candidates?.[0]?.finishReason
        }
      };
    } catch (error) {
      throw this.handleError(error, request.id);
    }
  }

  /**
   * Make HTTP request to Google AI API
   */
  private async makeRequest(request: AIRequest): Promise<any> {
    const endpoint = this.getEndpoint(request.type);
    const payload = this.buildPayload(request);

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...(this.config.projectId && { 'X-Goog-User-Project': this.config.projectId })
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google AI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get API endpoint based on request type and model
   */
  private getEndpoint(requestType: string): string {
    const model = this.config.model || 'gemini-pro';
    
    if (model.startsWith('gemini')) {
      return `/models/${model}:generateContent`;
    } else if (model.includes('text-bison') || model.includes('chat-bison')) {
      return `/models/${model}:predict`;
    }
    
    return `/models/${model}:generateContent`;
  }

  /**
   * Build request payload for Google AI API
   */
  private buildPayload(request: AIRequest): any {
    const { prompt, options = {} } = request;
    const model = this.config.model || 'gemini-pro';

    if (model.startsWith('gemini')) {
      return this.buildGeminiPayload(request);
    } else {
      return this.buildPaLMPayload(request);
    }
  }

  /**
   * Build payload for Gemini models
   */
  private buildGeminiPayload(request: AIRequest): any {
    const { prompt, options = {} } = request;
    
    const contents: any[] = [];
    
    // Add context if provided
    if (options.context && Array.isArray(options.context)) {
      options.context.forEach((contextItem, index) => {
        contents.push({
          role: index % 2 === 0 ? 'user' : 'model',
          parts: [{ text: contextItem }]
        });
      });
    }

    // Add main prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const payload: any = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        topP: options.topP ?? 0.8,
        topK: 40,
        maxOutputTokens: options.maxTokens || this.config.maxTokens || 2000
      }
    };

    // Add system instruction if provided (Gemini 1.5+)
    if (options.systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: options.systemPrompt }]
      };
    }

    // Add stop sequences if provided
    if (options.stop && Array.isArray(options.stop)) {
      payload.generationConfig.stopSequences = options.stop;
    }

    return payload;
  }

  /**
   * Build payload for PaLM models
   */
  private buildPaLMPayload(request: AIRequest): any {
    const { prompt, options = {} } = request;
    
    return {
      instances: [{
        prompt: {
          text: prompt
        }
      }],
      parameters: {
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens || this.config.maxTokens || 2000,
        topP: options.topP ?? 0.8,
        topK: 40
      }
    };
  }

  /**
   * Extract content from Google AI response
   */
  private extractContent(response: any): string {
    // Gemini response format
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        return candidate.content.parts
          .map((part: any) => part.text || '')
          .join('');
      }
    }

    // PaLM response format
    if (response.predictions && response.predictions[0]) {
      return response.predictions[0].content || '';
    }

    return '';
  }

  /**
   * Parse usage information from Google AI response
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

    const promptTokens = usage.promptTokenCount || 0;
    const completionTokens = usage.candidatesTokenCount || 0;
    const totalTokens = usage.totalTokenCount || (promptTokens + completionTokens);

    const cost = this.calculateCost({ promptTokens, completionTokens }, this.config.model || 'gemini-pro');

    return {
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      model: this.config.model || 'unknown'
    };
  }

  /**
   * Calculate cost based on token usage and model
   */
  private calculateCost(usage: { promptTokens: number; completionTokens: number }, model: string): number {
    // Google AI pricing (as of 2024 - these should be updated regularly)
    const pricing: Record<string, { input: number; output: number }> = {
      'gemini-pro': { input: 0.0005, output: 0.0015 }, // per 1K tokens
      'gemini-pro-vision': { input: 0.0005, output: 0.0015 },
      'text-bison': { input: 0.001, output: 0.001 },
      'chat-bison': { input: 0.0005, output: 0.0005 },
      'text-bison-32k': { input: 0.001, output: 0.001 }
    };

    const modelPricing = pricing[model] || pricing['gemini-pro']; // Default to Gemini Pro pricing
    
    const inputCost = (usage.promptTokens / 1000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1000) * modelPricing.output;
    
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

      // Parse Google AI specific errors
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
      } else if (message.includes('quota')) {
        code = 'QUOTA_EXCEEDED';
        retryable = true;
      } else if (message.includes('safety') || message.includes('blocked')) {
        code = 'CONTENT_FILTERED';
      }
    }

    return {
      code,
      message,
      provider: 'google',
      requestId,
      retryable,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check for Google AI service
   */
  async healthCheck(): Promise<void> {
    try {
      // Make a minimal request to test connectivity
      const testRequest: AIRequest = {
        id: 'health_check',
        provider: 'google',
        type: 'text_generation',
        prompt: 'Hello',
        options: { maxTokens: 5 },
        timestamp: new Date().toISOString()
      };

      await this.generateText(testRequest);
    } catch (error) {
      throw new Error(`Google AI health check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process image using Google Vision API
   */
  async processImage(imageData: ImageData, tasks: string[]): Promise<{ results: any[] }> {
    // This would integrate with Google Vision API
    // For now, return a mock response
    return {
      results: tasks.map(task => ({
        task,
        confidence: 0.8,
        result: `Mock result for ${task}`
      }))
    };
  }

  /**
   * Translate text using Google Translate API
   */
  async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<string> {
    const request: AIRequest = {
      id: `translate_${Date.now()}`,
      provider: 'google',
      type: 'text_translation',
      prompt: `Translate the following text from ${sourceLanguage || 'auto-detect'} to ${targetLanguage}. Only provide the translation:

"${text}"`,
      options: {
        maxTokens: Math.max(100, text.length * 2),
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
   * Analyze sentiment using Google AI
   */
  async analyzeSentiment(text: string): Promise<{ sentiment: string; confidence: number; explanation: string }> {
    const request: AIRequest = {
      id: `sentiment_${Date.now()}`,
      provider: 'google',
      type: 'text_analysis',
      prompt: `Analyze the sentiment of the following text and provide a JSON response with sentiment, confidence, and explanation:

Text: "${text}"

JSON format:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.85,
  "explanation": "Brief explanation"
}`,
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
      
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        explanation: 'Unable to parse sentiment analysis'
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
   * Generate summary using Google AI
   */
  async generateSummary(text: string, maxLength = 200): Promise<string> {
    const request: AIRequest = {
      id: `summary_${Date.now()}`,
      provider: 'google',
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
   * Get provider configuration
   */
  getConfig(): GoogleAIConfig {
    return { ...this.config };
  }

  /**
   * Update provider configuration
   */
  updateConfig(updates: Partial<GoogleAIConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

export default GoogleAIProvider;
