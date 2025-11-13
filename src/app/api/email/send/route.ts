import { NextRequest, NextResponse } from "next/server";
import { sendEmail, addTrackingPixel } from "@/lib/gmail";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * POST /api/email/send
 * Send email via Gmail API
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const {
      clientId,
      to,
      subject,
      bodyHtml,
      bodyPlain,
      cc,
      bcc,
      replyTo,
      enableTracking,
    } = await req.json();

    if (!clientId || !to || !subject || (!bodyHtml && !bodyPlain)) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, to, subject, body" },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await convex.query(api.clients.get, { id: clientId });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get OAuth credentials
    const credentials = {
      accessToken: process.env.GMAIL_ACCESS_TOKEN!,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN!,
    };

    // Generate tracking pixel if enabled
    let finalBodyHtml = bodyHtml;
    let trackingPixelId = null;

    if (enableTracking && bodyHtml) {
      trackingPixelId = generateTrackingId();
      const trackingUrl = `${process.env.NEXT_PUBLIC_URL}/api/tracking/pixel/${trackingPixelId}`;
      finalBodyHtml = addTrackingPixel(bodyHtml, trackingUrl);
    }

    // Send email
    const result = await sendEmail(credentials.accessToken, credentials.refreshToken, {
      to,
      cc,
      bcc,
      subject,
      bodyHtml: finalBodyHtml,
      bodyPlain,
      replyTo,
    });

    // Store email in database
    const emailThread = await convex.mutation(api.emailThreads.create, {
      clientId,
      senderEmail: process.env.GMAIL_INBOX_EMAIL || "contact@unite-group.in",
      senderName: "Unite Group",
      subject,
      messageBody: finalBodyHtml || bodyPlain,
      messageBodyPlain: bodyPlain || stripHtml(finalBodyHtml || ""),
      attachments: [],
      receivedAt: Date.now(),
      autoReplySent: true,
      autoReplyContent: finalBodyHtml || bodyPlain,
      autoReplySentAt: Date.now(),
      gmailMessageId: result.messageId,
      gmailThreadId: result.threadId,
      isRead: true,
    });

    // Store auto-reply record
    await convex.mutation(api.autoReplies.create, {
      emailThreadId: emailThread,
      clientId,
      questionsGenerated: [],
      autoReplyContent: finalBodyHtml || bodyPlain,
      sentAt: Date.now(),
      responseReceived: false,
      metadata: {
        trackingPixelId,
        sentVia: "gmail-api",
      },
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
      emailThreadId: emailThread,
      trackingPixelId,
    });
  } catch (error) {
    console.error("Send error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}

/**
 * Generate unique tracking ID
 */
function generateTrackingId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Strip HTML tags (simple implementation)
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}
