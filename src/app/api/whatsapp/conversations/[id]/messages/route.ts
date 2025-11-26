/**
 * WhatsApp Conversation Messages API
 * Get messages for a specific conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/workspace-validation';
import { db } from '@/lib/db';
import { apiRateLimit } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET - Get messages for a conversation
 */
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const params = await context.params;
    const conversationId = params.id;
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get conversation
    const conversation = await db.whatsappConversations.getById(conversationId);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Validate user authentication and workspace access
    await validateUserAndWorkspace(req, conversation.workspace_id);

    // Get messages
    const messages = await db.whatsappMessages.getByConversation(
      conversation.phone_number,
      conversation.workspace_id,
      limit
    );

    // Mark conversation as read
    await db.whatsappConversations.markAsRead(conversationId);

    return NextResponse.json({
      success: true,
      messages: messages.reverse(), // Oldest first
      conversation
    });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
