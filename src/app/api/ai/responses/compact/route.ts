/**
 * OpenAI Responses API - Compact Response
 * POST /api/ai/responses/compact - Compress conversation history
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { compactResponse } from '@/lib/openai/responses/client';
import { CompactResponseRequest } from '@/lib/openai/responses/types';

/**
 * POST /api/ai/responses/compact
 * Run a compaction pass over a conversation
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
    const { model, input, instructions, previous_response_id } = body;

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    const requestData: CompactResponseRequest = {
      model,
      input,
      instructions,
      previous_response_id,
    };

    const response = await compactResponse(requestData);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[OpenAI Responses API] Compact response error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compact response' },
      { status: 500 }
    );
  }
}
