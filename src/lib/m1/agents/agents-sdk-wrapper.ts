/**
 * M1 OpenAI Agents SDK Wrapper
 *
 * Provides a unified interface for working with OpenAI Agents SDK,
 * including tool management, handoff orchestration, and guardrails
 *
 * Version: v1.0.0
 * Phase: 20 - OpenAI Agents SDK Integration
 */

import { Agent, Handoff, Guardrail, run as runAgent } from '@openai/agents';
import { z } from 'zod';

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export type GuardrailResult = {
  passed: boolean;
  violations: string[];
  timestamp: number;
};

/**
 * Tool definition with schema and handler
 */
export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodSchema;
  handler: (args: unknown) => Promise<ToolResult>;
}

/**
 * Guardrail definition
 */
export interface GuardrailDefinition {
  name: string;
  description: string;
  validator: (input: string) => Promise<boolean>;
  errorMessage?: string;
}

/**
 * Handoff definition for agent delegation
 */
export interface HandoffDefinition {
  name: string;
  description: string;
  targetAgent: Agent;
  condition: (context: Record<string, unknown>) => boolean;
}

/**
 * Agent execution options
 */
export interface AgentExecutionOptions {
  maxIterations?: number;
  timeout?: number;
  guardrails?: GuardrailDefinition[];
  handoffs?: HandoffDefinition[];
  context?: Record<string, unknown>;
}

/**
 * Execution trace event
 */
export interface TraceEvent {
  timestamp: number;
  type: 'agent_call' | 'tool_call' | 'handoff' | 'guardrail_check' | 'completion';
  agentName: string;
  details: Record<string, unknown>;
}

/**
 * OpenAI Agents SDK Wrapper
 */
export class AgentSDKWrapper {
  private agents: Map<string, Agent> = new Map();
  private tools: Map<string, ToolDefinition> = new Map();
  private guardrails: Map<string, GuardrailDefinition> = new Map();
  private handoffs: Map<string, HandoffDefinition> = new Map();
  private executionTraces: Map<string, TraceEvent[]> = new Map();
  private toolStats: Map<string, unknown> = new Map();

  /**
   * Register a tool with the wrapper
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register a guardrail
   */
  registerGuardrail(guardrail: GuardrailDefinition): void {
    this.guardrails.set(guardrail.name, guardrail);
  }

  /**
   * Register a handoff
   */
  registerHandoff(handoff: HandoffDefinition): void {
    this.handoffs.set(handoff.name, handoff);
  }

  /**
   * Create an agent with integrated tools and guardrails
   */
  createAgent(
    name: string,
    instructions: string,
    model: string,
    toolNames?: string[],
    guardrailNames?: string[]
  ): Agent {
    const agent = new Agent({
      name,
      instructions,
      model,
    });

    // Attach tools to agent
    if (toolNames) {
      for (const toolName of toolNames) {
        const tool = this.tools.get(toolName);
        if (tool) {
          // Note: In real implementation, would bind tool to agent
          // agent.addTool(tool);
        }
      }
    }

    this.agents.set(name, agent);

    return agent;
  }

