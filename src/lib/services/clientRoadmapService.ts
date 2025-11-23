/**
 * Client Roadmap Service
 * Phase 36: MVP Client Truth Layer
 *
 * Manages client projects and tasks for honest roadmap display
 */

import { getSupabaseServer } from "@/lib/supabase";

export type ProjectStatus = "planned" | "in_progress" | "complete";
export type TaskStatus = "planned" | "in_progress" | "waiting_approval" | "complete";

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  project_id: string;
  name: string;
  status: TaskStatus;
  start_date: string | null;
  end_date: string | null;
  related_approval_id: string | null;
  related_ai_event_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Create a new project
 */
export async function createProject(
  clientId: string,
  name: string,
  description?: string
): Promise<Project | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_projects")
    .insert({
      client_id: clientId,
      name,
      description: description || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    return null;
  }

  return data as Project;
}

/**
 * Add a task to a project
 */
export async function addTask(
  projectId: string,
  name: string,
  startDate?: string,
  endDate?: string,
  metadata?: Record<string, unknown>
): Promise<Task | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_project_tasks")
    .insert({
      project_id: projectId,
      name,
      start_date: startDate || null,
      end_date: endDate || null,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding task:", error);
    return null;
  }

  return data as Task;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("client_project_tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task status:", error);
    return false;
  }

  return true;
}

/**
 * Link task to approval
 */
export async function linkTaskToApproval(
  taskId: string,
  approvalId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("client_project_tasks")
    .update({
      related_approval_id: approvalId,
      status: "waiting_approval",
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error linking task to approval:", error);
    return false;
  }

  return true;
}

/**
 * Get full roadmap for client
 */
export async function getRoadmapForClient(
  clientId: string
): Promise<Project[]> {
  const supabase = await getSupabaseServer();

  // Get projects
  const { data: projects, error: projectError } = await supabase
    .from("client_projects")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (projectError) {
    console.error("Error fetching projects:", projectError);
    return [];
  }

  // Get tasks for each project
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return projects as Project[];
  }

  const { data: tasks, error: taskError } = await supabase
    .from("client_project_tasks")
    .select("*")
    .in("project_id", projectIds)
    .order("start_date", { ascending: true });

  if (taskError) {
    console.error("Error fetching tasks:", taskError);
    return projects as Project[];
  }

  // Attach tasks to projects
  const projectsWithTasks = projects.map((project) => ({
    ...project,
    tasks: tasks.filter((task) => task.project_id === project.id),
  }));

  return projectsWithTasks as Project[];
}
