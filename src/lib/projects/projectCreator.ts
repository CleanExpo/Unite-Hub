/**
 * Project Creator Engine
 * Phase 3 Step 7 - Automatic Project Creation
 *
 * Converts a paid proposal into a complete project with tasks, timeline, and assignments.
 *
 * Features:
 * - Deliverable → Task mapping
 * - Automatic timeline scheduling
 * - Task dependencies and ordering
 * - Activity logging
 * - Staff assignment preparation
 *
 * Usage:
 * ```typescript
 * import { createProjectFromProposal } from '@/lib/projects/projectCreator';
 *
 * const project = await createProjectFromProposal({
 *   proposalScopeId: 'uuid',
 *   ideaId: 'uuid',
 *   clientId: 'uuid',
 *   organizationId: 'uuid',
 *   tier: 'better',
 *   packageId: 'pkg-uuid'
 * });
 * ```
 */

import type { ProposalScope, ScopePackage } from './scope-planner';

export interface ProjectCreationParams {
  proposalScopeId: string;
  ideaId: string;
  clientId: string;
  organizationId: string;
  tier: 'good' | 'better' | 'best';
  packageId: string;
  scope: ProposalScope;
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  estimatedHours?: number;
  startDate?: string;
  dueDate?: string;
  order: number;
  dependencies?: string[]; // Task IDs this task depends on
}

export interface CreatedProject {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  tier: 'good' | 'better' | 'best';
  ideaId: string;
  proposalScopeId: string;
  clientId: string;
  organizationId: string;
  startDate: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  totalEstimatedHours?: number;
  tasks: ProjectTask[];
  metadata: {
    createdAt: string;
    createdBy: string;
    packageLabel: string;
    packageSummary: string;
    aiGenerated: boolean;
  };
}

/**
 * Create a complete project from a paid proposal
 *
 * This function:
 * 1. Extracts the selected package from the proposal
 * 2. Maps deliverables to tasks
 * 3. Calculates timeline and scheduling
 * 4. Generates task dependencies
 * 5. Creates activity log entries
 *
 * @param params - Project creation parameters
 * @returns Created project with tasks
 */
export function createProjectFromProposal(
  params: ProjectCreationParams
): CreatedProject {
  const {
    proposalScopeId,
    ideaId,
    clientId,
    organizationId,
    tier,
    packageId,
    scope,
  } = params;

  // Find the selected package
  const selectedPackage = scope.packages.find(
    pkg => pkg.id === packageId && pkg.tier === tier
  );

  if (!selectedPackage) {
    throw new Error('Selected package not found in proposal scope');
  }

  // Generate project ID
  const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Create project name and description
  const projectName = `${scope.idea.title} - ${selectedPackage.label} Package`;
  const projectDescription =
    selectedPackage.summary || scope.idea.description;

  // Calculate timeline
  const startDate = new Date();
  const estimatedEndDate = calculateEndDate(
    startDate,
    selectedPackage.estimatedHours,
    selectedPackage.timeline
  );

  // Generate tasks from deliverables
  const tasks = generateTasksFromDeliverables(
    selectedPackage,
    startDate,
    estimatedEndDate
  );

  // Create project object
  const project: CreatedProject = {
    id: projectId,
    name: projectName,
    description: projectDescription,
    status: 'active',
    tier: selectedPackage.tier,
    ideaId,
    proposalScopeId,
    clientId,
    organizationId,
    startDate: startDate.toISOString(),
    estimatedEndDate: estimatedEndDate?.toISOString(),
    totalEstimatedHours: selectedPackage.estimatedHours,
    tasks,
    metadata: {
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      packageLabel: selectedPackage.label,
      packageSummary: selectedPackage.summary,
      aiGenerated: scope.metadata?.aiModel?.includes('Hybrid') || false,
    },
  };

  return project;
}

/**
 * Generate tasks from package deliverables
 *
 * Maps each deliverable to a task with:
 * - Estimated hours (distributed proportionally)
 * - Priority (based on order and dependencies)
 * - Start/due dates (scheduled sequentially)
 * - Dependencies (setup tasks before development, etc.)
 */
