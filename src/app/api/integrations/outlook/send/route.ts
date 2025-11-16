import { NextRequest, NextResponse } from "next/server";
import { sendEmailViaOutlook } from "@/lib/integrations/outlook";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

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

    const { integrationId, to, subject, body, trackingPixelId } = await req.json();

    if (!integrationId || !to || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Send email
    const result = await sendEmailViaOutlook(
      integrationId,
      to,
      subject,
      body,
      trackingPixelId
    );

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Send email via Outlook error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
