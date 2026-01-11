-- Universal Web Scraper System
-- User-driven URL discovery, batch scraping, and data extraction for article research

-- Projects (user research projects)
CREATE TABLE IF NOT EXISTS scraper_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),

  name TEXT NOT NULL, -- e.g., "Competitor Research Q1"
  description TEXT,

  -- User inputs
  seed_url TEXT NOT NULL, -- Starting URL provided by user
  keywords TEXT[] NOT NULL, -- ["keyword1", "keyword2", ...]

  -- Configuration
  max_urls_to_scrape INTEGER DEFAULT 20,
  search_depth INTEGER DEFAULT 1, -- How deep to search for related URLs
  include_images BOOLEAN DEFAULT true,
  include_pricing BOOLEAN DEFAULT true,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'searching', 'scraping', 'extracting', 'completed', 'failed'
  progress JSONB DEFAULT '{"current": 0, "total": 0, "stage": "initializing"}',

  -- Results
  total_urls_found INTEGER DEFAULT 0,
  total_urls_scraped INTEGER DEFAULT 0,
  total_urls_failed INTEGER DEFAULT 0,

  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- URLs to scrape (discovered or user-provided)
CREATE TABLE IF NOT EXISTS scraper_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES scraper_projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  source TEXT, -- 'seed', 'search', 'manual'
  relevance_score FLOAT DEFAULT 0.0, -- 0-1, how relevant to keywords
  priority INTEGER DEFAULT 0, -- Higher = scrape first

  -- Tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'scraping', 'completed', 'failed'
  attempted_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_url_per_project UNIQUE(project_id, url)
);

-- Raw scrape results
CREATE TABLE IF NOT EXISTS scraper_raw_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id UUID NOT NULL REFERENCES scraper_urls(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES scraper_projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  raw_html TEXT,
  http_status INTEGER,
  headers JSONB,
  scraped_at TIMESTAMP DEFAULT NOW()
);

-- Extracted structured data
CREATE TABLE IF NOT EXISTS scraper_extracted_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id UUID NOT NULL REFERENCES scraper_urls(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES scraper_projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  url TEXT NOT NULL,

  -- Page metadata
  title TEXT,
  meta_description TEXT,
  main_heading TEXT,

  -- Content
  body_text TEXT, -- Main page content (first 5000 chars)

  -- Products (array of products found)
  products JSONB, -- [{name, description, price, currency, image_url, url}]

  -- Pricing
  pricing_models JSONB, -- [{name, price, features: [...], currency}]
  pricing_summary TEXT,

  -- Images
  images JSONB, -- [{url, alt_text, type: "product|feature|logo"}]

  -- Other useful data
  contact_info JSONB, -- {email, phone, address}
  social_links JSONB, -- {twitter, linkedin, facebook, instagram}
  features JSONB, -- [...]
  testimonials JSONB, -- [{author, text, rating}]

  -- Article-relevant
  article_summary TEXT, -- 2-3 sentence summary for article
  key_insights TEXT[], -- Bulleted insights

  extracted_at TIMESTAMP DEFAULT NOW()
);

-- Aggregated project results (for easy retrieval)
CREATE TABLE IF NOT EXISTS scraper_project_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES scraper_projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Aggregated data
  all_products JSONB, -- Combined products from all pages
  all_pricing JSONB, -- Pricing comparison
  all_features JSONB, -- Features across all competitors
  all_images JSONB, -- All images by category

  -- Article content
  article_outline JSONB, -- {sections: [{title, content, sources: [urls]}]}
  article_draft TEXT, -- Generated article draft

  -- Summary statistics
  total_products_found INTEGER DEFAULT 0,
  total_images_found INTEGER DEFAULT 0,
  price_range JSONB, -- {min, max, currency}
  common_features TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scraper_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_raw_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_project_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Projects
DROP POLICY IF EXISTS "scraper_projects_tenant_isolation" ON scraper_projects;
CREATE POLICY "scraper_projects_tenant_isolation" ON scraper_projects
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "scraper_projects_insert" ON scraper_projects;
CREATE POLICY "scraper_projects_insert" ON scraper_projects
FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

-- RLS Policies - URLs
DROP POLICY IF EXISTS "scraper_urls_tenant_isolation" ON scraper_urls;
CREATE POLICY "scraper_urls_tenant_isolation" ON scraper_urls
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "scraper_urls_insert" ON scraper_urls;
CREATE POLICY "scraper_urls_insert" ON scraper_urls
FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

-- RLS Policies - Raw Results
DROP POLICY IF EXISTS "scraper_raw_results_tenant_isolation" ON scraper_raw_results;
CREATE POLICY "scraper_raw_results_tenant_isolation" ON scraper_raw_results
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "scraper_raw_results_insert" ON scraper_raw_results;
CREATE POLICY "scraper_raw_results_insert" ON scraper_raw_results
FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

-- RLS Policies - Extracted Data
DROP POLICY IF EXISTS "scraper_extracted_data_tenant_isolation" ON scraper_extracted_data;
CREATE POLICY "scraper_extracted_data_tenant_isolation" ON scraper_extracted_data
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "scraper_extracted_data_insert" ON scraper_extracted_data;
CREATE POLICY "scraper_extracted_data_insert" ON scraper_extracted_data
FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

-- RLS Policies - Project Results
DROP POLICY IF EXISTS "scraper_project_results_tenant_isolation" ON scraper_project_results;
CREATE POLICY "scraper_project_results_tenant_isolation" ON scraper_project_results
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "scraper_project_results_insert" ON scraper_project_results;
CREATE POLICY "scraper_project_results_insert" ON scraper_project_results
FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

-- Indices
CREATE INDEX IF NOT EXISTS idx_scraper_projects_workspace ON scraper_projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scraper_projects_status ON scraper_projects(status);
CREATE INDEX IF NOT EXISTS idx_scraper_urls_project ON scraper_urls(project_id);
CREATE INDEX IF NOT EXISTS idx_scraper_urls_status ON scraper_urls(status);
CREATE INDEX IF NOT EXISTS idx_scraper_urls_workspace ON scraper_urls(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scraper_raw_results_project ON scraper_raw_results(project_id);
CREATE INDEX IF NOT EXISTS idx_scraper_extracted_data_project ON scraper_extracted_data(project_id);
CREATE INDEX IF NOT EXISTS idx_scraper_project_results_project ON scraper_project_results(project_id);
