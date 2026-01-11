-- Competitor Intelligence Scraping System
-- Tracks web scrape jobs, raw content, and extracted data

-- Competitors tracked by workspace
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'website', -- 'website', 'social', 'api', 'reddit'
  social_handles JSONB, -- {reddit: "...", twitter: "...", linkedin: "..."}
  notes TEXT,
  last_scraped_at TIMESTAMP,
  last_scraped_status TEXT, -- 'success', 'failed', 'rate_limited'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_competitor_per_workspace UNIQUE(workspace_id, domain)
);

-- Scrape jobs (on-demand scraping requests)
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- 'full_scrape', 'pricing', 'social', 'reddit'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_job_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'))
);

-- Raw scrape results (store HTML/raw responses)
CREATE TABLE IF NOT EXISTS scrape_results_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  raw_content TEXT, -- Full HTML or API response
  http_status INTEGER,
  headers JSONB, -- Response headers
  scraped_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT raw_content_not_empty CHECK (raw_content IS NOT NULL AND raw_content != '')
);

-- Extracted competitor data (structured, queryable)
CREATE TABLE IF NOT EXISTS competitor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,

  -- Pricing data
  pricing JSONB, -- [{product: "...", price: "...", currency: "...", url: "..."}]

  -- Social metrics
  social_metrics JSONB, -- {reddit: {followers: 0, posts: 0, engagement: 0}, twitter: {...}}

  -- Feature/content data
  features JSONB, -- [...]
  content_summary TEXT,
  keywords JSONB, -- {meta_keywords: [...], headings: [...]}

  -- Links and references
  external_links JSONB, -- [{text: "...", url: "..."}]

  last_updated TIMESTAMP DEFAULT NOW()
);

-- Detect changes between scrapes
CREATE TABLE IF NOT EXISTS competitor_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,

  change_type TEXT NOT NULL, -- 'pricing_change', 'feature_added', 'social_growth', 'new_content'
  old_value JSONB,
  new_value JSONB,
  details TEXT,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'

  detected_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_results_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Competitors
DROP POLICY IF EXISTS "competitors_tenant_isolation" ON competitors;
CREATE POLICY "competitors_tenant_isolation" ON competitors
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "competitors_insert" ON competitors;
CREATE POLICY "competitors_insert" ON competitors
FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

-- RLS Policies - Scrape Jobs
DROP POLICY IF EXISTS "scrape_jobs_tenant_isolation" ON scrape_jobs;
CREATE POLICY "scrape_jobs_tenant_isolation" ON scrape_jobs
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "scrape_jobs_insert" ON scrape_jobs;
CREATE POLICY "scrape_jobs_insert" ON scrape_jobs
FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

-- RLS Policies - Scrape Results Raw
DROP POLICY IF EXISTS "scrape_results_raw_tenant_isolation" ON scrape_results_raw;
CREATE POLICY "scrape_results_raw_tenant_isolation" ON scrape_results_raw
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "scrape_results_raw_insert" ON scrape_results_raw;
CREATE POLICY "scrape_results_raw_insert" ON scrape_results_raw
FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

-- RLS Policies - Competitor Data
DROP POLICY IF EXISTS "competitor_data_tenant_isolation" ON competitor_data;
CREATE POLICY "competitor_data_tenant_isolation" ON competitor_data
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "competitor_data_insert" ON competitor_data;
CREATE POLICY "competitor_data_insert" ON competitor_data
FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

-- RLS Policies - Competitor Changes
DROP POLICY IF EXISTS "competitor_changes_tenant_isolation" ON competitor_changes;
CREATE POLICY "competitor_changes_tenant_isolation" ON competitor_changes
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "competitor_changes_insert" ON competitor_changes;
CREATE POLICY "competitor_changes_insert" ON competitor_changes
FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_competitors_workspace ON competitors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_workspace ON scrape_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_competitor ON scrape_jobs(competitor_id);
CREATE INDEX IF NOT EXISTS idx_scrape_results_workspace ON scrape_results_raw(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scrape_results_competitor ON scrape_results_raw(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_data_workspace ON competitor_data(workspace_id);
CREATE INDEX IF NOT EXISTS idx_competitor_data_competitor ON competitor_data(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_changes_workspace ON competitor_changes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_competitor_changes_detected ON competitor_changes(detected_at DESC);
