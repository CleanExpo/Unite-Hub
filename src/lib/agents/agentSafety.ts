/**
 * Agent Safety
 * Applies sandbox rules, whitelist validation, risk scoring, and founder approval workflow
 */

import { getSupabaseServer } from "@/lib/supabase";
import { ExecutionPlan, PlanStep } from "./agentPlanner";

export interface SafetyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  risk_score: number;
  requires_approval: boolean;
  blocked_steps: number[];
  risk_factors: string[];
}

// Blocked commands (never allow)
const BLOCKED_COMMANDS = [
  "file_delete",
  "registry_edit",
  "network_reconfig",
  "system_shutdown",
  "execute_arbitrary_binary",
];

// Commands that require founder approval
const APPROVAL_REQUIRED_COMMANDS = [
  "open_app",
  "close_app",
  "launch_url",
  "system_command",
];

// Safe commands (always allowed)
const SAFE_COMMANDS = [
  "select",
  "type",
  "press",
  "hotkey",
  "screenshot",
  "read_screen",
  "extract_text",
  "wait_for",
  "cursor_move",
  "cursor_click",
];

/**
 * Agent Safety Validator
 */
export class AgentSafety {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  /**
   * Validate entire execution plan for safety
   */
  async validatePlan(plan: ExecutionPlan): Promise<SafetyValidationResult> {
    const result: SafetyValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      risk_score: 0,
      requires_approval: false,
      blocked_steps: [],
      risk_factors: [],
    };

    // Validate each step
    for (const step of plan.steps) {
      const stepValidation = await this.validateStep(step);

      // Accumulate errors
      if (!stepValidation.valid) {
        result.valid = false;
        result.errors.push(
          `Step ${step.step_number}: ${stepValidation.error}`
        );
        result.blocked_steps.push(step.step_number);
      }

      // Accumulate warnings
      result.warnings.push(...stepValidation.warnings);

      // Track approval requirements
      if (stepValidation.requires_approval) {
        result.requires_approval = true;
      }

      // Accumulate risk score
      result.risk_score += stepValidation.risk_score;

      // Track risk factors
      result.risk_factors.push(...stepValidation.risk_factors);
    }

    // Normalize risk score to 0-100
    result.risk_score = Math.min(
      100,
      Math.round((result.risk_score / plan.steps.length) * 100)
    );

    // Determine if plan requires approval
    result.requires_approval =
      result.requires_approval || result.risk_score >= 60;

    // Additional plan-level validations
    if (plan.steps.length > 20) {
      result.errors.push("Plan exceeds maximum 20 steps");
      result.valid = false;
    }

    if (
      plan.uncertainty_level &&
      plan.uncertainty_level > 80
    ) {
      result.warnings.push("Plan has high uncertainty (>80%)");
      result.risk_factors.push("High uncertainty in execution");
    }

