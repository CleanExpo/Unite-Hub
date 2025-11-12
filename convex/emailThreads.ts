import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Email Threads - Convex Functions
 * Manages email conversations
 */

// Create email thread
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    senderEmail: v.string(),
    senderName: v.optional(v.string()),
    subject: v.string(),
    messageBody: v.string(),
    messageBodyPlain: v.optional(v.string()),
    attachments: v.array(
      v.object({
        fileName: v.string(),
        fileUrl: v.string(),
        mimeType: v.string(),
        fileSize: v.number(),
      })
    ),
    receivedAt: v.number(),
    autoReplySent: v.boolean(),
    autoReplyContent: v.optional(v.string()),
    autoReplySentAt: v.optional(v.number()),
    gmailMessageId: v.optional(v.string()),
    gmailThreadId: v.optional(v.string()),
    isRead: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("emailThreads", {
      ...args,
      createdAt: now,
    });
  },
});

// Get email thread by ID
export const get = query({
  args: { id: v.id("emailThreads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get email threads by client
export const getByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailThreads")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

// Get email threads by sender email
export const getBySender = query({
  args: { senderEmail: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailThreads")
      .withIndex("by_sender", (q) => q.eq("senderEmail", args.senderEmail))
      .collect();
  },
});

// Get email thread by Gmail message ID
export const getByGmailMessageId = query({
  args: { gmailMessageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailThreads")
      .withIndex("by_gmail_message", (q) => q.eq("gmailMessageId", args.gmailMessageId))
      .first();
  },
});

// Get recent email threads
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    return await ctx.db
      .query("emailThreads")
      .withIndex("by_received_at")
      .order("desc")
      .take(limit);
  },
});

// Get unread email threads
export const getUnread = query({
  args: {
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("emailThreads");

    if (args.clientId) {
      const threads = await query
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .collect();
      return threads.filter((t) => !t.isRead);
    }

    const allThreads = await query.collect();
    return allThreads.filter((t) => !t.isRead);
  },
});

// Update email thread
export const update = mutation({
  args: {
    id: v.id("emailThreads"),
    clientId: v.optional(v.id("clients")),
    isRead: v.optional(v.boolean()),
    autoReplySent: v.optional(v.boolean()),
    autoReplyContent: v.optional(v.string()),
    autoReplySentAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Mark as read
export const markAsRead = mutation({
  args: { id: v.id("emailThreads") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: true });
    return args.id;
  },
});

// Mark as unread
export const markAsUnread = mutation({
  args: { id: v.id("emailThreads") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: false });
    return args.id;
  },
});

// Record auto-reply sent
export const recordAutoReply = mutation({
  args: {
    id: v.id("emailThreads"),
    autoReplyContent: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      autoReplySent: true,
      autoReplyContent: args.autoReplyContent,
      autoReplySentAt: Date.now(),
    });
    return args.id;
  },
});

// Delete email thread
export const remove = mutation({
  args: { id: v.id("emailThreads") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Get email threads by date range
export const getByDateRange = query({
  args: {
    clientId: v.optional(v.id("clients")),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.clientId) {
      const threads = await ctx.db
        .query("emailThreads")
        .withIndex("by_client_and_received", (q) =>
          q.eq("clientId", args.clientId).gte("receivedAt", args.startDate)
        )
        .collect();

      return threads.filter((t) => t.receivedAt <= args.endDate);
    }

    const threads = await ctx.db
      .query("emailThreads")
      .withIndex("by_received_at")
      .collect();

    return threads.filter(
      (t) => t.receivedAt >= args.startDate && t.receivedAt <= args.endDate
    );
  },
});

// Get email thread count by client
export const getCountByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const threads = await ctx.db
      .query("emailThreads")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return {
      total: threads.length,
      unread: threads.filter((t) => !t.isRead).length,
      replied: threads.filter((t) => t.autoReplySent).length,
    };
  },
});
