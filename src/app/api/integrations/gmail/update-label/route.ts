import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth } from "@/lib/workspace-validation";
import { updateAccountLabel } from "@/lib/integrations/gmail-multi-account";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/integrations/gmail/update-label
 * Update account label for a Gmail integration
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
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Update label error:", error);
    return NextResponse.json(
      { error: "Failed to update label" },
      { status: 500 }
    );
  }
}
