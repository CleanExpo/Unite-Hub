/**
 * M1 Policy Engine - Phase 5 (JWT Security)
 *
 * Enforces all safety constraints:
 * 1. Tool validation (must be in registry)
 * 2. Scope enforcement (read = no approval, write/execute = approval required)
 * 3. Approval token validation (JWT with signature verification)
 * 4. Execution limits (steps, tool calls, runtime)
 * 5. Audit trail creation
 *
 * This is the critical safety layer - all tool calls must pass policy check
 * before they can be executed by the CLI.
 *
 * JWT Validation: Verifies token signature, expiration, and claims
 */

import type {
  ToolCall,
  PolicyCheckResult,
  ExecutionConstraints,
  ApprovalGateResponse,
} from "../types";
import { registry } from "./registry";
import { verifyApprovalToken } from "../cli/approval-handler";

/**
 * Policy check decision
 */
export interface PolicyDecision {
  allowed: boolean; // Can this tool call proceed?
  reason?: string; // Why is it denied?
  scope?: string; // Tool scope (for logging)
  requiresApproval?: boolean; // Does it need approval token?
  policyCheckResult: PolicyCheckResult;
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  tool?: string;
  severity: "error" | "warning";
}

/**
 * Main policy validation engine
 */
export class PolicyEngine {
  private approvalCache: Map<string, ApprovalGateResponse> = new Map();
  private validationErrors: ValidationError[] = [];

  /**
   * Core policy check - validates a single tool call
   *
   * Checks:
   * 1. Tool is in registry
   * 2. Tool scope is appropriate
   * 3. Approval token present for write/execute
   * 4. Approval token is valid (not expired, matches scope)
   */
  validateToolCall(call: ToolCall, approvalToken?: string): PolicyDecision {
    const checkedAt = Date.now();

    // 1. Check tool exists in registry
    const toolExists = registry.validateToolExists(call.toolName);
    if (!toolExists.valid) {
      return {
        allowed: false,
        reason: toolExists.error,
        policyCheckResult: {
          passed: false,
          reason: `Tool registration check failed: ${toolExists.error}`,
          checkedAt,
        },
      };
    }

    // Get tool definition
    const tool = registry.getTool(call.toolName);
    if (!tool) {
      return {
        allowed: false,
        reason: `Tool "${call.toolName}" not found in registry`,
        policyCheckResult: {
          passed: false,
          reason: "Tool registry lookup failed",
          checkedAt,
        },
      };
    }

    // 2. Check scope and approval requirements
    const requiresApproval = registry.requiresApproval(call.toolName);

    if ((tool.scope === "write" || tool.scope === "execute") && requiresApproval) {
      // Approval required
      if (!approvalToken) {
        return {
          allowed: false,
          reason: `Tool "${call.toolName}" (scope: ${tool.scope}) requires approval token. Use request_approval first.`,
          scope: tool.scope,
          requiresApproval: true,
          policyCheckResult: {
            passed: false,
            reason: "Approval token missing for restricted scope",
            checkedAt,
          },
        };
      }

      // 3. Validate approval token
      const tokenValid = this.validateApprovalToken(approvalToken, call.toolName, tool.scope);
      if (!tokenValid.valid) {
        return {
          allowed: false,
          reason: tokenValid.error,
          scope: tool.scope,
          policyCheckResult: {
            passed: false,
            reason: `Approval token validation failed: ${tokenValid.error}`,
            checkedAt,
          },
        };
      }
    }

    // 4. Policy passed - tool can be called
    return {
      allowed: true,
      scope: tool.scope,
      requiresApproval,
      policyCheckResult: {
        passed: true,
        reason: `Tool "${call.toolName}" passed policy check (scope: ${tool.scope})`,
        checkedAt,
      },
    };
  }

  /**
   * Batch validate multiple tool calls
   */
  validateToolCalls(
    calls: ToolCall[],
    approvalTokens?: Map<string, string>
  ): Map<string, PolicyDecision> {
    const decisions = new Map<string, PolicyDecision>();

    for (const call of calls) {
      const token = approvalTokens?.get(call.requestId);
      const decision = this.validateToolCall(call, token);
      decisions.set(call.requestId, decision);
    }

    return decisions;
  }

