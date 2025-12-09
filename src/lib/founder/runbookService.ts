/**
 * Runbook & Playbook Center Service (Phase E30)
 * Server-side only service for managing runbooks, steps, assignments, and executions
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

// =====================================================
// TYPES
// =====================================================

export type RunbookCategory =
  | "incident_response"
  | "compliance"
  | "onboarding"
  | "maintenance"
  | "security"
  | "backup_recovery"
  | "deployment"
  | "other";

export type RunbookStepStatus = "pending" | "in_progress" | "completed" | "skipped" | "failed";
export type RunbookAssignmentStatus = "draft" | "active" | "paused" | "completed" | "cancelled";

export interface Runbook {
  id: string;
  tenant_id: string;
  category: RunbookCategory;
  title: string;
  description?: string;
  created_by: string;
  is_template: boolean;
  estimated_duration_minutes?: number;
  tags?: string[];
  step_count?: number;
  created_at: string;
  updated_at: string;
}

export interface RunbookStep {
  id: string;
  runbook_id: string;
  step_order: number;
  title: string;
  description?: string;
  action_type?: string;
  estimated_minutes?: number;
  dependencies?: string[];
  config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RunbookAssignment {
  id: string;
  tenant_id: string;
  runbook_id: string;
  runbook_title?: string;
  assigned_to: string;
  assigned_by: string;
  status: RunbookAssignmentStatus;
  context?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface RunbookStepExecution {
  id: string;
  assignment_id: string;
  step_id: string;
  status: RunbookStepStatus;
  executed_by?: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  result?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RunbookStatus {
  assignment_id: string;
  runbook_id: string;
  runbook_title: string;
  assigned_to: string;
  assigned_by: string;
  status: RunbookAssignmentStatus;
  started_at?: string;
  completed_at?: string;
  total_steps: number;
  pending_steps: number;
  in_progress_steps: number;
  completed_steps: number;
  skipped_steps: number;
  failed_steps: number;
  progress_percent: number;
}

// =====================================================
// RUNBOOK OPERATIONS
// =====================================================

/**
 * List runbooks for a tenant
 */
export async function listRunbooks(
  tenantId: string,
  category?: RunbookCategory,
  isTemplate?: boolean
): Promise<Runbook[]> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("list_runbooks", {
    p_tenant_id: tenantId,
    p_category: category || null,
    p_is_template: isTemplate !== undefined ? isTemplate : null,
  });

  if (error) {
    throw new Error(`Failed to list runbooks: ${error.message}`);
  }

  return data as Runbook[];
}

/**
 * Get single runbook by ID
 */
export async function getRunbook(runbookId: string): Promise<Runbook | null> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { data, error } = await supabaseAdmin
    .from("runbooks")
    .select("*")
    .eq("id", runbookId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(`Failed to get runbook: ${error.message}`);
  }

  return data as Runbook;
}

/**
 * Create a new runbook
 */
export async function createRunbook(args: {
  tenantId: string;
  category: RunbookCategory;
  title: string;
  description?: string;
  createdBy?: string;
  isTemplate?: boolean;
  estimatedDurationMinutes?: number;
  tags?: string[];
}): Promise<string> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("create_runbook", {
    p_tenant_id: args.tenantId,
    p_category: args.category,
    p_title: args.title,
    p_description: args.description || null,
    p_created_by: args.createdBy || null,
    p_is_template: args.isTemplate !== undefined ? args.isTemplate : true,
    p_estimated_duration_minutes: args.estimatedDurationMinutes || null,
    p_tags: args.tags || null,
  });

  if (error) {
    throw new Error(`Failed to create runbook: ${error.message}`);
  }

  return data as string;
}

/**
 * Update runbook
 */
export async function updateRunbook(
  runbookId: string,
  updates: Partial<Omit<Runbook, "id" | "tenant_id" | "created_at" | "updated_at">>
): Promise<void> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { error } = await supabaseAdmin
    .from("runbooks")
    .update(updates)
    .eq("id", runbookId);

  if (error) {
    throw new Error(`Failed to update runbook: ${error.message}`);
  }
}

/**
 * Delete runbook
 */
export async function deleteRunbook(runbookId: string): Promise<void> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { error } = await supabaseAdmin.from("runbooks").delete().eq("id", runbookId);

  if (error) {
    throw new Error(`Failed to delete runbook: ${error.message}`);
  }
}

// =====================================================
// RUNBOOK STEP OPERATIONS
// =====================================================

/**
 * List steps for a runbook
 */
export async function listRunbookSteps(runbookId: string): Promise<RunbookStep[]> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { data, error } = await supabaseAdmin
    .from("runbook_steps")
    .select("*")
    .eq("runbook_id", runbookId)
    .order("step_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to list runbook steps: ${error.message}`);
  }

  return data as RunbookStep[];
}

/**
 * Create a runbook step
 */
