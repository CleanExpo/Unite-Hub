import { NextRequest, NextResponse } from "next/server";
import { detectMeetingIntent, autoRespondToMeetingRequest } from "@/lib/agents/calendar-intelligence";
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
    const { emailBody, subject, emailId, workspaceId, autoRespond } = body;

    if (!emailBody || !subject) {
      return NextResponse.json(
        { error: "Email body and subject are required" },
        { status: 400 }
      );
    }

    const meetingIntent = await detectMeetingIntent(emailBody, subject);

    // If auto-respond is enabled and it's a meeting request
    let responseEmail = null;
    if (autoRespond && meetingIntent.isMeetingRequest && emailId && workspaceId) {
      try {
        responseEmail = await autoRespondToMeetingRequest(
          workspaceId,
          emailId,
          meetingIntent
        );
      } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error auto-responding:", error);
      }
    }

    return NextResponse.json({
      success: true,
      meetingIntent,
      responseEmail,
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
    console.error("Error detecting meeting intent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to detect meeting intent" },
      { status: 500 }
    );
  }
}
