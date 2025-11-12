import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentTimestamp } from "./lib/utils";
import { isValidEffectivenessScore } from "./lib/validators";

/**
 * HOOKS & SCRIPTS - Library of marketing hooks and scripts
 * CRUD, search, favorites, categorization
 */

// Create hook/script
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    hookText: v.string(),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("email"),
      v.literal("youtube"),
      v.literal("general")
    ),
    category: v.union(
      v.literal("awareness"),
      v.literal("consideration"),
      v.literal("conversion"),
      v.literal("retention")
    ),
    scriptType: v.union(
      v.literal("hook"),
      v.literal("email_subject"),
      v.literal("social_caption"),
      v.literal("ad_copy"),
      v.literal("video_script"),
      v.literal("sales_script"),
      v.literal("cta")
    ),
    effectivenessScore: v.number(),
    contextExplanation: v.string(),
    suggestedUse: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    if (!isValidEffectivenessScore(args.effectivenessScore)) {
      throw new Error("Effectiveness score must be between 1-10");
    }

    const now = getCurrentTimestamp();

    const hookId = await ctx.db.insert("hooksScripts", {
      clientId: args.clientId,
      hookText: args.hookText.trim(),
      platform: args.platform,
      category: args.category,
      scriptType: args.scriptType,
      effectivenessScore: args.effectivenessScore,
      contextExplanation: args.contextExplanation.trim(),
      suggestedUse: args.suggestedUse.trim(),
      tags: args.tags,
      isFavorite: false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return hookId;
  },
});

// Get hook by ID
export const get = query({
  args: { hookId: v.id("hooksScripts") },
  handler: async (ctx, args) => {
    const hook = await ctx.db.get(args.hookId);
    if (!hook) throw new Error("Hook not found");
    return hook;
  },
});

// List hooks for client
export const listByClient = query({
  args: {
    clientId: v.id("clients"),
    platform: v.optional(
      v.union(
        v.literal("facebook"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("linkedin"),
        v.literal("email"),
        v.literal("youtube"),
        v.literal("general")
      )
    ),
    category: v.optional(
      v.union(
        v.literal("awareness"),
        v.literal("consideration"),
        v.literal("conversion"),
        v.literal("retention")
      )
    ),
    scriptType: v.optional(
      v.union(
        v.literal("hook"),
        v.literal("email_subject"),
        v.literal("social_caption"),
        v.literal("ad_copy"),
        v.literal("video_script"),
        v.literal("sales_script"),
        v.literal("cta")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    let hooks = await ctx.db
      .query("hooksScripts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    if (args.platform) {
      hooks = hooks.filter((h) => h.platform === args.platform);
    }
    if (args.category) {
      hooks = hooks.filter((h) => h.category === args.category);
    }
    if (args.scriptType) {
      hooks = hooks.filter((h) => h.scriptType === args.scriptType);
    }

    return hooks
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, limit);
  },
});

// List hooks by platform
export const listByPlatform = query({
  args: {
    clientId: v.id("clients"),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("email"),
      v.literal("youtube"),
      v.literal("general")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const hooks = await ctx.db
      .query("hooksScripts")
      .withIndex("by_client_and_platform", (q) =>
        q.eq("clientId", args.clientId).eq("platform", args.platform)
      )
      .collect();

    return hooks
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, limit);
  },
});

// Get favorite hooks
export const getFavorites = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const hooks = await ctx.db
      .query("hooksScripts")
      .withIndex("by_client_and_favorite", (q) =>
        q.eq("clientId", args.clientId).eq("isFavorite", true)
      )
      .collect();

    return hooks.slice(0, limit);
  },
});

// Update hook
export const update = mutation({
  args: {
    hookId: v.id("hooksScripts"),
    hookText: v.optional(v.string()),
    platform: v.optional(
      v.union(
        v.literal("facebook"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("linkedin"),
        v.literal("email"),
        v.literal("youtube"),
        v.literal("general")
      )
    ),
    category: v.optional(
      v.union(
        v.literal("awareness"),
        v.literal("consideration"),
        v.literal("conversion"),
        v.literal("retention")
      )
    ),
    scriptType: v.optional(
      v.union(
        v.literal("hook"),
        v.literal("email_subject"),
        v.literal("social_caption"),
        v.literal("ad_copy"),
        v.literal("video_script"),
        v.literal("sales_script"),
        v.literal("cta")
      )
    ),
    effectivenessScore: v.optional(v.number()),
    contextExplanation: v.optional(v.string()),
    suggestedUse: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const hook = await ctx.db.get(args.hookId);
    if (!hook) throw new Error("Hook not found");

    if (
      args.effectivenessScore &&
      !isValidEffectivenessScore(args.effectivenessScore)
    ) {
      throw new Error("Effectiveness score must be between 1-10");
    }

    const updates: Partial<Doc<"hooksScripts">> = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.hookText) updates.hookText = args.hookText.trim();
    if (args.platform) updates.platform = args.platform;
    if (args.category) updates.category = args.category;
    if (args.scriptType) updates.scriptType = args.scriptType;
    if (args.effectivenessScore)
      updates.effectivenessScore = args.effectivenessScore;
    if (args.contextExplanation)
      updates.contextExplanation = args.contextExplanation.trim();
    if (args.suggestedUse) updates.suggestedUse = args.suggestedUse.trim();
    if (args.tags) updates.tags = args.tags;

    await ctx.db.patch(args.hookId, updates);
    return args.hookId;
  },
});

