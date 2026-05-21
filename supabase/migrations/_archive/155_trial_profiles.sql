/**
 * Migration 155: Trial Profiles
 *
 * Purpose: Track trial account status, capabilities, and limits
 * Dependencies: user_profiles, workspaces
 * Truth Layer: All trial limits must be transparent and logged
 */

-- Trial Profiles Table
CREATE TABLE IF NOT EXISTS trial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Trial Status
  is_trial BOOLEAN NOT NULL DEFAULT TRUE,
  trial_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  trial_ended_at TIMESTAMPTZ,
  trial_converted_at TIMESTAMPTZ,

  -- Capacity Limits (25% of production)
  ai_tokens_cap INTEGER NOT NULL DEFAULT 50000, -- ~25% of monthly pro allocation
  ai_tokens_used INTEGER NOT NULL DEFAULT 0,
  ai_tokens_last_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  vif_generations_cap INTEGER NOT NULL DEFAULT 10, -- Limited visual generations
  vif_generations_used INTEGER NOT NULL DEFAULT 0,

  blueprints_cap INTEGER NOT NULL DEFAULT 5, -- Limited campaign blueprints
  blueprints_created INTEGER NOT NULL DEFAULT 0,

  production_jobs_cap INTEGER NOT NULL DEFAULT 0, -- No production jobs in trial
  production_jobs_created INTEGER NOT NULL DEFAULT 0,

  -- Module Access (JSONB for flexibility)
  enabled_modules JSONB NOT NULL DEFAULT '["website_audit", "brand_persona", "initial_roadmap", "analytics_readonly", "topic_relevance"]'::JSONB,
  limited_modules JSONB NOT NULL DEFAULT '["blueprinter", "founder_ops", "content_generation"]'::JSONB,
  disabled_modules JSONB NOT NULL DEFAULT '["high_volume_campaigns", "automated_weekly", "cross_brand_orchestration"]'::JSONB,

  -- Upgrade Prompts
  upgrade_prompt_shown_count INTEGER NOT NULL DEFAULT 0,
  last_upgrade_prompt_shown_at TIMESTAMPTZ,
  upgrade_declined_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT trial_profiles_workspace_id_unique UNIQUE (workspace_id),
  CONSTRAINT trial_profiles_tokens_valid CHECK (ai_tokens_used <= ai_tokens_cap),
  CONSTRAINT trial_profiles_vif_valid CHECK (vif_generations_used <= vif_generations_cap),
  CONSTRAINT trial_profiles_blueprints_valid CHECK (blueprints_created <= blueprints_cap)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trial_profiles_workspace_id ON trial_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_trial_profiles_user_id ON trial_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_profiles_trial_status ON trial_profiles(is_trial, trial_expires_at);
CREATE INDEX IF NOT EXISTS idx_trial_profiles_expires_at ON trial_profiles(trial_expires_at) WHERE is_trial = TRUE;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_trial_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trial_profiles_updated_at
  BEFORE UPDATE ON trial_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_trial_profile_timestamp();

-- Helper Functions

/**
 * Get trial status for workspace
 * Returns trial profile with calculated remaining capacity
 */
