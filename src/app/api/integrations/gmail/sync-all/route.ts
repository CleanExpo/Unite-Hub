import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth, validateWorkspaceAccess } from "@/lib/workspace-validation";
import { syncAllGmailAccounts } from "@/lib/integrations/gmail-multi-account";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/integrations/gmail/sync-all
 * Sync emails from all enabled Gmail accounts in a workspace
 */
export async function POST(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(req);

    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Missing workspaceId" },
        { status: 400 }
      );
    }

    // Validate workspace belongs to user's organization
    await validateWorkspaceAccess(workspaceId, user.orgId);

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
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Sync all error:", error);
    return NextResponse.json(
      { error: "Failed to sync accounts" },
      { status: 500 }
    );
  }
}
