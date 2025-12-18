/**
 * M1 Approval Handler - Phase 3
 *
 * Handles approval requests, user prompts, and token generation.
 * Implements the approval flow for write/execute scope operations.
 *
 * Flow:
 * 1. User is prompted for approval
 * 2. If approved, generates token
 * 3. Token used for policy validation
 * 4. Token expires after 5 minutes
 */

import * as readline from "readline";
import { registry } from "../tools/registry";
import { v4 as generateUUID } from "uuid";

/**
 * Result of an approval request
 */
export interface ApprovalResult {
  approved: boolean;
  token?: string;
  reason?: string;
  expiresAt?: number;
}

/**
 * Request approval from user (interactive prompt)
 *
 * Validates tool exists, presents approval request to user,
 * generates token if approved.
 */
export async function requestApprovalFromUser(
  args?: Record<string, unknown>
): Promise<ApprovalResult> {
  if (!args?.toolName || !args?.scope) {
    return {
      approved: false,
      reason: "Missing toolName or scope in approval request",
    };
  }

  // Validate tool exists
  if (!registry.hasTool(args.toolName as string)) {
    return {
      approved: false,
      reason: `Tool "${args.toolName}" not in registry`,
    };
  }

  // Get tool details
  const tool = registry.getTool(args.toolName as string);

  // Validate scope match
  if (tool?.scope !== args.scope) {
    return {
      approved: false,
      reason: `Scope mismatch: tool has scope "${tool?.scope}", requested "${args.scope}"`,
    };
  }

  // Present approval prompt to user
  console.log("\n" + "═".repeat(60));
  console.log("🔐 APPROVAL REQUEST");
  console.log("═".repeat(60));
  console.log(`Tool:     ${args.toolName}`);
  console.log(`Scope:    ${args.scope}`);
  console.log(`Reason:   ${(args.reason as string) || "No reason provided"}`);

  if (args.args) {
    console.log(
      `Args:     ${JSON.stringify(args.args, null, 2)
        .split("\n")
        .join("\n          ")}`
    );
  }

  console.log("═".repeat(60));

  // Prompt user
  const approved = await promptYesNo("Approve this request? [y/n]: ");

  if (!approved) {
    return {
      approved: false,
      reason: "User denied approval",
    };
  }

  // Generate approval token
  const token = generateApprovalToken({
    toolName: args.toolName as string,
    scope: args.scope as string,
    grantedAt: Date.now(),
  });

  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  console.log("✅ Approval granted");
  console.log(`Token: ${token}`);
  console.log(`Expires: ${new Date(expiresAt).toISOString()}\n`);

  return {
    approved: true,
    token,
    expiresAt,
  };
}

/**
 * Generate approval token (simple format for now)
 *
 * Format: approval:toolName:scope:timestamp:randomId
 *
 * Production: Should use JWT with:
 * - Signature (HMAC-SHA256 or RS256)
 * - Tool name claim
 * - Scope claim
 * - Issued at (iat) and expiration (exp)
 * - Token ID for revocation support
 */
function generateApprovalToken(data: {
  toolName: string;
  scope: string;
  grantedAt: number;
}): string {
  const randomBytes = generateUUID().split("-")[0];
  return `approval:${data.toolName}:${data.scope}:${data.grantedAt}:${randomBytes}`;
}

/**
 * Prompt user for yes/no input
 *
 * Returns true for yes/y answers, false otherwise.
 */
async function promptYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

/**
 * Check for pre-authorized tokens (for non-interactive mode)
 *
 * Used for batch mode or CI/CD environments where user prompts
 * are not appropriate.
 *
 * Allows bypassing interactive approval if token is pre-provided.
 */
export function checkPreAuthorizedToken(
  toolName: string,
  preAuthTokens?: Map<string, string>
): string | undefined {
  if (!preAuthTokens) {
return undefined;
}
  return preAuthTokens.get(toolName);
}
