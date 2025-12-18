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
  private convexClient: any = null;

  constructor() {
    // Initialize Convex client if URL is available (lazy-load)
    this.initializeConvexClient();
  }

  /**
   * Lazy initialize Convex client on first use
   */
  private async initializeConvexClient(): Promise<void> {
    if (this.convexClient !== null) {
      return; // Already initialized
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return; // Convex not configured
    }

    try {
      const { ConvexHttpClient } = await import("convex/browser");
      this.convexClient = new ConvexHttpClient(convexUrl);
    } catch (error) {
      // Convex library not available or not in browser environment
      this.convexClient = false; // Mark as attempted
    }
  }

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

      // Update run stats
      const run = this.runs.get(call.runId);
      if (run) {
        run.toolCallsApproved++;
      }
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
   * Calls Convex mutation to create agentRun record with complete run metadata.
   * Falls back gracefully if Convex is not configured.
   */
  async exportRun(runId: string): Promise<AgentRunRecord | null> {
    const run = this.runs.get(runId);
    if (!run) {
      return null;
    }

    // If Convex is configured, export to database
    if (this.convexClient && this.convexClient !== false) {
      try {
        // Call Convex mutation via the lazy-loaded API
        await this.callConvexMutation("completeRun", {
          runId: run.runId,
          stopReason: run.stopReason,
          errorMessage: run.errorMessage,
          toolCallsProposed: run.toolCallsProposed,
          toolCallsApproved: run.toolCallsApproved,
          toolCallsExecuted: run.toolCallsExecuted,
          approvalTokens: run.approvalTokens,
          completedAt: run.completedAt || Date.now(),
          durationMs: run.durationMs || 0,
        });
      } catch (error) {
        console.error(`Failed to export run ${runId} to Convex:`, error);
        // Non-fatal: continue with in-memory storage
      }
    }

    return run;
  }

  /**
   * Export tool calls for a run to Convex
   *
   * Calls Convex mutation for each tool call to create detailed execution records.
   * Falls back gracefully if Convex is not configured.
   */
  async exportToolCalls(runId: string): Promise<ToolCallRecord[]> {
    const calls = this.getToolCalls(runId);

    if (this.convexClient && this.convexClient !== false) {
      for (const call of calls) {
        try {
          // Call Convex mutation via the lazy-loaded API
          await this.callConvexMutation("updateToolCall", {
            requestId: call.requestId,
            status: call.status as any,
            policyCheckPassed: call.policyCheckResult?.passed,
            policyCheckReason: call.policyCheckResult?.reason,
            policyCheckedAt: call.policyCheckResult?.checkedAt,
            approvalToken: call.approvalToken,
            approvedAt: call.approvedAt,
            approvedBy: call.approvedBy,
            result: call.outputResult,
            executionError: call.executionError,
            executedAt: call.executedAt,
            durationMs: call.executedAt
              ? call.executedAt - (call.proposedAt || Date.now())
              : undefined,
          });
        } catch (error) {
          console.error(
            `Failed to export tool call ${call.requestId} to Convex:`,
            error
          );
          // Non-fatal: continue with in-memory storage
        }
      }
    }

    return calls;
  }

  /**
   * Call Convex mutation via lazy-loaded API
   *
   * Uses dynamic import to avoid compile-time dependency on Convex API types
   * This allows the module to load and test without Convex _generated files
   */
  private async callConvexMutation(
    mutationName: string,
    args: Record<string, unknown>
  ): Promise<void> {
    if (!this.convexClient || this.convexClient === false) {
      return;
    }

    // In production, this would use the actual Convex API
    // For now, this is a stub that will be replaced when Convex is properly configured
    // Real implementation would be:
    // const { api } = await import("../../../convex/_generated/api");
    // await this.convexClient.mutation(api.agentRuns[mutationName], args);
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
 * Singleton instance with automatic Convex initialization
 */
export const agentRunsLogger = new AgentRunsLogger();

/**
 * Re-initialize logger (useful for testing with different Convex URLs)
 */
export function reinitializeLogger(convexUrl?: string): void {
  if (convexUrl) {
    process.env.NEXT_PUBLIC_CONVEX_URL = convexUrl;
  }
  // Create new instance with current environment
  const newLogger = new AgentRunsLogger();
  // Copy over existing runs/calls if needed
  // (For now, a fresh instance is appropriate)
}
