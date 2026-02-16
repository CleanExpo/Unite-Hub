import { NextRequest, NextResponse } from "next/server";
import { sendEmailViaGmail } from "@/lib/integrations/gmail";
import { db } from "@/lib/db";
import { validateUserAuth, validateWorkspaceAccess } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const { accessToken, to, subject, body, workspaceId } = await request.json();

    if (!accessToken || !to || !subject || !body) {
      return NextResponse.json(
        { error: "Access token, recipient, subject, and body are required" },
        { status: 400 }
      );
    }

    // Validate workspace access if provided
    if (workspaceId) {
      await validateWorkspaceAccess(workspaceId, user.orgId);
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

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
