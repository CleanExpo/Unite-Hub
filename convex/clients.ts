import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentTimestamp } from "./lib/utils";
import { isValidEmail, generateSlug, isValidSlug } from "./lib/validators";

/**
 * CLIENTS - CRUD operations
 * Individual clients within an organization
 */

// Create a new client
export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    clientName: v.string(),
    businessName: v.string(),
    businessDescription: v.string(),
    packageTier: v.union(v.literal("starter"), v.literal("professional")),
    primaryEmail: v.string(),
    phoneNumbers: v.array(v.string()),
    websiteUrl: v.optional(v.string()),
    portalUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");
    if (!isValidEmail(args.primaryEmail)) throw new Error("Invalid email address");

    let portalUrl = args.portalUrl || generateSlug(args.businessName);
    if (!isValidSlug(portalUrl)) throw new Error("Invalid portal URL format");

    const existingPortal = await ctx.db
      .query("clients")
      .withIndex("by_portal_url", (q) => q.eq("portalUrl", portalUrl))
      .first();

    if (existingPortal) {
      portalUrl = `${portalUrl}-${Math.random().toString(36).substr(2, 6)}`;
    }

    const now = getCurrentTimestamp();
    const clientId = await ctx.db.insert("clients", {
      orgId: args.orgId,
      clientName: args.clientName.trim(),
      businessName: args.businessName.trim(),
      businessDescription: args.businessDescription.trim(),
      packageTier: args.packageTier,
      status: "onboarding",
      primaryEmail: args.primaryEmail.toLowerCase().trim(),
      phoneNumbers: args.phoneNumbers,
      websiteUrl: args.websiteUrl?.trim(),
      portalUrl,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("clientEmails", {
      clientId,
      emailAddress: args.primaryEmail.toLowerCase().trim(),
      isPrimary: true,
      verified: false,
      linkedAt: now,
      createdAt: now,
    });

    await ctx.db.insert("clientContactInfo", {
      clientId,
      phoneNumbers: args.phoneNumbers,
      emailAddresses: [args.primaryEmail.toLowerCase().trim()],
      websiteUrl: args.websiteUrl?.trim(),
      businessName: args.businessName.trim(),
      businessDescription: args.businessDescription.trim(),
      createdAt: now,
      updatedAt: now,
    });

    return clientId;
  },
});

export const get = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");
    return client;
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const client = await ctx.db
      .query("clients")
      .withIndex("by_email", (q) => q.eq("primaryEmail", email))
      .first();
    if (client) return client;

    const clientEmail = await ctx.db
      .query("clientEmails")
      .withIndex("by_email", (q) => q.eq("emailAddress", email))
      .first();
    if (clientEmail) return await ctx.db.get(clientEmail.clientId);
    return null;
  },
});

export const getByPortalUrl = query({
  args: { portalUrl: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_portal_url", (q) => q.eq("portalUrl", args.portalUrl))
      .first();
  },
});

export const listByOrg = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(v.union(v.literal("active"), v.literal("onboarding"), v.literal("inactive"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
    const filtered = args.status ? clients.filter((c) => c.status === args.status) : clients;
    return filtered.slice(0, limit);
  },
});

