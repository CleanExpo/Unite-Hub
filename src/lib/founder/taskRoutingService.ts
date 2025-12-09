/**
 * @fileoverview F02 Autonomous Task Routing Service
 * Server-side only service for unified task queue management
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("taskRoutingService must only run on server");
}

export type TaskType =
  | "agent_run"
  | "human_approval"
  | "system_trigger"
  | "integration_call"
  | "other";

export type TaskAssignedTo = "agent" | "human" | "system";

export type TaskStatus =
  | "queued"
  | "assigned"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Enqueue task
 */
export async function enqueueTask(args: {
  tenantId: string;
  taskCode: string;
  taskTitle: string;
  taskType?: TaskType;
  priority?: number;
  dueAt?: Date;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("enqueue_task", {
    p_tenant_id: args.tenantId,
    p_task_code: args.taskCode,
    p_task_title: args.taskTitle,
    p_task_type: args.taskType || "other",
    p_priority: args.priority ?? 50,
    p_due_at: args.dueAt?.toISOString() || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to enqueue task: ${error.message}`);
  return data;
}

/**
 * Assign task
 */
export async function assignTask(args: {
  taskId: string;
  assignedTo: TaskAssignedTo;
  assignedEntity: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.rpc("assign_task", {
    p_task_id: args.taskId,
    p_assigned_to: args.assignedTo,
    p_assigned_entity: args.assignedEntity,
  });

  if (error) throw new Error(`Failed to assign task: ${error.message}`);
}

/**
 * Update task status
 */
export async function updateTaskStatus(args: {
  taskId: string;
  status: TaskStatus;
  result?: Record<string, any>;
}): Promise<void> {
  const { error } = await supabaseAdmin.rpc("update_task_status", {
    p_task_id: args.taskId,
    p_status: args.status,
    p_result: args.result || null,
  });

  if (error) throw new Error(`Failed to update task status: ${error.message}`);
}

/**
 * List tasks
 */
export async function listTasks(
  tenantId: string,
  filters?: {
    status?: TaskStatus;
    assignedTo?: TaskAssignedTo;
    taskType?: TaskType;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_tasks", {
    p_tenant_id: tenantId,
    p_status: filters?.status || null,
    p_assigned_to: filters?.assignedTo || null,
    p_task_type: filters?.taskType || null,
    p_limit: filters?.limit || 500,
  });

  if (error) throw new Error(`Failed to list tasks: ${error.message}`);
  return data || [];
}

/**
 * Get queue summary
 */
export async function getQueueSummary(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_queue_summary", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get queue summary: ${error.message}`);
  return data || {};
}
