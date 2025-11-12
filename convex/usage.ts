import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import {
  getCurrentTimestamp,
  getCurrentBillingPeriod,
  getNextBillingPeriod,
  addMonths,
} from "./lib/utils";
import {
  getUsageLimit,
  hasReachedLimit,
  getRemainingUsage,
  TIER_LIMITS,
} from "./lib/permissions";

/**
 * USAGE TRACKING - Usage tracking for tier limits
 * Track and enforce usage limits based on subscription tier
 */

// Initialize or get usage tracking for a metric
export const getOrCreateUsageTracking = mutation({
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
    // Get organization subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    const now = getCurrentTimestamp();
    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    // Check if usage tracking exists for current period
    const existingUsage = await ctx.db
      .query("usageTracking")
      .withIndex("by_org_and_metric", (q) =>
        q.eq("orgId", args.orgId).eq("metricType", args.metricType)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("periodEnd"), now),
          q.lte(q.field("periodStart"), now)
        )
      )
      .first();

    if (existingUsage) {
      return existingUsage;
    }

    // Create new usage tracking for current period
    const limit = getUsageLimit(subscription.planTier, args.metricType);

    const usageId = await ctx.db.insert("usageTracking", {
      orgId: args.orgId,
      metricType: args.metricType,
      count: 0,
      limitAmount: limit,
      periodStart,
      periodEnd,
      resetAt: periodEnd,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(usageId);
  },
});

// Increment usage counter
export const incrementUsage = mutation({
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
    incrementBy: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const incrementBy = args.incrementBy ?? 1;

    // Get or create usage tracking
    const usage = await getOrCreateUsageTracking(ctx, {
      orgId: args.orgId,
      metricType: args.metricType,
    });

    if (!usage) {
      throw new Error("Failed to create usage tracking");
    }

    const newCount = usage.count + incrementBy;

    // Check if limit is reached (null means unlimited)
    if (usage.limitAmount !== null && newCount > usage.limitAmount) {
      throw new Error(
        `Usage limit reached for ${args.metricType}. Current: ${usage.count}, Limit: ${usage.limitAmount}`
      );
    }

    await ctx.db.patch(usage._id, {
      count: newCount,
      updatedAt: getCurrentTimestamp(),
    });

    return {
      count: newCount,
      limit: usage.limitAmount,
      remaining: usage.limitAmount !== null ? usage.limitAmount - newCount : null,
    };
  },
});

// Get usage for a specific metric
export const getUsage = query({
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
    const now = getCurrentTimestamp();

    const usage = await ctx.db
      .query("usageTracking")
      .withIndex("by_org_and_metric", (q) =>
        q.eq("orgId", args.orgId).eq("metricType", args.metricType)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("periodEnd"), now),
          q.lte(q.field("periodStart"), now)
        )
      )
      .first();

    if (!usage) {
      return {
        count: 0,
        limit: null,
        remaining: null,
        hasReachedLimit: false,
      };
    }

    return {
      count: usage.count,
      limit: usage.limitAmount,
      remaining:
        usage.limitAmount !== null ? usage.limitAmount - usage.count : null,
      hasReachedLimit:
        usage.limitAmount !== null && usage.count >= usage.limitAmount,
    };
  },
});

// Get all usage metrics for an organization
export const getAllUsage = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();

    const allUsage = await ctx.db
      .query("usageTracking")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) =>
        q.and(
          q.gte(q.field("periodEnd"), now),
          q.lte(q.field("periodStart"), now)
        )
      )
      .collect();

    const metrics = {
      emails_analyzed: null,
      personas_generated: null,
      campaigns_created: null,
      images_generated: null,
      hooks_generated: null,
      strategies_generated: null,
    };

    for (const usage of allUsage) {
      metrics[usage.metricType] = {
        count: usage.count,
        limit: usage.limitAmount,
        remaining:
          usage.limitAmount !== null ? usage.limitAmount - usage.count : null,
        hasReachedLimit:
          usage.limitAmount !== null && usage.count >= usage.limitAmount,
        periodEnd: usage.periodEnd,
      };
    }

    return metrics;
  },
});

// Check if usage limit is reached
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
  },
  handler: async (ctx, args) => {
    const usage = await getUsage(ctx, args);
    return usage.hasReachedLimit;
  },
});

// Reset usage for new billing period
export const resetUsage = mutation({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();

    // Get all usage records for this org
    const allUsage = await ctx.db
      .query("usageTracking")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Get subscription to determine new period
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!subscription) {
      throw new Error("No subscription found");
    }

    const newPeriod = getNextBillingPeriod(subscription.currentPeriodEnd);

    // Archive old usage and create new records
    for (const usage of allUsage) {
      if (usage.periodEnd < now) {
        // Old period - create new record for new period
        const limit = getUsageLimit(subscription.planTier, usage.metricType);

        await ctx.db.insert("usageTracking", {
          orgId: args.orgId,
          metricType: usage.metricType,
          count: 0,
          limitAmount: limit,
          periodStart: newPeriod.start,
          periodEnd: newPeriod.end,
          resetAt: newPeriod.end,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { success: true, newPeriod };
  },
});

// Get usage history
export const getUsageHistory = query({
  args: {
    orgId: v.id("organizations"),
    metricType: v.optional(
      v.union(
        v.literal("emails_analyzed"),
        v.literal("personas_generated"),
        v.literal("campaigns_created"),
        v.literal("images_generated"),
        v.literal("hooks_generated"),
        v.literal("strategies_generated")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 12; // Last 12 periods by default

    let query = ctx.db
      .query("usageTracking")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId));

    let history = await query.collect();

    if (args.metricType) {
      history = history.filter((h) => h.metricType === args.metricType);
    }

    return history
      .sort((a, b) => b.periodEnd - a.periodEnd)
      .slice(0, limit);
  },
});

// Get usage summary
export const getUsageSummary = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!subscription) {
      throw new Error("No subscription found");
    }

    const allUsage = await getAllUsage(ctx, { orgId: args.orgId });

    const tierLimits = TIER_LIMITS[subscription.planTier];

    return {
      planTier: subscription.planTier,
      periodEnd: subscription.currentPeriodEnd,
      usage: allUsage,
      limits: tierLimits,
    };
  },
});

// Clean up old usage records (admin function)
export const cleanupOldRecords = mutation({
  args: {
    olderThanMonths: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const months = args.olderThanMonths ?? 12;
    const cutoffDate = addMonths(getCurrentTimestamp(), -months);

    const oldRecords = await ctx.db
      .query("usageTracking")
      .filter((q) => q.lt(q.field("periodEnd"), cutoffDate))
      .collect();

    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }

    return { success: true, deletedCount: oldRecords.length };
  },
});
