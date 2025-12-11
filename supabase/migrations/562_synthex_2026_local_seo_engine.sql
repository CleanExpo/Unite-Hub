-- 562_synthex_2026_local_seo_engine.sql
-- Phase 1: Synthex 2026 Local SEO Engine - Core Tables
-- Based on SYNTHEX_2026_LOCAL_SEO_IMPLEMENTATION_PLAN.md
-- NOTE: RLS policies will be added/centralised in existing security migrations.

-- ============================================================================
-- 1. Main Local SEO Profile Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_local_seo_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  business_name TEXT NOT NULL,
  primary_location JSONB NOT NULL, -- { city, state, country, lat, lng, formatted_address }
  service_areas JSONB[] DEFAULT '{}'::jsonb[], -- Multiple service areas
  business_category TEXT NOT NULL, -- Primary Google category
  target_keywords JSONB[] DEFAULT '{}'::jsonb[], -- Primary local keywords

  -- Google Business Profile Integration
  gbp_profile_id TEXT,
  gbp_access_token_encrypted TEXT,
  gbp_refresh_token_encrypted TEXT,
  gbp_last_sync TIMESTAMPTZ,

  -- 2026 Feature Toggles
  ai_sge_tracking_enabled BOOLEAN DEFAULT TRUE,
  schema_auto_generation BOOLEAN DEFAULT TRUE,
  citation_syndication_enabled BOOLEAN DEFAULT TRUE,
  gbp_automation_enabled BOOLEAN DEFAULT TRUE,

  -- Australian Specific
  abn TEXT, -- Australian Business Number
  acn TEXT, -- Australian Company Number
  australian_business_category TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_synthex_local_seo_profiles_workspace
  ON synthex_local_seo_profiles(workspace_id);

CREATE INDEX IF NOT EXISTS idx_synthex_local_seo_profiles_business_name
  ON synthex_local_seo_profiles(business_name);

CREATE INDEX IF NOT EXISTS idx_synthex_local_seo_profiles_category
  ON synthex_local_seo_profiles(business_category);

COMMENT ON TABLE synthex_local_seo_profiles IS '2026 Local SEO: Core profile for each business/workspace (service areas, GBP, toggles).';


-- ============================================================================
-- 2. AI Search Visibility Tracking (Google SGE, Bing Copilot, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_search_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  seo_profile_id UUID NOT NULL REFERENCES synthex_local_seo_profiles(id) ON DELETE CASCADE,

  -- Query & Platform Details
  query TEXT NOT NULL,
  ai_platform TEXT NOT NULL, -- 'google_sge', 'bing_copilot', 'perplexity', 'claude'
  search_location JSONB, -- { city, state, country }

  -- Visibility Results
  visibility_status TEXT NOT NULL, -- 'cited', 'mentioned', 'featured', 'not_found'
  position INTEGER,
  citation_text TEXT,
  citation_context TEXT, -- Surrounding context
  confidence_score INTEGER, -- 0-100 confidence in citation quality

  -- Evidence & Tracking
  screenshot_url TEXT,
  result_url TEXT, -- URL of the AI result page
  competitor_mentions JSONB[] DEFAULT '{}'::jsonb[], -- Other businesses mentioned

  -- Analysis
  query_intent TEXT, -- 'informational', 'commercial', 'navigational', 'local'
  search_volume INTEGER, -- From SEMrush/DataForSEO
  difficulty_score INTEGER, -- 0-100 ranking difficulty

  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_search_visibility_workspace
  ON ai_search_visibility(workspace_id);

CREATE INDEX IF NOT EXISTS idx_ai_search_visibility_profile
  ON ai_search_visibility(seo_profile_id);

CREATE INDEX IF NOT EXISTS idx_ai_search_visibility_platform
  ON ai_search_visibility(ai_platform);

CREATE INDEX IF NOT EXISTS idx_ai_search_visibility_status
  ON ai_search_visibility(visibility_status);

COMMENT ON TABLE ai_search_visibility IS '2026 Local SEO: Tracks AI search (SGE, Copilot, etc.) visibility and citations by query.';


-- ============================================================================
-- 3. Google Business Profile Management Queue
-- ============================================================================

CREATE TABLE IF NOT EXISTS gbp_management_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  seo_profile_id UUID NOT NULL REFERENCES synthex_local_seo_profiles(id) ON DELETE CASCADE,

  -- Action Details
  action_type TEXT NOT NULL, -- 'post_update', 'photo_upload', 'qna_response', 'review_response', 'hours_update'
  action_data JSONB NOT NULL, -- Specific action payload
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),

  -- Scheduling
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gbp_management_queue_workspace
  ON gbp_management_queue(workspace_id);

