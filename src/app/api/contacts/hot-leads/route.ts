import { NextRequest, NextResponse } from "next/server";
import { getHotLeads } from "@/lib/agents/contact-intelligence";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

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

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const limit = parseInt(searchParams.get("limit") || "10");

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

    // Get hot leads (composite score >= 70)
    const hotLeads = await getHotLeads(workspaceId, limit);

    return NextResponse.json({
      success: true,
      count: hotLeads.length,
      leads: hotLeads,
    });
  } catch (error: any) {
    console.error("Hot leads retrieval error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve hot leads" },
      { status: 500 }
    );
  }
}
