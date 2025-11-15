import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleSync } from "@/lib/integrations/gmail-multi-account";

/**
 * POST /api/integrations/gmail/toggle-sync
 * Enable or disable syncing for a Gmail account
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { integrationId, enabled } = await req.json();

    if (!integrationId || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Missing integrationId or enabled flag" },
        { status: 400 }
      );
    }

    await toggleSync(integrationId, enabled);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toggle sync error:", error);
    return NextResponse.json(
      { error: "Failed to toggle sync" },
      { status: 500 }
    );
  }
}
