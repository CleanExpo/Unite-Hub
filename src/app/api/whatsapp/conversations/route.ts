/**
 * WhatsApp Conversations API
 * List and manage WhatsApp conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { db } from '@/lib/db';

/**
 * GET - List WhatsApp conversations
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status') || undefined;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Get conversations
    const conversations = await db.whatsappConversations.listByWorkspace(workspaceId, status);

    // Get message counts for each conversation
    const conversationsWithCounts = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await db.whatsappMessages.getByConversation(
          conv.phone_number,
          workspaceId,
          1 // Just get the latest message
        );

        return {
          ...conv,
          last_message: messages[0] || null
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: conversationsWithCounts
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
