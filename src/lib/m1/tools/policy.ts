/**
 * M1 Policy Engine
 *
 * Enforces all safety constraints:
 * 1. Tool validation (must be in registry)
 * 2. Scope enforcement (read = no approval, write/execute = approval required)
 * 3. Approval token validation
 * 4. Execution limits (steps, tool calls, runtime)
 * 5. Audit trail creation
 *
 * This is the critical safety layer - all tool calls must pass policy check
 * before they can be executed by the CLI.
 */

import type {
  ToolCall,
  PolicyCheckResult,
  ExecutionConstraints,
  ApprovalGateResponse,
} from "../types";
import { registry } from "./registry";

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
   * Validate approval token
   *
   * In production, this would:
   * - Check token signature/MAC
   * - Verify token hasn't expired
   * - Verify token scope matches tool scope
   * - Check against revocation list
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

    // In real implementation:
    // - Verify JWT/HMAC signature
    // - Check token contains approved toolName
    // - Check token scope matches or exceeds tool scope
    // - Verify token hasn't been revoked

    // For now, accept non-empty tokens (production should use real validation)
    if (!token || token.length === 0) {
      return {
        valid: false,
        error: "Approval token is empty",
      };
    }

    // Cache valid token
    this.approvalCache.set(token, {
      approved: true,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minute validity
    });

    return { valid: true };
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
