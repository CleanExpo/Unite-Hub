/**
 * /api/admin/audit-events
 *
 * Audit trail management (Phase E16)
 * GET: List audit events and API request logs
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  listAuditEvents,
  listApiRequests,
  getAuditSummary,
  getApiMetrics,
  type AuditEventType,
} from "@/lib/core/auditService";
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
    const action = searchParams.get("action"); // 'events', 'requests', 'summary', 'metrics'
    const eventType = searchParams.get("eventType") as AuditEventType | null;
    const route = searchParams.get("route");
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId required" },
        { status: 400 }
      );
    }

    // Check permission (settings.read or owner role)
    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Handle different actions
    if (action === "events") {
      const events = await listAuditEvents(
        workspaceId,
        eventType || undefined,
        limit
      );
      return NextResponse.json({ events });
    }

    if (action === "requests") {
      const requests = await listApiRequests(
        workspaceId,
        route || undefined,
        limit
      );
      return NextResponse.json({ requests });
    }

    if (action === "summary") {
      const hours = parseInt(searchParams.get("hours") || "24");
      const summary = await getAuditSummary(workspaceId, hours);
      return NextResponse.json({ summary });
    }

    if (action === "metrics") {
      const hours = parseInt(searchParams.get("hours") || "24");
      const metrics = await getApiMetrics(
        workspaceId,
        route || undefined,
        hours
      );
      return NextResponse.json({ metrics });
    }

    // Default: return summary + recent events
    const summary = await getAuditSummary(workspaceId);
    const events = await listAuditEvents(workspaceId, undefined, 50);

    return NextResponse.json({
      summary,
      events,
      total: events.length,
    });
  } catch (error: any) {
    console.error("[API] /admin/audit-events GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
