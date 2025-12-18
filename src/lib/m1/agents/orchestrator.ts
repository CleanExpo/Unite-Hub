/**
 * M1 OrchestratorAgent - Phase 2 Implementation
 *
 * A plan-first agent that reasons about goals using Claude API and proposes
 * tool calls from the M1 registry WITHOUT executing them. All execution is
 * delegated to the CLI (Phase 3).
 *
 * Core Principle: "Agents propose actions only; all execution authority is
 * enforced externally by the CLI or host system"
 *
 * Architecture:
 * Goal → OrchestratorAgent (reason) → Propose tools → M1 Policy Engine
 *   → M1 Logger → ExecutionRequest → CLI (Phase 3 - execute)
 */

import Anthropic from "@anthropic-ai/sdk";
import { v4 as generateUUID } from "uuid";

import type {
  ExecutionConstraints,
  ExecutionRequest,
  RunStopReason,
  ToolCall,
  ToolScope,
} from "../types";
import { registry } from "../tools/registry";
import { policyEngine } from "../tools/policy";
import { agentRunsLogger } from "../logging/agentRuns";

/**
 * Configuration for OrchestratorAgent
 */
export interface OrchestratorConfig {
  model?: string; // Default: "claude-opus-4-5-20251101"
  maxTokens?: number; // Default: 1024
  temperature?: number; // Default: 0.7 (creative reasoning)
  timeout?: number; // Default: 60000 (60 seconds)
  apiKey?: string; // Uses ANTHROPIC_API_KEY env var if not provided
}

/**
 * Tool call proposal from Claude (before M1 validation)
 */
interface ToolCallProposal {
  toolName: string;
  args?: Record<string, unknown>;
  reasoning?: string;
}

/**
 * Claude's proposed response structure
 */
interface ProposalResponse {
  reasoning: string; // Why the agent chose these tools
  toolCalls: ToolCallProposal[]; // Proposed tool calls
  explanation: string; // Description of the plan
}

/**
 * Errors from OrchestratorAgent
 */
export interface OrchestratorError {
  code: string; // Error code for categorization
  message: string; // Human-readable message
  toolName?: string; // Tool involved, if applicable
  severity: "warning" | "error"; // Severity level
  timestamp: number; // When error occurred
  context?: Record<string, unknown>; // Additional debugging info
}

/**
 * OrchestratorAgent - Plans and proposes tool calls without executing
 *
 * Usage:
 * ```typescript
 * const agent = new OrchestratorAgent("Help me find weather forecasts", {
 *   model: "claude-opus-4-5-20251101"
 * });
 *
 * const request = await agent.execute();
 * // Returns ExecutionRequest with proposed tool calls
 * // No tools are executed
 * ```
 */
export class OrchestratorAgent {
  private goal: string;
  private runId: string;
  private config: Required<OrchestratorConfig>;
  private anthropic: Anthropic | null = null;
  private proposedCalls: ToolCall[] = [];
  private errors: OrchestratorError[] = [];
  private startTime: number = 0;
  private claudeMessages: Anthropic.Messages.MessageParam[] = [];
  private systemPrompt: string = "";

  constructor(goal: string, config: OrchestratorConfig = {}) {
    this.goal = goal;
    this.runId = generateUUID();

    // Apply defaults
    this.config = {
      model: config.model || "claude-opus-4-5-20251101",
      maxTokens: config.maxTokens || 1024,
      temperature: config.temperature ?? 0.7,
      timeout: config.timeout || 60000,
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY || "",
    };

    // Lazy initialize Anthropic client (delayed until needed)
  }

  /**
   * Lazy initialize Anthropic client
   */
  private getAnthropic(): Anthropic {
    if (!this.anthropic) {
      this.anthropic = new Anthropic({
        apiKey: this.config.apiKey,
        dangerouslyAllowBrowser: true, // Allow in test environment
      });
    }
    return this.anthropic;
  }

