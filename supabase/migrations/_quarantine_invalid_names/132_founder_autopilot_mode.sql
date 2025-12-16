-- Migration 132: Founder Autopilot Mode
-- Phase 89: Weekly Operator Engine for guided autopilot

-- ============================================================================
-- Table 1: autopilot_preferences
-- Stores per-founder settings for automation level and domains
-- ============================================================================

CREATE TABLE IF NOT EXISTS autopilot_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  founder_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Automation profile
  automation_profile TEXT NOT NULL DEFAULT 'conservative'
    CHECK (automation_profile IN ('off', 'conservative', 'balanced', 'aggressive')),

  -- Per-domain automation levels
  domain_levels JSONB NOT NULL DEFAULT '{
    "reporting": "auto",
    "creative": "suggest",
    "posting": "approval_only",
    "outreach": "suggest",
    "optimisation": "suggest",
    "housekeeping": "auto"
  }'::jsonb,

  -- Schedule preferences
  schedule_prefs JSONB NOT NULL DEFAULT '{
    "playbook_cadence": "weekly",
    "execution_cadence": "daily",
    "preferred_day": "monday",
    "preferred_hour": 9
  }'::jsonb,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_autopilot_prefs_workspace
  ON autopilot_preferences(workspace_id);

-- ============================================================================
-- Table 2: autopilot_playbooks
-- Weekly/daily playbooks containing grouped autopilot actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS autopilot_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  workspace_id UUID NOT NULL,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),

  -- Summary
  summary_markdown TEXT NOT NULL,

  -- Meta scores
  meta_scores JSONB NOT NULL DEFAULT '{
    "risk_mix": 0,
    "effort_total": 0,
    "impact_total": 0,
    "coverage_percent": 0
  }'::jsonb,

  -- Stats
  total_actions INTEGER NOT NULL DEFAULT 0,
  auto_executed INTEGER NOT NULL DEFAULT 0,
  awaiting_approval INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,

  -- Truth layer
  truth_complete BOOLEAN NOT NULL DEFAULT true,
  truth_notes TEXT,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_autopilot_playbooks_workspace
  ON autopilot_playbooks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_playbooks_period
  ON autopilot_playbooks(period_start DESC);
CREATE INDEX IF NOT EXISTS idx_autopilot_playbooks_status
  ON autopilot_playbooks(status);

-- ============================================================================
-- Table 3: autopilot_actions
-- Individual actions recommended or executed as part of a playbook
-- ============================================================================

