/**
 * Cron API Endpoint - Phase 8 Week 23
 *
 * POST /api/autonomy/cron
 * Triggered by Vercel Cron to execute scheduled jobs.
 */

import { NextRequest, NextResponse } from "next/server";
import { SchedulingEngine } from "@/lib/seo/schedulingEngine";
import { AnomalyDetector } from "@/lib/seo/anomalyDetector";
import { AlertEmailService } from "@/lib/seo/alertEmailService";
import { getSupabaseServer } from "@/lib/supabase";

// Vercel Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (CRON_SECRET && token !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting scheduled job execution...");

    // Get all due schedules
    const dueSchedules = await SchedulingEngine.getDueSchedules();

    if (dueSchedules.length === 0) {
      console.log("[Cron] No schedules due for execution");
      return NextResponse.json({
        message: "No schedules due",
        executed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[Cron] Found ${dueSchedules.length} schedules to execute`);

    const results = [];
    const supabase = await getSupabaseServer();

    for (const schedule of dueSchedules) {
      // Execute the job
      const result = await SchedulingEngine.executeJob(schedule);
      results.push(result);

      // Get client info for email notifications
      const { data: client } = await supabase
        .from("seo_client_profiles")
        .select("business_name, notification_email")
        .eq("client_id", schedule.client_id)
        .single();

      if (client?.notification_email) {
        // Send completion email
        await AlertEmailService.sendJobCompletionEmail(
          result,
          client.notification_email,
          client.business_name || "Client"
        );

        // If anomaly check, send alerts for any detected anomalies
        if (schedule.job_type === "ANOMALY_CHECK" && result.success) {
          const anomalies = result.result_summary.anomalies || [];

          for (const anomaly of anomalies) {
            if (anomaly.severity === "HIGH" || anomaly.severity === "CRITICAL") {
              await AlertEmailService.sendAnomalyAlert(
                anomaly,
                client.notification_email,
                client.business_name || "Client"
              );
            }
          }
        }

        // If weekly snapshot, send digest
        if (schedule.job_type === "WEEKLY_SNAPSHOT" && result.success) {
          // Get changes from delta
          const { data: latestAudit } = await supabase
            .from("seo_audit_history")
            .select("delta_summary, health_score")
            .eq("client_id", schedule.client_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (latestAudit) {
            await AlertEmailService.sendWeeklyDigest(
              schedule.client_id,
              client.notification_email,
              client.business_name || "Client",
              latestAudit.health_score,
              latestAudit.delta_summary || {}
            );
          }
        }
      }
    }

    // Summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `[Cron] Completed: ${successful} successful, ${failed} failed`
    );

    return NextResponse.json({
      message: "Cron execution complete",
      executed: results.length,
      successful,
      failed,
      results: results.map((r) => ({
        client_id: r.client_id,
        job_type: r.job_type,
        success: r.success,
        duration_ms: r.duration_ms,
        error: r.error,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Execution error:", error);
    return NextResponse.json(
      {
        error: "Cron execution failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/autonomy/cron
 * Returns cron status and next scheduled jobs
 */
export async function GET(req: NextRequest) {
  try {
    const dueSchedules = await SchedulingEngine.getDueSchedules();

    return NextResponse.json({
      status: "healthy",
      due_schedules: dueSchedules.length,
      schedules: dueSchedules.map((s) => ({
        schedule_id: s.schedule_id,
        client_id: s.client_id,
        job_type: s.job_type,
        next_run_at: s.next_run_at,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get cron status" },
      { status: 500 }
    );
  }
}
