/**
 * Staff Service Layer - Phase 2 Step 6
 *
 * Wraps staff API endpoints with proper error handling and type safety
 * Following patterns from docs/PHASE2_API_WIRING_COMPLETE.md
 */

// Type definitions for staff data
export interface StaffTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  deadline?: string | null;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffProject {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  progress?: number;
  client_name?: string | null;
  deadline?: string | null;
  team_size?: number;
  created_at?: string;
}

export interface StaffActivity {
  id: string;
  staff_id: string;
  action: string;
  metadata?: Record<string, any>;
  timestamp: string;
  created_at?: string;
}

export interface DashboardStats {
  activeProjects: number;
  pendingTasks: number;
  completedThisWeek: number;
  totalTasks: number;
  recentActivity: StaffActivity[];
}

/**
 * Generic error handler for fetch responses
 */
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`API Error (${res.status}): ${errorText}`);
  }

  try {
    const data = await res.json();
    return data.data || data; // Handle both {data: ...} and direct response
  } catch (error) {
    throw new Error('Failed to parse API response');
  }
}

/**
 * Fetch staff tasks with optional filters
 */
export async function getStaffTasks(filters?: {
  myTasksOnly?: boolean;
  status?: string;
  priority?: string;
}): Promise<{ data: StaffTask[] }> {
  try {
    const params = new URLSearchParams();
    if (filters?.myTasksOnly) {
params.append('my_tasks_only', 'true');
}
    if (filters?.status) {
params.append('status', filters.status);
}
    if (filters?.priority) {
params.append('priority', filters.priority);
}

    const url = `/api/staff/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });

    return { data: await handleResponse<StaffTask[]>(res) };
  } catch (error) {
    console.error('Failed to fetch staff tasks:', error);
    return { data: [] };
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(id: string, status: string): Promise<StaffTask> {
  const res = await fetch('/api/staff/tasks', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });

  return handleResponse<StaffTask>(res);
}

/**
 * Create new task
 */
export async function createTask(task: Partial<StaffTask>): Promise<StaffTask> {
  const res = await fetch('/api/staff/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });

  return handleResponse<StaffTask>(res);
}

/**
 * Delete task
 */
export async function deleteTask(id: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/staff/tasks', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  return handleResponse<{ success: boolean }>(res);
}

/**
 * Fetch staff projects
 */
export async function getStaffProjects(): Promise<{ data: StaffProject[] }> {
  try {
    const res = await fetch('/api/staff/projects', { cache: 'no-store' });
    return { data: await handleResponse<StaffProject[]>(res) };
  } catch (error) {
    console.error('Failed to fetch staff projects:', error);
    return { data: [] };
  }
}

/**
 * Fetch staff activity logs
 */
export async function getStaffActivity(): Promise<{ data: StaffActivity[] }> {
  try {
    const res = await fetch('/api/staff/activity', { cache: 'no-store' });
    return { data: await handleResponse<StaffActivity[]>(res) };
  } catch (error) {
    console.error('Failed to fetch staff activity:', error);
    return { data: [] };
  }
}

/**
 * Fetch dashboard stats
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Fetch tasks and projects in parallel
    const [tasksResponse, projectsResponse, activityResponse] = await Promise.all([
      getStaffTasks(),
      getStaffProjects(),
      getStaffActivity(),
    ]);

    const tasks = tasksResponse.data || [];
    const projects = projectsResponse.data || [];
    const activity = activityResponse.data || [];

    // Calculate stats
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const pendingTasks = tasks.filter((t) => t.status === 'pending').length;

    // Calculate completed this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const completedThisWeek = tasks.filter((t) => {
      if (t.status !== 'completed' || !t.updated_at) {
return false;
}
      return new Date(t.updated_at) >= oneWeekAgo;
    }).length;

    return {
      activeProjects,
      pendingTasks,
      completedThisWeek,
      totalTasks: tasks.length,
      recentActivity: activity.slice(0, 5), // Latest 5 activities
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return {
      activeProjects: 0,
      pendingTasks: 0,
      completedThisWeek: 0,
      totalTasks: 0,
      recentActivity: [],
    };
  }
}

/**
 * Fetch AI overnight report
 */
export async function getAIDailyBriefing(): Promise<{ summary: string; highlights: string[] }> {
  try {
    const res = await fetch('/api/ai/overnight-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      cache: 'no-store',
    });

    return handleResponse<{ summary: string; highlights: string[] }>(res);
  } catch (error) {
    console.error('Failed to fetch AI briefing:', error);
    return {
      summary: 'AI briefing unavailable',
      highlights: [],
    };
  }
}
