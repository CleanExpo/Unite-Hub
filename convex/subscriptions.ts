import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Convex Functions for Subscription Management
 *
 * Handles database operations for subscriptions
 */

/**
 * Create or update subscription
 */
export const upsertSubscription = mutation({
  args: {
    orgId: v.id("organizations"),
    planTier: v.union(v.literal("starter"), v.literal("professional")),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if subscription already exists for this org
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    const now = Date.now();

    if (existingSubscription) {
      // Update existing subscription
      await ctx.db.patch(existingSubscription._id, {
        planTier: args.planTier,
        status: args.status,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        updatedAt: now,
      });

      return existingSubscription._id;
    } else {
      // Create new subscription
      return await ctx.db.insert("subscriptions", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Get subscription by organization ID
 */
export const getByOrganization = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();
  },
});

/**
 * Get subscription by Stripe subscription ID
 */
export const getByStripeSubscriptionId = query({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();
  },
});

/**
 * Get subscription by Stripe customer ID
 */
export const getByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();
  },
});

/**
 * Update subscription status
 */
export const updateStatus = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.cancelAtPeriodEnd !== undefined) {
      updates.cancelAtPeriodEnd = args.cancelAtPeriodEnd;
    }

    await ctx.db.patch(args.subscriptionId, updates);
  },
});

/**
 * Update subscription plan tier
 */
export const updatePlanTier = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    planTier: v.union(v.literal("starter"), v.literal("professional")),
    stripePriceId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      planTier: args.planTier,
      stripePriceId: args.stripePriceId,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update subscription period
 */
export const updatePeriod = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Cancel subscription
 */
export const cancelSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    cancelImmediately: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.cancelImmediately) {
      await ctx.db.patch(args.subscriptionId, {
        status: "canceled",
        cancelAtPeriodEnd: false,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.subscriptionId, {
        cancelAtPeriodEnd: true,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Reactivate subscription
 */
export const reactivateSubscription = mutation({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      status: "active",
      cancelAtPeriodEnd: false,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete subscription (hard delete - use with caution)
 */
export const deleteSubscription = mutation({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.subscriptionId);
  },
});

/**
 * Get all active subscriptions
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

/**
 * Get subscriptions expiring soon (within 7 days)
 */
export const listExpiringSoon = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    const subscriptions = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return subscriptions.filter(
      (sub) =>
        sub.currentPeriodEnd >= now && sub.currentPeriodEnd <= sevenDaysFromNow
    );
  },
});

/**
 * Update Stripe customer ID for organization
 */
export const updateOrganizationStripeCustomer = mutation({
  args: {
    orgId: v.id("organizations"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orgId, {
      updatedAt: Date.now(),
    });

    // Note: We store stripeCustomerId in subscriptions table
    // Update all subscriptions for this org
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    for (const subscription of subscriptions) {
      await ctx.db.patch(subscription._id, {
        stripeCustomerId: args.stripeCustomerId,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();
  },
});
