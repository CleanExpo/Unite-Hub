import { NextRequest, NextResponse } from 'next/server';
import { hybridAI } from '@/lib/ai-agent/hybrid/hybrid-ai-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, provider, model, temperature, maxTokens } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!hybridAI.isConfigured()) {
      return NextResponse.json(
        { error: 'AI system is not configured. Please add API keys to environment variables.' },
        { status: 500 }
      );
    }

    const response = await hybridAI.generateResponse(prompt, {
      provider,
      model,
      temperature,
      maxTokens,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const isConfigured = hybridAI.isConfigured();
  const providers = hybridAI.getAvailableProviders();

  return NextResponse.json({
    configured: isConfigured,
    providers,
    models: {
      openai: ['gpt-4-turbo-preview', 'gpt-3.5-turbo'],
      openrouter: [
        'deepseek/deepseek-chat',
        'anthropic/claude-3-opus',
        'google/gemini-pro',
        'meta-llama/llama-3-70b-instruct',
      ],
    },
  });
}
