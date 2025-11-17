import { NextRequest, NextResponse } from "next/server";
import { batchProcessEmails, processEmail } from "@/lib/agents/email-processor";
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
    const { workspaceId, emailId, batch, limit } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    // Process single email
    if (emailId) {
      const result = await processEmail(emailId, workspaceId);

      return NextResponse.json({
        success: true,
        result,
      });
    }

    // Batch process emails
    if (batch) {
      const result = await batchProcessEmails(workspaceId, limit || 20);

      return NextResponse.json({
        success: true,
        result,
      });
    }

    return NextResponse.json(
      { error: "Either emailId or batch=true must be provided" },
      { status: 400 }
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
    console.error("Error processing emails:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process emails" },
      { status: 500 }
    );
  }
}
