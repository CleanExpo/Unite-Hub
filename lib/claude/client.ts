import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model configuration
export const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

// Default message parameters
export const DEFAULT_PARAMS = {
  model: CLAUDE_MODEL,
  max_tokens: 4096,
  temperature: 0.7,
};

// Streaming configuration
export const STREAMING_PARAMS = {
  ...DEFAULT_PARAMS,
  stream: true,
};

// Create a message with Claude
export async function createMessage(
  messages: Anthropic.MessageParam[],
  systemPrompt?: string,
  options?: Partial<Anthropic.MessageCreateParams>
): Promise<Anthropic.Message> {
  const params: Anthropic.MessageCreateParams = {
    ...DEFAULT_PARAMS,
    messages,
    ...(systemPrompt && { system: systemPrompt }),
    ...options,
  };

  return await anthropic.messages.create(params);
}

// Create a streaming message with Claude
export async function createStreamingMessage(
  messages: Anthropic.MessageParam[],
  systemPrompt?: string,
  options?: Partial<Anthropic.MessageCreateParams>
): Promise<AsyncIterable<Anthropic.MessageStreamEvent>> {
  const params: Anthropic.MessageCreateParams = {
    ...STREAMING_PARAMS,
    messages,
    ...(systemPrompt && { system: systemPrompt }),
    ...options,
  };

  return await anthropic.messages.stream(params);
}

// Helper to extract text content from message
export function extractTextContent(message: Anthropic.Message): string {
  const textContent = message.content.find(
    (block) => block.type === 'text'
  ) as Anthropic.TextBlock | undefined;
  return textContent?.text || '';
}

// Helper to parse JSON response
export function parseJSONResponse<T>(message: Anthropic.Message): T {
  const text = extractTextContent(message);

  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error}`);
  }
}

// Rate limiting helper
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests: number = 100, timeWindowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkLimit();
    }

    this.requests.push(now);
  }
}

export const rateLimiter = new RateLimiter();
