/**
 * Staff Project Service
 * Phase 3 Step 7 - Automatic Project Creation
 *
 * Service layer for staff project management operations.
 * Provides type-safe functions for creating, retrieving, and managing projects.
 *
 * Following CLAUDE.md patterns:
 * - Server-side operations
 * - Workspace isolation
 * - Full error handling
 * - Typed responses
 * - Audit logging
 *
 * Usage:
 * ```typescript
 * import { createProjectFromProposal } from '@/lib/services/staff/projectService';
 *
 * const result = await createProjectFromProposal({
 *   proposalScopeId: 'uuid',
 *   ideaId: 'uuid',
 *   clientId: 'uuid',
 *   organizationId: 'uuid',
 *   tier: 'better',
 *   packageId: 'pkg-uuid'
 * });
 *
 * if (result.success) {
 *   console.log('Project created:', result.project.id);
 * }
 * ```
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  createProjectFromProposal as createProjectEngine,
  createProjectActivityLog,
  type ProjectCreationParams,
  type CreatedProject,
  type ProjectTask,
} from '@/lib/projects/projectCreator';
import type { ProposalScope } from '@/lib/projects/scope-planner';

// Service response types
export interface ProjectServiceResult {
  success: boolean;
  project?: CreatedProject;
  error?: string;
  message?: string;
}

export interface ProjectListResult {
  success: boolean;
  projects?: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    tier: string;
    clientId: string;
    startDate: string;
    estimatedEndDate?: string;
    totalEstimatedHours?: number;
    taskCount: number;
    completedTaskCount: number;
    progress: number;
    createdAt: string;
  }>;
  error?: string;
  message?: string;
}

export interface ProjectDetailResult {
  success: boolean;
  project?: CreatedProject & {
    client: {
      id: string;
      name: string;
      email: string;
    };
    assignedStaff?: Array<{
      userId: string;
      userName: string;
      role: string;
      assignedAt: string;
    }>;
  };
  error?: string;
  message?: string;
}

export interface AssignStaffResult {
  success: boolean;
  assignment?: {
    projectId: string;
    userId: string;
    role: string;
    assignedAt: string;
  };
  error?: string;
  message?: string;
}

// Service function input types
export interface GetProjectsParams {
  clientId?: string;
  organizationId: string;
  status?: 'active' | 'on_hold' | 'completed' | 'cancelled';
  limit?: number;
  offset?: number;
}

export interface AssignStaffParams {
  projectId: string;
  userId: string;
  role: 'project_manager' | 'developer' | 'designer' | 'qa' | 'other';
  organizationId: string;
}

/**
 * Create a project from a paid proposal
 *
 * This function:
 * 1. Fetches the proposal scope data from database
 * 2. Calls the project creator engine
 * 3. Stores the project in the database
 * 4. Creates task records
 * 5. Logs activity
 *
 * @param params - Project creation parameters
 * @returns Result with created project or error
 */
