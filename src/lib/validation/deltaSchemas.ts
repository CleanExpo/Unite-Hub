/**
 * Delta & Timeline Validation Schemas - Phase 8 Week 21
 *
 * Zod schemas for delta engine and history timeline data structures.
 */

import { z } from "zod";

// ============================================
// Metric Delta Schema
// ============================================

export const MetricDeltaSchema = z.object({
  metric_name: z.string().min(1),
  previous_value: z.number(),
  current_value: z.number(),
  absolute_change: z.number(),
  percentage_change: z.number(),
  trend: z.enum(["UP", "DOWN", "FLAT"]),
  significance: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export type MetricDelta = z.infer<typeof MetricDeltaSchema>;

// ============================================
// Keyword Movement Schema
// ============================================

export const KeywordMovementSchema = z.object({
  keyword: z.string().min(1),
  previous_position: z.number().optional(),
  current_position: z.number().min(1).max(100),
  position_change: z.number(),
  movement_type: z.enum(["NEW", "IMPROVED", "DECLINED", "LOST", "STABLE"]),
  search_volume: z.number().optional(),
});

export type KeywordMovement = z.infer<typeof KeywordMovementSchema>;

// ============================================
// GEO Change Schema
// ============================================

export const GEOChangeSchema = z.object({
  change_type: z.enum([
    "RADIUS_EXPANDED",
    "RADIUS_REDUCED",
    "COVERAGE_IMPROVED",
    "COVERAGE_DECLINED",
    "NEW_GAPS",
    "GAPS_CLOSED",
  ]),
  previous_radius_km: z.number().optional(),
  current_radius_km: z.number(),
  previous_coverage_pct: z.number().min(0).max(100).optional(),
  current_coverage_pct: z.number().min(0).max(100),
  new_gap_suburbs: z.array(z.string()),
  closed_gap_suburbs: z.array(z.string()),
});

export type GEOChange = z.infer<typeof GEOChangeSchema>;

// ============================================
// Competitor Change Schema
// ============================================

export const CompetitorChangeSchema = z.object({
  competitor_domain: z.string().min(1),
  change_type: z.enum(["GAINING", "DECLINING", "STABLE"]),
  previous_overlap_pct: z.number().min(0).max(100).optional(),
  current_overlap_pct: z.number().min(0).max(100),
  previous_rank_avg: z.number().optional(),
  current_rank_avg: z.number(),
});

export type CompetitorChange = z.infer<typeof CompetitorChangeSchema>;

// ============================================
// Delta Result Schema
// ============================================

export const DeltaResultSchema = z.object({
  comparison_id: z.string().min(1),
  previous_audit_id: z.string().uuid(),
  current_audit_id: z.string().uuid(),
  time_span_days: z.number().min(0),
  overall_trend: z.enum(["IMPROVING", "DECLINING", "STABLE"]),
  health_score_delta: MetricDeltaSchema,
  metric_deltas: z.array(MetricDeltaSchema),
  keyword_movements: z.array(KeywordMovementSchema),
  geo_changes: z.array(GEOChangeSchema),
  competitor_changes: z.array(CompetitorChangeSchema),
  top_wins: z.array(z.string()),
  top_losses: z.array(z.string()),
  summary: z.string(),
});

export type DeltaResult = z.infer<typeof DeltaResultSchema>;

// ============================================
// Timeline Entry Schema
// ============================================

export const TimelineEntrySchema = z.object({
  audit_id: z.string().uuid(),
  audit_type: z.enum(["full", "snapshot", "onboarding", "geo"]),
  timestamp: z.string().datetime(),
  health_score: z.number().min(0).max(100),
  overall_trend: z.enum(["IMPROVING", "DECLINING", "STABLE", "INITIAL"]),
  delta_summary: z.object({
    metric_changes: z.number(),
    keywords_improved: z.number(),
    keywords_declined: z.number(),
    keywords_new: z.number(),
    keywords_lost: z.number(),
    top_win: z.string().optional(),
    top_loss: z.string().optional(),
  }).optional(),
  previous_audit_id: z.string().uuid().optional(),
});

export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;

// ============================================
// Timeline View Schema
// ============================================

export const TimelineViewSchema = z.object({
  client_id: z.string().uuid(),
  client_slug: z.string().min(1),
  entries: z.array(TimelineEntrySchema),
  date_range: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  summary: z.object({
    total_audits: z.number().min(0),
    avg_health_score: z.number().min(0).max(100),
    health_score_trend: z.enum(["IMPROVING", "DECLINING", "STABLE"]),
    best_health_score: z.number().min(0).max(100),
    worst_health_score: z.number().min(0).max(100),
    total_keywords_gained: z.number().min(0),
    total_keywords_lost: z.number().min(0),
  }),
});

export type TimelineView = z.infer<typeof TimelineViewSchema>;

// ============================================
// Timeline Filters Schema
// ============================================

export const TimelineFiltersSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  audit_types: z.array(z.enum(["full", "snapshot", "onboarding", "geo"])).optional(),
  limit: z.number().min(1).max(100).optional(),
  include_deltas: z.boolean().optional(),
});

