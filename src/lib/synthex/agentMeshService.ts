/**
 * Synthex Multi-Agent Collaboration Mesh Service
 *
 * Phase: D32 - MACM (Multi-Agent Collaboration Mesh)
 *
 * Agent profiles, mesh links, tasks, and collaborative
 * workflows for autonomous agent systems
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// =====================================================
// LAZY ANTHROPIC CLIENT
// =====================================================

let anthropicClient: Anthropic | null = null;
let clientCreatedAt: number = 0;
const CLIENT_TTL_MS = 60_000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - clientCreatedAt > CLIENT_TTL_MS) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
    clientCreatedAt = now;
  }
  return anthropicClient;
}

// =====================================================
// TYPES
// =====================================================

export type AgentCapability =
  | "content_generation"
  | "data_analysis"
  | "customer_support"
  | "email_processing"
  | "social_media"
  | "seo_optimization"
  | "lead_scoring"
  | "campaign_management"
  | "reporting"
  | "scheduling"
  | "research"
  | "translation"
  | "summarization"
  | "sentiment_analysis"
  | "custom";

export type AgentStatus =
  | "active"
  | "idle"
  | "busy"
  | "paused"
  | "error"
  | "offline"
  | "maintenance";

export type MeshRelationship =
  | "delegates_to"
  | "supervises"
  | "collaborates_with"
  | "competes_with"
  | "reports_to"
  | "escalates_to"
  | "backs_up"
  | "validates"
  | "triggers"
  | "blocks"
  | "custom";

export type TaskStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "awaiting_input"
  | "completed"
  | "failed"
  | "cancelled"
  | "escalated";

export type EventType =
  | "task_created"
  | "task_assigned"
  | "task_started"
  | "task_completed"
  | "task_failed"
  | "collaboration_started"
  | "collaboration_ended"
  | "handoff_initiated"
  | "handoff_completed"
  | "escalation"
  | "feedback_received"
  | "capability_updated"
  | "status_changed"
  | "error_occurred"
  | "custom";

export interface AgentProfile {
  id: string;
  tenant_id: string;
  agent_name: string;
  agent_type: string;
  agent_description?: string;
  agent_version: string;
  capabilities: AgentCapability[];
  skillset: Record<string, unknown>;
  expertise_areas: string[];
  config: Record<string, unknown>;
  model_settings: Record<string, unknown>;
  rate_limits: Record<string, unknown>;
  status: AgentStatus;
  health_score: number;
  last_health_check_at?: string;
  last_error?: string;
  last_error_at?: string;
  tasks_completed: number;
  tasks_failed: number;
  avg_task_duration_ms: number;
  success_rate: number;
  total_tokens_used: number;
  total_cost: number;
  is_available: boolean;
  max_concurrent_tasks: number;
  current_tasks: number;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface MeshLink {
  id: string;
  tenant_id: string;
  source_agent_id: string;
  target_agent_id: string;
  relationship: MeshRelationship;
  relationship_label?: string;
  weight: number;
  priority: number;
  is_bidirectional: boolean;
  rules: unknown[];
  trigger_conditions: unknown[];
  delegation_policy: Record<string, unknown>;
  total_interactions: number;
  successful_interactions: number;
  avg_response_time_ms: number;
  last_interaction_at?: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MeshTask {
  id: string;
  tenant_id: string;
  task_name: string;
  task_type: string;
  task_description?: string;
  assigned_agent_id?: string;
  created_by_agent_id?: string;
  delegated_from_task_id?: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  context: Record<string, unknown>;
  priority: number;
  scheduled_at: string;
  deadline_at?: string;
  started_at?: string;
  completed_at?: string;
  status: TaskStatus;
  status_message?: string;
  progress_percent: number;
  attempts: number;
  max_attempts: number;
  last_error?: string;
  execution_log: unknown[];
  duration_ms?: number;
  tokens_used: number;
  cost: number;
  collaborating_agent_ids: string[];
  requires_human_approval: boolean;
  human_approved_at?: string;
  human_approved_by?: string;
  source_type?: string;
  source_id?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MeshEvent {
  id: string;
  tenant_id: string;
  agent_id?: string;
  task_id?: string;
  link_id?: string;
  event_type: EventType;
  event_name?: string;
  event_description?: string;
  payload: Record<string, unknown>;
  context: Record<string, unknown>;
  related_agent_ids: string[];
  related_task_ids: string[];
  severity: string;
  tags: string[];
  created_at: string;
}

export interface MeshWorkflow {
  id: string;
  tenant_id: string;
  workflow_name: string;
  workflow_description?: string;
  workflow_type: string;
  steps: unknown[];
  agent_assignments: Record<string, unknown>;
  conditions: unknown[];
  error_handling: Record<string, unknown>;
  is_parallel: boolean;
  timeout_minutes: number;
  retry_policy: Record<string, unknown>;
  is_active: boolean;
  is_template: boolean;
  total_executions: number;
  successful_executions: number;
  avg_duration_ms: number;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MeshStats {
  total_agents: number;
  active_agents: number;
  total_links: number;
  total_tasks: number;
  pending_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  total_workflows: number;
  task_success_rate: number;
}

// =====================================================
// AGENT FUNCTIONS
// =====================================================

export async function createAgent(
  tenantId: string,
  data: {
    agent_name: string;
    agent_type: string;
    agent_description?: string;
    capabilities?: AgentCapability[];
    skillset?: Record<string, unknown>;
    expertise_areas?: string[];
    config?: Record<string, unknown>;
    model_settings?: Record<string, unknown>;
    max_concurrent_tasks?: number;
    tags?: string[];
  },
  userId?: string
): Promise<AgentProfile> {
  const supabase = await createClient();

  const { data: agent, error } = await supabase
    .from("synthex_agent_profiles")
    .insert({
      tenant_id: tenantId,
      agent_name: data.agent_name,
      agent_type: data.agent_type,
      agent_description: data.agent_description,
      capabilities: data.capabilities || [],
      skillset: data.skillset || {},
      expertise_areas: data.expertise_areas || [],
      config: data.config || {},
      model_settings: data.model_settings || {},
      max_concurrent_tasks: data.max_concurrent_tasks || 5,
      tags: data.tags || [],
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create agent: ${error.message}`);
}
  return agent as AgentProfile;
}

export async function updateAgent(
  agentId: string,
  updates: Partial<Omit<AgentProfile, "id" | "tenant_id" | "created_at">>
): Promise<AgentProfile> {
  const supabase = await createClient();

  const { data: agent, error } = await supabase
    .from("synthex_agent_profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update agent: ${error.message}`);
}
  return agent as AgentProfile;
}

export async function getAgent(agentId: string): Promise<AgentProfile | null> {
  const supabase = await createClient();

  const { data: agent, error } = await supabase
    .from("synthex_agent_profiles")
    .select("*")
    .eq("id", agentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get agent: ${error.message}`);
  }
  return agent as AgentProfile;
}

export async function listAgents(
  tenantId: string,
  filters?: {
    agent_type?: string;
    status?: AgentStatus;
    capability?: AgentCapability;
    is_available?: boolean;
    limit?: number;
  }
): Promise<AgentProfile[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_agent_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("last_active_at", { ascending: false });

  if (filters?.agent_type) {
    query = query.eq("agent_type", filters.agent_type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.capability) {
    query = query.contains("capabilities", [filters.capability]);
  }
  if (filters?.is_available !== undefined) {
    query = query.eq("is_available", filters.is_available);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: agents, error } = await query;

  if (error) {
throw new Error(`Failed to list agents: ${error.message}`);
}
  return (agents || []) as AgentProfile[];
}

export async function getAvailableAgents(
  tenantId: string,
  capability: AgentCapability
): Promise<AgentProfile[]> {
  const supabase = await createClient();

  const { data: agents, error } = await supabase.rpc("get_available_agents", {
    p_tenant_id: tenantId,
    p_capability: capability,
  });

  if (error) {
throw new Error(`Failed to get available agents: ${error.message}`);
}
  return (agents || []) as AgentProfile[];
}

// =====================================================
// LINK FUNCTIONS
// =====================================================

export async function createLink(
  tenantId: string,
  data: {
    source_agent_id: string;
    target_agent_id: string;
    relationship: MeshRelationship;
    relationship_label?: string;
    weight?: number;
    priority?: number;
    is_bidirectional?: boolean;
    rules?: unknown[];
    trigger_conditions?: unknown[];
    delegation_policy?: Record<string, unknown>;
  }
): Promise<MeshLink> {
  const supabase = await createClient();

  const { data: link, error } = await supabase
    .from("synthex_agent_mesh_links")
    .insert({
      tenant_id: tenantId,
      source_agent_id: data.source_agent_id,
      target_agent_id: data.target_agent_id,
      relationship: data.relationship,
      relationship_label: data.relationship_label,
      weight: data.weight || 1.0,
      priority: data.priority || 5,
      is_bidirectional: data.is_bidirectional || false,
      rules: data.rules || [],
      trigger_conditions: data.trigger_conditions || [],
      delegation_policy: data.delegation_policy || {},
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create link: ${error.message}`);
}
  return link as MeshLink;
}

export async function listLinks(
  tenantId: string,
  filters?: {
    source_agent_id?: string;
    target_agent_id?: string;
    relationship?: MeshRelationship;
    is_active?: boolean;
    limit?: number;
  }
): Promise<MeshLink[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_agent_mesh_links")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.source_agent_id) {
    query = query.eq("source_agent_id", filters.source_agent_id);
  }
  if (filters?.target_agent_id) {
    query = query.eq("target_agent_id", filters.target_agent_id);
  }
  if (filters?.relationship) {
    query = query.eq("relationship", filters.relationship);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: links, error } = await query;

  if (error) {
throw new Error(`Failed to list links: ${error.message}`);
}
  return (links || []) as MeshLink[];
}

export async function updateLink(
  linkId: string,
  updates: Partial<Omit<MeshLink, "id" | "tenant_id" | "created_at">>
): Promise<MeshLink> {
  const supabase = await createClient();

  const { data: link, error } = await supabase
    .from("synthex_agent_mesh_links")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", linkId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update link: ${error.message}`);
}
  return link as MeshLink;
}

export async function getAgentConnections(
  agentId: string
): Promise<{ outgoing: MeshLink[]; incoming: MeshLink[] }> {
  const supabase = await createClient();

  const [outgoingResult, incomingResult] = await Promise.all([
    supabase
      .from("synthex_agent_mesh_links")
      .select("*")
      .eq("source_agent_id", agentId)
      .eq("is_active", true),
    supabase
      .from("synthex_agent_mesh_links")
      .select("*")
      .eq("target_agent_id", agentId)
      .eq("is_active", true),
  ]);

  if (outgoingResult.error) {
throw new Error(`Failed to get outgoing links: ${outgoingResult.error.message}`);
}
  if (incomingResult.error) {
throw new Error(`Failed to get incoming links: ${incomingResult.error.message}`);
}

  return {
    outgoing: (outgoingResult.data || []) as MeshLink[],
    incoming: (incomingResult.data || []) as MeshLink[],
  };
}

// =====================================================
// TASK FUNCTIONS
// =====================================================

export async function createTask(
  tenantId: string,
  data: {
    task_name: string;
    task_type: string;
    task_description?: string;
    input_data: Record<string, unknown>;
    context?: Record<string, unknown>;
    priority?: number;
    scheduled_at?: string;
    deadline_at?: string;
    created_by_agent_id?: string;
    requires_human_approval?: boolean;
    source_type?: string;
    source_id?: string;
    tags?: string[];
  }
): Promise<MeshTask> {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("synthex_agent_mesh_tasks")
    .insert({
      tenant_id: tenantId,
      task_name: data.task_name,
      task_type: data.task_type,
      task_description: data.task_description,
      input_data: data.input_data,
      context: data.context || {},
      priority: data.priority || 5,
      scheduled_at: data.scheduled_at || new Date().toISOString(),
      deadline_at: data.deadline_at,
      created_by_agent_id: data.created_by_agent_id,
      requires_human_approval: data.requires_human_approval || false,
      source_type: data.source_type,
      source_id: data.source_id,
      tags: data.tags || [],
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create task: ${error.message}`);
}

  // Record event
  await recordEvent(tenantId, {
    task_id: task.id,
    event_type: "task_created",
    payload: { task_name: data.task_name, task_type: data.task_type },
  });

  return task as MeshTask;
}

export async function assignTask(
  taskId: string,
  agentId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("assign_task_to_agent", {
    p_task_id: taskId,
    p_agent_id: agentId,
  });

  if (error) {
throw new Error(`Failed to assign task: ${error.message}`);
}

  // Get task for event
  const { data: task } = await supabase
    .from("synthex_agent_mesh_tasks")
    .select("tenant_id, task_name")
    .eq("id", taskId)
    .single();

  if (task) {
    await recordEvent(task.tenant_id, {
      task_id: taskId,
      agent_id: agentId,
      event_type: "task_assigned",
      payload: { task_name: task.task_name },
    });
  }

  return data as boolean;
}

export async function completeTask(
  taskId: string,
  data: {
    output_data: Record<string, unknown>;
    duration_ms: number;
    tokens_used: number;
    cost: number;
  }
): Promise<boolean> {
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc("complete_agent_task", {
    p_task_id: taskId,
    p_output_data: data.output_data,
    p_duration_ms: data.duration_ms,
    p_tokens_used: data.tokens_used,
    p_cost: data.cost,
  });

  if (error) {
throw new Error(`Failed to complete task: ${error.message}`);
}

  // Get task for event
  const { data: task } = await supabase
    .from("synthex_agent_mesh_tasks")
    .select("tenant_id, task_name, assigned_agent_id")
    .eq("id", taskId)
    .single();

  if (task) {
    await recordEvent(task.tenant_id, {
      task_id: taskId,
      agent_id: task.assigned_agent_id,
      event_type: "task_completed",
      payload: {
        task_name: task.task_name,
        duration_ms: data.duration_ms,
        tokens_used: data.tokens_used,
      },
    });
  }

  return result as boolean;
}

export async function failTask(
  taskId: string,
  error_message: string
): Promise<MeshTask> {
  const supabase = await createClient();

  // Get current task
  const { data: currentTask } = await supabase
    .from("synthex_agent_mesh_tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (!currentTask) {
    throw new Error("Task not found");
  }

  const { data: task, error } = await supabase
    .from("synthex_agent_mesh_tasks")
    .update({
      status: currentTask.attempts + 1 >= currentTask.max_attempts ? "failed" : "pending",
      last_error: error_message,
      attempts: currentTask.attempts + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to fail task: ${error.message}`);
}

  // Update agent if assigned
  if (currentTask.assigned_agent_id) {
    await supabase
      .from("synthex_agent_profiles")
      .update({
        current_tasks: supabase.rpc("greatest", { a: 0, b: -1 }),
        tasks_failed: supabase.rpc("add", { a: 1 }),
        last_error: error_message,
        last_error_at: new Date().toISOString(),
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentTask.assigned_agent_id);

    await recordEvent(currentTask.tenant_id, {
      task_id: taskId,
      agent_id: currentTask.assigned_agent_id,
      event_type: "task_failed",
      payload: { error: error_message },
      severity: "error",
    });
  }

  return task as MeshTask;
}

export async function getTask(taskId: string): Promise<MeshTask | null> {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("synthex_agent_mesh_tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get task: ${error.message}`);
  }
  return task as MeshTask;
}

export async function listTasks(
  tenantId: string,
  filters?: {
    status?: TaskStatus;
    assigned_agent_id?: string;
    task_type?: string;
    priority?: number;
    limit?: number;
  }
): Promise<MeshTask[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_agent_mesh_tasks")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: true })
    .order("scheduled_at", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.assigned_agent_id) {
    query = query.eq("assigned_agent_id", filters.assigned_agent_id);
  }
  if (filters?.task_type) {
    query = query.eq("task_type", filters.task_type);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: tasks, error } = await query;

  if (error) {
throw new Error(`Failed to list tasks: ${error.message}`);
}
  return (tasks || []) as MeshTask[];
}

// =====================================================
// EVENT FUNCTIONS
// =====================================================

export async function recordEvent(
  tenantId: string,
  data: {
    agent_id?: string;
    task_id?: string;
    link_id?: string;
    event_type: EventType;
    event_name?: string;
    event_description?: string;
    payload?: Record<string, unknown>;
    context?: Record<string, unknown>;
    related_agent_ids?: string[];
    related_task_ids?: string[];
    severity?: string;
    tags?: string[];
  }
): Promise<MeshEvent> {
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("synthex_agent_mesh_events")
    .insert({
      tenant_id: tenantId,
      agent_id: data.agent_id,
      task_id: data.task_id,
      link_id: data.link_id,
      event_type: data.event_type,
      event_name: data.event_name,
      event_description: data.event_description,
      payload: data.payload || {},
      context: data.context || {},
      related_agent_ids: data.related_agent_ids || [],
      related_task_ids: data.related_task_ids || [],
      severity: data.severity || "info",
      tags: data.tags || [],
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to record event: ${error.message}`);
}
  return event as MeshEvent;
}

export async function listEvents(
  tenantId: string,
  filters?: {
    agent_id?: string;
    task_id?: string;
    event_type?: EventType;
    severity?: string;
    limit?: number;
  }
): Promise<MeshEvent[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_agent_mesh_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.agent_id) {
    query = query.eq("agent_id", filters.agent_id);
  }
  if (filters?.task_id) {
    query = query.eq("task_id", filters.task_id);
  }
  if (filters?.event_type) {
    query = query.eq("event_type", filters.event_type);
  }
  if (filters?.severity) {
    query = query.eq("severity", filters.severity);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: events, error } = await query;

  if (error) {
throw new Error(`Failed to list events: ${error.message}`);
}
  return (events || []) as MeshEvent[];
}

// =====================================================
// WORKFLOW FUNCTIONS
// =====================================================

export async function createWorkflow(
  tenantId: string,
  data: {
    workflow_name: string;
    workflow_description?: string;
    workflow_type: string;
    steps: unknown[];
    agent_assignments?: Record<string, unknown>;
    conditions?: unknown[];
    error_handling?: Record<string, unknown>;
    is_parallel?: boolean;
    timeout_minutes?: number;
    is_template?: boolean;
    tags?: string[];
  },
  userId?: string
): Promise<MeshWorkflow> {
  const supabase = await createClient();

  const { data: workflow, error } = await supabase
    .from("synthex_agent_mesh_workflows")
    .insert({
      tenant_id: tenantId,
      workflow_name: data.workflow_name,
      workflow_description: data.workflow_description,
      workflow_type: data.workflow_type,
      steps: data.steps,
      agent_assignments: data.agent_assignments || {},
      conditions: data.conditions || [],
      error_handling: data.error_handling || {},
      is_parallel: data.is_parallel || false,
      timeout_minutes: data.timeout_minutes || 60,
      is_template: data.is_template || false,
      tags: data.tags || [],
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create workflow: ${error.message}`);
}
  return workflow as MeshWorkflow;
}

export async function getWorkflow(workflowId: string): Promise<MeshWorkflow | null> {
  const supabase = await createClient();

  const { data: workflow, error } = await supabase
    .from("synthex_agent_mesh_workflows")
    .select("*")
    .eq("id", workflowId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
return null;
}
    throw new Error(`Failed to get workflow: ${error.message}`);
  }
  return workflow as MeshWorkflow;
}

export async function updateWorkflow(
  workflowId: string,
  updates: Partial<Omit<MeshWorkflow, "id" | "tenant_id" | "created_at">>
): Promise<MeshWorkflow> {
  const supabase = await createClient();

  const { data: workflow, error } = await supabase
    .from("synthex_agent_mesh_workflows")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workflowId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update workflow: ${error.message}`);
}
  return workflow as MeshWorkflow;
}

export async function listWorkflows(
  tenantId: string,
  filters?: {
    workflow_type?: string;
    is_active?: boolean;
    is_template?: boolean;
    limit?: number;
  }
): Promise<MeshWorkflow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_agent_mesh_workflows")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.workflow_type) {
    query = query.eq("workflow_type", filters.workflow_type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.is_template !== undefined) {
    query = query.eq("is_template", filters.is_template);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data: workflows, error } = await query;

  if (error) {
throw new Error(`Failed to list workflows: ${error.message}`);
}
  return (workflows || []) as MeshWorkflow[];
}

// =====================================================
// AI FUNCTIONS
// =====================================================

export async function autoAssignTask(
  tenantId: string,
  taskId: string
): Promise<{ assigned: boolean; agent_id?: string; reasoning: string }> {
  const supabase = await createClient();

  // Get task details
  const { data: task } = await supabase
    .from("synthex_agent_mesh_tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (!task) {
    return { assigned: false, reasoning: "Task not found" };
  }

  // Get available agents
  const { data: agents } = await supabase
    .from("synthex_agent_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_available", true)
    .in("status", ["active", "idle"])
    .lt("current_tasks", supabase.rpc("max_concurrent_tasks"));

  if (!agents || agents.length === 0) {
    return { assigned: false, reasoning: "No available agents" };
  }

  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Select the best agent for this task:

Task: ${JSON.stringify(task, null, 2)}

Available Agents: ${JSON.stringify(agents, null, 2)}

Return JSON with:
- agent_id: UUID of the best agent
- reasoning: explanation of selection`,
      },
    ],
    system:
      "You are an expert at assigning tasks to the most suitable agents based on capabilities, workload, and performance.",
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent?.type === "text" ? textContent.text : "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      if (result.agent_id) {
        await assignTask(taskId, result.agent_id);
        return { assigned: true, agent_id: result.agent_id, reasoning: result.reasoning };
      }
    }
  } catch {
    // Fall through to default
  }

  // Fallback: assign to first available agent
  const bestAgent = agents[0];
  await assignTask(taskId, bestAgent.id);
  return {
    assigned: true,
    agent_id: bestAgent.id,
    reasoning: "Assigned to first available agent (AI selection failed)",
  };
}

export async function suggestCollaborators(
  tenantId: string,
  taskId: string
): Promise<{ agents: AgentProfile[]; reasoning: string }> {
  const supabase = await createClient();

  // Get task
  const { data: task } = await supabase
    .from("synthex_agent_mesh_tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (!task) {
    return { agents: [], reasoning: "Task not found" };
  }

  // Get all agents
  const { data: agents } = await supabase
    .from("synthex_agent_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .neq("id", task.assigned_agent_id)
    .eq("is_available", true);

  if (!agents || agents.length === 0) {
    return { agents: [], reasoning: "No available collaborators" };
  }

  const anthropic = getAnthropicClient();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Suggest collaborators for this task:

Task: ${JSON.stringify(task, null, 2)}

Available Agents: ${JSON.stringify(agents, null, 2)}

Return JSON with:
- agent_ids: array of UUIDs for recommended collaborators
- reasoning: explanation`,
      },
    ],
    system: "You are an expert at identifying agents that can collaborate effectively on tasks.",
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent?.type === "text" ? textContent.text : "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      const collaborators = agents.filter((a) =>
        result.agent_ids?.includes(a.id)
      );
      return { agents: collaborators as AgentProfile[], reasoning: result.reasoning };
    }
  } catch {
    // Fall through
  }

  return { agents: [], reasoning: "Could not suggest collaborators" };
}

// =====================================================
// STATS FUNCTIONS
// =====================================================

export async function getMeshStats(tenantId: string): Promise<MeshStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_agent_mesh_stats", {
    p_tenant_id: tenantId,
  });

  if (error) {
throw new Error(`Failed to get mesh stats: ${error.message}`);
}
  return data as MeshStats;
}
