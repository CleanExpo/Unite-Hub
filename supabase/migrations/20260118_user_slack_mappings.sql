-- Migration: Create user_slack_mappings table for Slack integration
-- Maps Slack user IDs to Unite-Hub user IDs

CREATE TABLE IF NOT EXISTS user_slack_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slack_user_id TEXT NOT NULL,
  slack_team_id TEXT NOT NULL,
  slack_username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique mapping per Slack user per team
  UNIQUE(slack_user_id, slack_team_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_slack_mappings_slack
  ON user_slack_mappings(slack_user_id, slack_team_id);

CREATE INDEX IF NOT EXISTS idx_user_slack_mappings_user
  ON user_slack_mappings(user_id);

-- Enable RLS
ALTER TABLE user_slack_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own slack mappings" ON user_slack_mappings;
CREATE POLICY "Users can view own slack mappings" ON user_slack_mappings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own slack mappings" ON user_slack_mappings;
CREATE POLICY "Users can insert own slack mappings" ON user_slack_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own slack mappings" ON user_slack_mappings;
CREATE POLICY "Users can delete own slack mappings" ON user_slack_mappings
  FOR DELETE USING (auth.uid() = user_id);

-- Service role bypass for API routes
DROP POLICY IF EXISTS "Service role full access" ON user_slack_mappings;
CREATE POLICY "Service role full access" ON user_slack_mappings
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
