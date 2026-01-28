/**
 * Prompt Caching Utilities
 *
 * Centralized configuration and monitoring for Anthropic prompt caching
 * to achieve 90% cost reduction on cache hits.
 *
 * @module anthropic/features/prompt-cache
 * @see https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
 */

import Anthropic from "@anthropic-ai/sdk";

// =====================================================
// CONFIGURATION
// =====================================================

/**
 * Cache TTL Configuration
 * - Standard: 5 minutes (default) for most agents
 * - Long: 1 hour for long-running agents (Founder OS, analysis)
 * - Short: 1 minute for high-churn agents (real-time monitoring)
 */
export const CACHE_TTL = {
  STANDARD: 300, // 5 minutes (Anthropic default)
  LONG: 3600, // 1 hour (for stable, long-running contexts)
  SHORT: 60, // 1 minute (for frequently changing contexts)
} as const;

/**
 * Cache hit rate thresholds
 */
export const CACHE_THRESHOLDS = {
  EXCELLENT: 0.8, // 80%+ cache hit rate
  GOOD: 0.6, // 60-80% cache hit rate
  NEEDS_IMPROVEMENT: 0.4, // 40-60% cache hit rate
  POOR: 0.4, // <40% cache hit rate
} as const;

// =====================================================
// CACHE CONTROL HELPERS
// =====================================================

/**
 * Create cache control block for system prompts
 *
 * @example
 * system: [
 *   { type: "text", text: PROMPT, ...createCacheControl() }
 * ]
 */
export function createCacheControl(ttl: keyof typeof CACHE_TTL = "STANDARD") {
  return {
    cache_control: { type: "ephemeral" as const },
  };
}

/**
 * Create multi-block system prompt with caching on last block
 *
 * @example
 * const system = createCachedSystemPrompt(
 *   "General guidelines...",
 *   "Industry context...",
 *   "Role instructions..." // This block + all previous cached
 * );
 */
export function createCachedSystemPrompt(
  ...blocks: string[]
): Anthropic.TextBlockParam[] {
  if (blocks.length === 0) {
    throw new Error("At least one prompt block required");
  }

  const systemBlocks: Anthropic.TextBlockParam[] = blocks.map(
    (text, index) => ({
      type: "text" as const,
      text,
      ...(index === blocks.length - 1 ? createCacheControl() : {}),
    })
  );

  return systemBlocks;
}

// =====================================================
// CACHE STATISTICS
// =====================================================

export interface CacheStats {
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  cache_hit: boolean;
  cache_hit_rate?: number;
  estimated_cost: number;
  estimated_savings: number;
}

/**
 * Extract cache statistics from Anthropic message
 */
export function extractCacheStats(
  message: Anthropic.Message,
  model: string = "claude-sonnet-4-5-20250929"
): CacheStats {
  const usage = message.usage;

  const input_tokens = usage.input_tokens || 0;
  const output_tokens = usage.output_tokens || 0;
  const cache_creation_tokens = (usage as any).cache_creation_input_tokens || 0;
  const cache_read_tokens = (usage as any).cache_read_input_tokens || 0;

  const cache_hit = cache_read_tokens > 0;

  // Calculate costs (Sonnet 4.5 pricing)
  const INPUT_PRICE = 3 / 1_000_000; // $3 per MTok
  const OUTPUT_PRICE = 15 / 1_000_000; // $15 per MTok
  const CACHE_WRITE_MULTIPLIER = 1.25;
  const CACHE_READ_MULTIPLIER = 0.1; // 90% discount

  const uncached_input_cost =
    (input_tokens - cache_read_tokens - cache_creation_tokens) * INPUT_PRICE;
  const cache_creation_cost =
    cache_creation_tokens * INPUT_PRICE * CACHE_WRITE_MULTIPLIER;
  const cache_read_cost =
    cache_read_tokens * INPUT_PRICE * CACHE_READ_MULTIPLIER;
  const output_cost = output_tokens * OUTPUT_PRICE;

  const estimated_cost =
    uncached_input_cost + cache_creation_cost + cache_read_cost + output_cost;

  // Calculate savings (what it would have cost without caching)
  const cost_without_cache = input_tokens * INPUT_PRICE + output_cost;
  const estimated_savings = cost_without_cache - estimated_cost;

  return {
    input_tokens,
    output_tokens,
    cache_creation_tokens,
    cache_read_tokens,
    cache_hit,
    cache_hit_rate: cache_hit ? cache_read_tokens / input_tokens : undefined,
    estimated_cost,
    estimated_savings,
  };
}

