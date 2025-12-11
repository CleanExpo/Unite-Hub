/**
 * Backup & Export Service (Phase E17)
 *
 * Manages data export jobs and tenant backup functionality
 * Server-side only - never expose to client
 *
 * @module exportService
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type ExportType =
  | "audience.csv"
  | "campaigns.json"
  | "content.json"
  | "analytics.json"
  | "synthex.full_tenant_export"
  | "custom";

export type ExportJobStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "cancelled";

export interface ExportJob {
  id: string;
  tenant_id: string;
  user_id: string;
  type: ExportType;
  status: ExportJobStatus;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  export_url: string | null;
  file_size_bytes: number | null;
  item_count: number | null;
  metadata: Record<string, any>;
  expires_at: string | null;
}

export interface ExportJobItem {
  id: string;
  job_id: string;
  resource_type: string;
  resource_id: string;
  payload: Record<string, any>;
  created_at: string;
}

/**
 * Queue a new export job
 *
 * @param args - Export job parameters
 * @returns Job ID
 */
export async function queueExport(args: {
  tenantId: string;
  userId: string;
  type: ExportType;
  metadata?: Record<string, any>;
}): Promise<{ jobId: string }> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("exportService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("queue_export_job", {
      p_tenant_id: args.tenantId,
      p_user_id: args.userId,
      p_type: args.type,
      p_metadata: args.metadata || {},
    });

    if (error) {
      console.error("[Export] Error queueing export job:", error);
      throw new Error(`Failed to queue export: ${error.message}`);
    }

    return { jobId: data as string };
  } catch (err) {
    console.error("[Export] Exception in queueExport:", err);
    throw err;
  }
}

/**
 * Start an export job (update status to 'running')
 *
 * @param jobId - Export job ID
 */
export async function startExportJob(jobId: string): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("exportService must only run on server");
    }

    const { error } = await supabaseAdmin.rpc("start_export_job", {
      p_job_id: jobId,
    });

    if (error) {
      console.error("[Export] Error starting export job:", error);
      throw new Error(`Failed to start export job: ${error.message}`);
    }
  } catch (err) {
    console.error("[Export] Exception in startExportJob:", err);
    throw err;
  }
}

/**
 * Complete an export job
 *
 * @param args - Completion parameters
 */
export async function completeExportJob(args: {
  jobId: string;
  success: boolean;
  exportUrl?: string;
  fileSizeBytes?: number;
  itemCount?: number;
  errorMessage?: string;
  expiresAt?: Date;
}): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("exportService must only run on server");
    }

    const { error } = await supabaseAdmin.rpc("complete_export_job", {
      p_job_id: args.jobId,
      p_success: args.success,
      p_export_url: args.exportUrl || null,
      p_file_size_bytes: args.fileSizeBytes || null,
      p_item_count: args.itemCount || null,
      p_error_message: args.errorMessage || null,
      p_expires_at: args.expiresAt?.toISOString() || null,
    });

    if (error) {
      console.error("[Export] Error completing export job:", error);
      throw new Error(`Failed to complete export job: ${error.message}`);
    }
  } catch (err) {
    console.error("[Export] Exception in completeExportJob:", err);
    throw err;
  }
}

/**
 * Get export job by ID
 *
 * @param jobId - Export job ID
 * @param tenantId - Tenant ID (for RLS)
 * @returns Export job or null
 */
export async function getExportJob(
  jobId: string,
  tenantId: string
): Promise<ExportJob | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("exportService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("export_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      console.error("[Export] Error fetching export job:", error);
      return null;
    }

    return data as ExportJob;
  } catch (err) {
    console.error("[Export] Exception in getExportJob:", err);
    return null;
  }
}

/**
 * List export jobs for tenant
 *
 * @param tenantId - Tenant ID
 * @param status - Optional status filter
 * @param limit - Max results (default 50)
 * @returns Array of export jobs
 */