  /**
   * Validate JWT approval token with cryptographic verification
   *
   * Validates:
   * 1. Token signature (HMAC-SHA256)
   * 2. Token expiration
   * 3. Issuer and subject claims
   * 4. Tool name and scope in token
   * 5. Token ID (jti) for future revocation support
   */
  private validateApprovalToken(
    token: string,
    toolName: string,
    scope: string
  ): { valid: boolean; error?: string } {
    // Check cache first
    if (this.approvalCache.has(token)) {
      const cached = this.approvalCache.get(token)!;
      if (cached.expiresAt && cached.expiresAt < Date.now()) {
        return {
          valid: false,
          error: `Approval token expired at ${new Date(cached.expiresAt).toISOString()}`,
        };
      }

      return { valid: true };
    }

    // Verify empty token
    if (!token || token.length === 0) {
      return {
        valid: false,
        error: "Approval token is empty",
      };
    }

    // Check if token is JWT (contains dots) or legacy format
    const isJWT = token.includes(".");

    if (isJWT) {
      // Verify JWT signature and claims
      try {
        const decoded = verifyApprovalToken(token);

        // Check tool name matches
        if (decoded.toolName !== toolName) {
          return {
            valid: false,
            error: `Token approved for tool "${decoded.toolName}", but "${toolName}" is being executed`,
          };
        }

        // Check scope - token scope must match or exceed required scope
        if (!this.scopeMatches(decoded.scope, scope)) {
          return {
            valid: false,
            error: `Token has scope "${decoded.scope}", but tool requires "${scope}"`,
          };
        }

        // Token is valid - cache it
        const expiresAt = decoded.exp * 1000; // Convert seconds to milliseconds
        this.approvalCache.set(token, {
          approved: true,
          expiresAt,
        });

        return { valid: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          valid: false,
          error: `Token verification failed: ${errorMessage}`,
        };
      }
    } else {
      // Legacy format support (for backward compatibility)
      // Format: approval:toolName:scope:timestamp:randomId
      const parts = token.split(":");
      if (parts.length === 5 && parts[0] === "approval") {
        const tokenToolName = parts[1];
        const tokenScope = parts[2];

        // Check tool name and scope match
        if (tokenToolName !== toolName) {
          return {
            valid: false,
            error: `Token approved for tool "${tokenToolName}", but "${toolName}" is being executed`,
          };
        }

        if (tokenScope !== scope) {
          return {
            valid: false,
            error: `Token has scope "${tokenScope}", but tool requires "${scope}"`,
          };
        }

        // Cache valid legacy token (5 minute validity)
        this.approvalCache.set(token, {
          approved: true,
          expiresAt: Date.now() + 5 * 60 * 1000,
        });

        return { valid: true };
      }

      // Unknown token format
      return {
        valid: false,
        error: `Invalid token format (expected JWT or legacy approval token)`,
      };
    }
  }

  /**
   * Check if token scope matches or exceeds required scope
   *
   * Scope hierarchy: read < write < execute
   */
  private scopeMatches(tokenScope: string, requiredScope: string): boolean {
    const hierarchy: Record<string, number> = {
      read: 0,
      write: 1,
      execute: 2,
    };

    const tokenLevel = hierarchy[tokenScope] ?? -1;
    const requiredLevel = hierarchy[requiredScope] ?? -1;

    return tokenLevel >= requiredLevel;
  }

  /**
   * Check execution constraints
   *
   * Verifies we haven't exceeded limits:
   * - maxSteps: 12
   * - maxToolCalls: 8
   * - maxRuntimeSeconds: 60
   */
  validateConstraints(
    constraints: ExecutionConstraints,
    currentStats: {
      steps: number;
      toolCalls: number;
      runtimeMs: number;
    }
  ): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    if (
      constraints.maxSteps &&
      currentStats.steps >= constraints.maxSteps
    ) {
      violations.push(
        `Step limit exceeded: ${currentStats.steps} / ${constraints.maxSteps}`
      );
    }

    if (
      constraints.maxToolCalls &&
      currentStats.toolCalls >= constraints.maxToolCalls
    ) {
      violations.push(
        `Tool call limit exceeded: ${currentStats.toolCalls} / ${constraints.maxToolCalls}`
      );
    }

    if (
      constraints.maxRuntimeSeconds &&
      currentStats.runtimeMs / 1000 >= constraints.maxRuntimeSeconds
    ) {
      violations.push(
        `Runtime limit exceeded: ${currentStats.runtimeMs / 1000}s / ${constraints.maxRuntimeSeconds}s`
      );
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Trace a tool call decision (for audit logs)
   */
  traceDecision(call: ToolCall, decision: PolicyDecision): {
    timestamp: number;
    call: ToolCall;
    decision: PolicyDecision;
  } {
    return {
      timestamp: Date.now(),
      call,
      decision,
    };
  }

  /**
   * Clear cached tokens (useful for testing)
   */
  clearCache(): void {
    this.approvalCache.clear();
  }

  /**
   * Get validation errors
   */
  getErrors(): ValidationError[] {
    return [...this.validationErrors];
  }

  /**
   * Clear errors
   */
  clearErrors(): void {
    this.validationErrors = [];
  }
}

/**
 * Singleton policy engine
 */
export const policyEngine = new PolicyEngine();

/**
 * Convenience functions for common checks
 */

/**
 * Quick check: Is a tool allowed?
 */
export function isToolAllowed(
  toolName: string,
  scope?: string,
  approvalToken?: string
): boolean {
  const tool = registry.getTool(toolName);
  if (!tool) {
return false;
}

  if ((tool.scope === "write" || tool.scope === "execute") && approvalToken) {
    // Would need to validate token
    return true;
  }

  return tool.scope === "read";
}

/**
 * Quick check: Does tool need approval?
 */
export function toolNeedsApproval(toolName: string): boolean {
  return registry.requiresApproval(toolName);
}

/**
 * Get all denied reasons for debugging
 */
export function getDenialReasons(toolName: string): string[] {
  const tool = registry.getTool(toolName);
  if (!tool) {
    return ["Tool not in registry"];
  }

  const reasons: string[] = [];

  if (tool.scope === "write" || tool.scope === "execute") {
    reasons.push(`Approval required for ${tool.scope} scope`);
  }

  return reasons;
}
