import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthUrl } from "@/lib/integrations/gmail-multi-account";
import { auth } from "@/lib/auth";

/**
 * POST /api/integrations/gmail/connect-multi
 * Generate OAuth URL for adding Gmail account (supports multiple accounts)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId, workspaceId } = await req.json();

    if (!orgId || !workspaceId) {
      return NextResponse.json(
        { error: "Missing orgId or workspaceId" },
        { status: 400 }
      );
    }

    // Encode state with both orgId and workspaceId
    const state = Buffer.from(
      JSON.stringify({ orgId, workspaceId })
    ).toString("base64");

    // Get auth URL (with prompt=select_account for multi-account support)
    const authUrl = await getGmailAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Gmail connect error:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
