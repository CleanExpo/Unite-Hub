-- Migration 152: Secure Token Storage for Search Console & Analytics
-- Purpose: Encrypted storage for OAuth tokens and API keys used for analytics integrations
-- Security: Founder-only access with RLS, encrypted storage, automatic expiry tracking

-- ============================================================================
-- 1. INTEGRATION TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Integration identification
  integration_type TEXT NOT NULL CHECK (integration_type IN (
    'google_search_console',
    'google_analytics_4',
    'bing_webmaster_tools',
    'dataforseo'
  )),
  brand_slug TEXT, -- NULL means workspace-level token

  -- Token data (encrypted at application layer)
  access_token TEXT,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,

  -- API keys (for DataForSEO, etc.)
  api_key TEXT,
  api_secret TEXT,

  -- OAuth metadata
  scope TEXT[],
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  last_refreshed_at TIMESTAMPTZ,

  -- Connection metadata
  property_id TEXT, -- GA4 property ID, Search Console site URL, etc.
  account_email TEXT, -- Email of connected account

  -- Status tracking
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),

  -- Ensure only one active token per integration per brand
  CONSTRAINT unique_active_integration UNIQUE(workspace_id, integration_type, brand_slug, is_active)
    DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX idx_integration_tokens_workspace ON integration_tokens(workspace_id);
CREATE INDEX idx_integration_tokens_type ON integration_tokens(integration_type);
CREATE INDEX idx_integration_tokens_brand ON integration_tokens(brand_slug) WHERE brand_slug IS NOT NULL;
CREATE INDEX idx_integration_tokens_active ON integration_tokens(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_integration_tokens_expires ON integration_tokens(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- 2. TOKEN USAGE LOG (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_token_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES integration_tokens(id) ON DELETE CASCADE,

  -- Usage details
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  operation TEXT NOT NULL, -- e.g., 'fetch_search_console_data', 'fetch_analytics_report'
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- Request metadata
  api_endpoint TEXT,
  request_params JSONB,
  response_status INTEGER,

  -- Performance tracking
  duration_ms INTEGER,

  -- Data origin tracking (Truth Layer)
  data_cached BOOLEAN DEFAULT FALSE,
  cache_table TEXT,
  records_cached INTEGER
);

-- Indexes
CREATE INDEX idx_token_usage_log_token ON integration_token_usage_log(token_id);
CREATE INDEX idx_token_usage_log_workspace ON integration_token_usage_log(workspace_id);
CREATE INDEX idx_token_usage_log_used_at ON integration_token_usage_log(used_at DESC);
CREATE INDEX idx_token_usage_log_success ON integration_token_usage_log(success);

-- ============================================================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_token_usage_log ENABLE ROW LEVEL SECURITY;

-- Founder can read/write all tokens in their workspace
CREATE POLICY integration_tokens_founder_policy ON integration_tokens
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = integration_tokens.workspace_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = integration_tokens.workspace_id
    )
  );

-- Service role can perform all operations (for automated token refresh)
CREATE POLICY integration_tokens_service_policy ON integration_tokens
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Founder can read usage logs
CREATE POLICY token_usage_log_founder_read_policy ON integration_token_usage_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = integration_token_usage_log.workspace_id
    )
  );

