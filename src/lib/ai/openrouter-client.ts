/**
 * OpenRouter API Client for Unite-Hub
 *
 * Provides a unified interface for interacting with OpenRouter models
 * with automatic retries, error handling, and cost tracking.
 */

import { OPENROUTER_MODELS, MODEL_ALIASES, calculateCost } from './openrouter-config';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  stop?: string[];
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private defaultHeaders: Record<string, string>;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';

    if (!this.apiKey) {
      console.warn('[OpenRouter] API key not provided. Using environment variable.');
    }

    this.defaultHeaders = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://unite-hub.com',
      'X-Title': 'Unite-Hub CRM',
    };
  }

  /**
   * Create a chat completion
   */
  async createChatCompletion(
    request: OpenRouterRequest,
    retries: number = 3
  ): Promise<OpenRouterResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: this.defaultHeaders,
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData: OpenRouterError = await response.json();
          throw new Error(
            `OpenRouter API error: ${errorData.error.message} (${errorData.error.code})`
          );
        }

        const data: OpenRouterResponse = await response.json();

        // Log usage and cost
        this.logUsage(request.model, data.usage);

        return data;
      } catch (error) {
        lastError = error as Error;
        console.error(`[OpenRouter] Attempt ${attempt + 1} failed:`, error);

        if (attempt < retries - 1) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `OpenRouter request failed after ${retries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Create a streaming chat completion
   */
  async *createStreamingChatCompletion(
    request: OpenRouterRequest
  ): AsyncGenerator<string, void, unknown> {
    const streamRequest = { ...request, stream: true };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(streamRequest),
    });

    if (!response.ok) {
      const errorData: OpenRouterError = await response.json();
      throw new Error(
        `OpenRouter API error: ${errorData.error.message} (${errorData.error.code})`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') continue;

          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices[0]?.delta?.content;

              if (content) {
                yield content;
              }
            } catch (e) {
              console.error('[OpenRouter] Failed to parse stream chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Simple chat helper
   */
  async chat(
    modelId: string,
    messages: OpenRouterMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<string> {
    const request: OpenRouterRequest = {
      model: modelId,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    };

    const response = await this.createChatCompletion(request);
    return response.choices[0].message.content;
  }

  /**
   * Simple completion helper for single prompts
   */
  async complete(
    modelId: string,
    prompt: string,
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const messages: OpenRouterMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    return this.chat(modelId, messages, options);
  }

  /**
   * Log usage and cost information
   */
  private logUsage(modelId: string, usage: OpenRouterResponse['usage']): void {
    const cost = calculateCost(
      modelId,
      usage.prompt_tokens,
      usage.completion_tokens
    );

    const model = OPENROUTER_MODELS[modelId];

    console.log('[OpenRouter] Usage:', {
      model: model?.name || modelId,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost: `$${cost.toFixed(6)}`,
    });
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[OpenRouter] Failed to fetch models:', error);
      return null;
    }
  }

  /**
   * Check API key validity
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const models = await this.getAvailableModels();
      return models !== null;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance
 */
let openRouterClient: OpenRouterClient | null = null;

/**
 * Get or create OpenRouter client instance
 */
export function getOpenRouterClient(apiKey?: string): OpenRouterClient {
  if (!openRouterClient) {
    openRouterClient = new OpenRouterClient(apiKey);
  }
  return openRouterClient;
}

/**
 * Quick helper functions using default client
 */
export async function openRouterChat(
  modelId: string,
  messages: OpenRouterMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const client = getOpenRouterClient();
  return client.chat(modelId, messages, options);
}

export async function openRouterComplete(
  modelId: string,
  prompt: string,
  systemPrompt?: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const client = getOpenRouterClient();
  return client.complete(modelId, prompt, systemPrompt, options);
}

/**
 * Convenient aliases for common operations
 */
export const OpenRouter = {
  chat: openRouterChat,
  complete: openRouterComplete,
  client: () => getOpenRouterClient(),
  models: OPENROUTER_MODELS,
  aliases: MODEL_ALIASES,
};
