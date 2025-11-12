import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getCurrentTimestamp } from "./lib/utils";
import { isValidEmail } from "./lib/validators";

/**
 * ORGANIZATIONS - CRUD operations
 * Top-level entity representing a company/business
 */

// Create a new organization
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    websiteUrl: v.optional(v.string()),
    businessDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate email
    if (!isValidEmail(args.email)) {
      throw new Error("Invalid email address");
    }

    // Check if organization with email already exists
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Organization with this email already exists");
    }

    const now = getCurrentTimestamp();

    const orgId = await ctx.db.insert("organizations", {
      name: args.name.trim(),
      email: args.email.toLowerCase().trim(),
      websiteUrl: args.websiteUrl?.trim(),
      businessDescription: args.businessDescription?.trim(),
      createdAt: now,
      updatedAt: now,
    });

    return orgId;
  },
});

// Get organization by ID
export const get = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }
    return org;
  },
});

// Get organization by email
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    return org;
  },
});

// List all organizations (admin function)
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const orgs = await ctx.db
      .query("organizations")
      .order("desc")
      .take(limit);

    return orgs;
  },
});

// Update organization
export const update = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    businessDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    // Validate email if provided
    if (args.email && !isValidEmail(args.email)) {
      throw new Error("Invalid email address");
    }

    // Check for email conflicts if email is being changed
    if (args.email && args.email !== org.email) {
      const existing = await ctx.db
        .query("organizations")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      if (existing) {
        throw new Error("Organization with this email already exists");
      }
    }

    await ctx.db.patch(args.orgId, {
      ...(args.name && { name: args.name.trim() }),
      ...(args.email && { email: args.email.toLowerCase().trim() }),
      ...(args.websiteUrl !== undefined && { websiteUrl: args.websiteUrl?.trim() }),
      ...(args.businessDescription !== undefined && {
        businessDescription: args.businessDescription?.trim(),
      }),
      updatedAt: getCurrentTimestamp(),
    });

    return args.orgId;
  },
});

// Delete organization (soft delete - should check for dependencies first)
export const remove = mutation({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    // Check for active clients
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (clients) {
      throw new Error(
        "Cannot delete organization with active clients. Remove all clients first."
      );
    }

    // Check for active subscriptions
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (subscription && subscription.status === "active") {
      throw new Error(
        "Cannot delete organization with active subscription. Cancel subscription first."
      );
    }

    await ctx.db.delete(args.orgId);
    return { success: true };
  },
});

// Get organization stats
export const getStats = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    // Get client count
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const activeClients = clients.filter((c) => c.status === "active").length;
    const totalClients = clients.length;

    // Get subscription info
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .first();

    return {
      organization: org,
      stats: {
        totalClients,
        activeClients,
        subscription: subscription
          ? {
              tier: subscription.planTier,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
            }
          : null,
      },
    };
  },
});

// Search organizations by name or email
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchQuery = args.query.toLowerCase().trim();

    if (searchQuery.length < 2) {
      return [];
    }

    // Get all organizations and filter in memory (for small datasets)
    const orgs = await ctx.db.query("organizations").collect();

    const filtered = orgs.filter(
      (org) =>
        org.name.toLowerCase().includes(searchQuery) ||
        org.email.toLowerCase().includes(searchQuery)
    );

    return filtered.slice(0, limit);
  },
});
