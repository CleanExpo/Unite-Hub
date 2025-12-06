/**
 * Synthex Conversation Analysis API
 * Phase B17: AI-powered conversation analysis endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeConversationWithAI,
  getConversationDetail,
  ingestConversationEvent,
} from '@/lib/synthex/conversationService';

/**
 * POST /api/synthex/conversations/analyze
 * Analyze a conversation with AI to generate insights
 *
 * Two modes:
 * 1. { tenantId, conversationId } - Analyze existing conversation
 * 2. { tenantId, transcript, channel } - Analyze raw transcript (creates temporary conversation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, conversationId, transcript, channel } = body;

    if (!tenantId) {
      return NextResponse.json(
        { status: 'error', error: 'tenantId is required' },
        { status: 400 }
      );
    }

    let targetConversationId = conversationId;

    // If transcript provided instead of conversationId, ingest it first
    if (!conversationId && transcript) {
      const channelType = channel || 'other';

      // Ingest the transcript as a conversation
      const ingestResult = await ingestConversationEvent(tenantId, {
        channel: channelType,
        direction: 'inbound',
        sender: 'transcript-import',
        senderName: 'Imported Transcript',
        body: transcript,
        subject: 'Imported Transcript Analysis',
      });

      if (!ingestResult.success) {
        return NextResponse.json(
          { status: 'error', error: `Failed to ingest transcript: ${ingestResult.error}` },
          { status: 500 }
        );
      }

      targetConversationId = ingestResult.data?.conversationId;
    }

    if (!targetConversationId) {
      return NextResponse.json(
        { status: 'error', error: 'Either conversationId or transcript is required' },
        { status: 400 }
      );
    }

    // First verify the conversation exists
    const detailResult = await getConversationDetail(tenantId, targetConversationId);
    if (!detailResult.success) {
      return NextResponse.json(
        { status: 'error', error: `Conversation not found: ${detailResult.error}` },
        { status: 404 }
      );
    }

    // Run AI analysis
    const analysisResult = await analyzeConversationWithAI(tenantId, targetConversationId);

    if (!analysisResult.success) {
      return NextResponse.json(
        { status: 'error', error: `Analysis failed: ${analysisResult.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      conversationId: targetConversationId,
      insight: analysisResult.data,
    });
  } catch (error) {
    console.error('[Conversations Analyze API] POST error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to analyze conversation' },
      { status: 500 }
    );
  }
}
