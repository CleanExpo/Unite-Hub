/**
 * Strategy & Dashboard Validation Schemas - Phase 8 Week 24
 *
 * Zod schemas for strategy signoff and dashboard data.
 */

import { z } from "zod";

// =============================================================
// Strategy Schemas
// =============================================================

export const SignoffDecisionSchema = z.enum(["APPROVED", "REJECTED", "MODIFIED"]);
export type SignoffDecision = z.infer<typeof SignoffDecisionSchema>;

export const RecommendationCategorySchema = z.enum([
  "technical",
  "content",
  "keywords",
  "backlinks",
  "geo",
  "competitors",
]);

export const PrioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const EffortLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const StrategyRecommendationSchema = z.object({
  recommendation_id: z.string().uuid(),
  client_id: z.string().uuid(),
  audit_id: z.string().uuid(),
  category: RecommendationCategorySchema,
  priority: PrioritySchema,
  title: z.string().min(1),
  description: z.string(),
  expected_impact: z.string(),
  effort_level: EffortLevelSchema,
  actions: z.array(z.string()),
  metrics_to_track: z.array(z.string()),
  created_at: z.string().datetime(),
});

export type StrategyRecommendation = z.infer<typeof StrategyRecommendationSchema>;

export const SignoffRecordSchema = z.object({
  signoff_id: z.string().uuid(),
  client_id: z.string().uuid(),
  audit_id: z.string().uuid(),
  recommendation_id: z.string().uuid().optional(),
  decision: SignoffDecisionSchema,
  notes: z.string(),
  decided_by: z.string().uuid(),
  decided_at: z.string().datetime(),
  action_json: z.record(z.any()),
});

export type SignoffRecord = z.infer<typeof SignoffRecordSchema>;

export const StrategySnapshotSchema = z.object({
  client_id: z.string().uuid(),
  audit_id: z.string().uuid(),
  generated_at: z.string().datetime(),
  health_score: z.number().min(0).max(100),
  previous_health_score: z.number().min(0).max(100),
  overall_trend: z.enum(["IMPROVING", "DECLINING", "STABLE"]),
  top_wins: z.array(z.string()),
  top_losses: z.array(z.string()),
  recommendations: z.array(StrategyRecommendationSchema),
  signoff_status: z.enum(["PENDING", "APPROVED", "PARTIAL", "REJECTED"]),
});

export type StrategySnapshot = z.infer<typeof StrategySnapshotSchema>;

// =============================================================
// Dashboard Chart Schemas
// =============================================================

export const HealthDataPointSchema = z.object({
  date: z.string().datetime(),
  health_score: z.number().min(0).max(100),
  audit_type: z.string().optional(),
});

export type HealthDataPoint = z.infer<typeof HealthDataPointSchema>;

export const KeywordMovementDataSchema = z.object({
  date: z.string().datetime(),
  improved: z.number().min(0),
  declined: z.number().min(0),
  new_keywords: z.number().min(0),
  lost: z.number().min(0),
});

export type KeywordMovementData = z.infer<typeof KeywordMovementDataSchema>;

export const BacklinkTrendDataSchema = z.object({
  date: z.string().datetime(),
  total_backlinks: z.number().min(0),
  referring_domains: z.number().min(0),
  new_backlinks: z.number().min(0),
  lost_backlinks: z.number().min(0),
});

export type BacklinkTrendData = z.infer<typeof BacklinkTrendDataSchema>;

export const CompetitorComparisonDataSchema = z.object({
  domain: z.string(),
  health_score: z.number().min(0).max(100),
  backlinks: z.number().min(0),
  keywords: z.number().min(0),
  visibility: z.number().min(0).max(100),
  is_self: z.boolean().optional(),
});

export type CompetitorComparisonData = z.infer<typeof CompetitorComparisonDataSchema>;

// =============================================================
// API Request/Response Schemas
// =============================================================

export const SubmitSignoffRequestSchema = z.object({
  client_id: z.string().uuid(),
  audit_id: z.string().uuid(),
  recommendation_id: z.string().uuid().nullable(),
  decision: SignoffDecisionSchema,
  notes: z.string().default(""),
  actions: z.record(z.any()).optional(),
});

export const GetDashboardDataRequestSchema = z.object({
  client_id: z.string().uuid(),
  date_range: z.enum(["7d", "30d", "90d", "180d", "365d"]).default("30d"),
  include_competitors: z.boolean().optional().default(false),
});

export const DashboardDataResponseSchema = z.object({
  client_id: z.string().uuid(),
  date_range: z.string(),
  health_trend: z.array(HealthDataPointSchema),
  keyword_movements: z.array(KeywordMovementDataSchema),
  backlink_trend: z.array(BacklinkTrendDataSchema),
  current_snapshot: StrategySnapshotSchema.optional(),
  competitors: z.array(CompetitorComparisonDataSchema).optional(),
});

export type DashboardDataResponse = z.infer<typeof DashboardDataResponseSchema>;
