/**
 * OpenAI Responses API - List Input Items
 * GET /api/ai/responses/[responseId]/input-items - List input items for a response
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit } from '@/lib/rate-limit';
import { listInputItems } from '@/lib/openai/responses/client';
import { ListInputItemsRequest } from '@/lib/openai/responses/types';

/**
 * GET /api/ai/responses/[responseId]/input-items
 * List input items for a response
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
    const after = searchParams.get('after') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 20;
    const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';
    const includeParam = searchParams.getAll('include');

    const requestData: ListInputItemsRequest = {
      response_id: responseId,
      after,
      limit,
      order,
      include: includeParam.length > 0 ? includeParam : undefined,
    };

    const response = await listInputItems(requestData);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[OpenAI Responses API] List input items error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list input items' },
      { status: 500 }
    );
  }
}
