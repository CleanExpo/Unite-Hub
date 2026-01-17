-- User Slack Mappings for AI Phill Slash Command Integration
-- Maps Slack user IDs to internal Unite-Hub user IDs

DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS user_slack_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slack_user_id TEXT NOT NULL,
    slack_team_id TEXT NOT NULL,
    slack_team_name TEXT,
    slack_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(slack_user_id, slack_team_id)
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_user_slack_mappings_slack
  ON user_slack_mappings(slack_user_id, slack_team_id);

CREATE INDEX IF NOT EXISTS idx_user_slack_mappings_user
  ON user_slack_mappings(user_id);

-- Enable RLS
ALTER TABLE user_slack_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies: Users can only see their own mappings
DROP POLICY IF EXISTS "users_own_slack_mappings" ON user_slack_mappings;
CREATE POLICY "users_own_slack_mappings" ON user_slack_mappings
  FOR ALL USING (user_id = auth.uid());

-- Service role can manage all mappings (for admin/integration purposes)
DROP POLICY IF EXISTS "service_role_all_slack_mappings" ON user_slack_mappings;
CREATE POLICY "service_role_all_slack_mappings" ON user_slack_mappings
  FOR ALL USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_user_slack_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_slack_mappings_updated_at ON user_slack_mappings;
CREATE TRIGGER user_slack_mappings_updated_at
  BEFORE UPDATE ON user_slack_mappings
  FOR EACH ROW EXECUTE FUNCTION update_user_slack_mappings_updated_at();

COMMENT ON TABLE user_slack_mappings IS 'Maps Slack users to Unite-Hub users for AI Phill slash command integration';
