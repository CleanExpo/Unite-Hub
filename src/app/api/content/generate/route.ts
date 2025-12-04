// src/app/api/content/generate/route.ts
// Generate content for a page

import { NextRequest, NextResponse } from 'next/server';

interface LLMResponse {
  response: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  cost_usd: number;
  routing: {
    model_slug: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { spec, config } = await request.json();

    if (!spec || !spec.id) {
      return NextResponse.json({ error: 'Page spec with id is required' }, { status: 400 });
    }

    const { ContentPipeline } = await import('@/lib/content/pipeline');

    // Create executeTask adapter
    async function executeTask(
      taskType: string,
      prompt: string,
      options?: { systemPrompt?: string }
    ) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/llm/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: taskType,
          content: prompt,
          system_prompt: options?.systemPrompt,
        }),
      });

      if (!res.ok) {
        throw new Error('LLM request failed');
      }

      const data: LLMResponse = await res.json();
      return {
        content: data.response,
        input_tokens: data.usage.input_tokens,
        output_tokens: data.usage.output_tokens,
        cost_usd: data.cost_usd,
        model_used: data.routing.model_slug,
      };
    }

    const pipeline = new ContentPipeline(
      {
        brand: config?.brand || 'synthex',
        dry_run: config?.dry_run || false,
        validate_seo: config?.validate_seo !== false,
        score_content: config?.score_content !== false,
        generate_schema: config?.generate_schema !== false,
      },
      executeTask
    );

    const result = await pipeline.generatePage(spec);

    return NextResponse.json({
      success: result.success,
      page: result.page,
      errors: result.errors,
      warnings: result.warnings,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[API] Content generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content', details: String(error) },
      { status: 500 }
    );
  }
}
