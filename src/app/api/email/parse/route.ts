import { NextRequest, NextResponse } from "next/server";
import { gmailClient, parseGmailMessage } from "@/lib/gmail";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * POST /api/email/parse
 * Parse email content from Gmail message ID
 */

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, accessToken, refreshToken } = await req.json();

    if (!messageId || !accessToken || !refreshToken) {
      return NextResponse.json(
        { error: "Missing required fields: messageId, accessToken, refreshToken" },
        { status: 400 }
      );
    }

    // Get Gmail API client
    const gmail = gmailClient.getGmailAPI({ accessToken, refreshToken });

    // Fetch message
    const message = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    // Parse message
    const parsedEmail = parseGmailMessage(message.data);

    return NextResponse.json({
      success: true,
      email: {
        messageId: parsedEmail.messageId,
        threadId: parsedEmail.threadId,
        sender: {
          email: parsedEmail.senderEmail,
          name: parsedEmail.senderName,
        },
        subject: parsedEmail.subject,
        body: {
          html: parsedEmail.bodyHtml,
          plain: parsedEmail.bodyPlain,
        },
        receivedAt: parsedEmail.receivedAt,
        attachments: parsedEmail.attachments,
        headers: parsedEmail.headers,
      },
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse email" },
      { status: 500 }
    );
  }
}
