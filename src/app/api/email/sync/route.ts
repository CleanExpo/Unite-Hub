import { NextRequest, NextResponse } from "next/server";
import { syncUnreadEmails } from "@/lib/gmail/processor";

/**
 * POST /api/email/sync
 * Manually trigger email sync from Gmail
 */

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await req.json();

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
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
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
