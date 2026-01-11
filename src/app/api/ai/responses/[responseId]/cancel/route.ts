/**
 * OpenAI Responses API - Cancel Response
 * POST /api/ai/responses/[responseId]/cancel - Cancel a background response
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { cancelResponse } from '@/lib/openai/responses/client';

/**
 * POST /api/ai/responses/[responseId]/cancel
 * Cancel a background response
 */
export async function POST(
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

    const response = await cancelResponse(responseId);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[OpenAI Responses API] Cancel response error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel response' },
      { status: 500 }
    );
  }
}
