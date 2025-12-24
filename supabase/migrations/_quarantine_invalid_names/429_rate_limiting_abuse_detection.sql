-- Migration 429: Rate Limiting & Abuse Detection (Phase E14)
-- Protect API endpoints from abuse and excessive usage

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS abuse_flags CASCADE;
DROP TABLE IF EXISTS api_usage_events CASCADE;
DROP TABLE IF EXISTS api_rate_limits CASCADE;

-- Rate limit time windows
DO $$ BEGIN
  CREATE TYPE rate_limit_window AS ENUM ('second', 'minute', 'hour', 'day');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Abuse flag statuses
DO $$ BEGIN
  CREATE TYPE abuse_flag_status AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- API Rate Limits table (configurable limits per route)
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = global default
  route_pattern TEXT NOT NULL, -- e.g., '/api/synthex/assistant/run', '/api/content/generate'
  limit_count INTEGER NOT NULL, -- max requests
  time_window rate_limit_window NOT NULL DEFAULT 'minute',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, route_pattern)
);

CREATE INDEX idx_api_rate_limits_tenant ON api_rate_limits(tenant_id);
CREATE INDEX idx_api_rate_limits_route ON api_rate_limits(route_pattern);

-- API Usage Events table (tracking actual requests)
CREATE TABLE api_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  method TEXT, -- GET, POST, etc.
  ip_address TEXT,
  user_agent TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_usage_events_tenant ON api_usage_events(tenant_id);
CREATE INDEX idx_api_usage_events_user ON api_usage_events(user_id);
CREATE INDEX idx_api_usage_events_route ON api_usage_events(route);
CREATE INDEX idx_api_usage_events_tenant_route_time ON api_usage_events(tenant_id, route, occurred_at DESC);
CREATE INDEX idx_api_usage_events_user_route_time ON api_usage_events(user_id, route, occurred_at DESC);
CREATE INDEX idx_api_usage_events_occurred_at ON api_usage_events(occurred_at DESC);

-- Abuse Flags table (flagged suspicious activity)
CREATE TABLE abuse_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  status abuse_flag_status NOT NULL DEFAULT 'pending',
  event_count INTEGER NOT NULL DEFAULT 1, -- number of triggering events
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

CREATE INDEX idx_abuse_flags_tenant ON abuse_flags(tenant_id);
CREATE INDEX idx_abuse_flags_user ON abuse_flags(user_id);
CREATE INDEX idx_abuse_flags_status ON abuse_flags(status);
CREATE INDEX idx_abuse_flags_severity ON abuse_flags(severity);
CREATE INDEX idx_abuse_flags_created_at ON abuse_flags(created_at DESC);

-- RLS for api_rate_limits
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_rate_limits_read_own ON api_rate_limits
  FOR SELECT
  USING (tenant_id = auth.uid() OR tenant_id IS NULL);

CREATE POLICY api_rate_limits_admin_write ON api_rate_limits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    )
  );

-- RLS for api_usage_events
ALTER TABLE api_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_usage_events_read_own ON api_usage_events
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY api_usage_events_system_write ON api_usage_events
  FOR INSERT
  WITH CHECK (TRUE); -- Allow system to insert usage events

-- RLS for abuse_flags
ALTER TABLE abuse_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY abuse_flags_read_own ON abuse_flags
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY abuse_flags_admin_write ON abuse_flags
  FOR ALL
  USING (
    tenant_id = auth.uid() AND EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    )
  );

-- Drop existing functions with same name (from E07 migration 422)
DROP FUNCTION IF EXISTS check_rate_limit(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS check_rate_limit(UUID, UUID, TEXT);

-- Function: Check rate limit for route
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_tenant_id UUID,
  p_user_id UUID,
  p_route TEXT
) RETURNS JSONB AS $$
DECLARE
  v_limit RECORD;
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_allowed BOOLEAN := TRUE;
  v_limit_count INTEGER := 9999;
  v_current_count INTEGER := 0;
