/**
 * Data Retention Service (Phase E26)
 *
 * Tenant-scoped data retention policies and deletion job management
 * Server-side only - never expose to client
 *
 * @module dataRetentionService
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type DataCategory =
  | "audit_logs"
  | "security_events"
  | "incidents"
  | "notifications"
  | "rate_limit_events"
  | "policy_triggers"
  | "webhook_events"
  | "compliance_records"
  | "marketing_events"
  | "analytics_data"
  | "other";

export type RetentionPolicyStatus = "active" | "inactive" | "archived";
export type DeletionJobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface RetentionPolicy {
  id: string;
  tenant_id: string;
  category: DataCategory;
  retention_days: number;
  status: RetentionPolicyStatus;
  description: string | null;
  auto_delete: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DeletionJob {
  id: string;
  tenant_id: string;
  policy_id: string | null;
  category: DataCategory;
  status: DeletionJobStatus;
  started_at: string | null;
  finished_at: string | null;
  deleted_count: number;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface RetentionStatistics {
  total_policies: number;
  active_policies: number;
  total_jobs: number;
  pending_jobs: number;
  completed_jobs: number;
  by_category: Record<string, number>;
}

/**
 * List retention policies
 */
export async function listRetentionPolicies(
  tenantId: string,
  status?: RetentionPolicyStatus
): Promise<RetentionPolicy[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("dataRetentionService must only run on server");
    }

    let query = supabaseAdmin
      .from("data_retention_policies")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("category", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[DataRetention] Error listing policies:", error);
      return [];
    }

    return (data || []) as RetentionPolicy[];
  } catch (err) {
    console.error("[DataRetention] Exception in listRetentionPolicies:", err);
    return [];
  }
}

/**
 * Get single retention policy
 */
export async function getRetentionPolicy(
  policyId: string,
  tenantId: string
): Promise<RetentionPolicy | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("dataRetentionService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("data_retention_policies")
      .select("*")
      .eq("id", policyId)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[DataRetention] Error fetching policy:", error);
      return null;
    }

    return data as RetentionPolicy;
  } catch (err) {
    console.error("[DataRetention] Exception in getRetentionPolicy:", err);
    return null;
  }
}

/**
 * Create or update retention policy
 */
export async function upsertRetentionPolicy(args: {
  tenantId: string;
  category: DataCategory;
  retentionDays: number;
  autoDelete?: boolean;
  description?: string;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("dataRetentionService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("create_retention_policy", {
      p_tenant_id: args.tenantId,
      p_category: args.category,
      p_retention_days: args.retentionDays,
      p_auto_delete: args.autoDelete || false,
      p_description: args.description || null,
    });

    if (error) {
      throw new Error(`Failed to upsert retention policy: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * Delete retention policy
 */
export async function deleteRetentionPolicy(
  policyId: string,
  tenantId: string
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("dataRetentionService must only run on server");
    }

    const { error } = await supabaseAdmin
      .from("data_retention_policies")
      .delete()
      .eq("id", policyId)
      .eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to delete retention policy: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Schedule deletion job
 */
export async function scheduleDeletionJob(args: {
  tenantId: string;
  category: DataCategory;
  policyId?: string;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("dataRetentionService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("schedule_deletion_job", {
      p_tenant_id: args.tenantId,
      p_category: args.category,
      p_policy_id: args.policyId || null,
    });

    if (error) {
      throw new Error(`Failed to schedule deletion job: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List deletion jobs
 */
export async function listDeletionJobs(
  tenantId: string,
  status?: DeletionJobStatus,
  limit: number = 100
): Promise<DeletionJob[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("dataRetentionService must only run on server");
    }

    let query = supabaseAdmin
      .from("data_deletion_jobs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[DataRetention] Error listing jobs:", error);
      return [];
    }

    return (data || []) as DeletionJob[];
  } catch (err) {
    console.error("[DataRetention] Exception in listDeletionJobs:", err);
    return [];
  }
}

/**
 * Update deletion job status
 */
export async function updateDeletionJobStatus(
  jobId: string,
  tenantId: string,
  status: DeletionJobStatus,
  deletedCount?: number,
  errorMessage?: string
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("dataRetentionService must only run on server");
    }

    const updateData: any = { status };

    if (status === "running" && !updateData.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    if (status === "completed" || status === "failed") {
      updateData.finished_at = new Date().toISOString();
    }

    if (deletedCount !== undefined) {
      updateData.deleted_count = deletedCount;
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabaseAdmin
      .from("data_deletion_jobs")
      .update(updateData)
      .eq("id", jobId)
      .eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to update deletion job status: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Get retention statistics
 */
export async function getRetentionStatistics(tenantId: string): Promise<RetentionStatistics> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("dataRetentionService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_retention_statistics", {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error("[DataRetention] Error getting statistics:", error);
      return {
        total_policies: 0,
        active_policies: 0,
        total_jobs: 0,
        pending_jobs: 0,
        completed_jobs: 0,
        by_category: {},
      };
    }

    return data as RetentionStatistics;
  } catch (err) {
    console.error("[DataRetention] Exception in getRetentionStatistics:", err);
    return {
      total_policies: 0,
      active_policies: 0,
      total_jobs: 0,
      pending_jobs: 0,
      completed_jobs: 0,
      by_category: {},
    };
  }
}
