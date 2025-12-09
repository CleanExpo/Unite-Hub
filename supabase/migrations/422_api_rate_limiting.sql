-- Migration 422: API Rate Limiting Engine (Phase E07)
-- Tables: api_rate_limits, api_keys, daily_usage
-- Per-tenant and per-endpoint quotas with RLS enforcement

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS api_daily_usage CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS api_rate_limits CASCADE;

-- Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE api_key_status AS ENUM ('active', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rate_limit_window AS ENUM ('minute', 'hour', 'day', 'month');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- API Keys table (tenant-scoped authentication)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- e.g., "sk_live_abc..."
  name TEXT NOT NULL,
  status api_key_status NOT NULL DEFAULT 'active',
  scopes JSONB DEFAULT '[]'::jsonb, -- ["read:campaigns", "write:content"]
  rate_limit_tier TEXT DEFAULT 'standard', -- references api_rate_limits.tier
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);

-- RLS policies for api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_keys_tenant_isolation ON api_keys
  FOR ALL
  USING (tenant_id = auth.uid());

-- Rate Limit Definitions (global, per-tier)
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL, -- 'free', 'standard', 'premium', 'enterprise'
  endpoint_pattern TEXT NOT NULL, -- e.g., "/api/campaigns/*"
  time_window rate_limit_window NOT NULL DEFAULT 'hour',
  max_requests INTEGER NOT NULL,
  burst_allowance INTEGER DEFAULT 0, -- extra requests allowed in burst
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tier, endpoint_pattern, time_window)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_tier ON api_rate_limits(tier);

-- Seed default rate limits
INSERT INTO api_rate_limits (tier, endpoint_pattern, time_window, max_requests, burst_allowance, description)
VALUES
  ('free', '/api/*', 'hour', 100, 10, 'Free tier: 100 requests/hour'),
  ('standard', '/api/*', 'hour', 1000, 50, 'Standard tier: 1000 requests/hour'),
  ('premium', '/api/*', 'hour', 5000, 100, 'Premium tier: 5000 requests/hour'),
  ('enterprise', '/api/*', 'hour', 50000, 500, 'Enterprise tier: 50000 requests/hour'),
  ('free', '/api/ai/*', 'hour', 20, 2, 'Free tier: 20 AI requests/hour'),
  ('standard', '/api/ai/*', 'hour', 200, 10, 'Standard tier: 200 AI requests/hour'),
  ('premium', '/api/ai/*', 'hour', 1000, 50, 'Premium tier: 1000 AI requests/hour'),
  ('enterprise', '/api/ai/*', 'hour', 10000, 200, 'Enterprise tier: 10000 AI requests/hour')
ON CONFLICT (tier, endpoint_pattern, time_window) DO NOTHING;

