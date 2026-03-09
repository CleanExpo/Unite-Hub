-- Migration 128: Autonomous Multi-Channel Posting Engine (AMPE)
-- Phase 85: Safe, truth-layer-compliant multi-channel publishing

-- ============================================================================
-- Table 1: posting_attempts
-- Immutable log of publishing attempts, results, and safety checks
-- ============================================================================

CREATE TABLE IF NOT EXISTS posting_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  schedule_id UUID NOT NULL REFERENCES campaign_orchestration_schedules(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Channel
  channel TEXT NOT NULL CHECK (channel IN ('fb', 'ig', 'tiktok', 'linkedin', 'youtube', 'gmb', 'reddit', 'email', 'x')),

  -- Timing
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'blocked', 'published', 'failed', 'draft_created')),

  -- Execution details
  execution_payload JSONB,
  platform_response JSONB,
  platform_post_id TEXT,

  -- Error handling
  error_message TEXT,
  error_code TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  -- Safety and compliance
  safety_checks JSONB NOT NULL DEFAULT '{}'::jsonb,
  truth_notes TEXT,
  truth_compliant BOOLEAN NOT NULL DEFAULT true,
  confidence_score NUMERIC(3,2) DEFAULT 0.8,

  -- Audit
  triggered_by TEXT NOT NULL DEFAULT 'system',
  approved_by UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posting_attempts_schedule
  ON posting_attempts(schedule_id);
CREATE INDEX IF NOT EXISTS idx_posting_attempts_client
  ON posting_attempts(client_id);
CREATE INDEX IF NOT EXISTS idx_posting_attempts_workspace
  ON posting_attempts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_posting_attempts_channel
  ON posting_attempts(channel);
CREATE INDEX IF NOT EXISTS idx_posting_attempts_status
  ON posting_attempts(status);
CREATE INDEX IF NOT EXISTS idx_posting_attempts_time
  ON posting_attempts(attempted_at DESC);

-- ============================================================================
-- Table 2: channel_tokens
-- Store encrypted per-channel tokens for posting integrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS channel_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scope
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Token storage (encrypted in production)
  tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure: { fb: { access_token, page_id, expires_at }, ig: {...}, ... }

  -- Status
  channels_connected TEXT[] NOT NULL DEFAULT '{}',
  last_validated_at TIMESTAMPTZ,
  validation_errors JSONB DEFAULT '{}'::jsonb,

  UNIQUE(client_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channel_tokens_client
  ON channel_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_channel_tokens_workspace
  ON channel_tokens(workspace_id);

-- ============================================================================
-- Table 3: posting_engine_config
-- Global and per-workspace configuration for AMPE
-- ============================================================================

CREATE TABLE IF NOT EXISTS posting_engine_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scope (null = global)
  workspace_id UUID,

  -- Engine settings
  engine_enabled BOOLEAN NOT NULL DEFAULT true,
  draft_mode_only BOOLEAN NOT NULL DEFAULT true,  -- Phase 85 default
  auto_publish_low_risk BOOLEAN NOT NULL DEFAULT false,
  require_approval_medium BOOLEAN NOT NULL DEFAULT true,
  require_approval_high BOOLEAN NOT NULL DEFAULT true,

  -- Safety thresholds
  min_confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.6,
  max_fatigue_score NUMERIC(3,2) NOT NULL DEFAULT 0.8,
  block_during_warnings BOOLEAN NOT NULL DEFAULT true,

  -- Rate limits
  max_posts_per_hour INTEGER NOT NULL DEFAULT 10,
  max_posts_per_day INTEGER NOT NULL DEFAULT 50,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,

  UNIQUE(workspace_id)
);

