/**
 * Agent Executor
 * Executes multi-step workflows through Desktop Agent Hooks
 * Manages state, retries, backoff, and monitors websocket connection to Synthex
 */

import { DesktopAgentClient } from "@/lib/desktopAgent/desktopAgentClient";
import { ExecutionPlan, PlanStep } from "./agentPlanner";
import { getSupabaseServer } from "@/lib/supabase";

export interface ExecutionState {
  run_id: string;
  plan_id: string;
  workspace_id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  current_step: number;
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface StepExecutionResult {
  step_id: string;
  step_number: number;
  status: "completed" | "failed" | "skipped" | "blocked";
  result?: Record<string, any>;
  error_message?: string;
  execution_time_ms: number;
  actual_outcome?: string;
  outcome_mismatch?: boolean;
}

export interface ExecutionOptions {
  maxRetries?: number;
  retryBackoffMs?: number;
  maxBackoffMs?: number;
  stopOnFirstFailure?: boolean;
  dryRun?: boolean;
}

const DEFAULT_OPTIONS: ExecutionOptions = {
  maxRetries: 3,
  retryBackoffMs: 1000,
  maxBackoffMs: 30000,
  stopOnFirstFailure: false,
  dryRun: false,
};

/**
 * Agent Executor - Executes multi-step plans through Desktop Agent Hooks
 */
export class AgentExecutor {
  private workspaceId: string;
  private runId: string;
  private planId: string;
  private plan: ExecutionPlan;
  private desktopAgent: DesktopAgentClient;
  private executionState: ExecutionState;
  private options: ExecutionOptions;

  constructor(
    workspaceId: string,
    runId: string,
    planId: string,
    plan: ExecutionPlan,
    options: ExecutionOptions = {}
  ) {
    this.workspaceId = workspaceId;
    this.runId = runId;
    this.planId = planId;
    this.plan = plan;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.desktopAgent = new DesktopAgentClient(workspaceId);
    this.executionState = {
      run_id: runId,
      plan_id: planId,
      workspace_id: workspaceId,
      status: "queued",
      current_step: 0,
      total_steps: plan.steps.length,
      completed_steps: 0,
      failed_steps: 0,
      skipped_steps: 0,
    };
  }

  /**
   * Execute the entire plan
   */
  async execute(): Promise<ExecutionState> {
    try {
      this.executionState.status = "running";
      this.executionState.started_at = new Date().toISOString();

      // Connect to Synthex
      await this.desktopAgent.connect();

      // Execute each step
      for (let i = 0; i < this.plan.steps.length; i++) {
        const step = this.plan.steps[i];
        this.executionState.current_step = step.step_number;

        try {
          const result = await this.executeStep(step);

          if (result.status === "completed") {
            this.executionState.completed_steps++;
          } else if (result.status === "failed") {
            this.executionState.failed_steps++;

            if (this.options.stopOnFirstFailure) {
              this.executionState.status = "failed";
              this.executionState.error = result.error_message;
              break;
            }
          } else if (result.status === "skipped") {
            this.executionState.skipped_steps++;
          }

          // Log step result
          await this.logStepExecution(step, result);
        } catch (error) {
          console.error(`Error executing step ${step.step_number}:`, error);
          this.executionState.failed_steps++;

          if (this.options.stopOnFirstFailure) {
            this.executionState.status = "failed";
            this.executionState.error = error instanceof Error ? error.message : String(error);
            break;
          }
        }
      }

      // Determine final status
      if (
        this.executionState.status !== "failed" &&
        this.executionState.completed_steps === this.plan.steps.length
      ) {
        this.executionState.status = "completed";
      } else if (this.executionState.status === "running") {
        this.executionState.status = "failed";
      }

      this.executionState.completed_at = new Date().toISOString();

      // Disconnect from Synthex
      await this.desktopAgent.disconnect();

      return this.executionState;
    } catch (error) {
      console.error("Fatal error during plan execution:", error);
      this.executionState.status = "failed";
      this.executionState.error = error instanceof Error ? error.message : String(error);
      this.executionState.completed_at = new Date().toISOString();

      try {
        await this.desktopAgent.disconnect();
      } catch (disconnectError) {
        console.error("Error disconnecting from Synthex:", disconnectError);
      }

      return this.executionState;
    }
  }

