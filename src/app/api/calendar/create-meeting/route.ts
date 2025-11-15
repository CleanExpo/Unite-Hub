import { NextRequest, NextResponse } from "next/server";
import { getCalendarService } from "@/lib/services/google-calendar";

export async function POST(request: NextRequest) {
  try {
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
        { error: "Calendar integration not found" },
        { status: 404 }
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
  } catch (error: any) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create meeting" },
      { status: 500 }
    );
  }
}
