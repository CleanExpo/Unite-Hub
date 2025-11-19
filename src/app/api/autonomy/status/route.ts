/**
 * GET /api/autonomy/status
 * Phase 7: Autonomy Queue Status
 *
 * Returns current queue status for background tasks.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");

    // Validate required fields
    if (!jobId) {
      return NextResponse.json(
        { error: "Missing required query parameter: jobId" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get queue entry
    const { data: queueEntry, error: fetchError } = await supabase
      .from("autonomy_queue")
      .select("*")
      .eq("queue_id", jobId)
      .single();

    if (fetchError || !queueEntry) {
      return NextResponse.json(
        { error: "Queue entry not found" },
        { status: 404 }
      );
    }

    // Get associated audit if exists
    let auditDetails = null;
    if (queueEntry.audit_id) {
      const { data: audit } = await supabase
        .from("seo_audit_history")
        .select("audit_id, audit_type, status, health_score, report_paths")
        .eq("audit_id", queueEntry.audit_id)
        .single();

      if (audit) {
        auditDetails = {
          auditId: audit.audit_id,
          type: audit.audit_type,
          status: audit.status,
          healthScore: audit.health_score,
          reports: audit.report_paths || [],
        };
      }
    }

    // Calculate estimated completion time if processing
    let estimatedCompletion = null;
    if (queueEntry.status === "processing" && queueEntry.started_at) {
      const startTime = new Date(queueEntry.started_at).getTime();
      const elapsed = Date.now() - startTime;

      // Estimate 5-10 minutes for full audit, 2-3 minutes for snapshot
      const estimatedDuration =
        queueEntry.task_type === "full_audit" ? 7 * 60 * 1000 : 2.5 * 60 * 1000;
      const remaining = Math.max(0, estimatedDuration - elapsed);

      estimatedCompletion = new Date(Date.now() + remaining).toISOString();
    }

    return NextResponse.json({
      jobId: queueEntry.queue_id,
      clientId: queueEntry.client_id,
      taskType: queueEntry.task_type,
      status: queueEntry.status,
      priority: queueEntry.priority,
      createdAt: queueEntry.created_at,
      startedAt: queueEntry.started_at,
      completedAt: queueEntry.completed_at,
      estimatedCompletion,
      error: queueEntry.error_message,
      result: auditDetails || queueEntry.result,
    });
  } catch (error) {
    console.error("[API /autonomy/status] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
