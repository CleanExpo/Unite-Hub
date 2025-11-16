import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

// GET /api/contacts/[contactId]/emails - List all emails for a contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
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

    const { contactId } = await params;

    const emails = await db.clientEmails.getByContact(contactId);

    return NextResponse.json({ emails });
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}

// POST /api/contacts/[contactId]/emails - Add new email to contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params;
    const body = await request.json();

    const { email, email_type, label, is_primary } = body;

    if (!email || !email_type) {
      return NextResponse.json(
        { error: "Email and email_type are required" },
        { status: 400 }
      );
    }

    // Check if email already exists for this contact
    const existingEmails = await db.clientEmails.getByContact(contactId);
    const duplicate = existingEmails.find((e) => e.email === email);

    if (duplicate) {
      return NextResponse.json(
        { error: "This email already exists for this contact" },
        { status: 400 }
      );
    }

    const newEmail = await db.clientEmails.create({
      contact_id: contactId,
      email,
      email_type,
      label: label || null,
      is_primary: is_primary || false,
      is_verified: false,
      is_active: true,
      bounce_count: 0,
    });

    return NextResponse.json({ email: newEmail }, { status: 201 });
  } catch (error) {
    console.error("Error creating email:", error);
    return NextResponse.json(
      { error: "Failed to create email" },
      { status: 500 }
    );
  }
}
