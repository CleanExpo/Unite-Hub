import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { disconnectGmailAccount } from "@/lib/integrations/gmail-multi-account";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/integrations/gmail/disconnect
 * Disconnect a Gmail account
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
