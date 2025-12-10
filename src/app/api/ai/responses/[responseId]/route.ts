/**
 * OpenAI Responses API - Individual Response Operations
 * GET /api/ai/responses/[responseId] - Get a response by ID
 * DELETE /api/ai/responses/[responseId] - Delete a response
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { getResponse, deleteResponse } from '@/lib/openai/responses/client';

/**
 * GET /api/ai/responses/[responseId]
 * Retrieve a response by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { responseId: string } }
) {
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

    const { responseId } = params;

    if (!responseId) {
      return NextResponse.json(
        { error: 'Response ID is required' },
        { status: 400 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const includeParam = searchParams.getAll('include');
    const includeObfuscation = searchParams.get('include_obfuscation') === 'true';
    const startingAfterParam = searchParams.get('starting_after');
    const streamParam = searchParams.get('stream') === 'true';

    const options: any = {};
    if (includeParam.length > 0) {
options.include = includeParam;
}
    if (includeObfuscation !== null) {
options.include_obfuscation = includeObfuscation;
}
    if (startingAfterParam) {
options.starting_after = parseInt(startingAfterParam);
}
    if (streamParam) {
options.stream = streamParam;
}

    const response = await getResponse(responseId, options);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[OpenAI Responses API] Get response error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get response' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai/responses/[responseId]
 * Delete a response by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { responseId: string } }
) {
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

    const { responseId } = params;

    if (!responseId) {
      return NextResponse.json(
        { error: 'Response ID is required' },
        { status: 400 }
      );
    }

    const response = await deleteResponse(responseId);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[OpenAI Responses API] Delete response error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete response' },
      { status: 500 }
    );
  }
}
