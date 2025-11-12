import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integrations = await db.emailIntegrations.getByOrg("default-org");

    return NextResponse.json({
      success: true,
      integrations: integrations.map((i) => ({
        id: i.id,
        provider: i.provider,
        account_email: i.account_email,
        is_active: i.is_active,
        last_sync_at: i.last_sync_at,
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to list integrations" },
      { status: 500 }
    );
  }
}
