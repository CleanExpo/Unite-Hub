import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

// PUT /api/contacts/[id]/emails/[emailId]/primary - Set email as primary
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

    // Verify the target email belongs to this contact
    const { data: targetEmail, error: emailCheckError } = await supabase
      .from("client_emails")
      .select("id")
      .eq("id", emailId)
      .eq("contact_id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (emailCheckError || !targetEmail) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Unset all primary emails for this contact
    const { error: unsetError } = await supabase
      .from("client_emails")
      .update({ is_primary: false })
      .eq("contact_id", id);

    if (unsetError) {
      console.error("Error unsetting primary emails:", unsetError);
      return NextResponse.json({ error: "Failed to set primary email" }, { status: 500 });
    }

    // Set the new primary
    const { data: updatedEmail, error } = await supabase
      .from("client_emails")
      .update({ is_primary: true })
      .eq("id", emailId)
      .eq("contact_id", id)
      .select()
      .single();

    if (error) {
      console.error("Error setting primary email:", error);
      return NextResponse.json({ error: "Failed to set primary email" }, { status: 500 });
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
    console.error("Error setting primary email:", error);
    return NextResponse.json(
      { error: "Failed to set primary email" },
      { status: 500 }
    );
  }
}
