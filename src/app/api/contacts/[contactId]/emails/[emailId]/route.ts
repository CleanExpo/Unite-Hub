import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

// GET /api/contacts/[contactId]/emails/[emailId] - Get specific email
export async function GET(
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

    const { emailId } = await params;

    const email = await db.clientEmails.getById(emailId);

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error("Error fetching email:", error);
    return NextResponse.json(
      { error: "Failed to fetch email" },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[contactId]/emails/[emailId] - Update email
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string; emailId: string }> }
) {
  try {
    const { emailId } = await params;
    const body = await request.json();

    const updatedEmail = await db.clientEmails.update(emailId, body);

    return NextResponse.json({ email: updatedEmail });
  } catch (error) {
    console.error("Error updating email:", error);
    return NextResponse.json(
      { error: "Failed to update email" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[contactId]/emails/[emailId] - Delete (soft delete) email
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string; emailId: string }> }
) {
  try {
    const { contactId, emailId } = await params;

    // Check that contact has more than one email
    const emails = await db.clientEmails.getByContact(contactId);
    if (emails.length <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last email. Contact must have at least one email." },
        { status: 400 }
      );
    }

    await db.clientEmails.delete(emailId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting email:", error);
    return NextResponse.json(
      { error: "Failed to delete email" },
      { status: 500 }
    );
  }
}
