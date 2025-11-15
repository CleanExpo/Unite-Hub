import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { disconnectGmailAccount } from "@/lib/integrations/gmail-multi-account";

/**
 * POST /api/integrations/gmail/disconnect
 * Disconnect a Gmail account
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { integrationId } = await req.json();

    if (!integrationId) {
      return NextResponse.json(
        { error: "Missing integrationId" },
        { status: 400 }
      );
    }

    await disconnectGmailAccount(integrationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 }
    );
  }
}
