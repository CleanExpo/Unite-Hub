/**
 * Extended Thinking Engine for Phase 6
 * Orchestrates Claude Opus 4.5 Extended Thinking with budget management,
 * cost tracking, and intelligent fallback mechanisms.
 *
 * Cost Model:
 * - Non-thinking tokens: $3/$15 per 1M (input/output)
 * - Thinking tokens: $7.50 per 1M (27x multiplier on input)
 * - Cache tokens: 10% of input cost (with proper headers)
 */

import Anthropic from "@anthropic-ai/sdk";

export interface ThinkingBudget {
  complexity: "low" | "medium" | "high" | "very_high";
  maxTokens: number;
  estimatedCost: number;
  description: string;
}

export interface ThinkingOperation {
  id: string;
  operationType: string;
  input: string;
  thinkingTokens: number;
  outputTokens: number;
  inputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalCost: number;
  thinkingCost: number;
  thinkingContent: string;
  resultContent: string;
  duration: number;
  timestamp: number;
  workspaceId: string;
  agentName: string;
}

// Budget configurations based on task complexity
export const THINKING_BUDGETS: Record<string, ThinkingBudget> = {
  low: {
    complexity: "low",
    maxTokens: 5000,
    estimatedCost: 0.04, // $0.04 for low complexity
    description: "Simple decisions, minor analysis",
  },
  medium: {
    complexity: "medium",
    maxTokens: 15000,
    estimatedCost: 0.12, // $0.12 for medium complexity
    description: "Pattern analysis, strategic decisions",
  },
  high: {
    complexity: "high",
    maxTokens: 30000,
    estimatedCost: 0.24, // $0.24 for high complexity
    description: "Complex reasoning, multi-step analysis",
  },
  very_high: {
    complexity: "very_high",
    maxTokens: 50000,
    estimatedCost: 0.40, // $0.40 for very high complexity
    description: "Critical decisions, comprehensive analysis",
  },
};

// Cost constants (in dollars)
const THINKING_TOKEN_COST = 7.5 / 1_000_000; // $7.50 per 1M tokens
const INPUT_TOKEN_COST = 3 / 1_000_000; // $3 per 1M tokens
const OUTPUT_TOKEN_COST = 15 / 1_000_000; // $15 per 1M tokens
const CACHE_READ_COST = 0.3 / 1_000_000; // 10% of input cost
const CACHE_CREATION_COST = 3 / 1_000_000; // Same as input

export class ExtendedThinkingEngine {
  // NOTE: typed as any to support both real Anthropic client and
  // test-time mocks which may provide a simple factory function.
  private anthropic: any;
  private dailyCostLimit: number = 50; // $50/day default
  private monthlyCostLimit: number = 500; // $500/month default
  private operations: ThinkingOperation[] = [];

  constructor(apiKey: string) {
    const AnthropicImpl: any = Anthropic as any;

    // Support both class-style SDK and function-style test mocks.
    try {
      // Try class-style construction first (real SDK behaviour)
      this.anthropic = new AnthropicImpl({
        apiKey,
        defaultHeaders: {
          "anthropic-beta": "interleaved-thinking-2025-05-14",
        },
      });
    } catch (error) {
      // Fallback: treat mocked Anthropic as a factory function that
      // directly returns a client-like object with `messages.create`.
      this.anthropic = AnthropicImpl({
        apiKey,
        defaultHeaders: {
          "anthropic-beta": "interleaved-thinking-2025-05-14",
        },
      });
    }
  }

