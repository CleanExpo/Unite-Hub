/**
 * Cost Calculator for Anthropic API Usage
 * Tracks prompt caching savings and calculates actual vs theoretical costs
 */

// Anthropic API pricing (as of January 2025)
export const ANTHROPIC_PRICING = {
  opus: {
    name: "Claude Opus 4",
    model: "claude-opus-4-5-20251101",
    input: 15, // $15 per MTok
    output: 75, // $75 per MTok
    thinking: 7.5, // $7.50 per MTok (for Extended Thinking)
    cache_write: 18.75, // $18.75 per MTok (25% more than input)
    cache_read: 1.5, // $1.50 per MTok (90% discount)
  },
  sonnet: {
    name: "Claude Sonnet 4.5",
    model: "claude-sonnet-4-5-20250929",
    input: 3, // $3 per MTok
    output: 15, // $15 per MTok
    cache_write: 3.75, // $3.75 per MTok (25% more than input)
    cache_read: 0.3, // $0.30 per MTok (90% discount)
  },
  haiku: {
    name: "Claude Haiku 4.5",
    model: "claude-haiku-4-5-20251001",
    input: 0.8, // $0.80 per MTok
    output: 4, // $4 per MTok
    cache_write: 1, // $1 per MTok (25% more than input)
    cache_read: 0.08, // $0.08 per MTok (90% discount)
  },
};

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  thinking_tokens?: number; // For Extended Thinking (Opus only)
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  thinkingCost: number;
  cacheWriteCost: number;
  cacheReadCost: number;
  totalCost: number;
  costWithoutCaching: number;
  savings: number;
  savingsPercentage: number;
}

/**
 * Calculate the cost of an API call with caching
 */
