/**
 * API Route: AI Budget Management
 * GET /api/ai/budget?workspaceId=xxx - Get budget limits
 * PUT /api/ai/budget - Update budget limits (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getBudgetLimits, updateBudgetLimits } from "@/lib/ai/cost-monitor";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    // Rate limit API requests
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
return rateLimitResult;
}
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // Verify user access
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
        user_organizations!inner(user_id, role)
      `
      )
      .eq("id", workspaceId)
      .eq("user_organizations.user_id", user.id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: "Workspace not found or access denied" }, { status: 403 });
    }

    // Get budget limits
    const limits = await getBudgetLimits(workspaceId);

    return NextResponse.json({ success: true, data: limits });
  } catch (error: any) {
    console.error("Error fetching budget limits:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Rate limit API requests
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
return rateLimitResult;
}

    const body = await req.json();
    const { workspaceId, ...limits } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // Verify user is workspace owner
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check workspace ownership
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select(
        `
        id,
        user_organizations!inner(user_id, role)
      `
      )
      .eq("id", workspaceId)
      .eq("user_organizations.user_id", user.id)
      .eq("user_organizations.role", "owner")
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Only workspace owners can update budget limits" },
        { status: 403 }
      );
    }

    // Update budget limits
    const updated = await updateBudgetLimits(workspaceId, limits);

    if (!updated) {
      return NextResponse.json({ error: "Failed to update budget limits" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating budget limits:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
