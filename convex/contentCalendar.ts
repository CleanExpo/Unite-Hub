import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getCurrentTimestamp, addDays, getStartOfDay, getEndOfDay } from "./lib/utils";
import { TIER_LIMITS } from "./lib/permissions";

/**
 * CONTENT CALENDAR - AI-generated 30-day content calendar
 * Generate calendar, manage posts, track performance
 */

const engagementValidator = v.object({
  likes: v.number(),
  comments: v.number(),
  shares: v.number(),
});

// Generate AI-powered content calendar
export const generateCalendar = mutation({
  args: {
    clientId: v.id("clients"),
    strategyId: v.optional(v.id("marketingStrategies")),
    startDate: v.number(),
    endDate: v.number(),
    platforms: v.array(
      v.union(
        v.literal("facebook"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("linkedin"),
        v.literal("blog"),
        v.literal("email")
      )
    ),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    // Calculate number of days
    const durationMs = args.endDate - args.startDate;
    const durationDays = Math.ceil(durationMs / (24 * 60 * 60 * 1000));

    // Check tier limits
    const maxPosts = TIER_LIMITS[client.packageTier].calendarPosts;
    if (maxPosts && durationDays > maxPosts) {
      throw new Error(
        `Your ${client.packageTier} plan allows up to ${maxPosts} days of content calendar. Upgrade to Professional for 90 days.`
      );
    }

    // Delete existing posts in this date range
    const existingPosts = await ctx.db
      .query("contentCalendarPosts")
      .withIndex("by_client_and_date", (q) =>
        q.eq("clientId", args.clientId).gte("scheduledDate", args.startDate)
      )
      .collect();

    for (const post of existingPosts) {
      if (post.scheduledDate <= args.endDate) {
        await ctx.db.delete(post._id);
      }
    }

    return {
      success: true,
      message: `Ready to generate ${durationDays}-day calendar. Call AI API to generate posts.`,
      durationDays,
      maxPosts,
    };
  },
});

// Create individual calendar post
export const createPost = mutation({
  args: {
    clientId: v.id("clients"),
    strategyId: v.optional(v.id("marketingStrategies")),
    scheduledDate: v.number(),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("blog"),
      v.literal("email")
    ),
    postType: v.union(
      v.literal("promotional"),
      v.literal("educational"),
      v.literal("engagement"),
      v.literal("brand_story"),
      v.literal("user_generated")
    ),
    contentPillar: v.string(),
    suggestedCopy: v.string(),
    suggestedHashtags: v.array(v.string()),
    suggestedImagePrompt: v.optional(v.string()),
    imageConceptId: v.optional(v.id("imageConcepts")),
    aiReasoning: v.string(),
    bestTimeToPost: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    callToAction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    const now = getCurrentTimestamp();

    const postId = await ctx.db.insert("contentCalendarPosts", {
      clientId: args.clientId,
      strategyId: args.strategyId,
      scheduledDate: args.scheduledDate,
      platform: args.platform,
      postType: args.postType,
      contentPillar: args.contentPillar.trim(),
      suggestedCopy: args.suggestedCopy.trim(),
      suggestedHashtags: args.suggestedHashtags,
      suggestedImagePrompt: args.suggestedImagePrompt?.trim(),
      imageConceptId: args.imageConceptId,
      status: "suggested",
      aiReasoning: args.aiReasoning.trim(),
      bestTimeToPost: args.bestTimeToPost?.trim(),
      targetAudience: args.targetAudience?.trim(),
      callToAction: args.callToAction?.trim(),
      createdAt: now,
      updatedAt: now,
    });

    return postId;
  },
});

