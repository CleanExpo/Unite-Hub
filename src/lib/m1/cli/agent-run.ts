#!/usr/bin/env node

/**
 * M1 Agent Run CLI - Phase 3 Execution Layer
 *
 * Receives ExecutionRequest from OrchestratorAgent (Phase 2),
 * validates approval tokens, executes approved tool calls,
 * and returns ExecutionResult.
 *
 * Core Principle: All execution authority is external to the agent.
 *
 * Usage:
 *   tsx src/lib/m1/cli/agent-run.ts "goal here"
 *   npm run m1:run "goal here"
 *
 * Environment:
 *   M1_DRY_RUN=1         - Don't execute tools, just show what would run
 *   M1_VERBOSE=1         - Show detailed debug information
 *   M1_AUTO_APPROVE=1    - Auto-approve all requests (for testing)
 */

import { OrchestratorAgent } from "../agents/orchestrator";
import { policyEngine } from "../tools/policy";
import { agentRunsLogger } from "../logging/agentRuns";
import { executeTool } from "./tool-executor";
import { checkPreAuthorizedToken } from "./approval-handler";
import type { ExecutionRequest, ExecutionResult, ToolCall } from "../types";

/**
 * CLI Options for runAgent function
 */
export interface CLIOptions {
  agentConfig?: any;
  preAuthTokens?: Map<string, string>;
  autoApprove?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

/**
 * Main agent execution function
 *
 * Orchestrates the complete flow:
 * 1. Create OrchestratorAgent (Phase 2)
 * 2. Get ExecutionRequest with proposals
 * 3. Validate each proposal
 * 4. Request approvals as needed
 * 5. Execute approved tools
 * 6. Return ExecutionResult
 */
export async function runAgent(
  goal: string,
  options: CLIOptions = {}
): Promise<ExecutionResult> {
  const startTime = Date.now();

  console.log("\n" + "═".repeat(60));
  console.log("🤖 M1 Agent Run - Phase 3");
  console.log("═".repeat(60));
  console.log(`Goal: ${goal}\n`);

  if (options.dryRun) {
    console.log("⚠️  DRY RUN MODE - Tools will not be executed\n");
  }

  try {
    // ========================================
    // Phase 2: Create orchestrator and get execution request
    // ========================================

    console.log("📋 Phase 2: OrchestratorAgent reasoning...");

    const agent = new OrchestratorAgent(goal, options.agentConfig);
    const request: ExecutionRequest = await agent.execute();

    console.log(`✅ Generated ${request.proposedActions.length} proposals\n`);

    if (request.proposedActions.length === 0) {
      console.log("No actions to execute.");
      return {
        runId: request.runId,
        stopReason: "completed",
        toolCallsProposed: 0,
        toolCallsApproved: 0,
        toolCallsExecuted: 0,
        results: {},
        durationMs: Date.now() - startTime,
      };
    }

    // Display proposed actions
    console.log("Proposed Actions:");
    request.proposedActions.forEach((action, i) => {
      const approval = action.approvalRequired ? " [APPROVAL REQUIRED]" : "";
      console.log(`  ${i + 1}. ${action.toolName} (${action.scope})${approval}`);
    });
    console.log("");

    // ========================================
    // Phase 3: Execute approved actions
    // ========================================

    console.log("⚙️  Phase 3: Executing actions...\n");

    const results: Record<string, unknown> = {};
    const errors: Record<string, string> = {};
    const approvedActions: ToolCall[] = [];

    for (const action of request.proposedActions) {
      console.log(`🔄 Processing: ${action.toolName}`);

      // Handle approval requirement
      if (action.approvalRequired) {
        console.log("   → Needs approval (write/execute scope)");

        // Check for pre-authorized token
        let token = checkPreAuthorizedToken(
          action.toolName,
          options.preAuthTokens
        );

        // If auto-approve is enabled, generate mock token
        if (options.autoApprove && !token) {
          token = `auto-approved:${action.toolName}:${action.scope}`;
          console.log("   → Auto-approved (testing mode)");
        }

        // If no token, request approval
        if (!token) {
          const approvalResult = await executeTool("request_approval", {
            toolName: action.toolName,
            reason: `Execute ${action.toolName} as part of agent goal`,
            scope: action.scope,
            args: action.args,
          });

          if (
            !approvalResult.success ||
            !approvalResult.result?.approved
          ) {
            console.log(`   ❌ Approval denied\n`);
            agentRunsLogger.logPolicyCheck(
              action.requestId,
              false,
              "Approval denied by user"
            );
            errors[action.requestId] = "Approval denied";
            continue;
          }

          token = approvalResult.result.token as string;
        }

        // Validate with policy engine
        const decision = policyEngine.validateToolCall(action, token);

        if (!decision.allowed) {
          console.log(`   ❌ Policy rejected: ${decision.reason}\n`);
          agentRunsLogger.logPolicyCheck(
            action.requestId,
            false,
            decision.reason
          );
          errors[action.requestId] = decision.reason || "Policy denied";
          continue;
        }

        console.log("   ✅ Approved by policy");
        agentRunsLogger.logApprovalGranted(action.requestId, "user");
      } else {
        // Read scope - no approval needed
        console.log("   → No approval needed (read scope)");
      }

      approvedActions.push(action);

      // Execute tool
      if (options.dryRun) {
        console.log(`   ⚙️  [DRY RUN] Would execute: ${action.toolName}`);
        console.log(`   ✅ Skipped (dry run mode)\n`);
        results[action.requestId] = { dryRun: true };
      } else {
        console.log(`   ⚙️  Executing: ${action.toolName}`);
        const execResult = await executeTool(action.toolName, action.args);

        if (execResult.success) {
          console.log(
            `   ✅ Success (${execResult.durationMs}ms)\n`
          );
          results[action.requestId] = execResult.result!;
          agentRunsLogger.logToolExecution(
            action.requestId,
            execResult.result!
          );
        } else {
          console.log(
            `   ❌ Failed: ${execResult.error}\n`
          );
          errors[action.requestId] = execResult.error!;
          agentRunsLogger.logToolExecution(
            action.requestId,
            {},
            execResult.error
          );
        }
      }
    }

    // ========================================
    // Build execution result
    // ========================================

    const executionResult: ExecutionResult = {
      runId: request.runId,
      stopReason: "completed",
      toolCallsProposed: request.proposedActions.length,
      toolCallsApproved: approvedActions.length,
      toolCallsExecuted: Object.keys(results).length,
      results,
      errors:
        Object.keys(errors).length > 0
          ? errors
          : undefined,
      durationMs: Date.now() - startTime,
    };

    // Complete run logging
    agentRunsLogger.completeRun(
      request.runId,
      executionResult.stopReason,
      Object.keys(errors).length > 0 ? "Some tools failed" : undefined
    );

    // Display summary
    console.log("═".repeat(60));
    console.log("📊 Execution Summary");
    console.log("═".repeat(60));
    console.log(`Proposed:  ${executionResult.toolCallsProposed}`);
    console.log(`Approved:  ${executionResult.toolCallsApproved}`);
    console.log(`Executed:  ${executionResult.toolCallsExecuted}`);
    console.log(`Errors:    ${Object.keys(errors).length}`);
    console.log(`Duration:  ${executionResult.durationMs}ms`);
    console.log("═".repeat(60) + "\n");

    return executionResult;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    console.error("\n" + "═".repeat(60));
    console.error("❌ Fatal Error");
    console.error("═".repeat(60));
    console.error(`Error: ${errorMsg}\n`);

    if (options.verbose && error instanceof Error) {
      console.error("Stack trace:");
      console.error(error.stack);
    }

    return {
      runId: "",
      stopReason: "error",
      toolCallsProposed: 0,
      toolCallsApproved: 0,
      toolCallsExecuted: 0,
      results: {},
      errors: { _error: errorMsg },
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * CLI entry point (when run directly)
 */
if (require.main === module || process.argv[1]?.endsWith("agent-run.ts")) {
  const args = process.argv.slice(2);
  const goal = args[0];

  // Parse options
  const options: CLIOptions = {
    dryRun: process.env.M1_DRY_RUN === "1" || args.includes("--dry-run"),
    verbose: process.env.M1_VERBOSE === "1" || args.includes("--verbose"),
    autoApprove:
      process.env.M1_AUTO_APPROVE === "1" || args.includes("--auto-approve"),
  };

  if (!goal || goal === "--help" || goal === "-h") {
    console.log(`
M1 Agent Run CLI - Phase 3 Execution Layer

Usage: npm run m1:run "goal description"
       tsx src/lib/m1/cli/agent-run.ts "goal description"

Options:
  --dry-run        Don't execute tools, just show what would run
  --auto-approve   Auto-approve all approval requests (testing only)
  --verbose        Show detailed debug information
  --help, -h       Show this help message

Environment Variables:
  M1_DRY_RUN=1         Dry run mode
  M1_AUTO_APPROVE=1    Auto-approve mode
  M1_VERBOSE=1         Verbose output

Examples:
  npm run m1:run "List available M1 tools"
  npm run m1:run "Check policy for log_agent_run" --auto-approve
  npm run m1:run "List all tools and log" --verbose

Description:
  Executes agent goals with M1 safety guarantees. Receives ExecutionRequest
  from OrchestratorAgent (Phase 2), validates approval tokens, executes
  approved tool calls, and returns ExecutionResult.

  Core Principle: "Agents propose actions only; all execution authority is
  enforced externally by the CLI or host system"
    `);
    process.exit(0);
  }

  runAgent(goal, options)
    .then((result) => {
      process.exit(result.stopReason === "completed" ? 0 : 1);
    })
    .catch((error) => {
      console.error("\n❌ Unhandled error:", error);
      process.exit(1);
    });
}
