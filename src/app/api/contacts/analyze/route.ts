import { NextRequest, NextResponse } from "next/server";
import { analyzeContactIntelligence } from "@/lib/agents/contact-intelligence";
import { db } from "@/lib/db";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userOrg, error: orgError } = await supabase
      .from("user_organizations")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (orgError || !userOrg) {
      return NextResponse.json({ error: "No active organization found" }, { status: 403 });
    }

    const { contactId, workspaceId } = await request.json();

    if (!contactId || !workspaceId) {
      return NextResponse.json(
        { error: "Contact ID and workspace ID are required" },
        { status: 400 }
      );
    }

    // Validate workspace access
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("org_id", userOrg.org_id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: "Invalid workspace or access denied" }, { status: 403 });
    }

    // Verify contact exists
    const contact = await db.contacts.getById(contactId);
    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Run intelligence analysis with workspace context
    const analysis = await analyzeContactIntelligence(contactId, workspaceId);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("Contact intelligence analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze contact intelligence" },
      { status: 500 }
    );
  }
}

// Batch analysis endpoint - analyze entire workspace
export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userOrg, error: orgError } = await supabase
      .from("user_organizations")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (orgError || !userOrg) {
      return NextResponse.json({ error: "No active organization found" }, { status: 403 });
    }

    const { workspaceId } = await request.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    // Validate workspace access
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("org_id", userOrg.org_id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: "Invalid workspace or access denied" }, { status: 403 });
    }

    // Use the new analyzeWorkspaceContacts function
    const { analyzeWorkspaceContacts } = await import("@/lib/agents/contact-intelligence");
    const results = await analyzeWorkspaceContacts(workspaceId);

    return NextResponse.json({
      success: true,
      analyzed: results.analyzed,
      errors: results.errors,
      message: `Successfully analyzed ${results.analyzed} contacts (${results.errors} errors)`,
    });
  } catch (error: any) {
    console.error("Batch contact intelligence analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to batch analyze contacts" },
      { status: 500 }
    );
  }
}
