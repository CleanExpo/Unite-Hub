import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setPrimaryAccount } from "@/lib/integrations/gmail-multi-account";

/**
 * POST /api/integrations/gmail/set-primary
 * Set an integration as the primary account for sending emails
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, integrationId } = await req.json();

    if (!workspaceId || !integrationId) {
      return NextResponse.json(
        { error: "Missing workspaceId or integrationId" },
        { status: 400 }
      );
    }

    await setPrimaryAccount(workspaceId, integrationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set primary error:", error);
    return NextResponse.json(
      { error: "Failed to set primary account" },
      { status: 500 }
    );
  }
}
