-- Project Vend Phase 2: Escalation Configuration
-- Workspace-specific settings for escalation chains and notifications

-- Escalation configuration table
CREATE TABLE IF NOT EXISTS escalation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Escalation chains (JSON mapping severity to user ID arrays)
  escalation_chains JSONB NOT NULL DEFAULT '{
    "critical": [],
    "warning": [],
    "info": []
  }'::jsonb,
  -- Example: {"critical": ["user-1", "user-2"], "warning": ["user-1"], "info": []}

  -- Auto-resolution rules
  auto_resolve_after_hours INTEGER DEFAULT 24,
  auto_approve_low_severity BOOLEAN DEFAULT false,

  -- Notification settings
  notify_immediately BOOLEAN DEFAULT true,
  notification_channels JSONB DEFAULT '["dashboard"]'::jsonb, -- ["email", "slack", "dashboard", "webhook"]
  webhook_url TEXT,

  -- Escalation policies
  escalate_up_chain_after_hours INTEGER DEFAULT 4, -- Move to next approver if no response
  max_pending_escalations INTEGER DEFAULT 50, -- Pause agents if queue too large

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id),
  CONSTRAINT valid_auto_resolve_hours CHECK (auto_resolve_after_hours > 0),
  CONSTRAINT valid_escalate_hours CHECK (escalate_up_chain_after_hours > 0),
  CONSTRAINT valid_max_pending CHECK (max_pending_escalations > 0)
);

-- Index for workspace lookup
CREATE INDEX IF NOT EXISTS idx_escalation_config_workspace
  ON escalation_config(workspace_id);

-- Row Level Security
ALTER TABLE escalation_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view config for their workspace
DROP POLICY IF EXISTS "Users can view their escalation config" ON escalation_config;
CREATE POLICY "Users can view their escalation config" ON escalation_config
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: Admins can manage escalation config
DROP POLICY IF EXISTS "Admins can manage escalation config" ON escalation_config;
CREATE POLICY "Admins can manage escalation config" ON escalation_config
  FOR ALL
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_escalation_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS trigger_update_escalation_config_updated_at ON escalation_config;
CREATE TRIGGER trigger_update_escalation_config_updated_at
  BEFORE UPDATE ON escalation_config
  FOR EACH ROW
  EXECUTE FUNCTION update_escalation_config_updated_at();

-- Function to get approver for severity level
CREATE OR REPLACE FUNCTION get_approver_for_severity(
  p_workspace_id UUID,
  p_severity TEXT
)
RETURNS UUID AS $$
DECLARE
  v_chain JSONB;
  v_approver_id UUID;
BEGIN
  SELECT escalation_chains INTO v_chain
  FROM escalation_config
  WHERE workspace_id = p_workspace_id;

  IF v_chain IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get first user in chain for this severity
  v_approver_id := (v_chain->p_severity->>0)::UUID;

  RETURN v_approver_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_approver_for_severity IS 'Get first approver in escalation chain for given severity level';

-- Function to escalate up the chain
CREATE OR REPLACE FUNCTION escalate_up_chain(
  p_escalation_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_escalation RECORD;
  v_next_index INTEGER;
  v_next_approver_id UUID;
  v_chain_array JSONB;
BEGIN
  -- Get current escalation
  SELECT * INTO v_escalation
  FROM agent_escalations
  WHERE id = p_escalation_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get chain for this severity
  SELECT escalation_chains->v_escalation.severity INTO v_chain_array
  FROM escalation_config
  WHERE workspace_id = v_escalation.workspace_id;

  IF v_chain_array IS NULL THEN
    RETURN false;
  END IF;

  -- Calculate next index
  v_next_index := v_escalation.current_approver_index + 1;

  -- Check if there's a next approver
  IF jsonb_array_length(v_chain_array) <= v_next_index THEN
    -- No more approvers in chain, auto-resolve
    UPDATE agent_escalations
    SET
      approval_status = 'auto_resolved',
      auto_resolved = true,
      resolved_at = NOW(),
      resolution_details = jsonb_build_object(
        'reason', 'Escalated through entire chain with no approval',
        'chain_exhausted', true
      )
    WHERE id = p_escalation_id;

    RETURN false;
  END IF;

  -- Get next approver
  v_next_approver_id := (v_chain_array->>v_next_index)::UUID;

  -- Update escalation to next approver
  UPDATE agent_escalations
  SET
    current_approver_index = v_next_index,
    escalated_to = v_next_approver_id
  WHERE id = p_escalation_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION escalate_up_chain IS 'Move escalation to next approver in chain. Returns true if escalated, false if chain exhausted.';

-- Comments for documentation
COMMENT ON TABLE escalation_config IS 'Workspace-specific escalation configuration including chains, auto-resolution rules, and notifications (Project Vend Phase 2).';
COMMENT ON COLUMN escalation_config.escalation_chains IS 'JSONB mapping severity levels to arrays of user IDs: {"critical": ["user-1", "user-2"], "warning": ["user-1"]}';
COMMENT ON COLUMN escalation_config.auto_resolve_after_hours IS 'Hours to wait before auto-resolving non-critical escalations (default 24)';
COMMENT ON COLUMN escalation_config.escalate_up_chain_after_hours IS 'Hours to wait before escalating to next approver in chain (default 4)';