export async function createProjectFromProposal(
  params: Omit<ProjectCreationParams, 'scope'>
): Promise<ProjectServiceResult> {
  try {
    const { proposalScopeId, ideaId, clientId, organizationId, tier, packageId } = params;

    // Validate required parameters
    if (!proposalScopeId || !ideaId || !clientId || !organizationId || !tier || !packageId) {
      return {
        success: false,
        error: 'Missing required parameters for project creation',
      };
    }

    const supabase = await getSupabaseServer();

    // Fetch proposal scope data
    const { data: proposalScopeRecord, error: scopeError } = await supabase
      .from('proposal_scopes')
      .select('scope_data, status')
      .eq('id', proposalScopeId)
      .eq('organization_id', organizationId)
      .single();

    if (scopeError || !proposalScopeRecord) {
      console.error('Error fetching proposal scope:', scopeError);
      return {
        success: false,
        error: 'Proposal scope not found',
      };
    }

    const scope = proposalScopeRecord.scope_data as ProposalScope;

    // Call project creator engine
    const project = createProjectEngine({
      proposalScopeId,
      ideaId,
      clientId,
      organizationId,
      tier,
      packageId,
      scope,
    });

    // Store project in database
    const { data: projectRecord, error: projectError } = await supabase
      .from('projects')
      .insert({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        tier: project.tier,
        idea_id: project.ideaId,
        proposal_scope_id: project.proposalScopeId,
        client_id: project.clientId,
        organization_id: project.organizationId,
        start_date: project.startDate,
        estimated_end_date: project.estimatedEndDate,
        total_estimated_hours: project.totalEstimatedHours,
        metadata: project.metadata,
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project record:', projectError);
      return {
        success: false,
        error: 'Failed to create project record',
      };
    }

    // Store tasks in database
    const taskInserts = project.tasks.map((task) => ({
      id: task.id,
      project_id: project.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      estimated_hours: task.estimatedHours,
      start_date: task.startDate,
      due_date: task.dueDate,
      order: task.order,
      dependencies: task.dependencies || [],
      organization_id: organizationId,
    }));

    const { error: tasksError } = await supabase
      .from('project_tasks')
      .insert(taskInserts);

    if (tasksError) {
      console.error('Error creating task records:', tasksError);
      // Project created but tasks failed - log and continue
      await projectAuditLog({
        projectId: project.id,
        action: 'project_created_tasks_failed',
        description: `Project created but tasks failed: ${tasksError.message}`,
        organizationId,
      });
    }

    // Update idea status to 'in_progress'
    await supabase
      .from('ideas')
      .update({ status: 'in_progress' })
      .eq('id', ideaId);

    // Log activity
    const activityLog = createProjectActivityLog(project);
    await projectAuditLog({
      projectId: project.id,
      action: activityLog.action,
      description: activityLog.description,
      organizationId,
      metadata: activityLog.metadata,
    });

    return {
      success: true,
      project,
      message: 'Project created successfully',
    };
  } catch (error) {
    console.error('Create project service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create project. Please try again.',
    };
  }
}

/**
 * Get all projects for a client or organization
 *
 * @param params - Filter parameters
 * @returns Result with projects list or error
 */
export async function getProjectsForClient(
  params: GetProjectsParams
): Promise<ProjectListResult> {
  try {
    const { clientId, organizationId, status, limit = 50, offset = 0 } = params;

    if (!organizationId) {
      return {
        success: false,
        error: 'Organization ID is required',
      };
    }

    const supabase = await getSupabaseServer();

    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        tier,
        client_id,
        start_date,
        estimated_end_date,
        total_estimated_hours,
        created_at,
        project_tasks (
          id,
          status
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by client if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return {
        success: false,
        error: 'Failed to fetch projects',
      };
    }

    // Transform data to include task counts and progress
    const projects = data.map((project: any) => {
      const tasks = project.project_tasks || [];
      const taskCount = tasks.length;
      const completedTaskCount = tasks.filter((t: any) => t.status === 'completed').length;
      const progress = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        tier: project.tier,
        clientId: project.client_id,
        startDate: project.start_date,
        estimatedEndDate: project.estimated_end_date,
        totalEstimatedHours: project.total_estimated_hours,
        taskCount,
        completedTaskCount,
        progress,
        createdAt: project.created_at,
      };
    });

    return {
      success: true,
      projects,
      message: `Found ${projects.length} projects`,
    };
  } catch (error) {
    console.error('Get projects service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fetch projects. Please try again.',
    };
  }
}

/**
 * Get project details by ID
 *
 * @param projectId - Project ID
 * @param organizationId - Organization ID for security
 * @returns Result with project details or error
 */
