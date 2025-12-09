-- Migration 438: Global Rate Limiting Layer (Phase E23)
-- Tenant-aware and global rate limiting with abuse prevention

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS rate_limit_events CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;

-- Rate limit scope
DO $$ BEGIN
  CREATE TYPE rate_limit_scope AS ENUM ('global', 'tenant', 'user', 'ip');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rate limit window type
DO $$ BEGIN
  CREATE TYPE rate_limit_window AS ENUM ('second', 'minute', 'hour', 'day');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rate limit rules table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for global rules
  scope rate_limit_scope NOT NULL,
  identifier TEXT NOT NULL, -- resource identifier (e.g., "api:campaigns:create", "email:send")
  max_requests INTEGER NOT NULL,
  window_size INTEGER NOT NULL,
  window_type rate_limit_window NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_tenant ON rate_limits(tenant_id);
CREATE INDEX idx_rate_limits_scope ON rate_limits(scope);
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_enabled ON rate_limits(enabled);

-- Rate limit events table (tracking usage)
CREATE TABLE rate_limit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for global tracking
  scope rate_limit_scope NOT NULL,
  identifier TEXT NOT NULL,
  subject TEXT NOT NULL, -- Who triggered it (user_id, ip_address, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limit_events_tenant ON rate_limit_events(tenant_id, created_at DESC);
CREATE INDEX idx_rate_limit_events_scope ON rate_limit_events(scope);
CREATE INDEX idx_rate_limit_events_identifier ON rate_limit_events(identifier);
CREATE INDEX idx_rate_limit_events_subject ON rate_limit_events(subject, created_at DESC);
CREATE INDEX idx_rate_limit_events_created_at ON rate_limit_events(created_at DESC);

-- RLS for rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY rate_limits_read_own ON rate_limits
  FOR SELECT
  USING (tenant_id = auth.uid() OR tenant_id IS NULL);

CREATE POLICY rate_limits_tenant_manage ON rate_limits
  FOR ALL
  USING (tenant_id = auth.uid());

-- RLS for rate_limit_events
ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY rate_limit_events_read_own ON rate_limit_events
  FOR SELECT
  USING (tenant_id = auth.uid() OR tenant_id IS NULL);

CREATE POLICY rate_limit_events_insert_own ON rate_limit_events
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid() OR tenant_id IS NULL);

-- Drop existing functions if they exist (drop all overloaded variants)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS check_rate_limit CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS record_rate_event CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_rate_limit_statistics CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS cleanup_old_rate_events CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Function: Check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_tenant_id UUID,
  p_scope rate_limit_scope,
  p_identifier TEXT,
  p_subject TEXT
) RETURNS JSONB AS $$
DECLARE
  v_rule RECORD;
  v_window_start TIMESTAMPTZ;
  v_event_count INTEGER;
  v_allowed BOOLEAN;
  v_limit INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Find applicable rule (tenant-specific first, then global)
  SELECT * INTO v_rule
  FROM rate_limits
  WHERE identifier = p_identifier
    AND scope = p_scope
    AND enabled = TRUE
    AND (tenant_id = p_tenant_id OR tenant_id IS NULL)
  ORDER BY tenant_id NULLS LAST
  LIMIT 1;

  -- If no rule found, allow by default
  IF v_rule IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'limit', NULL,
      'remaining', NULL,
      'reset_at', NULL
    );
  END IF;

  -- Calculate window start based on window type
  CASE v_rule.window_type
    WHEN 'second' THEN
      v_window_start := now() - (v_rule.window_size || ' seconds')::interval;
    WHEN 'minute' THEN
      v_window_start := now() - (v_rule.window_size || ' minutes')::interval;
    WHEN 'hour' THEN
      v_window_start := now() - (v_rule.window_size || ' hours')::interval;
    WHEN 'day' THEN
      v_window_start := now() - (v_rule.window_size || ' days')::interval;
  END CASE;

  -- Count events in window
  SELECT COUNT(*) INTO v_event_count
  FROM rate_limit_events
  WHERE identifier = p_identifier
    AND scope = p_scope
    AND subject = p_subject
    AND (tenant_id = p_tenant_id OR tenant_id IS NULL)
    AND created_at >= v_window_start;

  v_allowed := v_event_count < v_rule.max_requests;
  v_limit := v_rule.max_requests;
  v_remaining := GREATEST(0, v_rule.max_requests - v_event_count - 1);

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'limit', v_limit,
    'remaining', v_remaining,
    'reset_at', v_window_start + (v_rule.window_size || ' ' || v_rule.window_type::TEXT)::interval,
    'current_count', v_event_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record rate limit event
