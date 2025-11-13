import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentTimestamp, formatFileSize } from "./lib/utils";
import { isValidFileSize, isValidImageMimeType, isValidDocumentMimeType } from "./lib/validators";
import { enforceUsageLimit, getClientTierLimits } from "./lib/permissions";

/**
 * CLIENT ASSETS - Asset upload tracking and organization
 * CRUD for logos, photos, documents, marketing materials
 */

// Create asset
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    fileName: v.string(),
    fileUrl: v.string(),
    fileType: v.union(
      v.literal("logo"),
      v.literal("photo"),
      v.literal("business_card"),
      v.literal("marketing_material"),
      v.literal("brand_guidelines"),
      v.literal("document"),
      v.literal("other")
    ),
    category: v.optional(v.string()),
    mimeType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    // Check tier limits
    const existingAssets = await ctx.db
      .query("clientAssets")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const tierLimits = getClientTierLimits(client.packageTier);
    if (existingAssets.length >= tierLimits.clientAssets) {
      throw new Error(
        `Asset limit reached for ${client.packageTier} plan (${tierLimits.clientAssets} assets). Upgrade to add more.`
      );
    }

    // Validate file size (10MB default)
    if (!isValidFileSize(args.fileSize, 10)) {
      throw new Error("File size exceeds 10MB limit");
    }

    // Validate MIME type for specific file types
    if (
      ["logo", "photo", "business_card", "marketing_material"].includes(
        args.fileType
      )
    ) {
      if (!isValidImageMimeType(args.mimeType)) {
        throw new Error("Invalid image file type");
      }
    }

    const now = getCurrentTimestamp();

    const assetId = await ctx.db.insert("clientAssets", {
      clientId: args.clientId,
      fileName: args.fileName.trim(),
      fileUrl: args.fileUrl.trim(),
      fileType: args.fileType,
      category: args.category?.trim(),
      mimeType: args.mimeType,
      fileSize: args.fileSize,
      uploadedBy: args.uploadedBy.trim(),
      metadata: args.metadata,
      uploadedAt: now,
      createdAt: now,
    });

    return assetId;
  },
});

// Get asset by ID
export const get = query({
  args: { assetId: v.id("clientAssets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");
    return asset;
  },
});

// List assets for client
export const listByClient = query({
  args: {
    clientId: v.id("clients"),
    fileType: v.optional(
      v.union(
        v.literal("logo"),
        v.literal("photo"),
        v.literal("business_card"),
        v.literal("marketing_material"),
        v.literal("brand_guidelines"),
        v.literal("document"),
        v.literal("other")
      )
    ),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    let assets;

    if (args.fileType) {
      assets = await ctx.db
        .query("clientAssets")
        .withIndex("by_client_and_type", (q) =>
          q.eq("clientId", args.clientId).eq("fileType", args.fileType)
        )
        .collect();
    } else {
      assets = await ctx.db
        .query("clientAssets")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .collect();
    }

    if (args.category) {
      assets = assets.filter((a) => a.category === args.category);
    }

    return assets.sort((a, b) => b.uploadedAt - a.uploadedAt).slice(0, limit);
  },
});

// List assets by type
export const listByType = query({
  args: {
    clientId: v.id("clients"),
    fileType: v.union(
      v.literal("logo"),
      v.literal("photo"),
      v.literal("business_card"),
      v.literal("marketing_material"),
      v.literal("brand_guidelines"),
      v.literal("document"),
      v.literal("other")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("clientAssets")
      .withIndex("by_client_and_type", (q) =>
        q.eq("clientId", args.clientId).eq("fileType", args.fileType)
      )
      .order("desc")
      .take(limit);
  },
});

// Get logos for client
export const getLogos = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    return await ctx.db
      .query("clientAssets")
      .withIndex("by_client_and_type", (q) =>
        q.eq("clientId", args.clientId).eq("fileType", "logo")
      )
      .order("desc")
      .take(limit);
  },
});

// Update asset
export const update = mutation({
  args: {
    assetId: v.id("clientAssets"),
    fileName: v.optional(v.string()),
    fileType: v.optional(
      v.union(
        v.literal("logo"),
        v.literal("photo"),
        v.literal("business_card"),
        v.literal("marketing_material"),
        v.literal("brand_guidelines"),
        v.literal("document"),
        v.literal("other")
      )
    ),
    category: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    const updates: Partial<Doc<"clientAssets">> = {};

    if (args.fileName) updates.fileName = args.fileName.trim();
    if (args.fileType) updates.fileType = args.fileType;
    if (args.category !== undefined) updates.category = args.category?.trim();
    if (args.metadata !== undefined) updates.metadata = args.metadata;

    await ctx.db.patch(args.assetId, updates);
    return args.assetId;
  },
});

// Delete asset
export const remove = mutation({
  args: { assetId: v.id("clientAssets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    await ctx.db.delete(args.assetId);
    return { success: true };
  },
});

// Search assets
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

    const assets = await ctx.db
      .query("clientAssets")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const filtered = assets.filter(
      (asset) =>
        asset.fileName.toLowerCase().includes(searchQuery) ||
        asset.category?.toLowerCase().includes(searchQuery)
    );

    return filtered.sort((a, b) => b.uploadedAt - a.uploadedAt).slice(0, limit);
  },
});

// Get asset stats
export const getStats = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("clientAssets")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const byType = {
      logo: assets.filter((a) => a.fileType === "logo").length,
      photo: assets.filter((a) => a.fileType === "photo").length,
      business_card: assets.filter((a) => a.fileType === "business_card").length,
      marketing_material: assets.filter(
        (a) => a.fileType === "marketing_material"
      ).length,
      brand_guidelines: assets.filter((a) => a.fileType === "brand_guidelines")
        .length,
      document: assets.filter((a) => a.fileType === "document").length,
      other: assets.filter((a) => a.fileType === "other").length,
    };

    const totalSize = assets.reduce((sum, a) => sum + a.fileSize, 0);

    return {
      total: assets.length,
      byType,
      totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
    };
  },
});

// Get storage usage
export const getStorageUsage = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    const assets = await ctx.db
      .query("clientAssets")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const tierLimits = getClientTierLimits(client.packageTier);
    const totalSize = assets.reduce((sum, a) => sum + a.fileSize, 0);

    return {
      used: assets.length,
      limit: tierLimits.clientAssets,
      percentage: (assets.length / tierLimits.clientAssets) * 100,
      totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
      canUploadMore: assets.length < tierLimits.clientAssets,
    };
  },
});

// Bulk delete assets
export const removeBulk = mutation({
  args: {
    assetIds: v.array(v.id("clientAssets")),
  },
  handler: async (ctx, args) => {
    for (const assetId of args.assetIds) {
      const asset = await ctx.db.get(assetId);
      if (asset) {
        await ctx.db.delete(assetId);
      }
    }

    return { success: true, count: args.assetIds.length };
  },
});

// Get recent uploads
export const getRecentUploads = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    return await ctx.db
      .query("clientAssets")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(limit);
  },
});
