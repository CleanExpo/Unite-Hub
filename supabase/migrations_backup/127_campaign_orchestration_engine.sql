-- Migration 127: Multi-Agent Campaign Orchestration Engine (MCOE)
-- Phase 84: Unified scheduling, publishing, and cross-channel orchestration

-- ============================================================================
-- Table 1: campaign_orchestration_schedules
-- High-level orchestration plans per client, channel, campaign
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_orchestration_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scope
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  campaign_id UUID,

  -- Channel targeting
  channel TEXT NOT NULL CHECK (channel IN ('fb', 'ig', 'tiktok', 'linkedin', 'youtube', 'gmb', 'reddit', 'email', 'x')),

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  time_zone TEXT NOT NULL DEFAULT 'UTC',

  -- Content
  creative_asset_id UUID,
  variation_id UUID,
  content_preview JSONB DEFAULT '{}'::jsonb,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'executing', 'completed', 'failed', 'blocked', 'cancelled')),

  -- Orchestration metadata
  priority INTEGER NOT NULL DEFAULT 50,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Risk and compliance
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  blocked_reason TEXT,

  -- Execution tracking
  executed_at TIMESTAMPTZ,
  execution_result JSONB,

  -- Audit
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orchestration_schedules_client
  ON campaign_orchestration_schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_orchestration_schedules_workspace
  ON campaign_orchestration_schedules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_orchestration_schedules_channel
  ON campaign_orchestration_schedules(channel);
CREATE INDEX IF NOT EXISTS idx_orchestration_schedules_status
  ON campaign_orchestration_schedules(status);
CREATE INDEX IF NOT EXISTS idx_orchestration_schedules_time
  ON campaign_orchestration_schedules(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_orchestration_schedules_campaign
  ON campaign_orchestration_schedules(campaign_id);

-- ============================================================================
-- Table 2: campaign_orchestration_actions
-- Immutable log of all orchestration decisions
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_orchestration_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scope
  schedule_id UUID REFERENCES campaign_orchestration_schedules(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'select_asset', 'time_choice', 'variation_choice', 'evolution_step',
    'posting_decision', 'schedule_created', 'schedule_blocked', 'schedule_approved',
    'schedule_executed', 'schedule_failed', 'conflict_detected', 'fatigue_check'
  )),

  -- Decision data
  decision_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_signals JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Risk assessment
  risk_class TEXT NOT NULL DEFAULT 'low' CHECK (risk_class IN ('low', 'medium', 'high')),
  confidence_score NUMERIC(3,2) DEFAULT 0.8,

  -- Truth Layer compliance
  truth_notes TEXT,
  truth_compliant BOOLEAN NOT NULL DEFAULT true,
  disclaimers JSONB DEFAULT '[]'::jsonb,

  -- Status
  status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('accepted', 'rejected', 'auto_executed', 'awaiting_approval', 'pending')),

  -- Execution
  executed_at TIMESTAMPTZ,
  execution_result JSONB,

  -- Audit
  actor TEXT NOT NULL DEFAULT 'system'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orchestration_actions_schedule
  ON campaign_orchestration_actions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_orchestration_actions_client
  ON campaign_orchestration_actions(client_id);
CREATE INDEX IF NOT EXISTS idx_orchestration_actions_workspace
  ON campaign_orchestration_actions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_orchestration_actions_type
  ON campaign_orchestration_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_orchestration_actions_created
  ON campaign_orchestration_actions(created_at DESC);

-- ============================================================================
-- Table 3: channel_state
-- Fatigue, momentum, last posting time, and health per channel
-- ============================================================================

CREATE TABLE IF NOT EXISTS channel_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scope
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('fb', 'ig', 'tiktok', 'linkedin', 'youtube', 'gmb', 'reddit', 'email', 'x')),

  -- Posting history
  last_post_at TIMESTAMPTZ,
  posts_last_7_days INTEGER NOT NULL DEFAULT 0,
  posts_last_30_days INTEGER NOT NULL DEFAULT 0,

  -- Health scores (0-1)
  fatigue_score NUMERIC(3,2) NOT NULL DEFAULT 0,
  momentum_score NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  visibility_score NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  engagement_score NUMERIC(3,2) NOT NULL DEFAULT 0.5,

  -- Performance
  avg_engagement_rate NUMERIC(5,4) DEFAULT 0,
  best_posting_times JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  UNIQUE(client_id, channel)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channel_state_client
  ON channel_state(client_id);
CREATE INDEX IF NOT EXISTS idx_channel_state_workspace
  ON channel_state(workspace_id);
CREATE INDEX IF NOT EXISTS idx_channel_state_channel
  ON channel_state(channel);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE campaign_orchestration_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_orchestration_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_state ENABLE ROW LEVEL SECURITY;

-- Schedules policies
CREATE POLICY "Users can view schedules in their workspace" ON campaign_orchestration_schedules
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create schedules in their workspace" ON campaign_orchestration_schedules
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update schedules in their workspace" ON campaign_orchestration_schedules
  FOR UPDATE USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Actions policies
CREATE POLICY "Users can view actions in their workspace" ON campaign_orchestration_actions
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create actions in their workspace" ON campaign_orchestration_actions
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Channel state policies
CREATE POLICY "Users can view channel state in their workspace" ON channel_state
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage channel state in their workspace" ON channel_state
  FOR ALL USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Calculate channel health score
CREATE OR REPLACE FUNCTION calculate_channel_health(
  p_fatigue NUMERIC,
  p_momentum NUMERIC,
  p_visibility NUMERIC,
  p_engagement NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    (1 - p_fatigue) * 0.3 +
    p_momentum * 0.25 +
    p_visibility * 0.25 +
    p_engagement * 0.2
  );
END;
$$ LANGUAGE plpgsql;

-- Update channel state after posting
CREATE OR REPLACE FUNCTION update_channel_state_after_post()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO channel_state (client_id, workspace_id, channel, last_post_at, posts_last_7_days)
    VALUES (NEW.client_id, NEW.workspace_id, NEW.channel, now(), 1)
    ON CONFLICT (client_id, channel)
    DO UPDATE SET
      last_post_at = now(),
      posts_last_7_days = channel_state.posts_last_7_days + 1,
      posts_last_30_days = channel_state.posts_last_30_days + 1,
      fatigue_score = LEAST(channel_state.fatigue_score + 0.1, 1.0),
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_channel_state
  AFTER UPDATE ON campaign_orchestration_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_state_after_post();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE campaign_orchestration_schedules IS 'Phase 84: Orchestration plans per client, channel, campaign';
COMMENT ON TABLE campaign_orchestration_actions IS 'Phase 84: Immutable log of orchestration decisions';
COMMENT ON TABLE channel_state IS 'Phase 84: Channel fatigue, momentum, visibility per client';

COMMENT ON COLUMN channel_state.fatigue_score IS 'Higher = more fatigued, posting should slow';
COMMENT ON COLUMN channel_state.momentum_score IS 'Higher = good engagement trend';
COMMENT ON COLUMN channel_state.visibility_score IS 'Higher = better reach/impressions';
