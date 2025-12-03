import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAuth } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/contacts/[contactId] - Get contact details
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

    const { contactId } = await params;

    // Validate user authentication
    const user = await validateUserAuth(request);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Get the contact and verify workspace_id matches user's org
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("workspace_id", user.orgId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contact });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

// PATCH /api/contacts/[contactId] - Update contact details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { contactId } = await params;
    const body = await request.json();

    const {
      name,
      email,
      company,
      job_title,
      phone,
      status,
      tags,
    } = body;

    // Validate user authentication
    const user = await validateUserAuth(request);

    // Get authenticated supabase client
    const supabase = await getSupabaseServer();

    // Verify contact exists and belongs to user's workspace
    const { data: existingContact, error: fetchError } = await supabase
      .from("contacts")
      .select("id, workspace_id, email")
      .eq("id", contactId)
      .eq("workspace_id", user.orgId)
      .single();

    if (fetchError || !existingContact) {
      return NextResponse.json(
        { error: "Contact not found or access denied" },
        { status: 404 }
      );
    }

    // Validate required fields if provided
    if (name !== undefined && (!name || name.trim() === "")) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    if (email !== undefined) {
      if (!email || email.trim() === "") {
        return NextResponse.json(
          { error: "Email cannot be empty" },
          { status: 400 }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      // If email changed, check for duplicates
      if (email.toLowerCase() !== existingContact.email.toLowerCase()) {
        const { data: duplicate } = await supabase
          .from("contacts")
          .select("id")
          .eq("workspace_id", user.orgId)
          .eq("email", email.toLowerCase().trim())
          .neq("id", contactId)
          .maybeSingle();

        if (duplicate) {
          return NextResponse.json(
            { error: "A contact with this email already exists" },
            { status: 409 }
          );
        }
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (company !== undefined) updateData.company = company?.trim() || null;
    if (job_title !== undefined) updateData.job_title = job_title?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;

    // Update contact
    const { data: contact, error: updateError } = await supabase
      .from("contacts")
      .update(updateData)
      .eq("id", contactId)
      .eq("workspace_id", user.orgId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update contact" },
        { status: 500 }
      );
    }

    // Log to audit trail
    await supabase.from("auditLogs").insert({
      org_id: user.orgId,
      action: "contact_updated",
      resource: "contact",
      resource_id: contactId,
      agent: "api",
      status: "success",
      details: {
        user_id: user.userId,
        updated_fields: Object.keys(updateData).filter(k => k !== "updated_at"),
      },
    });

    return NextResponse.json({
      success: true,
      contact,
      message: "Contact updated successfully",
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
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}
