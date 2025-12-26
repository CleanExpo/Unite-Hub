-- =====================================================================
-- Onboarding Wizard System
-- Migration: 20251226150000_onboarding_wizard.sql
-- Purpose: Track user onboarding progress and completion
-- Dependencies: workspaces table, auth.users
-- =====================================================================

-- =====================================================================
-- Table: user_onboarding_progress
-- Tracks completion of onboarding steps per user
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Step completion tracking
  step_gmail_connected BOOLEAN DEFAULT false,
  step_gmail_connected_at TIMESTAMPTZ,

  step_first_contact_added BOOLEAN DEFAULT false,
  step_first_contact_added_at TIMESTAMPTZ,

  step_first_email_sent BOOLEAN DEFAULT false,
  step_first_email_sent_at TIMESTAMPTZ,

  step_viewed_analytics BOOLEAN DEFAULT false,
  step_viewed_analytics_at TIMESTAMPTZ,

  step_completed_setup BOOLEAN DEFAULT false,
  step_completed_setup_at TIMESTAMPTZ,

  -- Wizard state
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),
  wizard_completed BOOLEAN DEFAULT false,
  wizard_completed_at TIMESTAMPTZ,
  wizard_skipped BOOLEAN DEFAULT false,
  wizard_skipped_at TIMESTAMPTZ,

  -- Progress metrics
  total_steps INTEGER DEFAULT 5,
  completed_steps INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

  -- Metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one record per user per workspace
  UNIQUE(user_id, workspace_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_onboarding_progress_user_id
  ON user_onboarding_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_progress_workspace_id
  ON user_onboarding_progress(workspace_id);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_progress_incomplete
  ON user_onboarding_progress(user_id, workspace_id)
  WHERE wizard_completed = false AND wizard_skipped = false;

CREATE INDEX IF NOT EXISTS idx_user_onboarding_progress_last_activity
  ON user_onboarding_progress(user_id, last_activity_at DESC);

-- RLS Policies
ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own onboarding progress
DROP POLICY IF EXISTS "users_own_onboarding" ON user_onboarding_progress;
CREATE POLICY "users_own_onboarding" ON user_onboarding_progress
  FOR ALL
  USING (user_id = auth.uid());

-- =====================================================================
-- Function: Update Progress Percentage
-- Automatically calculates completion percentage when steps change
-- =====================================================================

CREATE OR REPLACE FUNCTION calculate_onboarding_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Count completed steps
  NEW.completed_steps := (
    CASE WHEN NEW.step_gmail_connected THEN 1 ELSE 0 END +
    CASE WHEN NEW.step_first_contact_added THEN 1 ELSE 0 END +
    CASE WHEN NEW.step_first_email_sent THEN 1 ELSE 0 END +
    CASE WHEN NEW.step_viewed_analytics THEN 1 ELSE 0 END +
    CASE WHEN NEW.step_completed_setup THEN 1 ELSE 0 END
  );

  -- Calculate percentage
  NEW.progress_percentage := ROUND((NEW.completed_steps::NUMERIC / NEW.total_steps) * 100);

  -- Update last activity
  NEW.last_activity_at := NOW();

  -- Check if wizard completed (all steps done)
  IF NEW.completed_steps = NEW.total_steps AND NOT NEW.wizard_completed THEN
    NEW.wizard_completed := true;
    NEW.wizard_completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_onboarding_progress ON user_onboarding_progress;
CREATE TRIGGER update_onboarding_progress
  BEFORE INSERT OR UPDATE ON user_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION calculate_onboarding_progress();

-- =====================================================================
-- View: Onboarding Analytics
-- Aggregated onboarding completion metrics per workspace
-- =====================================================================

CREATE OR REPLACE VIEW onboarding_analytics AS
SELECT
  workspace_id,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE wizard_completed = true) as completed_count,
  COUNT(*) FILTER (WHERE wizard_skipped = true) as skipped_count,
  COUNT(*) FILTER (WHERE wizard_completed = false AND wizard_skipped = false) as in_progress_count,

  ROUND(AVG(progress_percentage)) as avg_progress_percentage,
  ROUND(AVG(completed_steps)) as avg_completed_steps,

  COUNT(*) FILTER (WHERE step_gmail_connected = true) as gmail_connected_count,
  COUNT(*) FILTER (WHERE step_first_contact_added = true) as first_contact_count,
  COUNT(*) FILTER (WHERE step_first_email_sent = true) as first_email_count,
  COUNT(*) FILTER (WHERE step_viewed_analytics = true) as viewed_analytics_count,

  AVG(EXTRACT(EPOCH FROM (wizard_completed_at - started_at))) / 60 as avg_completion_time_minutes

FROM user_onboarding_progress
GROUP BY workspace_id;

-- =====================================================================
-- Comments
-- =====================================================================

COMMENT ON TABLE user_onboarding_progress IS 'Tracks user progress through onboarding wizard. Each user has one record per workspace. Steps auto-update progress percentage via trigger. Wizard considered complete when all 5 steps done.';

COMMENT ON VIEW onboarding_analytics IS 'Aggregated onboarding metrics per workspace showing completion rates, average progress, and step-by-step completion counts. Used for product analytics and onboarding optimization.';
