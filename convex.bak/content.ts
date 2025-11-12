import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query: Get draft content
export const getDrafts = query({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    contactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, { orgId, workspaceId, contactId }) => {
    let query = ctx.db.query("generatedContent").filter((q) =>
      q.and(
        q.eq(q.field("orgId"), orgId),
        q.eq(q.field("workspaceId"), workspaceId),
        q.eq(q.field("status"), "draft")
      )
    );

    if (contactId) {
      query = query.filter((q) => q.eq(q.field("contactId"), contactId));
    }

    return query.order("desc").take(100);
  },
});

// Mutation: Store generated content
export const store = mutation({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    contactId: v.optional(v.id("contacts")),
    contentType: v.string(),
    title: v.string(),
    prompt: v.string(),
    text: v.string(),
    htmlVersion: v.optional(v.string()),
    aiModel: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generatedContent", {
      orgId: args.orgId,
      workspaceId: args.workspaceId,
      contactId: args.contactId,
      contentType: args.contentType,
      title: args.title,
      originalPrompt: args.prompt,
      generatedText: args.text,
      htmlVersion: args.htmlVersion,
      aiModel: args.aiModel,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Mutation: Approve content
export const approve = mutation({
  args: {
    orgId: v.id("organizations"),
    contentId: v.id("generatedContent"),
    userId: v.id("users"),
  },
  handler: async (ctx, { orgId, contentId, userId }) => {
    const content = await ctx.db.get(contentId);
    if (!content || content.orgId !== orgId) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(contentId, {
      status: "approved",
      approvedBy: userId,
      approvedAt: Date.now(),
    });

    return contentId;
  },
});

// Mutation: Mark as sent
export const markSent = mutation({
  args: {
    orgId: v.id("organizations"),
    contentId: v.id("generatedContent"),
  },
  handler: async (ctx, { orgId, contentId }) => {
    const content = await ctx.db.get(contentId);
    if (!content || content.orgId !== orgId) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(contentId, {
      status: "sent",
      sentAt: Date.now(),
    });

    return contentId;
  },
});
