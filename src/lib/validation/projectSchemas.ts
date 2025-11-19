/**
 * Project Validation Schemas - Phase 3 Step 7
 * Zod schemas for validating project-related data structures.
 */

import { z } from 'zod';

// Project status enum
export const projectStatusSchema = z.enum(['active', 'on_hold', 'completed', 'cancelled']);

// Task status enum
export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'blocked']);

// Task priority enum
export const taskPrioritySchema = z.enum(['low', 'medium', 'high']);

// Tier enum
export const tierSchema = z.enum(['good', 'better', 'best']);

// Staff role enum
export const staffRoleSchema = z.enum(['project_manager', 'developer', 'designer', 'qa', 'other']);

// ============================================================================
// PROJECT TASK SCHEMA
// ============================================================================

export const projectTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  estimatedHours: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  order: z.number().int().nonnegative(),
  dependencies: z.array(z.string()).optional(),
});

export type ProjectTask = z.infer<typeof projectTaskSchema>;

// ============================================================================
// PROJECT METADATA SCHEMA
// ============================================================================

export const projectMetadataSchema = z.object({
  createdAt: z.string().datetime(),
  createdBy: z.string(),
  packageLabel: z.string(),
  packageSummary: z.string(),
  aiGenerated: z.boolean(),
});

export type ProjectMetadata = z.infer<typeof projectMetadataSchema>;

// ============================================================================
// CREATED PROJECT SCHEMA
// ============================================================================

export const createdProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Project name is required'),
  description: z.string(),
  status: projectStatusSchema,
  tier: tierSchema,
  ideaId: z.string().uuid(),
  proposalScopeId: z.string().uuid(),
  clientId: z.string().uuid(),
  organizationId: z.string().uuid(),
  startDate: z.string().datetime(),
  estimatedEndDate: z.string().datetime().optional(),
  actualEndDate: z.string().datetime().optional(),
  totalEstimatedHours: z.number().int().positive().optional(),
  tasks: z.array(projectTaskSchema),
  metadata: projectMetadataSchema,
});

export type CreatedProject = z.infer<typeof createdProjectSchema>;

// ============================================================================
// PROJECT CREATION PARAMS SCHEMA
// ============================================================================

export const projectCreationParamsSchema = z.object({
  proposalScopeId: z.string().uuid('Invalid proposal scope ID'),
  ideaId: z.string().uuid('Invalid idea ID'),
  clientId: z.string().uuid('Invalid client ID'),
  organizationId: z.string().uuid('Invalid organization ID'),
  tier: tierSchema,
  packageId: z.string().min(1, 'Package ID is required'),
});

export type ProjectCreationParams = z.infer<typeof projectCreationParamsSchema>;

// ============================================================================
// PROJECT DETAIL SCHEMA (with client and staff)
// ============================================================================

export const projectDetailSchema = createdProjectSchema.extend({
  client: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
  }),
  assignedStaff: z.array(
    z.object({
      userId: z.string().uuid(),
      userName: z.string(),
      role: staffRoleSchema,
      assignedAt: z.string().datetime(),
    })
  ).optional(),
});

export type ProjectDetail = z.infer<typeof projectDetailSchema>;

// ============================================================================
// PROJECT LIST ITEM SCHEMA
// ============================================================================

export const projectListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: projectStatusSchema,
  tier: tierSchema,
  clientId: z.string().uuid(),
  startDate: z.string().datetime(),
  estimatedEndDate: z.string().datetime().optional(),
  totalEstimatedHours: z.number().int().positive().optional(),
  taskCount: z.number().int().nonnegative(),
  completedTaskCount: z.number().int().nonnegative(),
  progress: z.number().int().min(0).max(100),
  createdAt: z.string().datetime(),
});

export type ProjectListItem = z.infer<typeof projectListItemSchema>;

// ============================================================================
// ASSIGN STAFF PARAMS SCHEMA
// ============================================================================

export const assignStaffParamsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  userId: z.string().uuid('Invalid user ID'),
  role: staffRoleSchema,
  organizationId: z.string().uuid('Invalid organization ID'),
});

export type AssignStaffParams = z.infer<typeof assignStaffParamsSchema>;

// ============================================================================
// GET PROJECTS PARAMS SCHEMA
// ============================================================================

export const getProjectsParamsSchema = z.object({
  clientId: z.string().uuid().optional(),
  organizationId: z.string().uuid('Organization ID is required'),
  status: projectStatusSchema.optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type GetProjectsParams = z.infer<typeof getProjectsParamsSchema>;

// ============================================================================
// UPDATE PROJECT STATUS SCHEMA
// ============================================================================

export const updateProjectStatusSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  status: projectStatusSchema,
  organizationId: z.string().uuid('Invalid organization ID'),
});

export type UpdateProjectStatus = z.infer<typeof updateProjectStatusSchema>;

// ============================================================================
// UPDATE TASK STATUS SCHEMA
// ============================================================================

export const updateTaskStatusSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  status: taskStatusSchema,
  completedAt: z.string().datetime().optional(),
});

export type UpdateTaskStatus = z.infer<typeof updateTaskStatusSchema>;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateProjectCreationParams(data: unknown) {
  return projectCreationParamsSchema.safeParse(data);
}

export function validateCreatedProject(data: unknown) {
  return createdProjectSchema.safeParse(data);
}

export function validateProjectTask(data: unknown) {
  return projectTaskSchema.safeParse(data);
}

export function validateAssignStaffParams(data: unknown) {
  return assignStaffParamsSchema.safeParse(data);
}

export function validateGetProjectsParams(data: unknown) {
  return getProjectsParamsSchema.safeParse(data);
}

export function validateUpdateProjectStatus(data: unknown) {
  return updateProjectStatusSchema.safeParse(data);
}

export function validateUpdateTaskStatus(data: unknown) {
  return updateTaskStatusSchema.safeParse(data);
}
