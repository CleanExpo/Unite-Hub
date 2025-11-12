import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query: Get user by email
export const getByEmail = query({
  args: { orgId: v.id("organizations"), email: v.string() },
  handler: async (ctx, { orgId, email }) => {
    return await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), orgId),
          q.eq(q.field("email"), email)
        )
      )
      .first();
  },
});

// Query: List users in organization
export const listByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

// Mutation: Create user
export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    email: v.string(),
    name: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), args.orgId),
          q.eq(q.field("email"), args.email)
        )
      )
      .first();

    if (existing) {
      throw new Error("User already exists in organization");
    }

    return await ctx.db.insert("users", {
      orgId: args.orgId,
      email: args.email,
      name: args.name,
      role: args.role,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

// Mutation: Update user role
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, { userId, role }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(userId, { role });
    return userId;
  },
});

// Mutation: Update last login
export const updateLastLogin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { lastLogin: Date.now() });
    return userId;
  },
});
