import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * SOCIAL COPY TEMPLATES
 * Complete CRUD operations for social media copy templates
 */

// Generate templates using AI
export const generateTemplates = mutation({
  args: {
    clientId: v.id("clients"),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("twitter")
    ),
    category: v.union(
      v.literal("promotional"),
      v.literal("educational"),
      v.literal("engagement"),
      v.literal("brand_story"),
      v.literal("user_generated"),
      v.literal("behind_scenes"),
      v.literal("product_launch"),
      v.literal("seasonal"),
      v.literal("testimonial"),
      v.literal("how_to")
    ),
    count: v.number(),
    businessContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const templateIds = [];

    // This will be called from API route with Claude AI integration
    // For now, create placeholder templates
    for (let i = 0; i < args.count; i++) {
      const templateId = await ctx.db.insert("socialCopyTemplates", {
        clientId: args.clientId,
        platform: args.platform,
        category: args.category,
        templateName: `${args.category} Template ${i + 1}`,
        copyText: "AI-generated copy will be inserted here",
        hashtags: [],
        emojiSuggestions: [],
        characterCount: 0,
        variations: [],
        performancePrediction: {
          estimatedReach: "Pending",
          estimatedEngagement: "Pending",
          bestTimeToPost: "Pending",
        },
        aiGenerated: true,
        usageCount: 0,
        isFavorite: false,
        tags: [args.category, args.platform],
        createdAt: now,
        updatedAt: now,
      });
      templateIds.push(templateId);
    }

    return templateIds;
  },
});

// Create a template
export const createTemplate = mutation({
  args: {
    clientId: v.id("clients"),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("twitter")
    ),
    category: v.union(
      v.literal("promotional"),
      v.literal("educational"),
      v.literal("engagement"),
      v.literal("brand_story"),
      v.literal("user_generated"),
      v.literal("behind_scenes"),
      v.literal("product_launch"),
      v.literal("seasonal"),
      v.literal("testimonial"),
      v.literal("how_to")
    ),
    templateName: v.string(),
    copyText: v.string(),
    hashtags: v.array(v.string()),
    emojiSuggestions: v.array(v.string()),
    callToAction: v.optional(v.string()),
    variations: v.array(
      v.object({
        copy: v.string(),
        tone: v.string(),
      })
    ),
    performancePrediction: v.object({
      estimatedReach: v.string(),
      estimatedEngagement: v.string(),
      bestTimeToPost: v.string(),
    }),
    aiGenerated: v.boolean(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const characterCount = args.copyText.length;

    const templateId = await ctx.db.insert("socialCopyTemplates", {
      ...args,
      characterCount,
      usageCount: 0,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    });

    return templateId;
  },
});

// Get all templates for a client
export const getTemplates = query({
  args: {
    clientId: v.id("clients"),
    platform: v.optional(
      v.union(
        v.literal("facebook"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("linkedin"),
        v.literal("twitter")
      )
    ),
    category: v.optional(
      v.union(
        v.literal("promotional"),
        v.literal("educational"),
        v.literal("engagement"),
        v.literal("brand_story"),
        v.literal("user_generated"),
        v.literal("behind_scenes"),
        v.literal("product_launch"),
        v.literal("seasonal"),
        v.literal("testimonial"),
        v.literal("how_to")
      )
    ),
    favoriteOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let templates = await ctx.db
      .query("socialCopyTemplates")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Apply filters
    if (args.platform) {
      templates = templates.filter((t) => t.platform === args.platform);
    }

    if (args.category) {
      templates = templates.filter((t) => t.category === args.category);
    }

    if (args.favoriteOnly) {
      templates = templates.filter((t) => t.isFavorite);
    }

    // Sort by created date (newest first)
    templates.sort((a, b) => b.createdAt - a.createdAt);

    return templates;
  },
});

// Get templates by platform
export const getTemplatesByPlatform = query({
  args: {
    clientId: v.id("clients"),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("twitter")
    ),
  },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("socialCopyTemplates")
      .withIndex("by_client_and_platform", (q) =>
        q.eq("clientId", args.clientId).eq("platform", args.platform)
      )
      .collect();

    return templates;
  },
});

