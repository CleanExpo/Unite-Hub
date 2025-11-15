import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncAllGmailAccounts } from "@/lib/integrations/gmail-multi-account";

/**
 * POST /api/integrations/gmail/sync-all
 * Sync emails from all enabled Gmail accounts in a workspace
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Missing workspaceId" },
        { status: 400 }
      );
    }

    const results = await syncAllGmailAccounts(workspaceId);

    const totalImported = results.reduce(
      (sum, r) => sum + (r.imported || 0),
      0
    );
    const errors = results.filter((r) => r.error);

    return NextResponse.json({
      success: true,
      totalImported,
      results,
      hasErrors: errors.length > 0,
      errors: errors.map((e) => ({
        email: e.email,
        error: e.error,
      })),
    });
  } catch (error) {
    console.error("Sync all error:", error);
    return NextResponse.json(
      { error: "Failed to sync accounts" },
      { status: 500 }
    );
  }
}
