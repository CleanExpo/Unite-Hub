import { NextRequest, NextResponse } from "next/server";
import { suggestMeetingTimes } from "@/lib/agents/calendar-intelligence";
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
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error suggesting meeting times:", error);
    return NextResponse.json(
      { error: error.message || "Failed to suggest meeting times" },
      { status: 500 }
    );
  }
}
