import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";

// PUT /api/contacts/[contactId]/emails/[emailId]/primary - Set email as primary
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string; emailId: string }> }
) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const { contactId, emailId } = await params;

    const updatedEmail = await db.clientEmails.setPrimary(emailId, contactId);

    return NextResponse.json({ email: updatedEmail });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error setting primary email:", error);
    return NextResponse.json(
      { error: "Failed to set primary email" },
      { status: 500 }
    );
  }
}
