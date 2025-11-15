import { NextRequest, NextResponse } from "next/server";
import { syncGmailEmails } from "@/lib/integrations/gmail";
import { analyzeWorkspaceContacts } from "@/lib/agents/contact-intelligence";
import { getSupabaseServer } from "@/lib/supabase";
import { db } from "@/lib/db";

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

    const { integrationId, workspaceId } = await req.json();

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

    // Sync emails
    const syncResult = await syncGmailEmails(integrationId);

    // Auto-analyze new contacts
    if (syncResult.imported > 0) {
      await analyzeWorkspaceContacts(workspaceId);
    }

    return NextResponse.json({
      success: true,
      imported: syncResult.imported,
      total: syncResult.total,
    });
  } catch (error) {
    console.error("Gmail sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