CREATE OR REPLACE FUNCTION get_trial_status(p_workspace_id UUID)
RETURNS TABLE (
  is_trial BOOLEAN,
  trial_active BOOLEAN,
  days_remaining INTEGER,
  hours_remaining INTEGER,
  ai_tokens_remaining INTEGER,
  ai_tokens_percent_used NUMERIC(5,2),
  vif_generations_remaining INTEGER,
  blueprints_remaining INTEGER,
  enabled_modules JSONB,
  limited_modules JSONB,
  disabled_modules JSONB,
  trial_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tp.is_trial,
    (tp.is_trial AND tp.trial_expires_at > NOW()) AS trial_active,
    EXTRACT(DAY FROM (tp.trial_expires_at - NOW()))::INTEGER AS days_remaining,
    EXTRACT(HOUR FROM (tp.trial_expires_at - NOW()))::INTEGER AS hours_remaining,
    (tp.ai_tokens_cap - tp.ai_tokens_used) AS ai_tokens_remaining,
    CASE
      WHEN tp.ai_tokens_cap > 0 THEN ROUND((tp.ai_tokens_used::NUMERIC / tp.ai_tokens_cap::NUMERIC) * 100, 2)
      ELSE 0
    END AS ai_tokens_percent_used,
    (tp.vif_generations_cap - tp.vif_generations_used) AS vif_generations_remaining,
    (tp.blueprints_cap - tp.blueprints_created) AS blueprints_remaining,
    tp.enabled_modules,
    tp.limited_modules,
    tp.disabled_modules,
    tp.trial_expires_at
  FROM trial_profiles tp
  WHERE tp.workspace_id = p_workspace_id;
END;
$$;

/**
 * Check if module is enabled for trial workspace
 */
CREATE OR REPLACE FUNCTION is_module_enabled_for_trial(
  p_workspace_id UUID,
  p_module_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM trial_profiles
    WHERE workspace_id = p_workspace_id
      AND is_trial = TRUE
      AND trial_expires_at > NOW()
      AND enabled_modules ? p_module_name
  ) INTO v_enabled;

  RETURN COALESCE(v_enabled, FALSE);
END;
$$;

/**
 * Increment AI token usage
 * Returns success boolean and remaining tokens
 */
CREATE OR REPLACE FUNCTION increment_trial_ai_usage(
  p_workspace_id UUID,
  p_tokens_used INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  tokens_remaining INTEGER,
  cap_exceeded BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_used INTEGER;
  v_cap INTEGER;
  v_new_total INTEGER;
BEGIN
  -- Get current usage and cap
  SELECT ai_tokens_used, ai_tokens_cap
  INTO v_current_used, v_cap
  FROM trial_profiles
  WHERE workspace_id = p_workspace_id
    AND is_trial = TRUE
    AND trial_expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, FALSE;
    RETURN;
  END IF;

  v_new_total := v_current_used + p_tokens_used;

  -- Soft cap: allow usage but warn
  UPDATE trial_profiles
  SET ai_tokens_used = v_new_total,
      updated_at = NOW()
  WHERE workspace_id = p_workspace_id;

  RETURN QUERY SELECT
    TRUE,
    GREATEST(0, v_cap - v_new_total),
    (v_new_total > v_cap);
END;
$$;

/**
 * Increment VIF generation usage
 */
CREATE OR REPLACE FUNCTION increment_trial_vif_usage(
  p_workspace_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  generations_remaining INTEGER,
  cap_exceeded BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_used INTEGER;
  v_cap INTEGER;
BEGIN
  SELECT vif_generations_used, vif_generations_cap
  INTO v_current_used, v_cap
  FROM trial_profiles
  WHERE workspace_id = p_workspace_id
    AND is_trial = TRUE
    AND trial_expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, FALSE;
    RETURN;
  END IF;

  IF v_current_used >= v_cap THEN
    RETURN QUERY SELECT FALSE, 0, TRUE;
    RETURN;
  END IF;

  UPDATE trial_profiles
  SET vif_generations_used = vif_generations_used + 1,
      updated_at = NOW()
  WHERE workspace_id = p_workspace_id;

  RETURN QUERY SELECT TRUE, (v_cap - v_current_used - 1), FALSE;
END;
$$;

/**
 * Increment blueprint creation usage
 */
CREATE OR REPLACE FUNCTION increment_trial_blueprint_usage(
  p_workspace_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  blueprints_remaining INTEGER,
  cap_exceeded BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_used INTEGER;
  v_cap INTEGER;
BEGIN
  SELECT blueprints_created, blueprints_cap
  INTO v_current_used, v_cap
  FROM trial_profiles
  WHERE workspace_id = p_workspace_id
    AND is_trial = TRUE
    AND trial_expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, FALSE;
    RETURN;
  END IF;

  IF v_current_used >= v_cap THEN
    RETURN QUERY SELECT FALSE, 0, TRUE;
    RETURN;
  END IF;

  UPDATE trial_profiles
  SET blueprints_created = blueprints_created + 1,
      updated_at = NOW()
  WHERE workspace_id = p_workspace_id;

  RETURN QUERY SELECT TRUE, (v_cap - v_current_used - 1), FALSE;
END;
$$;

/**
 * Record upgrade prompt shown
 */
CREATE OR REPLACE FUNCTION record_trial_upgrade_prompt(
  p_workspace_id UUID,
  p_was_declined BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE trial_profiles
  SET
    upgrade_prompt_shown_count = upgrade_prompt_shown_count + 1,
    last_upgrade_prompt_shown_at = NOW(),
    upgrade_declined_count = CASE
      WHEN p_was_declined THEN upgrade_declined_count + 1
      ELSE upgrade_declined_count
    END,
    updated_at = NOW()
  WHERE workspace_id = p_workspace_id;
END;
$$;

/**
 * Convert trial to paid account
 */
CREATE OR REPLACE FUNCTION convert_trial_to_paid(
  p_workspace_id UUID,
  p_converted_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE trial_profiles
  SET
    is_trial = FALSE,
    trial_ended_at = NOW(),
    trial_converted_at = NOW(),
    updated_at = NOW()
  WHERE workspace_id = p_workspace_id
    AND is_trial = TRUE;

  RETURN FOUND;
END;
$$;

-- RLS Policies (Founder-only access)
ALTER TABLE trial_profiles ENABLE ROW LEVEL SECURITY;

-- Founder can view their workspace's trial profile
CREATE POLICY trial_profiles_select_founder ON trial_profiles
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'founder'
    )
  );

-- Founder can update their workspace's trial profile
CREATE POLICY trial_profiles_update_founder ON trial_profiles
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'founder'
    )
  );

-- Only system can insert trial profiles (via functions)
CREATE POLICY trial_profiles_insert_system ON trial_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (FALSE); -- Use helper functions only

-- Comments
COMMENT ON TABLE trial_profiles IS 'Trial account profiles with capacity limits and module access';
COMMENT ON COLUMN trial_profiles.ai_tokens_cap IS 'Soft cap: 50,000 tokens (~25% of monthly pro)';
COMMENT ON COLUMN trial_profiles.vif_generations_cap IS 'Hard cap: 10 visual generations';
COMMENT ON COLUMN trial_profiles.blueprints_cap IS 'Hard cap: 5 campaign blueprints';
COMMENT ON COLUMN trial_profiles.production_jobs_cap IS 'Hard cap: 0 production jobs in trial';
COMMENT ON COLUMN trial_profiles.enabled_modules IS 'Modules fully accessible in trial';
COMMENT ON COLUMN trial_profiles.limited_modules IS 'Modules with reduced functionality';
COMMENT ON COLUMN trial_profiles.disabled_modules IS 'Modules completely disabled';
