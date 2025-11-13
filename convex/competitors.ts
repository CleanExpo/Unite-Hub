import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Unite-Hub Competitor Analysis Functions
 *
 * Provides comprehensive competitor tracking and AI-powered analysis.
 * Professional tier only feature.
 */

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all competitors for a client
 */
export const getCompetitors = query({
  args: {
    clientId: v.id("clients"),
    category: v.optional(
      v.union(v.literal("direct"), v.literal("indirect"), v.literal("potential"))
    ),
  },
  handler: async (ctx, args) => {
    const competitors = await ctx.db
      .query("competitors")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    if (args.category) {
      return competitors.filter((c) => c.category === args.category);
    }

    return competitors.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single competitor by ID
 */
export const getCompetitor = query({
  args: { competitorId: v.id("competitors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.competitorId);
  },
});

/**
 * Get competitor count for a client
 */
export const getCompetitorCount = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const competitors = await ctx.db
      .query("competitors")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return {
      total: competitors.length,
      direct: competitors.filter((c) => c.category === "direct").length,
      indirect: competitors.filter((c) => c.category === "indirect").length,
      potential: competitors.filter((c) => c.category === "potential").length,
    };
  },
});

/**
 * Get all competitor analyses for a client
 */
export const getAnalyses = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("competitorAnalyses")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc");

    const analyses = args.limit
      ? await query.take(args.limit)
      : await query.collect();

    return analyses;
  },
});

/**
 * Get the latest competitor analysis
 */
export const getLatestAnalysis = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query("competitorAnalyses")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(1);

    return analyses[0] || null;
  },
});

/**
 * Get a specific analysis by ID
 */
