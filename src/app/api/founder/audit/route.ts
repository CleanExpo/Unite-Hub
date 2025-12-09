/**
 * /api/founder/audit
 *
 * Founder Audit Log API (Phase E22)
 * GET: List audit logs, get single log, statistics, search
 * POST: Record audit event
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  recordAuditEvent,
  listAuditLogs,
  getAuditLog,
  getAuditStatistics,
  searchAuditLogs,
  type AuditCategory,
} from "@/lib/founder/auditService";
import { hasPermission } from "@/lib/core/permissionService";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");
    const logId = searchParams.get("logId");
    const category = searchParams.get("category") as AuditCategory | null;
    const actor = searchParams.get("actor");
    const resource = searchParams.get("resource");
    const limit = parseInt(searchParams.get("limit") || "100");
    const days = parseInt(searchParams.get("days") || "30");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (action === "get-log") {
      if (!logId) {
        return NextResponse.json({ error: "logId required" }, { status: 400 });
      }
      const log = await getAuditLog(logId, workspaceId);
      if (!log) {
        return NextResponse.json({ error: "Audit log not found" }, { status: 404 });
      }
      return NextResponse.json({ log });
    }

    if (action === "statistics") {
      const stats = await getAuditStatistics(workspaceId, days);
      return NextResponse.json({ statistics: stats });
    }

    if (action === "search") {
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      if (!startDate || !endDate) {
        return NextResponse.json({ error: "startDate and endDate required for search" }, { status: 400 });
      }

      const logs = await searchAuditLogs(
        workspaceId,
        new Date(startDate),
        new Date(endDate),
        category || undefined,
        actor || undefined
      );
      return NextResponse.json({ logs, total: logs.length });
    }

    // Default: list audit logs
    const logs = await listAuditLogs(
      workspaceId,
      category || undefined,
      actor || undefined,
      resource || undefined,
      limit
    );
    return NextResponse.json({ logs, total: logs.length });
  } catch (error: any) {
    console.error("[API] /founder/audit GET error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, category, action, resource, resourceId, description, metadata } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (!category || !action) {
      return NextResponse.json({ error: "Missing required fields: category, action" }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const logId = await recordAuditEvent({
      tenantId: workspaceId,
      actor: user.id,
      category,
      action,
      resource,
      resourceId,
      description,
      ipAddress,
      userAgent,
      metadata,
    });

    return NextResponse.json({ success: true, logId, message: "Audit event recorded" });
  } catch (error: any) {
    console.error("[API] /founder/audit POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
