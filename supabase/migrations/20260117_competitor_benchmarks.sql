/**
 * Competitor Benchmarks Table
 * Stores discovered competitors and comparison metrics
 *
 * Automatically discovers top 3 competitors during analysis
 * Tracks metric differences and ranking gaps
 */

-- Create competitor source enum
DO $$ BEGIN
  CREATE TYPE competitor_source AS ENUM (
    'serp',         -- Discovered from SERP ranking
    'manual',       -- Manually added by user
    'industry',     -- Industry database
    'similarweb'    -- SimilarWeb data
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create competitor benchmarks table
CREATE TABLE IF NOT EXISTS competitor_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  health_check_job_id UUID NOT NULL REFERENCES health_check_jobs(id) ON DELETE CASCADE,

  -- Competitor info
  competitor_domain TEXT NOT NULL,
  competitor_name TEXT,
  source competitor_source DEFAULT 'serp' NOT NULL,

  -- Ranking info
  serp_position INTEGER, -- Position in search results (1-100)
  serp_url TEXT,

  -- Metrics
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  domain_authority NUMERIC(5, 2),
  page_authority NUMERIC(5, 2),

  -- Performance metrics
  page_speed_score INTEGER, -- 0-100
  mobile_friendly_score INTEGER,
  security_score INTEGER,

  -- Traffic estimates
  estimated_monthly_traffic INTEGER,
  estimated_organic_value NUMERIC(12, 2),

  -- Differences from analyzed site
  score_difference INTEGER, -- Positive: competitor higher, negative: analyzed site higher
  traffic_difference INTEGER,
  authority_difference NUMERIC(5, 2),

  -- Gaps identified
  missing_features JSONB DEFAULT '[]'::jsonb, -- Features competitor has but subject doesn't
  weak_areas JSONB DEFAULT '[]'::jsonb,      -- Areas where competitor is stronger

  -- Raw data
  raw_data JSONB,

  -- Tracking
  first_discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  analyzed_count INTEGER DEFAULT 1,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_workspace ON competitor_benchmarks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_job_id ON competitor_benchmarks(health_check_job_id);
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_domain ON competitor_benchmarks(competitor_domain);
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_score ON competitor_benchmarks(health_score DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_position ON competitor_benchmarks(serp_position);
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_workspace_domain ON competitor_benchmarks(workspace_id, competitor_domain);

-- Enable RLS
ALTER TABLE competitor_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "tenant_isolation" ON competitor_benchmarks;
CREATE POLICY "tenant_isolation" ON competitor_benchmarks
  FOR ALL USING (workspace_id = get_current_workspace_id());

-- Update trigger
CREATE OR REPLACE FUNCTION update_competitor_benchmarks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS competitor_benchmarks_updated_at_trigger ON competitor_benchmarks;
CREATE TRIGGER competitor_benchmarks_updated_at_trigger
  BEFORE UPDATE ON competitor_benchmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_benchmarks_updated_at();

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON competitor_benchmarks TO authenticated;
GRANT SELECT ON competitor_benchmarks TO anon;

-- Comments
COMMENT ON TABLE competitor_benchmarks IS 'Competitor health metrics and comparison data';
COMMENT ON COLUMN competitor_benchmarks.serp_position IS 'Position in search results for target keywords';
COMMENT ON COLUMN competitor_benchmarks.score_difference IS 'Relative to analyzed site: positive = competitor better';
COMMENT ON COLUMN competitor_benchmarks.missing_features IS 'Features competitor has that analyzed site lacks';