export const getAnalysis = query({
  args: { analysisId: v.id("competitorAnalyses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.analysisId);
  },
});

/**
 * Compare multiple competitors side-by-side
 */
export const compareCompetitors = query({
  args: { competitorIds: v.array(v.id("competitors")) },
  handler: async (ctx, args) => {
    const competitors = await Promise.all(
      args.competitorIds.map((id) => ctx.db.get(id))
    );

    // Filter out nulls
    const validCompetitors = competitors.filter(
      (c) => c !== null
    ) as Array<any>;

    return {
      competitors: validCompetitors,
      comparison: {
        categories: validCompetitors.map((c) => c.category),
        targetAudiences: validCompetitors.flatMap((c) => c.targetAudience),
        channels: validCompetitors.flatMap((c) => c.marketingChannels),
        pricingModels: validCompetitors
          .filter((c) => c.pricing)
          .map((c) => c.pricing?.model),
      },
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Add a new competitor
 */
export const addCompetitor = mutation({
  args: {
    clientId: v.id("clients"),
    competitorName: v.string(),
    website: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("direct"),
      v.literal("indirect"),
      v.literal("potential")
    ),
    strengths: v.optional(v.array(v.string())),
    weaknesses: v.optional(v.array(v.string())),
    pricing: v.optional(
      v.object({
        model: v.string(),
        range: v.string(),
      })
    ),
    targetAudience: v.optional(v.array(v.string())),
    marketingChannels: v.optional(v.array(v.string())),
    contentStrategy: v.optional(v.string()),
    socialPresence: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        tiktok: v.optional(v.string()),
        twitter: v.optional(v.string()),
      })
    ),
    logoUrl: v.optional(v.string()),
    screenshots: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const competitorId = await ctx.db.insert("competitors", {
      clientId: args.clientId,
      competitorName: args.competitorName,
      website: args.website,
      description: args.description,
      category: args.category,
      strengths: args.strengths || [],
      weaknesses: args.weaknesses || [],
      pricing: args.pricing,
      targetAudience: args.targetAudience || [],
      marketingChannels: args.marketingChannels || [],
      contentStrategy: args.contentStrategy,
      socialPresence: args.socialPresence || {},
      logoUrl: args.logoUrl,
      screenshots: args.screenshots || [],
      lastAnalyzed: now,
      createdAt: now,
      updatedAt: now,
    });

    return competitorId;
  },
});

/**
 * Update a competitor
 */
export const updateCompetitor = mutation({
  args: {
    competitorId: v.id("competitors"),
    updates: v.object({
      competitorName: v.optional(v.string()),
      website: v.optional(v.string()),
      description: v.optional(v.string()),
      category: v.optional(
        v.union(
          v.literal("direct"),
          v.literal("indirect"),
          v.literal("potential")
        )
      ),
      strengths: v.optional(v.array(v.string())),
      weaknesses: v.optional(v.array(v.string())),
      pricing: v.optional(
        v.object({
          model: v.string(),
          range: v.string(),
        })
      ),
      targetAudience: v.optional(v.array(v.string())),
      marketingChannels: v.optional(v.array(v.string())),
      contentStrategy: v.optional(v.string()),
      socialPresence: v.optional(
        v.object({
          facebook: v.optional(v.string()),
          instagram: v.optional(v.string()),
          linkedin: v.optional(v.string()),
          tiktok: v.optional(v.string()),
          twitter: v.optional(v.string()),
        })
      ),
      logoUrl: v.optional(v.string()),
      screenshots: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.competitorId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return args.competitorId;
  },
});

/**
 * Delete a competitor
 */
export const deleteCompetitor = mutation({
  args: { competitorId: v.id("competitors") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.competitorId);
    return { success: true };
  },
});

/**
 * Create a competitor analysis
 * This is typically called by the AI analysis API route
 */
export const createAnalysis = mutation({
  args: {
    clientId: v.id("clients"),
    competitorsAnalyzed: v.array(v.id("competitors")),
    marketGaps: v.array(
      v.object({
        gap: v.string(),
        opportunity: v.string(),
        priority: v.union(
          v.literal("high"),
          v.literal("medium"),
          v.literal("low")
        ),
      })
    ),
    differentiationOpportunities: v.array(
      v.object({
        area: v.string(),
        recommendation: v.string(),
        effort: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        impact: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      })
    ),
    pricingAnalysis: v.object({
      marketAverage: v.string(),
      yourPosition: v.string(),
      recommendation: v.string(),
    }),
    swotAnalysis: v.object({
      strengths: v.array(v.string()),
      weaknesses: v.array(v.string()),
      opportunities: v.array(v.string()),
      threats: v.array(v.string()),
    }),
    contentGaps: v.array(
      v.object({
        topic: v.string(),
        competitorCoverage: v.string(),
        yourCoverage: v.string(),
        recommendation: v.string(),
      })
    ),
    actionableInsights: v.array(
      v.object({
        insight: v.string(),
        action: v.string(),
        priority: v.union(
          v.literal("high"),
          v.literal("medium"),
          v.literal("low")
        ),
      })
    ),
    aiSummary: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const analysisId = await ctx.db.insert("competitorAnalyses", {
      clientId: args.clientId,
      analysisDate: now,
      competitorsAnalyzed: args.competitorsAnalyzed,
      marketGaps: args.marketGaps,
      differentiationOpportunities: args.differentiationOpportunities,
      pricingAnalysis: args.pricingAnalysis,
      swotAnalysis: args.swotAnalysis,
      contentGaps: args.contentGaps,
      actionableInsights: args.actionableInsights,
      aiSummary: args.aiSummary,
      createdAt: now,
    });

    // Update lastAnalyzed timestamp for all competitors
    await Promise.all(
      args.competitorsAnalyzed.map((competitorId) =>
        ctx.db.patch(competitorId, { lastAnalyzed: now })
      )
    );

    return analysisId;
  },
});

/**
 * Update competitor's last analyzed timestamp
 */
export const updateLastAnalyzed = mutation({
  args: { competitorId: v.id("competitors") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.competitorId, {
      lastAnalyzed: Date.now(),
    });
  },
});

/**
 * Bulk add competitors from CSV/import
 */
export const bulkAddCompetitors = mutation({
  args: {
    clientId: v.id("clients"),
    competitors: v.array(
      v.object({
        competitorName: v.string(),
        website: v.string(),
        description: v.string(),
        category: v.union(
          v.literal("direct"),
          v.literal("indirect"),
          v.literal("potential")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const competitorIds = [];

    for (const competitor of args.competitors) {
      const id = await ctx.db.insert("competitors", {
        clientId: args.clientId,
        competitorName: competitor.competitorName,
        website: competitor.website,
        description: competitor.description,
        category: competitor.category,
        strengths: [],
        weaknesses: [],
        targetAudience: [],
        marketingChannels: [],
        socialPresence: {},
        screenshots: [],
        lastAnalyzed: now,
        createdAt: now,
        updatedAt: now,
      });
      competitorIds.push(id);
    }

    return competitorIds;
  },
});
