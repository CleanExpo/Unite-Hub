import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentTimestamp, extractPlainText, sortByDate } from "./lib/utils";
import { isValidEmail } from "./lib/validators";

/**
 * EMAIL THREADS - Email storage, retrieval, threading, search
 * All emails sent to contact@unite-group.in
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
    attachments: v.optional(v.array(v.object({
      fileName: v.string(),
      fileUrl: v.string(),
      mimeType: v.string(),
      fileSize: v.number(),
    }))),
    gmailMessageId: v.optional(v.string()),
    gmailThreadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isValidEmail(args.senderEmail)) {
      throw new Error("Invalid sender email address");
    }

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    const now = getCurrentTimestamp();
    const plainText = args.messageBodyPlain || extractPlainText(args.messageBody);

    const emailId = await ctx.db.insert("emailThreads", {
      clientId: args.clientId,
      senderEmail: args.senderEmail.toLowerCase().trim(),
      senderName: args.senderName?.trim(),
      subject: args.subject.trim(),
      messageBody: args.messageBody,
      messageBodyPlain: plainText,
      attachments: args.attachments || [],
      receivedAt: now,
      autoReplySent: false,
      gmailMessageId: args.gmailMessageId,
      gmailThreadId: args.gmailThreadId,
      isRead: false,
      createdAt: now,
    });

    return emailId;
  },
});

// Get email by ID
export const get = query({
  args: { emailId: v.id("emailThreads") },
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (!email) throw new Error("Email not found");
    return email;
  },
});

// Get email by Gmail message ID
export const getByGmailId = query({
  args: { gmailMessageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailThreads")
      .withIndex("by_gmail_message", (q) => q.eq("gmailMessageId", args.gmailMessageId))
      .first();
  },
});

// List emails for a client
export const listByClient = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const emails = await ctx.db
      .query("emailThreads")
      .withIndex("by_client_and_received", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(limit);

    if (args.unreadOnly) {
      return emails.filter((e) => !e.isRead);
    }

    return emails;
  },
});

// List emails by sender
export const listBySender = query({
  args: {
    senderEmail: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const email = args.senderEmail.toLowerCase().trim();

    return await ctx.db
      .query("emailThreads")
      .withIndex("by_sender", (q) => q.eq("senderEmail", email))
      .order("desc")
      .take(limit);
  },
});

// List recent emails
export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    if (args.clientId) {
      return await ctx.db
        .query("emailThreads")
        .withIndex("by_client_and_received", (q) => q.eq("clientId", args.clientId))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("emailThreads")
      .withIndex("by_received_at")
      .order("desc")
      .take(limit);
  },
});

// Mark email as read
export const markAsRead = mutation({
  args: {
    emailId: v.id("emailThreads"),
    isRead: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (!email) throw new Error("Email not found");

    await ctx.db.patch(args.emailId, {
      isRead: args.isRead ?? true,
    });

    return args.emailId;
  },
});

// Mark multiple emails as read
export const markMultipleAsRead = mutation({
  args: {
    emailIds: v.array(v.id("emailThreads")),
    isRead: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const isRead = args.isRead ?? true;

    for (const emailId of args.emailIds) {
      await ctx.db.patch(emailId, { isRead });
    }

    return { success: true, count: args.emailIds.length };
  },
});

// Update auto-reply status
export const updateAutoReply = mutation({
  args: {
    emailId: v.id("emailThreads"),
    autoReplySent: v.boolean(),
    autoReplyContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (!email) throw new Error("Email not found");

    await ctx.db.patch(args.emailId, {
      autoReplySent: args.autoReplySent,
      autoReplyContent: args.autoReplyContent,
      autoReplySentAt: args.autoReplySent ? getCurrentTimestamp() : undefined,
    });

    return args.emailId;
  },
});

// Search emails
export const search = query({
  args: {
    clientId: v.optional(v.id("clients")),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchQuery = args.query.toLowerCase().trim();

    if (searchQuery.length < 2) return [];

    let emails;
    if (args.clientId) {
      emails = await ctx.db
        .query("emailThreads")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .collect();
    } else {
      emails = await ctx.db.query("emailThreads").collect();
    }

    const filtered = emails.filter(
      (email) =>
        email.subject.toLowerCase().includes(searchQuery) ||
        email.messageBodyPlain?.toLowerCase().includes(searchQuery) ||
        email.senderEmail.toLowerCase().includes(searchQuery) ||
        email.senderName?.toLowerCase().includes(searchQuery)
    );

    return filtered.slice(0, limit);
  },
});

// Get email thread (grouped by Gmail thread ID)
export const getThread = query({
  args: {
    gmailThreadId: v.string(),
  },
  handler: async (ctx, args) => {
    const emails = await ctx.db.query("emailThreads").collect();

    const threadEmails = emails
      .filter((e) => e.gmailThreadId === args.gmailThreadId)
      .sort((a, b) => a.receivedAt - b.receivedAt);

    return threadEmails;
  },
});

// Get email statistics
export const getStats = query({
  args: {
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    let emails;

    if (args.clientId) {
      emails = await ctx.db
        .query("emailThreads")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .collect();
    } else {
      emails = await ctx.db.query("emailThreads").collect();
    }

    const now = getCurrentTimestamp();
    const last24h = now - 24 * 60 * 60 * 1000;
    const last7d = now - 7 * 24 * 60 * 60 * 1000;

    return {
      total: emails.length,
      unread: emails.filter((e) => !e.isRead).length,
      withAutoReply: emails.filter((e) => e.autoReplySent).length,
      withAttachments: emails.filter((e) => e.attachments.length > 0).length,
      last24h: emails.filter((e) => e.receivedAt > last24h).length,
      last7d: emails.filter((e) => e.receivedAt > last7d).length,
    };
  },
});

// Delete email
export const remove = mutation({
  args: {
    emailId: v.id("emailThreads"),
  },
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (!email) throw new Error("Email not found");

    // Delete associated auto-replies
    const autoReplies = await ctx.db
      .query("autoReplies")
      .withIndex("by_email_thread", (q) => q.eq("emailThreadId", args.emailId))
      .collect();

    for (const reply of autoReplies) {
      await ctx.db.delete(reply._id);
    }

    await ctx.db.delete(args.emailId);
    return { success: true };
  },
});

// Get emails with attachments
export const getWithAttachments = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const emails = await ctx.db
      .query("emailThreads")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return emails
      .filter((e) => e.attachments.length > 0)
      .sort((a, b) => b.receivedAt - a.receivedAt)
      .slice(0, limit);
  },
});

// Get unread count
export const getUnreadCount = query({
  args: {
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    let emails;

    if (args.clientId) {
      emails = await ctx.db
        .query("emailThreads")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .collect();
    } else {
      emails = await ctx.db.query("emailThreads").collect();
    }

    return emails.filter((e) => !e.isRead).length;
  },
});
