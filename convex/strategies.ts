import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentTimestamp } from "./lib/utils";
import { canAccessCompetitorAnalysis } from "./lib/permissions";

/**
 * MARKETING STRATEGIES - AI-generated marketing strategies
 * CRUD, platform-specific strategies, versioning
 */

const platformStrategyValidator = v.object({
  platform: v.union(
    v.literal("facebook"),
    v.literal("instagram"),
    v.literal("tiktok"),
    v.literal("linkedin")
  ),
  strategy: v.string(),
  tactics: v.array(v.string()),
});

const successMetricValidator = v.object({
  metric: v.string(),
  target: v.string(),
  timeframe: v.string(),
});

const marketingChannelValidator = v.object({
  channel: v.string(),
  description: v.string(),
  priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
});

// Create marketing strategy
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    strategyTitle: v.string(),
    executiveSummary: v.string(),
    marketAnalysis: v.string(),
    targetAudience: v.string(),
    uniqueSellingProposition: v.string(),
    competitorAnalysis: v.optional(v.string()),
    marketingChannels: v.array(marketingChannelValidator),
    contentStrategy: v.string(),
    contentPillars: v.array(v.string()),
    campaignCalendar: v.optional(v.any()),
    successMetrics: v.array(successMetricValidator),
    budgetGuidance: v.optional(v.string()),
    platformStrategies: v.array(platformStrategyValidator),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    // Check if competitor analysis is allowed
    if (
      args.competitorAnalysis &&
      !canAccessCompetitorAnalysis(client.packageTier)
    ) {
      throw new Error(
        "Competitor analysis requires Professional plan. Upgrade to access."
      );
    }

    // Get latest version
    const existingStrategies = await ctx.db
      .query("marketingStrategies")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const maxVersion = existingStrategies.reduce(
      (max, s) => Math.max(max, s.version),
      0
    );
    const newVersion = maxVersion + 1;

    const now = getCurrentTimestamp();

    const strategyId = await ctx.db.insert("marketingStrategies", {
      clientId: args.clientId,
      strategyTitle: args.strategyTitle.trim(),
      executiveSummary: args.executiveSummary.trim(),
      marketAnalysis: args.marketAnalysis.trim(),
      targetAudience: args.targetAudience.trim(),
      uniqueSellingProposition: args.uniqueSellingProposition.trim(),
      competitorAnalysis: args.competitorAnalysis?.trim(),
      marketingChannels: args.marketingChannels,
      contentStrategy: args.contentStrategy.trim(),
      contentPillars: args.contentPillars,
      campaignCalendar: args.campaignCalendar,
      successMetrics: args.successMetrics,
      budgetGuidance: args.budgetGuidance?.trim(),
      platformStrategies: args.platformStrategies,
      version: newVersion,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Deactivate previous strategies
    for (const strategy of existingStrategies) {
      if (strategy.isActive) {
        await ctx.db.patch(strategy._id, { isActive: false });
      }
    }

    return strategyId;
  },
});

// Get strategy by ID
export const get = query({
  args: { strategyId: v.id("marketingStrategies") },
  handler: async (ctx, args) => {
    const strategy = await ctx.db.get(args.strategyId);
    if (!strategy) throw new Error("Strategy not found");
    return strategy;
  },
});

// Get active strategy for client
export const getActive = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketingStrategies")
      .withIndex("by_client_and_active", (q) =>
        q.eq("clientId", args.clientId).eq("isActive", true)
      )
      .first();
  },
});

// List strategies for client
export const listByClient = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const strategies = await ctx.db
      .query("marketingStrategies")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return strategies.sort((a, b) => b.version - a.version).slice(0, limit);
  },
});