export async function createRunbookStep(args: {
  runbookId: string;
  stepOrder: number;
  title: string;
  description?: string;
  actionType?: string;
  estimatedMinutes?: number;
  dependencies?: string[];
  config?: Record<string, any>;
}): Promise<string> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("create_runbook_step", {
    p_runbook_id: args.runbookId,
    p_step_order: args.stepOrder,
    p_title: args.title,
    p_description: args.description || null,
    p_action_type: args.actionType || "manual",
    p_estimated_minutes: args.estimatedMinutes || null,
    p_dependencies: args.dependencies || null,
    p_config: args.config || {},
  });

  if (error) {
    throw new Error(`Failed to create runbook step: ${error.message}`);
  }

  return data as string;
}

/**
 * Update runbook step
 */
export async function updateRunbookStep(
  stepId: string,
  updates: Partial<Omit<RunbookStep, "id" | "runbook_id" | "created_at" | "updated_at">>
): Promise<void> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { error } = await supabaseAdmin
    .from("runbook_steps")
    .update(updates)
    .eq("id", stepId);

  if (error) {
    throw new Error(`Failed to update runbook step: ${error.message}`);
  }
}

/**
 * Delete runbook step
 */
export async function deleteRunbookStep(stepId: string): Promise<void> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { error } = await supabaseAdmin.from("runbook_steps").delete().eq("id", stepId);

  if (error) {
    throw new Error(`Failed to delete runbook step: ${error.message}`);
  }
}

// =====================================================
// RUNBOOK ASSIGNMENT OPERATIONS
// =====================================================

/**
 * List runbook assignments
 */
export async function listRunbookAssignments(
  tenantId: string,
  status?: RunbookAssignmentStatus,
  assignedTo?: string
): Promise<RunbookAssignment[]> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("list_runbook_assignments", {
    p_tenant_id: tenantId,
    p_status: status || null,
    p_assigned_to: assignedTo || null,
  });

  if (error) {
    throw new Error(`Failed to list runbook assignments: ${error.message}`);
  }

  return data as RunbookAssignment[];
}

/**
 * Assign a runbook to a user
 */
export async function assignRunbook(args: {
  tenantId: string;
  runbookId: string;
  assignedTo: string;
  assignedBy: string;
  context?: Record<string, any>;
}): Promise<string> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("assign_runbook", {
    p_tenant_id: args.tenantId,
    p_runbook_id: args.runbookId,
    p_assigned_to: args.assignedTo,
    p_assigned_by: args.assignedBy,
    p_context: args.context || {},
  });

  if (error) {
    throw new Error(`Failed to assign runbook: ${error.message}`);
  }

  return data as string;
}

/**
 * Update runbook assignment status
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  status: RunbookAssignmentStatus
): Promise<void> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { error } = await supabaseAdmin.rpc("update_assignment_status", {
    p_assignment_id: assignmentId,
    p_status: status,
  });

  if (error) {
    throw new Error(`Failed to update assignment status: ${error.message}`);
  }
}

/**
 * Get runbook assignment status with progress
 */
export async function getRunbookStatus(assignmentId: string): Promise<RunbookStatus> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { data, error } = await supabaseAdmin.rpc("get_runbook_status", {
    p_assignment_id: assignmentId,
  });

  if (error) {
    throw new Error(`Failed to get runbook status: ${error.message}`);
  }

  return data as RunbookStatus;
}

// =====================================================
// STEP EXECUTION OPERATIONS
// =====================================================

/**
 * List step executions for an assignment
 */
export async function listStepExecutions(assignmentId: string): Promise<RunbookStepExecution[]> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { data, error } = await supabaseAdmin
    .from("runbook_step_executions")
    .select(`
      *,
      step:runbook_steps (
        step_order,
        title,
        description,
        action_type,
        estimated_minutes
      )
    `)
    .eq("assignment_id", assignmentId)
    .order("step.step_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to list step executions: ${error.message}`);
  }

  return data as any; // TypeScript challenge with joined data
}

/**
 * Execute a runbook step (update execution status)
 */
export async function executeRunbookStep(args: {
  executionId: string;
  status: RunbookStepStatus;
  executedBy: string;
  notes?: string;
  result?: Record<string, any>;
}): Promise<void> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { error } = await supabaseAdmin.rpc("execute_runbook_step", {
    p_execution_id: args.executionId,
    p_status: args.status,
    p_executed_by: args.executedBy,
    p_notes: args.notes || null,
    p_result: args.result || {},
  });

  if (error) {
    throw new Error(`Failed to execute runbook step: ${error.message}`);
  }
}

/**
 * Bulk update step execution
 */
export async function updateStepExecution(
  executionId: string,
  updates: Partial<Omit<RunbookStepExecution, "id" | "assignment_id" | "step_id" | "created_at">>
): Promise<void> {
  if (typeof window !== "undefined") {
    throw new Error("runbookService must only run on server");
  }

  const { error } = await supabaseAdmin
    .from("runbook_step_executions")
    .update(updates)
    .eq("id", executionId);

  if (error) {
    throw new Error(`Failed to update step execution: ${error.message}`);
  }
}