export type TimelineFilters = z.infer<typeof TimelineFiltersSchema>;

// ============================================
// API Request/Response Schemas
// ============================================

export const GetDeltaRequestSchema = z.object({
  auditId: z.string().uuid(),
});

export const GetHistoryRequestSchema = z.object({
  clientId: z.string().uuid(),
  withDelta: z.boolean().optional().default(false),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  auditTypes: z.array(z.enum(["full", "snapshot", "onboarding", "geo"])).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
});

export const DeltaSummarySchema = z.object({
  overall_trend: z.enum(["IMPROVING", "DECLINING", "STABLE"]),
  health_score_delta: z.number(),
  keywords_improved: z.number(),
  keywords_declined: z.number(),
  keywords_new: z.number(),
  keywords_lost: z.number(),
  top_wins: z.array(z.string()).max(5),
  top_losses: z.array(z.string()).max(5),
});

export type DeltaSummary = z.infer<typeof DeltaSummarySchema>;

// ============================================
// Audit Snapshot Schema (for delta computation)
// ============================================

export const AuditSnapshotSchema = z.object({
  audit_id: z.string().uuid(),
  client_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  health_score: z.number().min(0).max(100),
  data_sources: z.object({
    gsc: z.object({
      queries: z.array(z.object({
        query: z.string(),
        clicks: z.number(),
        impressions: z.number(),
        ctr: z.number(),
        position: z.number(),
      })).optional(),
      pages: z.array(z.object({
        page: z.string(),
        clicks: z.number(),
        impressions: z.number(),
      })).optional(),
      totalClicks: z.number(),
      totalImpressions: z.number(),
      averageCTR: z.number(),
      averagePosition: z.number(),
    }).optional(),
    bing: z.object({
      indexedPages: z.number(),
      crawlErrors: z.number(),
      sitemapStatus: z.string(),
    }).optional(),
    brave: z.object({
      rankings: z.array(z.object({
        keyword: z.string(),
        position: z.number(),
        url: z.string(),
      })),
      visibility: z.number(),
    }).optional(),
    dataForSEO: z.object({
      rankedKeywords: z.array(z.object({
        keyword: z.string(),
        position: z.number(),
        search_volume: z.number(),
        competition: z.number(),
      })),
      competitors: z.array(z.object({
        domain: z.string(),
        keywords_overlap: z.number(),
        rank_average: z.number(),
      })),
      questions: z.array(z.object({
        question: z.string(),
        search_volume: z.number(),
      })),
      relatedKeywords: z.array(z.object({
        keyword: z.string(),
        search_volume: z.number(),
      })),
    }).optional(),
    geo: z.object({
      centerLat: z.number(),
      centerLng: z.number(),
      radiusKm: z.number(),
      targetSuburbs: z.array(z.string()),
      gapSuburbs: z.array(z.string()),
      coveragePercentage: z.number().min(0).max(100),
    }).optional(),
  }),
});

export type AuditSnapshot = z.infer<typeof AuditSnapshotSchema>;
