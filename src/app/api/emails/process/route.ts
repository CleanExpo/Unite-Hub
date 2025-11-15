import { NextRequest, NextResponse } from "next/server";
import { batchProcessEmails, processEmail } from "@/lib/agents/email-processor";

export async function POST(request: NextRequest) {
  try {
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
    console.error("Error processing emails:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process emails" },
      { status: 500 }
    );
  }
}
