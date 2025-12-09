-- Migration 432: Backup & Export Infrastructure (Phase E17)
-- Data export and backup job management

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS export_job_items CASCADE;
DROP TABLE IF EXISTS export_jobs CASCADE;

-- Export types enum
DO $$ BEGIN
  CREATE TYPE export_type AS ENUM (
    'audience.csv',
    'campaigns.json',
    'content.json',
    'analytics.json',
    'synthex.full_tenant_export',
    'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Export job statuses
DO $$ BEGIN
  CREATE TYPE export_job_status AS ENUM ('pending', 'running', 'success', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Export Jobs table (job metadata and status)
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  type export_type NOT NULL,
  status export_job_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  export_url TEXT, -- S3/R2 URL or download link
  file_size_bytes BIGINT,
  item_count INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ -- Optional expiration for download link
);

CREATE INDEX idx_export_jobs_tenant ON export_jobs(tenant_id);
CREATE INDEX idx_export_jobs_user ON export_jobs(user_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_type ON export_jobs(type);
CREATE INDEX idx_export_jobs_requested_at ON export_jobs(requested_at DESC);
CREATE INDEX idx_export_jobs_tenant_status ON export_jobs(tenant_id, status, requested_at DESC);

-- Export Job Items table (individual exported items)
CREATE TABLE export_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES export_jobs(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'contact', 'campaign', 'content', etc.
  resource_id TEXT NOT NULL, -- UUID of exported resource
  payload JSONB NOT NULL, -- Full JSON representation of resource
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_export_job_items_job ON export_job_items(job_id);
CREATE INDEX idx_export_job_items_resource ON export_job_items(resource_type, resource_id);

-- RLS for export_jobs
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY export_jobs_read_own ON export_jobs
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY export_jobs_user_create ON export_jobs
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid() AND user_id = auth.uid());

CREATE POLICY export_jobs_system_update ON export_jobs
  FOR UPDATE
  USING (TRUE); -- Allow system to update job status

-- RLS for export_job_items
ALTER TABLE export_job_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY export_job_items_read_via_job ON export_job_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM export_jobs
      WHERE id = export_job_items.job_id
        AND tenant_id = auth.uid()
    )
  );

CREATE POLICY export_job_items_system_write ON export_job_items
  FOR INSERT
  WITH CHECK (TRUE); -- Allow system to insert items

-- Function: Queue export job
CREATE OR REPLACE FUNCTION queue_export_job(
  p_tenant_id UUID,
  p_user_id UUID,
  p_type export_type,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO export_jobs (
    tenant_id,
    user_id,
    type,
    status,
    metadata
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_type,
    'pending',
    p_metadata
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Start export job
CREATE OR REPLACE FUNCTION start_export_job(
  p_job_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE export_jobs
  SET
    status = 'running',
    started_at = now()
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Complete export job
CREATE OR REPLACE FUNCTION complete_export_job(
  p_job_id UUID,
  p_success BOOLEAN,
  p_export_url TEXT DEFAULT NULL,
  p_file_size_bytes BIGINT DEFAULT NULL,
  p_item_count INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE export_jobs
  SET
    status = CASE WHEN p_success THEN 'success'::export_job_status ELSE 'failed'::export_job_status END,
    completed_at = now(),
    export_url = p_export_url,
    file_size_bytes = p_file_size_bytes,
    item_count = p_item_count,
    error_message = p_error_message,
    expires_at = p_expires_at
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION queue_export_job TO authenticated;
GRANT EXECUTE ON FUNCTION start_export_job TO authenticated;
GRANT EXECUTE ON FUNCTION complete_export_job TO authenticated;

-- Auto-cleanup old completed exports (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_export_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM export_jobs
  WHERE completed_at < now() - interval '30 days'
    AND status IN ('success', 'failed', 'cancelled');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
