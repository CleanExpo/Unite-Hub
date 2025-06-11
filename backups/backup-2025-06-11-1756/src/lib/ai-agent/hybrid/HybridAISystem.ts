import { OpenAI } from 'openai';

export class HybridAISystem {
  private openai: OpenAI;
  private openrouter: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
    });

    this.openrouter = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY!,
      baseURL: 'https://api.openrouter.ai/api/v1',
    });
  }

  async generateText(
    provider: 'openai' | 'openrouter',
    model: string,
    prompt: string,
    options: Record<string, any> = {}
  ): Promise<string> {
    try {
      const client = provider === 'openai' ? this.openai : this.openrouter;
      const response = await client.completions.create({
        model,
        prompt,
        ...options,
      });
      return response.choices[0].text.trim();
    } catch (error: any) {
      console.error(`AI generation failed (${provider}):`, error.message);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  async compareProviders(
    modelA: string,
    modelB: string,
    prompt: string
  ): Promise<{ openaiResult: string; openrouterResult: string }> {
    const [resultA, resultB] = await Promise.all([
      this.generateText('openai', modelA, prompt),
      this.generateText('openrouter', modelB, prompt),
    ]);
    return { openaiResult: resultA, openrouterResult: resultB };
  }
}
