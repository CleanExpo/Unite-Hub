/**
 * Backlink & Entity Validation Schemas - Phase 8 Week 22
 *
 * Zod schemas for backlink and entity intelligence data structures.
 */

import { z } from "zod";

// =============================================================
// Backlink Schemas
// =============================================================

export const BacklinkItemSchema = z.object({
  source_url: z.string(),
  source_domain: z.string(),
  target_url: z.string(),
  anchor_text: z.string(),
  link_type: z.enum(["dofollow", "nofollow", "unknown"]),
  first_seen: z.string(),
  last_seen: z.string(),
  rank: z.number(),
  page_from_rank: z.number(),
  domain_from_rank: z.number(),
  is_new: z.boolean(),
  is_lost: z.boolean(),
  is_broken: z.boolean(),
  new_backlinks: z.number().optional(),
  lost_backlinks: z.number().optional(),
});

export type BacklinkItem = z.infer<typeof BacklinkItemSchema>;

export const ReferringDomainSchema = z.object({
  domain: z.string(),
  rank: z.number(),
  backlinks: z.number(),
  first_seen: z.string(),
  lost_date: z.string().nullable(),
  dofollow_count: z.number(),
  nofollow_count: z.number(),
  redirect_count: z.number(),
  country: z.string(),
  spam_score: z.number().min(0).max(100),
  broken_backlinks: z.number(),
  broken_pages: z.number(),
  referring_pages: z.number(),
});

export type ReferringDomain = z.infer<typeof ReferringDomainSchema>;

export const AnchorTextItemSchema = z.object({
  anchor: z.string(),
  backlinks: z.number(),
  referring_domains: z.number(),
  first_seen: z.string(),
  last_seen: z.string(),
  dofollow: z.number(),
  nofollow: z.number(),
});

export type AnchorTextItem = z.infer<typeof AnchorTextItemSchema>;

export const BacklinkHistoryItemSchema = z.object({
  date: z.string(),
  rank: z.number(),
  backlinks: z.number(),
  referring_domains: z.number(),
  referring_main_domains: z.number(),
  referring_ips: z.number(),
  referring_subnets: z.number(),
});

export type BacklinkHistoryItem = z.infer<typeof BacklinkHistoryItemSchema>;

export const BacklinkProfileSchema = z.object({
  domain: z.string(),
  snapshot_date: z.string().datetime(),

  // Core metrics
  total_backlinks: z.number().min(0),
  referring_domains: z.number().min(0),
  referring_ips: z.number().min(0),
  dofollow_ratio: z.number().min(0).max(100),

  // Quality metrics
  backlink_score: z.number().min(0).max(100),
  authority_score: z.number().min(0).max(100),
  toxic_score: z.number().min(0).max(100),
  spam_score: z.number().min(0).max(100),

  // Top anchors
  top_anchors: z.array(AnchorTextItemSchema),
  anchor_diversity_score: z.number().min(0).max(100),

  // New/Lost tracking
  new_backlinks_30d: z.number().min(0),
  lost_backlinks_30d: z.number().min(0),
  net_change_30d: z.number(),
  velocity_trend: z.enum(["GROWING", "STABLE", "DECLINING"]),

  // Top referring domains
  top_referring_domains: z.array(ReferringDomainSchema),

  // History
  history_30d: z.array(BacklinkHistoryItemSchema),

  // Link type breakdown
  dofollow_count: z.number().min(0),
  nofollow_count: z.number().min(0),
  ugc_count: z.number().min(0),
  sponsored_count: z.number().min(0),

  // Country breakdown
  countries: z.array(
    z.object({
      country: z.string(),
      count: z.number().min(0),
    })
  ),
});

export type BacklinkProfile = z.infer<typeof BacklinkProfileSchema>;

export const ToxicBacklinkReportSchema = z.object({
  toxic_domains: z.array(
    z.object({
      domain: z.string(),
      spam_score: z.number().min(0).max(100),
      backlinks: z.number().min(0),
      reason: z.string(),
    })
  ),
  total_toxic_backlinks: z.number().min(0),
  toxic_percentage: z.number().min(0).max(100),
  recommendation: z.string(),
});

export type ToxicBacklinkReport = z.infer<typeof ToxicBacklinkReportSchema>;

