/**
 * WhatsApp Conversation Messages API
 * Get messages for a specific conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { db } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET - Get messages for a conversation
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseServer();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get conversation
    const conversation = await db.whatsappConversations.getById(conversationId);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

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
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
