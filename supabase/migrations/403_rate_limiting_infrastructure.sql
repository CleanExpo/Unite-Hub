-- Migration 403: Rate Limiting Infrastructure
-- Phase 4 of Unite-Hub Rebuild
-- Purpose: Database support for rate limiting (complements src/core/security/)
-- Date: 2025-11-29

-- ============================================================================
-- SECTION 1: Rate Limit Logs Table
-- For persistent rate limit tracking and analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request identification
  client_key TEXT NOT NULL,  -- IP address or user ID
  endpoint TEXT NOT NULL,    -- API route path
  tier TEXT NOT NULL CHECK (tier IN ('public', 'webhook', 'client', 'staff', 'agent', 'admin')),

  -- Rate limit status
  allowed BOOLEAN NOT NULL,
  remaining INTEGER NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL,

  -- Request metadata
  request_method TEXT,
  status_code INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_rate_limit_logs_client ON rate_limit_logs(client_key, created_at DESC);
CREATE INDEX idx_rate_limit_logs_endpoint ON rate_limit_logs(endpoint, created_at DESC);
CREATE INDEX idx_rate_limit_logs_created ON rate_limit_logs(created_at DESC);
CREATE INDEX idx_rate_limit_logs_tier ON rate_limit_logs(tier);

-- Partition by time for easy cleanup (optional, uncomment if needed)
-- CREATE INDEX idx_rate_limit_logs_date ON rate_limit_logs(DATE(created_at));

-- ============================================================================
-- SECTION 2: Rate Limit Overrides Table
-- Allow per-client or per-endpoint limit customization
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Override target (one of these should be set)
  client_key TEXT,           -- Override for specific IP/user
  endpoint_pattern TEXT,     -- Override for endpoint pattern (supports wildcards)
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Override settings
  tier TEXT CHECK (tier IN ('public', 'webhook', 'client', 'staff', 'agent', 'admin')),
  max_requests INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL DEFAULT 60,

  -- Metadata
  reason TEXT,
  expires_at TIMESTAMPTZ,
  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- At least one target must be set
  CONSTRAINT override_target_required CHECK (
    client_key IS NOT NULL OR endpoint_pattern IS NOT NULL OR workspace_id IS NOT NULL
  )
);

CREATE INDEX idx_rate_limit_overrides_client ON rate_limit_overrides(client_key);
CREATE INDEX idx_rate_limit_overrides_workspace ON rate_limit_overrides(workspace_id);
CREATE INDEX idx_rate_limit_overrides_expires ON rate_limit_overrides(expires_at);

-- Enable RLS
ALTER TABLE rate_limit_overrides ENABLE ROW LEVEL SECURITY;

-- Only founders/admins can manage overrides
CREATE POLICY "rate_limit_overrides_admin" ON rate_limit_overrides
  FOR ALL TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND public.is_founder() OR public.has_role('ADMIN'))
  WITH CHECK (public.is_founder() OR public.has_role('ADMIN'));

-- ============================================================================
-- SECTION 3: Blocked IPs Table
-- For persistent IP blocking (security incidents)
-- ============================================================================

CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  ip_address INET NOT NULL,
  reason TEXT NOT NULL,
  blocked_until TIMESTAMPTZ,  -- NULL = permanent block

  -- Audit trail
  -- Keep FK reference to auth.users (allowed in migrations)
blocked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(ip_address)
);

CREATE INDEX idx_blocked_ips_address ON blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_until ON blocked_ips(blocked_until);

-- Enable RLS
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- Only founders/admins can manage blocked IPs
CREATE POLICY "blocked_ips_admin" ON blocked_ips
  FOR ALL TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND public.is_founder() OR public.has_role('ADMIN'))
  WITH CHECK (public.is_founder() OR public.has_role('ADMIN'));

-- ============================================================================
-- SECTION 4: Helper Functions
-- ============================================================================

-- Check if an IP is blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(ip_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_ips
    WHERE ip_address = ip_param::INET
    AND (blocked_until IS NULL OR blocked_until > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get rate limit override for a client/endpoint
CREATE OR REPLACE FUNCTION public.get_rate_limit_override(
  client_key_param TEXT,
  endpoint_param TEXT,
  workspace_id_param UUID DEFAULT NULL
)
RETURNS TABLE(
  max_requests INTEGER,
  window_seconds INTEGER,
  tier TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ro.max_requests,
    ro.window_seconds,
    ro.tier
  FROM rate_limit_overrides ro
  WHERE (
    ro.client_key = client_key_param
    OR ro.workspace_id = workspace_id_param
    OR endpoint_param LIKE REPLACE(ro.endpoint_pattern, '*', '%')
  )
  AND (ro.expires_at IS NULL OR ro.expires_at > NOW())
  ORDER BY
    -- Priority: client > workspace > endpoint pattern
    CASE
      WHEN ro.client_key IS NOT NULL THEN 1
      WHEN ro.workspace_id IS NOT NULL THEN 2
      ELSE 3
    END
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Log rate limit event (called from application)
CREATE OR REPLACE FUNCTION public.log_rate_limit(
  client_key_param TEXT,
  endpoint_param TEXT,
  tier_param TEXT,
  allowed_param BOOLEAN,
  remaining_param INTEGER,
  reset_at_param TIMESTAMPTZ,
  method_param TEXT DEFAULT NULL,
  status_param INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO rate_limit_logs (
    client_key, endpoint, tier, allowed, remaining, reset_at,
    request_method, status_code
  ) VALUES (
    client_key_param, endpoint_param, tier_param, allowed_param,
    remaining_param, reset_at_param, method_param, status_param
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old rate limit logs (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_logs(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limit_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_ip_blocked(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rate_limit_override(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_rate_limit(TEXT, TEXT, TEXT, BOOLEAN, INTEGER, TIMESTAMPTZ, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limit_logs(INTEGER) TO authenticated;

-- ============================================================================
-- SECTION 5: Rate Limit Analytics View
-- ============================================================================

CREATE OR REPLACE VIEW rate_limit_analytics AS
SELECT
  DATE(created_at) as date,
  tier,
  endpoint,
  COUNT(*) as total_requests,
  SUM(CASE WHEN allowed THEN 1 ELSE 0 END) as allowed_count,
  SUM(CASE WHEN NOT allowed THEN 1 ELSE 0 END) as blocked_count,
  COUNT(DISTINCT client_key) as unique_clients
FROM rate_limit_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), tier, endpoint
ORDER BY date DESC, total_requests DESC;

-- ============================================================================
-- Verification Queries
-- ============================================================================
/*
-- Check tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('rate_limit_logs', 'rate_limit_overrides', 'blocked_ips');

-- Check functions exist
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN ('is_ip_blocked', 'get_rate_limit_override', 'log_rate_limit', 'cleanup_rate_limit_logs');

-- View analytics
SELECT * FROM rate_limit_analytics LIMIT 10;
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================;
