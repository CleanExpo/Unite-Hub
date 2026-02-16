/**
 * Claude API Client Wrapper
 * Provides utilities for calling Claude AI with rate limiting and error handling
 */

import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not found in environment variables');
    }

    client = new Anthropic({
      apiKey,
    });
  }
  return client;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  system?: string;
  temperature?: number;
}

export async function createMessage(
  messages: ClaudeMessage[],
  options?: ClaudeOptions
): Promise<Anthropic.Message> {
  const client = getClaudeClient();

  try {
    const response = await client.messages.create({
      model: options?.model || 'claude-sonnet-4-5-20250929',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 1.0,
      system: options?.system,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    return response;
  } catch (error: unknown) {
    console.error('Claude API error:', error);
    throw new Error(`Claude API request failed: ${error.message}`);
  }
}

export function parseJSONResponse<T = any>(response: Anthropic.Message): T {
  try {
    const textContent = response.content.find(
      (block) => block.type === 'text'
    ) as Anthropic.TextBlock | undefined;

    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    // Try to extract JSON from markdown code blocks
    const text = textContent.text;
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try to parse the entire text as JSON
    return JSON.parse(text);
  } catch (error: unknown) {
    console.error('Failed to parse Claude JSON response:', error);
    throw new Error(`Failed to parse JSON from Claude response: ${error.message}`);
  }
}

export function extractTextContent(response: Anthropic.Message): string {
  const textContent = response.content.find(
    (block) => block.type === 'text'
  ) as Anthropic.TextBlock | undefined;

  return textContent?.text || '';
}

// Simple in-memory rate limiter
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 50, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.requests.push(now);
  }
}

export const rateLimiter = new RateLimiter();

export async function createMessageWithRateLimit(
  messages: ClaudeMessage[],
  options?: ClaudeOptions
): Promise<Anthropic.Message> {
  await rateLimiter.checkLimit();
  return createMessage(messages, options);
}
