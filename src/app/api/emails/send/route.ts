import { NextRequest, NextResponse } from "next/server";
import { sendEmailViaGmail } from "@/lib/integrations/gmail";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const { contentId, contactId, integrationId } = await req.json();

    const content = await db.content.getById(contentId);
    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const contact = await db.contacts.getById(contactId);
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const trackingPixelId = randomUUID();

    const result = await sendEmailViaGmail(
      integrationId,
      contact.email,
      content.subject_lines?.[0] || "Your Subject",
      content.generated_text,
      trackingPixelId
    );

    const sentEmail = await db.sentEmails.create({
      content_id: contentId,
      contact_id: contactId,
      subject_line: content.subject_lines?.[0],
      body: content.generated_text,
      email_provider: "gmail",
      tracking_pixel_id: trackingPixelId,
    });

    await db.content.updateStatus(contentId, "sent");

    return NextResponse.json({
      success: true,
      sentEmailId: sentEmail.id,
      messageId: result.messageId,
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
    console.error("Send error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send" },
      { status: 500 }
    );
  }
}