export function calculateCost(
  usage: TokenUsage,
  modelType: "opus" | "sonnet" | "haiku"
): CostBreakdown {
  const pricing = ANTHROPIC_PRICING[modelType];

  // Calculate actual costs with caching
  const inputCost = (usage.input_tokens / 1_000_000) * pricing.input;
  const outputCost = (usage.output_tokens / 1_000_000) * pricing.output;
  const thinkingCost = ((usage.thinking_tokens || 0) / 1_000_000) * (pricing.thinking || 0);
  const cacheWriteCost = ((usage.cache_creation_input_tokens || 0) / 1_000_000) * pricing.cache_write;
  const cacheReadCost = ((usage.cache_read_input_tokens || 0) / 1_000_000) * pricing.cache_read;

  const totalCost = inputCost + outputCost + thinkingCost + cacheWriteCost + cacheReadCost;

  // Calculate cost without caching (all cached tokens would be regular input)
  const totalInputTokensWithoutCache =
    usage.input_tokens +
    (usage.cache_creation_input_tokens || 0) +
    (usage.cache_read_input_tokens || 0);
  const costWithoutCaching =
    (totalInputTokensWithoutCache / 1_000_000) * pricing.input +
    outputCost +
    thinkingCost;

  const savings = costWithoutCaching - totalCost;
  const savingsPercentage = costWithoutCaching > 0 ? (savings / costWithoutCaching) * 100 : 0;

  return {
    inputCost,
    outputCost,
    thinkingCost,
    cacheWriteCost,
    cacheReadCost,
    totalCost,
    costWithoutCaching,
    savings,
    savingsPercentage,
  };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(2)}m`; // Show in millicents
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * Calculate aggregate costs for multiple API calls
 */
export function calculateAggregateCosts(
  usages: Array<{ usage: TokenUsage; model: "opus" | "sonnet" | "haiku" }>
): CostBreakdown {
  const aggregate = usages.reduce(
    (acc, { usage, model }) => {
      const cost = calculateCost(usage, model);
      return {
        inputCost: acc.inputCost + cost.inputCost,
        outputCost: acc.outputCost + cost.outputCost,
        thinkingCost: acc.thinkingCost + cost.thinkingCost,
        cacheWriteCost: acc.cacheWriteCost + cost.cacheWriteCost,
        cacheReadCost: acc.cacheReadCost + cost.cacheReadCost,
        totalCost: acc.totalCost + cost.totalCost,
        costWithoutCaching: acc.costWithoutCaching + cost.costWithoutCaching,
        savings: acc.savings + cost.savings,
        savingsPercentage: 0, // Will calculate below
      };
    },
    {
      inputCost: 0,
      outputCost: 0,
      thinkingCost: 0,
      cacheWriteCost: 0,
      cacheReadCost: 0,
      totalCost: 0,
      costWithoutCaching: 0,
      savings: 0,
      savingsPercentage: 0,
    }
  );

  aggregate.savingsPercentage =
    aggregate.costWithoutCaching > 0
      ? (aggregate.savings / aggregate.costWithoutCaching) * 100
      : 0;

  return aggregate;
}

/**
 * Calculate expected monthly costs based on usage patterns
 */
export function calculateMonthlyProjection(
  dailyApiCalls: {
    contactIntelligence: number;
    contentGeneration: number;
    emailProcessing: number;
  },
  cacheHitRate: number = 0.9 // 90% cache hit rate after initial calls
): {
  withCaching: CostBreakdown;
  withoutCaching: CostBreakdown;
  monthlySavings: number;
  annualSavings: number;
} {
  // Average token usage per call (based on typical use cases)
  const avgUsage = {
    contactIntelligence: {
      input: 200,
      output: 500,
      thinking: 8000,
      systemPrompt: 800,
    },
    contentGeneration: {
      input: 300,
      output: 600,
      thinking: 5000,
      systemPrompt: 1000,
    },
    emailProcessing: {
      input: 400,
      output: 200,
      thinking: 0,
      systemPrompt: 600,
    },
  };

  const monthlyUsage: Array<{ usage: TokenUsage; model: "opus" | "sonnet" | "haiku" }> = [];

  // Contact Intelligence (Opus with Extended Thinking)
  for (let i = 0; i < dailyApiCalls.contactIntelligence * 30; i++) {
    const isCacheHit = i > 0 && Math.random() < cacheHitRate;
    monthlyUsage.push({
      usage: {
        input_tokens: avgUsage.contactIntelligence.input,
        output_tokens: avgUsage.contactIntelligence.output,
        thinking_tokens: avgUsage.contactIntelligence.thinking,
        cache_creation_input_tokens: isCacheHit ? 0 : avgUsage.contactIntelligence.systemPrompt,
        cache_read_input_tokens: isCacheHit ? avgUsage.contactIntelligence.systemPrompt : 0,
      },
      model: "opus",
    });
  }

  // Content Generation (Opus with Extended Thinking)
  for (let i = 0; i < dailyApiCalls.contentGeneration * 30; i++) {
    const isCacheHit = i > 0 && Math.random() < cacheHitRate;
    monthlyUsage.push({
      usage: {
        input_tokens: avgUsage.contentGeneration.input,
        output_tokens: avgUsage.contentGeneration.output,
        thinking_tokens: avgUsage.contentGeneration.thinking,
        cache_creation_input_tokens: isCacheHit ? 0 : avgUsage.contentGeneration.systemPrompt,
        cache_read_input_tokens: isCacheHit ? avgUsage.contentGeneration.systemPrompt : 0,
      },
      model: "opus",
    });
  }

  // Email Processing (Sonnet, no Extended Thinking)
  for (let i = 0; i < dailyApiCalls.emailProcessing * 30; i++) {
    const isCacheHit = i > 0 && Math.random() < cacheHitRate;
    monthlyUsage.push({
      usage: {
        input_tokens: avgUsage.emailProcessing.input,
        output_tokens: avgUsage.emailProcessing.output,
        cache_creation_input_tokens: isCacheHit ? 0 : avgUsage.emailProcessing.systemPrompt,
        cache_read_input_tokens: isCacheHit ? avgUsage.emailProcessing.systemPrompt : 0,
      },
      model: "sonnet",
    });
  }

  const withCaching = calculateAggregateCosts(monthlyUsage);

  // Calculate without caching (all cache reads become regular input)
  const withoutCachingUsage = monthlyUsage.map(({ usage, model }) => ({
    usage: {
      input_tokens:
        usage.input_tokens +
        (usage.cache_creation_input_tokens || 0) +
        (usage.cache_read_input_tokens || 0),
      output_tokens: usage.output_tokens,
      thinking_tokens: usage.thinking_tokens,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
    model,
  }));

  const withoutCaching = calculateAggregateCosts(withoutCachingUsage);

  return {
    withCaching,
    withoutCaching,
    monthlySavings: withoutCaching.totalCost - withCaching.totalCost,
    annualSavings: (withoutCaching.totalCost - withCaching.totalCost) * 12,
  };
}

/**
 * Example usage and cost scenarios
 */
export const EXAMPLE_SCENARIOS = {
  startup: {
    name: "Startup (100 contacts/day)",
    dailyCalls: {
      contactIntelligence: 20,
      contentGeneration: 10,
      emailProcessing: 70,
    },
  },
  growing: {
    name: "Growing Business (500 contacts/day)",
    dailyCalls: {
      contactIntelligence: 100,
      contentGeneration: 50,
      emailProcessing: 350,
    },
  },
  enterprise: {
    name: "Enterprise (2000 contacts/day)",
    dailyCalls: {
      contactIntelligence: 400,
      contentGeneration: 200,
      emailProcessing: 1400,
    },
  },
};
