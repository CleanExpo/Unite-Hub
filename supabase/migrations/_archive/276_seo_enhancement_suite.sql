-- Migration: 276_seo_enhancement_suite.sql
-- Description: Legitimate SEO Enhancement Suite - Technical Audits, Content Optimization, Rich Results, CTR Improvement, Competitor Analysis
-- Created: 2025-11-28

-- ============================================
-- TECHNICAL SEO AUDIT TABLES
-- ============================================

-- SEO Audit Jobs
CREATE TABLE IF NOT EXISTS seo_audit_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  audit_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'technical', 'content', 'performance'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO Audit Results
CREATE TABLE IF NOT EXISTS seo_audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_job_id UUID NOT NULL REFERENCES seo_audit_jobs(id) ON DELETE CASCADE,

  -- Overall Scores (0-100)
  overall_score INT NOT NULL DEFAULT 0,
  technical_score INT NOT NULL DEFAULT 0,
  content_score INT NOT NULL DEFAULT 0,
  performance_score INT NOT NULL DEFAULT 0,
  mobile_score INT NOT NULL DEFAULT 0,

  -- Core Web Vitals
  lcp_ms INT, -- Largest Contentful Paint
  fid_ms INT, -- First Input Delay
  cls_score DECIMAL(4,3), -- Cumulative Layout Shift
  ttfb_ms INT, -- Time to First Byte
  fcp_ms INT, -- First Contentful Paint

  -- Technical Issues (JSONB arrays)
  critical_issues JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  passed_checks JSONB DEFAULT '[]'::jsonb,

  -- Page Analysis
  pages_crawled INT DEFAULT 0,
  pages_with_issues INT DEFAULT 0,
  broken_links INT DEFAULT 0,
  redirect_chains INT DEFAULT 0,
  duplicate_content_pages INT DEFAULT 0,
  missing_meta_pages INT DEFAULT 0,

  -- Schema/Structured Data
  schema_types_found JSONB DEFAULT '[]'::jsonb,
  schema_errors JSONB DEFAULT '[]'::jsonb,

  -- Mobile Analysis
  mobile_friendly BOOLEAN DEFAULT true,
  viewport_configured BOOLEAN DEFAULT true,
  tap_targets_sized BOOLEAN DEFAULT true,
  font_sizes_legible BOOLEAN DEFAULT true,

  -- Security
  https_enabled BOOLEAN DEFAULT false,
  mixed_content_issues INT DEFAULT 0,
  security_headers JSONB DEFAULT '{}'::jsonb,

  -- Raw Data
  raw_lighthouse_data JSONB,
  raw_crawl_data JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CONTENT OPTIMIZATION TABLES
-- ============================================

-- Content Analysis Jobs
CREATE TABLE IF NOT EXISTS content_analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  target_keyword TEXT NOT NULL,
  secondary_keywords TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content Optimization Results
CREATE TABLE IF NOT EXISTS content_optimization_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_job_id UUID NOT NULL REFERENCES content_analysis_jobs(id) ON DELETE CASCADE,

  -- Content Scores (0-100)
  overall_content_score INT NOT NULL DEFAULT 0,
  keyword_optimization_score INT NOT NULL DEFAULT 0,
  readability_score INT NOT NULL DEFAULT 0,
  search_intent_score INT NOT NULL DEFAULT 0,
  completeness_score INT NOT NULL DEFAULT 0,

  -- Keyword Analysis
  keyword_density DECIMAL(5,2),
  keyword_in_title BOOLEAN DEFAULT false,
  keyword_in_h1 BOOLEAN DEFAULT false,
  keyword_in_meta BOOLEAN DEFAULT false,
  keyword_in_url BOOLEAN DEFAULT false,
  keyword_occurrences INT DEFAULT 0,

  -- Content Structure
  word_count INT DEFAULT 0,
  heading_structure JSONB DEFAULT '[]'::jsonb, -- H1, H2, H3 hierarchy
  paragraph_count INT DEFAULT 0,
  avg_paragraph_length INT DEFAULT 0,

  -- Readability Metrics
  flesch_reading_ease DECIMAL(5,2),
  flesch_kincaid_grade DECIMAL(4,2),
  avg_sentence_length DECIMAL(5,2),

  -- Search Intent Analysis
  detected_intent TEXT, -- 'informational', 'navigational', 'transactional', 'commercial'
  intent_alignment_notes TEXT,

  -- Recommendations (JSONB arrays)
  title_recommendations JSONB DEFAULT '[]'::jsonb,
  meta_recommendations JSONB DEFAULT '[]'::jsonb,
  content_recommendations JSONB DEFAULT '[]'::jsonb,
  structure_recommendations JSONB DEFAULT '[]'::jsonb,

  -- Competitor Comparison
  avg_competitor_word_count INT,
  content_gap_topics JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RICH RESULTS / SCHEMA TABLES
