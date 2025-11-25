/**
 * Agent Planner
 * Converts high-level objectives into structured multi-step execution plans
 * Includes reasoning trace, step chaining, validation scoring, and complexity analysis
 */

import Anthropic from "@anthropic-ai/sdk";

export interface PlanStep {
  step_number: number;
  action_type: string;
  command: Record<string, any>;
  description: string;
  promised_outcome: string;
  estimated_duration_ms?: number;
}

export interface ExecutionPlan {
  objective: string;
  reasoning_trace: string;
  steps: PlanStep[];
  step_count: number;
  has_blocked_commands: boolean;
  has_approval_commands: boolean;
  uncertainty_level: number;
  estimated_total_duration_ms: number;
}

export interface PlanningRequest {
  objective: string;
  workspaceId: string;
  constraints?: string[];
  maxSteps?: number;
  allowApprovalCommands?: boolean;
}

export interface PlanningResult {
  plan: ExecutionPlan;
  complexity_score: number;
  confidence_score: number;
  risk_factors: string[];
  approval_required: boolean;
}

// Blocked commands that should never appear in plans
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

// Safe commands (no approval needed)
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
 * Agent Planner - Generates structured execution plans from objectives
 */
export class AgentPlanner {
  private anthropic: Anthropic;
  private model: string = "claude-opus-4-1-20250805";

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate an execution plan from a high-level objective
   */
  async generatePlan(request: PlanningRequest): Promise<PlanningResult> {
    const systemPrompt = `You are an autonomous agent planning system. Your task is to break down user objectives into safe, executable multi-step plans.

RULES:
1. Maximum ${request.maxSteps || 20} steps per plan
2. Each step must be atomic and verifiable
3. Steps must chain logically - output of one step feeds into next
4. Include reasoning trace for each step
5. Estimate time for each step (in milliseconds)
6. Never include blocked commands: ${BLOCKED_COMMANDS.join(", ")}
7. Flag commands requiring approval: ${APPROVAL_REQUIRED_COMMANDS.join(", ")}
8. Use only known, safe commands: ${SAFE_COMMANDS.join(", ")}
9. Include uncertainty assessment (0-100, where 100 is high uncertainty)
10. All steps must be logged to Living Intelligence Archive

BLOCKED_COMMANDS (NEVER USE THESE):
- file_delete: Deleting files
- registry_edit: Modifying system registry
- network_reconfig: Changing network settings
- system_shutdown: Shutting down system
- execute_arbitrary_binary: Running unknown executables

APPROVAL_REQUIRED_COMMANDS (FLAG WITH requires_approval: true):
- open_app: Opening applications
- close_app: Closing applications
- launch_url: Opening URLs
- system_command: Running system commands

SAFE_COMMANDS (No approval needed):
- select: Select text or elements
- type: Type text
- press: Press keys
- hotkey: Execute keyboard shortcuts
- screenshot: Take screenshots
- read_screen: Read screen contents
- extract_text: Extract text from screen
- wait_for: Wait for conditions
- cursor_move: Move cursor
- cursor_click: Click elements

RESPONSE FORMAT (JSON):
{
  "reasoning_trace": "Your step-by-step reasoning",
  "plan": {
    "objective": "User's objective",
    "steps": [
      {
        "step_number": 1,
        "action_type": "command_name",
        "command": { "param": "value" },
        "description": "What this step does",
        "promised_outcome": "Expected result",
        "estimated_duration_ms": 500
      }
    ],
    "has_blocked_commands": false,
    "has_approval_commands": true,
    "uncertainty_level": 25,
    "estimated_total_duration_ms": 5000
  },
  "confidence_score": 85,
  "risk_factors": ["Factor 1", "Factor 2"]
}`;

    const userPrompt = `Create an execution plan for this objective:

${request.objective}

${request.constraints ? `Constraints:\n${request.constraints.join("\n")}` : ""}

Requirements:
- Break down into atomic steps
- Each step must have clear command and promised outcome
- Include uncertainty assessment (0-100)
- Flag any commands requiring founder approval
- Never use blocked commands
- Estimate time for each step
- Provide reasoning trace
- Calculate overall complexity and risk

Respond in JSON format only.`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude");
      }

      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const planData = JSON.parse(jsonMatch[0]);

