/**
 * /api/cron/cleanup
 *
 * Background Cleanup Jobs (Phase E16, E17, E18)
 * 
 * This cron job performs maintenance tasks:
 * - Cleanup old audit logs (90+ days old)
 * - Cleanup old export jobs (30+ days old)
 * - Cleanup expired kill-switch overrides
 * 
 * Recommended: Run daily (e.g., at 2 AM UTC)
 * 
 * @example Vercel cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Verify cron secret (optional but recommended)
 */
function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow (development mode)
  if (!cronSecret) {
    console.warn("[Cron] No CRON_SECRET configured - accepting all requests");
    return true;
  }

  // Verify Bearer token matches secret
  const token = authHeader?.replace("Bearer ", "");
  return token === cronSecret;
}

/**
 * Cleanup old audit logs (90+ days)
 */
async function cleanupOldAuditLogs(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin.rpc("cleanup_old_audit_logs");

    if (error) {
      console.error("[Cleanup] Error cleaning audit logs:", error);
      throw error;
    }

    const deletedCount = data || 0;
    console.log(`[Cleanup] Deleted ${deletedCount} old audit logs`);
    return deletedCount;
  } catch (error) {
    console.error("[Cleanup] Exception in cleanupOldAuditLogs:", error);
    throw error;
  }
}

/**
 * Cleanup old export jobs (30+ days)
 */
async function cleanupOldExportJobs(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin.rpc("cleanup_old_export_jobs");

    if (error) {
      console.error("[Cleanup] Error cleaning export jobs:", error);
      throw error;
    }

    const deletedCount = data || 0;
    console.log(`[Cleanup] Deleted ${deletedCount} old export jobs`);
    return deletedCount;
  } catch (error) {
    console.error("[Cleanup] Exception in cleanupOldExportJobs:", error);
    throw error;
  }
}

/**
 * Cleanup expired kill-switch overrides
 */
async function cleanupExpiredOverrides(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin.rpc("cleanup_expired_overrides");

    if (error) {
      console.error("[Cleanup] Error cleaning overrides:", error);
      throw error;
    }

    const deletedCount = data || 0;
    console.log(`[Cleanup] Deleted ${deletedCount} expired overrides`);
    return deletedCount;
  } catch (error) {
    console.error("[Cleanup] Exception in cleanupExpiredOverrides:", error);
    throw error;
  }
}

/**
 * Cleanup old API request logs (optional - 30+ days)
 */
async function cleanupOldApiLogs(): Promise<number> {
  try {
    // Delete API logs older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error, count } = await supabaseAdmin
      .from("api_request_logs")
      .delete()
      .lt("created_at", thirtyDaysAgo.toISOString());

    if (error) {
      console.error("[Cleanup] Error cleaning API logs:", error);
      throw error;
    }

    const deletedCount = count || 0;
    console.log(`[Cleanup] Deleted ${deletedCount} old API logs`);
    return deletedCount;
  } catch (error) {
    console.error("[Cleanup] Exception in cleanupOldApiLogs:", error);
    throw error;
  }
}

/**
 * Vacuum analyze tables (optional performance optimization)
 */
async function vacuumTables(): Promise<void> {
  try {
    // Note: VACUUM requires superuser privileges
    // This is optional and may not work on Supabase free tier
    // It's included here for reference

    // Using analyze is safer (doesn't require superuser)
    const tables = [
      "audit_events",
      "api_request_logs",
      "export_jobs",
      "export_job_items",
      "kill_switch_flags",
      "kill_switch_overrides",
    ];

    for (const table of tables) {
      try {
        await supabaseAdmin.rpc("pg_stat_reset_single_table_counters", {
          schema_name: "public",
          table_name: table,
        });
      } catch (err) {
        // Silently fail - this is optional
      }
    }

    console.log("[Cleanup] Table statistics reset");
  } catch (error) {
    // Don't throw - this is optional
    console.warn("[Cleanup] Could not vacuum tables (this is optional):", error);
  }
}

/**
 * Main cron handler
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron authorization
    if (!verifyCronAuth(req)) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid CRON_SECRET" },
        { status: 401 }
      );
    }

    console.log("[Cron] Starting cleanup jobs...");

    const results = {
      audit_logs_deleted: 0,
      export_jobs_deleted: 0,
      overrides_deleted: 0,
      api_logs_deleted: 0,
      errors: [] as string[],
    };

    // Cleanup audit logs (90+ days)
    try {
      results.audit_logs_deleted = await cleanupOldAuditLogs();
    } catch (error: any) {
      results.errors.push(`audit_logs: ${error.message}`);
    }

    // Cleanup export jobs (30+ days)
    try {
      results.export_jobs_deleted = await cleanupOldExportJobs();
    } catch (error: any) {
      results.errors.push(`export_jobs: ${error.message}`);
    }

    // Cleanup expired overrides
    try {
      results.overrides_deleted = await cleanupExpiredOverrides();
    } catch (error: any) {
      results.errors.push(`overrides: ${error.message}`);
    }

    // Cleanup API logs (optional - 30+ days)
    try {
      results.api_logs_deleted = await cleanupOldApiLogs();
    } catch (error: any) {
      results.errors.push(`api_logs: ${error.message}`);
    }

    // Vacuum tables (optional performance optimization)
    try {
      await vacuumTables();
    } catch (error: any) {
      // Don't add to errors - this is optional
    }

    const totalDeleted =
      results.audit_logs_deleted +
      results.export_jobs_deleted +
      results.overrides_deleted +
      results.api_logs_deleted;

    console.log(`[Cron] Cleanup complete: ${totalDeleted} total records deleted`);

    return NextResponse.json({
      success: true,
      total_deleted: totalDeleted,
      details: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Cron] Cleanup error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
