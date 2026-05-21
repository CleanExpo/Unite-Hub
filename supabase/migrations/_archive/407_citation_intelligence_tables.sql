-- Migration 407: Citation Intelligence Tables
-- Created: 2026-01-15
-- Purpose: Support Phase 8 Citation Intelligence & Competitive Analysis

-- =====================================================
-- Table: citation_sources
-- Purpose: Store discovered citation sources from Scout research
-- =====================================================
CREATE TABLE IF NOT EXISTS citation_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Source identification
  url TEXT NOT NULL,
  domain TEXT NOT NULL,

  -- Authority metrics
  authority INTEGER DEFAULT 0 CHECK (authority >= 0 AND authority <= 100),
  citation_count INTEGER DEFAULT 0,

  -- Classification
  sectors TEXT[] DEFAULT '{}',
  citation_type TEXT NOT NULL CHECK (
    citation_type IN ('ai_overview', 'organic', 'featured_snippet', 'knowledge_panel')
  ),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Uniqueness constraint
  UNIQUE(workspace_id, url)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_citation_sources_workspace
  ON citation_sources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_citation_sources_domain
  ON citation_sources(workspace_id, domain);
CREATE INDEX IF NOT EXISTS idx_citation_sources_type
  ON citation_sources(workspace_id, citation_type);
CREATE INDEX IF NOT EXISTS idx_citation_sources_authority
  ON citation_sources(workspace_id, authority DESC);

-- Enable RLS
ALTER TABLE citation_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY citation_sources_workspace_isolation ON citation_sources
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Table: scout_runs
-- Purpose: Track Scout research runs and results
-- =====================================================
CREATE TABLE IF NOT EXISTS scout_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Research parameters
  sector TEXT NOT NULL,
  depth INTEGER NOT NULL CHECK (depth >= 1 AND depth <= 3),
  keywords TEXT[],
  competitors TEXT[],

  -- Results summary
  total_sources INTEGER DEFAULT 0,
  high_authority_sources INTEGER DEFAULT 0,
  ai_overview_sources INTEGER DEFAULT 0,
  opportunity_score INTEGER DEFAULT 0 CHECK (opportunity_score >= 0 AND opportunity_score <= 100),

  -- Analysis data
  analysis_data JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'running', 'completed', 'failed')
  )
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_scout_runs_workspace
  ON scout_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scout_runs_sector
  ON scout_runs(workspace_id, sector);
CREATE INDEX IF NOT EXISTS idx_scout_runs_created
  ON scout_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scout_runs_status
  ON scout_runs(workspace_id, status);

-- Enable RLS
ALTER TABLE scout_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY scout_runs_workspace_isolation ON scout_runs
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Table: citation_audits
-- Purpose: Store citation gap analysis results
-- =====================================================
CREATE TABLE IF NOT EXISTS citation_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Audit parameters
  client_domain TEXT NOT NULL,
  competitors_analyzed INTEGER DEFAULT 0,

  -- Results summary
  total_gaps INTEGER DEFAULT 0,
  high_priority_gaps INTEGER DEFAULT 0,
  opportunity_score INTEGER DEFAULT 0 CHECK (opportunity_score >= 0 AND opportunity_score <= 100),

  -- Analysis data (competitors, gaps, opportunities)
  analysis_data JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'completed' CHECK (
    status IN ('pending', 'running', 'completed', 'failed')
  )
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_citation_audits_workspace
  ON citation_audits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_citation_audits_client
  ON citation_audits(workspace_id, client_domain);
CREATE INDEX IF NOT EXISTS idx_citation_audits_created
  ON citation_audits(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citation_audits_score
  ON citation_audits(workspace_id, opportunity_score DESC);

-- Enable RLS
ALTER TABLE citation_audits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY citation_audits_workspace_isolation ON citation_audits
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Update Trigger Function (updated_at)
-- =====================================================
CREATE OR REPLACE FUNCTION update_citation_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_citation_sources_timestamp
  BEFORE UPDATE ON citation_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_citation_sources_updated_at();

-- =====================================================
-- Migration Complete
-- =====================================================
-- Summary:
-- - citation_sources: Citation source tracking
-- - scout_runs: Research run history
-- - citation_audits: Gap analysis results
-- - Full RLS enforcement for workspace isolation
-- - Optimized indexes for common queries;
