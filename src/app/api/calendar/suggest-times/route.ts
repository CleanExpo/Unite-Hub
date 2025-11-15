import { NextRequest, NextResponse } from "next/server";
import { suggestMeetingTimes } from "@/lib/agents/calendar-intelligence";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId,
      contactName,
      contactEmail,
      purpose,
      duration,
      preferredTimeframe,
      urgency,
    } = body;

    if (!workspaceId || !contactEmail || !purpose) {
      return NextResponse.json(
        { error: "Workspace ID, contact email, and purpose are required" },
        { status: 400 }
      );
    }

    const suggestion = await suggestMeetingTimes(workspaceId, {
      contactName: contactName || "there",
      contactEmail,
      purpose,
      duration: duration || 30,
      preferredTimeframe,
      urgency: urgency || "medium",
    });

    return NextResponse.json({
      success: true,
      suggestion,
    });
  } catch (error: any) {
    console.error("Error suggesting meeting times:", error);
    return NextResponse.json(
      { error: error.message || "Failed to suggest meeting times" },
      { status: 500 }
    );
  }
}