export async function listExportJobs(
  tenantId: string,
  status?: ExportJobStatus,
  limit: number = 50
): Promise<ExportJob[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("exportService must only run on server");
    }

    let query = supabaseAdmin
      .from("export_jobs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("requested_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Export] Error listing export jobs:", error);
      return [];
    }

    return (data || []) as ExportJob[];
  } catch (err) {
    console.error("[Export] Exception in listExportJobs:", err);
    return [];
  }
}

/**
 * Add item to export job
 *
 * @param args - Export item parameters
 * @returns Item ID
 */
export async function addExportItem(args: {
  jobId: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, any>;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("exportService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("export_job_items")
      .insert({
        job_id: args.jobId,
        resource_type: args.resourceType,
        resource_id: args.resourceId,
        payload: args.payload,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Export] Error adding export item:", error);
      throw new Error(`Failed to add export item: ${error.message}`);
    }

    return data.id;
  } catch (err) {
    console.error("[Export] Exception in addExportItem:", err);
    throw err;
  }
}

/**
 * Get export job items
 *
 * @param jobId - Export job ID
 * @param limit - Max results (default 1000)
 * @returns Array of export items
 */
export async function getExportItems(
  jobId: string,
  limit: number = 1000
): Promise<ExportJobItem[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("exportService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("export_job_items")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[Export] Error fetching export items:", error);
      return [];
    }

    return (data || []) as ExportJobItem[];
  } catch (err) {
    console.error("[Export] Exception in getExportItems:", err);
    return [];
  }
}

/**
 * Cancel a pending export job
 *
 * @param jobId - Export job ID
 * @param tenantId - Tenant ID (for RLS)
 */
export async function cancelExportJob(
  jobId: string,
  tenantId: string
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("exportService must only run on server");
    }

    const { error } = await supabaseAdmin
      .from("export_jobs")
      .update({ status: "cancelled" as ExportJobStatus })
      .eq("id", jobId)
      .eq("tenant_id", tenantId)
      .eq("status", "pending" as ExportJobStatus); // Only cancel pending jobs

    if (error) {
      console.error("[Export] Error cancelling export job:", error);
      throw new Error(`Failed to cancel export job: ${error.message}`);
    }
  } catch (err) {
    console.error("[Export] Exception in cancelExportJob:", err);
    throw err;
  }
}

/**
 * Get export job statistics for tenant
 *
 * @param tenantId - Tenant ID
 * @param days - Time window in days (default 30)
 * @returns Export statistics
 */
export async function getExportStats(
  tenantId: string,
  days: number = 30
): Promise<{
  total_jobs: number;
  pending_jobs: number;
  running_jobs: number;
  success_jobs: number;
  failed_jobs: number;
  total_bytes: number;
}> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("exportService must only run on server");
    }

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from("export_jobs")
      .select("status, file_size_bytes")
      .eq("tenant_id", tenantId)
      .gte("requested_at", windowStart.toISOString());

    if (error) {
      console.error("[Export] Error fetching export stats:", error);
      return {
        total_jobs: 0,
        pending_jobs: 0,
        running_jobs: 0,
        success_jobs: 0,
        failed_jobs: 0,
        total_bytes: 0,
      };
    }

    const jobs = data || [];
    return {
      total_jobs: jobs.length,
      pending_jobs: jobs.filter((j) => j.status === "pending").length,
      running_jobs: jobs.filter((j) => j.status === "running").length,
      success_jobs: jobs.filter((j) => j.status === "success").length,
      failed_jobs: jobs.filter((j) => j.status === "failed").length,
      total_bytes: jobs.reduce(
        (sum, j) => sum + (j.file_size_bytes || 0),
        0
      ),
    };
  } catch (err) {
    console.error("[Export] Exception in getExportStats:", err);
    return {
      total_jobs: 0,
      pending_jobs: 0,
      running_jobs: 0,
      success_jobs: 0,
      failed_jobs: 0,
      total_bytes: 0,
    };
  }
}
