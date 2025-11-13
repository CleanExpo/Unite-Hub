import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new image concept
 */
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("socialCampaigns")),
    conceptType: v.union(
      v.literal("social_post"),
      v.literal("product_mockup"),
      v.literal("marketing_visual"),
      v.literal("ad_creative"),
      v.literal("brand_concept")
    ),
    platform: v.optional(
      v.union(
        v.literal("facebook"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("linkedin"),
        v.literal("general")
      )
    ),
    prompt: v.string(),
    imageUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    dalleImageId: v.optional(v.string()),
    style: v.string(),
    colorPalette: v.array(v.string()),
    dimensions: v.object({
      width: v.number(),
      height: v.number(),
    }),
    usageRecommendations: v.string(),
    technicalSpecs: v.optional(v.string()),
    isUsed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const imageId = await ctx.db.insert("imageConcepts", {
      ...args,
      alternativeConcepts: [],
      createdAt: now,
      updatedAt: now,
    });

    return imageId;
  },
});

/**
 * Get image concept by ID
 */
export const getById = query({
  args: { id: v.id("imageConcepts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all image concepts for a client
 */
export const getByClient = query({
  args: {
    clientId: v.id("clients"),
    conceptType: v.optional(v.string()),
    platform: v.optional(v.string()),
    isUsed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let images = await ctx.db
      .query("imageConcepts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Apply filters
    if (args.conceptType) {
      images = images.filter((img) => img.conceptType === args.conceptType);
    }

    if (args.platform) {
      images = images.filter((img) => img.platform === args.platform);
    }

    if (args.isUsed !== undefined) {
      images = images.filter((img) => img.isUsed === args.isUsed);
    }

    return images;
  },
});

/**
 * Get image concepts by campaign
 */
export const getByCampaign = query({
  args: { campaignId: v.id("socialCampaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("imageConcepts")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
  },
});

/**
 * Get image concepts by type
 */
export const getByType = query({
  args: {
    clientId: v.id("clients"),
    conceptType: v.union(
      v.literal("social_post"),
      v.literal("product_mockup"),
      v.literal("marketing_visual"),
      v.literal("ad_creative"),
      v.literal("brand_concept")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("imageConcepts")
      .withIndex("by_client_and_type", (q) =>
        q.eq("clientId", args.clientId).eq("conceptType", args.conceptType)
      )
      .collect();
  },
});

/**
 * Update image concept
 */
export const update = mutation({
  args: {
    id: v.id("imageConcepts"),
    imageUrl: v.optional(v.string()),
    prompt: v.optional(v.string()),
    dalleImageId: v.optional(v.string()),
    isUsed: v.optional(v.boolean()),
    usageRecommendations: v.optional(v.string()),
    technicalSpecs: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Delete image concept
 */
export const deleteImage = mutation({
  args: { id: v.id("imageConcepts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Mark image as used
 */
export const markAsUsed = mutation({
  args: {
    id: v.id("imageConcepts"),
    campaignId: v.optional(v.id("socialCampaigns")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isUsed: true,
      campaignId: args.campaignId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Add alternative concept to existing image
 */
export const addAlternative = mutation({
  args: {
    id: v.id("imageConcepts"),
    alternativeUrl: v.string(),
    alternativePrompt: v.string(),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.id);

    if (!image) {
      throw new Error("Image concept not found");
    }

    const alternatives = [
      ...image.alternativeConcepts,
      {
        imageUrl: args.alternativeUrl,
        prompt: args.alternativePrompt,
      },
    ];

    await ctx.db.patch(args.id, {
      alternativeConcepts: alternatives,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get image generation statistics for a client
 */
export const getStats = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const allImages = await ctx.db
      .query("imageConcepts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const stats = {
      total: allImages.length,
      byType: {} as Record<string, number>,
      byPlatform: {} as Record<string, number>,
      used: allImages.filter((img) => img.isUsed).length,
      unused: allImages.filter((img) => !img.isUsed).length,
    };

    // Count by type
    allImages.forEach((img) => {
      stats.byType[img.conceptType] = (stats.byType[img.conceptType] || 0) + 1;
      if (img.platform) {
        stats.byPlatform[img.platform] = (stats.byPlatform[img.platform] || 0) + 1;
      }
    });

    return stats;
  },
});

/**
 * Search images by prompt text
 */
export const searchByPrompt = query({
  args: {
    clientId: v.id("clients"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const allImages = await ctx.db
      .query("imageConcepts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();

    return allImages.filter((img) =>
      img.prompt.toLowerCase().includes(searchLower)
    );
  },
});
