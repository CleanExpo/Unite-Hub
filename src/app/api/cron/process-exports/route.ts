/**
 * /api/cron/process-exports
 *
 * Background Export Job Processor (Phase E17)
 * 
 * This cron job processes pending export jobs:
 * - Fetches pending jobs from the queue
 * - Processes data export (CSV/JSON generation)
 * - Uploads to storage (if configured)
 * - Updates job status (success/failed)
 * 
 * Recommended: Run every 5-15 minutes via Vercel Cron or similar
 * 
 * @example Vercel cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-exports",
 *     "schedule": "*/10 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  listExportJobs,
  startExportJob,
  completeExportJob,
  getExportItems,
  type ExportJob,
} from "@/lib/core/exportService";

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
 * Process a single export job
 */
async function processExportJob(job: ExportJob): Promise<void> {
  console.log(`[Export] Processing job ${job.id} (${job.type})`);

  try {
    // Start the job
    await startExportJob(job.id);

    // Fetch data based on export type
    let exportData: any[] = [];
    let exportUrl: string | null = null;
    let fileSizeBytes = 0;

    switch (job.type) {
      case "audience.csv":
        exportData = await fetchAudienceData(job.tenant_id);
        const csvContent = generateCSV(exportData);
        fileSizeBytes = Buffer.byteLength(csvContent, "utf8");
        // TODO: Upload to storage and get URL
        // exportUrl = await uploadToStorage(csvContent, `exports/${job.id}.csv`);
        break;

      case "campaigns.json":
        exportData = await fetchCampaignsData(job.tenant_id);
        const campaignsJson = JSON.stringify(exportData, null, 2);
        fileSizeBytes = Buffer.byteLength(campaignsJson, "utf8");
        // TODO: Upload to storage
        break;

      case "content.json":
        exportData = await fetchContentData(job.tenant_id);
        const contentJson = JSON.stringify(exportData, null, 2);
        fileSizeBytes = Buffer.byteLength(contentJson, "utf8");
        // TODO: Upload to storage
        break;

      case "analytics.json":
        exportData = await fetchAnalyticsData(job.tenant_id);
        const analyticsJson = JSON.stringify(exportData, null, 2);
        fileSizeBytes = Buffer.byteLength(analyticsJson, "utf8");
        // TODO: Upload to storage
        break;

      case "synthex.full_tenant_export":
        exportData = await fetchFullTenantExport(job.tenant_id);
        const fullExportJson = JSON.stringify(exportData, null, 2);
        fileSizeBytes = Buffer.byteLength(fullExportJson, "utf8");
        // TODO: Upload to storage
        break;

      case "custom":
        // Handle custom export based on metadata
        exportData = await fetchCustomExport(job.tenant_id, job.metadata);
        const customJson = JSON.stringify(exportData, null, 2);
        fileSizeBytes = Buffer.byteLength(customJson, "utf8");
        // TODO: Upload to storage
        break;

      default:
        throw new Error(`Unknown export type: ${job.type}`);
    }

    // Complete the job
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    await completeExportJob({
      jobId: job.id,
      success: true,
      exportUrl: exportUrl || `data:text/json;base64,${Buffer.from(JSON.stringify(exportData)).toString("base64")}`, // Fallback: inline data URL
      fileSizeBytes,
      itemCount: exportData.length,
      expiresAt,
    });

    console.log(`[Export] Job ${job.id} completed successfully (${exportData.length} items, ${fileSizeBytes} bytes)`);
  } catch (error: any) {
    console.error(`[Export] Job ${job.id} failed:`, error);

    // Mark job as failed
    await completeExportJob({
      jobId: job.id,
      success: false,
      errorMessage: error.message || "Unknown error",
    });
  }
}

/**
 * Fetch audience/contacts data
 */
async function fetchAudienceData(tenantId: string): Promise<any[]> {
  const { data, error } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("workspace_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch campaigns data
 */
async function fetchCampaignsData(tenantId: string): Promise<any[]> {
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("workspace_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch content data
 */
async function fetchContentData(tenantId: string): Promise<any[]> {
  const { data, error } = await supabaseAdmin
    .from("content")
    .select("*")
    .eq("workspace_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch analytics data
 */
async function fetchAnalyticsData(tenantId: string): Promise<any[]> {
  // TODO: Implement based on your analytics tables
  // Example: engagement_events, campaign_analytics, etc.
  return [];
}

/**
 * Fetch full tenant export (all data)
 */
async function fetchFullTenantExport(tenantId: string): Promise<any> {
  const [contacts, campaigns, content] = await Promise.all([
    fetchAudienceData(tenantId),
    fetchCampaignsData(tenantId),
    fetchContentData(tenantId),
  ]);

  return {
    tenant_id: tenantId,
    export_date: new Date().toISOString(),
    contacts,
    campaigns,
    content,
  };
}

/**
 * Fetch custom export based on metadata
 */
async function fetchCustomExport(tenantId: string, metadata: Record<string, any>): Promise<any[]> {
  // TODO: Implement custom export logic based on metadata.tables, metadata.filters, etc.
  return [];
}

/**
 * Generate CSV from data
 */
function generateCSV(data: any[]): string {
  if (data.length === 0) return "";

  // Get all unique keys
  const keys = Array.from(new Set(data.flatMap(Object.keys)));

  // Header row
  const header = keys.join(",");

  // Data rows
  const rows = data.map((row) =>
    keys.map((key) => {
      const value = row[key];
      if (value === null || value === undefined) return "";
      if (typeof value === "string" && value.includes(",")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(",")
  );

  return [header, ...rows].join("\n");
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

    console.log("[Cron] Starting export job processor...");

    // Fetch pending jobs (limit 10 per run)
    const pendingJobs = await listExportJobs(null as any, "pending", 10);

    if (pendingJobs.length === 0) {
      console.log("[Cron] No pending export jobs");
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No pending jobs",
      });
    }

    console.log(`[Cron] Found ${pendingJobs.length} pending jobs`);

    // Process each job
    const results = await Promise.allSettled(
      pendingJobs.map((job) => processExportJob(job))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`[Cron] Export processing complete: ${successful} success, ${failed} failed`);

    return NextResponse.json({
      success: true,
      processed: pendingJobs.length,
      successful,
      failed,
      jobs: pendingJobs.map((j) => ({ id: j.id, type: j.type })),
    });
  } catch (error: any) {
    console.error("[Cron] Export processor error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