  /**
   * Main execution method - coordinates the entire proposal process
   */
  async execute(): Promise<ExecutionRequest> {
    this.startTime = Date.now();

    try {
      // Create M1 run record
      agentRunsLogger.createRun(this.runId, "orchestrator", this.goal, {
        maxSteps: 12,
        maxToolCalls: 8,
        maxRuntimeSeconds: 60,
      });

      // 1. Build system prompt with tool registry
      this.buildSystemPrompt();

      // 2. Call Claude API to generate proposals
      const proposals = await this.generateProposals();

      // 3. Validate proposals against M1 registry
      const validProposals = this.validateProposals(proposals.toolCalls);

      // 4. Create ToolCall objects for M1
      const toolCalls = this.createToolCalls(validProposals);

      // 5. Submit to M1 policy engine for validation
      const policyDecisions = await this.submitToPolicy(toolCalls);

      // 6. Filter approved calls
      const approvedCalls = toolCalls.filter((call) => {
        const decision = policyDecisions.get(call.requestId);
        return decision?.allowed ?? false;
      });

      // 7. Build and return ExecutionRequest
      const request = this.buildExecutionRequest(
        approvedCalls,
        proposals.reasoning
      );

      // 8. Complete run in M1 logger
      agentRunsLogger.completeRun(
        this.runId,
        "completed",
        this.errors.length > 0 ? `${this.errors.length} non-fatal errors` : undefined
      );

      return request;
    } catch (error) {
      // Handle critical errors
      const errorMsg =
        error instanceof Error ? error.message : String(error);

      this.logError("EXECUTION_FAILED", errorMsg, "error", {
        error: String(error),
      });

      agentRunsLogger.completeRun(
        this.runId,
        "error",
        `Agent execution failed: ${errorMsg}`
      );

      // Return minimal ExecutionRequest with error
      return {
        runId: this.runId,
        agentName: "orchestrator",
        goal: this.goal,
        constraints: { maxSteps: 12, maxToolCalls: 8, maxRuntimeSeconds: 60 },
        proposedActions: [],
      };
    }
  }

