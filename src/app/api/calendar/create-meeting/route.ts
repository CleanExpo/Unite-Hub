import { NextRequest, NextResponse } from "next/server";
import { getCalendarService } from "@/lib/services/google-calendar";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";

export async function POST(request: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const body = await request.json();
    const {
      workspaceId,
      summary,
      description,
      start,
      end,
      attendees,
      withMeet,
    } = body;

    if (!workspaceId || !summary || !start || !end) {
      return NextResponse.json(
        { error: "Workspace ID, summary, start, and end times are required" },
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

    let event;

    if (withMeet) {
      // Create meeting with Google Meet link
      event = await calendarService.createMeetingWithConference(
        summary,
        start,
        end,
        attendees || [],
        description
      );
    } else {
      // Create regular event
      event = await calendarService.createEvent({
        summary,
        description,
        start: {
          dateTime: start,
          timeZone: "America/New_York",
        },
        end: {
          dateTime: end,
          timeZone: "America/New_York",
        },
        attendees: attendees?.map((email: string) => ({ email })),
      });
    }

    return NextResponse.json({
      success: true,
      event,
      meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create meeting" },
      { status: 500 }
    );
  }
}
