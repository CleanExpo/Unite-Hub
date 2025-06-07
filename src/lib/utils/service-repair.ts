/**
 * Service Repair Utility
 * Handles large-scale repairs and error fixes with chunking
 */

import { TaskChunker, BatchProcessor, createRateLimitedProcessor } from './task-chunker';

export interface RepairTask {
  id: string;
  type: 'file' | 'component' | 'dependency' | 'lint' | 'type-check';
  path: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  autoFixable: boolean;
}

export interface RepairResult {
  taskId: string;
  success: boolean;
  message: string;
  fixApplied?: string;
  error?: Error;
}

export interface RepairOptions {
  maxConcurrentRepairs: number;
  repairBatchSize: number;
  delayBetweenRepairs: number;
  autoFixOnly: boolean;
  severityFilter: ('error' | 'warning' | 'info')[];
  dryRun: boolean;
  onProgress?: (current: number, total: number, currentTask?: RepairTask) => void;
}

export class ServiceRepairManager {
  private chunker: TaskChunker<RepairTask>;
  private options: RepairOptions;
  private repairHistory: RepairResult[] = [];

  constructor(options: Partial<RepairOptions> = {}) {
    this.options = {
      maxConcurrentRepairs: 3,
      repairBatchSize: 5,
      delayBetweenRepairs: 200,
      autoFixOnly: false,
      severityFilter: ['error', 'warning'],
      dryRun: false,
      ...options
    };

    this.chunker = new TaskChunker<RepairTask>({
      maxChunkSize: this.options.repairBatchSize,
      delayBetweenChunks: this.options.delayBetweenRepairs,
      maxConcurrent: this.options.maxConcurrentRepairs,
      retryAttempts: 2,
      progressCallback: (progress, total) => {
        if (this.options.onProgress) {
          this.options.onProgress(progress, total);
        }
      }
    });
  }

  /**
   * Scan for issues in the project
   */
  async scanForIssues(targetPaths: string[]): Promise<RepairTask[]> {
    const issues: RepairTask[] = [];
    const batchScanner = new BatchProcessor<string, RepairTask[]>(
      async (paths) => {
        const results: RepairTask[][] = [];
        for (const path of paths) {
          const pathIssues = await this.scanPath(path);
          results.push(pathIssues);
        }
        return results;
      },
      { maxBatchSize: 10, maxWaitTime: 500 }
    );

    // Process paths in batches
    const scanResults = await Promise.all(
      targetPaths.map(path => batchScanner.add(path))
    );

    // Flatten results
    scanResults.forEach(pathIssues => {
      issues.push(...pathIssues);
    });

    // Filter by severity
    return issues.filter(issue => 
      this.options.severityFilter.includes(issue.severity)
    );
  }

  /**
   * Scan a single path for issues
   */
  private async scanPath(path: string): Promise<RepairTask[]> {
    const issues: RepairTask[] = [];
    
    // Simulate scanning for different types of issues
    // In a real implementation, this would run actual linters, type checkers, etc.
    
    // Mock implementation for demonstration
    if (path.endsWith('.tsx') || path.endsWith('.ts')) {
      // Simulate type checking issues
      if (Math.random() > 0.7) {
        issues.push({
          id: `type-${Date.now()}-${Math.random()}`,
          type: 'type-check',
          path,
          issue: 'Type error: Property does not exist',
          severity: 'error',
          autoFixable: false
        });
      }
      
      // Simulate lint issues
      if (Math.random() > 0.5) {
        issues.push({
          id: `lint-${Date.now()}-${Math.random()}`,
          type: 'lint',
          path,
          issue: 'Missing semicolon',
          severity: 'warning',
          autoFixable: true
        });
      }
    }
    
    return issues;
  }

  /**
   * Execute repairs with chunking
   */
  async executeRepairs(tasks: RepairTask[]): Promise<{
    successful: number;
    failed: number;
    skipped: number;
    results: RepairResult[];
  }> {
    // Filter tasks if autoFixOnly is enabled
    const tasksToProcess = this.options.autoFixOnly
      ? tasks.filter(task => task.autoFixable)
      : tasks;

    const skipped = tasks.length - tasksToProcess.length;

    // Create rate-limited repair processor
    const rateLimitedRepair = createRateLimitedProcessor(
      (task: RepairTask) => this.repairSingleTask(task),
      { maxPerSecond: 10, burstSize: 15 }
    );

    // Add tasks to chunker
    this.chunker.addTasks(tasksToProcess);

    // Process all repairs
    const { results, errors } = await this.chunker.processAll(rateLimitedRepair);

    // Count successful repairs
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Store history
    this.repairHistory.push(...results);

    return {
      successful,
      failed,
      skipped,
      results
    };
  }

