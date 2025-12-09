/**
 * /api/admin/health
 *
 * Config health & sanity checks (Phase E15)
 * GET: Fetch latest check results
 * POST: Trigger check re-run
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  runTenantChecks,
  getLatestResults,
  getHealthSummary,
  listAllChecks,
} from "@/lib/core/configHealthService";
import { hasPermission } from "@/lib/core/permissionService";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action"); // 'results', 'summary', 'checks'
    const category = searchParams.get("category"); // for checks filtering

    // Check permission (settings.read or owner role)
    if (workspaceId) {
      const canView = await hasPermission(user.id, workspaceId, "settings", "read");
      if (!canView) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    // Handle different actions
    if (action === "results" && workspaceId) {
      const results = await getLatestResults(workspaceId);
      return NextResponse.json({ results });
    }

    if (action === "summary" && workspaceId) {
      const summary = await getHealthSummary(workspaceId);
      return NextResponse.json({ summary });
    }

    if (action === "checks") {
      const checks = await listAllChecks(category || undefined);
      return NextResponse.json({ checks });
    }

    // Default: return summary + results
    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    const summary = await getHealthSummary(workspaceId);
    const results = await getLatestResults(workspaceId);

    return NextResponse.json({
      summary,
      results,
      total: results.length,
    });
  } catch (error: any) {
    console.error("[API] /admin/health GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Check permission (settings.write or owner role)
    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Trigger health checks
    const results = await runTenantChecks(workspaceId);

    // Get updated summary
    const summary = await getHealthSummary(workspaceId);

    return NextResponse.json({
      success: true,
      results,
      summary,
      message: `Ran ${results.length} health checks`,
    });
  } catch (error: any) {
    console.error("[API] /admin/health POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
