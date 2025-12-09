/**
 * E35: Remediation Engine Service
 * System-generated or founder-created remediation tasks
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("remediationService must only run on server");
}

export type RemediationSource = "incident" | "debt" | "policy" | "system" | "other";
export type RemediationStatus = "open" | "in_progress" | "blocked" | "done";
export type RemediationPriority = "low" | "medium" | "high" | "critical";

export interface RemediationTask {
  id: string;
  tenant_id: string;
  source: RemediationSource;
  title: string;
  description?: string;
  status: RemediationStatus;
  priority: RemediationPriority;
  suggested_due?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface RemediationLink {
  id: string;
  task_id: string;
  entity_type: string;
  entity_id: string;
  metadata?: any;
  created_at: string;
}

/**
 * List remediation tasks
 */
export async function listRemediationTasks(
  tenantId: string,
  filters?: {
    status?: RemediationStatus;
    source?: RemediationSource;
    priority?: RemediationPriority;
  }
): Promise<RemediationTask[]> {
  const { data, error } = await supabaseAdmin.rpc("list_remediation_tasks", {
    p_tenant_id: tenantId,
    p_status: filters?.status || null,
    p_source: filters?.source || null,
    p_priority: filters?.priority || null,
  });

  if (error) throw new Error(`Failed to list remediation tasks: ${error.message}`);
  return data as RemediationTask[];
}

/**
 * Create new remediation task
 */
export async function createRemediationTask(args: {
  tenantId: string;
  source: RemediationSource;
  title: string;
  description?: string;
  priority?: RemediationPriority;
  suggestedDue?: string;
  assignedTo?: string;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("create_remediation_task", {
    p_tenant_id: args.tenantId,
    p_source: args.source,
    p_title: args.title,
    p_description: args.description || null,
    p_priority: args.priority || "medium",
    p_suggested_due: args.suggestedDue || null,
    p_assigned_to: args.assignedTo || null,
  });

  if (error) throw new Error(`Failed to create remediation task: ${error.message}`);
  return data as string; // UUID
}

/**
 * Update task status
 */
export async function updateRemediationStatus(
  taskId: string,
  status: RemediationStatus
): Promise<void> {
  const { error } = await supabaseAdmin.rpc("update_remediation_status", {
    p_task_id: taskId,
    p_status: status,
  });

  if (error) throw new Error(`Failed to update remediation status: ${error.message}`);
}

/**
 * Link task to source entity
 */
export async function linkRemediationTask(
  taskId: string,
  entityType: string,
  entityId: string,
  metadata?: any
): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("link_remediation_task", {
    p_task_id: taskId,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_metadata: metadata || {},
  });

  if (error) throw new Error(`Failed to link remediation task: ${error.message}`);
  return data as string; // UUID
}

/**
 * Get remediation summary statistics
 */
export async function getRemediationSummary(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_remediation_summary", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get remediation summary: ${error.message}`);
  return data;
}

/**
 * Get task with links
 */
export async function getRemediationDetails(taskId: string): Promise<{
  task: RemediationTask;
  links: RemediationLink[];
}> {
  const [taskResult, linksResult] = await Promise.all([
    supabaseAdmin
      .from("remediation_tasks")
      .select("*")
      .eq("id", taskId)
      .single(),
    supabaseAdmin
      .from("remediation_links")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false }),
  ]);

  if (taskResult.error) throw new Error(`Failed to get task: ${taskResult.error.message}`);
  if (linksResult.error) throw new Error(`Failed to get links: ${linksResult.error.message}`);

  return {
    task: taskResult.data as RemediationTask,
    links: linksResult.data as RemediationLink[],
  };
}
