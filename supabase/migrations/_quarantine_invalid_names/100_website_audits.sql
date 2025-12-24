-- Website Audits Table
-- Phase 15-17 New Feature: Website Input + Automated Audit Module

-- Create website_audits table
CREATE TABLE IF NOT EXISTS website_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  audit_types TEXT[] NOT NULL DEFAULT ARRAY['seo', 'technical'],
  depth INTEGER NOT NULL DEFAULT 10,
  include_screenshots BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),

  -- Scores
  scores JSONB NOT NULL DEFAULT '{
    "overall": 0,
    "seo": 0,
    "technical": 0,
    "geo": 0,
    "content": 0,
    "accessibility": 0,
    "performance": 0
  }'::JSONB,

  -- Results
  issues JSONB NOT NULL DEFAULT '[]'::JSONB,
  recommendations JSONB NOT NULL DEFAULT '[]'::JSONB,
  raw_data JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_url CHECK (url ~ '^https?://')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_website_audits_workspace_id ON website_audits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_website_audits_status ON website_audits(status);
CREATE INDEX IF NOT EXISTS idx_website_audits_created_at ON website_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_audits_url ON website_audits(url);

-- Enable RLS
ALTER TABLE website_audits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view audits in their workspace
CREATE POLICY "Users can view workspace audits"
ON website_audits
FOR SELECT
USING (
  workspace_id IN (
    SELECT w.id
    FROM workspaces w
    JOIN user_organizations uo ON uo.organization_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Users can create audits in their workspace
CREATE POLICY "Users can create workspace audits"
ON website_audits
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT w.id
    FROM workspaces w
    JOIN user_organizations uo ON uo.organization_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Users can update audits in their workspace
CREATE POLICY "Users can update workspace audits"
ON website_audits
FOR UPDATE
USING (
  workspace_id IN (
    SELECT w.id
    FROM workspaces w
    JOIN user_organizations uo ON uo.organization_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Users can delete audits in their workspace
CREATE POLICY "Users can delete workspace audits"
ON website_audits
FOR DELETE
USING (
  workspace_id IN (
    SELECT w.id
    FROM workspaces w
    JOIN user_organizations uo ON uo.organization_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Add audit trigger for updated_at
CREATE OR REPLACE FUNCTION update_website_audits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_website_audits_updated_at ON website_audits;
CREATE TRIGGER trigger_update_website_audits_updated_at
  BEFORE UPDATE ON website_audits
  FOR EACH ROW
  EXECUTE FUNCTION update_website_audits_updated_at();

-- Comments
COMMENT ON TABLE website_audits IS 'Stores website audit results for SEO, technical, GEO, and content analysis';
COMMENT ON COLUMN website_audits.audit_types IS 'Array of audit types: seo, technical, geo, content, full';
COMMENT ON COLUMN website_audits.depth IS 'Number of pages to crawl';
COMMENT ON COLUMN website_audits.scores IS 'JSON object with scores for each audit category (0-100)';
COMMENT ON COLUMN website_audits.issues IS 'Array of audit issues found';
COMMENT ON COLUMN website_audits.recommendations IS 'Array of recommended actions';
COMMENT ON COLUMN website_audits.raw_data IS 'Raw audit data from crawlers and analyzers';
