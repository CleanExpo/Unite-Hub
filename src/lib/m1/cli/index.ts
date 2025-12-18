/**
 * M1 CLI Module - Phase 3 Execution Layer
 *
 * Public exports for M1 CLI command functionality.
 * Enables user-facing execution of agent goals with safety guarantees.
 */

export { runAgent, type CLIOptions } from "./agent-run";
export { executeTool, type ToolExecutionResult } from "./tool-executor";
export {
  requestApprovalFromUser,
  checkPreAuthorizedToken,
  verifyApprovalToken,
  type ApprovalResult,
} from "./approval-handler";
