/**
 * Cost Optimization Engine
 * Phase 6 Week 4 - Budget allocation, cost tracking, and optimization
 *
 * Manages thinking token budgets, tracks costs, enforces limits, and optimizes spending
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface CostTrackingRecord {
  id: string;
  workspace_id: string;
  operation_type: string; // 'extended_thinking', 'prediction', 'pattern_detection', etc.
  operation_id: string;
  input_tokens: number;
  output_tokens: number;
  thinking_tokens: number;
  cost_usd: number;
  cost_breakdown: {
    input_cost: number; // $3/MTok
    output_cost: number; // $15/MTok
    thinking_cost: number; // $7.50/MTok
  };
  created_at: string;
  date: string; // YYYY-MM-DD
}

export interface BudgetAllocation {
  workspace_id: string;
  monthly_budget_usd: number;
  daily_limit_usd: number;
  operation_limits: Record<string, number>; // operation_type -> budget
  threshold_80_percent_usd: number;
  threshold_90_percent_usd: number;
  threshold_100_percent_usd: number;
}

export interface CostSummary {
  workspace_id: string;
  date: string;
  total_operations: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_thinking_tokens: number;
  total_cost_usd: number;
  by_operation: Record<
    string,
    {
      count: number;
      cost_usd: number;
      tokens: number;
    }
  >;
  daily_average_cost: number;
  days_in_period: number;
  projected_monthly_cost: number;
}

export interface BudgetAlert {
  workspace_id: string;
  alert_type: "warning_80" | "warning_90" | "critical_100";
  current_spend_usd: number;
  budget_limit_usd: number;
  percentage_used: number;
  days_remaining_in_month: number;
  projected_overage_usd: number;
  timestamp: string;
}

export class CostOptimizationEngine {
  // Token cost multipliers (per million tokens)
  private static readonly INPUT_COST_PER_MTOKEN = 3.0;
  private static readonly OUTPUT_COST_PER_MTOKEN = 15.0;
  private static readonly THINKING_COST_PER_MTOKEN = 7.5;

  // Default budgets by workspace size
  private static readonly BUDGET_TIERS = {
    startup: { monthly: 100, daily: 5 },
    growth: { monthly: 500, daily: 20 },
    enterprise: { monthly: 2000, daily: 75 },
    unlimited: { monthly: 10000, daily: 500 },
  };

  /**
   * Calculate cost for tokens
   */
  calculateCost(
    inputTokens: number,
    outputTokens: number,
    thinkingTokens: number
  ): {
    total: number;
    breakdown: {
      input: number;
      output: number;
      thinking: number;
    };
  } {
    const inputCost = (inputTokens / 1_000_000) * CostOptimizationEngine.INPUT_COST_PER_MTOKEN;
    const outputCost = (outputTokens / 1_000_000) * CostOptimizationEngine.OUTPUT_COST_PER_MTOKEN;
    const thinkingCost =
      (thinkingTokens / 1_000_000) * CostOptimizationEngine.THINKING_COST_PER_MTOKEN;

    return {
      total: inputCost + outputCost + thinkingCost,
      breakdown: {
        input: inputCost,
        output: outputCost,
        thinking: thinkingCost,
      },
    };
  }

  /**
   * Track a cost operation in database
   */
  async trackCost(
    workspaceId: string,
    operationType: string,
    operationId: string,
    inputTokens: number,
    outputTokens: number,
    thinkingTokens: number
  ): Promise<CostTrackingRecord> {
    const costData = this.calculateCost(inputTokens, outputTokens, thinkingTokens);
    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD

    const { data, error } = await supabaseAdmin
      .from("ai_cost_tracking")
      .insert({
        workspace_id: workspaceId,
        operation_type: operationType,
        operation_id: operationId,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        thinking_tokens: thinkingTokens,
        cost_usd: costData.total,
        cost_breakdown: costData.breakdown,
        created_at: now.toISOString(),
        date: date,
      })
      .select()
      .single();

    if (error) {
      console.error("Cost tracking error:", error);
      throw new Error(`Failed to track cost: ${error.message}`);
    }

    return data as CostTrackingRecord;
  }

  /**
   * Get cost summary for a date range
   */
  async getCostSummary(
    workspaceId: string,
    startDate: string, // YYYY-MM-DD
    endDate: string // YYYY-MM-DD
  ): Promise<CostSummary> {
    const { data, error } = await supabaseAdmin
      .from("ai_cost_tracking")
      .select("*")
      .eq("workspace_id", workspaceId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Cost summary error:", error);
      throw new Error(`Failed to get cost summary: ${error.message}`);
    }

    const records = data as CostTrackingRecord[];

    // Aggregate by operation type
    const byOperation: Record<
      string,
      {
        count: number;
        cost_usd: number;
        tokens: number;
      }
    > = {};

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalThinkingTokens = 0;
    let totalCost = 0;

    for (const record of records) {
      totalInputTokens += record.input_tokens;
      totalOutputTokens += record.output_tokens;
      totalThinkingTokens += record.thinking_tokens;
      totalCost += record.cost_usd;

      if (!byOperation[record.operation_type]) {
        byOperation[record.operation_type] = {
          count: 0,
          cost_usd: 0,
          tokens: 0,
        };
      }

      byOperation[record.operation_type].count++;
      byOperation[record.operation_type].cost_usd += record.cost_usd;
      byOperation[record.operation_type].tokens +=
        record.input_tokens + record.output_tokens + record.thinking_tokens;
    }

    // Calculate days and projections
    const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
    const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    const daysInPeriod = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Project to full month (30 days)
    const dailyAverageCost = totalCost / Math.max(1, daysInPeriod);
    const projectedMonthlyCost = dailyAverageCost * 30;

    return {
      workspace_id: workspaceId,
      date: startDate + " to " + endDate,
      total_operations: records.length,
      total_input_tokens: totalInputTokens,
      total_output_tokens: totalOutputTokens,
      total_thinking_tokens: totalThinkingTokens,
      total_cost_usd: totalCost,
      by_operation: byOperation,
      daily_average_cost: dailyAverageCost,
      days_in_period: daysInPeriod,
      projected_monthly_cost: projectedMonthlyCost,
    };
  }

  /**
   * Get daily cost for a specific date
   */
  async getDailyCost(workspaceId: string, date: string): Promise<CostSummary> {
    return this.getCostSummary(workspaceId, date, date);
  }

  /**
   * Get monthly cost for current or specified month
   */
  async getMonthlyCost(workspaceId: string, year: number, month: number): Promise<CostSummary> {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;

    // Get last day of month
    const nextMonth = new Date(year, month, 1);
    const lastDay = new Date(nextMonth.getTime() - 1).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    return this.getCostSummary(workspaceId, startDate, endDate);
  }

  /**
   * Set budget for workspace
   */
  async setBudget(
    workspaceId: string,
    monthlyBudgetUsd: number,
    tierType: "startup" | "growth" | "enterprise" | "unlimited" = "growth"
  ): Promise<BudgetAllocation> {
    const tier = CostOptimizationEngine.BUDGET_TIERS[tierType];

    const allocation: BudgetAllocation = {
      workspace_id: workspaceId,
      monthly_budget_usd: monthlyBudgetUsd || tier.monthly,
      daily_limit_usd: monthlyBudgetUsd / 30,
      operation_limits: {
        extended_thinking: (monthlyBudgetUsd * 0.6) / 30, // 60% of budget for thinking
        prediction: (monthlyBudgetUsd * 0.2) / 30, // 20% for prediction
        pattern_detection: (monthlyBudgetUsd * 0.1) / 30, // 10% for patterns
        other: (monthlyBudgetUsd * 0.1) / 30, // 10% for other
      },
      threshold_80_percent_usd: monthlyBudgetUsd * 0.8,
      threshold_90_percent_usd: monthlyBudgetUsd * 0.9,
      threshold_100_percent_usd: monthlyBudgetUsd,
    };

    // Store in database
    const { error } = await supabaseAdmin
      .from("ai_budget_allocations")
      .upsert({
        workspace_id: workspaceId,
        monthly_budget_usd: allocation.monthly_budget_usd,
        operation_limits: allocation.operation_limits,
        tier_type: tierType,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Budget setting error:", error);
      throw new Error(`Failed to set budget: ${error.message}`);
    }

    return allocation;
  }

  /**
   * Get current budget allocation
   */
  async getBudget(workspaceId: string): Promise<BudgetAllocation | null> {
    const { data, error } = await supabaseAdmin
      .from("ai_budget_allocations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Budget retrieval error:", error);
      return null;
    }

    if (!data) {
      // Return default budget
      const tier = CostOptimizationEngine.BUDGET_TIERS.growth;
      return this.setBudget(workspaceId, tier.monthly, "growth");
    }

    return {
      workspace_id: data.workspace_id,
      monthly_budget_usd: data.monthly_budget_usd,
      daily_limit_usd: data.monthly_budget_usd / 30,
      operation_limits: data.operation_limits,
      threshold_80_percent_usd: data.monthly_budget_usd * 0.8,
      threshold_90_percent_usd: data.monthly_budget_usd * 0.9,
      threshold_100_percent_usd: data.monthly_budget_usd,
    };
  }

  /**
   * Check if operation would exceed budget
   */
  async canAffordOperation(
    workspaceId: string,
    estimatedCostUsd: number,
    operationType: string = "other"
  ): Promise<{
    canAfford: boolean;
    remainingBudget: number;
    projectedTotal: number;
    alert: BudgetAlert | null;
  }> {
    const budget = await this.getBudget(workspaceId);
    if (!budget) {
      return {
        canAfford: false,
        remainingBudget: 0,
        projectedTotal: 0,
        alert: null,
      };
    }

    // Get current month costs
    const now = new Date();
    const currentMonthlyCost = await this.getMonthlyCost(now.getFullYear(), now.getMonth() + 1);

    const projectedTotal = currentMonthlyCost.total_cost_usd + estimatedCostUsd;
    const remainingBudget = budget.monthly_budget_usd - projectedTotal;
    const canAfford = remainingBudget >= 0;

    // Check alert thresholds
    let alert = null;
    const percentageUsed = (projectedTotal / budget.monthly_budget_usd) * 100;

    if (projectedTotal >= budget.threshold_100_percent_usd) {
      const daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
      alert = {
        workspace_id: workspaceId,
        alert_type: "critical_100",
        current_spend_usd: projectedTotal,
        budget_limit_usd: budget.monthly_budget_usd,
        percentage_used: percentageUsed,
        days_remaining_in_month: daysRemaining,
        projected_overage_usd: projectedTotal - budget.monthly_budget_usd,
        timestamp: now.toISOString(),
      };
    } else if (projectedTotal >= budget.threshold_90_percent_usd) {
      const daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
      alert = {
        workspace_id: workspaceId,
        alert_type: "warning_90",
        current_spend_usd: projectedTotal,
        budget_limit_usd: budget.monthly_budget_usd,
        percentage_used: percentageUsed,
        days_remaining_in_month: daysRemaining,
        projected_overage_usd: Math.max(0, projectedTotal - budget.monthly_budget_usd),
        timestamp: now.toISOString(),
      };
    } else if (projectedTotal >= budget.threshold_80_percent_usd) {
      const daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
      alert = {
        workspace_id: workspaceId,
        alert_type: "warning_80",
        current_spend_usd: projectedTotal,
        budget_limit_usd: budget.monthly_budget_usd,
        percentage_used: percentageUsed,
        days_remaining_in_month: daysRemaining,
        projected_overage_usd: 0,
        timestamp: now.toISOString(),
      };
    }

    return {
      canAfford,
      remainingBudget: Math.max(0, remainingBudget),
      projectedTotal,
      alert,
    };
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(workspaceId: string): Promise<string[]> {
    const budget = await this.getBudget(workspaceId);
    if (!budget) return [];

    const now = new Date();
    const currentMonthlyCost = await this.getMonthlyCost(now.getFullYear(), now.getMonth() + 1);

    const recommendations: string[] = [];
    const percentageUsed = (currentMonthlyCost.total_cost_usd / budget.monthly_budget_usd) * 100;
    const dailyAverage = currentMonthlyCost.daily_average_cost;

    // Analysis-based recommendations
    if (percentageUsed > 80) {
      recommendations.push(`⚠️ Budget usage at ${percentageUsed.toFixed(1)}% - consider increasing budget or reducing thinking operations`);
    }

    if (
      currentMonthlyCost.by_operation.extended_thinking &&
      currentMonthlyCost.by_operation.extended_thinking.cost_usd >
        budget.monthly_budget_usd * 0.7
    ) {
      recommendations.push(
        "💡 Extended Thinking uses 70%+ of budget - consider using standard Claude for non-critical operations"
      );
    }

    if (currentMonthlyCost.projected_monthly_cost > budget.monthly_budget_usd * 1.2) {
      recommendations.push(
        "📈 Current spending trajectory will exceed budget by 20%+ - implement cost controls immediately"
      );
    }

    // Cost efficiency analysis
    const thinkingRatio =
      currentMonthlyCost.total_thinking_tokens /
      (currentMonthlyCost.total_input_tokens +
        currentMonthlyCost.total_output_tokens +
        currentMonthlyCost.total_thinking_tokens);

    if (thinkingRatio > 0.8) {
      recommendations.push(
        "🤔 Thinking tokens account for 80%+ of costs - use smaller budgets (5K-15K) for simpler tasks"
      );
    }

    if (dailyAverage > budget.daily_limit_usd) {
      recommendations.push(
        `⏰ Daily spending (${dailyAverage.toFixed(2)}$) exceeds daily limit (${budget.daily_limit_usd.toFixed(2)}$) - spread operations across days`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        `✅ Spending is within budget - current usage: ${percentageUsed.toFixed(1)}% of monthly budget`
      );
    }

    return recommendations;
  }

  /**
   * Estimate cost for an operation based on complexity
   */
  estimateOperationCost(
    operationType: string,
    complexity: "simple" | "medium" | "complex"
  ): {
    estimatedTokens: number;
    estimatedCostUsd: number;
    thinkingBudget: number;
  } {
    // Token estimates by operation and complexity
    const estimates: Record<
      string,
      Record<
        string,
        {
          input: number;
          output: number;
          thinking: number;
        }
      >
    > = {
      extended_thinking: {
        simple: { input: 500, output: 500, thinking: 5000 },
        medium: { input: 1000, output: 1000, thinking: 15000 },
        complex: { input: 2000, output: 2000, thinking: 30000 },
      },
      prediction: {
        simple: { input: 300, output: 200, thinking: 0 },
        medium: { input: 600, output: 400, thinking: 5000 },
        complex: { input: 1500, output: 1000, thinking: 10000 },
      },
      pattern_detection: {
        simple: { input: 200, output: 100, thinking: 0 },
        medium: { input: 500, output: 300, thinking: 3000 },
        complex: { input: 1000, output: 500, thinking: 8000 },
      },
      other: {
        simple: { input: 200, output: 150, thinking: 0 },
        medium: { input: 500, output: 300, thinking: 2000 },
        complex: { input: 1000, output: 500, thinking: 5000 },
      },
    };

    const opEstimates = estimates[operationType] || estimates.other;
    const tokens = opEstimates[complexity];

    const cost = this.calculateCost(tokens.input, tokens.output, tokens.thinking);

    return {
      estimatedTokens: tokens.input + tokens.output + tokens.thinking,
      estimatedCostUsd: cost.total,
      thinkingBudget: tokens.thinking,
    };
  }
}

// Singleton instance
let instance: CostOptimizationEngine | null = null;

export function getCostOptimizationEngine(): CostOptimizationEngine {
  if (!instance) {
    instance = new CostOptimizationEngine();
  }
  return instance;
}
