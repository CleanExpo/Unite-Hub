import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth } from "@/lib/workspace-validation";
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

    // Validate user authentication
    const user = await validateUserAuth(req);

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
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Toggle sync error:", error);
    return NextResponse.json(
      { error: "Failed to toggle sync" },
      { status: 500 }
    );
  }
}
