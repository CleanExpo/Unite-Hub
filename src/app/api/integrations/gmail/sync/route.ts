import { NextRequest, NextResponse } from "next/server";
import { syncGmailEmails } from "@/lib/integrations/gmail";
import { analyzeWorkspaceContacts } from "@/lib/agents/contact-intelligence";
import { validateUserAuth, validateWorkspaceAccess } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(req);

    const { integrationId, workspaceId } = await req.json();

    // Validate workspace access
    await validateWorkspaceAccess(workspaceId, user.orgId);

    // Sync emails
    const syncResult = await syncGmailEmails(integrationId);

    // Auto-analyze new contacts
    if (syncResult.imported > 0) {
      await analyzeWorkspaceContacts(workspaceId);
    }

    return NextResponse.json({
      success: true,
      imported: syncResult.imported,
      total: syncResult.total,
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
    console.error("Gmail sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