// Batch create posts (for AI generation)
export const batchCreatePosts = mutation({
  args: {
    posts: v.array(
      v.object({
        clientId: v.id("clients"),
        strategyId: v.optional(v.id("marketingStrategies")),
        scheduledDate: v.number(),
        platform: v.union(
          v.literal("facebook"),
          v.literal("instagram"),
          v.literal("tiktok"),
          v.literal("linkedin"),
          v.literal("blog"),
          v.literal("email")
        ),
        postType: v.union(
          v.literal("promotional"),
          v.literal("educational"),
          v.literal("engagement"),
          v.literal("brand_story"),
          v.literal("user_generated")
        ),
        contentPillar: v.string(),
        suggestedCopy: v.string(),
        suggestedHashtags: v.array(v.string()),
        suggestedImagePrompt: v.optional(v.string()),
        aiReasoning: v.string(),
        bestTimeToPost: v.optional(v.string()),
        targetAudience: v.optional(v.string()),
        callToAction: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();
    const postIds: Id<"contentCalendarPosts">[] = [];

    for (const post of args.posts) {
      const postId = await ctx.db.insert("contentCalendarPosts", {
        ...post,
        status: "suggested",
        createdAt: now,
        updatedAt: now,
      });
      postIds.push(postId);
    }

    return { success: true, postIds, count: postIds.length };
  },
});

// Get calendar posts for a month
export const getCalendarPosts = query({
  args: {
    clientId: v.id("clients"),
    month: v.number(), // 1-12
    year: v.number(),
  },
  handler: async (ctx, args) => {
    // Calculate start and end of month
    const startDate = new Date(args.year, args.month - 1, 1);
    const endDate = new Date(args.year, args.month, 0, 23, 59, 59, 999);

    const posts = await ctx.db
      .query("contentCalendarPosts")
      .withIndex("by_client_and_date", (q) =>
        q
          .eq("clientId", args.clientId)
          .gte("scheduledDate", startDate.getTime())
      )
      .collect();

    return posts
      .filter((p) => p.scheduledDate <= endDate.getTime())
      .sort((a, b) => a.scheduledDate - b.scheduledDate);
  },
});

// Get calendar posts by date range
export const getPostsByDateRange = query({
  args: {
    clientId: v.id("clients"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("contentCalendarPosts")
      .withIndex("by_client_and_date", (q) =>
        q.eq("clientId", args.clientId).gte("scheduledDate", args.startDate)
      )
      .collect();

    return posts
      .filter((p) => p.scheduledDate <= args.endDate)
      .sort((a, b) => a.scheduledDate - b.scheduledDate);
  },
});

// Get posts by platform
export const getPostsByPlatform = query({
  args: {
    clientId: v.id("clients"),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("blog"),
      v.literal("email")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allPosts = await ctx.db
      .query("contentCalendarPosts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const platformPosts = allPosts
      .filter((p) => p.platform === args.platform)
      .sort((a, b) => a.scheduledDate - b.scheduledDate);

    return args.limit ? platformPosts.slice(0, args.limit) : platformPosts;
  },
});

// Get upcoming posts
export const getUpcomingPosts = query({
  args: {
    clientId: v.id("clients"),
    days: v.number(), // Number of days ahead to look
  },
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();
    const endDate = addDays(now, args.days);

    return await ctx.db
      .query("contentCalendarPosts")
      .withIndex("by_client_and_date", (q) =>
        q.eq("clientId", args.clientId).gte("scheduledDate", now)
      )
      .filter((q) => q.lte(q.field("scheduledDate"), endDate))
      .collect();
  },
});

// Update post status
export const updatePostStatus = mutation({
  args: {
    postId: v.id("contentCalendarPosts"),
    status: v.union(
      v.literal("suggested"),
      v.literal("approved"),
      v.literal("scheduled"),
      v.literal("published")
    ),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    await ctx.db.patch(args.postId, {
      status: args.status,
      updatedAt: getCurrentTimestamp(),
    });

    return args.postId;
  },
});

// Update post content
export const updatePost = mutation({
  args: {
    postId: v.id("contentCalendarPosts"),
    suggestedCopy: v.optional(v.string()),
    suggestedHashtags: v.optional(v.array(v.string())),
    suggestedImagePrompt: v.optional(v.string()),
    imageConceptId: v.optional(v.id("imageConcepts")),
    bestTimeToPost: v.optional(v.string()),
    callToAction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const updates: Partial<Doc<"contentCalendarPosts">> = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.suggestedCopy !== undefined)
      updates.suggestedCopy = args.suggestedCopy.trim();
    if (args.suggestedHashtags !== undefined)
      updates.suggestedHashtags = args.suggestedHashtags;
    if (args.suggestedImagePrompt !== undefined)
      updates.suggestedImagePrompt = args.suggestedImagePrompt?.trim();
    if (args.imageConceptId !== undefined)
      updates.imageConceptId = args.imageConceptId;
    if (args.bestTimeToPost !== undefined)
      updates.bestTimeToPost = args.bestTimeToPost?.trim();
    if (args.callToAction !== undefined)
      updates.callToAction = args.callToAction?.trim();

    await ctx.db.patch(args.postId, updates);
    return args.postId;
  },
});

// Approve post
export const approvePost = mutation({
  args: { postId: v.id("contentCalendarPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    await ctx.db.patch(args.postId, {
      status: "approved",
      updatedAt: getCurrentTimestamp(),
    });

    return args.postId;
  },
});

// Regenerate post with AI (placeholder for AI call)
export const regeneratePost = mutation({
  args: {
    postId: v.id("contentCalendarPosts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Mark for regeneration - actual AI call would happen in API route
    await ctx.db.patch(args.postId, {
      updatedAt: getCurrentTimestamp(),
    });

    return {
      success: true,
      message: "Post marked for regeneration. Call AI API to regenerate content.",
    };
  },
});

// Delete post
export const deletePost = mutation({
  args: { postId: v.id("contentCalendarPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    await ctx.db.delete(args.postId);
    return { success: true };
  },
});

// Update engagement metrics
export const updateEngagement = mutation({
  args: {
    postId: v.id("contentCalendarPosts"),
    engagement: engagementValidator,
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    await ctx.db.patch(args.postId, {
      engagement: args.engagement,
      updatedAt: getCurrentTimestamp(),
    });

    return args.postId;
  },
});

// Get calendar analytics
export const analyzePerformance = query({
  args: {
    clientId: v.id("clients"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let posts = await ctx.db
      .query("contentCalendarPosts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Filter by date range if provided
    if (args.startDate) {
      posts = posts.filter((p) => p.scheduledDate >= args.startDate!);
    }
    if (args.endDate) {
      posts = posts.filter((p) => p.scheduledDate <= args.endDate!);
    }

    // Calculate metrics
    const totalPosts = posts.length;
    const publishedPosts = posts.filter((p) => p.status === "published").length;
    const approvedPosts = posts.filter((p) => p.status === "approved").length;
    const suggestedPosts = posts.filter((p) => p.status === "suggested").length;

    // Platform breakdown
    const platformBreakdown: Record<string, number> = {};
    posts.forEach((p) => {
      platformBreakdown[p.platform] = (platformBreakdown[p.platform] || 0) + 1;
    });

    // Post type breakdown
    const postTypeBreakdown: Record<string, number> = {};
    posts.forEach((p) => {
      postTypeBreakdown[p.postType] = (postTypeBreakdown[p.postType] || 0) + 1;
    });

    // Engagement stats
    const postsWithEngagement = posts.filter((p) => p.engagement);
    const totalEngagement = postsWithEngagement.reduce(
      (acc, p) => ({
        likes: acc.likes + (p.engagement?.likes || 0),
        comments: acc.comments + (p.engagement?.comments || 0),
        shares: acc.shares + (p.engagement?.shares || 0),
      }),
      { likes: 0, comments: 0, shares: 0 }
    );

    const avgEngagement = postsWithEngagement.length
      ? {
          likes: totalEngagement.likes / postsWithEngagement.length,
          comments: totalEngagement.comments / postsWithEngagement.length,
          shares: totalEngagement.shares / postsWithEngagement.length,
        }
      : { likes: 0, comments: 0, shares: 0 };

    // Best performing platform
    const platformEngagement: Record<string, typeof totalEngagement> = {};
    posts.forEach((p) => {
      if (p.engagement) {
        if (!platformEngagement[p.platform]) {
          platformEngagement[p.platform] = { likes: 0, comments: 0, shares: 0 };
        }
        platformEngagement[p.platform].likes += p.engagement.likes;
        platformEngagement[p.platform].comments += p.engagement.comments;
        platformEngagement[p.platform].shares += p.engagement.shares;
      }
    });

    return {
      totalPosts,
      publishedPosts,
      approvedPosts,
      suggestedPosts,
      platformBreakdown,
      postTypeBreakdown,
      totalEngagement,
      avgEngagement,
      platformEngagement,
      hasEngagementData: postsWithEngagement.length > 0,
    };
  },
});

// Get calendar stats
export const getCalendarStats = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("contentCalendarPosts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const now = getCurrentTimestamp();
    const upcomingPosts = posts.filter(
      (p) => p.scheduledDate >= now && p.status !== "published"
    );
    const pastPosts = posts.filter((p) => p.scheduledDate < now);

    return {
      totalPosts: posts.length,
      upcomingPosts: upcomingPosts.length,
      pastPosts: pastPosts.length,
      byStatus: {
        suggested: posts.filter((p) => p.status === "suggested").length,
        approved: posts.filter((p) => p.status === "approved").length,
        scheduled: posts.filter((p) => p.status === "scheduled").length,
        published: posts.filter((p) => p.status === "published").length,
      },
      platforms: [...new Set(posts.map((p) => p.platform))],
      hasActiveCalendar: posts.length > 0,
    };
  },
});

// Get post by ID
export const getPost = query({
  args: { postId: v.id("contentCalendarPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    return post;
  },
});