  /**
   * Build system prompt with M1 tool registry
   */
  private buildSystemPrompt(): void {
    const tools = registry.listTools();
    const toolDescriptions = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      scope: tool.scope,
      parameters: tool.parameters,
    }));

    this.systemPrompt = `You are the Orchestrator Agent for M1 - a safety-focused agent architecture.

Your role:
1. You NEVER execute tools. You ONLY propose them.
2. You ONLY propose tools from the M1 registry (listed below)
3. You generate reasoning BEFORE proposing
4. You explain why each tool is needed

Available Tools from M1 Registry:
${JSON.stringify(toolDescriptions, null, 2)}

CRITICAL CONSTRAINTS:
- Do NOT propose tools outside this list
- Do NOT modify tool scopes
- Do NOT attempt to execute any tools
- Do NOT make assumptions about approval tokens
- You are proposing ONLY - the CLI will handle execution

For the given goal:
1. Reason about what's needed
2. Identify required tools from the registry above
3. Propose tool calls with arguments matching the schema
4. Format your response as JSON

Return your response in this JSON format:
{
  "reasoning": "Your step-by-step reasoning about the goal",
  "toolCalls": [
    {
      "toolName": "tool_name_from_registry",
      "args": { "arg1": "value1", ... },
      "reasoning": "Why this tool is needed"
    }
  ],
  "explanation": "Overall explanation of the plan"
}`;
  }

  /**
   * Call Claude API to generate tool proposals
   */
  private async generateProposals(): Promise<ProposalResponse> {
    try {
      // Add user message
      this.claudeMessages.push({
        role: "user",
        content: `Goal: ${this.goal}

Please propose the M1 tools needed to accomplish this goal. Remember:
- Only propose tools from the registry
- Include reasoning for each tool
- Format as JSON
- Never execute, only propose`,
      });

      // Call Claude API
      const response = await this.getAnthropic().messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: this.systemPrompt,
        messages: this.claudeMessages,
      });

      // Extract text from response
      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("Claude API returned no text content");
      }

      // Add assistant message to history
      this.claudeMessages.push({
        role: "assistant",
        content: textContent.text,
      });

      // Parse JSON response
      let proposalResponse: ProposalResponse;
      try {
        // Extract JSON from response (Claude might include markdown code blocks)
        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }

        proposalResponse = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        this.logError(
          "PARSE_ERROR",
          `Failed to parse Claude response: ${String(parseError)}`,
          "error",
          { response: textContent.text }
        );

        // Fallback: return empty proposals
        return {
          reasoning: "Failed to parse Claude response",
          toolCalls: [],
          explanation: "Error parsing tool proposals",
        };
      }

      return proposalResponse;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);

      this.logError("CLAUDE_API_ERROR", errorMsg, "error", {
        goal: this.goal,
        error: String(error),
      });

      // Return empty proposals on API error
      return {
        reasoning: `Claude API error: ${errorMsg}`,
        toolCalls: [],
        explanation: "Failed to generate proposals due to API error",
      };
    }
  }

  /**
   * Validate proposals against M1 registry
   */
  private validateProposals(
    proposals: ToolCallProposal[]
  ): ToolCallProposal[] {
    if (!proposals || proposals.length === 0) {
      this.logError(
        "NO_PROPOSALS",
        "Claude did not generate any tool proposals",
        "warning"
      );
      return [];
    }

    // Truncate if over maxToolCalls (8)
    if (proposals.length > 8) {
      this.logError(
        "TRUNCATED_PROPOSALS",
        `Generated ${proposals.length} proposals, truncating to 8`,
        "warning"
      );
      proposals = proposals.slice(0, 8);
    }

    const validProposals: ToolCallProposal[] = [];

    for (const proposal of proposals) {
      // Check tool exists in registry
      if (!registry.hasTool(proposal.toolName)) {
        this.logError(
          "UNKNOWN_TOOL",
          `Tool "${proposal.toolName}" not in M1 registry`,
          "warning",
          { toolName: proposal.toolName }
        );
        continue; // Skip this proposal
      }

      // Get tool definition
      const toolDef = registry.getTool(proposal.toolName);
      if (!toolDef) {
        this.logError(
          "TOOL_LOOKUP_FAILED",
          `Could not retrieve definition for "${proposal.toolName}"`,
          "error",
          { toolName: proposal.toolName }
        );
        continue;
      }

      // Validate arguments match schema (if schema provided)
      if (
        toolDef.parameters &&
        proposal.args &&
        typeof proposal.args === "object"
      ) {
        // Basic validation - could be expanded
        // For now, trust Claude and let policy engine do full validation
      }

      validProposals.push(proposal);
    }

    return validProposals;
  }

  /**
   * Create ToolCall objects from validated proposals
   */
  private createToolCalls(proposals: ToolCallProposal[]): ToolCall[] {
    const toolCalls: ToolCall[] = [];

    for (const proposal of proposals) {
      const scope = registry.getToolScope(proposal.toolName);
      if (!scope) {
        continue; // Skip if scope not found
      }

      const call: ToolCall = {
        requestId: generateUUID(),
        toolName: proposal.toolName,
        args: proposal.args,
        scope: scope as ToolScope,
        approvalRequired: registry.requiresApproval(proposal.toolName),
      };

      // Log to M1 logger
      agentRunsLogger.logProposedToolCall(
        this.runId,
        call,
        scope as ToolScope,
        call.approvalRequired
      );

      toolCalls.push(call);
      this.proposedCalls.push(call);
    }

    return toolCalls;
  }

  /**
   * Submit tool calls to M1 policy engine for validation
   */
  private async submitToPolicy(
    toolCalls: ToolCall[]
  ): Promise<Map<string, ReturnType<typeof policyEngine.validateToolCall>>> {
    const decisions = new Map();

    for (const call of toolCalls) {
      // Validate with policy engine
      const decision = policyEngine.validateToolCall(call);

      // Log policy decision to M1 logger
      agentRunsLogger.logPolicyCheck(
        call.requestId,
        decision.allowed,
        decision.reason
      );

      decisions.set(call.requestId, decision);

      // Track policy rejections
      if (!decision.allowed) {
        this.logError(
          "POLICY_REJECTED",
          `Tool "${call.toolName}" rejected by policy: ${decision.reason}`,
          "warning",
          { toolName: call.toolName, reason: decision.reason }
        );
      }
    }

    return decisions;
  }

  /**
   * Build final ExecutionRequest to return to CLI
   */
  private buildExecutionRequest(
    approvedCalls: ToolCall[],
    reasoning: string
  ): ExecutionRequest {
    return {
      runId: this.runId,
      agentName: "orchestrator",
      goal: this.goal,
      constraints: {
        maxSteps: 12,
        maxToolCalls: 8,
        maxRuntimeSeconds: 60,
      },
      proposedActions: approvedCalls,
    };
  }

  /**
   * Log an error from the agent
   */
  private logError(
    code: string,
    message: string,
    severity: "warning" | "error",
    context?: Record<string, unknown>
  ): void {
    const error: OrchestratorError = {
      code,
      message,
      severity,
      timestamp: Date.now(),
      context,
    };

    this.errors.push(error);
  }

  /**
   * Get all errors that occurred during execution
   */
  getErrors(): OrchestratorError[] {
    return [...this.errors];
  }

  /**
   * Get the run ID for this execution
   */
  getRunId(): string {
    return this.runId;
  }

  /**
   * Get execution duration in milliseconds
   */
  getDuration(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get number of proposed tool calls
   */
  getProposalCount(): number {
    return this.proposedCalls.length;
  }
}

/**
 * Helper function to create and execute an orchestrator agent
 *
 * Usage:
 * ```typescript
 * const request = await orchestrate("Find me restaurants near Times Square");
 * ```
 */
export async function orchestrate(
  goal: string,
  config?: OrchestratorConfig
): Promise<ExecutionRequest> {
  const agent = new OrchestratorAgent(goal, config);
  return agent.execute();
}
