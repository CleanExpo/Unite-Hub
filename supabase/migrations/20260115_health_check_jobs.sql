/**
 * Health Check Jobs Table
 * Tracks individual health check analysis jobs for status polling
 *
 * Tables:
 * - health_check_jobs: Job metadata and status
 * - Relationships: health_check_results (1:1)
 */

-- Create health check job status enum
DO $$ BEGIN
  CREATE TYPE health_check_status AS ENUM (
    'pending',    -- Queued, waiting to start
    'running',    -- Currently analyzing
    'completed',  -- Successfully finished
    'failed',     -- Analysis failed
    'cancelled'   -- User cancelled
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create health check jobs table
CREATE TABLE IF NOT EXISTS health_check_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Job metadata
  url TEXT NOT NULL,
  domain TEXT NOT NULL, -- Extracted from URL for indexing

  -- Status tracking
  status health_check_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Configuration
  include_competitors BOOLEAN DEFAULT true,
  analyze_threats BOOLEAN DEFAULT true,

  -- Error handling
  error_message TEXT,
  error_code TEXT,

  -- Performance tracking
  duration_ms INTEGER, -- Duration in milliseconds

  -- Metadata
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,

  -- Audit
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_health_check_jobs_workspace ON health_check_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_health_check_jobs_status ON health_check_jobs(status);
CREATE INDEX IF NOT EXISTS idx_health_check_jobs_domain ON health_check_jobs(domain);
CREATE INDEX IF NOT EXISTS idx_health_check_jobs_created ON health_check_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_check_jobs_workspace_status ON health_check_jobs(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_health_check_jobs_url_workspace ON health_check_jobs(url, workspace_id);

-- Enable Row Level Security
ALTER TABLE health_check_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their workspace's jobs
DROP POLICY IF EXISTS "tenant_isolation" ON health_check_jobs;
CREATE POLICY "tenant_isolation" ON health_check_jobs
  FOR ALL USING (workspace_id = get_current_workspace_id());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_health_check_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS health_check_jobs_updated_at_trigger ON health_check_jobs;
CREATE TRIGGER health_check_jobs_updated_at_trigger
  BEFORE UPDATE ON health_check_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_health_check_jobs_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON health_check_jobs TO authenticated;
GRANT SELECT ON health_check_jobs TO anon;

-- Comments
COMMENT ON TABLE health_check_jobs IS 'Tracks health check analysis jobs and their status';
COMMENT ON COLUMN health_check_jobs.workspace_id IS 'Workspace this job belongs to (multi-tenant isolation)';
COMMENT ON COLUMN health_check_jobs.status IS 'Current job status: pending → running → completed/failed';
COMMENT ON COLUMN health_check_jobs.duration_ms IS 'Total time to complete analysis in milliseconds';
