import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

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

    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;

    const { contactId, emailId } = await params;

    const updatedEmail = await db.clientEmails.setPrimary(emailId, contactId);

    return NextResponse.json({ email: updatedEmail });
  } catch (error) {
    console.error("Error setting primary email:", error);
    return NextResponse.json(
      { error: "Failed to set primary email" },
      { status: 500 }
    );
  }
}