// =============================================================
// Entity Schemas
// =============================================================

export const ContentEntitySchema = z.object({
  name: z.string().min(1),
  entity_type: z.string(),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  sentiment_score: z.number(),
  salience: z.number().min(0).max(1),
  mentions: z.number().min(1),
});

export type ContentEntity = z.infer<typeof ContentEntitySchema>;

export const EntityWithScoreSchema = ContentEntitySchema.extend({
  relevance_score: z.number().min(0).max(100),
  topical_fit: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export type EntityWithScore = z.infer<typeof EntityWithScoreSchema>;

export const DomainCategorySchema = z.object({
  category: z.string(),
  confidence: z.number().min(0).max(1),
});

export type DomainCategory = z.infer<typeof DomainCategorySchema>;

export const KeywordWithIntentSchema = z.object({
  keyword: z.string(),
  position: z.number().min(0),
  search_volume: z.number().min(0),
  competition: z.number().min(0).max(1),
  cpc: z.number().min(0),
  search_intent: z.enum(["informational", "navigational", "commercial", "transactional"]),
  is_featured_snippet: z.boolean(),
  is_knowledge_panel: z.boolean(),
  etv: z.number().min(0),
});

export type KeywordWithIntent = z.infer<typeof KeywordWithIntentSchema>;

export const EntityClusterSchema = z.object({
  entity_type: z.string(),
  entities: z.array(z.string()),
  count: z.number().min(0),
  avg_salience: z.number().min(0).max(1),
});

export type EntityCluster = z.infer<typeof EntityClusterSchema>;

export const EntityProfileSchema = z.object({
  domain: z.string(),
  snapshot_date: z.string().datetime(),

  // Entities
  entities: z.array(EntityWithScoreSchema),
  entity_count: z.number().min(0),
  unique_entity_types: z.array(z.string()),

  // Categories
  categories: z.array(DomainCategorySchema),
  primary_category: z.string(),

  // Scores
  topical_match_score: z.number().min(0).max(100),
  entity_alignment_score: z.number().min(0).max(100),

  // Intent distribution
  keyword_intents: z.object({
    informational: z.number().min(0).max(100),
    navigational: z.number().min(0).max(100),
    commercial: z.number().min(0).max(100),
    transactional: z.number().min(0).max(100),
  }),

  // Top keywords
  top_informational_keywords: z.array(KeywordWithIntentSchema),
  top_transactional_keywords: z.array(KeywordWithIntentSchema),

  // Clusters
  entity_clusters: z.array(EntityClusterSchema),

  // Sentiment
  sentiment_distribution: z.object({
    positive: z.number().min(0).max(100),
    neutral: z.number().min(0).max(100),
    negative: z.number().min(0).max(100),
  }),

  // SERP features
  serp_features: z.object({
    featured_snippets: z.number().min(0),
    knowledge_panels: z.number().min(0),
    total_keywords: z.number().min(0),
  }),
});

export type EntityProfile = z.infer<typeof EntityProfileSchema>;

export const TopicalGapAnalysisSchema = z.object({
  domain: z.string(),
  target_topic: z.string(),
  current_alignment: z.number().min(0).max(100),
  gap_entities: z.array(z.string()),
  gap_keywords: z.array(z.string()),
  recommended_content: z.array(z.string()),
  improvement_potential: z.number().min(0).max(100),
});

export type TopicalGapAnalysis = z.infer<typeof TopicalGapAnalysisSchema>;

// =============================================================
// API Request/Response Schemas
// =============================================================

export const GetBacklinkProfileRequestSchema = z.object({
  domain: z.string().min(1),
  includeHistory: z.boolean().optional().default(true),
  includeToxicAnalysis: z.boolean().optional().default(false),
});

export const GetEntityProfileRequestSchema = z.object({
  domain: z.string().min(1),
  urls: z.array(z.string().url()).optional(),
  analyzeIntent: z.boolean().optional().default(true),
});

export const CompareDomainsRequestSchema = z.object({
  domain1: z.string().min(1),
  domain2: z.string().min(1),
  analysisType: z.enum(["backlinks", "entities", "both"]).default("both"),
});

export const TopicalGapRequestSchema = z.object({
  domain: z.string().min(1),
  targetTopic: z.string().min(1),
});
