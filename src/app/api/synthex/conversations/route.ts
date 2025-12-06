/**
 * Synthex Conversation Intelligence API
 * Phase B17: Conversation list and ingestion endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getConversations,
  ingestConversationEvent,
  type ConversationFilters,
  type ConversationEventPayload,
} from '@/lib/synthex/conversationService';

/**
 * GET /api/synthex/conversations
 * List conversations for a tenant with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { status: 'error', error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Build filters from query params
    const filters: ConversationFilters = {};

    const channel = searchParams.get('channel');
    if (channel) filters.channel = channel;

    const status = searchParams.get('status');
    if (status) filters.status = status;

    const sentiment = searchParams.get('sentiment');
    if (sentiment) filters.sentiment = sentiment;

    const contactId = searchParams.get('contactId');
    if (contactId) filters.contactId = contactId;

    const owner = searchParams.get('owner');
    if (owner) filters.primaryOwner = owner;

    const search = searchParams.get('search');
    if (search) filters.search = search;

    const limit = searchParams.get('limit');
    if (limit) filters.limit = parseInt(limit, 10);

    const offset = searchParams.get('offset');
    if (offset) filters.offset = parseInt(offset, 10);

    const result = await getConversations(tenantId, filters);

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      conversations: result.data,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('[Conversations API] GET error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthex/conversations
 * Ingest a new conversation event (message, conversation update, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, ...payload } = body;

    if (!tenantId) {
      return NextResponse.json(
        { status: 'error', error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Validate required payload fields
    if (!payload.channel) {
      return NextResponse.json(
        { status: 'error', error: 'channel is required' },
        { status: 400 }
      );
    }

    if (!payload.sender) {
      return NextResponse.json(
        { status: 'error', error: 'sender is required' },
        { status: 400 }
      );
    }

    if (!payload.body) {
      return NextResponse.json(
        { status: 'error', error: 'body (message content) is required' },
        { status: 400 }
      );
    }

    const eventPayload: ConversationEventPayload = {
      conversationExternalId: payload.conversationExternalId,
      messageExternalId: payload.messageExternalId,
      channel: payload.channel,
      direction: payload.direction || 'inbound',
      sender: payload.sender,
      senderName: payload.senderName,
      subject: payload.subject,
      body: payload.body,
      bodyHtml: payload.bodyHtml,
      attachments: payload.attachments,
      headers: payload.headers,
      contactId: payload.contactId,
      contactEmail: payload.contactEmail,
      occurredAt: payload.occurredAt,
      // Call-specific fields
      callDurationSeconds: payload.callDurationSeconds,
      callRecordingUrl: payload.callRecordingUrl,
      transcript: payload.transcript,
    };

    const result = await ingestConversationEvent(tenantId, eventPayload);

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      conversationId: result.data?.conversationId,
      messageId: result.data?.messageId,
      isNew: result.data?.isNew,
    });
  } catch (error) {
    console.error('[Conversations API] POST error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to ingest conversation event' },
      { status: 500 }
    );
  }
}
