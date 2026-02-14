-- Migration 205: OAuth Tokens Storage
--
-- Purpose: Store OAuth access and refresh tokens for Google integrations
-- Tables: oauth_tokens
-- Features:
--   - Google Search Console tokens
--   - Google Business Profile tokens
--   - Google Analytics 4 tokens
--   - Automatic token expiry tracking
--   - Workspace isolation with RLS
--
-- Usage:
--   1. Copy this entire file
--   2. Go to Supabase Dashboard -> SQL Editor
--   3. Paste and run
--   4. Verify table creation: SELECT * FROM oauth_tokens LIMIT 1;

-- ============================================================================
-- OAuth Tokens Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN (
    'google_search_console',
    'google_business_profile',
    'google_analytics_4'
  )),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one token per workspace per provider
  UNIQUE(workspace_id, provider)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_workspace_id ON oauth_tokens(workspace_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider ON oauth_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their workspace tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can insert their workspace tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can update their workspace tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can delete their workspace tokens" ON oauth_tokens;

-- Policy: Users can view tokens for their workspaces
CREATE POLICY "Users can view their workspace tokens"
  ON oauth_tokens FOR SELECT
  USING (
    workspace_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert tokens for their workspaces
CREATE POLICY "Users can insert their workspace tokens"
  ON oauth_tokens FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Policy: Users can update tokens for their workspaces
CREATE POLICY "Users can update their workspace tokens"
  ON oauth_tokens FOR UPDATE
  USING (
    workspace_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete tokens for their workspaces
CREATE POLICY "Users can delete their workspace tokens"
  ON oauth_tokens FOR DELETE
  USING (
    workspace_id IN (
      SELECT org_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Trigger: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_oauth_tokens_updated_at_trigger ON oauth_tokens;

CREATE TRIGGER update_oauth_tokens_updated_at_trigger
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_oauth_tokens_updated_at();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function: Get OAuth token for a provider
CREATE OR REPLACE FUNCTION get_oauth_token(
  p_workspace_id UUID,
  p_provider TEXT
)
RETURNS TABLE (
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.access_token,
    t.refresh_token,
    t.expires_at,
    t.expires_at < NOW() AS is_expired
  FROM oauth_tokens t
  WHERE t.workspace_id = p_workspace_id
    AND t.provider = p_provider
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if OAuth token exists
CREATE OR REPLACE FUNCTION has_oauth_token(
  p_workspace_id UUID,
  p_provider TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1
    FROM oauth_tokens
    WHERE workspace_id = p_workspace_id
      AND provider = p_provider
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Refresh OAuth token (update existing record)
CREATE OR REPLACE FUNCTION refresh_oauth_token(
  p_workspace_id UUID,
  p_provider TEXT,
  p_new_access_token TEXT,
  p_new_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE oauth_tokens
  SET
    access_token = p_new_access_token,
    expires_at = p_new_expires_at,
    updated_at = NOW()
  WHERE workspace_id = p_workspace_id
    AND provider = p_provider;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE oauth_tokens IS 'Stores OAuth access and refresh tokens for Google integrations (GSC, GBP, GA4)';
COMMENT ON COLUMN oauth_tokens.workspace_id IS 'Reference to organization/workspace';
COMMENT ON COLUMN oauth_tokens.user_id IS 'User who authorized the OAuth connection';
COMMENT ON COLUMN oauth_tokens.provider IS 'OAuth provider: google_search_console, google_business_profile, google_analytics_4';
COMMENT ON COLUMN oauth_tokens.access_token IS 'OAuth access token (expires after 1 hour)';
COMMENT ON COLUMN oauth_tokens.refresh_token IS 'OAuth refresh token (valid until revoked)';
COMMENT ON COLUMN oauth_tokens.expires_at IS 'When the access token expires';
COMMENT ON COLUMN oauth_tokens.scopes IS 'OAuth scopes granted';
COMMENT ON COLUMN oauth_tokens.metadata IS 'Additional provider-specific data (e.g., site URLs, property IDs)';

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oauth_tokens') THEN
    RAISE NOTICE '✅ oauth_tokens table created successfully';
  ELSE
    RAISE EXCEPTION '❌ oauth_tokens table creation failed';
  END IF;
END $$;

-- Verify RLS enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE tablename = 'oauth_tokens'
      AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS enabled on oauth_tokens';
  ELSE
    RAISE EXCEPTION '❌ RLS not enabled on oauth_tokens';
  END IF;
END $$;

-- Verify policies exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'oauth_tokens';

  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ RLS policies created (% policies)', policy_count;
  ELSE
    RAISE EXCEPTION '❌ Not all RLS policies created (found %, expected 4)', policy_count;
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT
  '✅ Migration 205 Complete' AS status,
  'oauth_tokens table created with RLS policies' AS description,
  NOW() AS completed_at;