-- ============================================

-- Schema Markup Templates
CREATE TABLE IF NOT EXISTS schema_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schema_type TEXT NOT NULL, -- 'Article', 'Product', 'LocalBusiness', 'FAQ', 'HowTo', 'Review', 'Event', 'Recipe'
  template_json JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generated Schema Markup
CREATE TABLE IF NOT EXISTS generated_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id UUID REFERENCES schema_templates(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  schema_type TEXT NOT NULL,
  schema_json JSONB NOT NULL,
  validation_status TEXT DEFAULT 'pending', -- 'pending', 'valid', 'invalid', 'warnings'
  validation_errors JSONB DEFAULT '[]'::jsonb,
  validation_warnings JSONB DEFAULT '[]'::jsonb,
  is_deployed BOOLEAN DEFAULT false,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rich Results Monitoring
CREATE TABLE IF NOT EXISTS rich_results_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  keyword TEXT NOT NULL,

  -- Rich Result Detection
  has_rich_result BOOLEAN DEFAULT false,
  rich_result_types TEXT[] DEFAULT '{}', -- 'faq', 'howto', 'review', 'recipe', 'video', 'product', etc.

  -- Position Tracking
  organic_position INT,
  rich_result_position INT,

  -- Competitor Rich Results
  competitor_rich_results JSONB DEFAULT '[]'::jsonb,

  -- Opportunity Score
  opportunity_score INT DEFAULT 0, -- 0-100, higher = more opportunity
  opportunity_type TEXT, -- Which rich result type has best opportunity

  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CTR OPTIMIZATION TABLES (LEGITIMATE)
-- ============================================

-- Title/Meta A/B Tests
CREATE TABLE IF NOT EXISTS title_meta_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  keyword TEXT NOT NULL,

  -- Variants
  variant_a_title TEXT NOT NULL,
  variant_a_meta TEXT NOT NULL,
  variant_b_title TEXT NOT NULL,
  variant_b_meta TEXT NOT NULL,

  -- Test Configuration
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'running', 'completed', 'cancelled'
  start_date DATE,
  end_date DATE,
  winner TEXT, -- 'a', 'b', 'no_winner'

  -- Results (from GSC data)
  variant_a_impressions INT DEFAULT 0,
  variant_a_clicks INT DEFAULT 0,
  variant_a_ctr DECIMAL(5,2) DEFAULT 0,
  variant_a_avg_position DECIMAL(4,2),

  variant_b_impressions INT DEFAULT 0,
  variant_b_clicks INT DEFAULT 0,
  variant_b_ctr DECIMAL(5,2) DEFAULT 0,
  variant_b_avg_position DECIMAL(4,2),

  -- Statistical Significance
  statistical_confidence DECIMAL(5,2), -- 0-100%

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CTR Benchmarks
CREATE TABLE IF NOT EXISTS ctr_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  keyword TEXT NOT NULL,

  -- Current Performance
  current_position DECIMAL(4,2),
  current_ctr DECIMAL(5,2),
  current_impressions INT,
  current_clicks INT,

  -- Expected CTR (based on position)
  expected_ctr DECIMAL(5,2),
  ctr_difference DECIMAL(5,2), -- Actual - Expected

  -- CTR Opportunity
  opportunity_level TEXT, -- 'high', 'medium', 'low'
  estimated_click_gain INT, -- If CTR improved to expected

  -- Recommendations
  title_quality_score INT, -- 0-100
  meta_quality_score INT, -- 0-100
  recommendations JSONB DEFAULT '[]'::jsonb,

  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- COMPETITOR GAP ANALYSIS TABLES
-- ============================================

-- Competitor Profiles
CREATE TABLE IF NOT EXISTS competitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_domain TEXT NOT NULL,
  competitor_domain TEXT NOT NULL,
  competitor_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(workspace_id, client_domain, competitor_domain)
);

