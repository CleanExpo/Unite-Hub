import { NextRequest, NextResponse } from "next/server";
import { getOutlookCalendarEvents } from "@/lib/integrations/outlook";
import { validateUserAuth } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(req);

    const { searchParams } = new URL(req.url);
    const integrationId = searchParams.get("integrationId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!integrationId) {
      return NextResponse.json(
        { error: "Integration ID required" },
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

    // Get calendar events
    const events = await getOutlookCalendarEvents(
      integrationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Get calendar events error:", error);
    return NextResponse.json(
      { error: "Failed to get calendar events" },
      { status: 500 }
    );
  }
}
