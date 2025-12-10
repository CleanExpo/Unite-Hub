/**
 * OpenAI Responses API - Main Route Handler
 * POST /api/ai/responses - Create a new response
 * GET /api/ai/responses - Get input token counts
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { createResponse, getInputTokenCounts } from '@/lib/openai/responses/client';
import { CreateResponseRequest } from '@/lib/openai/responses/types';

/**
 * POST /api/ai/responses
 * Create a new OpenAI response
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      model = 'gpt-4o',
      input,
      instructions,
      background = false,
      conversation,
      previous_response_id,
      max_output_tokens,
      max_tool_calls,
      temperature = 1.0,
      top_p = 1.0,
      tools,
      tool_choice = 'auto',
      parallel_tool_calls = true,
      text,
      reasoning,
      stream = false,
      stream_options,
      truncation = 'disabled',
      store = true,
      metadata = {},
      include = [],
      service_tier = 'auto',
      safety_identifier,
      prompt,
      prompt_cache_key,
      prompt_cache_retention,
      top_logprobs,
    } = body;

    // Validate required fields
    if (!input && !previous_response_id) {
      return NextResponse.json(
        { error: 'Either input or previous_response_id is required' },
        { status: 400 }
      );
    }

    // Build request
    const requestData: CreateResponseRequest = {
      model,
      input,
      instructions,
      background,
      conversation,
      previous_response_id,
      max_output_tokens,
      max_tool_calls,
      temperature,
      top_p,
      tools,
      tool_choice,
      parallel_tool_calls,
      text,
      reasoning,
      stream,
      stream_options,
      truncation,
      store,
      metadata,
      include,
      service_tier,
      safety_identifier,
      prompt,
      prompt_cache_key,
      prompt_cache_retention,
      top_logprobs,
    };

    // Handle streaming responses
    if (stream) {
      const { createStreamingResponse, parseStreamingResponse } = await import(
        '@/lib/openai/responses/client'
      );
      const responseStream = await createStreamingResponse(requestData);

      // Create a readable stream for the client
      const readableStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of parseStreamingResponse(responseStream)) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
              );
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (error) {
            console.error('[OpenAI Responses API] Stream error:', error);
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const response = await createResponse(requestData);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[OpenAI Responses API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create response' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/responses?action=token-count
 * Get input token counts for estimation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action !== 'token-count') {
      return NextResponse.json(
        { error: 'Invalid action. Use action=token-count' },
        { status: 400 }
      );
    }

    // For GET requests, we need to pass data via query params or use POST
    // This is just a placeholder - typically you'd use POST for token counts
    return NextResponse.json(
      {
        message: 'Use POST /api/ai/responses/input-tokens to get token counts',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[OpenAI Responses API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
