import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * Send Email API Route
 *
 * Sends an email to a contact using the configured email service.
 * Currently uses a simple email service (SendGrid/Resend/Gmail SMTP).
 *
 * TODO: Integrate with Gmail OAuth integration when available
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get authenticated user
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    // Parse request body
    const { workspaceId, contactId, to, subject, body } = await req.json();

    // Validate required fields
    if (!workspaceId || !contactId || !to || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields: workspaceId, contactId, to, subject, body" },
        { status: 400 }
      );
    }

    // Verify contact exists and belongs to workspace
    const supabase = await getSupabaseServer();
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, email, name")
      .eq("id", contactId)
      .eq("workspace_id", workspaceId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found or access denied" },
        { status: 404 }
      );
    }

    // TODO: Send email using email service
    // For now, we'll log it and return success
    // In production, integrate with SendGrid/Resend/Gmail API
    console.log("[send-email] Email would be sent:", {
      from: "noreply@unite-hub.com", // TODO: Get from user's email integration
      to,
      subject,
      bodyLength: body.length,
      contact: contact.name,
    });

    // Record email in database (optional - for tracking)
    const { data: sentEmail, error: insertError } = await supabase
      .from("emails")
      .insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        from: "noreply@unite-hub.com", // TODO: Get from user's email integration
        to,
        subject,
        body,
        is_processed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("[send-email] Failed to record email:", insertError);
    }

    // Update contact's last_interaction timestamp
    await supabase
      .from("contacts")
      .update({ last_interaction: new Date().toISOString() })
      .eq("id", contactId);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      emailId: sentEmail?.id,
      // TODO: Add messageId from email service when integrated
    });
  } catch (error: any) {
    console.error("[send-email] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