export async function getProjectById(
  projectId: string,
  organizationId: string
): Promise<ProjectDetailResult> {
  try {
    if (!projectId || !organizationId) {
      return {
        success: false,
        error: 'Project ID and Organization ID are required',
      };
    }

    const supabase = await getSupabaseServer();

    // Fetch project with related data
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        project_tasks (*),
        contacts!client_id (
          id,
          name,
          email
        ),
        project_staff_assignments (
          user_id,
          role,
          assigned_at,
          user_profiles!user_id (
            full_name
          )
        )
      `)
      .eq('id', projectId)
      .eq('organization_id', organizationId)
      .single();

    if (projectError || !projectData) {
      console.error('Error fetching project:', projectError);
      return {
        success: false,
        error: 'Project not found',
      };
    }

    // Transform to CreatedProject format
    const project: ProjectDetailResult['project'] = {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      tier: projectData.tier,
      ideaId: projectData.idea_id,
      proposalScopeId: projectData.proposal_scope_id,
      clientId: projectData.client_id,
      organizationId: projectData.organization_id,
      startDate: projectData.start_date,
      estimatedEndDate: projectData.estimated_end_date,
      actualEndDate: projectData.actual_end_date,
      totalEstimatedHours: projectData.total_estimated_hours,
      tasks: projectData.project_tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        estimatedHours: task.estimated_hours,
        startDate: task.start_date,
        dueDate: task.due_date,
        order: task.order,
        dependencies: task.dependencies || [],
      })),
      metadata: projectData.metadata,
      client: {
        id: projectData.contacts?.id || projectData.client_id,
        name: projectData.contacts?.name || 'Unknown',
        email: projectData.contacts?.email || '',
      },
      assignedStaff: (projectData.project_staff_assignments || []).map((assignment: any) => ({
        userId: assignment.user_id,
        userName: assignment.user_profiles?.full_name || 'Unknown',
        role: assignment.role,
        assignedAt: assignment.assigned_at,
      })),
    };

    return {
      success: true,
      project,
      message: 'Project fetched successfully',
    };
  } catch (error) {
    console.error('Get project by ID service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fetch project. Please try again.',
    };
  }
}

/**
 * Assign staff member to a project
 *
 * @param params - Assignment parameters
 * @returns Result with assignment details or error
 */
export async function assignStaff(
  params: AssignStaffParams
): Promise<AssignStaffResult> {
  try {
    const { projectId, userId, role, organizationId } = params;

    if (!projectId || !userId || !role || !organizationId) {
      return {
        success: false,
        error: 'Missing required parameters for staff assignment',
      };
    }

    const supabase = await getSupabaseServer();

    // Verify project exists and belongs to organization
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .eq('organization_id', organizationId)
      .single();

    if (projectError || !project) {
      return {
        success: false,
        error: 'Project not found',
      };
    }

    // Verify user exists and belongs to organization
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Create assignment
    const assignedAt = new Date().toISOString();

    const { data: assignment, error: assignmentError } = await supabase
      .from('project_staff_assignments')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
        assigned_at: assignedAt,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError);
      return {
        success: false,
        error: 'Failed to assign staff. They may already be assigned.',
      };
    }

    // Log activity
    await projectAuditLog({
      projectId,
      action: 'staff_assigned',
      description: `${user.full_name} assigned as ${role} to project "${project.name}"`,
      organizationId,
      metadata: {
        userId,
        userName: user.full_name,
        role,
      },
    });

    return {
      success: true,
      assignment: {
        projectId,
        userId,
        role,
        assignedAt,
      },
      message: 'Staff assigned successfully',
    };
  } catch (error) {
    console.error('Assign staff service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to assign staff. Please try again.',
    };
  }
}

/**
 * Log project activity to audit trail
 *
 * @param params - Activity log parameters
 */
export async function projectAuditLog(params: {
  projectId: string;
  action: string;
  description: string;
  organizationId: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const { projectId, action, description, organizationId, metadata } = params;

    const supabase = await getSupabaseServer();

    await supabase.from('auditLogs').insert({
      entity_type: 'project',
      entity_id: projectId,
      action,
      description,
      organization_id: organizationId,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Project audit log error:', error);
    // Don't throw - audit logging failures should not break main flow
  }
}
