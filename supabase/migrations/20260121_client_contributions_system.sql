-- Client Contributions System: Schema-Driven Content Platform
-- Supports: video, photo, voice, text, review, faq contributions with gamification

-- Table 1: Client Contributions (primary content storage)
CREATE TABLE IF NOT EXISTS client_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,

  -- Content metadata
  media_file_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('video', 'photo', 'voice', 'text', 'review', 'faq')),
  content_text TEXT,

  -- Gamification & moderation
  points_awarded INTEGER DEFAULT 0 CHECK (points_awarded >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'published', 'rejected')),
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'rejected')),
  moderation_reason TEXT,

  -- Schema generation (JSONB with keys: google, chatgpt, perplexity, bing, claude, gemini)
  schema_generated JSONB,
  published_url TEXT,

  -- Impact tracking
  impressions INTEGER DEFAULT 0 CHECK (impressions >= 0),
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, client_user_id, media_file_id)
);

-- Table 2: Client Gamification (points, tiers, leaderboard)
CREATE TABLE IF NOT EXISTS client_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,

  -- Points tracking
  points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),
  points_lifetime INTEGER DEFAULT 0 CHECK (points_lifetime >= 0),

  -- Tier progression (bronze: 0-499, silver: 500-1499, gold: 1500-3499, platinum: 3500+)
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  tier_unlocked_at TIMESTAMPTZ,

  -- Leaderboard ranking
  leaderboard_rank INTEGER,          -- Overall all-time rank
  monthly_rank INTEGER,              -- Reset monthly (1st of month UTC)

  -- Activity metrics
  last_contribution_at TIMESTAMPTZ,
  contribution_streak INTEGER DEFAULT 0 CHECK (contribution_streak >= 0),
  total_contributions INTEGER DEFAULT 0 CHECK (total_contributions >= 0),

  -- Notification preferences
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start INTEGER DEFAULT 22 CHECK (quiet_hours_start >= 0 AND quiet_hours_start <= 23),
  quiet_hours_end INTEGER DEFAULT 8 CHECK (quiet_hours_end >= 0 AND quiet_hours_end <= 23),
  quiet_hours_timezone TEXT DEFAULT 'UTC',

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, client_user_id)
);

-- Table 3: Client Contribution Impact (aggregated metrics)
CREATE TABLE IF NOT EXISTS client_contribution_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,

  -- Aggregated metrics
  total_contributions INTEGER DEFAULT 0 CHECK (total_contributions >= 0),
  total_impressions INTEGER DEFAULT 0 CHECK (total_impressions >= 0),
  total_clicks INTEGER DEFAULT 0 CHECK (total_clicks >= 0),
  avg_engagement_rate NUMERIC(5,2) DEFAULT 0 CHECK (avg_engagement_rate >= 0 AND avg_engagement_rate <= 100),

  -- SEO impact
  seo_score_delta INTEGER DEFAULT 0,              -- Change in overall SEO score since first contribution
  keywords_ranked INTEGER DEFAULT 0 CHECK (keywords_ranked >= 0),  -- #1 ranking count

  -- Monthly snapshot
  month_year TEXT,                               -- Format: 'YYYY-MM' for aggregation by month

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, client_user_id, month_year)
);

-- Enable RLS on all tables
ALTER TABLE client_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contribution_impact ENABLE ROW LEVEL SECURITY;

-- RLS Policy: client_contributions (tenant isolation)
DROP POLICY IF EXISTS "tenant_isolation" ON client_contributions;
CREATE POLICY "tenant_isolation" ON client_contributions
  FOR ALL USING (
    workspace_id = (SELECT current_workspace_id())
  );

-- RLS Policy: client_gamification (tenant isolation)
DROP POLICY IF EXISTS "tenant_isolation" ON client_gamification;
CREATE POLICY "tenant_isolation" ON client_gamification
  FOR ALL USING (
    workspace_id = (SELECT current_workspace_id())
  );

-- RLS Policy: client_contribution_impact (tenant isolation)
DROP POLICY IF EXISTS "tenant_isolation" ON client_contribution_impact;
CREATE POLICY "tenant_isolation" ON client_contribution_impact
  FOR ALL USING (
    workspace_id = (SELECT current_workspace_id())
  );

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_client_contributions_workspace
  ON client_contributions(workspace_id);

CREATE INDEX IF NOT EXISTS idx_client_contributions_client
  ON client_contributions(client_user_id);

CREATE INDEX IF NOT EXISTS idx_client_contributions_status
  ON client_contributions(status);

CREATE INDEX IF NOT EXISTS idx_client_contributions_type
  ON client_contributions(contribution_type);

CREATE INDEX IF NOT EXISTS idx_client_contributions_created
  ON client_contributions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_gamification_workspace
  ON client_gamification(workspace_id);