  /**
   * Repair a single task
   */
  private async repairSingleTask(task: RepairTask): Promise<RepairResult> {
    try {
      if (this.options.dryRun) {
        return {
          taskId: task.id,
          success: true,
          message: `[DRY RUN] Would fix: ${task.issue} in ${task.path}`,
          fixApplied: 'Dry run - no changes made'
        };
      }

      // Simulate repair logic based on task type
      switch (task.type) {
        case 'lint':
          if (task.autoFixable) {
            // Simulate lint fix
            await this.delay(100);
            return {
              taskId: task.id,
              success: true,
              message: `Fixed lint issue: ${task.issue}`,
              fixApplied: 'Added missing semicolon'
            };
          }
          break;

        case 'dependency':
          // Simulate dependency fix
          await this.delay(200);
          return {
            taskId: task.id,
            success: true,
            message: `Updated dependency in ${task.path}`,
            fixApplied: 'Updated to latest version'
          };

        case 'type-check':
          if (task.autoFixable) {
            await this.delay(150);
            return {
              taskId: task.id,
              success: true,
              message: `Fixed type issue: ${task.issue}`,
              fixApplied: 'Added type annotation'
            };
          }
          break;
      }

      return {
        taskId: task.id,
        success: false,
        message: `Cannot auto-fix: ${task.issue}`,
        error: new Error('Manual intervention required')
      };

    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        message: `Failed to repair: ${task.issue}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Get repair history
   */
  getHistory(): RepairResult[] {
    return [...this.repairHistory];
  }

  /**
   * Get current status
   */
  getStatus() {
    return this.chunker.getStatus();
  }

  /**
   * Reset the repair manager
   */
  reset(): void {
    this.chunker.reset();
    this.repairHistory = [];
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a repair plan for large-scale fixes
 */
export class RepairPlan {
  private phases: Map<string, RepairTask[]> = new Map();
  
  constructor(private tasks: RepairTask[]) {
    this.organizeTasks();
  }

  /**
   * Organize tasks into phases based on dependencies
   */
  private organizeTasks(): void {
    // Phase 1: Dependency issues (fix first)
    this.phases.set('dependencies', 
      this.tasks.filter(t => t.type === 'dependency')
    );

    // Phase 2: Type errors (fix after dependencies)
    this.phases.set('type-errors',
      this.tasks.filter(t => t.type === 'type-check' && t.severity === 'error')
    );

    // Phase 3: Lint errors
    this.phases.set('lint-errors',
      this.tasks.filter(t => t.type === 'lint' && t.severity === 'error')
    );

    // Phase 4: Warnings
    this.phases.set('warnings',
      this.tasks.filter(t => t.severity === 'warning')
    );

    // Phase 5: Info level issues
    this.phases.set('info',
      this.tasks.filter(t => t.severity === 'info')
    );
  }

  /**
   * Get phases in execution order
   */
  getPhases(): Array<{ name: string; tasks: RepairTask[] }> {
    return Array.from(this.phases.entries())
      .filter(([_, tasks]) => tasks.length > 0)
      .map(([name, tasks]) => ({ name, tasks }));
  }

  /**
   * Get phase summary
   */
  getSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    this.phases.forEach((tasks, phase) => {
      summary[phase] = tasks.length;
    });
    return summary;
  }

  /**
   * Execute the repair plan phase by phase
   */
  async execute(
    repairManager: ServiceRepairManager,
    onPhaseComplete?: (phase: string, results: any) => void
  ): Promise<void> {
    const phases = this.getPhases();
    
    for (const phase of phases) {
      console.log(`Starting phase: ${phase.name} (${phase.tasks.length} tasks)`);
      
      const results = await repairManager.executeRepairs(phase.tasks);
      
      if (onPhaseComplete) {
        onPhaseComplete(phase.name, results);
      }
      
      // Delay between phases
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
