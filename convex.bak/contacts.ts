import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query: Get contact by ID
export const get = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, { contactId }) => {
    return await ctx.db.get(contactId);
  },
});

// Query: Get contact by email
export const getByEmail = query({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    email: v.string(),
  },
  handler: async (ctx, { orgId, workspaceId, email }) => {
    return await ctx.db
      .query("contacts")
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), orgId),
          q.eq(q.field("workspaceId"), workspaceId),
          q.eq(q.field("email"), email)
        )
      )
      .first();
  },
});

// Query: List contacts by status
export const listByStatus = query({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    status: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { orgId, workspaceId, status, limit = 50 }) => {
    return await ctx.db
      .query("contacts")
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), orgId),
          q.eq(q.field("workspaceId"), workspaceId),
          q.eq(q.field("status"), status)
        )
      )
      .order("desc")
      .take(limit);
  },
});

// Query: List high-value contacts (AI score)
export const listByAiScore = query({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    minScore: v.optional(v.number()),
  },
  handler: async (ctx, { orgId, workspaceId, minScore = 70 }) => {
    return await ctx.db
      .query("contacts")
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), orgId),
          q.eq(q.field("workspaceId"), workspaceId),
          q.gte(q.field("aiScore"), minScore)
        )
      )
      .order("desc")
      .take(100);
  },
});

// Mutation: Create or update contact
export const upsert = mutation({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    source: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("contacts")
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), args.orgId),
          q.eq(q.field("workspaceId"), args.workspaceId),
          q.eq(q.field("email"), args.email)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        phone: args.phone,
        company: args.company,
        jobTitle: args.jobTitle,
        tags: args.tags,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("contacts", {
      orgId: args.orgId,
      workspaceId: args.workspaceId,
      email: args.email,
      name: args.name,
      phone: args.phone,
      company: args.company,
      jobTitle: args.jobTitle,
      status: "lead",
      source: args.source,
      tags: args.tags,
      customFields: {},
      notes: "",
      lastInteraction: Date.now(),
      aiScore: 50,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Mutation: Update contact status
export const updateStatus = mutation({
  args: {
    orgId: v.id("organizations"),
    contactId: v.id("contacts"),
    status: v.string(),
  },
  handler: async (ctx, { orgId, contactId, status }) => {
    const contact = await ctx.db.get(contactId);
    if (!contact || contact.orgId !== orgId) {
      throw new Error("Contact not found or access denied");
    }

    await ctx.db.patch(contactId, { status, updatedAt: Date.now() });
    return contactId;
  },
});

// Mutation: Update AI score
export const updateAiScore = mutation({
  args: {
    orgId: v.id("organizations"),
    contactId: v.id("contacts"),
    score: v.number(),
  },
  handler: async (ctx, { orgId, contactId, score }) => {
    const contact = await ctx.db.get(contactId);
    if (!contact || contact.orgId !== orgId) {
      throw new Error("Access denied");
    }

    const normalizedScore = Math.min(100, Math.max(0, score));
    await ctx.db.patch(contactId, {
      aiScore: normalizedScore,
      updatedAt: Date.now(),
    });
    return contactId;
  },
});

// Mutation: Add note
export const addNote = mutation({
  args: {
    orgId: v.id("organizations"),
    contactId: v.id("contacts"),
    note: v.string(),
  },
  handler: async (ctx, { orgId, contactId, note }) => {
    const contact = await ctx.db.get(contactId);
    if (!contact || contact.orgId !== orgId) {
      throw new Error("Access denied");
    }

    const timestamp = new Date().toISOString();
    const newNotes = contact.notes
      ? `${contact.notes}\n\n[${timestamp}] ${note}`
      : `[${timestamp}] ${note}`;

    await ctx.db.patch(contactId, { notes: newNotes });
    return contactId;
  },
});
