import { NextRequest, NextResponse } from "next/server";
import { syncGmailEmails } from "@/lib/integrations/gmail";
import { analyzeWorkspaceContacts } from "@/lib/agents/contact-intelligence";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { integrationId, workspaceId } = await req.json();

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
    console.error("Gmail sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
