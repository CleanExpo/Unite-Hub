-- Migration 434: Compliance Center Core (Phase E19)
-- GDPR/CCPA data subject requests, consent logs, compliance tasks

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS compliance_tasks CASCADE;
DROP TABLE IF EXISTS consent_logs CASCADE;
DROP TABLE IF EXISTS data_subject_requests CASCADE;

-- Data subject request types
DO $$ BEGIN
  CREATE TYPE dsr_type AS ENUM (
    'access',
    'rectification',
    'erasure',
    'export',
    'restriction',
    'portability',
    'objection',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Data subject request statuses
DO $$ BEGIN
  CREATE TYPE dsr_status AS ENUM ('open', 'in_progress', 'resolved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Requester types
DO $$ BEGIN
  CREATE TYPE requester_type AS ENUM ('user', 'contact', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Consent channels
DO $$ BEGIN
  CREATE TYPE consent_channel AS ENUM ('email', 'sms', 'social', 'web', 'api', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Compliance task statuses
DO $$ BEGIN
  CREATE TYPE compliance_task_status AS ENUM ('open', 'in_progress', 'done', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Data Subject Requests table
CREATE TABLE data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_type requester_type NOT NULL,
  requester_identifier TEXT NOT NULL, -- email, phone, user_id, etc.
  type dsr_type NOT NULL,
  status dsr_status NOT NULL DEFAULT 'open',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dsr_tenant ON data_subject_requests(tenant_id);
CREATE INDEX idx_dsr_status ON data_subject_requests(status);
CREATE INDEX idx_dsr_type ON data_subject_requests(type);
CREATE INDEX idx_dsr_received_at ON data_subject_requests(received_at DESC);
CREATE INDEX idx_dsr_tenant_status ON data_subject_requests(tenant_id, status, received_at DESC);
CREATE INDEX idx_dsr_requester ON data_subject_requests(tenant_id, requester_identifier);

-- Consent Logs table
CREATE TABLE consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_identifier TEXT NOT NULL, -- email, user_id, phone, etc.
  channel consent_channel NOT NULL,
  purpose TEXT NOT NULL, -- 'marketing_emails', 'analytics', 'data_processing', etc.
  granted BOOLEAN NOT NULL,
  source TEXT, -- 'signup_form', 'preference_center', 'api', etc.
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_tenant ON consent_logs(tenant_id);
CREATE INDEX idx_consent_subject ON consent_logs(tenant_id, subject_identifier);
CREATE INDEX idx_consent_purpose ON consent_logs(tenant_id, purpose);
CREATE INDEX idx_consent_created_at ON consent_logs(created_at DESC);
CREATE INDEX idx_consent_tenant_subject_purpose ON consent_logs(tenant_id, subject_identifier, purpose, created_at DESC);

-- Compliance Tasks table
CREATE TABLE compliance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dsr_id UUID NOT NULL REFERENCES data_subject_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status compliance_task_status NOT NULL DEFAULT 'open',
  assignee UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_compliance_tasks_tenant ON compliance_tasks(tenant_id);
CREATE INDEX idx_compliance_tasks_dsr ON compliance_tasks(dsr_id);
CREATE INDEX idx_compliance_tasks_status ON compliance_tasks(status);
CREATE INDEX idx_compliance_tasks_assignee ON compliance_tasks(assignee);
CREATE INDEX idx_compliance_tasks_due_at ON compliance_tasks(due_at);

-- RLS for data_subject_requests
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY dsr_read_own ON data_subject_requests
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY dsr_user_write ON data_subject_requests
  FOR ALL
  USING (tenant_id = auth.uid());

-- RLS for consent_logs
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY consent_read_own ON consent_logs
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY consent_system_write ON consent_logs
  FOR INSERT
  WITH CHECK (TRUE); -- Allow system to insert consent logs

-- RLS for compliance_tasks
ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY compliance_tasks_read_own ON compliance_tasks
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY compliance_tasks_user_write ON compliance_tasks
  FOR ALL
  USING (tenant_id = auth.uid());

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_data_subject_request(UUID, requester_type, TEXT, dsr_type, TEXT, JSONB);
DROP FUNCTION IF EXISTS record_consent(UUID, TEXT, consent_channel, TEXT, BOOLEAN, TEXT, INET, TEXT, JSONB);
DROP FUNCTION IF EXISTS get_latest_consent(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_dsr_statistics(UUID);

-- Function: Create data subject request
CREATE OR REPLACE FUNCTION create_data_subject_request(
  p_tenant_id UUID,
  p_requester_type requester_type,
  p_requester_identifier TEXT,
  p_type dsr_type,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_dsr_id UUID;
BEGIN
  INSERT INTO data_subject_requests (
    tenant_id,
    requester_type,
    requester_identifier,
    type,
    notes,
    metadata
  ) VALUES (
    p_tenant_id,
    p_requester_type,
    p_requester_identifier,
    p_type,
    p_notes,
    p_metadata
  )
  RETURNING id INTO v_dsr_id;

  RETURN v_dsr_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record consent
CREATE OR REPLACE FUNCTION record_consent(
  p_tenant_id UUID,
  p_subject_identifier TEXT,
  p_channel consent_channel,
  p_purpose TEXT,
  p_granted BOOLEAN,
  p_source TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO consent_logs (
    tenant_id,
    subject_identifier,
    channel,
    purpose,
    granted,
    source,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_tenant_id,
    p_subject_identifier,
    p_channel,
    p_purpose,
    p_granted,
    p_source,
    p_ip_address,
    p_user_agent,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get latest consent for subject/purpose
CREATE OR REPLACE FUNCTION get_latest_consent(
  p_tenant_id UUID,
  p_subject_identifier TEXT,
  p_purpose TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_granted BOOLEAN;
BEGIN
  SELECT granted INTO v_granted
  FROM consent_logs
  WHERE tenant_id = p_tenant_id
    AND subject_identifier = p_subject_identifier
    AND purpose = p_purpose
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN COALESCE(v_granted, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get DSR statistics
CREATE OR REPLACE FUNCTION get_dsr_statistics(
  p_tenant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_total INTEGER;
  v_open INTEGER;
  v_in_progress INTEGER;
  v_resolved INTEGER;
  v_by_type JSONB;
BEGIN
  -- Count by status
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'open'),
    COUNT(*) FILTER (WHERE status = 'in_progress'),
    COUNT(*) FILTER (WHERE status = 'resolved')
  INTO v_total, v_open, v_in_progress, v_resolved
  FROM data_subject_requests
  WHERE tenant_id = p_tenant_id;

  -- Count by type
  SELECT jsonb_object_agg(type, count)
  INTO v_by_type
  FROM (
    SELECT type::TEXT, COUNT(*) as count
    FROM data_subject_requests
    WHERE tenant_id = p_tenant_id
    GROUP BY type
  ) t;

  RETURN jsonb_build_object(
    'total', COALESCE(v_total, 0),
    'open', COALESCE(v_open, 0),
    'in_progress', COALESCE(v_in_progress, 0),
    'resolved', COALESCE(v_resolved, 0),
    'by_type', COALESCE(v_by_type, '{}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_data_subject_request TO authenticated;
GRANT EXECUTE ON FUNCTION record_consent TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_consent TO authenticated;
GRANT EXECUTE ON FUNCTION get_dsr_statistics TO authenticated;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_dsr_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dsr_updated_at
  BEFORE UPDATE ON data_subject_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_dsr_timestamp();

CREATE OR REPLACE FUNCTION update_compliance_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compliance_tasks_updated_at
  BEFORE UPDATE ON compliance_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_task_timestamp();

-- Auto-cleanup old resolved DSRs (keep 2 years for compliance)
CREATE OR REPLACE FUNCTION cleanup_old_dsrs()
RETURNS void AS $$
BEGIN
  DELETE FROM data_subject_requests
  WHERE resolved_at < now() - interval '2 years'
    AND status = 'resolved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