CREATE INDEX IF NOT EXISTS idx_client_gamification_tier
  ON client_gamification(tier);

CREATE INDEX IF NOT EXISTS idx_client_gamification_leaderboard
  ON client_gamification(workspace_id, leaderboard_rank);

CREATE INDEX IF NOT EXISTS idx_client_gamification_monthly_rank
  ON client_gamification(workspace_id, monthly_rank);

CREATE INDEX IF NOT EXISTS idx_client_impact_workspace
  ON client_contribution_impact(workspace_id);

CREATE INDEX IF NOT EXISTS idx_client_impact_month
  ON client_contribution_impact(workspace_id, month_year);

-- Function: Atomic points increment with tier calculation
-- Prevents race conditions during concurrent contributions
CREATE OR REPLACE FUNCTION increment_client_points(
  p_workspace_id UUID,
  p_client_user_id UUID,
  p_points INTEGER
)
RETURNS TABLE (
  new_balance INTEGER,
  new_lifetime INTEGER,
  new_tier TEXT,
  tier_changed BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_balance INTEGER;
  v_new_lifetime INTEGER;
  v_new_tier TEXT;
  v_old_tier TEXT;
  v_tier_changed BOOLEAN := FALSE;
BEGIN
  -- Increment points atomically
  UPDATE client_gamification
  SET
    points_balance = points_balance + p_points,
    points_lifetime = points_lifetime + p_points,
    total_contributions = total_contributions + 1,
    last_contribution_at = NOW()
  WHERE workspace_id = p_workspace_id
    AND client_user_id = p_client_user_id
  RETURNING
    client_gamification.points_balance,
    client_gamification.points_lifetime,
    client_gamification.tier
  INTO v_new_balance, v_new_lifetime, v_old_tier;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Client gamification record not found';
  END IF;

  -- Calculate new tier based on lifetime points
  IF v_new_lifetime >= 3500 THEN
    v_new_tier := 'platinum';
  ELSIF v_new_lifetime >= 1500 THEN
    v_new_tier := 'gold';
  ELSIF v_new_lifetime >= 500 THEN
    v_new_tier := 'silver';
  ELSE
    v_new_tier := 'bronze';
  END IF;

  -- Update tier if changed
  IF v_new_tier != v_old_tier THEN
    UPDATE client_gamification
    SET
      tier = v_new_tier,
      tier_unlocked_at = NOW()
    WHERE workspace_id = p_workspace_id
      AND client_user_id = p_client_user_id;

    v_tier_changed := TRUE;
  END IF;

  RETURN QUERY SELECT v_new_balance, v_new_lifetime, v_new_tier, v_tier_changed;
END;
$$;

-- Function: Update monthly leaderboard rankings for workspace
-- Run this at midnight UTC on 1st of each month
CREATE OR REPLACE FUNCTION update_monthly_leaderboard(p_workspace_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE client_gamification
  SET monthly_rank = ranked.rank
  FROM (
    SELECT
      client_user_id,
      ROW_NUMBER() OVER (ORDER BY points_balance DESC) as rank
    FROM client_gamification
    WHERE workspace_id = p_workspace_id
  ) ranked
  WHERE client_gamification.workspace_id = p_workspace_id
    AND client_gamification.client_user_id = ranked.client_user_id;
END;
$$;

-- Function: Update overall leaderboard rankings (run daily)
CREATE OR REPLACE FUNCTION update_leaderboard_rankings(p_workspace_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE client_gamification
  SET leaderboard_rank = ranked.rank
  FROM (
    SELECT
      client_user_id,
      ROW_NUMBER() OVER (ORDER BY points_lifetime DESC) as rank
    FROM client_gamification
    WHERE workspace_id = p_workspace_id
  ) ranked
  WHERE client_gamification.workspace_id = p_workspace_id
    AND client_gamification.client_user_id = ranked.client_user_id;
END;
$$;

-- Table: Client notifications (for tracking sent notifications)
CREATE TABLE IF NOT EXISTS client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,

  notification_type TEXT NOT NULL CHECK (notification_type IN ('contribution_published', 'tier_unlocked', 'leaderboard_rank', 'milestone')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,

  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON client_notifications;
CREATE POLICY "tenant_isolation" ON client_notifications
  FOR ALL USING (
    workspace_id = (SELECT current_workspace_id())
  );

-- Index for notifications
CREATE INDEX IF NOT EXISTS idx_client_notifications_workspace
  ON client_notifications(workspace_id);

CREATE INDEX IF NOT EXISTS idx_client_notifications_client
  ON client_notifications(client_user_id);

CREATE INDEX IF NOT EXISTS idx_client_notifications_unread
  ON client_notifications(client_user_id, read_at)
  WHERE read_at IS NULL;