  /**
   * Execute a single step with retry logic
   */
  private async executeStep(step: PlanStep): Promise<StepExecutionResult> {
    let lastError: Error | null = null;
    let backoffMs = this.options.retryBackoffMs || 1000;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= (this.options.maxRetries || 3); attempt++) {
      try {
        if (this.options.dryRun) {
          // Dry run: simulate step execution
          return this.simulateStep(step, startTime);
        }

        // Execute command through Desktop Agent
        const response = await this.desktopAgent.executeCommand({
          commandName: step.action_type,
          parameters: step.command,
        });

        // Verify outcome vs promise
        const outcomeMatch = await this.verifyOutcome(
          step,
          response.result
        );

        return {
          step_id: step.action_type, // Will be replaced with actual ID
          step_number: step.step_number,
          status: "completed",
          result: response.result,
          execution_time_ms: Date.now() - startTime,
          actual_outcome: JSON.stringify(response.result),
          outcome_mismatch: !outcomeMatch,
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Step ${step.step_number} attempt ${attempt + 1} failed:`,
          error
        );

        // Exponential backoff
        if (attempt < (this.options.maxRetries || 3)) {
          await this.delay(backoffMs);
          backoffMs = Math.min(
            backoffMs * 2,
            this.options.maxBackoffMs || 30000
          );
        }
      }
    }

    // All retries failed
    return {
      step_id: step.action_type,
      step_number: step.step_number,
      status: "failed",
      error_message: lastError?.message || "Unknown error after retries",
      execution_time_ms: Date.now() - startTime,
    };
  }

  /**
   * Simulate step execution (for dry runs)
   */
  private simulateStep(step: PlanStep, startTime: number): StepExecutionResult {
    return {
      step_id: step.action_type,
      step_number: step.step_number,
      status: "completed",
      result: { simulated: true },
      execution_time_ms: Math.random() * 1000,
      actual_outcome: "Simulated outcome",
      outcome_mismatch: false,
    };
  }

  /**
   * Verify step outcome matches promised outcome
   */
  private async verifyOutcome(
    step: PlanStep,
    result: Record<string, any>
  ): Promise<boolean> {
    // Simple verification: check if result contains success indicator
    if (result.success === false) {
      return false;
    }

    // More sophisticated checks based on command type
    switch (step.action_type) {
      case "screenshot":
        return result.image !== undefined || result.data !== undefined;
      case "read_screen":
        return result.text !== undefined || result.data !== undefined;
      case "extract_text":
        return result.text !== undefined || result.data !== undefined;
      default:
        return result.success !== false;
    }
  }

  /**
   * Log step execution to database
   */
  private async logStepExecution(
    step: PlanStep,
    result: StepExecutionResult
  ): Promise<void> {
    try {
      const supabase = await getSupabaseServer();

      // Update step in database
      await supabase
        .from("agent_execution_steps")
        .update({
          status: result.status,
          result: result.result,
          error_message: result.error_message,
          execution_time_ms: result.execution_time_ms,
          actual_outcome: result.actual_outcome,
          outcome_mismatch: result.outcome_mismatch,
          finished_at: new Date().toISOString(),
        })
        .eq("plan_id", this.planId)
        .eq("step_number", step.step_number);
    } catch (error) {
      console.error("Error logging step execution:", error);
    }
  }

  /**
   * Get current execution state
   */
  getState(): ExecutionState {
    return { ...this.executionState };
  }

  /**
   * Cancel execution
   */
  async cancel(): Promise<void> {
    this.executionState.status = "cancelled";
    await this.desktopAgent.disconnect();
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create AgentExecutor
 */
export function createAgentExecutor(
  workspaceId: string,
  runId: string,
  planId: string,
  plan: ExecutionPlan,
  options?: ExecutionOptions
): AgentExecutor {
  return new AgentExecutor(workspaceId, runId, planId, plan, options);
}