-- Service role can insert usage logs
CREATE POLICY token_usage_log_service_insert_policy ON integration_token_usage_log
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Get active token for an integration
CREATE OR REPLACE FUNCTION get_active_integration_token(
  p_workspace_id UUID,
  p_integration_type TEXT,
  p_brand_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  access_token TEXT,
  refresh_token TEXT,
  token_type TEXT,
  expires_at TIMESTAMPTZ,
  api_key TEXT,
  api_secret TEXT,
  property_id TEXT,
  account_email TEXT,
  last_used_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    it.id,
    it.access_token,
    it.refresh_token,
    it.token_type,
    it.expires_at,
    it.api_key,
    it.api_secret,
    it.property_id,
    it.account_email,
    it.last_used_at
  FROM integration_tokens it
  WHERE it.workspace_id = p_workspace_id
    AND it.integration_type = p_integration_type
    AND it.is_active = TRUE
    AND (p_brand_slug IS NULL OR it.brand_slug = p_brand_slug OR it.brand_slug IS NULL)
  ORDER BY it.brand_slug NULLS LAST, it.last_used_at DESC NULLS LAST
  LIMIT 1;
END;
$$;

-- Check if token is expired or needs refresh
CREATE OR REPLACE FUNCTION is_token_expired(
  p_token_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT expires_at INTO v_expires_at
  FROM integration_tokens
  WHERE id = p_token_id;

  -- Consider expired if within 5 minutes of expiry (preemptive refresh)
  RETURN v_expires_at IS NOT NULL AND v_expires_at < (NOW() + INTERVAL '5 minutes');
END;
$$;

-- Update token last used timestamp
CREATE OR REPLACE FUNCTION update_token_last_used(
  p_token_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE integration_tokens
  SET last_used_at = NOW()
  WHERE id = p_token_id;
END;
$$;

-- Refresh OAuth token (updates access token and expiry)
CREATE OR REPLACE FUNCTION refresh_oauth_token(
  p_token_id UUID,
  p_new_access_token TEXT,
  p_new_refresh_token TEXT DEFAULT NULL,
  p_expires_in_seconds INTEGER DEFAULT 3600
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE integration_tokens
  SET
    access_token = p_new_access_token,
    refresh_token = COALESCE(p_new_refresh_token, refresh_token),
    expires_at = NOW() + (p_expires_in_seconds || ' seconds')::INTERVAL,
    last_refreshed_at = NOW(),
    error_count = 0,
    last_error = NULL,
    last_error_at = NULL
  WHERE id = p_token_id;
END;
$$;

-- Increment token error count (for tracking failing integrations)
CREATE OR REPLACE FUNCTION increment_token_error(
  p_token_id UUID,
  p_error_message TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE integration_tokens
  SET
    error_count = error_count + 1,
    last_error = p_error_message,
    last_error_at = NOW()
  WHERE id = p_token_id;

  -- Deactivate token if error count exceeds threshold
  UPDATE integration_tokens
  SET is_active = FALSE
  WHERE id = p_token_id AND error_count >= 5;
END;
$$;

-- Log token usage
CREATE OR REPLACE FUNCTION log_token_usage(
  p_token_id UUID,
  p_operation TEXT,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL,
  p_api_endpoint TEXT DEFAULT NULL,
  p_request_params JSONB DEFAULT NULL,
  p_response_status INTEGER DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL,
  p_data_cached BOOLEAN DEFAULT FALSE,
  p_cache_table TEXT DEFAULT NULL,
  p_records_cached INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_workspace_id UUID;
BEGIN
  -- Get workspace_id from token
  SELECT workspace_id INTO v_workspace_id
  FROM integration_tokens
  WHERE id = p_token_id;

  -- Insert usage log
  INSERT INTO integration_token_usage_log (
    workspace_id,
    token_id,
    operation,
    success,
    error_message,
    api_endpoint,
    request_params,
    response_status,
    duration_ms,
    data_cached,
    cache_table,
    records_cached
  ) VALUES (
    v_workspace_id,
    p_token_id,
    p_operation,
    p_success,
    p_error_message,
    p_api_endpoint,
    p_request_params,
    p_response_status,
    p_duration_ms,
    p_data_cached,
    p_cache_table,
    p_records_cached
  )
  RETURNING id INTO v_log_id;

  -- Update token last used timestamp
  PERFORM update_token_last_used(p_token_id);

  -- Increment error count if failed
  IF NOT p_success THEN
    PERFORM increment_token_error(p_token_id, p_error_message);
  END IF;

  RETURN v_log_id;
END;
$$;

-- Get token usage statistics
CREATE OR REPLACE FUNCTION get_token_usage_stats(
  p_workspace_id UUID,
  p_integration_type TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 7
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_requests', COUNT(*),
    'successful_requests', COUNT(*) FILTER (WHERE success = TRUE),
    'failed_requests', COUNT(*) FILTER (WHERE success = FALSE),
    'success_rate', ROUND(
      (COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ),
    'avg_duration_ms', ROUND(AVG(duration_ms)),
    'total_records_cached', SUM(records_cached),
    'by_operation', (
      SELECT json_object_agg(operation, cnt)
      FROM (
        SELECT operation, COUNT(*) as cnt
        FROM integration_token_usage_log tul
        JOIN integration_tokens it ON tul.token_id = it.id
        WHERE tul.workspace_id = p_workspace_id
          AND tul.used_at > (NOW() - (p_days || ' days')::INTERVAL)
          AND (p_integration_type IS NULL OR it.integration_type = p_integration_type)
        GROUP BY operation
      ) sub
    ),
    'by_integration', (
      SELECT json_object_agg(integration_type, cnt)
      FROM (
        SELECT it.integration_type, COUNT(*) as cnt
        FROM integration_token_usage_log tul
        JOIN integration_tokens it ON tul.token_id = it.id
        WHERE tul.workspace_id = p_workspace_id
          AND tul.used_at > (NOW() - (p_days || ' days')::INTERVAL)
          AND (p_integration_type IS NULL OR it.integration_type = p_integration_type)
        GROUP BY it.integration_type
      ) sub
    ),
    'recent_errors', (
      SELECT json_agg(
        json_build_object(
          'operation', operation,
          'error_message', error_message,
          'used_at', used_at,
          'api_endpoint', api_endpoint
        )
      )
      FROM (
        SELECT operation, error_message, used_at, api_endpoint
        FROM integration_token_usage_log tul
        JOIN integration_tokens it ON tul.token_id = it.id
        WHERE tul.workspace_id = p_workspace_id
          AND tul.success = FALSE
          AND tul.used_at > (NOW() - (p_days || ' days')::INTERVAL)
          AND (p_integration_type IS NULL OR it.integration_type = p_integration_type)
        ORDER BY tul.used_at DESC
        LIMIT 10
      ) sub
    )
  ) INTO v_result
  FROM integration_token_usage_log tul
  JOIN integration_tokens it ON tul.token_id = it.id
  WHERE tul.workspace_id = p_workspace_id
    AND tul.used_at > (NOW() - (p_days || ' days')::INTERVAL)
    AND (p_integration_type IS NULL OR it.integration_type = p_integration_type);

  RETURN v_result;
END;
$$;

-- Get all active integrations for a workspace
CREATE OR REPLACE FUNCTION get_active_integrations(
  p_workspace_id UUID
)
RETURNS TABLE (
  integration_type TEXT,
  brand_slug TEXT,
  property_id TEXT,
  account_email TEXT,
  is_expired BOOLEAN,
  last_used_at TIMESTAMPTZ,
  error_count INTEGER,
  last_error TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    it.integration_type,
    it.brand_slug,
    it.property_id,
    it.account_email,
    (it.expires_at IS NOT NULL AND it.expires_at < NOW()) as is_expired,
    it.last_used_at,
    it.error_count,
    it.last_error
  FROM integration_tokens it
  WHERE it.workspace_id = p_workspace_id
    AND it.is_active = TRUE
  ORDER BY it.integration_type, it.brand_slug NULLS LAST;
END;
$$;

-- ============================================================================
-- 5. AUTOMATIC TOKEN EXPIRY CHECKER
-- ============================================================================

CREATE OR REPLACE FUNCTION check_token_expiry()
RETURNS TABLE (
  token_id UUID,
  workspace_id UUID,
  integration_type TEXT,
  brand_slug TEXT,
  expires_at TIMESTAMPTZ,
  minutes_until_expiry INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    it.id as token_id,
    it.workspace_id,
    it.integration_type,
    it.brand_slug,
    it.expires_at,
    EXTRACT(EPOCH FROM (it.expires_at - NOW()))::INTEGER / 60 as minutes_until_expiry
  FROM integration_tokens it
  WHERE it.is_active = TRUE
    AND it.expires_at IS NOT NULL
    AND it.expires_at < (NOW() + INTERVAL '1 hour')
  ORDER BY it.expires_at ASC;
END;
$$;

-- ============================================================================
-- 6. AUTOMATIC UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_integration_tokens_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_integration_tokens_updated_at
  BEFORE UPDATE ON integration_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_tokens_updated_at();

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE integration_tokens IS 'Encrypted storage for OAuth tokens and API keys for analytics integrations';
COMMENT ON TABLE integration_token_usage_log IS 'Audit trail for all token usage with performance and error tracking';
COMMENT ON FUNCTION get_active_integration_token IS 'Returns active token for specified integration type and brand';
COMMENT ON FUNCTION is_token_expired IS 'Checks if token is expired or within 5 minutes of expiry';
COMMENT ON FUNCTION refresh_oauth_token IS 'Updates access token and expiry after OAuth refresh';
COMMENT ON FUNCTION log_token_usage IS 'Logs token usage with performance metrics and caching info';
COMMENT ON FUNCTION get_token_usage_stats IS 'Returns usage statistics and error summary for workspace';
COMMENT ON FUNCTION get_active_integrations IS 'Lists all active integrations with status for workspace';
COMMENT ON FUNCTION check_token_expiry IS 'Returns tokens expiring within 1 hour for proactive refresh';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Security Note: Tokens should be encrypted at the application layer before storage
-- Never log raw tokens in application logs
-- Use environment variables for service role operations
-- Implement token rotation policy (e.g., refresh every 30 days even if not expired)
