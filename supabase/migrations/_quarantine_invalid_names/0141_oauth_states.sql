-- OAuth State Management Table
-- Used for CSRF protection in OAuth flows (Gmail, Outlook, GBP)

CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state TEXT UNIQUE NOT NULL,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'gbp')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user ON oauth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_provider ON oauth_states(provider);
-- Row Level Security
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
-- Policy: Users can only access their own OAuth states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'oauth_states'
      AND policyname = 'oauth_states_user_isolation'
  ) THEN
    CREATE POLICY "oauth_states_user_isolation"
    ON oauth_states
    FOR ALL
    USING (user_id = auth.uid());
  END IF;
END $$;
-- Cleanup function for expired states
CREATE OR REPLACE FUNCTION delete_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$;
-- Grant permissions
GRANT ALL ON oauth_states TO authenticated;
GRANT ALL ON oauth_states TO service_role;
-- Comments
COMMENT ON TABLE oauth_states IS 'Stores OAuth state parameters for CSRF protection';
COMMENT ON COLUMN oauth_states.state IS 'Random UUID used as state parameter in OAuth flow';
COMMENT ON COLUMN oauth_states.expires_at IS 'State expires after 10 minutes';
COMMENT ON COLUMN oauth_states.provider IS 'OAuth provider: google, microsoft, or gbp';
