/**
 * Test Endpoint for Claude Opus 4.5
 *
 * POST /api/test-opus-4-5
 *
 * Tests the new Claude Opus 4.5 model with Extended Thinking capability
 *
 * Body:
 * {
 *   "prompt": "Your test prompt",
 *   "useThinking": true,
 *   "thinkingBudget": 5000
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, useThinking = false, thinkingBudget = 5000 } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Test with Claude Opus 4.5
    const messageOptions: any = {
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    // Add Extended Thinking if requested
    if (useThinking) {
      messageOptions.thinking = {
        type: 'enabled',
        budget_tokens: thinkingBudget
      };
    }

    const message = await anthropic.messages.create(messageOptions);

    const latency = Date.now() - startTime;

    // Extract text response
    const textContent = message.content.find((c) => c.type === 'text');
    const thinkingContent = message.content.find((c) => c.type === 'thinking');

    // Calculate cost
    const inputCost = (message.usage.input_tokens / 1_000_000) * 15; // $15/MTok
    const outputCost = (message.usage.output_tokens / 1_000_000) * 75; // $75/MTok
    const thinkingCost = message.usage.thinking_tokens
      ? (message.usage.thinking_tokens / 1_000_000) * 7.5 // $7.50/MTok
      : 0;
    const totalCost = inputCost + outputCost + thinkingCost;

    return NextResponse.json({
      success: true,
      model: 'claude-opus-4-5-20251101',
      modelName: 'Claude Opus 4.5',
      response: textContent?.text || '',
      thinking: thinkingContent?.thinking || null,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        thinking_tokens: message.usage.thinking_tokens || 0,
        cache_creation_input_tokens: message.usage.cache_creation_input_tokens || 0,
        cache_read_input_tokens: message.usage.cache_read_input_tokens || 0,
      },
      cost: {
        input: inputCost,
        output: outputCost,
        thinking: thinkingCost,
        total: totalCost,
      },
      latency_ms: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Opus 4.5 test error:', error);

    return NextResponse.json(
      {
        error: 'Failed to test Claude Opus 4.5',
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}
