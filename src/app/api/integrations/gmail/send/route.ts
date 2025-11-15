import { NextRequest, NextResponse } from "next/server";
import { sendEmailViaGmail } from "@/lib/integrations/gmail";
import { db } from "@/lib/db";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userOrg, error: orgError } = await supabase
      .from("user_organizations")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (orgError || !userOrg) {
      return NextResponse.json({ error: "No active organization found" }, { status: 403 });
    }

    const { accessToken, to, subject, body, workspaceId } = await request.json();

    if (!accessToken || !to || !subject || !body) {
      return NextResponse.json(
        { error: "Access token, recipient, subject, and body are required" },
        { status: 400 }
      );
    }

    // Validate workspace access if provided
    if (workspaceId) {
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("id", workspaceId)
        .eq("org_id", userOrg.org_id)
        .single();

      if (workspaceError || !workspace) {
        return NextResponse.json({ error: "Invalid workspace or access denied" }, { status: 403 });
      }
    }

    // Send email via Gmail
    const result = await sendEmailViaGmail(accessToken, to, subject, body);

    // Log the send operation
    if (workspaceId) {
      await db.auditLogs.create({
        org_id: workspaceId,
        action: "gmail.email_sent",
        resource: "email",
        resource_id: result.id || "unknown",
        agent: "gmail-integration",
        status: "success",
        details: {
          to,
          subject,
          message_id: result.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      messageId: result.id,
      message: "Email sent successfully",
    });
  } catch (error: any) {
    console.error("Gmail send error:", error);

    // Log the failure
    try {
      await db.auditLogs.create({
        org_id: "system",
        action: "gmail.email_send_failed",
        resource: "email",
        resource_id: "unknown",
        agent: "gmail-integration",
        status: "failed",
        details: {
          error: error.message,
        },
      });
    } catch (logError) {
      console.error("Failed to log audit:", logError);
    }

    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
