import { NextRequest, NextResponse } from "next/server";
import { createOutlookCalendarEvent } from "@/lib/integrations/outlook";
import { validateUserAuth } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(req);

    const {
      integrationId,
      subject,
      start,
      end,
      location,
      body,
      attendees,
    } = await req.json();

    if (!integrationId || !subject || !start || !end) {
      return NextResponse.json(
        { error: "Missing required fields (integrationId, subject, start, end)" },
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

    // Create calendar event
    const result = await createOutlookCalendarEvent(integrationId, {
      subject,
      start: new Date(start),
      end: new Date(end),
      location,
      body,
      attendees,
    });

    return NextResponse.json({
      success: true,
      eventId: result.id,
      webLink: result.webLink,
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
    console.error("Create calendar event error:", error);
    return NextResponse.json(
      { error: "Failed to create calendar event" },
      { status: 500 }
    );
  }
}
