/**
 * /api/admin/backup
 *
 * Backup & Restore job management (Phase E11)
 * GET: List recent backup/restore jobs
 * POST: Create new backup job
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  listBackupJobs,
  listRestoreJobs,
  registerBackupJob,
  type BackupScope,
} from "@/lib/core/backupService";
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
    const jobType = searchParams.get("type") || "backup"; // 'backup' or 'restore'
    const scope = searchParams.get("scope") as BackupScope | null;
    const limit = parseInt(searchParams.get("limit") || "50");

    // Check permission (settings.read or owner role)
    if (workspaceId) {
      const canView = await hasPermission(user.id, workspaceId, "settings", "read");
      if (!canView) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    let backups: any[] = [];
    let restores: any[] = [];

    if (jobType === "backup" || jobType === "all") {
      backups = await listBackupJobs(workspaceId || undefined, scope || undefined, limit);
    }

    if (jobType === "restore" || jobType === "all") {
      restores = await listRestoreJobs(workspaceId || undefined, limit);
    }

    return NextResponse.json({
      backups,
      restores,
      total: backups.length + restores.length,
    });
  } catch (error: any) {
    console.error("[API] /admin/backup GET error:", error);
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
    const { scope, tenantId, notes, metadata } = body;

    if (!scope) {
      return NextResponse.json({ error: "scope required" }, { status: 400 });
    }

    // Check permission (settings.write or owner role)
    if (tenantId) {
      const canCreate = await hasPermission(user.id, tenantId, "settings", "write");
      if (!canCreate) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    }

    // Register backup job
    const jobId = await registerBackupJob(
      scope as BackupScope,
      tenantId || undefined,
      notes || undefined,
      metadata || undefined,
      user.id
    );

    if (!jobId) {
      return NextResponse.json({ error: "Failed to create backup job" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      job_id: jobId,
      message: "Backup job registered. Actual backup execution is handled externally.",
    });
  } catch (error: any) {
    console.error("[API] /admin/backup POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
