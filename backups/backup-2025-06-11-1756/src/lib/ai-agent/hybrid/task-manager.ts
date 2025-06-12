/**
 * Hybrid AI Agent Task Manager
 * Manages task definitions, dependencies, and execution scheduling
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  TaskDefinition,
  AgentCommand,
  PhaseStatus,
  RoadmapItem,
  AgentResponse,
  validateAgentCommand
} from './types';

export interface TaskManagerEvents {
  'task-created': (task: TaskDefinition) => void;
  'task-updated': (task: TaskDefinition) => void;
  'task-deleted': (taskId: string) => void;
  'task-scheduled': (task: TaskDefinition) => void;
  'dependencies-resolved': (taskId: string, resolvedDependencies: string[]) => void;
  'phase-tasks-ready': (phase: string, tasks: TaskDefinition[]) => void;
}

export class TaskManager extends EventEmitter {
  private tasks: Map<string, TaskDefinition> = new Map();
  private roadmapItems: Map<string, RoadmapItem> = new Map();
  private tasksByPhase: Map<string, string[]> = new Map();
  private dependencyGraph: Map<string, string[]> = new Map();

  constructor() {
    super();
    this.initializeDefaultTasks();
  }

  /**
   * Create a new task
   */
  createTask(taskData: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>): TaskDefinition {
    const task: TaskDefinition = {
      ...taskData,
      id: uuidv4(),
      created_at: new Date(),
      updated_at: new Date()
    };

    this.tasks.set(task.id, task);
    this.updatePhaseMapping(task);
    this.updateDependencyGraph(task);

    this.emit('task-created', task);
    return task;
  }

  /**
   * Update an existing task
   */
  updateTask(taskId: string, updates: Partial<TaskDefinition>): TaskDefinition | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    const updatedTask: TaskDefinition = {
      ...task,
      ...updates,
      updated_at: new Date()
    };

    this.tasks.set(taskId, updatedTask);
    this.updatePhaseMapping(updatedTask);
    this.updateDependencyGraph(updatedTask);

    this.emit('task-updated', updatedTask);
    return updatedTask;
  }

  /**
   * Delete a task
   */
  deleteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // Remove from phase mapping
    const phaseTasks = this.tasksByPhase.get(task.phase) || [];
    const updatedPhaseTasks = phaseTasks.filter(id => id !== taskId);
    this.tasksByPhase.set(task.phase, updatedPhaseTasks);

    // Remove from dependency graph
    this.dependencyGraph.delete(taskId);

    // Remove task dependencies from other tasks
    for (const [otherTaskId, dependencies] of this.dependencyGraph.entries()) {
      const updatedDependencies = dependencies.filter(dep => dep !== taskId);
      this.dependencyGraph.set(otherTaskId, updatedDependencies);
    }

    this.tasks.delete(taskId);
    this.emit('task-deleted', taskId);
    return true;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): TaskDefinition | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Get all tasks
   */
  getAllTasks(): TaskDefinition[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by phase
   */
  getTasksByPhase(phase: string): TaskDefinition[] {
    const taskIds = this.tasksByPhase.get(phase) || [];
    return taskIds.map(id => this.tasks.get(id)).filter(Boolean) as TaskDefinition[];
  }

  /**
   * Get ready tasks (tasks with resolved dependencies)
   */
  getReadyTasks(phase?: string): TaskDefinition[] {
    const allTasks = phase ? this.getTasksByPhase(phase) : this.getAllTasks();
    
    return allTasks.filter(task => {
      const dependencies = this.dependencyGraph.get(task.id) || [];
      return dependencies.length === 0;
    });
  }

  /**
   * Check if task dependencies are resolved
   */
  areDependenciesResolved(taskId: string): boolean {
    const dependencies = this.dependencyGraph.get(taskId) || [];
    return dependencies.length === 0;
  }

  /**
   * Resolve a task dependency
   */
  resolveDependency(taskId: string, dependencyId: string): boolean {
    const dependencies = this.dependencyGraph.get(taskId) || [];
    const updatedDependencies = dependencies.filter(dep => dep !== dependencyId);
    
    if (updatedDependencies.length !== dependencies.length) {
      this.dependencyGraph.set(taskId, updatedDependencies);
      
      if (updatedDependencies.length === 0) {
        this.emit('dependencies-resolved', taskId, dependencies);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Mark task as completed and resolve dependent tasks
   */
  completeTask(taskId: string): string[] {
    const resolvedTasks: string[] = [];
    
    // Find all tasks that depend on this task
    for (const [otherTaskId, dependencies] of this.dependencyGraph.entries()) {
      if (dependencies.includes(taskId)) {
        if (this.resolveDependency(otherTaskId, taskId)) {
          if (this.areDependenciesResolved(otherTaskId)) {
            resolvedTasks.push(otherTaskId);
          }
        }
      }
    }
    
    return resolvedTasks;
  }

  /**
   * Convert task to agent command
   */
  taskToCommand(taskId: string): AgentCommand | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    return {
      command: task.command,
      args: task.args,
      options: {
        taskId: task.id,
        phase: task.phase,
        retryCount: task.retry_count
      },
      timeout: task.timeout,
      priority: this.getTaskPriority(task)
    };
  }

  /**
   * Schedule tasks for a phase
   */
  schedulePhase(phase: string): TaskDefinition[] {
    const phaseTasks = this.getTasksByPhase(phase);
    const readyTasks = phaseTasks.filter(task => this.areDependenciesResolved(task.id));
    
    // Sort by priority and dependencies
    readyTasks.sort((a, b) => {
      const aPriority = this.getTaskPriority(a);
      const bPriority = this.getTaskPriority(b);
      return aPriority - bPriority;
    });

    this.emit('phase-tasks-ready', phase, readyTasks);
    
    readyTasks.forEach(task => {
      this.emit('task-scheduled', task);
    });

    return readyTasks;
  }

  /**
   * Get task execution order for a phase
   */
  getExecutionOrder(phase: string): TaskDefinition[] {
    const phaseTasks = this.getTasksByPhase(phase);
    const executionOrder: TaskDefinition[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string) => {
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected involving task: ${taskId}`);
      }
      
      if (visited.has(taskId)) {
        return;
      }

      visiting.add(taskId);
      
      const task = this.tasks.get(taskId);
      if (task) {
        // Visit dependencies first
        const dependencies = task.dependencies || [];
        dependencies.forEach(depId => {
          if (this.tasks.has(depId)) {
            visit(depId);
          }
        });
        
        visited.add(taskId);
        executionOrder.push(task);
      }
      
      visiting.delete(taskId);
    };

    phaseTasks.forEach(task => {
      if (!visited.has(task.id)) {
        visit(task.id);
      }
    });

    return executionOrder;
  }

  /**
   * Validate task dependencies
   */
  validateDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const task of this.tasks.values()) {
      // Check if all dependencies exist
      for (const depId of task.dependencies) {
        if (!this.tasks.has(depId)) {
          errors.push(`Task ${task.id} depends on non-existent task ${depId}`);
        }
      }

      // Check for circular dependencies
      try {
        this.detectCircularDependencies(task.id, new Set());
      } catch (error) {
        errors.push(`${error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get task statistics
   */
  getStatistics(): {
    totalTasks: number;
    tasksByPhase: Record<string, number>;
    readyTasks: number;
    blockedTasks: number;
    averageDependencies: number;
  } {
    const allTasks = this.getAllTasks();
    const tasksByPhase: Record<string, number> = {};
    let totalDependencies = 0;
    let readyCount = 0;

    allTasks.forEach(task => {
      tasksByPhase[task.phase] = (tasksByPhase[task.phase] || 0) + 1;
      totalDependencies += task.dependencies.length;
      
      if (this.areDependenciesResolved(task.id)) {
        readyCount++;
      }
    });

    return {
      totalTasks: allTasks.length,
      tasksByPhase,
      readyTasks: readyCount,
      blockedTasks: allTasks.length - readyCount,
      averageDependencies: allTasks.length > 0 ? totalDependencies / allTasks.length : 0
    };
  }

  /**
   * Export tasks as JSON
   */
  exportTasks(): string {
    const exportData = {
      tasks: Array.from(this.tasks.values()),
      roadmapItems: Array.from(this.roadmapItems.values()),
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import tasks from JSON
   */
  importTasks(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const data = JSON.parse(jsonData);
      const errors: string[] = [];
      let imported = 0;

      if (data.tasks && Array.isArray(data.tasks)) {
        for (const taskData of data.tasks) {
          try {
            const task: TaskDefinition = {
              ...taskData,
              created_at: new Date(taskData.created_at),
              updated_at: new Date(taskData.updated_at)
            };

            this.tasks.set(task.id, task);
            this.updatePhaseMapping(task);
            this.updateDependencyGraph(task);
            imported++;
          } catch (error) {
            errors.push(`Failed to import task ${taskData.id}: ${error}`);
          }
        }
      }

      return {
        success: errors.length === 0,
        imported,
        errors
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Failed to parse JSON: ${error}`]
      };
    }
  }

  /**
   * Initialize default tasks for the framework phases
   */
  private initializeDefaultTasks(): void {
    const defaultTasks: Omit<TaskDefinition, 'id' | 'created_at' | 'updated_at'>[] = [
      // Foundation Phase Tasks
      {
        name: 'Initialize Project Structure',
        description: 'Set up basic project structure and configuration',
        command: 'init_phase',
        args: ['foundation'],
        dependencies: [],
        phase: 'foundation',
        timeout: 30000,
        retry_count: 2
      },
      {
        name: 'Generate Foundation Tests',
        description: 'Create test suite for foundation phase',
        command: 'generate_tests',
        args: ['foundation'],
        dependencies: [],
        phase: 'foundation',
        timeout: 60000,
        retry_count: 3
      },
      {
        name: 'Run Foundation Tests',
        description: 'Execute foundation phase tests',
        command: 'run_docker_tests',
        args: [],
        dependencies: [],
        phase: 'foundation',
        timeout: 120000,
        retry_count: 2
      },
      
      // Implementation Phase Tasks
      {
        name: 'Initialize Implementation Phase',
        description: 'Set up implementation phase',
        command: 'init_phase',
        args: ['implementation'],
        dependencies: [],
        phase: 'implementation',
        timeout: 30000,
        retry_count: 2
      },
      {
        name: 'Generate Implementation Tests',
        description: 'Create test suite for implementation phase',
        command: 'generate_tests',
        args: ['implementation'],
        dependencies: [],
        phase: 'implementation',
        timeout: 60000,
        retry_count: 3
      },
      
      // Integration Phase Tasks
      {
        name: 'Initialize Integration Phase',
        description: 'Set up integration phase',
        command: 'init_phase',
        args: ['integration'],
        dependencies: [],
        phase: 'integration',
        timeout: 30000,
        retry_count: 2
      },
      
      // Deployment Phase Tasks
      {
        name: 'Initialize Deployment Phase',
        description: 'Set up deployment phase',
        command: 'init_phase',
        args: ['deployment'],
        dependencies: [],
        phase: 'deployment',
        timeout: 30000,
        retry_count: 2
      }
    ];

    defaultTasks.forEach(taskData => {
      this.createTask(taskData);
    });
  }

  /**
   * Update phase mapping when task is created/updated
   */
  private updatePhaseMapping(task: TaskDefinition): void {
    // Remove from old phase if it changed
    for (const [phase, taskIds] of this.tasksByPhase.entries()) {
      if (phase !== task.phase) {
        const updatedTaskIds = taskIds.filter(id => id !== task.id);
        this.tasksByPhase.set(phase, updatedTaskIds);
      }
    }

    // Add to new phase
    const phaseTasks = this.tasksByPhase.get(task.phase) || [];
    if (!phaseTasks.includes(task.id)) {
      phaseTasks.push(task.id);
      this.tasksByPhase.set(task.phase, phaseTasks);
    }
  }

  /**
   * Update dependency graph when task is created/updated
   */
  private updateDependencyGraph(task: TaskDefinition): void {
    this.dependencyGraph.set(task.id, [...task.dependencies]);
  }

  /**
   * Get task priority based on various factors
   */
  private getTaskPriority(task: TaskDefinition): number {
    // Base priority (lower number = higher priority)
    let priority = 3;

    // Adjust based on command type
    const highPriorityCommands = ['init_phase', 'run_docker_tests'];
    const lowPriorityCommands = ['report_status', 'update_roadmap'];

    if (highPriorityCommands.includes(task.command)) {
      priority = 1;
    } else if (lowPriorityCommands.includes(task.command)) {
      priority = 5;
    }

    // Adjust based on dependencies (fewer dependencies = higher priority)
    priority += Math.min(task.dependencies.length, 2);

    return priority;
  }

  /**
   * Detect circular dependencies starting from a task
   */
  private detectCircularDependencies(taskId: string, visited: Set<string>): void {
    if (visited.has(taskId)) {
      throw new Error(`Circular dependency detected: ${Array.from(visited).join(' -> ')} -> ${taskId}`);
    }

    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    visited.add(taskId);

    for (const depId of task.dependencies) {
      this.detectCircularDependencies(depId, new Set(visited));
    }

    visited.delete(taskId);
  }
}

export default TaskManager;