  /**
   * Execute Extended Thinking with budget management
   */
  async executeThinking(params: {
    systemPrompt: string;
    userPrompt: string;
    complexity: "low" | "medium" | "high" | "very_high";
    workspaceId: string;
    agentName: string;
    operationType: string;
  }): Promise<ThinkingOperation> {
    const startTime = Date.now();
    const budget = THINKING_BUDGETS[params.complexity];

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-opus-4-1-20250805",
        max_tokens: 4096,
        thinking: {
          type: "enabled",
          budget_tokens: budget.maxTokens,
        },
        system: [
          {
            type: "text",
            text: params.systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: params.userPrompt,
          },
        ],
      });

      // Extract thinking and result content
      let thinkingContent = "";
      let resultContent = "";

      for (const block of response.content) {
        if (block.type === "thinking") {
          thinkingContent = block.thinking;
        } else if (block.type === "text") {
          resultContent = block.text;
        }
      }

      // Calculate costs
      const thinkingTokens = response.usage.cache_read_input_tokens || 0;
      const inputTokens = (response.usage.input_tokens || 0) - thinkingTokens;
      const outputTokens = response.usage.output_tokens || 0;
      const cacheReadTokens = response.usage.cache_read_input_tokens || 0;
      const cacheCreationTokens = response.usage.cache_creation_input_tokens || 0;

      const thinkingCost =
        thinkingTokens * THINKING_TOKEN_COST +
        inputTokens * INPUT_TOKEN_COST +
        outputTokens * OUTPUT_TOKEN_COST;
      const cacheCost =
        cacheReadTokens * CACHE_READ_COST +
        cacheCreationTokens * CACHE_CREATION_COST;
      const totalCost = thinkingCost + cacheCost;

      const duration = Date.now() - startTime;

      const operation: ThinkingOperation = {
        id: `thinking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operationType: params.operationType,
        input: params.userPrompt,
        thinkingTokens,
        outputTokens,
        inputTokens,
        cacheReadTokens,
        cacheCreationTokens,
        totalCost,
        thinkingCost,
        thinkingContent,
        resultContent,
        duration,
        timestamp: Date.now(),
        workspaceId: params.workspaceId,
        agentName: params.agentName,
      };

      this.operations.push(operation);
      return operation;
    } catch (error) {
      // Fallback to non-thinking if Extended Thinking fails
      console.warn(
        `Extended Thinking failed for ${params.operationType}, falling back to standard Claude`,
        error
      );
      return this.executeStandardClaude(params);
    }
  }

  /**
   * Fallback to standard Claude without Extended Thinking
   */
  private async executeStandardClaude(params: {
    systemPrompt: string;
    userPrompt: string;
    complexity: "low" | "medium" | "high" | "very_high";
    workspaceId: string;
    agentName: string;
    operationType: string;
  }): Promise<ThinkingOperation> {
    const startTime = Date.now();

    const response = await this.anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: params.systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: params.userPrompt,
        },
      ],
    });

    const resultContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    const inputTokens = response.usage.input_tokens || 0;
    const outputTokens = response.usage.output_tokens || 0;
    const cacheReadTokens = response.usage.cache_read_input_tokens || 0;
    const cacheCreationTokens = response.usage.cache_creation_input_tokens || 0;

    const cost =
      inputTokens * INPUT_TOKEN_COST + outputTokens * OUTPUT_TOKEN_COST;
    const cacheCost =
      cacheReadTokens * CACHE_READ_COST +
      cacheCreationTokens * CACHE_CREATION_COST;
    const totalCost = cost + cacheCost;

    const duration = Date.now() - startTime;

    const operation: ThinkingOperation = {
      id: `standard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operationType: params.operationType,
      input: params.userPrompt,
      thinkingTokens: 0, // No thinking tokens in fallback
      outputTokens,
      inputTokens,
      cacheReadTokens,
      cacheCreationTokens,
      totalCost,
      thinkingCost: 0,
      thinkingContent: "[Fallback to standard Claude - no thinking]",
      resultContent,
      duration,
      timestamp: Date.now(),
      workspaceId: params.workspaceId,
      agentName: params.agentName,
    };

    this.operations.push(operation);
    return operation;
  }

  /**
   * Batch execute multiple thinking operations with cost tracking
   */
  async executeBatch(
    operations: Array<{
      systemPrompt: string;
      userPrompt: string;
      complexity: "low" | "medium" | "high" | "very_high";
      workspaceId: string;
      agentName: string;
      operationType: string;
    }>
  ): Promise<ThinkingOperation[]> {
    const results: ThinkingOperation[] = [];

    for (const op of operations) {
      const result = await this.executeThinking(op);
      results.push(result);

      // Check cost limits
      this.validateCostLimits(op.workspaceId);
    }

    return results;
  }

  /**
   * Validate cost limits and alert on overspend
   */
  private validateCostLimits(workspaceId: string): void {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Calculate daily cost
    const dailyOps = this.operations.filter(
      (op) =>
        op.workspaceId === workspaceId &&
        op.timestamp >= oneDayAgo
    );
    const dailyCost = dailyOps.reduce((sum, op) => sum + op.totalCost, 0);

    // Calculate monthly cost
    const monthlyOps = this.operations.filter(
      (op) =>
        op.workspaceId === workspaceId &&
        op.timestamp >= oneMonthAgo
    );
    const monthlyCost = monthlyOps.reduce((sum, op) => sum + op.totalCost, 0);

    // Alert at thresholds: 50%, 75%, 90%
    if (dailyCost >= this.dailyCostLimit * 0.9) {
      console.error(
        `⚠️ ALERT: Daily cost at 90% ($${dailyCost.toFixed(2)}/$${this.dailyCostLimit})`
      );
    } else if (dailyCost >= this.dailyCostLimit * 0.75) {
      console.warn(
        `⚠️ WARNING: Daily cost at 75% ($${dailyCost.toFixed(2)}/$${this.dailyCostLimit})`
      );
    } else if (dailyCost >= this.dailyCostLimit * 0.5) {
      console.log(
        `ℹ️ INFO: Daily cost at 50% ($${dailyCost.toFixed(2)}/$${this.dailyCostLimit})`
      );
    }

    if (monthlyCost >= this.monthlyCostLimit) {
      throw new Error(
        `Monthly cost limit exceeded: $${monthlyCost.toFixed(2)}/$${this.monthlyCostLimit}`
      );
    }
  }

  /**
   * Get cost statistics
   */
  getStats(workspaceId?: string): {
    totalOperations: number;
    totalCost: number;
    averageCost: number;
    thinkingTokensUsed: number;
    cacheHitRate: number;
    fallbackCount: number;
    averageLatency: number;
  } {
    const ops = workspaceId
      ? this.operations.filter((op) => op.workspaceId === workspaceId)
      : this.operations;

    if (ops.length === 0) {
      return {
        totalOperations: 0,
        totalCost: 0,
        averageCost: 0,
        thinkingTokensUsed: 0,
        cacheHitRate: 0,
        fallbackCount: 0,
        averageLatency: 0,
      };
    }

    const totalCost = ops.reduce((sum, op) => sum + op.totalCost, 0);
    const thinkingTokensUsed = ops.reduce(
      (sum, op) => sum + op.thinkingTokens,
      0
    );
    const cacheReadTokens = ops.reduce(
      (sum, op) => sum + op.cacheReadTokens,
      0
    );
    const totalInputTokens = ops.reduce((sum, op) => sum + op.inputTokens, 0);
    const fallbackCount = ops.filter(
      (op) => op.id.startsWith("standard_")
    ).length;
    const averageLatency =
      ops.reduce((sum, op) => sum + op.duration, 0) / ops.length;

    const cacheHitRate =
      totalInputTokens > 0 ? cacheReadTokens / totalInputTokens : 0;

    return {
      totalOperations: ops.length,
      totalCost,
      averageCost: totalCost / ops.length,
      thinkingTokensUsed,
      cacheHitRate,
      fallbackCount,
      averageLatency,
    };
  }

  /**
   * Clear operations (for testing or reset)
   */
  clearOperations(): void {
    this.operations = [];
  }

  /**
   * Set cost limits
   */
  setCostLimits(daily: number, monthly: number): void {
    this.dailyCostLimit = daily;
    this.monthlyCostLimit = monthly;
  }

  /**
   * Get all operations for a workspace
   */
  getOperations(workspaceId: string): ThinkingOperation[] {
    return this.operations.filter((op) => op.workspaceId === workspaceId);
  }
}

// Singleton instance
let instance: ExtendedThinkingEngine | null = null;

export function getExtendedThinkingEngine(): ExtendedThinkingEngine {
  if (!instance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable not set");
    }
    instance = new ExtendedThinkingEngine(apiKey);
  }
  return instance;
}
