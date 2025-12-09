/**
 * Task Sequencer
 *
 * Manages task ordering, dependency resolution, and priority sequencing.
 * Builds execution graph with critical path analysis.
 */

import type { WorkflowTask } from './coordinationAgent';

export interface ExecutionGraph {
  tasks: WorkflowTask[];
  criticalPath: string[]; // Task IDs on critical path
  criticalPathDuration: number; // milliseconds
  parallelizableGroups: string[][]; // Groups of tasks that can run in parallel
  dependencyMatrix: Record<string, Set<string>>; // taskId -> set of dependent task IDs
}

/**
 * Sequence tasks respecting priority and estimating overall duration
 */
export function sequenceTasks(tasks: WorkflowTask[]): WorkflowTask[] {
  // Create a map for easy lookup
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Sort tasks by priority (higher = more urgent) and estimated duration
  return tasks.sort((a, b) => {
    // If one is a dependency of the other, maintain dependency order
    if (b.dependencies?.includes(a.id)) {
      return -1; // a comes first
    }
    if (a.dependencies?.includes(b.id)) {
      return 1; // b comes first
    }

    // Otherwise, sort by priority
    const priorityDiff = b.priority - a.priority;
    if (priorityDiff !== 0) {
return priorityDiff;
}

    // If priority is same, shorter estimated duration first (quick wins)
    return (a.estimatedDuration || 60) - (b.estimatedDuration || 60);
  });
}

/**
 * Resolve dependencies and build execution graph
 */
export function resolveDependencies(tasks: WorkflowTask[]): ExecutionGraph {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const dependencyMatrix: Record<string, Set<string>> = {};

  // Build dependency matrix
  for (const task of tasks) {
    dependencyMatrix[task.id] = new Set();

    if (task.dependencies) {
      for (const depId of task.dependencies) {
        const depTask = taskMap.get(depId);
        if (depTask) {
          if (!dependencyMatrix[depId]) {
            dependencyMatrix[depId] = new Set();
          }
          dependencyMatrix[depId].add(task.id);
        }
      }
    }
  }

  // Detect circular dependencies
  validateNoCycles(tasks);

  // Calculate critical path
  const criticalPath = calculateCriticalPath(tasks, taskMap);
  const criticalPathDuration = estimateCriticalPathDuration(criticalPath, taskMap);

  // Find parallelizable groups
  const parallelizableGroups = findParallelizableGroups(tasks);

  return {
    tasks,
    criticalPath,
    criticalPathDuration,
    parallelizableGroups,
    dependencyMatrix,
  };
}

/**
 * Validate no circular dependencies exist
 */
function validateNoCycles(tasks: WorkflowTask[]): void {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(taskId: string): boolean {
    visited.add(taskId);
    recursionStack.add(taskId);

    const task = tasks.find((t) => t.id === taskId);
    if (task?.dependencies) {
      for (const depId of task.dependencies) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }
    }

    recursionStack.delete(taskId);
    return false;
  }

  for (const task of tasks) {
    if (!visited.has(task.id)) {
      if (hasCycle(task.id)) {
        throw new Error(`Circular dependency detected in workflow: ${task.id}`);
      }
    }
  }
}

/**
 * Calculate critical path (longest path through dependency graph)
 */
function calculateCriticalPath(
  tasks: WorkflowTask[],
  taskMap: Map<string, WorkflowTask>
): string[] {
  // Compute longest path to each task
  const longestPathTo: Record<string, string[]> = {};

  // Process tasks in topological order (tasks without dependencies first)
  const processed = new Set<string>();

  for (let i = 0; i < tasks.length; i++) {
    for (const task of tasks) {
      if (processed.has(task.id)) {
continue;
}

      const canProcess =
        !task.dependencies || task.dependencies.every((depId) => processed.has(depId));

      if (canProcess) {
        if (!task.dependencies || task.dependencies.length === 0) {
          longestPathTo[task.id] = [task.id];
        } else {
          // Find longest path among dependencies and extend it
          let longestDependencyPath: string[] = [];
          for (const depId of task.dependencies) {
            const depPath = longestPathTo[depId] || [];
            if (depPath.length > longestDependencyPath.length) {
              longestDependencyPath = depPath;
            }
          }
          longestPathTo[task.id] = [...longestDependencyPath, task.id];
        }

        processed.add(task.id);
      }
    }
  }

  // Find the longest path among all tasks
  let longestPath: string[] = [];
  for (const path of Object.values(longestPathTo)) {
    if (path.length > longestPath.length) {
      longestPath = path;
    }
  }

  return longestPath;
}

