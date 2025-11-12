import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query: Get system state
export const getState = query({
  args: { orgId: v.id("organizations"), key: v.string() },
  handler: async (ctx, { orgId, key }) => {
    const result = await ctx.db
      .query("systemState")
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), orgId),
          q.eq(q.field("key"), key)
        )
      )
      .first();

    return result ? JSON.parse(result.value) : null;
  },
});

// Mutation: Set system state
export const setState = mutation({
  args: {
    orgId: v.id("organizations"),
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, { orgId, key, value }) => {
    const existing = await ctx.db
      .query("systemState")
      .filter((q) =>
        q.and(
          q.eq(q.field("orgId"), orgId),
          q.eq(q.field("key"), key)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        lastUpdated: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("systemState", {
      orgId,
      key,
      value,
      lastUpdated: Date.now(),
    });
  },
});

// Mutation: Log audit event
export const logAudit = mutation({
  args: {
    orgId: v.id("organizations"),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    agent: v.optional(v.string()),
    details: v.string(),
    status: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      userId: args.userId,
      action: args.action,
      resource: args.resource,
      resourceId: args.resourceId,
      agent: args.agent,
      details: args.details,
      status: args.status,
      timestamp: Date.now(),
    });
  },
});

// Query: Get audit logs
export const getAuditLogs = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
    agent: v.optional(v.string()),
  },
  handler: async (ctx, { orgId, limit = 100, agent }) => {
    let query = ctx.db
      .query("auditLogs")
      .filter((q) => q.eq(q.field("orgId"), orgId));

    if (agent) {
      query = query.filter((q) => q.eq(q.field("agent"), agent));
    }

    return query.order("desc").take(limit);
  },
});
