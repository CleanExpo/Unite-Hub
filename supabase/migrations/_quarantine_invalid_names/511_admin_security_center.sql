-- Migration 511: Admin Security Center (Phase E20)
-- User session tracking, security event monitoring

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Security event types
DO $$ BEGIN
  CREATE TYPE security_event_type AS ENUM (
    'login_success',
    'login_failure',
    'logout',
    'mfa_enabled',
    'mfa_disabled',
    'mfa_verified',
    'mfa_failed',
    'password_changed',
    'password_reset_requested',
    'password_reset_completed',
    'email_changed',
    'permission_granted',
    'permission_revoked',
    'session_created',
    'session_invalidated',
    'api_key_created',
    'api_key_revoked',
    'suspicious_activity',
    'account_locked',
    'account_unlocked',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Security event severity
DO $$ BEGIN
  CREATE TYPE security_event_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Session status
DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('active', 'expired', 'revoked', 'logged_out');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User Sessions table
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  status session_status NOT NULL DEFAULT 'active',
  device_info TEXT,
  browser_info TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  invalidated_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_sessions_tenant ON user_sessions(tenant_id);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_status ON user_sessions(status);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_active ON user_sessions(tenant_id, status, last_active_at DESC);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Security Events table
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type security_event_type NOT NULL,
  severity security_event_severity NOT NULL DEFAULT 'info',
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  resource TEXT, -- e.g., 'campaign', 'contact', 'settings'
  resource_id TEXT,
  success BOOLEAN DEFAULT TRUE,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_events_tenant ON security_events(tenant_id);
CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX idx_security_events_tenant_type ON security_events(tenant_id, event_type, created_at DESC);
CREATE INDEX idx_security_events_tenant_severity ON security_events(tenant_id, severity, created_at DESC);

-- RLS for user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_read_own ON user_sessions
  FOR SELECT
  USING (tenant_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY sessions_tenant_manage ON user_sessions
  FOR ALL
  USING (tenant_id = auth.uid());

-- RLS for security_events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY security_events_read_own ON security_events
  FOR SELECT
  USING (tenant_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY security_events_system_write ON security_events
  FOR INSERT
  WITH CHECK (TRUE); -- Allow system to insert events

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_user_session(UUID, UUID, TEXT, TEXT, TEXT, INET, TEXT, TEXT, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS invalidate_session(UUID, UUID);
DROP FUNCTION IF EXISTS record_security_event(UUID, UUID, security_event_type, security_event_severity, TEXT, INET, TEXT, UUID, TEXT, TEXT, BOOLEAN, TEXT, JSONB);
DROP FUNCTION IF EXISTS get_active_sessions(UUID);
DROP FUNCTION IF EXISTS get_security_event_summary(UUID, INTEGER);
DROP FUNCTION IF EXISTS cleanup_expired_sessions();

-- Function: Create user session
CREATE OR REPLACE FUNCTION create_user_session(
  p_tenant_id UUID,
  p_user_id UUID,
  p_session_token TEXT,
  p_device_info TEXT DEFAULT NULL,
  p_browser_info TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO user_sessions (
    tenant_id,
    user_id,
    session_token,
    device_info,
    browser_info,
    ip_address,
    country,
    city,
    expires_at,
    metadata
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_session_token,
    p_device_info,
    p_browser_info,
    p_ip_address,
    p_country,
    p_city,
    p_expires_at,
    p_metadata
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Invalidate session
CREATE OR REPLACE FUNCTION invalidate_session(
  p_session_id UUID,
  p_tenant_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET status = 'revoked',
      invalidated_at = now()
  WHERE id = p_session_id
    AND tenant_id = p_tenant_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record security event
CREATE OR REPLACE FUNCTION record_security_event(
  p_tenant_id UUID,
  p_user_id UUID,
  p_event_type security_event_type,
  p_severity security_event_severity DEFAULT 'info',
  p_description TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id UUID DEFAULT NULL,
  p_resource TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_failure_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO security_events (
    tenant_id,
    user_id,
    event_type,
    severity,
    description,
    ip_address,
    user_agent,
    session_id,
    resource,
    resource_id,
    success,
    failure_reason,
    metadata
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_event_type,
    p_severity,
    p_description,
    p_ip_address,
    p_user_agent,
    p_session_id,
    p_resource,
    p_resource_id,
    p_success,
    p_failure_reason,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get active sessions for tenant
CREATE OR REPLACE FUNCTION get_active_sessions(
  p_tenant_id UUID
) RETURNS TABLE (
  session_id UUID,
  user_id UUID,
  device_info TEXT,
  browser_info TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    user_sessions.user_id,
    user_sessions.device_info,
    user_sessions.browser_info,
    user_sessions.ip_address,
    user_sessions.country,
    user_sessions.city,
    user_sessions.last_active_at,
    user_sessions.created_at,
    user_sessions.expires_at
  FROM user_sessions
  WHERE tenant_id = p_tenant_id
    AND status = 'active'
    AND expires_at > now()
  ORDER BY last_active_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get security event summary
CREATE OR REPLACE FUNCTION get_security_event_summary(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
  v_total INTEGER;
  v_critical INTEGER;
  v_warnings INTEGER;
  v_failed_logins INTEGER;
  v_by_type JSONB;
BEGIN
  -- Count by severity
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE severity = 'critical'),
    COUNT(*) FILTER (WHERE severity = 'warning'),
    COUNT(*) FILTER (WHERE event_type = 'login_failure')
  INTO v_total, v_critical, v_warnings, v_failed_logins
  FROM security_events
  WHERE tenant_id = p_tenant_id
    AND created_at > now() - (p_days || ' days')::interval;

  -- Count by event type
  SELECT jsonb_object_agg(event_type, count)
  INTO v_by_type
  FROM (
    SELECT event_type::TEXT, COUNT(*) as count
    FROM security_events
    WHERE tenant_id = p_tenant_id
      AND created_at > now() - (p_days || ' days')::interval
    GROUP BY event_type
  ) t;

  RETURN jsonb_build_object(
    'total', COALESCE(v_total, 0),
    'critical', COALESCE(v_critical, 0),
    'warnings', COALESCE(v_warnings, 0),
    'failed_logins', COALESCE(v_failed_logins, 0),
    'by_type', COALESCE(v_by_type, '{}'::jsonb),
    'period_days', p_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION invalidate_session TO authenticated;
GRANT EXECUTE ON FUNCTION record_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION get_security_event_summary TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions TO authenticated;

-- Trigger to update last_active_at
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_activity_updated
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  WHEN (OLD.status = 'active' AND NEW.status = 'active')
  EXECUTE FUNCTION update_session_activity();

-- Auto-expire sessions (cron job helper)
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Run periodically via cron to mark expired sessions. Call: SELECT cleanup_expired_sessions();';
