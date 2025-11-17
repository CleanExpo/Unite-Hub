import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAuth } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";
import { EmailSchema, UUIDSchema } from "@/lib/validation/schemas";

/**
 * POST /api/email/link
 * Update contact's email address (Supabase: contacts have single email)
 * Legacy: clientId → contactId
 */

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json();
    const contactId = body.contactId || body.clientId; // Support legacy clientId
    const emailAddress = body.emailAddress || body.email;

    // Validate inputs
    const contactIdValidation = UUIDSchema.safeParse(contactId);
    const emailValidation = EmailSchema.safeParse(emailAddress);

    if (!contactIdValidation.success) {
      return NextResponse.json({ error: "Invalid contact ID format" }, { status: 400 });
    }

    if (!emailValidation.success) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate user authentication
    const user = await validateUserAuth(req);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Get contact and verify workspace access
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, email, workspace_id")
      .eq("id", contactId)
      .eq("workspace_id", user.orgId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found or access denied" }, { status: 404 });
    }

    // Check if email is already used by another contact in this workspace
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id, name")
      .eq("email", emailAddress)
      .eq("workspace_id", contact.workspace_id)
      .neq("id", contactId)
      .single();

    if (existingContact) {
      return NextResponse.json(
        {
          error: "Email already linked to another contact",
          existingContactId: existingContact.id,
          existingContactName: existingContact.name,
        },
        { status: 409 }
      );
    }

    // Update contact email
    const { data: updatedContact, error: updateError } = await supabase
      .from("contacts")
      .update({
        email: emailAddress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update contact email:", updateError);
      return NextResponse.json({ error: "Failed to update email" }, { status: 500 });
    }

    // Update any unlinked emails from this sender to link to this contact
    await supabase
      .from("emails")
      .update({ contact_id: contactId })
      .eq("from", emailAddress)
      .eq("workspace_id", contact.workspace_id)
      .is("contact_id", null);

    return NextResponse.json({
      success: true,
      contact: {
        id: updatedContact.id,
        name: updatedContact.name,
        email: updatedContact.email,
        updatedAt: updatedContact.updated_at,
      },
      linkedEmails: 0, // TODO: Count updated emails
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Link error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to link email" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/email/link
 * Remove email from contact (sets to null - contact remains)
 */
export async function DELETE(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json();
    const contactId = body.contactId || body.clientId;

    // Validate contact ID
    const contactIdValidation = UUIDSchema.safeParse(contactId);
    if (!contactIdValidation.success) {
      return NextResponse.json({ error: "Invalid contact ID format" }, { status: 400 });
    }

    // Validate user authentication
    const user = await validateUserAuth(req);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Get contact and verify workspace access
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, workspace_id")
      .eq("id", contactId)
      .eq("workspace_id", user.orgId)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found or access denied" }, { status: 404 });
    }

    // Clear email but keep contact (set to null)
    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        email: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId);

    if (updateError) {
      console.error("Failed to clear email:", updateError);
      return NextResponse.json({ error: "Failed to unlink email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Email unlinked successfully. Contact remains active.",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Unlink error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unlink email" },
      { status: 500 }
    );
  }
}
