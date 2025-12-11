/**
 * /api/founder/timeline
 * Founder Timeline Replay API (Phase E33)
 * GET: Unified timeline of governance events (E22-E32) or statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasPermission } from "@/lib/core/permissionService";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");
    if (!workspaceId) {
return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
}

    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
return NextResponse.json({ error: "Permission denied" }, { status: 403 });
}

    // Get timeline statistics
    if (action === "stats") {
      const days = parseInt(searchParams.get("days") || "30");
      const { data: stats, error } = await supabaseAdmin.rpc("get_timeline_stats", {
        p_tenant_id: workspaceId,
        p_days: days,
      });
      if (error) {
throw new Error(`Failed to get timeline stats: ${error.message}`);
}
      return NextResponse.json({ stats });
    }

    // Get timeline events (default)
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const eventTypes = searchParams.get("eventTypes")?.split(",");
    const limit = parseInt(searchParams.get("limit") || "100");

    const { data: events, error } = await supabaseAdmin.rpc("get_founder_timeline", {
      p_tenant_id: workspaceId,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_event_types: eventTypes || null,
      p_limit: limit,
    });

    if (error) {
throw new Error(`Failed to get timeline: ${error.message}`);
}
    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("[API] /founder/timeline GET error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
