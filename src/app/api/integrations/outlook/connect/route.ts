import { NextRequest, NextResponse } from "next/server";
import { getOutlookAuthUrl } from "@/lib/integrations/outlook";
import { authenticateRequest } from "@/lib/auth";
import { strictRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await strictRateLimit(req);
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

    const { orgId } = await req.json();

    // Create state with orgId
    const state = Buffer.from(orgId).toString("base64");

    // Get auth URL
    const authUrl = await getOutlookAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Outlook connect error:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