-- Keyword Gap Analysis
CREATE TABLE IF NOT EXISTS keyword_gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_domain TEXT NOT NULL,

  -- Analysis Results
  total_client_keywords INT DEFAULT 0,
  total_competitor_keywords INT DEFAULT 0,
  shared_keywords INT DEFAULT 0,
  client_unique_keywords INT DEFAULT 0,
  competitor_unique_keywords INT DEFAULT 0,

  -- Gap Details (JSONB arrays)
  missing_keywords JSONB DEFAULT '[]'::jsonb, -- Keywords competitors rank for, client doesn't
  weak_keywords JSONB DEFAULT '[]'::jsonb, -- Keywords where competitors outrank client
  strong_keywords JSONB DEFAULT '[]'::jsonb, -- Keywords where client outranks competitors
  opportunity_keywords JSONB DEFAULT '[]'::jsonb, -- High-value gaps to target

  -- Prioritized Opportunities
  quick_wins JSONB DEFAULT '[]'::jsonb, -- Low difficulty, high impact
  strategic_targets JSONB DEFAULT '[]'::jsonb, -- High difficulty, high impact

  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content Gap Analysis
CREATE TABLE IF NOT EXISTS content_gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_domain TEXT NOT NULL,

  -- Topic Coverage
  client_topics JSONB DEFAULT '[]'::jsonb,
  competitor_topics JSONB DEFAULT '[]'::jsonb,
  missing_topics JSONB DEFAULT '[]'::jsonb,

  -- Content Type Gaps
  missing_content_types JSONB DEFAULT '[]'::jsonb, -- 'blog', 'guide', 'comparison', 'faq', etc.

  -- Page Type Analysis
  competitor_page_types JSONB DEFAULT '{}'::jsonb, -- Count by type
  client_page_types JSONB DEFAULT '{}'::jsonb,

  -- Recommendations
  content_recommendations JSONB DEFAULT '[]'::jsonb,
  priority_topics JSONB DEFAULT '[]'::jsonb,

  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backlink Gap Analysis
CREATE TABLE IF NOT EXISTS backlink_gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_domain TEXT NOT NULL,

  -- Domain Metrics
  client_domain_authority INT,
  avg_competitor_domain_authority INT,

  -- Backlink Counts
  client_backlinks INT DEFAULT 0,
  client_referring_domains INT DEFAULT 0,
  avg_competitor_backlinks INT DEFAULT 0,
  avg_competitor_referring_domains INT DEFAULT 0,

  -- Gap Analysis
  link_gap_domains JSONB DEFAULT '[]'::jsonb, -- Domains linking to competitors but not client
  common_link_sources JSONB DEFAULT '[]'::jsonb, -- Domains linking to multiple competitors

  -- Opportunities
  high_value_opportunities JSONB DEFAULT '[]'::jsonb,
  easy_win_opportunities JSONB DEFAULT '[]'::jsonb,

  -- Toxic Link Check
  client_toxic_links INT DEFAULT 0,
  toxic_link_details JSONB DEFAULT '[]'::jsonb,

  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_seo_audit_jobs_workspace ON seo_audit_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_seo_audit_jobs_status ON seo_audit_jobs(status);
