import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query: Get unprocessed emails
export const getUnprocessed = query({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { orgId, workspaceId, limit = 50 }) => {
    return await ctx.db
      .query("emails")
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), orgId),
          q.eq(q.field("workspaceId"), workspaceId),
          q.eq(q.field("isProcessed"), false)
        )
      )
      .order("desc")
      .take(limit);
  },
});

// Query: Get email by ID
export const getById = query({
  args: { emailId: v.id("emails") },
  handler: async (ctx, { emailId }) => {
    return await ctx.db.get(emailId);
  },
});

// Query: Get emails by contact
export const getByContact = query({
  args: {
    orgId: v.id("organizations"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, { orgId, contactId }) => {
    return await ctx.db
      .query("emails")
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), orgId),
          q.eq(q.field("contactId"), contactId)
        )
      )
      .order("desc")
      .take(100);
  },
});

// Mutation: Ingest email
export const ingest = mutation({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    messageId: v.string(),
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    htmlBody: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Check for duplicate
    const existing = await ctx.db
      .query("emails")
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), args.orgId),
          q.eq(q.field("messageId"), args.messageId)
        )
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("emails", {
      orgId: args.orgId,
      workspaceId: args.workspaceId,
      messageId: args.messageId,
      from: args.from,
      to: args.to,
      subject: args.subject,
      body: args.body,
      htmlBody: args.htmlBody,
      timestamp: args.timestamp,
      isRead: false,
      isProcessed: false,
      aiExtractedIntents: [],
      attachmentCount: 0,
      createdAt: Date.now(),
    });
  },
});

// Mutation: Mark email as processed
export const markProcessed = mutation({
  args: {
    orgId: v.id("organizations"),
    emailId: v.id("emails"),
    contactId: v.optional(v.id("contacts")),
    intents: v.array(v.string()),
    sentiment: v.optional(v.string()),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, { orgId, emailId, contactId, intents, sentiment, summary }) => {
    const email = await ctx.db.get(emailId);
    if (!email || email.orgId !== orgId) {
      throw new Error("Email not found or access denied");
    }

    await ctx.db.patch(emailId, {
      isProcessed: true,
      contactId,
      aiExtractedIntents: intents,
      aiSentiment: sentiment,
      aiSummary: summary,
    });

    return emailId;
  },
});
