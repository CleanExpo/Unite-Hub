/**
 * Migration 156: Trial Activity Log
 *
 * Purpose: Audit all trial user actions for truth-layer compliance
 * Dependencies: trial_profiles
 * Truth Layer: All limit hits, denials, and prompts must be logged
 */

-- Trial Activity Log Table
CREATE TABLE IF NOT EXISTS trial_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity Classification
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'ai_usage',
    'vif_generation',
    'blueprint_creation',
    'module_access',
    'limit_hit',
    'upgrade_prompt_shown',
    'upgrade_prompt_declined',
    'feature_denied',
    'trial_expired',
    'trial_converted'
  )),

  -- Activity Details
  activity_category TEXT NOT NULL CHECK (activity_category IN (
    'usage', 'limit', 'prompt', 'access', 'conversion'
  )),

  -- Context (JSONB for flexibility)
  context JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Examples:
  -- {"module": "blueprinter", "tokens_used": 1250, "remaining": 48750}
  -- {"limit_type": "vif_generations", "cap": 10, "used": 10}
  -- {"module": "high_volume_campaigns", "reason": "disabled_in_trial"}

  -- Truth Layer Fields
  user_message TEXT, -- Message shown to user (must be truthful)
  system_action TEXT, -- What the system did (allow, deny, warn)

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trial_activity_workspace_id ON trial_activity_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_trial_activity_user_id ON trial_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_activity_type ON trial_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_trial_activity_created_at ON trial_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trial_activity_workspace_created ON trial_activity_log(workspace_id, created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_trial_activity_workspace_type_created
  ON trial_activity_log(workspace_id, activity_type, created_at DESC);

-- Helper Functions

/**
 * Log trial activity
 * Used by all trial-related operations
 */
CREATE OR REPLACE FUNCTION log_trial_activity(
  p_workspace_id UUID,
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_category TEXT,
  p_context JSONB DEFAULT '{}'::JSONB,
  p_user_message TEXT DEFAULT NULL,
  p_system_action TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO trial_activity_log (
    workspace_id,
    user_id,
    activity_type,
    activity_category,
    context,
    user_message,
    system_action,
    ip_address,
    user_agent
  ) VALUES (
    p_workspace_id,
    p_user_id,
    p_activity_type,
    p_activity_category,
    p_context,
    p_user_message,
    p_system_action,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$;

/**
 * Get recent trial activity for workspace
 * Returns last N activities with context
 */
CREATE OR REPLACE FUNCTION get_trial_activity(
  p_workspace_id UUID,
  p_limit INTEGER DEFAULT 100,
  p_activity_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  activity_category TEXT,
  context JSONB,
  user_message TEXT,
  system_action TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tal.id,
    tal.activity_type,
    tal.activity_category,
    tal.context,
    tal.user_message,
    tal.system_action,
    tal.created_at
  FROM trial_activity_log tal
  WHERE tal.workspace_id = p_workspace_id
    AND (p_activity_type IS NULL OR tal.activity_type = p_activity_type)
  ORDER BY tal.created_at DESC
  LIMIT p_limit;
END;
$$;

/**
 * Get trial activity summary
 * Returns counts by activity type for dashboard
 */
CREATE OR REPLACE FUNCTION get_trial_activity_summary(
  p_workspace_id UUID,
  p_since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '14 days'
)
RETURNS TABLE (
  activity_type TEXT,
  activity_count BIGINT,
  last_activity_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tal.activity_type,
    COUNT(*) AS activity_count,
    MAX(tal.created_at) AS last_activity_at
  FROM trial_activity_log tal
  WHERE tal.workspace_id = p_workspace_id
    AND tal.created_at >= p_since
  GROUP BY tal.activity_type
  ORDER BY activity_count DESC;
END;
$$;

/**
 * Get trial limit hits
 * Returns all instances where user hit a trial limit
 */
CREATE OR REPLACE FUNCTION get_trial_limit_hits(
  p_workspace_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  limit_type TEXT,
  context JSONB,
  user_message TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (tal.context->>'limit_type')::TEXT AS limit_type,
    tal.context,
    tal.user_message,
    tal.created_at
  FROM trial_activity_log tal
  WHERE tal.workspace_id = p_workspace_id
    AND tal.activity_type = 'limit_hit'
  ORDER BY tal.created_at DESC
  LIMIT p_limit;
END;
$$;

/**
 * Get upgrade prompt history
 * Returns all upgrade prompt interactions
 */
CREATE OR REPLACE FUNCTION get_trial_upgrade_prompt_history(
  p_workspace_id UUID
)
RETURNS TABLE (
  was_declined BOOLEAN,
  context JSONB,
  user_message TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (tal.activity_type = 'upgrade_prompt_declined') AS was_declined,
    tal.context,
    tal.user_message,
    tal.created_at
  FROM trial_activity_log tal
  WHERE tal.workspace_id = p_workspace_id
    AND tal.activity_type IN ('upgrade_prompt_shown', 'upgrade_prompt_declined')
  ORDER BY tal.created_at DESC;
END;
$$;

-- Audit View (Read-only summary for founders)
CREATE OR REPLACE VIEW trial_activity_summary AS
SELECT
  tp.workspace_id,
  tp.is_trial,
  tp.trial_expires_at,
  tp.ai_tokens_used,
  tp.ai_tokens_cap,
  tp.vif_generations_used,
  tp.vif_generations_cap,
  tp.blueprints_created,
  tp.blueprints_cap,
  tp.upgrade_prompt_shown_count,
  tp.upgrade_declined_count,
  (SELECT COUNT(*) FROM trial_activity_log tal
   WHERE tal.workspace_id = tp.workspace_id
     AND tal.activity_type = 'limit_hit') AS total_limit_hits,
  (SELECT COUNT(*) FROM trial_activity_log tal
   WHERE tal.workspace_id = tp.workspace_id
     AND tal.activity_type = 'feature_denied') AS total_feature_denials,
  (SELECT MAX(created_at) FROM trial_activity_log tal
   WHERE tal.workspace_id = tp.workspace_id) AS last_activity_at
FROM trial_profiles tp
WHERE tp.is_trial = TRUE;

-- RLS Policies (Founder-only access)
ALTER TABLE trial_activity_log ENABLE ROW LEVEL SECURITY;

-- Founder can view their workspace's activity log
CREATE POLICY trial_activity_log_select_founder ON trial_activity_log
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM user_profiles
      WHERE id = auth.uid()
        AND role = 'founder'
    )
  );

-- Only system can insert activity log entries (via functions)
CREATE POLICY trial_activity_log_insert_system ON trial_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (FALSE); -- Use helper functions only

-- Comments
COMMENT ON TABLE trial_activity_log IS 'Audit log for all trial user actions (truth-layer compliance)';
COMMENT ON COLUMN trial_activity_log.activity_type IS 'Specific action taken (ai_usage, limit_hit, etc.)';
COMMENT ON COLUMN trial_activity_log.activity_category IS 'Broad category (usage, limit, prompt, access, conversion)';
COMMENT ON COLUMN trial_activity_log.context IS 'JSONB context with activity-specific details';
COMMENT ON COLUMN trial_activity_log.user_message IS 'Message shown to user (must be truthful)';
COMMENT ON COLUMN trial_activity_log.system_action IS 'What the system did (allow, deny, warn)';

COMMENT ON VIEW trial_activity_summary IS 'Read-only summary of trial activity for founders';
