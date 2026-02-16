import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";

// GET /api/contacts/[id]/emails - List all emails for a contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const { id } = await params;

    const emails = await db.clientEmails.getByContact(id);

    return NextResponse.json({ emails });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}

// POST /api/contacts/[id]/emails - Add new email to contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    await validateUserAuth(request);

    const { id } = await params;
    const body = await request.json();

    const { email, email_type, label, is_primary } = body;

    if (!email || !email_type) {
      return NextResponse.json(
        { error: "Email and email_type are required" },
        { status: 400 }
      );
    }

    // Check if email already exists for this contact
    const existingEmails = await db.clientEmails.getByContact(id);
    const duplicate = existingEmails.find((e) => e.email === email);

    if (duplicate) {
      return NextResponse.json(
        { error: "This email already exists for this contact" },
        { status: 400 }
      );
    }

    const newEmail = await db.clientEmails.create({
      contact_id: id,
      email,
      email_type,
      label: label || null,
      is_primary: is_primary || false,
      is_verified: false,
      is_active: true,
      bounce_count: 0,
    });

    return NextResponse.json({ email: newEmail }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error creating email:", error);
    return NextResponse.json(
      { error: "Failed to create email" },
      { status: 500 }
    );
  }
}
