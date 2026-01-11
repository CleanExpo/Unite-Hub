/**
 * Health Check Results Table
 * Stores detailed analysis results from health check jobs
 *
 * Includes:
 * - Overall health score (0-100)
 * - E.E.A.T. metrics (Expertise, Authority, Trustworthiness)
 * - Technical metrics (CWV, security, crawlability)
 * - Issue counts and categorization
 * - Recommendations and insights
 */

-- Create score level enum
DO $$ BEGIN
  CREATE TYPE score_level AS ENUM (
    'critical',  -- 0-20: Major issues
    'poor',      -- 21-40: Significant problems
    'fair',      -- 41-60: Some issues
    'good',      -- 61-80: Mostly healthy
    'excellent'  -- 81-100: Very healthy
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create health check results table
CREATE TABLE IF NOT EXISTS health_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES health_check_jobs(id) ON DELETE CASCADE UNIQUE,

  -- Overall score
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  score_level score_level NOT NULL,

  -- E.E.A.T. Scores
  eeat_expertise_score INTEGER CHECK (eeat_expertise_score >= 0 AND eeat_expertise_score <= 100),
  eeat_authority_score INTEGER CHECK (eeat_authority_score >= 0 AND eeat_authority_score <= 100),
  eeat_trustworthiness_score INTEGER CHECK (eeat_trustworthiness_score >= 0 AND eeat_trustworthiness_score <= 100),

  -- Technical Scores
  technical_seo_score INTEGER CHECK (technical_seo_score >= 0 AND technical_seo_score <= 100),
  core_web_vitals_score INTEGER CHECK (core_web_vitals_score >= 0 AND core_web_vitals_score <= 100),
  security_score INTEGER CHECK (security_score >= 0 AND security_score <= 100),
  mobile_friendly_score INTEGER CHECK (mobile_friendly_score >= 0 AND mobile_friendly_score <= 100),

  -- Core Web Vitals (milliseconds/units)
  lcp_ms INTEGER,       -- Largest Contentful Paint
  fcp_ms INTEGER,       -- First Contentful Paint
  cls_score NUMERIC(4, 2), -- Cumulative Layout Shift (0.0-100.0)
  inp_ms INTEGER,       -- Interaction to Next Paint
  ttfb_ms INTEGER,      -- Time to First Byte

  -- Technical Issues
  critical_issues_count INTEGER DEFAULT 0,
  high_issues_count INTEGER DEFAULT 0,
  medium_issues_count INTEGER DEFAULT 1,
  low_issues_count INTEGER DEFAULT 0,
  total_issues_count INTEGER DEFAULT 0,

  -- Issues data (JSON)
  critical_issues JSONB DEFAULT '[]'::jsonb,
  high_issues JSONB DEFAULT '[]'::jsonb,
  medium_issues JSONB DEFAULT '[]'::jsonb,
  low_issues JSONB DEFAULT '[]'::jsonb,

  -- Security metrics
  has_https BOOLEAN,
  mixed_content_count INTEGER DEFAULT 0,
  security_headers JSONB DEFAULT '{}'::jsonb, -- {csp, hsts, x-frame-options, etc}

  -- Mobile metrics
  is_mobile_friendly BOOLEAN,
  viewport_configured BOOLEAN,
  tap_targets_sized BOOLEAN,
  font_sizes_legible BOOLEAN,

  -- Crawlability
  has_robots_txt BOOLEAN,
  has_sitemap BOOLEAN,
  sitemap_url_count INTEGER,
  indexable_pages INTEGER,
  blocked_pages INTEGER,
  orphan_pages INTEGER,

  -- Schema validation
  schema_types_found TEXT[], -- Array of found schema types
  schema_errors JSONB DEFAULT '[]'::jsonb,

  -- Raw data for analysis
  raw_crawl_data JSONB,
  raw_performance_data JSONB,

  -- Timestamps
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_check_results_workspace ON health_check_results(workspace_id);
CREATE INDEX IF NOT EXISTS idx_health_check_results_job_id ON health_check_results(job_id);
CREATE INDEX IF NOT EXISTS idx_health_check_results_score_level ON health_check_results(score_level);
CREATE INDEX IF NOT EXISTS idx_health_check_results_analyzed ON health_check_results(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_check_results_workspace_score ON health_check_results(workspace_id, overall_score);

-- Enable RLS
ALTER TABLE health_check_results ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "tenant_isolation" ON health_check_results;
CREATE POLICY "tenant_isolation" ON health_check_results
  FOR ALL USING (workspace_id = get_current_workspace_id());

-- Update trigger
CREATE OR REPLACE FUNCTION update_health_check_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS health_check_results_updated_at_trigger ON health_check_results;
CREATE TRIGGER health_check_results_updated_at_trigger
  BEFORE UPDATE ON health_check_results
  FOR EACH ROW
  EXECUTE FUNCTION update_health_check_results_updated_at();

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON health_check_results TO authenticated;
GRANT SELECT ON health_check_results TO anon;

-- Comments
COMMENT ON TABLE health_check_results IS 'Detailed health check analysis results';
COMMENT ON COLUMN health_check_results.overall_score IS 'Overall health score 0-100';
COMMENT ON COLUMN health_check_results.eeat_expertise_score IS 'E-E-A-T: Expertise score 0-100';
COMMENT ON COLUMN health_check_results.lcp_ms IS 'Largest Contentful Paint in milliseconds';
COMMENT ON COLUMN health_check_results.cls_score IS 'Cumulative Layout Shift: 0.0-100.0 scale';
COMMENT ON COLUMN health_check_results.critical_issues IS 'JSON array of critical findings';
