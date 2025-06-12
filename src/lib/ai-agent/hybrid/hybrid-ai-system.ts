import OpenAI from 'openai';

interface AIProvider {
  name: string;
  client: OpenAI;
  model: string;
}

interface AIResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class HybridAISystem {
  private providers: AIProvider[] = [];

  constructor() {
    // Initialize OpenAI provider
    if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      this.providers.push({
        name: 'openai',
        client: new OpenAI({
          apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        }),
        model: 'gpt-4-turbo-preview',
      });
    }

    // Initialize OpenRouter provider
    if (process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
      this.providers.push({
        name: 'openrouter',
        client: new OpenAI({
          apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'Unite Group AI System',
          },
        }),
        model: 'deepseek/deepseek-chat',
      });
    }
  }

  async generateResponse(
    prompt: string,
    options?: {
      provider?: 'openai' | 'openrouter';
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    const provider = this.selectProvider(options?.provider);
    if (!provider) {
      throw new Error('No AI provider available. Please configure API keys.');
    }

    try {
      const completion = await provider.client.chat.completions.create({
        model: options?.model || provider.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant for Unite Group.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
      });

      const response = completion.choices[0]?.message?.content || '';

      return {
        content: response,
        provider: provider.name,
        model: options?.model || provider.model,
        usage: completion.usage,
      };
    } catch (error) {
      console.error(`Error with ${provider.name}:`, error);
      
      // Try fallback provider if available
      const fallbackProvider = this.providers.find(p => p.name !== provider.name);
      if (fallbackProvider) {
        console.log(`Falling back to ${fallbackProvider.name}`);
        return this.generateResponse(prompt, {
          ...options,
          provider: fallbackProvider.name as 'openai' | 'openrouter',
        });
      }
      
      throw error;
    }
  }

  async generateWithClaude(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    const openRouterProvider = this.providers.find(p => p.name === 'openrouter');
    if (!openRouterProvider) {
      throw new Error('OpenRouter provider not configured');
    }

    return this.generateResponse(prompt, {
      provider: 'openrouter',
      model: 'anthropic/claude-3-opus',
      ...options,
    });
  }

  async generateWithDeepSeek(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<AIResponse> {
    return this.generateResponse(prompt, {
      provider: 'openrouter',
      model: 'deepseek/deepseek-chat',
      ...options,
    });
  }

  private selectProvider(preferredProvider?: string): AIProvider | null {
    if (preferredProvider) {
      const provider = this.providers.find(p => p.name === preferredProvider);
      if (provider) return provider;
    }
    
    // Return first available provider
    return this.providers[0] || null;
  }

  isConfigured(): boolean {
    return this.providers.length > 0;
  }

  getAvailableProviders(): string[] {
    return this.providers.map(p => p.name);
  }
}

// Export singleton instance
export const hybridAI = new HybridAISystem();