/**
 * Log cache statistics (for development/monitoring)
 */
export function logCacheStats(agentName: string, stats: CacheStats): void {
  const hitIndicator = stats.cache_hit ? "✅ HIT" : "❌ MISS";
  const savingsIndicator =
    stats.estimated_savings > 0
      ? `💰 Saved $${stats.estimated_savings.toFixed(4)}`
      : "";

  console.log(
    `[${agentName}] Cache ${hitIndicator} | ` +
      `${stats.cache_read_tokens} cached tokens | ` +
      `${savingsIndicator}`
  );
}

// =====================================================
// CACHE PERFORMANCE MONITORING
// =====================================================

export interface CachePerformanceReport {
  total_requests: number;
  cache_hits: number;
  cache_misses: number;
  cache_hit_rate: number;
  total_tokens_saved: number;
  total_cost_savings: number;
  status: "excellent" | "good" | "needs_improvement" | "poor";
}

export class CacheMonitor {
  private stats: CacheStats[] = [];

  track(stats: CacheStats): void {
    this.stats.push(stats);
  }

  getReport(): CachePerformanceReport {
    const total_requests = this.stats.length;
    const cache_hits = this.stats.filter((s) => s.cache_hit).length;
    const cache_misses = total_requests - cache_hits;
    const cache_hit_rate = total_requests > 0 ? cache_hits / total_requests : 0;

    const total_tokens_saved = this.stats.reduce(
      (sum, s) => sum + s.cache_read_tokens,
      0
    );

    const total_cost_savings = this.stats.reduce(
      (sum, s) => sum + s.estimated_savings,
      0
    );

    let status: CachePerformanceReport["status"];
    if (cache_hit_rate >= CACHE_THRESHOLDS.EXCELLENT) {
      status = "excellent";
    } else if (cache_hit_rate >= CACHE_THRESHOLDS.GOOD) {
      status = "good";
    } else if (cache_hit_rate >= CACHE_THRESHOLDS.NEEDS_IMPROVEMENT) {
      status = "needs_improvement";
    } else {
      status = "poor";
    }

    return {
      total_requests,
      cache_hits,
      cache_misses,
      cache_hit_rate,
      total_tokens_saved,
      total_cost_savings,
      status,
    };
  }

  reset(): void {
    this.stats = [];
  }
}

// =====================================================
// AGENT-SPECIFIC CACHE CONFIGURATIONS
// =====================================================

/**
 * Recommended cache configurations per agent type
 */
export const AGENT_CACHE_CONFIG = {
  // High-frequency agents: standard TTL
  EMAIL_INTELLIGENCE: { ttl: "STANDARD" as const, priority: "high" },
  CONTENT_PERSONALIZATION: { ttl: "STANDARD" as const, priority: "high" },
  CONTACT_INTELLIGENCE: { ttl: "STANDARD" as const, priority: "high" },

  // Founder OS: long TTL for stable contexts
  COGNITIVE_TWIN: { ttl: "LONG" as const, priority: "high" },
  AI_PHILL: { ttl: "LONG" as const, priority: "high" },
  FOUNDER_RISK: { ttl: "LONG" as const, priority: "medium" },

  // Real-time agents: short TTL
  SOCIAL_INBOX: { ttl: "SHORT" as const, priority: "medium" },
  WHATSAPP: { ttl: "SHORT" as const, priority: "medium" },

  // SEO agents: standard TTL
  SEO_LEAK: { ttl: "STANDARD" as const, priority: "high" },
  SEO_AUDIT: { ttl: "STANDARD" as const, priority: "medium" },

  // Content agents: standard TTL
  CONTENT_GENERATION: { ttl: "STANDARD" as const, priority: "medium" },
  TONE_VALIDATOR: { ttl: "STANDARD" as const, priority: "low" },
} as const;

// =====================================================
// GLOBAL CACHE MONITOR INSTANCE
// =====================================================

/**
 * Global cache monitor for tracking performance across all agents
 */
export const globalCacheMonitor = new CacheMonitor();
