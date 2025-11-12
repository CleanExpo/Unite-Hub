import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query: Get organization by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

// Query: Get organization by ID
export const get = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    return await ctx.db.get(orgId);
  },
});

// Mutation: Create new organization
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    tier: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error("Organization slug already exists");
    }

    return await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      tier: args.tier,
      description: args.description,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Mutation: Update organization
export const update = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tier: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    const updates: any = { updatedAt: Date.now() };
    if (args.name) updates.name = args.name;
    if (args.description) updates.description = args.description;
    if (args.tier) updates.tier = args.tier;
    if (args.status) updates.status = args.status;

    await ctx.db.patch(args.orgId, updates);
    return args.orgId;
  },
});
