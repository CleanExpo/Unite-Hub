import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { integrationId } = await req.json();

    if (!integrationId) {
      return NextResponse.json(
        { error: "Integration ID required" },
        { status: 400 }
      );
    }

    // Verify integration belongs to user's org
    const integration = await db.emailIntegrations.getById(integrationId);
    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    // Deactivate integration instead of deleting (preserve data)
    await db.emailIntegrations.update(integrationId, {
      is_active: false,
    });

    return NextResponse.json({
      success: true,
      message: "Outlook account disconnected",
    });
  } catch (error) {
    console.error("Outlook disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Outlook account" },
      { status: 500 }
    );
  }
}
