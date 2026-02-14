-- Migration 080: Auto Generation Jobs
-- Required by Phase 24 - Automated Asset Generation Pipelines (AAGP)
-- Tracks automated asset-generation requests initiated by MAOS

CREATE TABLE IF NOT EXISTS auto_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  category TEXT NOT NULL,
  use_case TEXT NOT NULL,
  requested_by_agent TEXT NOT NULL,
  trigger_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status constraint
  CONSTRAINT auto_generation_jobs_status_check CHECK (
    status IN ('started', 'waiting_approval', 'completed')
  ),

  -- Unique constraint per org/category/use_case
  CONSTRAINT auto_generation_jobs_unique UNIQUE (org_id, category, use_case),

  -- Foreign key
  CONSTRAINT auto_generation_jobs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auto_jobs_org_id ON auto_generation_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_auto_jobs_status ON auto_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_auto_jobs_created ON auto_generation_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE auto_generation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY auto_jobs_select ON auto_generation_jobs
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY auto_jobs_insert ON auto_generation_jobs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY auto_jobs_update ON auto_generation_jobs
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_auto_generation_jobs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_generation_jobs_timestamp
  BEFORE UPDATE ON auto_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_auto_generation_jobs_timestamp();

-- Comment
COMMENT ON TABLE auto_generation_jobs IS 'Tracks automated asset-generation requests initiated by MAOS (Phase 24)';
