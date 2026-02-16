/**
 * API Route: AI Cost Dashboard
 * GET /api/ai/cost-dashboard?workspaceId=xxx
 *
 * Returns comprehensive AI usage and cost data for dashboard widget
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getAICostDashboard } from "@/lib/ai/cost-monitor";

export async function GET(req: NextRequest) {
  try {
    // Get workspace ID from query params
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // Verify user has access to this workspace
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check workspace access
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select(
        `
        id,
        user_organizations!inner(user_id)
      `
      )
      .eq("id", workspaceId)
      .eq("user_organizations.user_id", user.id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: "Workspace not found or access denied" }, { status: 403 });
    }

    // Get dashboard data
    const dashboard = await getAICostDashboard(workspaceId);

    return NextResponse.json({ success: true, data: dashboard });
  } catch (error: unknown) {
    console.error("Error fetching AI cost dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