      // Validate plan
      this.validatePlan(planData.plan);

      // Calculate scores
      const complexity_score = this.calculateComplexityScore(planData.plan);
      const confidence_score =
        planData.confidence_score || this.calculateConfidenceScore(planData.plan);
      const approval_required =
        planData.plan.has_approval_commands &&
        (request.allowApprovalCommands !== false);

      return {
        plan: planData.plan,
        complexity_score,
        confidence_score,
        risk_factors: planData.risk_factors || [],
        approval_required,
      };
    } catch (error) {
      console.error("Error generating agent plan:", error);
      throw error;
    }
  }

  /**
   * Validate plan for compliance with sandbox rules
   */
  private validatePlan(plan: ExecutionPlan): void {
    // Check for blocked commands
    for (const step of plan.steps) {
      if (BLOCKED_COMMANDS.includes(step.action_type)) {
        throw new Error(
          `Blocked command in plan: ${step.action_type} at step ${step.step_number}`
        );
      }

      // Check for unknown commands
      if (
        !SAFE_COMMANDS.includes(step.action_type) &&
        !APPROVAL_REQUIRED_COMMANDS.includes(step.action_type)
      ) {
        console.warn(
          `Unknown command in plan: ${step.action_type} at step ${step.step_number}`
        );
      }
    }

    // Check step count
    if (plan.steps.length > 20) {
      throw new Error("Plan exceeds maximum 20 steps");
    }

    // Validate step chaining
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      if (step.step_number !== i + 1) {
        throw new Error(
          `Step numbering error: expected ${i + 1}, got ${step.step_number}`
        );
      }

      if (!step.promised_outcome) {
        throw new Error(`Step ${i + 1} missing promised_outcome`);
      }
    }
  }

  /**
   * Calculate complexity score (0-100)
   */
  private calculateComplexityScore(plan: ExecutionPlan): number {
    let score = 0;

    // 40% from number of steps
    score += Math.min(40, (plan.steps.length / 20) * 40);

    // 30% from approval requirements
    if (plan.has_approval_commands) {
      score += 30;
    }

    // 20% from uncertainty level
    score += Math.min(20, (plan.uncertainty_level / 100) * 20);

    // 10% from estimated duration
    score += Math.min(10, (plan.estimated_total_duration_ms / 10000) * 10);

    return Math.round(score);
  }

  /**
   * Calculate confidence score (0-100)
   */
  private calculateConfidenceScore(plan: ExecutionPlan): number {
    const baseConfidence = 100;
    let deductions = 0;

    // Deduct for uncertainty
    deductions += (plan.uncertainty_level / 100) * 30;

    // Deduct for approval-required commands
    if (plan.has_approval_commands) {
      deductions += 10;
    }

    // Deduct for number of steps
    deductions += Math.min(20, (plan.steps.length / 20) * 20);

    return Math.max(0, Math.round(baseConfidence - deductions));
  }

  /**
   * Estimate plan execution time
   */
  private estimateExecutionTime(plan: ExecutionPlan): number {
    return plan.steps.reduce(
      (total, step) => total + (step.estimated_duration_ms || 1000),
      0
    );
  }

  /**
   * Get command approval requirements
   */
  getCommandApprovalRequirements(commandType: string): boolean {
    return APPROVAL_REQUIRED_COMMANDS.includes(commandType);
  }

  /**
   * Check if command is allowed
   */
  isCommandAllowed(commandType: string): boolean {
    return (
      !BLOCKED_COMMANDS.includes(commandType) &&
      (SAFE_COMMANDS.includes(commandType) ||
        APPROVAL_REQUIRED_COMMANDS.includes(commandType))
    );
  }
}

/**
 * Factory function to create AgentPlanner
 */
export function createAgentPlanner(apiKey?: string): AgentPlanner {
  return new AgentPlanner(apiKey);
}
