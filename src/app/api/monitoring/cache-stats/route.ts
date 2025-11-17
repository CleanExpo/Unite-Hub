import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

// Anthropic API pricing (as of 2025)
const PRICING = {
  opus: {
    input: 15, // $15 per MTok
    output: 75, // $75 per MTok
    cache_write: 18.75, // $18.75 per MTok (25% more than input)
    cache_read: 1.5, // $1.50 per MTok (90% discount)
  },
  sonnet: {
    input: 3, // $3 per MTok
    output: 15, // $15 per MTok
    cache_write: 3.75, // $3.75 per MTok (25% more than input)
    cache_read: 0.3, // $0.30 per MTok (90% discount)
  },
  haiku: {
    input: 0.8, // $0.80 per MTok
    output: 4, // $4 per MTok
    cache_write: 1, // $1 per MTok (25% more than input)
    cache_read: 0.08, // $0.08 per MTok (90% discount)
  },
};

interface CacheStats {
  input_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  output_tokens: number;
  cache_hit: boolean;
}

interface AgentStats {
  agent: string;
  totalCalls: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  tokensSaved: number;
  costSavings: number;
  totalCost: number;
  costWithoutCaching: number;
}

/**
 * Calculate cost for a set of cache stats
 */
function calculateCost(stats: CacheStats, model: "opus" | "sonnet" | "haiku"): number {
  const pricing = PRICING[model];

  const inputCost = (stats.input_tokens / 1_000_000) * pricing.input;
  const cacheWriteCost = (stats.cache_creation_tokens / 1_000_000) * pricing.cache_write;
  const cacheReadCost = (stats.cache_read_tokens / 1_000_000) * pricing.cache_read;
  const outputCost = (stats.output_tokens / 1_000_000) * pricing.output;

  return inputCost + cacheWriteCost + cacheReadCost + outputCost;
}

/**
 * Calculate cost without caching (what it would have been)
 */
function calculateCostWithoutCaching(stats: CacheStats, model: "opus" | "sonnet" | "haiku"): number {
  const pricing = PRICING[model];

  // Without caching, all tokens would be regular input tokens
  const totalInputTokens = stats.input_tokens + stats.cache_creation_tokens + stats.cache_read_tokens;
  const inputCost = (totalInputTokens / 1_000_000) * pricing.input;
  const outputCost = (stats.output_tokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Map agent action to model type
 */
function getModelForAgent(action: string): "opus" | "sonnet" | "haiku" {
  if (action === "contact_intelligence" || action === "content_personalization") {
    return "opus";
  } else if (action === "email_intent_extraction") {
    return "sonnet";
  }
  return "haiku";
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get workspaceId from query params
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Get logs with cache stats from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs, error } = await supabase
      .from("auditLogs")
      .select("action, details, created_at")
      .eq("workspace_id", workspaceId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching audit logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch cache statistics" },
        { status: 500 }
      );
    }

    // Filter logs that have cache stats
    const logsWithCache = logs.filter(
      (log) => log.details && log.details.cacheStats
    );

    // Group by agent type
    const agentStats: Record<string, AgentStats> = {};

    for (const log of logsWithCache) {
      const action = log.action;
      const cacheStats: CacheStats = log.details.cacheStats;

      if (!agentStats[action]) {
        agentStats[action] = {
          agent: action,
          totalCalls: 0,
          cacheHits: 0,
          cacheMisses: 0,
          hitRate: 0,
          tokensSaved: 0,
          costSavings: 0,
          totalCost: 0,
          costWithoutCaching: 0,
        };
      }

      const stats = agentStats[action];
      stats.totalCalls++;

      if (cacheStats.cache_hit) {
        stats.cacheHits++;
        stats.tokensSaved += cacheStats.cache_read_tokens;
      } else {
        stats.cacheMisses++;
      }

      // Calculate costs
      const model = getModelForAgent(action);
      stats.totalCost += calculateCost(cacheStats, model);
      stats.costWithoutCaching += calculateCostWithoutCaching(cacheStats, model);
    }

    // Calculate hit rates and cost savings
    for (const action in agentStats) {
      const stats = agentStats[action];
      stats.hitRate =
        stats.totalCalls > 0 ? (stats.cacheHits / stats.totalCalls) * 100 : 0;
      stats.costSavings = stats.costWithoutCaching - stats.totalCost;
    }

    // Calculate aggregate stats
    const aggregateStats = {
      totalCalls: logsWithCache.length,
      totalCacheHits: Object.values(agentStats).reduce(
        (sum, s) => sum + s.cacheHits,
        0
      ),
      totalCacheMisses: Object.values(agentStats).reduce(
        (sum, s) => sum + s.cacheMisses,
        0
      ),
      totalTokensSaved: Object.values(agentStats).reduce(
        (sum, s) => sum + s.tokensSaved,
        0
      ),
      totalCostSavings: Object.values(agentStats).reduce(
        (sum, s) => sum + s.costSavings,
        0
      ),
      totalCost: Object.values(agentStats).reduce(
        (sum, s) => sum + s.totalCost,
        0
      ),
      totalCostWithoutCaching: Object.values(agentStats).reduce(
        (sum, s) => sum + s.costWithoutCaching,
        0
      ),
      overallHitRate:
        logsWithCache.length > 0
          ? (Object.values(agentStats).reduce((sum, s) => sum + s.cacheHits, 0) /
              logsWithCache.length) *
            100
          : 0,
      savingsPercentage:
        Object.values(agentStats).reduce((sum, s) => sum + s.costWithoutCaching, 0) > 0
          ? (Object.values(agentStats).reduce((sum, s) => sum + s.costSavings, 0) /
              Object.values(agentStats).reduce(
                (sum, s) => sum + s.costWithoutCaching,
                0
              )) *
            100
          : 0,
    };

    return NextResponse.json({
      success: true,
      period: "last_30_days",
      aggregate: {
        ...aggregateStats,
        totalCost: `$${aggregateStats.totalCost.toFixed(4)}`,
        totalCostWithoutCaching: `$${aggregateStats.totalCostWithoutCaching.toFixed(4)}`,
        totalCostSavings: `$${aggregateStats.totalCostSavings.toFixed(4)}`,
        overallHitRate: `${aggregateStats.overallHitRate.toFixed(2)}%`,
        savingsPercentage: `${aggregateStats.savingsPercentage.toFixed(2)}%`,
      },
      byAgent: Object.values(agentStats).map((s) => ({
        ...s,
        hitRate: `${s.hitRate.toFixed(2)}%`,
        totalCost: `$${s.totalCost.toFixed(4)}`,
        costWithoutCaching: `$${s.costWithoutCaching.toFixed(4)}`,
        costSavings: `$${s.costSavings.toFixed(4)}`,
      })),
    });
  } catch (error) {
    console.error("Error in cache stats endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
