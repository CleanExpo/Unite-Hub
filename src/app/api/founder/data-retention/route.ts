/**
 * /api/founder/data-retention
 *
 * Data Retention API (Phase E26)
 * GET: List retention policies, deletion jobs, statistics
 * POST: Create/update retention policy, schedule deletion job
 * DELETE: Delete retention policy
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  listRetentionPolicies,
  getRetentionPolicy,
  upsertRetentionPolicy,
  deleteRetentionPolicy,
  scheduleDeletionJob,
  listDeletionJobs,
  updateDeletionJobStatus,
  getRetentionStatistics,
  type DataCategory,
  type RetentionPolicyStatus,
  type DeletionJobStatus,
} from "@/lib/founder/dataRetentionService";
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
    const policyId = searchParams.get("policyId");
    const status = searchParams.get("status") as RetentionPolicyStatus | DeletionJobStatus | null;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (action === "get-policy") {
      if (!policyId) {
        return NextResponse.json({ error: "policyId required" }, { status: 400 });
      }
      const policy = await getRetentionPolicy(policyId, workspaceId);
      if (!policy) {
        return NextResponse.json({ error: "Policy not found" }, { status: 404 });
      }
      return NextResponse.json({ policy });
    }

    if (action === "jobs") {
      const jobs = await listDeletionJobs(
        workspaceId,
        status as DeletionJobStatus | undefined,
        100
      );
      return NextResponse.json({ jobs, total: jobs.length });
    }

    if (action === "statistics") {
      const stats = await getRetentionStatistics(workspaceId);
      return NextResponse.json({ statistics: stats });
    }

    // Default: list retention policies
    const policies = await listRetentionPolicies(
      workspaceId,
      status as RetentionPolicyStatus | undefined
    );
    return NextResponse.json({ policies, total: policies.length });
  } catch (error: any) {
    console.error("[API] /founder/data-retention GET error:", error);
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
    const { workspaceId, action } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (action === "upsert-policy") {
      const { category, retentionDays, autoDelete, description } = body;

      if (!category || typeof retentionDays !== "number") {
        return NextResponse.json(
          { error: "category and retentionDays are required" },
          { status: 400 }
        );
      }

      const policyId = await upsertRetentionPolicy({
        tenantId: workspaceId,
        category,
        retentionDays,
        autoDelete,
        description,
      });

      return NextResponse.json({ success: true, policyId, message: "Retention policy updated" });
    }

    if (action === "schedule-job") {
      const { category, policyId } = body;

      if (!category) {
        return NextResponse.json({ error: "category required" }, { status: 400 });
      }

      const jobId = await scheduleDeletionJob({
        tenantId: workspaceId,
        category,
        policyId,
      });

      return NextResponse.json({ success: true, jobId, message: "Deletion job scheduled" });
    }

    if (action === "update-job-status") {
      const { jobId, status, deletedCount, errorMessage } = body;

      if (!jobId || !status) {
        return NextResponse.json({ error: "jobId and status required" }, { status: 400 });
      }

      await updateDeletionJobStatus(jobId, workspaceId, status, deletedCount, errorMessage);

      return NextResponse.json({ success: true, message: "Job status updated" });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: upsert-policy, schedule-job, update-job-status" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] /founder/data-retention POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
    const policyId = searchParams.get("policyId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    if (!policyId) {
      return NextResponse.json({ error: "policyId required" }, { status: 400 });
    }

    await deleteRetentionPolicy(policyId, workspaceId);

    return NextResponse.json({ success: true, message: "Retention policy deleted" });
  } catch (error: any) {
    console.error("[API] /founder/data-retention DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
