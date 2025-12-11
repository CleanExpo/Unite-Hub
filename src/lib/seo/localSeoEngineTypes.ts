/**
 * Synthex 2026 Local SEO Engine - TypeScript types
 *
 * These types mirror the core tables created in
 * supabase/migrations/562_synthex_2026_local_seo_engine.sql
 * and are used by services/UI before regenerating full
 * supabase Database typings.
 */

// ---------------------------------------------------------------------------
// Core profile
// ---------------------------------------------------------------------------

export interface LocalSeoProfile {
  id: string;
  workspace_id: string;

  business_name: string;
  primary_location: Record<string, unknown>; // { city, state, country, lat, lng, formatted_address }
  service_areas: Record<string, unknown>[] | null;
  business_category: string;
  target_keywords: Record<string, unknown>[] | null;

  gbp_profile_id: string | null;
  gbp_access_token_encrypted: string | null;
  gbp_refresh_token_encrypted: string | null;
  gbp_last_sync: string | null; // timestamptz

  ai_sge_tracking_enabled: boolean;
  schema_auto_generation: boolean;
  citation_syndication_enabled: boolean;
  gbp_automation_enabled: boolean;

  abn: string | null;
  acn: string | null;
  australian_business_category: string | null;

  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// AI Search Visibility
// ---------------------------------------------------------------------------

export type AiPlatform =
  | "google_sge"
  | "bing_copilot"
  | "perplexity"
  | "claude"
  | string; // allow extension

export type AiVisibilityStatus = "cited" | "mentioned" | "featured" | "not_found" | string;

export interface AiSearchVisibilityRecord {
  id: string;
  workspace_id: string;
  seo_profile_id: string;

  query: string;
  ai_platform: AiPlatform;
  search_location: Record<string, unknown> | null;

  visibility_status: AiVisibilityStatus;
  position: number | null;
  citation_text: string | null;
  citation_context: string | null;
  confidence_score: number | null;

  screenshot_url: string | null;
  result_url: string | null;
  competitor_mentions: Record<string, unknown>[] | null;

  query_intent: string | null;
  search_volume: number | null;
  difficulty_score: number | null;

  checked_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// GBP Management Queue
// ---------------------------------------------------------------------------

export type GbpActionType =
  | "post_update"
  | "photo_upload"
  | "qna_response"
  | "review_response"
  | "hours_update"
  | string;

export type GbpQueueStatus = "pending" | "processing" | "completed" | "failed" | string;

export interface GbpQueueItem {
  id: string;
  workspace_id: string;
  seo_profile_id: string;

  action_type: GbpActionType;
  action_data: Record<string, unknown>;
  priority: number;

  scheduled_for: string | null;
  retry_count: number;
  max_retries: number;

  status: GbpQueueStatus;
  error_message: string | null;
  processed_at: string | null;

  created_at: string;
}

// ---------------------------------------------------------------------------
// Schema Markup
// ---------------------------------------------------------------------------

export interface SchemaMarkupRecord {
  id: string;
  workspace_id: string;
  seo_profile_id: string;

  page_url: string;
  page_title: string | null;
  schema_type: string;
  generated_markup: Record<string, unknown>;

  validation_status: string;
  validation_errors: Record<string, unknown>;
  validation_warnings: Record<string, unknown>;
  google_rich_results_eligible: boolean;

  auto_applied: boolean;
  manually_approved: boolean;
  applied_at: string | null;

  rich_results_impressions: number;
  rich_results_clicks: number;
  last_performance_update: string | null;

  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// LLM Citation Syndication
// ---------------------------------------------------------------------------

export interface LlmCitationSyndicationRecord {
  id: string;
  workspace_id: string;
  seo_profile_id: string;

  content_type: string;
  original_content_url: string;
  syndicated_content: Record<string, unknown>;
  target_keywords: Record<string, unknown>[] | null;

  syndication_targets: Record<string, unknown>[] | null;
  syndication_status: string;
  published_urls: Record<string, unknown>[] | null;

  citation_count: number;
  backlink_count: number;
  ai_mentions_count: number;
  last_citation_check: string | null;

  brand_mention_increase: Record<string, unknown> | null;
  organic_traffic_impact: Record<string, unknown> | null;
  local_ranking_improvements: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Service-Level Content Strategy
// ---------------------------------------------------------------------------

export interface ServiceContentStrategyRecord {
  id: string;
  workspace_id: string;
  seo_profile_id: string;

  service_name: string;
  service_category: string | null;
  target_location: Record<string, unknown> | null;

  primary_keywords: Record<string, unknown>[] | null;
  content_topics: Record<string, unknown>[] | null;
  faq_questions: Record<string, unknown>[] | null;
  competitor_content_gaps: Record<string, unknown>[] | null;

  content_outline: Record<string, unknown> | null;
  generated_content: string | null;
  content_status: string;

  content_score: number | null;
  seo_optimization_score: number | null;
  local_relevance_score: number | null;

  target_url: string | null;
  published_at: string | null;
  last_updated: string | null;

  created_at: string;
}

// ---------------------------------------------------------------------------
// Media Asset Optimization
// ---------------------------------------------------------------------------

export interface MediaAssetOptimizationRecord {
  id: string;
  workspace_id: string;
  seo_profile_id: string;

  original_filename: string;
  original_file_size: number | null;
  original_dimensions: Record<string, unknown> | null;
  file_type: string;
  upload_source: string | null;

  optimized_filename: string | null;
  optimized_file_size: number | null;
  optimized_dimensions: Record<string, unknown> | null;
  optimization_applied: Record<string, unknown>[] | null;

  alt_text: string | null;
  caption: string | null;
  location_metadata: Record<string, unknown> | null;
  keywords: Record<string, unknown>[] | null;

  used_in_gbp: boolean;
  used_in_website: boolean;
  used_in_ads: boolean;

  original_url: string | null;
  optimized_url: string | null;
  thumbnail_url: string | null;

  impressions: number;
  clicks: number;
  engagement_rate: number | null;

  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Automation Rules
// ---------------------------------------------------------------------------

export interface LocalSeoAutomationRuleRecord {
  id: string;
  workspace_id: string;
  seo_profile_id: string;

  rule_name: string;
  rule_type: string;
  trigger_conditions: Record<string, unknown>;
  action_configuration: Record<string, unknown>;

  is_active: boolean;
  execution_frequency: string | null;
  max_executions_per_period: number;

  total_executions: number;
  successful_executions: number;
  last_execution: string | null;
  average_execution_time: number | null;

  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Australian Templates
// ---------------------------------------------------------------------------

export interface AustralianSeoTemplateRecord {
  id: string;
  template_name: string;
  template_category: string;
  industry_vertical: string | null;
  template_data: Record<string, unknown>;

  australian_compliance: Record<string, unknown> | null;
  local_references: Record<string, unknown>[] | null;
  pricing_templates: Record<string, unknown> | null;

  usage_count: number;
  success_rate: number;
  last_updated: string;

  created_at: string;
}
