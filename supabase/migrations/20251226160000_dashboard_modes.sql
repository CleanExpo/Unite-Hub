-- =====================================================================
-- Dashboard Modes System
-- Migration: 20251226160000_dashboard_modes.sql
-- Purpose: User preferences for simple vs advanced dashboard modes
-- Based on: Pattern 2 - "There's too much I don't need yet" (4 users)
-- =====================================================================

-- =====================================================================
-- Add dashboard mode preferences to user_profiles
-- =====================================================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS dashboard_mode TEXT DEFAULT 'simple' CHECK (dashboard_mode IN ('simple', 'advanced'));

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS dashboard_mode_updated_at TIMESTAMPTZ;

-- Index for dashboard mode queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_dashboard_mode
  ON user_profiles(user_id, dashboard_mode);

-- =====================================================================
-- Function: Update dashboard mode timestamp
-- =====================================================================

CREATE OR REPLACE FUNCTION update_dashboard_mode_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dashboard_mode IS DISTINCT FROM OLD.dashboard_mode THEN
    NEW.dashboard_mode_updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dashboard_mode_timestamp_trigger ON user_profiles;
CREATE TRIGGER update_dashboard_mode_timestamp_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_mode_timestamp();

-- =====================================================================
-- View: Dashboard Mode Analytics
-- Track mode adoption and switching patterns
-- =====================================================================

CREATE OR REPLACE VIEW dashboard_mode_analytics AS
SELECT
  workspace_id,
  dashboard_mode,
  COUNT(*) as user_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (dashboard_mode_updated_at - created_at))) / 86400, 1) as avg_days_to_switch
FROM user_profiles
WHERE dashboard_mode_updated_at IS NOT NULL
GROUP BY workspace_id, dashboard_mode;

-- =====================================================================
-- Comments
-- =====================================================================

COMMENT ON COLUMN user_profiles.dashboard_mode IS 'Dashboard complexity mode. Simple (default for small businesses): Shows core CRM features only. Advanced: Shows all features including AI agents, founder tools, analytics. Based on UX pattern: "There''s too much I don''t need yet" (4 users).';

COMMENT ON VIEW dashboard_mode_analytics IS 'Tracks dashboard mode adoption per workspace. Shows how many users prefer simple vs advanced mode and average time before switching modes.';

-- =====================================================================
-- Sample Data for Testing
-- =====================================================================

-- Set all existing users to simple mode by default (safe migration)
UPDATE user_profiles
SET dashboard_mode = 'simple'
WHERE dashboard_mode IS NULL;
