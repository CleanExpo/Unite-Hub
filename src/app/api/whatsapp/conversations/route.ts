/**
 * WhatsApp Conversations API
 * List and manage WhatsApp conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/workspace-validation';
import { db } from '@/lib/db';
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * GET - List WhatsApp conversations
 */
export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status') || undefined;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Validate user authentication and workspace access
    await validateUserAndWorkspace(req, workspaceId);

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
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
