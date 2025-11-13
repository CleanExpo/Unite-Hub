import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Auto Replies - Convex Functions
 * Manages automated email replies
 */

// Create auto reply
export const create = mutation({
  args: {
    emailThreadId: v.id("emailThreads"),
    clientId: v.id("clients"),
    questionsGenerated: v.array(v.string()),
    autoReplyContent: v.string(),
    sentAt: v.number(),
    responseReceived: v.boolean(),
    responseEmailId: v.optional(v.id("emailThreads")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("autoReplies", {
      ...args,
      createdAt: now,
    });
  },
});

// Get auto reply by ID
export const get = query({
  args: { id: v.id("autoReplies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get auto reply by email thread
export const getByEmailThread = query({
  args: { emailThreadId: v.id("emailThreads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("autoReplies")
      .withIndex("by_email_thread", (q) => q.eq("emailThreadId", args.emailThreadId))
      .first();
  },
});

// Get auto replies by client
export const getByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("autoReplies")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

// Get recent auto replies
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    return await ctx.db
      .query("autoReplies")
      .withIndex("by_sent_at")
      .order("desc")
      .take(limit);
  },
});

// Update auto reply
export const update = mutation({
  args: {
    id: v.id("autoReplies"),
    responseReceived: v.optional(v.boolean()),
    responseEmailId: v.optional(v.id("emailThreads")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Mark response received
export const markResponseReceived = mutation({
  args: {
    id: v.id("autoReplies"),
    responseEmailId: v.id("emailThreads"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      responseReceived: true,
      responseEmailId: args.responseEmailId,
    });
    return args.id;
  },
});

// Get auto reply statistics
export const getStats = query({
  args: { clientId: v.optional(v.id("clients")) },
  handler: async (ctx, args) => {
    let autoReplies;

    if (args.clientId) {
      autoReplies = await ctx.db
        .query("autoReplies")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .collect();
    } else {
      autoReplies = await ctx.db.query("autoReplies").collect();
    }

    const total = autoReplies.length;
    const responded = autoReplies.filter((ar) => ar.responseReceived).length;
    const responseRate = total > 0 ? (responded / total) * 100 : 0;

    return {
      total,
      responded,
      pending: total - responded,
      responseRate: Math.round(responseRate * 100) / 100,
    };
  },
});