CREATE TABLE IF NOT EXISTS autopilot_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  playbook_id UUID NOT NULL REFERENCES autopilot_playbooks(id) ON DELETE CASCADE,
  client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL,

  -- Classification
  category TEXT NOT NULL
    CHECK (category IN ('creative', 'reporting', 'success', 'risk', 'scaling', 'housekeeping', 'outreach', 'optimisation')),
  source_engine TEXT NOT NULL
    CHECK (source_engine IN ('early_warning', 'performance_reality', 'combat', 'scaling_mode', 'client_agent', 'orchestration', 'posting_engine', 'founder_intel', 'archive', 'manual')),
  action_type TEXT NOT NULL,

  -- Risk and impact
  risk_class TEXT NOT NULL DEFAULT 'low'
    CHECK (risk_class IN ('low', 'medium', 'high')),
  impact_estimate NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  effort_estimate NUMERIC(3,2) NOT NULL DEFAULT 0.5,

  -- Priority (computed)
  priority_score NUMERIC(5,2) NOT NULL DEFAULT 0,

  -- State
  state TEXT NOT NULL DEFAULT 'suggested'
    CHECK (state IN ('suggested', 'auto_executed', 'approved_executed', 'rejected', 'skipped')),

  -- Action details
  title TEXT NOT NULL,
  description TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  execution_result JSONB,

  -- Timing
  executed_at TIMESTAMPTZ,
  executed_by UUID,

  -- Truth layer
  truth_notes TEXT,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_playbook
  ON autopilot_actions(playbook_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_client
  ON autopilot_actions(client_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_workspace
  ON autopilot_actions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_category
  ON autopilot_actions(category);
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_state
  ON autopilot_actions(state);
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_priority
  ON autopilot_actions(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_autopilot_actions_created
  ON autopilot_actions(created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE autopilot_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_actions ENABLE ROW LEVEL SECURITY;

-- Preferences policies
CREATE POLICY "Users can view their own preferences" ON autopilot_preferences
  FOR SELECT USING (founder_user_id = auth.uid());

CREATE POLICY "Users can manage their own preferences" ON autopilot_preferences
  FOR ALL USING (founder_user_id = auth.uid());

CREATE POLICY "Admins can view all preferences" ON autopilot_preferences
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Playbook policies
CREATE POLICY "Users can view playbooks in their workspace" ON autopilot_playbooks
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage playbooks" ON autopilot_playbooks
  FOR ALL USING (true);

-- Action policies
CREATE POLICY "Users can view actions in their workspace" ON autopilot_actions
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage actions" ON autopilot_actions
  FOR ALL USING (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get autopilot stats for workspace
CREATE OR REPLACE FUNCTION get_autopilot_stats(
  p_workspace_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_playbooks', (
      SELECT COUNT(*) FROM autopilot_playbooks
      WHERE workspace_id = p_workspace_id
        AND created_at >= now() - (p_days || ' days')::interval
    ),
    'total_actions', (
      SELECT COUNT(*) FROM autopilot_actions
      WHERE workspace_id = p_workspace_id
        AND created_at >= now() - (p_days || ' days')::interval
    ),
    'auto_executed', (
      SELECT COUNT(*) FROM autopilot_actions
      WHERE workspace_id = p_workspace_id
        AND state = 'auto_executed'
        AND created_at >= now() - (p_days || ' days')::interval
    ),
    'approved_executed', (
      SELECT COUNT(*) FROM autopilot_actions
      WHERE workspace_id = p_workspace_id
        AND state = 'approved_executed'
        AND created_at >= now() - (p_days || ' days')::interval
    ),
    'awaiting_approval', (
      SELECT COUNT(*) FROM autopilot_actions
      WHERE workspace_id = p_workspace_id
        AND state = 'suggested'
        AND risk_class IN ('medium', 'high')
        AND created_at >= now() - (p_days || ' days')::interval
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- Update playbook stats
CREATE OR REPLACE FUNCTION update_playbook_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE autopilot_playbooks
  SET
    total_actions = (
      SELECT COUNT(*) FROM autopilot_actions WHERE playbook_id = NEW.playbook_id
    ),
    auto_executed = (
      SELECT COUNT(*) FROM autopilot_actions WHERE playbook_id = NEW.playbook_id AND state = 'auto_executed'
    ),
    awaiting_approval = (
      SELECT COUNT(*) FROM autopilot_actions WHERE playbook_id = NEW.playbook_id AND state = 'suggested' AND risk_class IN ('medium', 'high')
    ),
    completed = (
      SELECT COUNT(*) FROM autopilot_actions WHERE playbook_id = NEW.playbook_id AND state IN ('auto_executed', 'approved_executed')
    )
  WHERE id = NEW.playbook_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_playbook_stats
  AFTER INSERT OR UPDATE ON autopilot_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_playbook_stats();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE autopilot_preferences IS 'Phase 89: Per-founder autopilot settings';
COMMENT ON TABLE autopilot_playbooks IS 'Phase 89: Weekly operating plans with actions';
COMMENT ON TABLE autopilot_actions IS 'Phase 89: Individual autopilot actions';

COMMENT ON COLUMN autopilot_preferences.automation_profile IS 'off | conservative | balanced | aggressive';
COMMENT ON COLUMN autopilot_actions.risk_class IS 'low | medium | high';
COMMENT ON COLUMN autopilot_actions.state IS 'suggested | auto_executed | approved_executed | rejected | skipped';
