/**
 * Synthex Conversation Detail API
 * Phase B17: Single conversation detail endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConversationDetail } from '@/lib/synthex/conversationService';

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

/**
 * GET /api/synthex/conversations/[conversationId]
 * Get a single conversation with messages and latest insight
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { status: 'error', error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { status: 'error', error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const result = await getConversationDetail(tenantId, conversationId);

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 404 }
      );
    }

    const detail = result.data;

    return NextResponse.json({
      status: 'ok',
      conversation: detail?.conversation || null,
      messages: detail?.messages || [],
      insight: detail?.latestInsight || null,
    });
  } catch (error) {
    console.error('[Conversation Detail API] GET error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to fetch conversation detail' },
      { status: 500 }
    );
  }
}
