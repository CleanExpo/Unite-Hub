import { NextRequest, NextResponse } from "next/server";
import { handleGmailCallback } from "@/lib/integrations/gmail";
import { authenticateRequest } from "@/lib/auth";
import { strictRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await strictRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const authResult = await authenticateRequest(req);
    if (!session?.user?.id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/auth/signin?error=unauthorized`
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?error=missing_params`
      );
    }

    // Decode state to get orgId
    const orgId = Buffer.from(state, "base64").toString();

    // Handle callback
    const integration = await handleGmailCallback(code, orgId);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?gmail_connected=true&integration=${integration.id}`
    );
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?error=gmail_connection_failed`
    );
  }
}
