import { NextRequest } from 'next/server';
import { generateWithGPT4oMini } from '@/lib/openai';
import { generateSectionCopy } from '@/lib/ai/claude-client';
import { aiAgentRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

/**
 * Test API route to verify all AI models are working
 * Visit: http://localhost:3008/api/ai/test-models
 */
export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await aiAgentRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(req);

    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: {},
      summary: {},
    };

    // Test 1: OpenAI GPT-4o Mini
    try {
      console.log('Testing OpenAI GPT-4o Mini...');
    const startTime = Date.now();

    const openaiResult = await generateWithGPT4oMini(
      'Say "Hello from GPT-4o Mini" and nothing else.'
    );

    const duration = Date.now() - startTime;

    results.tests.openai_gpt4o_mini = {
      status: 'success',
      model: 'gpt-4o-mini',
      response: openaiResult,
      duration_ms: duration,
      api_key_configured: !!process.env.OPENAI_API_KEY,
    };

    console.log('✅ OpenAI GPT-4o Mini working:', openaiResult);
  } catch (error: any) {
    console.error('❌ OpenAI GPT-4o Mini failed:', error);
    results.tests.openai_gpt4o_mini = {
      status: 'error',
      error: error.message,
      api_key_configured: !!process.env.OPENAI_API_KEY,
    };
  }

  // Test 2: Anthropic Claude 3.5 Sonnet
  try {
    console.log('Testing Anthropic Claude 3.5 Sonnet...');
    const startTime = Date.now();

    const claudeResult = await generateSectionCopy({
      businessName: 'TestCo',
      businessDescription: 'Testing AI models',
      pageType: 'test',
      sectionName: 'test',
    });

    const duration = Date.now() - startTime;

    results.tests.claude_3_5_sonnet = {
      status: 'success',
      model: 'claude-3-5-sonnet-20241022',
      response: {
        headline: claudeResult.headline,
        subheadline: claudeResult.subheadline,
      },
      duration_ms: duration,
      api_key_configured: !!process.env.ANTHROPIC_API_KEY,
    };

    console.log('✅ Claude 3.5 Sonnet working:', claudeResult.headline);
  } catch (error: any) {
    console.error('❌ Claude 3.5 Sonnet failed:', error);
    results.tests.claude_3_5_sonnet = {
      status: 'error',
      error: error.message,
      api_key_configured: !!process.env.ANTHROPIC_API_KEY,
    };
  }

  // Test 3: OpenRouter (Optional - will fail if no key)
  try {
    console.log('Testing OpenRouter availability...');
    const openrouterConfigured = !!process.env.OPENROUTER_API_KEY &&
                                 !process.env.OPENROUTER_API_KEY.includes('placeholder');

    results.tests.openrouter = {
      status: openrouterConfigured ? 'configured' : 'not_configured',
      api_key_configured: openrouterConfigured,
      message: openrouterConfigured
        ? 'OpenRouter is configured and ready'
        : 'OpenRouter API key not configured (optional)',
      available_models: ['kwaipilot/kat-coder-pro:free', 'google/gemini-2.0-flash-exp:free'],
    };
  } catch (error: any) {
    results.tests.openrouter = {
      status: 'error',
      error: error.message,
    };
  }

  // Generate summary
  const successCount = Object.values(results.tests).filter(
    (test: any) => test.status === 'success'
  ).length;
  const totalTests = Object.keys(results.tests).length;

  results.summary = {
    total_tests: totalTests,
    successful: successCount,
    failed: totalTests - successCount,
    all_working: successCount >= 2, // OpenAI + Claude (OpenRouter is optional)
    ready_for_production: successCount >= 2,
  };

    // Return formatted response
    return Response.json(results, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error('Model test error:', error);
    return Response.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Test specific model via POST
 * Body: { model: 'openai' | 'claude', prompt: 'your prompt' }
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await aiAgentRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(req);

    const body = await req.json();
    const { model, prompt } = body;

    if (!prompt) {
      return Response.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    let result: any;

    switch (model) {
      case 'openai':
      case 'gpt-4o-mini':
        const openaiResponse = await generateWithGPT4oMini(prompt);
        result = {
          model: 'gpt-4o-mini',
          response: openaiResponse,
          provider: 'OpenAI Direct',
        };
        break;

      case 'claude':
      case 'claude-3.5':
        const claudeResponse = await generateSectionCopy({
          businessName: 'User Test',
          businessDescription: prompt,
          pageType: 'test',
          sectionName: 'test',
        });
        result = {
          model: 'claude-3-5-sonnet',
          response: claudeResponse,
          provider: 'Anthropic Direct',
        };
        break;

      default:
        return Response.json(
          { error: 'Invalid model. Use "openai" or "claude"' },
          { status: 400 }
        );
    }

    return Response.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error('Model test error:', error);
    return Response.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
