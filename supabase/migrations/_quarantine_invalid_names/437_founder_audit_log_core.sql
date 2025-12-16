-- Migration 437: Founder Audit Log Center (Phase E22)
-- Unified audit logging for governance and founder-level actions

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Audit log categories
DO $$ BEGIN
  CREATE TYPE audit_category AS ENUM (
    'authentication',
    'authorization',
    'data_access',
    'data_modification',
    'configuration',
    'compliance',
    'security',
    'billing',
    'incident',
    'policy',
    'notification',
    'rate_limit',
    'integration',
    'export',
    'import',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who performed the action
  category audit_category NOT NULL,
  action TEXT NOT NULL, -- e.g., "created_dsr", "invalidated_session", "resolved_incident"
  resource TEXT, -- e.g., "data_subject_request", "user_session", "incident"
  resource_id TEXT, -- ID of affected resource
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_read_own ON audit_logs
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY audit_logs_insert_own ON audit_logs
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- Drop existing functions if they exist (drop all overloaded variants)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS record_audit_event CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_audit_statistics CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Function: Record audit event
CREATE OR REPLACE FUNCTION record_audit_event(
  p_tenant_id UUID,
  p_actor UUID,
  p_category audit_category,
  p_action TEXT,
  p_resource TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    tenant_id,
    actor,
    category,
    action,
    resource,
    resource_id,
    description,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_tenant_id,
    p_actor,
    p_category,
    p_action,
    p_resource,
    p_resource_id,
    p_description,
    p_ip_address,
    p_user_agent,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get audit statistics
CREATE OR REPLACE FUNCTION get_audit_statistics(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
  v_total INTEGER;
  v_by_category JSONB;
  v_by_actor JSONB;
  v_recent_actions JSONB;
BEGIN
  -- Total logs in period
  SELECT COUNT(*)
  INTO v_total
  FROM audit_logs
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - (p_days || ' days')::interval;

  -- Count by category
  SELECT jsonb_object_agg(category, count)
  INTO v_by_category
  FROM (
    SELECT category::TEXT, COUNT(*) as count
    FROM audit_logs
    WHERE tenant_id = p_tenant_id
      AND created_at >= now() - (p_days || ' days')::interval
    GROUP BY category
  ) t;

  -- Count by actor (top 10)
  SELECT jsonb_agg(actor_data)
  INTO v_by_actor
  FROM (
    SELECT jsonb_build_object(
      'actor', actor,
      'count', COUNT(*)
    ) as actor_data
    FROM audit_logs
    WHERE tenant_id = p_tenant_id
      AND created_at >= now() - (p_days || ' days')::interval
      AND actor IS NOT NULL
    GROUP BY actor
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) t;

  -- Most recent actions (last 5)
  SELECT jsonb_agg(action_data)
  INTO v_recent_actions
  FROM (
    SELECT jsonb_build_object(
      'action', action,
      'category', category,
      'created_at', created_at
    ) as action_data
    FROM audit_logs
    WHERE tenant_id = p_tenant_id
    ORDER BY created_at DESC
    LIMIT 5
  ) t;

  RETURN jsonb_build_object(
    'total', COALESCE(v_total, 0),
    'by_category', COALESCE(v_by_category, '{}'::jsonb),
    'by_actor', COALESCE(v_by_actor, '[]'::jsonb),
    'recent_actions', COALESCE(v_recent_actions, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_statistics TO authenticated;

-- Auto-cleanup old audit logs (keep 1 year for compliance)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs() RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < now() - interval '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_audit_logs() IS 'Run periodically via cron to delete audit logs >1 year old. Call: SELECT cleanup_old_audit_logs();';
