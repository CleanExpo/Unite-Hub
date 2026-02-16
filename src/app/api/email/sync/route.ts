import { NextRequest, NextResponse } from "next/server";
import { syncUnreadEmails } from "@/lib/gmail/processor";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";

/**
 * POST /api/email/sync
 * Manually trigger email sync from Gmail
 */

export async function POST(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

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

    const { orgId } = await req.json();

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }

    // Verify user has access to this organization
    if (orgId !== userOrg.org_id) {
      return NextResponse.json({ error: "Access denied to this organization" }, { status: 403 });
    }

    // Get credentials from environment
    const accessToken = process.env.GMAIL_ACCESS_TOKEN;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: "Gmail credentials not configured" },
        { status: 500 }
      );
    }

    // Sync unread emails
    const result = await syncUnreadEmails(accessToken, refreshToken, orgId);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
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
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
