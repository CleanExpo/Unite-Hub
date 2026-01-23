/**
 * M1 Cost Tracking
 *
 * Tracks API call costs for Claude models.
 * Provides cost breakdown by model and time period.
 */

/**
 * Supported Claude models and their pricing (January 2026)
 * @see https://docs.anthropic.com/en/docs/models-overview
 */
const MODEL_PRICING = {
  // Claude 4.5 family (latest)
  "claude-opus-4-5-20251101": {
    inputTokens: 15.0 / 1_000_000, // $15.00 per 1M input tokens
    outputTokens: 75.0 / 1_000_000, // $75.00 per 1M output tokens
  },
  "claude-sonnet-4-5-20250929": {
    inputTokens: 3.0 / 1_000_000, // $3.00 per 1M input tokens
    outputTokens: 15.0 / 1_000_000, // $15.00 per 1M output tokens
  },
  "claude-haiku-4-5-20251001": {
    inputTokens: 1.0 / 1_000_000, // $1.00 per 1M input tokens
    outputTokens: 5.0 / 1_000_000, // $5.00 per 1M output tokens
  },
  // Legacy models (for backward compatibility)
  "claude-3-5-sonnet-20241022": {
    inputTokens: 3.0 / 1_000_000,
    outputTokens: 15.0 / 1_000_000,
  },
  "claude-3-5-haiku-20241022": {
    inputTokens: 0.8 / 1_000_000,
    outputTokens: 4.0 / 1_000_000,
  },
} as const;

/**
 * API call cost record
 */
export interface CostRecord {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: number;
}

/**
 * Cost tracker for Claude API calls
 */
export class CostTracker {
  private costs: CostRecord[] = [];

  /**
   * Track an API call cost
   */
  trackAPICall(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
    if (!pricing) {
      console.warn(`Unknown model: ${model}, cost tracking skipped`);
      return 0;
    }

    const cost =
      inputTokens * pricing.inputTokens +
      outputTokens * pricing.outputTokens;

    this.costs.push({
      model,
      inputTokens,
      outputTokens,
      cost,
      timestamp: Date.now(),
    });

    return cost;
  }

  /**
   * Get total cost across all calls
   */
  getTotalCost(): number {
    return this.costs.reduce((sum, record) => sum + record.cost, 0);
  }

  /**
   * Get total cost by model
   */
  getCostByModel(): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const record of this.costs) {
      if (!breakdown[record.model]) {
        breakdown[record.model] = 0;
      }
      breakdown[record.model] += record.cost;
    }

    return breakdown;
  }

  /**
   * Get cost breakdown
   */
  getCostBreakdown(): {
    totalCost: number;
    byModel: Record<string, number>;
    totalTokens: { input: number; output: number };
    callCount: number;
    avgCostPerCall: number;
  } {
    const totalCost = this.getTotalCost();
    const byModel = this.getCostByModel();
    const totalInputTokens = this.costs.reduce((sum, r) => sum + r.inputTokens, 0);
    const totalOutputTokens = this.costs.reduce((sum, r) => sum + r.outputTokens, 0);
    const callCount = this.costs.length;
    const avgCostPerCall = callCount > 0 ? totalCost / callCount : 0;

    return {
      totalCost,
      byModel,
      totalTokens: { input: totalInputTokens, output: totalOutputTokens },
      callCount,
      avgCostPerCall,
    };
  }

  /**
   * Get cost by time period
   */
  getCostByTimeRange(startTime: number, endTime: number): {
    cost: number;
    callCount: number;
    records: CostRecord[];
  } {
    const records = this.costs.filter(
      (r) => r.timestamp >= startTime && r.timestamp <= endTime
    );

    const cost = records.reduce((sum, r) => sum + r.cost, 0);

    return {
      cost,
      callCount: records.length,
      records,
    };
  }

  /**
   * Get cost over last N hours
   */
  getCostLastNHours(hours: number): {
    cost: number;
    callCount: number;
  } {
    const now = Date.now();
    const startTime = now - hours * 60 * 60 * 1000;
    const result = this.getCostByTimeRange(startTime, now);

    return {
      cost: result.cost,
      callCount: result.callCount,
    };
  }

  /**
   * Get all cost records
   */
  getAllRecords(): CostRecord[] {
    return [...this.costs];
  }

  /**
   * Reset tracking (for testing)
   */
  reset(): void {
    this.costs = [];
  }
}

/**
 * Global cost tracker instance
 */
export const costTracker = new CostTracker();

/**
 * Track Claude API call (convenience function)
 */
export function trackClaudeCall(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  return costTracker.trackAPICall(model, inputTokens, outputTokens);
}

/**
 * Get total cost (convenience function)
 */
export function getTotalCost(): number {
  return costTracker.getTotalCost();
}

/**
 * Get cost breakdown (convenience function)
 */
export function getCostBreakdown(): {
  totalCost: number;
  byModel: Record<string, number>;
  totalTokens: { input: number; output: number };
  callCount: number;
  avgCostPerCall: number;
} {
  return costTracker.getCostBreakdown();
}

/**
 * Format cost as USD string
 */
export function formatCostAsUSD(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Get estimated monthly cost based on current run rate
 */
export function getEstimatedMonthlyCost(): number {
  const breakdown = costTracker.getCostBreakdown();
  if (breakdown.callCount === 0) {
return 0;
}

  // Rough estimate: assume same rate continues for 30 days
  // This is highly approximate and for estimation only
  const msPerCall = Date.now() / breakdown.callCount / 1000; // assume first call at startup
  const callsPerDay = (24 * 60 * 60 * 1000) / Math.max(msPerCall, 1000);
  const callsPerMonth = callsPerDay * 30;

  return (breakdown.totalCost / breakdown.callCount) * callsPerMonth;
}
