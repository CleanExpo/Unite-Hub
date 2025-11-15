import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateAccountLabel } from "@/lib/integrations/gmail-multi-account";

/**
 * POST /api/integrations/gmail/update-label
 * Update account label for a Gmail integration
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { integrationId, label } = await req.json();

    if (!integrationId || typeof label !== "string") {
      return NextResponse.json(
        { error: "Missing integrationId or label" },
        { status: 400 }
      );
    }

    await updateAccountLabel(integrationId, label);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update label error:", error);
    return NextResponse.json(
      { error: "Failed to update label" },
      { status: 500 }
    );
  }
}
