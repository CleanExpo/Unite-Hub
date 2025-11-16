import { NextRequest, NextResponse } from "next/server";
import { getCalendarService } from "@/lib/services/google-calendar";
import { supabase } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const timeMin = searchParams.get("timeMin");
    const timeMax = searchParams.get("timeMax");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    const calendarService = await getCalendarService(workspaceId);

    // Return empty array if no integration exists (graceful degradation)
    if (!calendarService) {
      return NextResponse.json({
        events: [],
        count: 0,
        message: "Calendar integration not connected",
      });
    }

    const defaultTimeMin = timeMin || new Date().toISOString();
    const defaultTimeMax = timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const events = await calendarService.listEvents(
      defaultTimeMin,
      defaultTimeMax
    );

    return NextResponse.json({
      events,
      count: events.length,
    });
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);

    // Return empty array on error instead of 500 (graceful degradation)
    return NextResponse.json({
      events: [],
      count: 0,
      error: error.message || "Failed to fetch calendar events",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, event } = body;

    if (!workspaceId || !event) {
      return NextResponse.json(
        { error: "Workspace ID and event data are required" },
        { status: 400 }
      );
    }

    const calendarService = await getCalendarService(workspaceId);

    if (!calendarService) {
      return NextResponse.json(
        { error: "Calendar integration not connected. Please connect your Google account first." },
        { status: 403 }
      );
    }

    const createdEvent = await calendarService.createEvent(event);

    return NextResponse.json({
      success: true,
      event: createdEvent,
    });
  } catch (error: any) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create calendar event" },
      { status: 500 }
    );
  }
}