    return result;
  }

  /**
   * Validate a single step
   */
  private async validateStep(
    step: PlanStep
  ): Promise<{
    valid: boolean;
    error?: string;
    warnings: string[];
    requires_approval: boolean;
    risk_score: number;
    risk_factors: string[];
  }> {
    const result = {
      valid: true,
      warnings: [] as string[],
      requires_approval: false,
      risk_score: 0,
      risk_factors: [] as string[],
    };

    const commandType = step.action_type;

    // Check for blocked commands
    if (BLOCKED_COMMANDS.includes(commandType)) {
      return {
        ...result,
        valid: false,
        error: `Blocked command: ${commandType}`,
      };
    }

    // Check for unknown commands
    if (
      !SAFE_COMMANDS.includes(commandType) &&
      !APPROVAL_REQUIRED_COMMANDS.includes(commandType)
    ) {
      return {
        ...result,
        valid: false,
        error: `Unknown command: ${commandType}`,
      };
    }

    // Check for approval-required commands
    if (APPROVAL_REQUIRED_COMMANDS.includes(commandType)) {
      result.requires_approval = true;
      result.risk_score += 30;
      result.risk_factors.push(`Requires approval: ${commandType}`);
    }

    // Validate command parameters
    const paramValidation = this.validateParameters(commandType, step.command);
    if (!paramValidation.valid) {
      return {
        ...result,
        valid: false,
        error: paramValidation.error,
      };
    }

    result.warnings.push(...paramValidation.warnings);
    result.risk_score += paramValidation.risk_score;
    result.risk_factors.push(...paramValidation.risk_factors);

    // Normalize risk score to step level (0-100)
    result.risk_score = Math.min(100, result.risk_score);

    return result;
  }

  /**
   * Validate command parameters
   */
  private validateParameters(
    commandType: string,
    parameters: Record<string, any>
  ): {
    valid: boolean;
    error?: string;
    warnings: string[];
    risk_score: number;
    risk_factors: string[];
  } {
    const result = {
      valid: true,
      warnings: [] as string[],
      risk_score: 0,
      risk_factors: [] as string[],
    };

    if (!parameters || Object.keys(parameters).length === 0) {
      return {
        ...result,
        error: "Command parameters required",
      };
    }

    // Command-specific validation
    switch (commandType) {
      case "launch_url":
        if (!parameters.url) {
          return { ...result, valid: false, error: "URL parameter required" };
        }
        // Check for suspicious URLs
        if (this.isSuspiciousUrl(parameters.url)) {
          result.warnings.push("URL may be suspicious");
          result.risk_score += 20;
          result.risk_factors.push("Suspicious URL parameter");
        }
        break;

      case "open_app":
      case "close_app":
        if (!parameters.appName) {
          return {
            ...result,
            valid: false,
            error: "App name parameter required",
          };
        }
        // Check for suspicious app names
        if (this.isSuspiciousApp(parameters.appName)) {
          result.warnings.push("App may be suspicious");
          result.risk_score += 25;
          result.risk_factors.push("Suspicious application");
        }
        break;

      case "type":
      case "press":
      case "hotkey":
        if (!parameters.text && !parameters.key && !parameters.keys) {
          return {
            ...result,
            valid: false,
            error: "Text or key parameter required",
          };
        }
        break;

      case "cursor_move":
      case "cursor_click":
        if (
          parameters.x === undefined ||
          parameters.y === undefined
        ) {
          return {
            ...result,
            valid: false,
            error: "X and Y coordinates required",
          };
        }
        // Validate coordinates are within reasonable bounds
        if (
          parameters.x < 0 ||
          parameters.x > 10000 ||
          parameters.y < 0 ||
          parameters.y > 10000
        ) {
          result.warnings.push("Coordinates appear to be out of range");
        }
        break;
    }

    return result;
  }

  /**
   * Check if URL is suspicious
   */
  private isSuspiciousUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname || "";

      // Check for suspicious patterns
      const suspiciousPatterns = [
        "localhost",
        "127.0.0.1",
        "file://",
        "javascript:",
        "data:",
      ];

      for (const pattern of suspiciousPatterns) {
        if (url.toLowerCase().includes(pattern)) {
          return true;
        }
      }

      return false;
    } catch {
      return true; // Invalid URL
    }
  }

  /**
   * Check if app is suspicious
   */
  private isSuspiciousApp(appName: string): boolean {
    const suspiciousApps = [
      "cmd.exe",
      "powershell.exe",
      "regedit.exe",
      "services.msc",
      "taskmgr.exe",
      "diskpart.exe",
    ];

    return suspiciousApps.some((app) =>
      appName.toLowerCase().includes(app.toLowerCase())
    );
  }

  /**
   * Check if plan requires founder approval
   */
  async requiresApproval(
    plan: ExecutionPlan,
    workspaceId: string
  ): Promise<boolean> {
    const validation = await this.validatePlan(plan);
    return validation.requires_approval || validation.risk_score >= 60;
  }

  /**
   * Get approval status
   */
  async getApprovalStatus(
    planId: string
  ): Promise<{
    approved: boolean;
    approved_by?: string;
    approval_reason?: string;
  }> {
    try {
      const supabase = await getSupabaseServer();

      const { data, error } = await supabase
        .from("agent_risk_assessments")
        .select("approval_status, approved_by, approval_reason")
        .eq("plan_id", planId)
        .maybeSingle();

      if (error || !data) {
        return { approved: false };
      }

      return {
        approved: data.approval_status === "approved",
        approved_by: data.approved_by,
        approval_reason: data.approval_reason,
      };
    } catch (error) {
      console.error("Error getting approval status:", error);
      return { approved: false };
    }
  }

  /**
   * Rollback plan execution
   */
  async rollback(
    planId: string,
    reason: string
  ): Promise<void> {
    try {
      const supabase = await getSupabaseServer();

      // Mark plan as failed
      await supabase
        .from("agent_execution_plans")
        .update({
          status: "cancelled",
          metadata: {
            rollback_reason: reason,
            rolled_back_at: new Date().toISOString(),
          },
        })
        .eq("id", planId);

      // Mark all pending steps as skipped
      await supabase
        .from("agent_execution_steps")
        .update({
          status: "skipped",
          error_message: `Rollback: ${reason}`,
        })
        .eq("plan_id", planId)
        .eq("status", "pending");
    } catch (error) {
      console.error("Error rolling back plan:", error);
      throw error;
    }
  }
}

/**
 * Factory function to create AgentSafety
 */
export function createAgentSafety(workspaceId: string): AgentSafety {
  return new AgentSafety(workspaceId);
}