export const update = mutation({
  args: {
    clientId: v.id("clients"),
    clientName: v.optional(v.string()),
    businessName: v.optional(v.string()),
    businessDescription: v.optional(v.string()),
    packageTier: v.optional(v.union(v.literal("starter"), v.literal("professional"))),
    status: v.optional(v.union(v.literal("active"), v.literal("onboarding"), v.literal("inactive"))),
    primaryEmail: v.optional(v.string()),
    phoneNumbers: v.optional(v.array(v.string())),
    websiteUrl: v.optional(v.string()),
    portalUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");
    if (args.primaryEmail && !isValidEmail(args.primaryEmail)) throw new Error("Invalid email");

    if (args.portalUrl) {
      if (!isValidSlug(args.portalUrl)) throw new Error("Invalid portal URL");
      const existing = await ctx.db
        .query("clients")
        .withIndex("by_portal_url", (q) => q.eq("portalUrl", args.portalUrl))
        .first();
      if (existing && existing._id !== args.clientId) throw new Error("Portal URL in use");
    }

    const updates: Partial<Doc<"clients">> = { updatedAt: getCurrentTimestamp() };
    if (args.clientName) updates.clientName = args.clientName.trim();
    if (args.businessName) updates.businessName = args.businessName.trim();
    if (args.businessDescription) updates.businessDescription = args.businessDescription.trim();
    if (args.packageTier) updates.packageTier = args.packageTier;
    if (args.status) updates.status = args.status;
    if (args.primaryEmail) updates.primaryEmail = args.primaryEmail.toLowerCase().trim();
    if (args.phoneNumbers) updates.phoneNumbers = args.phoneNumbers;
    if (args.websiteUrl !== undefined) updates.websiteUrl = args.websiteUrl?.trim();
    if (args.portalUrl) updates.portalUrl = args.portalUrl;

    await ctx.db.patch(args.clientId, updates);
    return args.clientId;
  },
});

export const remove = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    const clientEmails = await ctx.db
      .query("clientEmails")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const email of clientEmails) await ctx.db.delete(email._id);

    const contactInfo = await ctx.db
      .query("clientContactInfo")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();
    if (contactInfo) await ctx.db.delete(contactInfo._id);

    await ctx.db.delete(args.clientId);
    return { success: true };
  },
});

export const linkEmail = mutation({
  args: {
    clientId: v.id("clients"),
    emailAddress: v.string(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");
    if (!isValidEmail(args.emailAddress)) throw new Error("Invalid email");

    const email = args.emailAddress.toLowerCase().trim();
    const existing = await ctx.db
      .query("clientEmails")
      .withIndex("by_email_and_client", (q) => q.eq("emailAddress", email).eq("clientId", args.clientId))
      .first();
    if (existing) throw new Error("Email already linked");

    const now = getCurrentTimestamp();
    const emailId = await ctx.db.insert("clientEmails", {
      clientId: args.clientId,
      emailAddress: email,
      isPrimary: false,
      label: args.label,
      verified: false,
      linkedAt: now,
      createdAt: now,
    });

    const contactInfo = await ctx.db
      .query("clientContactInfo")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();
    if (contactInfo) {
      await ctx.db.patch(contactInfo._id, {
        emailAddresses: [...contactInfo.emailAddresses, email],
        updatedAt: now,
      });
    }
    return emailId;
  },
});

export const getEmails = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clientEmails")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const getStats = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    const [emailThreads, personas, campaigns, assets] = await Promise.all([
      ctx.db.query("emailThreads").withIndex("by_client", (q) => q.eq("clientId", args.clientId)).collect(),
      ctx.db.query("personas").withIndex("by_client", (q) => q.eq("clientId", args.clientId)).collect(),
      ctx.db.query("socialCampaigns").withIndex("by_client", (q) => q.eq("clientId", args.clientId)).collect(),
      ctx.db.query("clientAssets").withIndex("by_client", (q) => q.eq("clientId", args.clientId)).collect(),
    ]);

    return {
      client,
      stats: {
        totalEmails: emailThreads.length,
        unreadEmails: emailThreads.filter((e) => !e.isRead).length,
        totalPersonas: personas.length,
        activePersonas: personas.filter((p) => p.isActive).length,
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === "active").length,
        totalAssets: assets.length,
      },
    };
  },
});

export const search = query({
  args: {
    orgId: v.id("organizations"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchQuery = args.query.toLowerCase().trim();
    if (searchQuery.length < 2) return [];

    const clients = await ctx.db
      .query("clients")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    return clients
      .filter((c) =>
        c.clientName.toLowerCase().includes(searchQuery) ||
        c.businessName.toLowerCase().includes(searchQuery) ||
        c.primaryEmail.toLowerCase().includes(searchQuery)
      )
      .slice(0, limit);
  },
});

export const getById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
