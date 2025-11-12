import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Increment usage counter
 */
export const increment = mutation({
  args: {
    orgId: v.id("organizations"),
    metricType: v.union(
      v.literal("emails_analyzed"),
      v.literal("personas_generated"),
      v.literal("campaigns_created"),
      v.literal("images_generated"),
      v.literal("hooks_generated"),
      v.literal("strategies_generated")
    ),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get current billing period
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!subscription) {
      throw new Error("No subscription found");
    }

    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    // Find existing usage record for this period
    const existingUsage = await ctx.db
      .query("usageTracking")
      .withIndex("by_org_and_metric", (q) =>
        q.eq("orgId", args.orgId).eq("metricType", args.metricType)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("periodStart"), periodStart),
          q.lte(q.field("periodEnd"), periodEnd)
        )
      )
      .first();

    if (existingUsage) {
      // Update existing record
      await ctx.db.patch(existingUsage._id, {
        count: existingUsage.count + args.count,
        updatedAt: now,
      });

      return existingUsage._id;
    } else {
      // Create new record
      const usageId = await ctx.db.insert("usageTracking", {
        orgId: args.orgId,
        metricType: args.metricType,
        count: args.count,
        limitAmount: getLimit(subscription.planTier, args.metricType),
        periodStart,
        periodEnd,
        resetAt: periodEnd,
        createdAt: now,
        updatedAt: now,
      });

      return usageId;
    }
  },
});

/**
 * Get usage by org and metric
 */
export const getByOrgAndMetric = query({
  args: {
    orgId: v.id("organizations"),
    metricType: v.union(
      v.literal("emails_analyzed"),
      v.literal("personas_generated"),
      v.literal("campaigns_created"),
      v.literal("images_generated"),
      v.literal("hooks_generated"),
      v.literal("strategies_generated")
    ),
  },
  handler: async (ctx, args) => {
    // Get current subscription to determine period
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!subscription) {
      return null;
    }

    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    return await ctx.db
      .query("usageTracking")
      .withIndex("by_org_and_metric", (q) =>
        q.eq("orgId", args.orgId).eq("metricType", args.metricType)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("periodStart"), periodStart),
          q.lte(q.field("periodEnd"), periodEnd)
        )
      )
      .first();
  },
});

/**
 * Get all usage for an organization
 */
export const getByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Get current subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!subscription) {
      return [];
    }

    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    return await ctx.db
      .query("usageTracking")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) =>
        q.and(
          q.gte(q.field("periodStart"), periodStart),
          q.lte(q.field("periodEnd"), periodEnd)
        )
      )
      .collect();
  },
});

/**
 * Reset usage for new billing period
 */
export const resetForPeriod = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Get all usage records for org
    const usageRecords = await ctx.db
      .query("usageTracking")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Delete old records
    for (const record of usageRecords) {
      await ctx.db.delete(record._id);
    }

    return { success: true, deleted: usageRecords.length };
  },
});

/**
 * Check if usage limit is reached
 */
export const checkLimit = query({
  args: {
    orgId: v.id("organizations"),
    metricType: v.union(
      v.literal("emails_analyzed"),
      v.literal("personas_generated"),
      v.literal("campaigns_created"),
      v.literal("images_generated"),
      v.literal("hooks_generated"),
      v.literal("strategies_generated")
    ),
    requestedCount: v.number(),
  },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("usageTracking")
      .withIndex("by_org_and_metric", (q) =>
        q.eq("orgId", args.orgId).eq("metricType", args.metricType)
      )
      .first();

    if (!usage || !usage.limitAmount) {
      // No limit or unlimited
      return { allowed: true, current: 0, limit: null };
    }

    const newTotal = (usage.count || 0) + args.requestedCount;

    return {
      allowed: newTotal <= usage.limitAmount,
      current: usage.count,
      limit: usage.limitAmount,
      remaining: Math.max(0, usage.limitAmount - usage.count),
      wouldExceed: newTotal > usage.limitAmount,
    };
  },
});

/**
 * Get usage limits based on tier and metric
 */
function getLimit(
  tier: "starter" | "professional",
  metricType: string
): number | undefined {
  const limits: Record<string, { starter: number; professional: number | undefined }> = {
    emails_analyzed: { starter: 100, professional: undefined }, // unlimited
    personas_generated: { starter: 1, professional: 3 },
    campaigns_created: { starter: 5, professional: 20 },
    images_generated: { starter: 50, professional: 200 },
    hooks_generated: { starter: 50, professional: 200 },
    strategies_generated: { starter: 5, professional: 20 },
  };

  return limits[metricType]?.[tier];
}
