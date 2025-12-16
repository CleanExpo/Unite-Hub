-- Migration 431: Observability & Audit Trails (Phase E16)
-- Comprehensive audit logging and API request tracking

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS api_request_logs CASCADE;
DROP TABLE IF EXISTS audit_events CASCADE;

-- Audit event types enum
DO $$ BEGIN
  CREATE TYPE audit_event_type AS ENUM (
    'auth.login.success',
    'auth.login.failure',
    'auth.logout',
    'auth.password.changed',
    'auth.mfa.enabled',
    'auth.mfa.disabled',
    'user.created',
    'user.updated',
    'user.deleted',
    'campaign.created',
    'campaign.updated',
    'campaign.deleted',
    'campaign.sent',
    'content.created',
    'content.updated',
    'content.deleted',
    'content.published',
    'contact.created',
    'contact.updated',
    'contact.deleted',
    'settings.updated',
    'rbac.role.assigned',
    'rbac.role.removed',
    'rbac.permission.changed',
    'export.requested',
    'export.downloaded',
    'feature_flag.changed',
    'system.config.changed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Audit Events table (comprehensive event logging)
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type audit_event_type NOT NULL,
  resource TEXT, -- e.g., 'campaign', 'contact', 'user'
  resource_id TEXT, -- UUID or identifier of affected resource
  action TEXT, -- Human-readable action description
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_events_tenant ON audit_events(tenant_id);
CREATE INDEX idx_audit_events_user ON audit_events(user_id);
CREATE INDEX idx_audit_events_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_resource ON audit_events(resource, resource_id);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);
CREATE INDEX idx_audit_events_tenant_created ON audit_events(tenant_id, created_at DESC);
CREATE INDEX idx_audit_events_tenant_type_created ON audit_events(tenant_id, event_type, created_at DESC);

-- API Request Logs table (performance and usage tracking)
CREATE TABLE api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  route TEXT NOT NULL,
  method TEXT NOT NULL, -- GET, POST, PUT, DELETE, PATCH
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_request_logs_tenant ON api_request_logs(tenant_id);
CREATE INDEX idx_api_request_logs_user ON api_request_logs(user_id);
CREATE INDEX idx_api_request_logs_route ON api_request_logs(route);
CREATE INDEX idx_api_request_logs_status ON api_request_logs(status_code);
CREATE INDEX idx_api_request_logs_created_at ON api_request_logs(created_at DESC);
CREATE INDEX idx_api_request_logs_tenant_route ON api_request_logs(tenant_id, route, created_at DESC);

-- RLS for audit_events
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_events_read_own ON audit_events
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY audit_events_system_write ON audit_events
  FOR INSERT
  WITH CHECK (TRUE); -- Allow system to insert audit events

-- RLS for api_request_logs
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_request_logs_read_own ON api_request_logs
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY api_request_logs_system_write ON api_request_logs
  FOR INSERT
  WITH CHECK (TRUE); -- Allow system to insert logs

-- Drop existing functions if they exist (prevent conflicts)
DROP FUNCTION IF EXISTS record_audit_event(UUID, UUID, audit_event_type, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS record_api_request(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_audit_summary(UUID, INTEGER);

-- Function: Record audit event
CREATE OR REPLACE FUNCTION record_audit_event(
  p_tenant_id UUID,
  p_user_id UUID,
  p_event_type audit_event_type,
  p_resource TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO audit_events (
    tenant_id,
    user_id,
    event_type,
    resource,
    resource_id,
    action,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_event_type,
    p_resource,
    p_resource_id,
    p_action,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record API request
CREATE OR REPLACE FUNCTION record_api_request(
  p_tenant_id UUID,
  p_user_id UUID,
  p_route TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_latency_ms INTEGER,
  p_request_size_bytes INTEGER DEFAULT NULL,
  p_response_size_bytes INTEGER DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO api_request_logs (
    tenant_id,
    user_id,
    route,
    method,
    status_code,
    latency_ms,
    request_size_bytes,
    response_size_bytes,
    ip_address,
    user_agent
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_route,
    p_method,
    p_status_code,
    p_latency_ms,
    p_request_size_bytes,
    p_response_size_bytes,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get audit summary
CREATE OR REPLACE FUNCTION get_audit_summary(
  p_tenant_id UUID,
  p_hours INTEGER DEFAULT 24
) RETURNS JSONB AS $$
DECLARE
  v_total_events INTEGER;
  v_auth_events INTEGER;
  v_campaign_events INTEGER;
  v_content_events INTEGER;
  v_settings_events INTEGER;
BEGIN
  -- Count events in time window
  WITH recent_events AS (
    SELECT event_type
    FROM audit_events
    WHERE tenant_id = p_tenant_id
      AND created_at > now() - (p_hours || ' hours')::interval
  )
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE event_type::TEXT LIKE 'auth.%'),
    COUNT(*) FILTER (WHERE event_type::TEXT LIKE 'campaign.%'),
    COUNT(*) FILTER (WHERE event_type::TEXT LIKE 'content.%'),
    COUNT(*) FILTER (WHERE event_type::TEXT LIKE 'settings.%')
  INTO v_total_events, v_auth_events, v_campaign_events, v_content_events, v_settings_events
  FROM recent_events;

  RETURN jsonb_build_object(
    'total_events', COALESCE(v_total_events, 0),
    'auth_events', COALESCE(v_auth_events, 0),
    'campaign_events', COALESCE(v_campaign_events, 0),
    'content_events', COALESCE(v_content_events, 0),
    'settings_events', COALESCE(v_settings_events, 0),
    'time_window_hours', p_hours
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION record_api_request TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_summary TO authenticated;

-- Auto-cleanup old logs (keep last 90 days for audit, 30 days for API logs)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_events
  WHERE created_at < now() - interval '90 days';

  DELETE FROM api_request_logs
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
