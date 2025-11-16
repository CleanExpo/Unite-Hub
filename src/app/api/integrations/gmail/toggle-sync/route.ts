import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { toggleSync } from "@/lib/integrations/gmail-multi-account";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/integrations/gmail/toggle-sync
 * Enable or disable syncing for a Gmail account
 */
export async function POST(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { userId } = authResult;

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
