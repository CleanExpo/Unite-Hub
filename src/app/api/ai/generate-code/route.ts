import { NextRequest } from 'next/server';
import {
  generateWithGPT4o,
  generateWithGPT4oMini,
  generateWithGPT4Turbo
} from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = 'gpt-4o-mini' } = await req.json();

    if (!prompt) {
      return Response.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Enhanced prompt for better code generation
    const enhancedPrompt = `You are an expert programmer. Generate clean, production-ready, well-commented code for the following request. Include proper error handling and follow best practices.

Request: ${prompt}

Provide only the code without explanations unless specifically asked.`;

    let code: string | null = null;

    // Select model
    switch (model) {
      case 'gpt-4o':
        code = await generateWithGPT4o(enhancedPrompt);
        break;
      case 'gpt-4-turbo':
        code = await generateWithGPT4Turbo(enhancedPrompt);
        break;
      case 'gpt-4o-mini':
      default:
        code = await generateWithGPT4oMini(enhancedPrompt);
        break;
    }

    return Response.json({
      success: true,
      code,
      model,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Code generation error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to generate code',
      },
      { status: 500 }
    );
  }
}