// Search templates
export const searchTemplates = query({
  args: {
    clientId: v.id("clients"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const allTemplates = await ctx.db
      .query("socialCopyTemplates")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const searchLower = args.query.toLowerCase();

    const filtered = allTemplates.filter(
      (template) =>
        template.templateName.toLowerCase().includes(searchLower) ||
        template.copyText.toLowerCase().includes(searchLower) ||
        template.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
        template.hashtags.some((tag) => tag.toLowerCase().includes(searchLower))
    );

    return filtered;
  },
});

// Get a single template
export const getTemplate = query({
  args: { templateId: v.id("socialCopyTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    return template;
  },
});

// Update template
export const updateTemplate = mutation({
  args: {
    templateId: v.id("socialCopyTemplates"),
    updates: v.object({
      templateName: v.optional(v.string()),
      copyText: v.optional(v.string()),
      hashtags: v.optional(v.array(v.string())),
      emojiSuggestions: v.optional(v.array(v.string())),
      callToAction: v.optional(v.string()),
      variations: v.optional(
        v.array(
          v.object({
            copy: v.string(),
            tone: v.string(),
          })
        )
      ),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.templateId);
    if (!existing) {
      throw new Error("Template not found");
    }

    const updates: any = {
      ...args.updates,
      updatedAt: Date.now(),
    };

    if (args.updates.copyText) {
      updates.characterCount = args.updates.copyText.length;
    }

    await ctx.db.patch(args.templateId, updates);
    return args.templateId;
  },
});

// Generate variations for a template
export const generateVariations = mutation({
  args: {
    templateId: v.id("socialCopyTemplates"),
    count: v.number(),
    tones: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // This will be called from API route with Claude AI integration
    // For now, just mark for generation
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Placeholder - will be populated by API route
    return { templateId: args.templateId, status: "pending_generation" };
  },
});

// Toggle favorite
export const toggleFavorite = mutation({
  args: { templateId: v.id("socialCopyTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(args.templateId, {
      isFavorite: !template.isFavorite,
      updatedAt: Date.now(),
    });

    return !template.isFavorite;
  },
});

// Track usage
export const trackUsage = mutation({
  args: { templateId: v.id("socialCopyTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    await ctx.db.patch(args.templateId, {
      usageCount: template.usageCount + 1,
      updatedAt: Date.now(),
    });

    return template.usageCount + 1;
  },
});

// Duplicate template
export const duplicateTemplate = mutation({
  args: { templateId: v.id("socialCopyTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const now = Date.now();
    const newTemplateId = await ctx.db.insert("socialCopyTemplates", {
      ...template,
      templateName: `${template.templateName} (Copy)`,
      usageCount: 0,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    });

    return newTemplateId;
  },
});

// Delete template
export const deleteTemplate = mutation({
  args: { templateId: v.id("socialCopyTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.templateId);
    return { success: true };
  },
});

// Get favorite templates
export const getFavorites = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("socialCopyTemplates")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return favorites.filter((t) => t.isFavorite);
  },
});

// Get template stats
export const getTemplateStats = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("socialCopyTemplates")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const stats = {
      total: templates.length,
      byPlatform: {
        facebook: templates.filter((t) => t.platform === "facebook").length,
        instagram: templates.filter((t) => t.platform === "instagram").length,
        tiktok: templates.filter((t) => t.platform === "tiktok").length,
        linkedin: templates.filter((t) => t.platform === "linkedin").length,
        twitter: templates.filter((t) => t.platform === "twitter").length,
      },
      byCategory: {
        promotional: templates.filter((t) => t.category === "promotional").length,
        educational: templates.filter((t) => t.category === "educational").length,
        engagement: templates.filter((t) => t.category === "engagement").length,
        brand_story: templates.filter((t) => t.category === "brand_story").length,
        user_generated: templates.filter((t) => t.category === "user_generated").length,
        behind_scenes: templates.filter((t) => t.category === "behind_scenes").length,
        product_launch: templates.filter((t) => t.category === "product_launch").length,
        seasonal: templates.filter((t) => t.category === "seasonal").length,
        testimonial: templates.filter((t) => t.category === "testimonial").length,
        how_to: templates.filter((t) => t.category === "how_to").length,
      },
      favorites: templates.filter((t) => t.isFavorite).length,
      mostUsed: templates
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map((t) => ({
          id: t._id,
          name: t.templateName,
          usageCount: t.usageCount,
        })),
    };

    return stats;
  },
});

// Bulk delete templates
export const bulkDelete = mutation({
  args: { templateIds: v.array(v.id("socialCopyTemplates")) },
  handler: async (ctx, args) => {
    for (const templateId of args.templateIds) {
      await ctx.db.delete(templateId);
    }
    return { deleted: args.templateIds.length };
  },
});

// Bulk favorite templates
export const bulkFavorite = mutation({
  args: {
    templateIds: v.array(v.id("socialCopyTemplates")),
    favorite: v.boolean(),
  },
  handler: async (ctx, args) => {
    for (const templateId of args.templateIds) {
      await ctx.db.patch(templateId, {
        isFavorite: args.favorite,
        updatedAt: Date.now(),
      });
    }
    return { updated: args.templateIds.length };
  },
});
