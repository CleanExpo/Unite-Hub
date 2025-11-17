import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * GET /api/contacts
 * List all contacts for a workspace
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get workspace ID from query params
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId parameter is required" },
        { status: 400 }
      );
    }

    // Fetch contacts from database
    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contacts:", error);
      return NextResponse.json(
        { error: "Failed to fetch contacts" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      contacts: contacts || [],
      count: contacts?.length || 0,
    });
  } catch (error) {
    console.error("Unexpected error in /api/contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts
 * Create a new contact
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const body = await req.json();

    const {
      workspaceId,
      name,
      email,
      company,
      job_title,
      phone,
      status = "new",
      tags = [],
    } = body;

    // Validation
    if (!workspaceId || !name || !email) {
      return NextResponse.json(
        { error: "workspaceId, name, and email are required" },
        { status: 400 }
      );
    }

    // Check if contact with this email already exists in this workspace
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Contact with this email already exists" },
        { status: 409 }
      );
    }

    // Create contact
    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        workspace_id: workspaceId,
        name,
        email,
        company,
        job_title,
        phone,
        status,
        tags,
        ai_score: 0, // Initial score
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating contact:", error);
      return NextResponse.json(
        { error: "Failed to create contact" },
        { status: 500 }
      );
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