CREATE INDEX IF NOT EXISTS idx_seo_audit_jobs_domain ON seo_audit_jobs(domain);

CREATE INDEX IF NOT EXISTS idx_content_analysis_jobs_workspace ON content_analysis_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_optimization_results_job ON content_optimization_results(analysis_job_id);

CREATE INDEX IF NOT EXISTS idx_schema_templates_workspace ON schema_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_schema_templates_type ON schema_templates(schema_type);
CREATE INDEX IF NOT EXISTS idx_generated_schemas_workspace ON generated_schemas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_generated_schemas_url ON generated_schemas(url);

CREATE INDEX IF NOT EXISTS idx_title_meta_tests_workspace ON title_meta_tests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_title_meta_tests_status ON title_meta_tests(status);
CREATE INDEX IF NOT EXISTS idx_ctr_benchmarks_workspace ON ctr_benchmarks(workspace_id);

CREATE INDEX IF NOT EXISTS idx_competitor_profiles_workspace ON competitor_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_keyword_gap_workspace ON keyword_gap_analysis(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_gap_workspace ON content_gap_analysis(workspace_id);
CREATE INDEX IF NOT EXISTS idx_backlink_gap_workspace ON backlink_gap_analysis(workspace_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE seo_audit_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_optimization_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rich_results_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE title_meta_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctr_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_gap_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace members
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'seo_audit_jobs', 'content_analysis_jobs', 'schema_templates',
    'generated_schemas', 'rich_results_monitoring', 'title_meta_tests',
    'ctr_benchmarks', 'competitor_profiles', 'keyword_gap_analysis',
    'content_gap_analysis', 'backlink_gap_analysis'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Select policy
    EXECUTE format('
      DROP POLICY IF EXISTS %I_select ON %I;
      CREATE POLICY %I_select ON %I FOR SELECT USING (
        workspace_id IN (
          SELECT w.id FROM workspaces w
          JOIN user_organizations uo ON uo.org_id = w.org_id
          WHERE uo.user_id = auth.uid()
        )
      );
    ', tbl, tbl, tbl, tbl);

    -- Insert policy
    EXECUTE format('
      DROP POLICY IF EXISTS %I_insert ON %I;
      CREATE POLICY %I_insert ON %I FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT w.id FROM workspaces w
          JOIN user_organizations uo ON uo.org_id = w.org_id
          WHERE uo.user_id = auth.uid()
        )
      );
    ', tbl, tbl, tbl, tbl);

    -- Update policy
    EXECUTE format('
      DROP POLICY IF EXISTS %I_update ON %I;
      CREATE POLICY %I_update ON %I FOR UPDATE USING (
        workspace_id IN (
          SELECT w.id FROM workspaces w
          JOIN user_organizations uo ON uo.org_id = w.org_id
          WHERE uo.user_id = auth.uid()
          AND uo.role IN (''owner'', ''admin'')
        )
      );
    ', tbl, tbl, tbl, tbl);

    -- Delete policy
    EXECUTE format('
      DROP POLICY IF EXISTS %I_delete ON %I;
      CREATE POLICY %I_delete ON %I FOR DELETE USING (
        workspace_id IN (
          SELECT w.id FROM workspaces w
          JOIN user_organizations uo ON uo.org_id = w.org_id
          WHERE uo.user_id = auth.uid()
          AND uo.role IN (''owner'', ''admin'')
        )
      );
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- Special RLS for result tables (access through parent job)
DROP POLICY IF EXISTS seo_audit_results_select ON seo_audit_results;
CREATE POLICY seo_audit_results_select ON seo_audit_results FOR SELECT USING (
  audit_job_id IN (
    SELECT id FROM seo_audit_jobs WHERE workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS content_optimization_results_select ON content_optimization_results;
CREATE POLICY content_optimization_results_select ON content_optimization_results FOR SELECT USING (
  analysis_job_id IN (
    SELECT id FROM content_analysis_jobs WHERE workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  )
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Calculate CTR expectation based on SERP position
CREATE OR REPLACE FUNCTION calculate_expected_ctr(serp_position DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  -- Industry standard CTR curves (approximate)
  RETURN CASE
    WHEN serp_position <= 1 THEN 28.5
    WHEN serp_position <= 2 THEN 15.7
    WHEN serp_position <= 3 THEN 11.0
    WHEN serp_position <= 4 THEN 8.0
    WHEN serp_position <= 5 THEN 7.2
    WHEN serp_position <= 6 THEN 5.1
    WHEN serp_position <= 7 THEN 4.0
    WHEN serp_position <= 8 THEN 3.2
    WHEN serp_position <= 9 THEN 2.8
    WHEN serp_position <= 10 THEN 2.5
    ELSE 1.0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate SEO score from components
CREATE OR REPLACE FUNCTION calculate_seo_score(
  technical INT,
  content INT,
  performance INT,
  mobile INT
) RETURNS INT AS $$
BEGIN
  -- Weighted average: Technical 30%, Content 30%, Performance 25%, Mobile 15%
  RETURN ROUND((technical * 0.30 + content * 0.30 + performance * 0.25 + mobile * 0.15)::NUMERIC);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_seo_enhancement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'seo_audit_jobs', 'content_analysis_jobs', 'schema_templates',
    'generated_schemas', 'title_meta_tests', 'competitor_profiles'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS %I_updated_at ON %I;
      CREATE TRIGGER %I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_seo_enhancement_timestamp();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- Auto-calculate overall score for audit results
CREATE OR REPLACE FUNCTION calculate_audit_overall_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.overall_score = calculate_seo_score(
    NEW.technical_score,
    NEW.content_score,
    NEW.performance_score,
    NEW.mobile_score
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS seo_audit_results_score ON seo_audit_results;
CREATE TRIGGER seo_audit_results_score
  BEFORE INSERT OR UPDATE ON seo_audit_results
  FOR EACH ROW
  EXECUTE FUNCTION calculate_audit_overall_score();

-- ============================================
-- SEED DATA: Default Schema Templates
-- ============================================

-- Note: Run this after migration with a valid workspace_id
-- INSERT INTO schema_templates (workspace_id, name, schema_type, template_json, is_default)
-- VALUES
--   ('your-workspace-id', 'FAQ Schema', 'FAQ', '{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": []}', true),
--   ('your-workspace-id', 'HowTo Schema', 'HowTo', '{"@context": "https://schema.org", "@type": "HowTo", "name": "", "step": []}', true),
--   ('your-workspace-id', 'LocalBusiness Schema', 'LocalBusiness', '{"@context": "https://schema.org", "@type": "LocalBusiness", "name": "", "address": {}}', true);

COMMENT ON TABLE seo_audit_jobs IS 'Technical SEO audit job tracking';
COMMENT ON TABLE seo_audit_results IS 'Detailed SEO audit results with Core Web Vitals';
COMMENT ON TABLE content_analysis_jobs IS 'Content optimization analysis jobs';
COMMENT ON TABLE content_optimization_results IS 'Content optimization recommendations and scores';
COMMENT ON TABLE schema_templates IS 'Reusable structured data templates';
COMMENT ON TABLE generated_schemas IS 'Generated schema markup for pages';
COMMENT ON TABLE rich_results_monitoring IS 'Track rich result opportunities and competitors';
COMMENT ON TABLE title_meta_tests IS 'A/B testing for titles and meta descriptions';
COMMENT ON TABLE ctr_benchmarks IS 'CTR performance vs expected by position';
COMMENT ON TABLE competitor_profiles IS 'Tracked competitor domains';
COMMENT ON TABLE keyword_gap_analysis IS 'Keyword gap analysis results';
COMMENT ON TABLE content_gap_analysis IS 'Content topic gap analysis';
COMMENT ON TABLE backlink_gap_analysis IS 'Backlink gap analysis results';
