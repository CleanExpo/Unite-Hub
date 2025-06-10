/**
 * Hybrid AI Agent Executor
 * Handles command execution and process management
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentCommand,
  AgentResponse,
  ExecutionContext,
  AgentStatus,
  validateAgentResponse
} from './types';

export interface ExecutorEvents {
  'execution-queued': (command: AgentCommand, executionId: string) => void;
  'execution-started': (context: ExecutionContext) => void;
  'execution-progress': (context: ExecutionContext, progress: number) => void;
  'execution-completed': (context: ExecutionContext, response: AgentResponse) => void;
  'execution-failed': (context: ExecutionContext, error: Error) => void;
  'queue-updated': (queueLength: number) => void;
}

export class AgentExecutor extends EventEmitter {
  private executionQueue: Array<{ command: AgentCommand; executionId: string }> = [];
  private activeExecutions: Map<string, ExecutionContext> = new Map();
  private maxConcurrentExecutions: number;
  private isProcessing = false;

  constructor(maxConcurrentExecutions: number = 3) {
    super();
    this.maxConcurrentExecutions = maxConcurrentExecutions;
  }

  /**
   * Queue a command for execution
   */
  queueCommand(command: AgentCommand): string {
    const executionId = uuidv4();
    
    // Add to queue with priority sorting
    this.executionQueue.push({ command, executionId });
    this.executionQueue.sort((a, b) => (a.command.priority || 3) - (b.command.priority || 3));
    
    this.emit('execution-queued', command, executionId);
    this.emit('queue-updated', this.executionQueue.length);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    return executionId;
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    queued: number;
    active: number;
    total: number;
  } {
    return {
      queued: this.executionQueue.length,
      active: this.activeExecutions.size,
      total: this.executionQueue.length + this.activeExecutions.size
    };
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): ExecutionContext[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Cancel a queued or active execution
   */
  cancelExecution(executionId: string): boolean {
    // Check if in queue
    const queueIndex = this.executionQueue.findIndex(item => item.executionId === executionId);
    if (queueIndex !== -1) {
      this.executionQueue.splice(queueIndex, 1);
      this.emit('queue-updated', this.executionQueue.length);
      return true;
    }

    // Check if active
    const activeExecution = this.activeExecutions.get(executionId);
    if (activeExecution) {
      activeExecution.status = 'cancelled';
      activeExecution.end_time = new Date();
      this.activeExecutions.delete(executionId);
      
      // Emit completion event for cancelled execution
      this.emit('execution-failed', activeExecution, new Error('Execution cancelled'));
      return true;
    }

    return false;
  }

  /**
   * Clear all queued commands
   */
  clearQueue(): number {
    const cleared = this.executionQueue.length;
    this.executionQueue = [];
    this.emit('queue-updated', 0);
    return cleared;
  }

  /**
   * Pause execution processing
   */
  pause(): void {
    this.isProcessing = false;
  }

  /**
   * Resume execution processing
   */
  resume(): void {
    if (!this.isProcessing && this.executionQueue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): ExecutionContext | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Process the execution queue
   */
  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.executionQueue.length > 0 && this.activeExecutions.size < this.maxConcurrentExecutions) {
      const item = this.executionQueue.shift();
      if (!item) break;

      const { command, executionId } = item;
      
      // Create execution context
      const executionContext: ExecutionContext = {
        execution_id: executionId,
        command: command.command,
        start_time: new Date(),
        status: 'running',
        metadata: {
          args: command.args,
          options: command.options,
          priority: command.priority,
          timeout: command.timeout
        }
      };

      this.activeExecutions.set(executionId, executionContext);
      this.emit('execution-started', executionContext);
      this.emit('queue-updated', this.executionQueue.length);

      // Execute command asynchronously
      this.executeCommand(command, executionContext).catch(error => {
        console.error(`Execution ${executionId} failed:`, error);
      });
    }

    // Check if we should continue processing
    if (this.executionQueue.length > 0) {
      // Wait a bit before checking again
      setTimeout(() => {
        if (this.isProcessing) {
          this.processQueue();
        }
      }, 100);
    } else if (this.activeExecutions.size === 0) {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single command
   */
  private async executeCommand(command: AgentCommand, context: ExecutionContext): Promise<void> {
    try {
      // Simulate command execution for now
      // In a real implementation, this would call the Python agent
      const response = await this.simulateCommandExecution(command, context);
      
      // Update context
      context.status = 'completed';
      context.end_time = new Date();
      context.output = response.message;
      
      this.emit('execution-completed', context, response);
      
    } catch (error) {
      // Update context with error
      context.status = 'failed';
      context.end_time = new Date();
      context.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.emit('execution-failed', context, error instanceof Error ? error : new Error('Unknown error'));
      
    } finally {
      // Remove from active executions
      this.activeExecutions.delete(context.execution_id);
      
      // Continue processing queue
      if (this.isProcessing && this.executionQueue.length > 0) {
        setTimeout(() => this.processQueue(), 10);
      }
    }
  }

  /**
   * Simulate command execution (to be replaced with actual Python execution)
   */
  private async simulateCommandExecution(command: AgentCommand, context: ExecutionContext): Promise<AgentResponse> {
    // Simulate execution time based on command
    const executionTime = this.getSimulatedExecutionTime(command.command);
    
    // Simulate progress updates
    const progressInterval = Math.max(100, executionTime / 10);
    let progress = 0;
    
    const progressTimer = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        this.emit('execution-progress', context, progress);
      }
    }, progressInterval);

    // Wait for simulated execution
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    clearInterval(progressTimer);
    
    // Create simulated response
    const response: AgentResponse = {
      success: true,
      message: `Command '${command.command}' executed successfully`,
      timestamp: new Date(),
      phase: this.getPhaseFromCommand(command.command),
      next_actions: this.getNextActions(command.command),
      execution_id: context.execution_id
    };

    return response;
  }

  /**
   * Get simulated execution time for different commands
   */
  private getSimulatedExecutionTime(command: string): number {
    const times: Record<string, number> = {
      'init_phase': 2000,
      'generate_tests': 5000,
      'run_docker_tests': 15000,
      'report_status': 1000,
      'complete_phase': 3000,
      'update_roadmap': 2000
    };
    
    return times[command] || 3000;
  }

  /**
   * Get phase from command
   */
  private getPhaseFromCommand(command: string): string | undefined {
    const phaseCommands = ['init_phase', 'generate_tests', 'run_docker_tests', 'complete_phase'];
    return phaseCommands.includes(command) ? 'current_phase' : undefined;
  }

  /**
   * Get next actions based on command
   */
  private getNextActions(command: string): string[] {
    const nextActions: Record<string, string[]> = {
      'init_phase': ['Generate tests with generate_tests()', 'Implement phase functionality'],
      'generate_tests': ['Review generated tests', 'Run tests with run_docker_tests()'],
      'run_docker_tests': ['Review test results', 'Fix any failing tests', 'Request approval for completion'],
      'report_status': ['Review status report', 'Continue with next action'],
      'complete_phase': ['Initialize next phase', 'Update roadmap'],
      'update_roadmap': ['Review updated roadmap', 'Continue with current phase']
    };
    
    return nextActions[command] || ['Continue with next action'];
  }

  /**
   * Get execution statistics
   */
  getStatistics(): {
    totalExecutions: number;
    averageExecutionTime: number;
    successRate: number;
    activeExecutions: number;
    queuedExecutions: number;
  } {
    // This would be implemented with actual tracking
    return {
      totalExecutions: 0,
      averageExecutionTime: 0,
      successRate: 100,
      activeExecutions: this.activeExecutions.size,
      queuedExecutions: this.executionQueue.length
    };
  }

  /**
   * Shutdown the executor
   */
  async shutdown(): Promise<void> {
    this.isProcessing = false;
    
    // Cancel all queued executions
    this.clearQueue();
    
    // Cancel all active executions
    for (const executionId of this.activeExecutions.keys()) {
      this.cancelExecution(executionId);
    }
    
    this.removeAllListeners();
  }
}

export default AgentExecutor;