/**
 * Estimate total duration of critical path
 */
function estimateCriticalPathDuration(
  criticalPath: string[],
  taskMap: Map<string, WorkflowTask>
): number {
  let duration = 0;

  for (const taskId of criticalPath) {
    const task = taskMap.get(taskId);
    if (task?.estimatedDuration) {
      duration += task.estimatedDuration;
    } else {
      duration += 60; // Default 60 seconds per task
    }
  }

  return duration;
}

/**
 * Find groups of tasks that can run in parallel
 */
function findParallelizableGroups(tasks: WorkflowTask[]): string[][] {
  const groups: string[][] = [];
  const processed = new Set<string>();

  // Find tasks with no dependencies or same dependencies
  const tasksByDependency: Record<string, string[]> = {};

  for (const task of tasks) {
    const depKey = task.dependencies?.sort().join(',') || 'no-deps';

    if (!tasksByDependency[depKey]) {
      tasksByDependency[depKey] = [];
    }
    tasksByDependency[depKey].push(task.id);
  }

  // Create groups from tasks with same dependencies
  for (const taskIds of Object.values(tasksByDependency)) {
    if (taskIds.length > 1 && !taskIds.some((id) => processed.has(id))) {
      groups.push(taskIds);
      taskIds.forEach((id) => processed.add(id));
    }
  }

  // Add single tasks that aren't in groups
  for (const task of tasks) {
    if (!processed.has(task.id)) {
      groups.push([task.id]);
    }
  }

  return groups;
}

/**
 * Calculate task priority with dynamic adjustment
 */
export function calculateAdjustedPriority(
  task: WorkflowTask,
  position: number,
  totalTasks: number,
  isOnCriticalPath: boolean
): number {
  let priority = task.priority;

  // Boost priority for tasks on critical path
  if (isOnCriticalPath) {
    priority += 20;
  }

  // Boost priority for tasks early in workflow
  const positionBonus = ((totalTasks - position) / totalTasks) * 10;
  priority += positionBonus;

  // Cap at 100
  return Math.min(priority, 100);
}

/**
 * Detect bottlenecks in workflow
 */
export function detectBottlenecks(graph: ExecutionGraph): { taskId: string; reason: string }[] {
  const bottlenecks: { taskId: string; reason: string }[] = [];

  // Bottleneck 1: Tasks with many dependents
  const dependentCounts: Record<string, number> = {};
  for (const task of graph.tasks) {
    if (task.dependencies) {
      for (const depId of task.dependencies) {
        dependentCounts[depId] = (dependentCounts[depId] || 0) + 1;
      }
    }
  }

  for (const [taskId, count] of Object.entries(dependentCounts)) {
    if (count > 2) {
      bottlenecks.push({
        taskId,
        reason: `Blocks ${count} downstream tasks`,
      });
    }
  }

  // Bottleneck 2: Tasks on critical path with long duration
  for (const taskId of graph.criticalPath) {
    const task = graph.tasks.find((t) => t.id === taskId);
    if (task && (task.estimatedDuration || 60) > 300) {
      bottlenecks.push({
        taskId,
        reason: `Long duration (${task.estimatedDuration}ms) on critical path`,
      });
    }
  }

  return bottlenecks;
}

/**
 * Estimate total workflow time
 */
export function estimateWorkflowDuration(graph: ExecutionGraph): {
  sequential: number; // If all tasks run serially
  parallel: number; // If tasks run in optimal parallel groups
  critical: number; // Critical path duration
} {
  const sequential = graph.tasks.reduce((sum, t) => sum + (t.estimatedDuration || 60), 0);

  // Parallel: sum of group durations
  let parallel = 0;
  for (const group of graph.parallelizableGroups) {
    const maxDuration = Math.max(
      ...group.map((taskId) => {
        const task = graph.tasks.find((t) => t.id === taskId);
        return task?.estimatedDuration || 60;
      })
    );
    parallel += maxDuration;
  }

  return {
    sequential,
    parallel,
    critical: graph.criticalPathDuration,
  };
}
