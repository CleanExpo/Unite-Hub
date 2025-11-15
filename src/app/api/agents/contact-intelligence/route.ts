import { NextRequest, NextResponse } from "next/server";
import {
  analyzeContactIntelligence,
  analyzeWorkspaceContacts,
  getHotLeads,
} from "@/lib/agents/contact-intelligence";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const supabase = getSupabaseServer();
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

    const { action, contactId, workspaceId } = await req.json();

    // Validate workspaceId if provided
    if (workspaceId) {
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("id", workspaceId)
        .eq("org_id", userOrg.org_id)
        .single();

      if (workspaceError || !workspace) {
        return NextResponse.json({ error: "Invalid workspace or access denied" }, { status: 403 });
      }
    }

    if (action === "analyze_contact" && contactId) {
      const intelligence = await analyzeContactIntelligence(
        contactId,
        workspaceId
      );
      return NextResponse.json({ success: true, intelligence });
    }

    if (action === "analyze_workspace" && workspaceId) {
      const result = await analyzeWorkspaceContacts(workspaceId);
      return NextResponse.json({ success: true, result });
    }

    if (action === "get_hot_leads" && workspaceId) {
      const hotLeads = await getHotLeads(workspaceId);
      return NextResponse.json({ success: true, hotLeads });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent failed" },
      { status: 500 }
    );
  }
}
