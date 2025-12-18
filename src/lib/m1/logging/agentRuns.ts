/**
 * M1 Agent Runs Logger
 *
 * Handles persistence of agent execution runs and tool calls to Convex database.
 * Provides full observability and audit trail for all agent activity.
 *
 * Integration with Convex tables:
 * - agentRuns: Metadata for each run
 * - agentToolCalls: Individual tool call details
 */

import type {
  ExecutionConstraints,
  RunStopReason,
  ToolCall,
  ExecutionResult,
} from "../types";

/**
 * Tool call record to persist
 */
export interface ToolCallRecord {
  requestId: string;
  runId: string;
  toolName: string;
  scope: "read" | "write" | "execute";
  approvalRequired: boolean;
  status: "proposed" | "policy_rejected" | "approval_pending" | "approved" | "executed" | "execution_failed";
  inputArgs?: Record<string, unknown>;
  outputResult?: Record<string, unknown>;
  policyCheckResult?: {
    passed: boolean;
    reason?: string;
    checkedAt: number;
  };
  approvalToken?: string;
  approvedAt?: number;
  approvedBy?: string;
  executedAt?: number;
  executionError?: string;
}

/**
 * Agent run record to persist
 */
export interface AgentRunRecord {
  runId: string;
  agentName: string;
  goal: string;
  constraints: ExecutionConstraints;
  stopReason: RunStopReason;
  errorMessage?: string;
  toolCallsProposed: number;
  toolCallsApproved: number;
  toolCallsExecuted: number;
  approvalTokens: string[];
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
}

/**
 * Agent runs logger with Convex integration
 */
export class AgentRunsLogger {
  private runs: Map<string, AgentRunRecord> = new Map();
  private toolCalls: Map<string, ToolCallRecord> = new Map();

  /**
   * Create a new run record
   */
  createRun(
    runId: string,
    agentName: string,
    goal: string,
    constraints: ExecutionConstraints
  ): AgentRunRecord {
    const run: AgentRunRecord = {
      runId,
      agentName,
      goal,
      constraints,
      stopReason: "completed",
      toolCallsProposed: 0,
      toolCallsApproved: 0,
      toolCallsExecuted: 0,
      approvalTokens: [],
      startedAt: Date.now(),
    };

    this.runs.set(runId, run);
    return run;
  }

  /**
   * Log a proposed tool call
   */
  logProposedToolCall(
    runId: string,
    call: ToolCall,
    scope: "read" | "write" | "execute",
    approvalRequired: boolean
  ): ToolCallRecord {
    const record: ToolCallRecord = {
      requestId: call.requestId,
      runId,
      toolName: call.toolName,
      scope,
      approvalRequired,
      status: "proposed",
      inputArgs: call.args,
    };

    this.toolCalls.set(call.requestId, record);

    // Update run stats
    const run = this.runs.get(runId);
    if (run) {
      run.toolCallsProposed++;
    }

    return record;
  }

  /**
   * Log policy check result
   */
  logPolicyCheck(
    requestId: string,
    passed: boolean,
    reason?: string
  ): void {
    const call = this.toolCalls.get(requestId);
    if (call) {
      call.policyCheckResult = {
        passed,
        reason,
        checkedAt: Date.now(),
      };

      if (!passed) {
        call.status = "policy_rejected";
      }
    }
  }

  /**
   * Log approval request
   */
  logApprovalRequest(
    requestId: string,
    approvalToken: string
  ): void {
    const call = this.toolCalls.get(requestId);
    if (call) {
      call.status = "approval_pending";
      call.approvalToken = approvalToken;
    }
  }

  /**
   * Log approval granted
   */
  logApprovalGranted(
    requestId: string,
    approvedBy: string
  ): void {
    const call = this.toolCalls.get(requestId);
    if (call) {
      call.status = "approved";
      call.approvedAt = Date.now();
      call.approvedBy = approvedBy;
    }
  }

  /**
   * Log tool execution
   */
  logToolExecution(
    requestId: string,
    result: Record<string, unknown>,
    error?: string
  ): void {
    const call = this.toolCalls.get(requestId);
    if (call) {
      call.executedAt = Date.now();

      if (error) {
        call.status = "execution_failed";
        call.executionError = error;
      } else {
        call.status = "executed";
        call.outputResult = result;
      }

      // Update run stats
      const run = this.runs.get(call.runId);
      if (run && call.status === "executed") {
        run.toolCallsExecuted++;
      }
      if (run && call.status === "approved") {
        run.toolCallsApproved++;
      }
    }
  }

  /**
   * Complete a run
   */
  completeRun(
    runId: string,
    stopReason: RunStopReason,
    errorMessage?: string
  ): void {
    const run = this.runs.get(runId);
    if (run) {
      run.completedAt = Date.now();
      run.durationMs = run.completedAt - run.startedAt;
      run.stopReason = stopReason;
      if (errorMessage) {
        run.errorMessage = errorMessage;
      }
    }
  }

