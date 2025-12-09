-- Migration 515: Data Retention & Deletion Center (Phase E26)
-- Tenant-scoped data retention policies and deletion job tracking

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS data_deletion_jobs CASCADE;
DROP TABLE IF EXISTS data_retention_policies CASCADE;

-- Data retention policy status
DO $$ BEGIN
  CREATE TYPE retention_policy_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Data deletion job status
DO $$ BEGIN
  CREATE TYPE deletion_job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Data categories for retention
DO $$ BEGIN
  CREATE TYPE data_category AS ENUM (
    'audit_logs',
    'security_events',
    'incidents',
    'notifications',
    'rate_limit_events',
    'policy_triggers',
    'webhook_events',
    'compliance_records',
    'marketing_events',
    'analytics_data',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Data retention policies table
CREATE TABLE data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category data_category NOT NULL,
  retention_days INTEGER NOT NULL CHECK (retention_days >= 0),
  status retention_policy_status NOT NULL DEFAULT 'active',
  description TEXT,
  auto_delete BOOLEAN NOT NULL DEFAULT FALSE, -- Automatically delete data after retention period
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, category)
);

CREATE INDEX idx_data_retention_policies_tenant ON data_retention_policies(tenant_id);
CREATE INDEX idx_data_retention_policies_category ON data_retention_policies(category);
CREATE INDEX idx_data_retention_policies_status ON data_retention_policies(status);
CREATE INDEX idx_data_retention_policies_tenant_active ON data_retention_policies(tenant_id, status) WHERE status = 'active';

-- Data deletion jobs table
CREATE TABLE data_deletion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES data_retention_policies(id) ON DELETE SET NULL,
  category data_category NOT NULL,
  status deletion_job_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  deleted_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_data_deletion_jobs_tenant ON data_deletion_jobs(tenant_id, created_at DESC);
CREATE INDEX idx_data_deletion_jobs_category ON data_deletion_jobs(category);
CREATE INDEX idx_data_deletion_jobs_status ON data_deletion_jobs(status);
CREATE INDEX idx_data_deletion_jobs_tenant_status ON data_deletion_jobs(tenant_id, status, created_at DESC);

-- RLS for data_retention_policies
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_retention_policies_read_own ON data_retention_policies
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY data_retention_policies_tenant_manage ON data_retention_policies
  FOR ALL
  USING (tenant_id = auth.uid());

-- RLS for data_deletion_jobs
ALTER TABLE data_deletion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_deletion_jobs_read_own ON data_deletion_jobs
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY data_deletion_jobs_insert_own ON data_deletion_jobs
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY data_deletion_jobs_update_own ON data_deletion_jobs
  FOR UPDATE
  USING (tenant_id = auth.uid());

-- Drop existing functions if they exist
DO $$
BEGIN
  DROP FUNCTION IF EXISTS create_retention_policy CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS schedule_deletion_job CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_retention_statistics CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Function: Create or update retention policy
CREATE OR REPLACE FUNCTION create_retention_policy(
  p_tenant_id UUID,
  p_category data_category,
  p_retention_days INTEGER,
  p_auto_delete BOOLEAN DEFAULT FALSE,
  p_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_policy_id UUID;
BEGIN
  INSERT INTO data_retention_policies (
    tenant_id,
    category,
    retention_days,
    auto_delete,
    description,
    status
  ) VALUES (
    p_tenant_id,
    p_category,
    p_retention_days,
    p_auto_delete,
    p_description,
    'active'
  )
  ON CONFLICT (tenant_id, category)
  DO UPDATE SET
    retention_days = EXCLUDED.retention_days,
    auto_delete = EXCLUDED.auto_delete,
    description = EXCLUDED.description,
    status = 'active',
    updated_at = now()
  RETURNING id INTO v_policy_id;

  RETURN v_policy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Schedule deletion job
CREATE OR REPLACE FUNCTION schedule_deletion_job(
  p_tenant_id UUID,
  p_category data_category,
  p_policy_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO data_deletion_jobs (
    tenant_id,
    policy_id,
    category,
    status
  ) VALUES (
    p_tenant_id,
    p_policy_id,
    p_category,
    'pending'
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get retention statistics
CREATE OR REPLACE FUNCTION get_retention_statistics(
  p_tenant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_total_policies INTEGER;
  v_active_policies INTEGER;
  v_total_jobs INTEGER;
  v_pending_jobs INTEGER;
  v_completed_jobs INTEGER;
  v_by_category JSONB;
BEGIN
  -- Count policies
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'active')
  INTO v_total_policies, v_active_policies
  FROM data_retention_policies
  WHERE tenant_id = p_tenant_id;

  -- Count jobs
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_jobs, v_pending_jobs, v_completed_jobs
  FROM data_deletion_jobs
  WHERE tenant_id = p_tenant_id;

  -- Count by category
  SELECT jsonb_object_agg(category, count)
  INTO v_by_category
  FROM (
    SELECT category::TEXT, COUNT(*) as count
    FROM data_retention_policies
    WHERE tenant_id = p_tenant_id
      AND status = 'active'
    GROUP BY category
  ) t;

  RETURN jsonb_build_object(
    'total_policies', COALESCE(v_total_policies, 0),
    'active_policies', COALESCE(v_active_policies, 0),
    'total_jobs', COALESCE(v_total_jobs, 0),
    'pending_jobs', COALESCE(v_pending_jobs, 0),
    'completed_jobs', COALESCE(v_completed_jobs, 0),
    'by_category', COALESCE(v_by_category, '{}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_retention_policy TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_deletion_job TO authenticated;
GRANT EXECUTE ON FUNCTION get_retention_statistics TO authenticated;

-- Trigger to update data_retention_policies.updated_at
CREATE OR REPLACE FUNCTION update_retention_policy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER retention_policy_updated_at
  BEFORE UPDATE ON data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_retention_policy_timestamp();

-- Insert default retention policies for common categories
-- These can be overridden per tenant
COMMENT ON TABLE data_retention_policies IS 'Tenant-scoped data retention policies. Default retention periods: audit_logs=365d, security_events=180d, incidents=365d, notifications=90d';
COMMENT ON TABLE data_deletion_jobs IS 'Tracks deletion jobs for data retention enforcement. Jobs can be manual or automated.';
