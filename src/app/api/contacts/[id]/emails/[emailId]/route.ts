import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

// GET /api/contacts/[id]/emails/[emailId] - Get specific email
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const { id, emailId } = await params;

    const supabase = await getSupabaseServer();

    // Verify the contact belongs to the user's workspace first
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", user.orgId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Fetch email scoped to this contact (workspace isolation via contact ownership)
    const { data: email, error } = await supabase
      .from("client_emails")
      .select("*")
      .eq("id", emailId)
      .eq("contact_id", id)
      .maybeSingle();

    if (error || !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({ email });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching email:", error);
    return NextResponse.json(
      { error: "Failed to fetch email" },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id]/emails/[emailId] - Update email
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const { id, emailId } = await params;
    const body = await request.json();

    const supabase = await getSupabaseServer();

    // Verify the contact belongs to the user's workspace
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", user.orgId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Only allow safe fields to be updated
    const allowedFields = ["email", "email_type", "label", "is_primary", "is_verified", "is_active"];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data: updatedEmail, error } = await supabase
      .from("client_emails")
      .update(updateData)
      .eq("id", emailId)
      .eq("contact_id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating email:", error);
      return NextResponse.json({ error: "Failed to update email" }, { status: 500 });
    }

    return NextResponse.json({ email: updatedEmail });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error updating email:", error);
    return NextResponse.json(
      { error: "Failed to update email" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id]/emails/[emailId] - Delete (soft delete) email
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const { id, emailId } = await params;

    const supabase = await getSupabaseServer();

    // Verify the contact belongs to the user's workspace
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", user.orgId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Check that contact has more than one active email
    const { data: activeEmails } = await supabase
      .from("client_emails")
      .select("id")
      .eq("contact_id", id)
      .eq("is_active", true);

    if ((activeEmails?.length ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last email. Contact must have at least one email." },
        { status: 400 }
      );
    }

    // Soft delete — set is_active to false, scoped to this contact
    const { error } = await supabase
      .from("client_emails")
      .update({ is_active: false })
      .eq("id", emailId)
      .eq("contact_id", id);

    if (error) {
      console.error("Error deleting email:", error);
      return NextResponse.json({ error: "Failed to delete email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error deleting email:", error);
    return NextResponse.json(
      { error: "Failed to delete email" },
      { status: 500 }
    );
  }
}
