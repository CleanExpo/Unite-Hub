/**
 * Agent Archive Bridge
 * Logs agent plans, runs, and steps to the Living Intelligence Archive
 * Provides complete audit trail with uncertainty disclosures
 */

import { getSupabaseServer } from "@/lib/supabase";
import { ExecutionPlan, PlanStep } from "./agentPlanner";
import { ExecutionState, StepExecutionResult } from "./agentExecutor";

export interface AgentLogEntry {
  timestamp: string;
  action: string;
  workspace_id: string;
  plan_id?: string;
  run_id?: string;
  step_id?: string;
  user_id?: string;
  details: Record<string, any>;
  uncertainty_disclosure?: string;
}

/**
 * Agent Archive Bridge - Logs all agent activities
 */
export class AgentArchiveBridge {
  private workspaceId: string;
  private userId?: string;

  constructor(workspaceId: string, userId?: string) {
    this.workspaceId = workspaceId;
    this.userId = userId;
  }

  /**
   * Log plan creation
   */
  async logPlanCreated(
    planId: string,
    objective: string,
    plan: ExecutionPlan,
    reasoning_trace: string,
    complexity_score: number,
    confidence_score: number
  ): Promise<void> {
    try {
      const supabase = await getSupabaseServer();

      const logEntry: AgentLogEntry = {
        timestamp: new Date().toISOString(),
        action: "agent_plan_created",
        workspace_id: this.workspaceId,
        plan_id: planId,
        user_id: this.userId,
        details: {
          objective,
          step_count: plan.steps.length,
          estimated_duration_ms: plan.estimated_total_duration_ms,
          has_approval_commands: plan.has_approval_commands,
          complexity_score,
          confidence_score,
          uncertainty_level: plan.uncertainty_level,
        },
        uncertainty_disclosure: `Agent created plan with ${plan.uncertainty_level}% uncertainty. Confidence score: ${confidence_score}%.`,
      };

      // Log to aiMemory table
      await supabase.from("aiMemory").insert({
        workspace_id: this.workspaceId,
        key: `agent_plan_${planId}`,
        value: logEntry,
        metadata: { type: "agent_execution_plan" },
      });

      // Log to auditLogs table
      await supabase.from("auditLogs").insert({
        workspace_id: this.workspaceId,
        user_id: this.userId,
        action: "agent_plan_created",
        details: logEntry,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging plan created:", error);
    }
  }

  /**
   * Log plan execution started
   */
  async logPlanExecutionStarted(
    planId: string,
    runId: string,
    plan: ExecutionPlan
  ): Promise<void> {
    try {
      const supabase = await getSupabaseServer();

      const logEntry: AgentLogEntry = {
        timestamp: new Date().toISOString(),
        action: "agent_execution_started",
        workspace_id: this.workspaceId,
        plan_id: planId,
        run_id: runId,
        user_id: this.userId,
        details: {
          step_count: plan.steps.length,
          estimated_duration_ms: plan.estimated_total_duration_ms,
        },
        uncertainty_disclosure: `Execution started for plan with ${plan.uncertainty_level}% inherent uncertainty.`,
      };

      await supabase.from("auditLogs").insert({
        workspace_id: this.workspaceId,
        user_id: this.userId,
        action: "agent_execution_started",
        details: logEntry,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging execution started:", error);
    }
  }

  /**
   * Log step execution
   */
  async logStepExecution(
    planId: string,
    runId: string,
    step: PlanStep,
    result: StepExecutionResult
  ): Promise<void> {
    try {
      const supabase = await getSupabaseServer();

      const logEntry: AgentLogEntry = {
        timestamp: new Date().toISOString(),
        action: "agent_step_executed",
        workspace_id: this.workspaceId,
        plan_id: planId,
        run_id: runId,
        step_id: result.step_id,
        user_id: this.userId,
        details: {
          step_number: step.step_number,
          action_type: step.action_type,
          command: step.command,
          status: result.status,
          execution_time_ms: result.execution_time_ms,
          promised_outcome: step.promised_outcome,
          actual_outcome: result.actual_outcome,
          outcome_mismatch: result.outcome_mismatch,
          result: result.result,
          error_message: result.error_message,
        },
        uncertainty_disclosure: await this.generateStepUncertaintyDisclosure(
          step,
          result
        ),
      };

      await supabase.from("auditLogs").insert({
        workspace_id: this.workspaceId,
        user_id: this.userId,
        action: "agent_step_executed",
        details: logEntry,
        created_at: new Date().toISOString(),
      });

      // Also log uncertainty notes if mismatched
      if (result.outcome_mismatch) {
        await supabase.from("agent_uncertainty_notes").insert({
          plan_id: planId,
          step_id: result.step_id,
          confidence_score: 40, // Low confidence on mismatch
          uncertainty_factors: ["outcome_mismatch", "execution_failure"],
          disclosed_uncertainty: `Step ${step.step_number} promised "${step.promised_outcome}" but achieved "${result.actual_outcome}". This indicates execution uncertainty.`,
        });
      }
    } catch (error) {
      console.error("Error logging step execution:", error);
    }
  }

  /**
   * Log plan approval decision
   */
  async logApprovalDecision(
    planId: string,
    approved: boolean,
    approver_id: string,
    reason?: string
  ): Promise<void> {
    try {
      const supabase = await getSupabaseServer();

      const logEntry: AgentLogEntry = {
        timestamp: new Date().toISOString(),
        action: approved ? "agent_plan_approved" : "agent_plan_rejected",
        workspace_id: this.workspaceId,
        plan_id: planId,
        user_id: approver_id,
        details: {
          approved,
          approval_reason: reason,
        },
      };

      await supabase.from("auditLogs").insert({
        workspace_id: this.workspaceId,
        user_id: approver_id,
        action: approved ? "agent_plan_approved" : "agent_plan_rejected",
        details: logEntry,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging approval decision:", error);
    }
  }

  /**
   * Log plan execution completed
   */
  async logPlanExecutionCompleted(
    planId: string,
    runId: string,
    state: ExecutionState
  ): Promise<void> {
    try {
      const supabase = await getSupabaseServer();

      const logEntry: AgentLogEntry = {
        timestamp: new Date().toISOString(),
        action: "agent_execution_completed",
        workspace_id: this.workspaceId,
        plan_id: planId,
        run_id: runId,
        user_id: this.userId,
        details: {
          status: state.status,
          completed_steps: state.completed_steps,
          failed_steps: state.failed_steps,
          skipped_steps: state.skipped_steps,
          total_steps: state.total_steps,
          error: state.error,
          started_at: state.started_at,
          completed_at: state.completed_at,
        },
        uncertainty_disclosure: this.generateExecutionUncertaintyDisclosure(
          state
        ),
      };

      await supabase.from("auditLogs").insert({
        workspace_id: this.workspaceId,
        user_id: this.userId,
        action: "agent_execution_completed",
        details: logEntry,
        created_at: new Date().toISOString(),
      });

      // Update plan status in execution plans table
      await supabase
        .from("agent_execution_plans")
        .update({
          status: state.status === "completed" ? "completed" : "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", planId);
    } catch (error) {
      console.error("Error logging execution completed:", error);
    }
  }

  /**
   * Get activity log for a plan
   */
  async getActivityLog(
    planId: string,
    limit: number = 100
  ): Promise<AgentLogEntry[]> {
    try {
      const supabase = await getSupabaseServer();

      const { data, error } = await supabase
        .from("auditLogs")
        .select("details")
        .eq("workspace_id", this.workspaceId)
        .ilike("details->plan_id", `"${planId}"`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
throw error;
}

      return (data || [])
        .map((row) => row.details as AgentLogEntry)
        .filter((entry) => entry !== null);
    } catch (error) {
      console.error("Error getting activity log:", error);
      return [];
    }
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(
    planId: string,
    limit: number = 20
  ): Promise<ExecutionState[]> {
    try {
      const supabase = await getSupabaseServer();

      const { data, error } = await supabase
        .from("agent_runs")
        .select("*")
        .eq("plan_id", planId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
throw error;
}

      return data || [];
    } catch (error) {
      console.error("Error getting execution history:", error);
      return [];
    }
  }

  /**
   * Generate step-level uncertainty disclosure
   */
  private async generateStepUncertaintyDisclosure(
    step: PlanStep,
    result: StepExecutionResult
  ): Promise<string> {
    const disclosures: string[] = [];

    if (result.status === "failed") {
      disclosures.push(
        `Step ${step.step_number} failed: ${result.error_message}`
      );
    }

    if (result.outcome_mismatch) {
      disclosures.push(
        `Step ${step.step_number} outcome mismatch: promised "${step.promised_outcome}" but got "${result.actual_outcome}"`
      );
    }

    if (result.execution_time_ms > (step.estimated_duration_ms || 0) * 2) {
      disclosures.push(
        `Step ${step.step_number} took ${result.execution_time_ms}ms vs estimated ${step.estimated_duration_ms}ms`
      );
    }

    return disclosures.join("; ") || "Step executed as promised.";
  }

  /**
   * Generate execution-level uncertainty disclosure
   */
  private generateExecutionUncertaintyDisclosure(state: ExecutionState): string {
    const totalSteps = state.total_steps;
    const failureRate = state.failed_steps / totalSteps;

    if (state.status === "completed") {
      return `Plan completed successfully. All ${totalSteps} steps executed without failure.`;
    }

    if (failureRate > 0.5) {
      return `Plan execution failed with ${state.failed_steps}/${totalSteps} steps failing. High execution uncertainty.`;
    }

    if (state.failed_steps > 0) {
      return `Plan execution partially failed. ${state.completed_steps}/${totalSteps} steps completed, ${state.failed_steps} failed.`;
    }

    return `Plan execution cancelled. ${state.completed_steps}/${totalSteps} steps completed before cancellation.`;
  }
}

/**
 * Factory function to create AgentArchiveBridge
 */
export function createAgentArchiveBridge(
  workspaceId: string,
  userId?: string
): AgentArchiveBridge {
  return new AgentArchiveBridge(workspaceId, userId);
}
