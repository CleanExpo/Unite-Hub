import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get all assets for a client
 */
export const getByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clientAssets")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

/**
 * Get assets by type
 */
export const getByType = query({
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
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clientAssets")
      .withIndex("by_client_and_type", (q) =>
        q.eq("clientId", args.clientId).eq("fileType", args.fileType)
      )
      .collect();
  },
});

/**
 * Get asset by ID
 */
export const getById = query({
  args: { id: v.id("clientAssets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create new asset
 */
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
    const now = Date.now();

    const assetId = await ctx.db.insert("clientAssets", {
      ...args,
      uploadedAt: now,
      createdAt: now,
    });

    return assetId;
  },
});

/**
 * Delete asset
 */
export const deleteAsset = mutation({
  args: { id: v.id("clientAssets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Update asset metadata
 */
export const updateMetadata = mutation({
  args: {
    id: v.id("clientAssets"),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      metadata: args.metadata,
    });

    return { success: true };
  },
});
