/**
 * /api/admin/exports
 *
 * Backup & Export Infrastructure (Phase E17)
 * GET: List export jobs and get export statistics
 * POST: Queue new export job or cancel existing job
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  queueExport,
  getExportJob,
  listExportJobs,
  cancelExportJob,
  getExportStats,
  type ExportType,
  type ExportJobStatus,
} from "@/lib/core/exportService";
import { hasPermission } from "@/lib/core/permissionService";
import { recordAuditEvent, extractRequestMetadata } from "@/lib/core/auditService";

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
    const action = searchParams.get("action"); // 'list', 'get', 'stats'
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status") as ExportJobStatus | null;
    const limit = parseInt(searchParams.get("limit") || "50");

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
    if (action === "get") {
      if (!jobId) {
        return NextResponse.json(
          { error: "jobId required for 'get' action" },
          { status: 400 }
        );
      }

      const job = await getExportJob(jobId, workspaceId);
      if (!job) {
        return NextResponse.json({ error: "Export job not found" }, { status: 404 });
      }

      return NextResponse.json({ job });
    }

    if (action === "stats") {
      const days = parseInt(searchParams.get("days") || "30");
      const stats = await getExportStats(workspaceId, days);
      return NextResponse.json({ stats });
    }

    // Default: list export jobs
    const jobs = await listExportJobs(workspaceId, status || undefined, limit);

    return NextResponse.json({
      jobs,
      total: jobs.length,
    });
  } catch (error: any) {
    console.error("[API] /admin/exports GET error:", error);
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
    const { workspaceId, action, type, jobId, metadata } = body;

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

    // Handle queue export
    if (action === "queue") {
      if (!type) {
        return NextResponse.json(
          { error: "Export type required" },
          { status: 400 }
        );
      }

      const { jobId: newJobId } = await queueExport({
        tenantId: workspaceId,
        userId: user.id,
        type: type as ExportType,
        metadata: metadata || {},
      });

      // Record audit event
      const { ipAddress, userAgent } = extractRequestMetadata(req);
      await recordAuditEvent({
        tenantId: workspaceId,
        userId: user.id,
        eventType: "export.requested",
        resource: "export_job",
        resourceId: newJobId,
        action: `Requested ${type} export`,
        metadata: { type, metadata },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        jobId: newJobId,
        message: "Export job queued successfully",
      });
    }

    // Handle cancel export
    if (action === "cancel") {
      if (!jobId) {
        return NextResponse.json(
          { error: "jobId required for cancel action" },
          { status: 400 }
        );
      }

      await cancelExportJob(jobId, workspaceId);

      // Record audit event
      const { ipAddress, userAgent } = extractRequestMetadata(req);
      await recordAuditEvent({
        tenantId: workspaceId,
        userId: user.id,
        eventType: "export.requested",
        resource: "export_job",
        resourceId: jobId,
        action: "Cancelled export job",
        metadata: { cancelled: true },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        message: "Export job cancelled successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'queue' or 'cancel'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] /admin/exports POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
