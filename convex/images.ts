import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentTimestamp } from "./lib/utils";
import { isValidHexColor } from "./lib/validators";

/**
 * IMAGE CONCEPTS - DALL-E generated image concepts
 * CRUD, organization, usage tracking
 */

// Create image concept
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
    alternativeConcepts: v.optional(
      v.array(
        v.object({
          imageUrl: v.string(),
          prompt: v.string(),
        })
      )
    ),
    usageRecommendations: v.string(),
    technicalSpecs: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    if (args.campaignId) {
      const campaign = await ctx.db.get(args.campaignId);
      if (!campaign) throw new Error("Campaign not found");
    }

    // Validate color palette
    for (const color of args.colorPalette) {
      if (!isValidHexColor(color)) {
        throw new Error(`Invalid hex color: ${color}`);
      }
    }

    const now = getCurrentTimestamp();

    const imageId = await ctx.db.insert("imageConcepts", {
      clientId: args.clientId,
      campaignId: args.campaignId,
      conceptType: args.conceptType,
      platform: args.platform,
      prompt: args.prompt.trim(),
      imageUrl: args.imageUrl.trim(),
      thumbnailUrl: args.thumbnailUrl?.trim(),
      dalleImageId: args.dalleImageId,
      style: args.style.trim(),
      colorPalette: args.colorPalette,
      dimensions: args.dimensions,
      alternativeConcepts: args.alternativeConcepts || [],
      usageRecommendations: args.usageRecommendations.trim(),
      technicalSpecs: args.technicalSpecs?.trim(),
      isUsed: false,
      createdAt: now,
      updatedAt: now,
    });

    return imageId;
  },
});

// Get image concept by ID
export const get = query({
  args: { imageId: v.id("imageConcepts") },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image concept not found");
    return image;
  },
});

// List images for client
export const listByClient = query({
  args: {
    clientId: v.id("clients"),
    conceptType: v.optional(
      v.union(
        v.literal("social_post"),
        v.literal("product_mockup"),
        v.literal("marketing_visual"),
        v.literal("ad_creative"),
        v.literal("brand_concept")
      )
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
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    let images = await ctx.db
      .query("imageConcepts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    if (args.conceptType) {
      images = images.filter((img) => img.conceptType === args.conceptType);
    }
    if (args.platform) {
      images = images.filter((img) => img.platform === args.platform);
    }

    return images.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

// List images by campaign
export const listByCampaign = query({
  args: {
    campaignId: v.id("socialCampaigns"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    return await ctx.db
      .query("imageConcepts")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .order("desc")
      .take(limit);
  },
});

// List images by type
export const listByType = query({
  args: {
    clientId: v.id("clients"),
    conceptType: v.union(
      v.literal("social_post"),
      v.literal("product_mockup"),
      v.literal("marketing_visual"),
      v.literal("ad_creative"),
      v.literal("brand_concept")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const images = await ctx.db
      .query("imageConcepts")
      .withIndex("by_client_and_type", (q) =>
        q.eq("clientId", args.clientId).eq("conceptType", args.conceptType)
      )
      .collect();

    return images.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

// List images by platform
export const listByPlatform = query({
  args: {
    clientId: v.id("clients"),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("general")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const images = await ctx.db
      .query("imageConcepts")
      .withIndex("by_platform", (q) => q.eq("platform", args.platform))
      .collect();

    return images
      .filter((img) => img.clientId === args.clientId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

// Update image concept
export const update = mutation({
  args: {
    imageId: v.id("imageConcepts"),
    prompt: v.optional(v.string()),
    style: v.optional(v.string()),
    colorPalette: v.optional(v.array(v.string())),
    usageRecommendations: v.optional(v.string()),
    technicalSpecs: v.optional(v.string()),
    isUsed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image concept not found");

    // Validate color palette if provided
    if (args.colorPalette) {
      for (const color of args.colorPalette) {
        if (!isValidHexColor(color)) {
          throw new Error(`Invalid hex color: ${color}`);
        }
      }
    }

    const updates: Partial<Doc<"imageConcepts">> = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.prompt) updates.prompt = args.prompt.trim();
    if (args.style) updates.style = args.style.trim();
    if (args.colorPalette) updates.colorPalette = args.colorPalette;
    if (args.usageRecommendations)
      updates.usageRecommendations = args.usageRecommendations.trim();
    if (args.technicalSpecs !== undefined)
      updates.technicalSpecs = args.technicalSpecs?.trim();
    if (args.isUsed !== undefined) updates.isUsed = args.isUsed;

    await ctx.db.patch(args.imageId, updates);
    return args.imageId;
  },
});

// Mark image as used
export const markAsUsed = mutation({
  args: {
    imageId: v.id("imageConcepts"),
    isUsed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image concept not found");

    await ctx.db.patch(args.imageId, {
      isUsed: args.isUsed ?? true,
      updatedAt: getCurrentTimestamp(),
    });

    return args.imageId;
  },
});

// Add alternative concept
export const addAlternative = mutation({
  args: {
    imageId: v.id("imageConcepts"),
    alternativeImageUrl: v.string(),
    alternativePrompt: v.string(),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image concept not found");

    const newAlternative = {
      imageUrl: args.alternativeImageUrl.trim(),
      prompt: args.alternativePrompt.trim(),
    };

    await ctx.db.patch(args.imageId, {
      alternativeConcepts: [...image.alternativeConcepts, newAlternative],
      updatedAt: getCurrentTimestamp(),
    });

    return args.imageId;
  },
});

// Search images by prompt or style
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

    const images = await ctx.db
      .query("imageConcepts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const filtered = images.filter(
      (image) =>
        image.prompt.toLowerCase().includes(searchQuery) ||
        image.style.toLowerCase().includes(searchQuery) ||
        image.usageRecommendations.toLowerCase().includes(searchQuery)
    );

    return filtered.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

// Delete image concept
export const remove = mutation({
  args: { imageId: v.id("imageConcepts") },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image concept not found");

    await ctx.db.delete(args.imageId);
    return { success: true };
  },
});

// Get image stats
export const getStats = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("imageConcepts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const byType = {
      social_post: images.filter((img) => img.conceptType === "social_post")
        .length,
      product_mockup: images.filter((img) => img.conceptType === "product_mockup")
        .length,
      marketing_visual: images.filter(
        (img) => img.conceptType === "marketing_visual"
      ).length,
      ad_creative: images.filter((img) => img.conceptType === "ad_creative")
        .length,
      brand_concept: images.filter((img) => img.conceptType === "brand_concept")
        .length,
    };

    const byPlatform = {
      facebook: images.filter((img) => img.platform === "facebook").length,
      instagram: images.filter((img) => img.platform === "instagram").length,
      tiktok: images.filter((img) => img.platform === "tiktok").length,
      linkedin: images.filter((img) => img.platform === "linkedin").length,
      general: images.filter((img) => img.platform === "general").length,
    };

    return {
      total: images.length,
      used: images.filter((img) => img.isUsed).length,
      unused: images.filter((img) => !img.isUsed).length,
      byType,
      byPlatform,
      totalAlternatives: images.reduce(
        (sum, img) => sum + img.alternativeConcepts.length,
        0
      ),
    };
  },
});
