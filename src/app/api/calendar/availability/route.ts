import { NextRequest, NextResponse } from "next/server";
import { getCalendarService } from "@/lib/services/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const duration = parseInt(searchParams.get("duration") || "30");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    const calendarService = await getCalendarService(workspaceId);

    if (!calendarService) {
      return NextResponse.json({
        availableSlots: [],
        count: 0,
        message: "Calendar integration not connected",
      });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const availableSlots = await calendarService.findAvailableSlots(
      start,
      end,
      duration
    );

    return NextResponse.json({
      availableSlots,
      count: availableSlots.length,
      parameters: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        duration,
      },
    });
  } catch (error: any) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