-- Daily Usage Tracking (per-tenant, per-endpoint)
CREATE TABLE api_daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  total_response_time_ms BIGINT NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER GENERATED ALWAYS AS (
    CASE WHEN request_count > 0 THEN (total_response_time_ms / request_count)::INTEGER ELSE 0 END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_tenant ON api_daily_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_date ON api_daily_usage(date);
CREATE INDEX IF NOT EXISTS idx_usage_endpoint ON api_daily_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_usage_window ON api_daily_usage(window_start, window_end);

-- RLS policies for api_daily_usage
ALTER TABLE api_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_tenant_isolation ON api_daily_usage
  FOR ALL
  USING (tenant_id = auth.uid());

-- Function: Check rate limit and increment usage
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_tenant_id UUID,
  p_api_key_id UUID,
  p_endpoint TEXT,
  p_tier TEXT DEFAULT 'standard',
  p_response_time_ms INTEGER DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
  v_limit_config RECORD;
  v_current_usage INTEGER := 0;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_max_requests INTEGER;
  v_allowed BOOLEAN := TRUE;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Find matching rate limit (most specific pattern first)
  SELECT * INTO v_limit_config
  FROM api_rate_limits
  WHERE tier = p_tier
    AND p_endpoint LIKE endpoint_pattern
  ORDER BY length(endpoint_pattern) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    -- Default: allow if no limit defined
    RETURN jsonb_build_object(
      'allowed', TRUE,
      'limit', NULL,
      'remaining', NULL,
      'reset_at', NULL
    );
  END IF;

  -- Calculate window boundaries
  CASE v_limit_config.time_window
    WHEN 'minute' THEN
      v_window_start := date_trunc('minute', now());
      v_window_end := v_window_start + interval '1 minute';
    WHEN 'hour' THEN
      v_window_start := date_trunc('hour', now());
      v_window_end := v_window_start + interval '1 hour';
    WHEN 'day' THEN
      v_window_start := date_trunc('day', now());
      v_window_end := v_window_start + interval '1 day';
    WHEN 'month' THEN
      v_window_start := date_trunc('month', now());
      v_window_end := v_window_start + interval '1 month';
  END CASE;

  v_max_requests := v_limit_config.max_requests + COALESCE(v_limit_config.burst_allowance, 0);
  v_reset_at := v_window_end;

  -- Get current usage for this window
  SELECT COALESCE(request_count, 0) INTO v_current_usage
  FROM api_daily_usage
  WHERE tenant_id = p_tenant_id
    AND endpoint = p_endpoint
    AND window_start = v_window_start;

  -- Check if limit exceeded
  IF v_current_usage >= v_max_requests THEN
    v_allowed := FALSE;
  ELSE
    -- Increment usage
    INSERT INTO api_daily_usage (
      tenant_id,
      api_key_id,
      endpoint,
      date,
      window_start,
      window_end,
      request_count,
      success_count,
      total_response_time_ms
    )
    VALUES (
      p_tenant_id,
      p_api_key_id,
      p_endpoint,
      CURRENT_DATE,
      v_window_start,
      v_window_end,
      1,
      CASE WHEN p_response_time_ms >= 0 THEN 1 ELSE 0 END,
      GREATEST(0, p_response_time_ms)
    )
    ON CONFLICT (tenant_id, endpoint, window_start)
    DO UPDATE SET
      request_count = api_daily_usage.request_count + 1,
      success_count = api_daily_usage.success_count + CASE WHEN p_response_time_ms >= 0 THEN 1 ELSE 0 END,
      total_response_time_ms = api_daily_usage.total_response_time_ms + GREATEST(0, p_response_time_ms),
      updated_at = now();

    v_current_usage := v_current_usage + 1;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'limit', v_max_requests,
    'remaining', GREATEST(0, v_max_requests - v_current_usage),
    'reset_at', v_reset_at,
    'tier', p_tier,
    'window', v_limit_config.time_window
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get current rate limit status (read-only)
CREATE OR REPLACE FUNCTION get_rate_limit_status(
  p_tenant_id UUID,
  p_endpoint TEXT,
  p_tier TEXT DEFAULT 'standard'
) RETURNS JSONB AS $$
DECLARE
  v_limit_config RECORD;
  v_current_usage INTEGER := 0;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_max_requests INTEGER;
BEGIN
  SELECT * INTO v_limit_config
  FROM api_rate_limits
  WHERE tier = p_tier
    AND p_endpoint LIKE endpoint_pattern
  ORDER BY length(endpoint_pattern) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'no_limit');
  END IF;

  -- Calculate window
  CASE v_limit_config.time_window
    WHEN 'minute' THEN v_window_start := date_trunc('minute', now());
    WHEN 'hour' THEN v_window_start := date_trunc('hour', now());
    WHEN 'day' THEN v_window_start := date_trunc('day', now());
    WHEN 'month' THEN v_window_start := date_trunc('month', now());
  END CASE;

  v_max_requests := v_limit_config.max_requests + COALESCE(v_limit_config.burst_allowance, 0);

  SELECT COALESCE(request_count, 0) INTO v_current_usage
  FROM api_daily_usage
  WHERE tenant_id = p_tenant_id
    AND endpoint = p_endpoint
    AND window_start = v_window_start;

  RETURN jsonb_build_object(
    'limit', v_max_requests,
    'used', v_current_usage,
    'remaining', GREATEST(0, v_max_requests - v_current_usage),
    'tier', p_tier,
    'window', v_limit_config.time_window
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_and_increment_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION get_rate_limit_status TO authenticated;

-- Updated_at trigger for api_keys
CREATE OR REPLACE FUNCTION update_api_keys_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_timestamp();
