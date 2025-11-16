import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { setPrimaryAccount } from "@/lib/integrations/gmail-multi-account";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/integrations/gmail/set-primary
 * Set an integration as the primary account for sending emails
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