BEGIN
  -- Get limit config (tenant-specific or global default)
  SELECT * INTO v_limit
  FROM api_rate_limits
  WHERE enabled = TRUE
    AND route_pattern = p_route
    AND (tenant_id = p_tenant_id OR tenant_id IS NULL)
  ORDER BY tenant_id NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    -- No limit configured, allow
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'limit', NULL,
      'current', 0,
      'window', NULL
    );
  END IF;

  v_limit_count := v_limit.limit_count;

  -- Calculate window start based on time_window
  CASE v_limit.time_window
    WHEN 'second' THEN
      v_window_start := now() - interval '1 second';
    WHEN 'minute' THEN
      v_window_start := now() - interval '1 minute';
    WHEN 'hour' THEN
      v_window_start := now() - interval '1 hour';
    WHEN 'day' THEN
      v_window_start := now() - interval '1 day';
  END CASE;

  -- Count requests in window (by user or tenant)
  SELECT COUNT(*) INTO v_count
  FROM api_usage_events
  WHERE route = p_route
    AND occurred_at >= v_window_start
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_user_id IS NULL AND tenant_id = p_tenant_id)
    );

  v_current_count := v_count;
  v_allowed := v_count < v_limit_count;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'limit', v_limit_count,
    'current', v_current_count,
    'window', v_limit.time_window,
    'reset_at', v_window_start + (CASE v_limit.time_window
      WHEN 'second' THEN interval '1 second'
      WHEN 'minute' THEN interval '1 minute'
      WHEN 'hour' THEN interval '1 hour'
      WHEN 'day' THEN interval '1 day'
    END)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing record_usage_event function if exists
DROP FUNCTION IF EXISTS record_usage_event(UUID, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER);

-- Function: Record usage event
CREATE OR REPLACE FUNCTION record_usage_event(
  p_tenant_id UUID,
  p_user_id UUID,
  p_route TEXT,
  p_method TEXT DEFAULT 'POST',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_status_code INTEGER DEFAULT 200,
  p_response_time_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO api_usage_events (
    tenant_id,
    user_id,
    route,
    method,
    ip_address,
    user_agent,
    status_code,
    response_time_ms
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_route,
    p_method,
    p_ip_address,
    p_user_agent,
    p_status_code,
    p_response_time_ms
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing flag_abuse function if exists
DROP FUNCTION IF EXISTS flag_abuse(UUID, UUID, TEXT, TEXT, TEXT, INTEGER, JSONB);

-- Function: Create abuse flag
CREATE OR REPLACE FUNCTION flag_abuse(
  p_tenant_id UUID,
  p_user_id UUID,
  p_route TEXT,
  p_reason TEXT,
  p_severity TEXT DEFAULT 'medium',
  p_event_count INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_flag_id UUID;
BEGIN
  INSERT INTO abuse_flags (
    tenant_id,
    user_id,
    route,
    reason,
    severity,
    event_count,
    metadata
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_route,
    p_reason,
    p_severity,
    p_event_count,
    p_metadata
  )
  RETURNING id INTO v_flag_id;

  RETURN v_flag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION record_usage_event TO authenticated;
GRANT EXECUTE ON FUNCTION flag_abuse TO authenticated;

-- Seed default rate limits (global)
INSERT INTO api_rate_limits (tenant_id, route_pattern, limit_count, time_window, description)
VALUES
  -- AI endpoints (most expensive)
  (NULL, '/api/synthex/assistant/run', 10, 'minute', 'Claude assistant calls'),
  (NULL, '/api/content/generate', 20, 'minute', 'AI content generation'),
  (NULL, '/api/synthex/seo/run', 15, 'minute', 'SEO analysis'),
  (NULL, '/api/images/generate', 10, 'minute', 'AI image generation'),

  -- Standard API endpoints
  (NULL, '/api/campaigns', 60, 'minute', 'Campaign operations'),
  (NULL, '/api/contacts', 100, 'minute', 'Contact management'),
  (NULL, '/api/analytics', 60, 'minute', 'Analytics queries'),
  (NULL, '/api/content', 60, 'minute', 'Content operations'),

  -- Authentication
  (NULL, '/api/auth/login', 5, 'minute', 'Login attempts'),
  (NULL, '/api/auth/register', 3, 'hour', 'Registration attempts')
ON CONFLICT (tenant_id, route_pattern) DO NOTHING;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_rate_limit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_rate_limits_updated_at
  BEFORE UPDATE ON api_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limit_timestamp();

-- Auto-cleanup old usage events (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_usage_events()
RETURNS void AS $$
BEGIN
  DELETE FROM api_usage_events
  WHERE occurred_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