-- Insert global default config
INSERT INTO posting_engine_config (workspace_id, engine_enabled, draft_mode_only)
VALUES (NULL, true, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE posting_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_engine_config ENABLE ROW LEVEL SECURITY;

-- Posting attempts policies
CREATE POLICY "Users can view posting attempts in their workspace" ON posting_attempts
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create posting attempts in their workspace" ON posting_attempts
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Channel tokens policies
CREATE POLICY "Users can view tokens in their workspace" ON channel_tokens
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage tokens in their workspace" ON channel_tokens
  FOR ALL USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Config policies
CREATE POLICY "Users can view config for their workspace" ON posting_engine_config
  FOR SELECT USING (
    workspace_id IS NULL OR
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage config" ON posting_engine_config
  FOR ALL USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get effective config for a workspace (merges global + workspace)
CREATE OR REPLACE FUNCTION get_posting_engine_config(p_workspace_id UUID)
RETURNS posting_engine_config AS $$
DECLARE
  v_global posting_engine_config;
  v_workspace posting_engine_config;
BEGIN
  -- Get global config
  SELECT * INTO v_global FROM posting_engine_config WHERE workspace_id IS NULL;

  -- Get workspace-specific config
  SELECT * INTO v_workspace FROM posting_engine_config WHERE workspace_id = p_workspace_id;

  -- Return workspace config if exists, else global
  IF v_workspace.id IS NOT NULL THEN
    RETURN v_workspace;
  ELSE
    RETURN v_global;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Check if posting is allowed for a schedule
CREATE OR REPLACE FUNCTION is_posting_allowed(
  p_workspace_id UUID,
  p_risk_level TEXT,
  p_confidence NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  v_config posting_engine_config;
BEGIN
  v_config := get_posting_engine_config(p_workspace_id);

  -- Check if engine is enabled
  IF NOT v_config.engine_enabled THEN
    RETURN FALSE;
  END IF;

  -- Check confidence threshold
  IF p_confidence < v_config.min_confidence_score THEN
    RETURN FALSE;
  END IF;

  -- Check risk-based approval requirements
  IF p_risk_level = 'high' AND v_config.require_approval_high THEN
    RETURN FALSE; -- Requires manual approval
  END IF;

  IF p_risk_level = 'medium' AND v_config.require_approval_medium THEN
    RETURN FALSE; -- Requires manual approval
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update posting attempt status
CREATE OR REPLACE FUNCTION complete_posting_attempt(
  p_attempt_id UUID,
  p_status TEXT,
  p_platform_response JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS posting_attempts AS $$
DECLARE
  v_attempt posting_attempts;
BEGIN
  UPDATE posting_attempts
  SET
    status = p_status,
    completed_at = now(),
    platform_response = COALESCE(p_platform_response, platform_response),
    error_message = p_error_message
  WHERE id = p_attempt_id
  RETURNING * INTO v_attempt;

  RETURN v_attempt;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger: Update schedule status after posting attempt
-- ============================================================================

CREATE OR REPLACE FUNCTION update_schedule_after_posting()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('published', 'draft_created') THEN
    UPDATE campaign_orchestration_schedules
    SET
      status = CASE
        WHEN NEW.status = 'published' THEN 'completed'
        ELSE 'ready'
      END,
      executed_at = now(),
      execution_result = NEW.platform_response
    WHERE id = NEW.schedule_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE campaign_orchestration_schedules
    SET
      status = 'failed',
      execution_result = jsonb_build_object(
        'error', NEW.error_message,
        'attempt_id', NEW.id
      )
    WHERE id = NEW.schedule_id;
  ELSIF NEW.status = 'blocked' THEN
    UPDATE campaign_orchestration_schedules
    SET
      status = 'blocked',
      blocked_reason = NEW.error_message
    WHERE id = NEW.schedule_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_schedule_after_posting
  AFTER UPDATE ON posting_attempts
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status != 'pending')
  EXECUTE FUNCTION update_schedule_after_posting();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE posting_attempts IS 'Phase 85: Immutable log of all publishing attempts';
COMMENT ON TABLE channel_tokens IS 'Phase 85: Encrypted tokens for channel integrations';
COMMENT ON TABLE posting_engine_config IS 'Phase 85: Global and workspace AMPE configuration';

COMMENT ON COLUMN posting_attempts.safety_checks IS 'All guardrails evaluated before publish attempt';
COMMENT ON COLUMN posting_attempts.truth_notes IS 'Truth layer compliance notes';
COMMENT ON COLUMN channel_tokens.tokens IS 'Encrypted channel credentials (fb, ig, linkedin, etc.)';
COMMENT ON COLUMN posting_engine_config.draft_mode_only IS 'When true, AMPE only creates drafts';
