/**
 * OpenAI Responses API - Input Token Counts
 * POST /api/ai/responses/input-tokens - Get token count estimates
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { getInputTokenCounts } from '@/lib/openai/responses/client';
import { GetInputTokenCountsRequest } from '@/lib/openai/responses/types';

/**
 * POST /api/ai/responses/input-tokens
 * Get input token counts before creating a response
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
      model,
      input,
      instructions,
      conversation,
      previous_response_id,
      reasoning,
      text,
      tool_choice,
      tools,
      truncation,
      parallel_tool_calls,
    } = body;

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    const requestData: GetInputTokenCountsRequest = {
      model,
      input,
      instructions,
      conversation,
      previous_response_id,
      reasoning,
      text,
      tool_choice,
      tools,
      truncation,
      parallel_tool_calls,
    };

    const response = await getInputTokenCounts(requestData);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[OpenAI Responses API] Get input token counts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get input token counts' },
      { status: 500 }
    );
  }
}