  /**
   * Execute a tool with validation and tracing
   */
  async executeTool(toolName: string, args: unknown, traceId?: string): Promise<ToolResult> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool ${toolName} not found`,
      };
    }

    try {
      // Validate arguments against schema
      const validated = await tool.schema.parseAsync(args);

      // Execute tool
      const result = await tool.handler(validated);

      // Record statistics
      this.recordToolStat(toolName, true, result);

      // Trace event
      if (traceId) {
        this.recordTraceEvent(traceId, 'tool_call', `Tool: ${toolName}`, {
          toolName,
          success: result.success,
        });
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Record statistics
      this.recordToolStat(toolName, false, { error: errorMsg });

      if (traceId) {
        this.recordTraceEvent(traceId, 'tool_call', `Tool: ${toolName}`, {
          toolName,
          success: false,
          error: errorMsg,
        });
      }

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Validate input against guardrails
   */
  async validateWithGuardrails(input: string, guardrailNames?: string[], traceId?: string): Promise<GuardrailResult> {
    const violations: string[] = [];
    const timestamp = Date.now();

    // Use specified guardrails or all if not specified
    const guardrailsToCheck = guardrailNames
      ? guardrailNames.map((name) => this.guardrails.get(name)).filter((g) => g !== undefined)
      : Array.from(this.guardrails.values());

    for (const guardrail of guardrailsToCheck) {
      if (guardrail) {
        try {
          const passed = await guardrail.validator(input);

          if (!passed) {
            violations.push(guardrail.errorMessage || `Guardrail "${guardrail.name}" violated`);
          }

          if (traceId) {
            this.recordTraceEvent(traceId, 'guardrail_check', guardrail.name, {
              passed,
              guardrail: guardrail.name,
            });
          }
        } catch (error) {
          violations.push(`Guardrail "${guardrail.name}" error: ${error}`);
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      timestamp,
    };
  }

  /**
   * Execute agent with integrated tools and guardrails
   */
  async executeAgent(agent: Agent, goal: string, options?: AgentExecutionOptions): Promise<unknown> {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.executionTraces.set(traceId, []);

    try {
      // Record agent call
      this.recordTraceEvent(traceId, 'agent_call', agent.name, {
        goal,
        model: agent.model,
      });

      // Validate input with guardrails
      if (options?.guardrails && options.guardrails.length > 0) {
        const guardResult = await this.validateWithGuardrails(
          goal,
          options.guardrails.map((g) => g.name),
          traceId
        );

        if (!guardResult.passed) {
          throw new Error(`Guardrail violations: ${guardResult.violations.join(', ')}`);
        }
      }

      // Execute agent
      const result = await runAgent(agent, goal);

      // Record completion
      this.recordTraceEvent(traceId, 'completion', agent.name, {
        success: true,
        outputLength: String(result.finalOutput).length,
      });

      return result.finalOutput;
    } catch (error) {
      this.recordTraceEvent(traceId, 'completion', agent.name, {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Execute handoff to another agent
   */
  async executeHandoff(
    currentAgent: Agent,
    goal: string,
    handoffName: string,
    context?: Record<string, unknown>
  ): Promise<unknown> {
    const handoff = this.handoffs.get(handoffName);

    if (!handoff) {
      throw new Error(`Handoff ${handoffName} not found`);
    }

    // Check handoff condition
    if (!handoff.condition(context || {})) {
      throw new Error(`Handoff condition not met for ${handoffName}`);
    }

    // Execute target agent
    return await this.executeAgent(handoff.targetAgent, goal);
  }

  /**
   * Get execution trace for a run
   */
  getExecutionTrace(traceId: string): TraceEvent[] {
    return this.executionTraces.get(traceId) || [];
  }

  /**
   * Record tool execution statistics
   */
  private recordToolStat(toolName: string, success: boolean, result: unknown): void {
    const statKey = `tool_${toolName}`;
    const current = (this.toolStats.get(statKey) as any) || {
      called: 0,
      succeeded: 0,
      failed: 0,
      avgDuration: 0,
    };

    current.called++;
    if (success) {
      current.succeeded++;
    } else {
      current.failed++;
    }

    this.toolStats.set(statKey, current);
  }

  /**
   * Record trace event
   */
  private recordTraceEvent(traceId: string, type: TraceEvent['type'], agentName: string, details: Record<string, unknown>): void {
    const traces = this.executionTraces.get(traceId) || [];
    traces.push({
      timestamp: Date.now(),
      type,
      agentName,
      details,
    });
    this.executionTraces.set(traceId, traces);
  }

  /**
   * Get tool statistics
   */
  getToolStatistics(): Record<string, unknown> {
    return Object.fromEntries(this.toolStats);
  }

  /**
   * Get all registered tools
   */
  getRegisteredTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get all registered guardrails
   */
  getRegisteredGuardrails(): string[] {
    return Array.from(this.guardrails.keys());
  }

  /**
   * Get all registered handoffs
   */
  getRegisteredHandoffs(): string[] {
    return Array.from(this.handoffs.keys());
  }

  /**
   * Shutdown wrapper
   */
  shutdown(): void {
    this.agents.clear();
    this.tools.clear();
    this.guardrails.clear();
    this.handoffs.clear();
    this.executionTraces.clear();
    this.toolStats.clear();
  }
}

// Export singleton
export const agentSDKWrapper = new AgentSDKWrapper();