CREATE INDEX IF NOT EXISTS idx_gbp_management_queue_profile
  ON gbp_management_queue(seo_profile_id);

CREATE INDEX IF NOT EXISTS idx_gbp_management_queue_status
  ON gbp_management_queue(status, priority, scheduled_for);

COMMENT ON TABLE gbp_management_queue IS '2026 Local SEO: Queue of Google Business Profile (GBP) management actions.';


-- ============================================================================
-- 4. Schema Markup Generation & Validation
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_markup_generated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  seo_profile_id UUID NOT NULL REFERENCES synthex_local_seo_profiles(id) ON DELETE CASCADE,

  -- Page & Schema Details
  page_url TEXT NOT NULL,
  page_title TEXT,
  schema_type TEXT NOT NULL, -- 'LocalBusiness', 'FAQ', 'HowTo', 'Service', 'Product'
  generated_markup JSONB NOT NULL, -- The actual JSON-LD

  -- Validation & Quality
  validation_status TEXT NOT NULL DEFAULT 'pending', -- 'valid', 'errors', 'warnings', 'failed'
  validation_errors JSONB DEFAULT '[]'::jsonb,
  validation_warnings JSONB DEFAULT '[]'::jsonb,
  google_rich_results_eligible BOOLEAN DEFAULT FALSE,

  -- Deployment Status
  auto_applied BOOLEAN DEFAULT FALSE,
  manually_approved BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,

  -- Performance Tracking
  rich_results_impressions INTEGER DEFAULT 0,
  rich_results_clicks INTEGER DEFAULT 0,
  last_performance_update TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schema_markup_generated_workspace
  ON schema_markup_generated(workspace_id);

CREATE INDEX IF NOT EXISTS idx_schema_markup_generated_profile
  ON schema_markup_generated(seo_profile_id);

CREATE INDEX IF NOT EXISTS idx_schema_markup_generated_page
  ON schema_markup_generated(page_url);

COMMENT ON TABLE schema_markup_generated IS '2026 Local SEO: Generated JSON-LD schema per page with validation + performance.';


-- ============================================================================
-- 5. LLM Citation Tracking & Syndication
-- ============================================================================

CREATE TABLE IF NOT EXISTS llm_citation_syndication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  seo_profile_id UUID NOT NULL REFERENCES synthex_local_seo_profiles(id) ON DELETE CASCADE,

  -- Content Details
  content_type TEXT NOT NULL, -- 'listicle', 'faq', 'case_study', 'how_to'
  original_content_url TEXT NOT NULL,
  syndicated_content JSONB NOT NULL, -- Title, body, metadata
  target_keywords JSONB[] DEFAULT '{}'::jsonb[],

  -- Syndication Targets
  syndication_targets JSONB[] DEFAULT '{}'::jsonb[], -- Array of target sites/platforms
  syndication_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'published', 'failed'
  published_urls JSONB[] DEFAULT '{}'::jsonb[], -- Where it was published

  -- Citation Tracking
  citation_count INTEGER NOT NULL DEFAULT 0,
  backlink_count INTEGER NOT NULL DEFAULT 0,
  ai_mentions_count INTEGER NOT NULL DEFAULT 0,
  last_citation_check TIMESTAMPTZ,

  -- Performance Metrics
  brand_mention_increase JSONB,
  organic_traffic_impact JSONB,
  local_ranking_improvements JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_citation_syndication_workspace
  ON llm_citation_syndication(workspace_id);

CREATE INDEX IF NOT EXISTS idx_llm_citation_syndication_profile
  ON llm_citation_syndication(seo_profile_id);

COMMENT ON TABLE llm_citation_syndication IS '2026 Local SEO: Tracks long-form content syndication and resulting citations/backlinks.';


-- ============================================================================
-- 6. Service-Level Content Strategy
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_content_strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  seo_profile_id UUID NOT NULL REFERENCES synthex_local_seo_profiles(id) ON DELETE CASCADE,

  -- Service Details
  service_name TEXT NOT NULL,
  service_category TEXT,
  target_location JSONB, -- Specific location for this service

  -- Content Strategy
  primary_keywords JSONB[] DEFAULT '{}'::jsonb[],
  content_topics JSONB[] DEFAULT '{}'::jsonb[], -- Topics to cover
  faq_questions JSONB[] DEFAULT '{}'::jsonb[], -- Common questions
  competitor_content_gaps JSONB[] DEFAULT '{}'::jsonb[],

  -- AI-Generated Content
  content_outline JSONB,
  generated_content TEXT,
  content_status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'review', 'published'

  -- Performance Tracking
  content_score INTEGER, -- 0-100 AI content quality score
  seo_optimization_score INTEGER, -- 0-100 SEO optimization
  local_relevance_score INTEGER, -- 0-100 local relevance

  -- Publishing Details
  target_url TEXT,
  published_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_content_strategy_workspace
  ON service_content_strategy(workspace_id);

