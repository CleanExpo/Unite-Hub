import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentTimestamp, isValidDateRange } from "./lib/utils";
import {
  adCopyVariationValidator,
  visualRequirementsValidator,
  contentCalendarItemValidator,
} from "./lib/validators";

/**
 * SOCIAL CAMPAIGNS - Platform-specific social media campaigns
 * CRUD for all 4 platforms (Facebook, Instagram, TikTok, LinkedIn)
 */

// Create campaign
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    strategyId: v.optional(v.id("marketingStrategies")),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    campaignName: v.string(),
    campaignThemes: v.array(v.string()),
    adCopyVariations: v.array(adCopyVariationValidator),
    visualRequirements: visualRequirementsValidator,
    audienceTargeting: v.optional(v.any()),
    timeline: v.object({
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      milestones: v.array(
        v.object({
          date: v.number(),
          description: v.string(),
        })
      ),
    }),
    contentCalendar: v.optional(v.array(contentCalendarItemValidator)),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    if (args.strategyId) {
      const strategy = await ctx.db.get(args.strategyId);
      if (!strategy) throw new Error("Strategy not found");
    }

    // Validate timeline if dates provided
    if (args.timeline.startDate && args.timeline.endDate) {
      if (!isValidDateRange(args.timeline.startDate, args.timeline.endDate)) {
        throw new Error("Invalid date range");
      }
    }

    const now = getCurrentTimestamp();

    const campaignId = await ctx.db.insert("socialCampaigns", {
      clientId: args.clientId,
      strategyId: args.strategyId,
      platform: args.platform,
      campaignName: args.campaignName.trim(),
      campaignThemes: args.campaignThemes,
      adCopyVariations: args.adCopyVariations,
      visualRequirements: args.visualRequirements,
      audienceTargeting: args.audienceTargeting,
      timeline: args.timeline,
      contentCalendar: args.contentCalendar || [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    return campaignId;
  },
});

// Get campaign by ID
export const get = query({
  args: { campaignId: v.id("socialCampaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");
    return campaign;
  },
});

