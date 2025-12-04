// src/app/api/llm/route/route.ts
// Route a task to optimal model and execute

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const taskType = body.task_type;
    const content = body.content;
    const systemPrompt = body.system_prompt;
    const options = body.options;

    if (!taskType || !content) {
      return NextResponse.json(
        { error: 'task_type and content are required' },
        { status: 400 }
      );
    }

    // Dynamic import to avoid build issues
    const { routeTask, MODEL_REGISTRY, OpenRouterClient } = await import('@/lib/llm/orchestrator');

    // Get routing recommendation
    const routing = routeTask(taskType);
    const model = MODEL_REGISTRY[routing.model_id];

    if (!model) {
      return NextResponse.json({ error: 'No suitable model found' }, { status: 500 });
    }

    // Execute via OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
    }

    const client = new OpenRouterClient(apiKey);
    const messages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content });

    const response = await client.chat(model.openrouter_slug, messages, {
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 4000,
    });

    return NextResponse.json({
      success: true,
      routing: {
        model_id: routing.model_id,
        model_slug: routing.model_slug,
        model_label: model.label,
        quality_score: routing.quality_score,
        reasoning: routing.reasoning,
      },
      response: response.content,
      usage: {
        input_tokens: response.input_tokens,
        output_tokens: response.output_tokens,
        total_tokens: response.input_tokens + response.output_tokens,
      },
      cost_usd: response.cost_usd,
      latency_ms: response.latency_ms,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[API] LLM route error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 }
    );
  }
}
