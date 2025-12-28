-- Project Vend Phase 2: Enhanced Escalation System
-- Dynamic escalation chains, approval workflows, anomaly detection

-- Agent escalations table
CREATE TABLE IF NOT EXISTS agent_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  execution_id UUID REFERENCES agent_executions(id) ON DELETE SET NULL,

  -- Escalation details
  escalation_type TEXT NOT NULL, -- rule_violation | health_degraded | cost_exceeded | anomaly_detected | low_confidence | manual
  severity TEXT NOT NULL, -- info | warning | critical
  title TEXT NOT NULL,
  description TEXT,
  context JSONB, -- Additional data about the escalation

  -- Approval workflow
  requires_approval BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending', -- pending | approved | rejected | auto_resolved
  approved_by UUID REFERENCES auth.users(id),
  approval_reason TEXT,
  approved_at TIMESTAMPTZ,

  -- Actions
  action_taken TEXT, -- blocked | allowed | paused_agent | triggered_fallback | manual_intervention
  auto_resolved BOOLEAN DEFAULT false,
  resolution_details JSONB,

  -- Escalation chain
  escalated_to UUID REFERENCES auth.users(id), -- Current approver (supervisor/manager)
  escalation_chain JSONB, -- Array of user IDs [user_id_1, user_id_2, ...]
  current_approver_index INTEGER DEFAULT 0,

  -- Timestamps
  escalated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_escalation_type CHECK (escalation_type IN ('rule_violation', 'health_degraded', 'cost_exceeded', 'anomaly_detected', 'low_confidence', 'manual')),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT valid_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_resolved')),
  CONSTRAINT valid_action_taken CHECK (action_taken IN ('blocked', 'allowed', 'paused_agent', 'triggered_fallback', 'manual_intervention'))
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_escalations_workspace
  ON agent_escalations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_escalations_status
  ON agent_escalations(approval_status, escalated_at DESC)
  WHERE approval_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_escalations_agent
  ON agent_escalations(agent_name, severity);

CREATE INDEX IF NOT EXISTS idx_escalations_approver
  ON agent_escalations(escalated_to)
  WHERE escalated_to IS NOT NULL AND approval_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_escalations_execution
  ON agent_escalations(execution_id)
  WHERE execution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_escalations_type
  ON agent_escalations(escalation_type, workspace_id, escalated_at DESC);

-- Row Level Security
ALTER TABLE agent_escalations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view escalations for their workspace
DROP POLICY IF EXISTS "Users can view their workspace escalations" ON agent_escalations;
CREATE POLICY "Users can view their workspace escalations" ON agent_escalations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can approve escalations assigned to them
DROP POLICY IF EXISTS "Users can approve assigned escalations" ON agent_escalations;
CREATE POLICY "Users can approve assigned escalations" ON agent_escalations
  FOR UPDATE
  USING (
    escalated_to = auth.uid() OR
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    escalated_to = auth.uid() OR
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
    )
  );

-- RLS Policy: System can create escalations
DROP POLICY IF EXISTS "System can create escalations" ON agent_escalations;
CREATE POLICY "System can create escalations" ON agent_escalations
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: System can update escalations
DROP POLICY IF EXISTS "System can update escalations" ON agent_escalations;
CREATE POLICY "System can update escalations" ON agent_escalations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update FK in rule_violations when escalation created
CREATE OR REPLACE FUNCTION link_violation_to_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If this escalation is for a rule violation, link it
  IF NEW.escalation_type = 'rule_violation' AND NEW.context ? 'violation_id' THEN
    UPDATE agent_rule_violations
    SET escalation_id = NEW.id
    WHERE id = (NEW.context->>'violation_id')::UUID;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_link_violation_to_escalation ON agent_escalations;
CREATE TRIGGER trigger_link_violation_to_escalation
  AFTER INSERT ON agent_escalations
  FOR EACH ROW
  EXECUTE FUNCTION link_violation_to_escalation();

-- View: Pending approvals (needs immediate attention)
CREATE OR REPLACE VIEW pending_approvals AS
SELECT
  e.*,
  w.name as workspace_name,
  u.email as approver_email,
  EXTRACT(EPOCH FROM (NOW() - e.escalated_at)) / 3600 as hours_pending
FROM agent_escalations e
LEFT JOIN workspaces w ON w.id = e.workspace_id
LEFT JOIN auth.users u ON u.id = e.escalated_to
WHERE e.approval_status = 'pending'
  AND e.requires_approval = true
ORDER BY
  CASE e.severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'info' THEN 3
  END,
  e.escalated_at ASC;

COMMENT ON VIEW pending_approvals IS 'Escalations requiring immediate approval, sorted by severity and age';

-- Function: Get escalation queue for user
CREATE OR REPLACE FUNCTION get_escalation_queue_for_user(
  p_user_id UUID
)
RETURNS TABLE (
  escalation_id UUID,
  agent_name TEXT,
  escalation_type TEXT,
  severity TEXT,
  title TEXT,
  description TEXT,
  escalated_at TIMESTAMPTZ,
  hours_pending NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as escalation_id,
    e.agent_name,
    e.escalation_type,
    e.severity,
    e.title,
    e.description,
    e.escalated_at,
    EXTRACT(EPOCH FROM (NOW() - e.escalated_at)) / 3600 as hours_pending
  FROM agent_escalations e
  WHERE e.escalated_to = p_user_id
    AND e.approval_status = 'pending'
    AND e.requires_approval = true
  ORDER BY
    CASE e.severity
      WHEN 'critical' THEN 1
      WHEN 'warning' THEN 2
      WHEN 'info' THEN 3
    END,
    e.escalated_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_escalation_queue_for_user IS 'Get pending escalations assigned to a specific user, sorted by severity';

-- Function: Auto-resolve stale escalations
CREATE OR REPLACE FUNCTION auto_resolve_stale_escalations(
  p_hours_threshold INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
  v_resolved_count INTEGER;
BEGIN
  UPDATE agent_escalations
  SET
    approval_status = 'auto_resolved',
    auto_resolved = true,
    resolved_at = NOW(),
    resolution_details = jsonb_build_object(
      'reason', 'Auto-resolved after ' || p_hours_threshold || ' hours',
      'auto_resolved_at', NOW()
    )
  WHERE approval_status = 'pending'
    AND escalated_at < NOW() - (p_hours_threshold || ' hours')::INTERVAL
    AND severity IN ('info', 'warning'); -- Only auto-resolve non-critical

  GET DIAGNOSTICS v_resolved_count = ROW_COUNT;
  RETURN v_resolved_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_resolve_stale_escalations IS 'Auto-resolves non-critical escalations pending longer than threshold hours (default 24)';

-- Comments for documentation
COMMENT ON TABLE agent_escalations IS 'Enhanced escalation system for agent events requiring approval or attention (Project Vend Phase 2).';
COMMENT ON COLUMN agent_escalations.escalation_type IS 'Why escalation triggered: rule_violation, health_degraded, cost_exceeded, anomaly_detected, low_confidence, manual';
COMMENT ON COLUMN agent_escalations.escalation_chain IS 'Array of user IDs representing approval chain. Escalates up chain if timeout.';
COMMENT ON COLUMN agent_escalations.current_approver_index IS 'Index into escalation_chain showing current approver position';