  /**
   * Add approval token to run
   */
  addApprovalToken(runId: string, token: string): void {
    const run = this.runs.get(runId);
    if (run && !run.approvalTokens.includes(token)) {
      run.approvalTokens.push(token);
    }
  }

  /**
   * Get a run
   */
  getRun(runId: string): AgentRunRecord | undefined {
    return this.runs.get(runId);
  }

  /**
   * Get tool calls for a run
   */
  getToolCalls(runId: string): ToolCallRecord[] {
    return Array.from(this.toolCalls.values()).filter(
      (call) => call.runId === runId
    );
  }

  /**
   * Get all runs (for inspection)
   */
  getAllRuns(): AgentRunRecord[] {
    return Array.from(this.runs.values());
  }

  /**
   * Clear logs (for testing)
   */
  clear(): void {
    this.runs.clear();
    this.toolCalls.clear();
  }

  /**
   * Export run for Convex persistence
   *
   * In production, this would call Convex mutation to create agentRun record
   */
  async exportRun(runId: string): Promise<AgentRunRecord | null> {
    const run = this.runs.get(runId);
    if (!run) {
return null;
}

    // TODO: Call Convex mutation
    // const result = await ctx.db.insert("agentRuns", {
    //   runId: run.runId,
    //   agentName: run.agentName,
    //   goal: run.goal,
    //   constraints: run.constraints,
    //   stopReason: run.stopReason,
    //   errorMessage: run.errorMessage,
    //   toolCallsProposed: run.toolCallsProposed,
    //   toolCallsApproved: run.toolCallsApproved,
    //   toolCallsExecuted: run.toolCallsExecuted,
    //   approvalTokens: run.approvalTokens,
    //   startedAt: run.startedAt,
    //   completedAt: run.completedAt,
    //   durationMs: run.durationMs,
    //   createdAt: Date.now(),
    // });

    return run;
  }

  /**
   * Export tool calls for a run to Convex
   *
   * In production, this would call Convex mutation for each tool call
   */
  async exportToolCalls(runId: string): Promise<ToolCallRecord[]> {
    const calls = this.getToolCalls(runId);

    for (const call of calls) {
      // TODO: Call Convex mutation for each
      // await ctx.db.insert("agentToolCalls", {
      //   requestId: call.requestId,
      //   runId: call.runId,
      //   toolName: call.toolName,
      //   scope: call.scope,
      //   approvalRequired: call.approvalRequired,
      //   status: call.status,
      //   inputArgs: call.inputArgs,
      //   outputResult: call.outputResult,
      //   policyCheckResult: call.policyCheckResult,
      //   approvalToken: call.approvalToken,
      //   approvedAt: call.approvedAt,
      //   approvedBy: call.approvedBy,
      //   executedAt: call.executedAt,
      //   executionError: call.executionError,
      //   createdAt: Date.now(),
      // });
    }

    return calls;
  }

  /**
   * Query runs by agent
   */
  runsByAgent(agentName: string): AgentRunRecord[] {
    return Array.from(this.runs.values()).filter(
      (run) => run.agentName === agentName
    );
  }

  /**
   * Query runs by stop reason
   */
  runsByStopReason(reason: RunStopReason): AgentRunRecord[] {
    return Array.from(this.runs.values()).filter(
      (run) => run.stopReason === reason
    );
  }

  /**
   * Query tool calls by status
   */
  toolCallsByStatus(
    status: ToolCallRecord["status"]
  ): ToolCallRecord[] {
    return Array.from(this.toolCalls.values()).filter(
      (call) => call.status === status
    );
  }

  /**
   * Query tool calls requiring approval
   */
  toolCallsNeedingApproval(): ToolCallRecord[] {
    return Array.from(this.toolCalls.values()).filter(
      (call) => call.approvalRequired && call.status === "proposed"
    );
  }

  /**
   * Get summary for a run
   */
  getSummary(runId: string): {
    run: AgentRunRecord | undefined;
    toolCalls: ToolCallRecord[];
    summary: {
      proposed: number;
      approved: number;
      rejected: number;
      executed: number;
      failed: number;
    };
  } | null {
    const run = this.runs.get(runId);
    if (!run) {
return null;
}

    const toolCalls = this.getToolCalls(runId);
    const summary = {
      proposed: toolCalls.filter((c) => c.status === "proposed").length,
      approved: toolCalls.filter((c) => c.status === "approved").length,
      rejected: toolCalls.filter((c) => c.status === "policy_rejected").length,
      executed: toolCalls.filter((c) => c.status === "executed").length,
      failed: toolCalls.filter((c) => c.status === "execution_failed").length,
    };

    return { run, toolCalls, summary };
  }
}

/**
 * Singleton instance
 */
export const agentRunsLogger = new AgentRunsLogger();