function generateTasksFromDeliverables(
  pkg: ScopePackage,
  projectStartDate: Date,
  projectEndDate: Date | undefined
): ProjectTask[] {
  const deliverables = pkg.deliverables || [];
  const tasks: ProjectTask[] = [];

  if (deliverables.length === 0) {
    // No deliverables - create generic tasks
    tasks.push({
      id: `task-setup`,
      title: 'Project Setup',
      description: 'Initial project setup and planning',
      status: 'pending',
      priority: 'high',
      estimatedHours: 4,
      startDate: projectStartDate.toISOString(),
      order: 1,
    });

    tasks.push({
      id: `task-implementation`,
      title: 'Implementation',
      description: `Implement ${pkg.label} package features`,
      status: 'pending',
      priority: 'high',
      estimatedHours: pkg.estimatedHours ? pkg.estimatedHours * 0.7 : 40,
      order: 2,
      dependencies: ['task-setup'],
    });

    tasks.push({
      id: `task-testing`,
      title: 'Testing & QA',
      description: 'Test and verify all features',
      status: 'pending',
      priority: 'medium',
      estimatedHours: pkg.estimatedHours ? pkg.estimatedHours * 0.2 : 10,
      order: 3,
      dependencies: ['task-implementation'],
    });

    tasks.push({
      id: `task-delivery`,
      title: 'Delivery',
      description: 'Final delivery and handoff',
      status: 'pending',
      priority: 'high',
      estimatedHours: pkg.estimatedHours ? pkg.estimatedHours * 0.1 : 5,
      order: 4,
      dependencies: ['task-testing'],
    });

    return tasks;
  }

  // Create tasks from deliverables
  const totalHours = pkg.estimatedHours || deliverables.length * 8;
  const hoursPerTask = totalHours / deliverables.length;

  deliverables.forEach((deliverable, index) => {
    const taskId = `task-${index + 1}`;
    const priority = determinePriority(deliverable, index, deliverables.length);

    const task: ProjectTask = {
      id: taskId,
      title: deliverable,
      description: `Complete: ${deliverable}`,
      status: 'pending',
      priority,
      estimatedHours: Math.round(hoursPerTask),
      order: index + 1,
    };

    // Add dependencies (tasks must be done sequentially for core features)
    if (index > 0 && isCoreFeature(deliverable)) {
      task.dependencies = [`task-${index}`];
    }

    tasks.push(task);
  });

  // Calculate start/due dates for each task
  if (projectEndDate) {
    const totalDays = Math.ceil(
      (projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysPerTask = totalDays / tasks.length;

    tasks.forEach((task, index) => {
      const taskStart = new Date(projectStartDate);
      taskStart.setDate(taskStart.getDate() + Math.floor(index * daysPerTask));

      const taskEnd = new Date(taskStart);
      taskEnd.setDate(taskEnd.getDate() + Math.floor(daysPerTask));

      task.startDate = taskStart.toISOString();
      task.dueDate = taskEnd.toISOString();
    });
  }

  return tasks;
}

/**
 * Calculate project end date based on timeline or estimated hours
 */
function calculateEndDate(
  startDate: Date,
  estimatedHours: number | undefined,
  timeline: string | undefined
): Date | undefined {
  if (timeline) {
    // Parse timeline string (e.g., "4-6 weeks", "2 months")
    const weeksMatch = timeline.match(/(\d+)-?(\d+)?\s*weeks?/i);
    const monthsMatch = timeline.match(/(\d+)-?(\d+)?\s*months?/i);

    if (weeksMatch) {
      const weeks = parseInt(weeksMatch[2] || weeksMatch[1]);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + weeks * 7);
      return endDate;
    }

    if (monthsMatch) {
      const months = parseInt(monthsMatch[2] || monthsMatch[1]);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);
      return endDate;
    }
  }

  if (estimatedHours) {
    // Assume 40 hours per week, 5 days per week = 8 hours per day
    const workDays = Math.ceil(estimatedHours / 8);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + workDays);
    return endDate;
  }

  // Default: 4 weeks
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 28);
  return endDate;
}

/**
 * Determine task priority based on deliverable name and position
 */
function determinePriority(
  deliverable: string,
  index: number,
  total: number
): 'low' | 'medium' | 'high' {
  const lower = deliverable.toLowerCase();

  // High priority keywords
  if (
    lower.includes('core') ||
    lower.includes('essential') ||
    lower.includes('critical') ||
    lower.includes('setup') ||
    lower.includes('security')
  ) {
    return 'high';
  }

  // Low priority keywords
  if (
    lower.includes('optional') ||
    lower.includes('nice to have') ||
    lower.includes('polish') ||
    lower.includes('documentation')
  ) {
    return 'low';
  }

  // First few tasks are high priority
  if (index < total * 0.3) {
    return 'high';
  }

  // Last few tasks are low priority
  if (index > total * 0.7) {
    return 'low';
  }

  return 'medium';
}

/**
 * Check if deliverable is a core feature (requires sequential completion)
 */
function isCoreFeature(deliverable: string): boolean {
  const lower = deliverable.toLowerCase();

  return (
    lower.includes('core') ||
    lower.includes('essential') ||
    lower.includes('foundation') ||
    lower.includes('base') ||
    lower.includes('setup') ||
    lower.includes('infrastructure')
  );
}

/**
 * Generate activity log entry for project creation
 */
export function createProjectActivityLog(
  project: CreatedProject
): {
  action: string;
  description: string;
  timestamp: string;
  metadata: Record<string, any>;
} {
  return {
    action: 'project_created',
    description: `Project "${project.name}" created from ${project.tier} package`,
    timestamp: new Date().toISOString(),
    metadata: {
      projectId: project.id,
      tier: project.tier,
      taskCount: project.tasks.length,
      estimatedHours: project.totalEstimatedHours,
      aiGenerated: project.metadata.aiGenerated,
    },
  };
}
