import { NextRequest, NextResponse } from "next/server";
import { sendEmail, addTrackingPixel } from "@/lib/gmail";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";
import { GmailSendEmailSchema, formatZodError } from "@/lib/validation/schemas";

/**
 * POST /api/email/send
 * Send email via Gmail API
 */

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json();

    // Validate request body
    const validationResult = GmailSendEmailSchema.safeParse({
      to: body.to,
      subject: body.subject,
      body: body.bodyHtml || body.bodyPlain,
      workspace_id: body.workspaceId,
      contact_id: body.contactId || body.clientId, // Support legacy clientId
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: formatZodError(validationResult.error),
        },
        { status: 400 }
      );
    }

    const {
      to,
      subject,
      workspace_id: workspaceId,
      contact_id: contactId,
    } = validationResult.data;

    const {
      bodyHtml,
      bodyPlain,
      cc,
      bcc,
      replyTo,
      enableTracking,
    } = body;

    // Validate user authentication and workspace access
    await validateUserAndWorkspace(req, workspaceId);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Verify contact exists if provided
    if (contactId) {
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .select("id")
        .eq("id", contactId)
        .eq("workspace_id", workspaceId)
        .single();

      if (contactError || !contact) {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
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

    // Send email via Gmail
    const result = await sendEmail(credentials.accessToken, credentials.refreshToken, {
      to,
      cc,
      bcc,
      subject,
      bodyHtml: finalBodyHtml,
      bodyPlain,
      replyTo,
    });

    // Store sent email in database
    const { data: sentEmail, error: emailError } = await supabase
      .from("sent_emails")
      .insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        to_email: to,
        from_email: process.env.GMAIL_INBOX_EMAIL || "contact@unite-group.in",
        subject,
        body: finalBodyHtml || bodyPlain,
        body_plain: bodyPlain || stripHtml(finalBodyHtml || ""),
        cc: cc ? [cc] : null,
        bcc: bcc ? [bcc] : null,
        reply_to: replyTo,
        external_id: result.messageId,
        thread_id: result.threadId,
        status: "sent",
        sent_at: new Date().toISOString(),
        tracking_enabled: enableTracking || false,
        tracking_pixel_id: trackingPixelId,
        metadata: {
          sentVia: "gmail-api",
          trackingPixelId,
        },
      })
      .select()
      .single();

    if (emailError) {
      console.error("Failed to store email:", emailError);
      // Don't fail the request if storage fails - email was sent successfully
    }

    // Also store in emails table for unified inbox
    if (sentEmail) {
      await supabase
        .from("emails")
        .insert({
          workspace_id: workspaceId,
          contact_id: contactId,
          from: process.env.GMAIL_INBOX_EMAIL || "contact@unite-group.in",
          to,
          subject,
          body: finalBodyHtml || bodyPlain,
          ai_summary: null,
          is_processed: true,
          created_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
      emailId: sentEmail?.id,
      trackingPixelId,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
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
