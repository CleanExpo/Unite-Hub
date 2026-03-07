import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth } from "@/lib/workspace-validation";

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

    const supabase = await getSupabaseServer();

    // Verify contact belongs to user's workspace before returning its emails
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", user.orgId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const { data: emails, error } = await supabase
      .from("client_emails")
      .select("*")
      .eq("contact_id", id)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching emails:", error);
      return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
    }

    return NextResponse.json({ emails: emails || [] });
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
    const user = await validateUserAuth(request);

    const { id } = await params;
    const body = await request.json();

    const { email, email_type, label, is_primary } = body;

    if (!email || !email_type) {
      return NextResponse.json(
        { error: "Email and email_type are required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Verify contact belongs to user's workspace
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", user.orgId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Check if email already exists for this contact
    const { data: existing } = await supabase
      .from("client_emails")
      .select("id")
      .eq("contact_id", id)
      .eq("email", email)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "This email already exists for this contact" },
        { status: 400 }
      );
    }

    const { data: newEmail, error } = await supabase
      .from("client_emails")
      .insert({
        contact_id: id,
        email,
        email_type,
        label: label || null,
        is_primary: is_primary || false,
        is_verified: false,
        is_active: true,
        bounce_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating email:", error);
      return NextResponse.json({ error: "Failed to create email" }, { status: 500 });
    }

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