CREATE OR REPLACE FUNCTION record_rate_event(
  p_tenant_id UUID,
  p_scope rate_limit_scope,
  p_identifier TEXT,
  p_subject TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO rate_limit_events (
    tenant_id,
    scope,
    identifier,
    subject,
    metadata
  ) VALUES (
    p_tenant_id,
    p_scope,
    p_identifier,
    p_subject,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get rate limit statistics
CREATE OR REPLACE FUNCTION get_rate_limit_statistics(
  p_tenant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_total_events INTEGER;
  v_unique_subjects INTEGER;
  v_by_identifier JSONB;
  v_recent_events JSONB;
BEGIN
  -- Total events (last 24 hours)
  SELECT COUNT(*), COUNT(DISTINCT subject)
  INTO v_total_events, v_unique_subjects
  FROM rate_limit_events
  WHERE (tenant_id = p_tenant_id OR tenant_id IS NULL)
    AND created_at >= now() - interval '24 hours';

  -- Count by identifier (top 10)
  SELECT jsonb_agg(identifier_data)
  INTO v_by_identifier
  FROM (
    SELECT jsonb_build_object(
      'identifier', identifier,
      'count', COUNT(*)
    ) as identifier_data
    FROM rate_limit_events
    WHERE (tenant_id = p_tenant_id OR tenant_id IS NULL)
      AND created_at >= now() - interval '24 hours'
    GROUP BY identifier
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) t;

  -- Recent events (last 10)
  SELECT jsonb_agg(event_data)
  INTO v_recent_events
  FROM (
    SELECT jsonb_build_object(
      'identifier', identifier,
      'subject', subject,
      'created_at', created_at
    ) as event_data
    FROM rate_limit_events
    WHERE (tenant_id = p_tenant_id OR tenant_id IS NULL)
    ORDER BY created_at DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'total_events', COALESCE(v_total_events, 0),
    'unique_subjects', COALESCE(v_unique_subjects, 0),
    'by_identifier', COALESCE(v_by_identifier, '[]'::jsonb),
    'recent_events', COALESCE(v_recent_events, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cleanup old rate limit events
CREATE OR REPLACE FUNCTION cleanup_old_rate_events() RETURNS void AS $$
BEGIN
  -- Delete events older than 7 days (rate limiting is short-term)
  DELETE FROM rate_limit_events
  WHERE created_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION record_rate_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_rate_limit_statistics TO authenticated;

-- Trigger to update rate_limits.updated_at
CREATE OR REPLACE FUNCTION update_rate_limit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rate_limit_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limit_timestamp();

COMMENT ON FUNCTION cleanup_old_rate_events() IS 'Run periodically via cron to delete rate events >7 days old. Call: SELECT cleanup_old_rate_events();';

-- Insert default global rate limits
INSERT INTO rate_limits (tenant_id, scope, identifier, max_requests, window_size, window_type, enabled) VALUES
  (NULL, 'global', 'api:auth:login', 10, 1, 'minute', TRUE),
  (NULL, 'global', 'api:email:send', 100, 1, 'hour', TRUE),
  (NULL, 'global', 'api:campaign:create', 50, 1, 'hour', TRUE),
  (NULL, 'global', 'api:export:data', 10, 1, 'day', TRUE);
