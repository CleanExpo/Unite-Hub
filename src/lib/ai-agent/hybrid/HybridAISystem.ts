import OpenAI from 'openai'

export class HybridAISystem {
  private client: OpenAI
  
  constructor() {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'https://unite-group.in',
        'X-Title': 'Unite Group Builder'
      }
    })
  }

  async buildWithDeepSeek(prompt: string) {
    const completion = await this.client.chat.completions.create({
      model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    })
    return completion.choices[0].message.content
  }

  async enhanceWithClaude(code: string, instructions: string) {
    const completion = await this.client.chat.completions.create({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        { role: 'user', content: `Enhance this code: ${code}\n\nInstructions: ${instructions}` }
      ],
      max_tokens: 4000
    })
    return completion.choices[0].message.content
  }
}