// List campaigns for client
export const listByClient = query({
  args: {
    clientId: v.id("clients"),
    platform: v.optional(
      v.union(
        v.literal("facebook"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("linkedin")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("paused"),
        v.literal("completed")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    let campaigns;

    if (args.platform) {
      campaigns = await ctx.db
        .query("socialCampaigns")
        .withIndex("by_client_and_platform", (q) =>
          q.eq("clientId", args.clientId).eq("platform", args.platform)
        )
        .collect();
    } else {
      campaigns = await ctx.db
        .query("socialCampaigns")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .collect();
    }

    if (args.status) {
      campaigns = campaigns.filter((c) => c.status === args.status);
    }

    return campaigns.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

// List campaigns by platform
export const listByPlatform = query({
  args: {
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    return await ctx.db
      .query("socialCampaigns")
      .withIndex("by_platform", (q) => q.eq("platform", args.platform))
      .order("desc")
      .take(limit);
  },
});

// List campaigns by status
export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    return await ctx.db
      .query("socialCampaigns")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(limit);
  },
});

// Update campaign
export const update = mutation({
  args: {
    campaignId: v.id("socialCampaigns"),
    campaignName: v.optional(v.string()),
    campaignThemes: v.optional(v.array(v.string())),
    adCopyVariations: v.optional(v.array(adCopyVariationValidator)),
    visualRequirements: v.optional(visualRequirementsValidator),
    audienceTargeting: v.optional(v.any()),
    timeline: v.optional(
      v.object({
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        milestones: v.array(
          v.object({
            date: v.number(),
            description: v.string(),
          })
        ),
      })
    ),
    contentCalendar: v.optional(v.array(contentCalendarItemValidator)),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("paused"),
        v.literal("completed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const updates: Partial<Doc<"socialCampaigns">> = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.campaignName) updates.campaignName = args.campaignName.trim();
    if (args.campaignThemes) updates.campaignThemes = args.campaignThemes;
    if (args.adCopyVariations) updates.adCopyVariations = args.adCopyVariations;
    if (args.visualRequirements)
      updates.visualRequirements = args.visualRequirements;
    if (args.audienceTargeting !== undefined)
      updates.audienceTargeting = args.audienceTargeting;
    if (args.timeline) updates.timeline = args.timeline;
    if (args.contentCalendar) updates.contentCalendar = args.contentCalendar;
    if (args.status) updates.status = args.status;

    await ctx.db.patch(args.campaignId, updates);
    return args.campaignId;
  },
});

// Update campaign status
export const updateStatus = mutation({
  args: {
    campaignId: v.id("socialCampaigns"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    await ctx.db.patch(args.campaignId, {
      status: args.status,
      updatedAt: getCurrentTimestamp(),
    });

    return args.campaignId;
  },
});

// Add content to calendar
export const addContentToCalendar = mutation({
  args: {
    campaignId: v.id("socialCampaigns"),
    contentItem: contentCalendarItemValidator,
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    await ctx.db.patch(args.campaignId, {
      contentCalendar: [...campaign.contentCalendar, args.contentItem],
      updatedAt: getCurrentTimestamp(),
    });

    return args.campaignId;
  },
});

// Update content calendar item
export const updateContentCalendarItem = mutation({
  args: {
    campaignId: v.id("socialCampaigns"),
    itemIndex: v.number(),
    updates: v.object({
      date: v.optional(v.number()),
      contentType: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(
        v.union(
          v.literal("draft"),
          v.literal("scheduled"),
          v.literal("published")
        )
      ),
    }),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    if (args.itemIndex >= campaign.contentCalendar.length) {
      throw new Error("Invalid item index");
    }

    const updatedCalendar = [...campaign.contentCalendar];
    updatedCalendar[args.itemIndex] = {
      ...updatedCalendar[args.itemIndex],
      ...args.updates,
    };

    await ctx.db.patch(args.campaignId, {
      contentCalendar: updatedCalendar,
      updatedAt: getCurrentTimestamp(),
    });

    return args.campaignId;
  },
});

// Remove content from calendar
export const removeContentFromCalendar = mutation({
  args: {
    campaignId: v.id("socialCampaigns"),
    itemIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const updatedCalendar = campaign.contentCalendar.filter(
      (_, index) => index !== args.itemIndex
    );

    await ctx.db.patch(args.campaignId, {
      contentCalendar: updatedCalendar,
      updatedAt: getCurrentTimestamp(),
    });

    return args.campaignId;
  },
});

// Delete campaign
export const remove = mutation({
  args: { campaignId: v.id("socialCampaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    await ctx.db.delete(args.campaignId);
    return { success: true };
  },
});

// Get campaign stats
export const getStats = query({
  args: {
    clientId: v.optional(v.id("clients")),
    platform: v.optional(
      v.union(
        v.literal("facebook"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("linkedin")
      )
    ),
  },
  handler: async (ctx, args) => {
    let campaigns;

    if (args.clientId && args.platform) {
      campaigns = await ctx.db
        .query("socialCampaigns")
        .withIndex("by_client_and_platform", (q) =>
          q.eq("clientId", args.clientId).eq("platform", args.platform)
        )
        .collect();
    } else if (args.clientId) {
      campaigns = await ctx.db
        .query("socialCampaigns")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .collect();
    } else if (args.platform) {
      campaigns = await ctx.db
        .query("socialCampaigns")
        .withIndex("by_platform", (q) => q.eq("platform", args.platform))
        .collect();
    } else {
      campaigns = await ctx.db.query("socialCampaigns").collect();
    }

    const byStatus = {
      draft: campaigns.filter((c) => c.status === "draft").length,
      active: campaigns.filter((c) => c.status === "active").length,
      paused: campaigns.filter((c) => c.status === "paused").length,
      completed: campaigns.filter((c) => c.status === "completed").length,
    };

    const byPlatform = {
      facebook: campaigns.filter((c) => c.platform === "facebook").length,
      instagram: campaigns.filter((c) => c.platform === "instagram").length,
      tiktok: campaigns.filter((c) => c.platform === "tiktok").length,
      linkedin: campaigns.filter((c) => c.platform === "linkedin").length,
    };

    return {
      total: campaigns.length,
      byStatus,
      byPlatform,
    };
  },
});
