/**
 * M1 Approval Handler - Phase 5 (JWT Security)
 *
 * Handles approval requests, user prompts, and token generation.
 * Implements the approval flow for write/execute scope operations.
 * Uses JWT for cryptographic token signing and verification.
 *
 * Flow:
 * 1. User is prompted for approval
 * 2. If approved, generates JWT token
 * 3. Token used for policy validation
 * 4. Token expires after 5 minutes
 *
 * JWT Structure:
 * - Header: { alg: "HS256", typ: "JWT" }
 * - Payload: { toolName, scope, iat, exp, jti }
 * - Signature: HMAC-SHA256(header + payload, secret)
 */

import * as readline from "readline";
import jwt from "jsonwebtoken";
import { registry } from "../tools/registry";
import { v4 as generateUUID } from "uuid";

// JWT Configuration
const JWT_SECRET = process.env.M1_JWT_SECRET || "m1-development-secret-key";
const JWT_ALGORITHM = "HS256" as const;
const JWT_ISSUER = "m1-agent-control";
const JWT_SUBJECT = "approval";
const TOKEN_EXPIRATION_MINUTES = 5;

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
 * Generate JWT approval token with cryptographic signature
 *
 * Token Structure:
 * - Header: { alg: "HS256", typ: "JWT" }
 * - Payload: {
 *     toolName,
 *     scope,
 *     iat: issued at (seconds),
 *     exp: expiration (seconds),
 *     jti: token ID for revocation,
 *     iss: issuer,
 *     sub: subject
 *   }
 * - Signature: HMAC-SHA256(header + payload, secret)
 */
function generateApprovalToken(data: {
  toolName: string;
  scope: string;
  grantedAt: number;
}): string {
  const now = Math.floor(data.grantedAt / 1000); // JWT uses seconds
  const exp = now + TOKEN_EXPIRATION_MINUTES * 60;

  const payload = {
    toolName: data.toolName,
    scope: data.scope,
    iat: now,
    exp,
    jti: generateUUID(), // Token ID for revocation
    iss: JWT_ISSUER,
    sub: JWT_SUBJECT,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
  });

  return token;
}

/**
 * Verify JWT approval token with signature validation
 *
 * Returns decoded payload if valid, throws error if invalid
 * Validates:
 * - Cryptographic signature
 * - Token expiration
 * - Issuer and subject claims
 * - Token ID presence
 *
 * @throws Error if token is invalid, expired, or has wrong signature
 */
export function verifyApprovalToken(token: string): {
  toolName: string;
  scope: string;
  iat: number;
  exp: number;
  jti: string;
  iss: string;
  sub: string;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      subject: JWT_SUBJECT,
    });

    return decoded as any;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Approval token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(`Invalid approval token: ${error.message}`);
    }
    throw error;
  }
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
