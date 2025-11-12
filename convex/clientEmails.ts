import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Client Emails - Convex Functions
 * Manages multiple email addresses per client
 */

// Create client email
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    emailAddress: v.string(),
    isPrimary: v.boolean(),
    label: v.optional(v.string()),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("clientEmails", {
      clientId: args.clientId,
      emailAddress: args.emailAddress,
      isPrimary: args.isPrimary,
      label: args.label,
      verified: args.verified,
      linkedAt: now,
      createdAt: now,
    });
  },
});

// Get client email by ID
export const get = query({
  args: { id: v.id("clientEmails") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get client email by email address
export const getByEmail = query({
  args: { emailAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clientEmails")
      .withIndex("by_email", (q) => q.eq("emailAddress", args.emailAddress))
      .first();
  },
});

// Get client email by email and client
export const getByEmailAndClient = query({
  args: {
    emailAddress: v.string(),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clientEmails")
      .withIndex("by_email_and_client", (q) =>
        q.eq("emailAddress", args.emailAddress).eq("clientId", args.clientId)
      )
      .first();
  },
});

// Get all emails for a client
export const getByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clientEmails")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

// Update client email
export const update = mutation({
  args: {
    id: v.id("clientEmails"),
    isPrimary: v.optional(v.boolean()),
    label: v.optional(v.string()),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Update last contact time
export const updateLastContact = mutation({
  args: { id: v.id("clientEmails") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      linkedAt: Date.now(),
    });
    return args.id;
  },
});

// Remove client email
export const remove = mutation({
  args: { id: v.id("clientEmails") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Verify email address
export const verify = mutation({
  args: { id: v.id("clientEmails") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      verified: true,
    });
    return args.id;
  },
});

// Set primary email
export const setPrimary = mutation({
  args: {
    id: v.id("clientEmails"),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    // Get all client emails
    const clientEmails = await ctx.db
      .query("clientEmails")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Set all to non-primary
    for (const ce of clientEmails) {
      if (ce._id !== args.id) {
        await ctx.db.patch(ce._id, { isPrimary: false });
      }
    }

    // Set this one as primary
    await ctx.db.patch(args.id, { isPrimary: true });

    return args.id;
  },
});