// Update strategy
export const update = mutation({
  args: {
    strategyId: v.id("marketingStrategies"),
    strategyTitle: v.optional(v.string()),
    executiveSummary: v.optional(v.string()),
    marketAnalysis: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    uniqueSellingProposition: v.optional(v.string()),
    competitorAnalysis: v.optional(v.string()),
    marketingChannels: v.optional(v.array(marketingChannelValidator)),
    contentStrategy: v.optional(v.string()),
    contentPillars: v.optional(v.array(v.string())),
    campaignCalendar: v.optional(v.any()),
    successMetrics: v.optional(v.array(successMetricValidator)),
    budgetGuidance: v.optional(v.string()),
    platformStrategies: v.optional(v.array(platformStrategyValidator)),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const strategy = await ctx.db.get(args.strategyId);
    if (!strategy) throw new Error("Strategy not found");

    const client = await ctx.db.get(strategy.clientId);
    if (!client) throw new Error("Client not found");

    // Check competitor analysis permission
    if (
      args.competitorAnalysis &&
      !canAccessCompetitorAnalysis(client.packageTier)
    ) {
      throw new Error("Competitor analysis requires Professional plan");
    }

    const updates: Partial<Doc<"marketingStrategies">> = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.strategyTitle) updates.strategyTitle = args.strategyTitle.trim();
    if (args.executiveSummary)
      updates.executiveSummary = args.executiveSummary.trim();
    if (args.marketAnalysis) updates.marketAnalysis = args.marketAnalysis.trim();
    if (args.targetAudience) updates.targetAudience = args.targetAudience.trim();
    if (args.uniqueSellingProposition)
      updates.uniqueSellingProposition = args.uniqueSellingProposition.trim();
    if (args.competitorAnalysis !== undefined)
      updates.competitorAnalysis = args.competitorAnalysis?.trim();
    if (args.marketingChannels) updates.marketingChannels = args.marketingChannels;
    if (args.contentStrategy) updates.contentStrategy = args.contentStrategy.trim();
    if (args.contentPillars) updates.contentPillars = args.contentPillars;
    if (args.campaignCalendar !== undefined)
      updates.campaignCalendar = args.campaignCalendar;
    if (args.successMetrics) updates.successMetrics = args.successMetrics;
    if (args.budgetGuidance !== undefined)
      updates.budgetGuidance = args.budgetGuidance?.trim();
    if (args.platformStrategies)
      updates.platformStrategies = args.platformStrategies;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.strategyId, updates);
    return args.strategyId;
  },
});

// Set strategy as active
export const setActive = mutation({
  args: { strategyId: v.id("marketingStrategies") },
  handler: async (ctx, args) => {
    const strategy = await ctx.db.get(args.strategyId);
    if (!strategy) throw new Error("Strategy not found");

    // Deactivate all other strategies for this client
    const allStrategies = await ctx.db
      .query("marketingStrategies")
      .withIndex("by_client", (q) => q.eq("clientId", strategy.clientId))
      .collect();

    for (const s of allStrategies) {
      if (s._id !== args.strategyId && s.isActive) {
        await ctx.db.patch(s._id, { isActive: false });
      }
    }

    // Activate this strategy
    await ctx.db.patch(args.strategyId, { isActive: true });
    return args.strategyId;
  },
});

// Get platform-specific strategy
export const getPlatformStrategy = query({
  args: {
    strategyId: v.id("marketingStrategies"),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
  },
  handler: async (ctx, args) => {
    const strategy = await ctx.db.get(args.strategyId);
    if (!strategy) throw new Error("Strategy not found");

    return strategy.platformStrategies.find((ps) => ps.platform === args.platform);
  },
});

// Delete strategy
export const remove = mutation({
  args: { strategyId: v.id("marketingStrategies") },
  handler: async (ctx, args) => {
    const strategy = await ctx.db.get(args.strategyId);
    if (!strategy) throw new Error("Strategy not found");

    await ctx.db.delete(args.strategyId);
    return { success: true };
  },
});

// Get strategy stats
export const getStats = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const strategies = await ctx.db
      .query("marketingStrategies")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const active = strategies.find((s) => s.isActive);

    return {
      total: strategies.length,
      activeVersion: active?.version,
      latestVersion: Math.max(...strategies.map((s) => s.version), 0),
      platforms: active?.platformStrategies.map((ps) => ps.platform) || [],
      hasCompetitorAnalysis: !!active?.competitorAnalysis,
    };
  },
});