// Toggle favorite
export const toggleFavorite = mutation({
  args: {
    hookId: v.id("hooksScripts"),
    isFavorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const hook = await ctx.db.get(args.hookId);
    if (!hook) throw new Error("Hook not found");

    const newFavoriteStatus = args.isFavorite ?? !hook.isFavorite;

    await ctx.db.patch(args.hookId, {
      isFavorite: newFavoriteStatus,
      updatedAt: getCurrentTimestamp(),
    });

    return args.hookId;
  },
});

// Increment usage count
export const incrementUsage = mutation({
  args: { hookId: v.id("hooksScripts") },
  handler: async (ctx, args) => {
    const hook = await ctx.db.get(args.hookId);
    if (!hook) throw new Error("Hook not found");

    await ctx.db.patch(args.hookId, {
      usageCount: hook.usageCount + 1,
      updatedAt: getCurrentTimestamp(),
    });

    return args.hookId;
  },
});

// Search hooks
export const search = query({
  args: {
    clientId: v.id("clients"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchQuery = args.query.toLowerCase().trim();

    if (searchQuery.length < 2) return [];

    const hooks = await ctx.db
      .query("hooksScripts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const filtered = hooks.filter(
      (hook) =>
        hook.hookText.toLowerCase().includes(searchQuery) ||
        hook.contextExplanation.toLowerCase().includes(searchQuery) ||
        hook.suggestedUse.toLowerCase().includes(searchQuery) ||
        hook.tags.some((tag) => tag.toLowerCase().includes(searchQuery))
    );

    return filtered
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, limit);
  },
});

// Search by tags
export const searchByTags = query({
  args: {
    clientId: v.id("clients"),
    tags: v.array(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchTags = args.tags.map((t) => t.toLowerCase());

    const hooks = await ctx.db
      .query("hooksScripts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const filtered = hooks.filter((hook) =>
      hook.tags.some((tag) => searchTags.includes(tag.toLowerCase()))
    );

    return filtered
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, limit);
  },
});

// Get top performing hooks
export const getTopPerforming = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const hooks = await ctx.db
      .query("hooksScripts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return hooks
      .sort((a, b) => {
        // Sort by effectiveness score, then by usage count
        if (b.effectivenessScore !== a.effectivenessScore) {
          return b.effectivenessScore - a.effectivenessScore;
        }
        return b.usageCount - a.usageCount;
      })
      .slice(0, limit);
  },
});

// Delete hook
export const remove = mutation({
  args: { hookId: v.id("hooksScripts") },
  handler: async (ctx, args) => {
    const hook = await ctx.db.get(args.hookId);
    if (!hook) throw new Error("Hook not found");

    await ctx.db.delete(args.hookId);
    return { success: true };
  },
});

// Get hook stats
export const getStats = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const hooks = await ctx.db
      .query("hooksScripts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const byPlatform = {
      facebook: hooks.filter((h) => h.platform === "facebook").length,
      instagram: hooks.filter((h) => h.platform === "instagram").length,
      tiktok: hooks.filter((h) => h.platform === "tiktok").length,
      linkedin: hooks.filter((h) => h.platform === "linkedin").length,
      email: hooks.filter((h) => h.platform === "email").length,
      youtube: hooks.filter((h) => h.platform === "youtube").length,
      general: hooks.filter((h) => h.platform === "general").length,
    };

    const byType = {
      hook: hooks.filter((h) => h.scriptType === "hook").length,
      email_subject: hooks.filter((h) => h.scriptType === "email_subject").length,
      social_caption: hooks.filter((h) => h.scriptType === "social_caption")
        .length,
      ad_copy: hooks.filter((h) => h.scriptType === "ad_copy").length,
      video_script: hooks.filter((h) => h.scriptType === "video_script").length,
      sales_script: hooks.filter((h) => h.scriptType === "sales_script").length,
      cta: hooks.filter((h) => h.scriptType === "cta").length,
    };

    const avgEffectiveness =
      hooks.reduce((sum, h) => sum + h.effectivenessScore, 0) / hooks.length || 0;

    return {
      total: hooks.length,
      favorites: hooks.filter((h) => h.isFavorite).length,
      byPlatform,
      byType,
      avgEffectiveness: Math.round(avgEffectiveness * 10) / 10,
      totalUsage: hooks.reduce((sum, h) => sum + h.usageCount, 0),
    };
  },
});