CREATE INDEX IF NOT EXISTS idx_service_content_strategy_profile
  ON service_content_strategy(seo_profile_id);

COMMENT ON TABLE service_content_strategy IS '2026 Local SEO: Per-service content strategy, outlines, and generated drafts.';


-- ============================================================================
-- 7. Media Asset Optimization
-- ============================================================================

CREATE TABLE IF NOT EXISTS media_asset_optimization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  seo_profile_id UUID NOT NULL REFERENCES synthex_local_seo_profiles(id) ON DELETE CASCADE,

  -- Original Asset Details
  original_filename TEXT NOT NULL,
  original_file_size BIGINT,
  original_dimensions JSONB, -- { width, height }
  file_type TEXT NOT NULL, -- 'image', 'video'
  upload_source TEXT, -- 'user_upload', 'gbp_sync', 'auto_generated'

  -- Optimization Details
  optimized_filename TEXT,
  optimized_file_size BIGINT,
  optimized_dimensions JSONB,
  optimization_applied JSONB[] DEFAULT '{}'::jsonb[], -- Array of optimizations applied

  -- SEO Metadata
  alt_text TEXT,
  caption TEXT,
  location_metadata JSONB, -- GPS coordinates, location name
  keywords JSONB[] DEFAULT '{}'::jsonb[],

  -- Usage Tracking
  used_in_gbp BOOLEAN DEFAULT FALSE,
  used_in_website BOOLEAN DEFAULT FALSE,
  used_in_ads BOOLEAN DEFAULT FALSE,

  -- Storage URLs
  original_url TEXT,
  optimized_url TEXT,
  thumbnail_url TEXT,

  -- Performance Metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0.00,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_asset_optimization_workspace
  ON media_asset_optimization(workspace_id);

CREATE INDEX IF NOT EXISTS idx_media_asset_optimization_profile
  ON media_asset_optimization(seo_profile_id);

COMMENT ON TABLE media_asset_optimization IS '2026 Local SEO: Tracks optimization and performance of local SEO media assets.';


-- ============================================================================
-- 8. Local SEO Automation Rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS local_seo_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  seo_profile_id UUID NOT NULL REFERENCES synthex_local_seo_profiles(id) ON DELETE CASCADE,

  -- Rule Definition
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'gbp_posting', 'content_generation', 'citation_building', 'schema_update'
  trigger_conditions JSONB NOT NULL, -- When to execute
  action_configuration JSONB NOT NULL, -- What to do

  -- Execution Settings
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  execution_frequency TEXT,
  max_executions_per_period INTEGER NOT NULL DEFAULT 10,

  -- Performance Tracking
  total_executions INTEGER NOT NULL DEFAULT 0,
  successful_executions INTEGER NOT NULL DEFAULT 0,
  last_execution TIMESTAMPTZ,
  average_execution_time INTEGER, -- milliseconds

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_local_seo_automation_rules_workspace
  ON local_seo_automation_rules(workspace_id);

CREATE INDEX IF NOT EXISTS idx_local_seo_automation_rules_profile
  ON local_seo_automation_rules(seo_profile_id);

COMMENT ON TABLE local_seo_automation_rules IS '2026 Local SEO: Automation rules for GBP, schema, citations, content.';


-- ============================================================================
-- 9. Australian Local SEO Templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS australian_seo_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template Details
  template_name TEXT NOT NULL,
  template_category TEXT NOT NULL, -- 'schema', 'content', 'gbp', 'citations'
  industry_vertical TEXT, -- 'trades', 'professional_services', 'retail', 'hospitality'
  template_data JSONB NOT NULL,

  -- Australian Specific
  australian_compliance JSONB,
  local_references JSONB[],
  pricing_templates JSONB,

  -- Usage & Performance
  usage_count INTEGER NOT NULL DEFAULT 0,
  success_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_australian_seo_templates_category
  ON australian_seo_templates(template_category, industry_vertical);

COMMENT ON TABLE australian_seo_templates IS '2026 Local SEO: Australian-specific templates for schema/content/GBP/citations.';


-- ============================================================================
-- 10. Helper: updated_at trigger for synthex_local_seo_profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION update_synthex_local_seo_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_update_synthex_local_seo_profiles_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_synthex_local_seo_profiles_updated_at
      BEFORE UPDATE ON synthex_local_seo_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_synthex_local_seo_profiles_updated_at();
  END IF;
END;
$$;
