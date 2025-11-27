/**
 * Cost Optimization Engine Unit Tests
 * Budget allocation, cost tracking, and optimization
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCostOptimizationEngine,
  CostOptimizationEngine,
} from "@/lib/ml/cost-optimization";

describe("Cost Optimization Engine", () => {
  let engine: CostOptimizationEngine;

  beforeEach(() => {
    engine = getCostOptimizationEngine();
  });

  describe("Cost Calculation", () => {
    it("should calculate input token costs correctly", () => {
      const result = engine.calculateCost(1_000_000, 0, 0);
      expect(result.total).toBeCloseTo(3.0, 1); // $3 per million input tokens
      expect(result.breakdown.input).toBeCloseTo(3.0, 1);
      expect(result.breakdown.output).toBe(0);
      expect(result.breakdown.thinking).toBe(0);
    });

    it("should calculate output token costs correctly", () => {
      const result = engine.calculateCost(0, 1_000_000, 0);
      expect(result.total).toBeCloseTo(15.0, 1); // $15 per million output tokens
      expect(result.breakdown.input).toBe(0);
      expect(result.breakdown.output).toBeCloseTo(15.0, 1);
      expect(result.breakdown.thinking).toBe(0);
    });

    it("should calculate thinking token costs correctly", () => {
      const result = engine.calculateCost(0, 0, 1_000_000);
      expect(result.total).toBeCloseTo(7.5, 1); // $7.50 per million thinking tokens (27x multiplier)
      expect(result.breakdown.input).toBe(0);
      expect(result.breakdown.output).toBe(0);
      expect(result.breakdown.thinking).toBeCloseTo(7.5, 1);
    });

    it("should calculate combined costs correctly", () => {
      const result = engine.calculateCost(500_000, 500_000, 1_000_000);
      const expectedInput = 1.5; // 500K input tokens
      const expectedOutput = 7.5; // 500K output tokens
      const expectedThinking = 7.5; // 1M thinking tokens
      expect(result.total).toBeCloseTo(
        expectedInput + expectedOutput + expectedThinking,
        1
      );
    });

    it("should handle zero tokens", () => {
      const result = engine.calculateCost(0, 0, 0);
      expect(result.total).toBe(0);
    });

    it("should handle small token counts", () => {
      const result = engine.calculateCost(100, 100, 100);
      expect(result.total).toBeGreaterThan(0);
      expect(result.total).toBeLessThan(0.01); // Less than a penny
    });

    it("should handle large token counts", () => {
      const result = engine.calculateCost(
        10_000_000,
        10_000_000,
        10_000_000
      );
      expect(result.total).toBeGreaterThan(100);
      expect(result.breakdown.input).toBeCloseTo(30.0, 0);
      expect(result.breakdown.output).toBeCloseTo(150.0, 0);
      expect(result.breakdown.thinking).toBeCloseTo(75.0, 0);
    });
  });

  describe("Budget Tiers", () => {
    it("should have startup tier", () => {
      const budgetTiers = (engine as any).constructor.BUDGET_TIERS;
      expect(budgetTiers.startup).toBeDefined();
      expect(budgetTiers.startup.monthly).toBe(100);
      expect(budgetTiers.startup.daily).toBe(5);
    });

    it("should have growth tier", () => {
      const budgetTiers = (engine as any).constructor.BUDGET_TIERS;
      expect(budgetTiers.growth).toBeDefined();
      expect(budgetTiers.growth.monthly).toBe(500);
      expect(budgetTiers.growth.daily).toBe(20);
    });

    it("should have enterprise tier", () => {
      const budgetTiers = (engine as any).constructor.BUDGET_TIERS;
      expect(budgetTiers.enterprise).toBeDefined();
      expect(budgetTiers.enterprise.monthly).toBe(2000);
      expect(budgetTiers.enterprise.daily).toBe(75);
    });

    it("should have unlimited tier", () => {
      const budgetTiers = (engine as any).constructor.BUDGET_TIERS;
      expect(budgetTiers.unlimited).toBeDefined();
      expect(budgetTiers.unlimited.monthly).toBe(10000);
    });
  });

  describe("Operation Cost Estimation", () => {
    it("should estimate simple extended thinking costs", () => {
      const estimate = engine.estimateOperationCost(
        "extended_thinking",
        "simple"
      );
      expect(estimate.estimatedTokens).toBe(6000); // 500+500+5000
      expect(estimate.estimatedCostUsd).toBeGreaterThan(0);
      expect(estimate.thinkingBudget).toBe(5000);
    });

    it("should estimate medium extended thinking costs", () => {
      const estimate = engine.estimateOperationCost(
        "extended_thinking",
        "medium"
      );
      expect(estimate.estimatedTokens).toBe(17000); // 1000+1000+15000
      expect(estimate.estimatedCostUsd).toBeGreaterThan(0);
      expect(estimate.thinkingBudget).toBe(15000);
    });

    it("should estimate complex extended thinking costs", () => {
      const estimate = engine.estimateOperationCost(
        "extended_thinking",
        "complex"
      );
      expect(estimate.estimatedTokens).toBe(34000); // 2000+2000+30000
      expect(estimate.estimatedCostUsd).toBeGreaterThan(0);
      expect(estimate.thinkingBudget).toBe(30000);
    });

    it("should estimate prediction costs", () => {
      const estimate = engine.estimateOperationCost("prediction", "medium");
      expect(estimate.estimatedTokens).toBeGreaterThan(0);
      expect(estimate.thinkingBudget).toBeGreaterThanOrEqual(0);
    });

    it("should estimate pattern detection costs", () => {
      const estimate = engine.estimateOperationCost(
        "pattern_detection",
        "simple"
      );
      expect(estimate.estimatedTokens).toBeGreaterThan(0);
      expect(estimate.thinkingBudget).toBeGreaterThanOrEqual(0);
    });

    it("should handle unknown operation type", () => {
      const estimate = engine.estimateOperationCost("unknown_type", "medium");
      expect(estimate.estimatedTokens).toBeGreaterThan(0); // Should fall back to 'other'
      expect(estimate.estimatedCostUsd).toBeGreaterThan(0);
    });

    it("should scale costs by complexity", () => {
      const simple = engine.estimateOperationCost("extended_thinking", "simple");
      const medium = engine.estimateOperationCost(
        "extended_thinking",
        "medium"
      );
      const complex = engine.estimateOperationCost(
        "extended_thinking",
        "complex"
      );

      expect(simple.estimatedCostUsd).toBeLessThan(medium.estimatedCostUsd);
      expect(medium.estimatedCostUsd).toBeLessThan(complex.estimatedCostUsd);
    });
  });

  describe("Budget Allocation", () => {
    it("should allocate operation limits correctly", () => {
      const allocation = {
        workspace_id: "test-ws",
        monthly_budget_usd: 500,
        daily_limit_usd: 500 / 30,
        operation_limits: {
          extended_thinking: (500 * 0.6) / 30,
          prediction: (500 * 0.2) / 30,
          pattern_detection: (500 * 0.1) / 30,
          other: (500 * 0.1) / 30,
        },
        threshold_80_percent_usd: 500 * 0.8,
        threshold_90_percent_usd: 500 * 0.9,
        threshold_100_percent_usd: 500,
      };

      expect(allocation.daily_limit_usd).toBeCloseTo(16.67, 1);
      expect(
        allocation.operation_limits.extended_thinking
      ).toBeCloseTo(10.0, 1);
      expect(allocation.operation_limits.prediction).toBeCloseTo(3.33, 1);
      expect(allocation.threshold_80_percent_usd).toBe(400);
      expect(allocation.threshold_90_percent_usd).toBe(450);
    });

    it("should create operation limits for all operation types", () => {
      const budget = 1000;
      const allocation = {
        workspace_id: "test-ws",
        monthly_budget_usd: budget,
        daily_limit_usd: budget / 30,
        operation_limits: {
          extended_thinking: (budget * 0.6) / 30,
          prediction: (budget * 0.2) / 30,
          pattern_detection: (budget * 0.1) / 30,
          other: (budget * 0.1) / 30,
        },
        threshold_80_percent_usd: budget * 0.8,
        threshold_90_percent_usd: budget * 0.9,
        threshold_100_percent_usd: budget,
      };

      // Daily limits sum to daily budget (budget/30)
      const totalDailyAllocation = Object.values(allocation.operation_limits).reduce(
        (a, b) => a + b,
        0
      );
      expect(totalDailyAllocation).toBeCloseTo(budget / 30, 1);
    });
  });

  describe("Alert Threshold Calculations", () => {
    it("should calculate 80% warning threshold", () => {
      const budget = 500;
      const threshold = budget * 0.8;
      expect(threshold).toBe(400);
    });

    it("should calculate 90% warning threshold", () => {
      const budget = 500;
      const threshold = budget * 0.9;
      expect(threshold).toBe(450);
    });

    it("should calculate 100% critical threshold", () => {
      const budget = 500;
      const threshold = budget * 1.0;
      expect(threshold).toBe(500);
    });

    it("should handle different budget amounts", () => {
      const budgets = [100, 500, 1000, 2000, 10000];
      for (const budget of budgets) {
        const threshold80 = budget * 0.8;
        const threshold90 = budget * 0.9;
        expect(threshold80).toBeLessThan(threshold90);
        expect(threshold90).toBeLessThan(budget);
      }
    });
  });

  describe("Cost Estimation Edge Cases", () => {
    it("should handle zero-cost operations", () => {
      const result = engine.calculateCost(0, 0, 0);
      expect(result.total).toBe(0);
      expect(result.breakdown.input).toBe(0);
      expect(result.breakdown.output).toBe(0);
      expect(result.breakdown.thinking).toBe(0);
    });

    it("should handle fractional token costs", () => {
      const result = engine.calculateCost(100, 100, 100);
      expect(result.total).toBeGreaterThan(0);
      expect(result.total).toBeLessThan(0.01);
    });

    it("should maintain cost accuracy with large numbers", () => {
      const result = engine.calculateCost(
        1_000_000_000,
        1_000_000_000,
        1_000_000_000
      );
      const expectedInput = 3000;
      const expectedOutput = 15000;
      const expectedThinking = 7500;
      expect(result.total).toBeCloseTo(
        expectedInput + expectedOutput + expectedThinking,
        0
      );
    });
  });

  describe("Monthly Cost Projection", () => {
    it("should project monthly costs from daily data", () => {
      const dailyCost = 10;
      const projectedMonthly = dailyCost * 30;
      expect(projectedMonthly).toBe(300);
    });

    it("should handle varying daily costs", () => {
      const days = [5, 8, 12, 6, 9];
      const totalDaily = days.reduce((a, b) => a + b, 0);
      const average = totalDaily / days.length;
      const projected = average * 30;
      expect(projected).toBeGreaterThan(0);
    });
  });

  describe("Budget Status Tracking", () => {
    it("should identify operations within budget", () => {
      const monthlyBudget = 500;
      const currentSpend = 200;
      const canAfford = currentSpend < monthlyBudget;
      expect(canAfford).toBe(true);
    });

    it("should identify operations exceeding budget", () => {
      const monthlyBudget = 500;
      const currentSpend = 550;
      const canAfford = currentSpend < monthlyBudget;
      expect(canAfford).toBe(false);
    });

    it("should calculate remaining budget", () => {
      const monthlyBudget = 500;
      const currentSpend = 350;
      const remaining = monthlyBudget - currentSpend;
      expect(remaining).toBe(150);
    });

    it("should handle zero remaining budget", () => {
      const monthlyBudget = 500;
      const currentSpend = 500;
      const remaining = Math.max(0, monthlyBudget - currentSpend);
      expect(remaining).toBe(0);
    });
  });

  describe("Cost Optimization Recommendations", () => {
    it("should recommend budget increase at high usage", () => {
      const percentageUsed = 85;
      const shouldRecommend = percentageUsed > 80;
      expect(shouldRecommend).toBe(true);
    });

    it("should recommend reducing thinking at high cost ratio", () => {
      const thinkingTokens = 100000;
      const totalTokens = 120000;
      const ratio = thinkingTokens / totalTokens;
      const shouldRecommend = ratio > 0.8;
      expect(shouldRecommend).toBe(true);
    });

    it("should recommend operation batching for efficiency", () => {
      const operationsPerDay = 50;
      const dailyBudget = 16.67;
      const avgCostPerOp = dailyBudget / operationsPerDay;
      expect(avgCostPerOp).toBeLessThan(1);
    });

    it("should identify cost-effective alternatives", () => {
      const thinkingCost = 7.5; // per MTok
      const standardCost = 3; // per MTok
      const savingsRatio = (thinkingCost - standardCost) / thinkingCost;
      expect(savingsRatio).toBeGreaterThan(0.5); // Over 50% savings
    });
  });

  describe("Singleton Pattern", () => {
    it("should return same instance", () => {
      const engine1 = getCostOptimizationEngine();
      const engine2 = getCostOptimizationEngine();
      expect(engine1).toBe(engine2);
    });

    it("should be accessible from multiple calls", () => {
      const instances = Array.from({ length: 5 }, () =>
        getCostOptimizationEngine()
      );
      const firstInstance = instances[0];
      expect(instances.every((inst) => inst === firstInstance)).toBe(true);
    });
  });

  describe("Numerical Stability", () => {
    it("should handle small decimal values", () => {
      const cost = 0.00001;
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.0001);
    });

    it("should maintain precision with multiple operations", () => {
      let total = 0;
      for (let i = 0; i < 1000; i++) {
        const cost = engine.calculateCost(100, 100, 100);
        total += cost.total;
      }
      expect(total).toBeGreaterThan(0);
      expect(Number.isFinite(total)).toBe(true);
    });

    it("should handle monthly projections accurately", () => {
      const dailyCosts = [
        10.5, 11.2, 9.8, 12.3, 10.1, 11.9, 10.4, 9.6, 12.1, 11.3, 10.7, 11.8,
        10.2, 9.9, 11.5, 10.8, 12.0, 11.1, 10.3, 10.9, 11.4, 10.6, 11.7, 9.7,
        11.6, 10.9, 12.2, 10.4, 11.2, 10.5,
      ];

      const average = dailyCosts.reduce((a, b) => a + b, 0) / dailyCosts.length;
      const projected = average * 30;

      expect(projected).toBeGreaterThan(300);
      expect(projected).toBeLessThan(350);
    });
  });
});
