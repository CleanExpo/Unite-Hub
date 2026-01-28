-- Phase V1.1 Subphase v1_1_01: Founder Ops Hub Schema
-- Stores founder approvals, override decisions, and audit trail

CREATE TABLE IF NOT EXISTS founder_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  agent TEXT NOT NULL,
  item_type TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  summary TEXT NOT NULL,
  details JSONB NOT NULL,
  approved BOOLEAN,
  decision_by TEXT,
  decision_at TIMESTAMP WITH TIME ZONE,
  decision_reason TEXT,
  CONSTRAINT valid_agent CHECK (agent IN ('email', 'content', 'research', 'scheduling', 'analysis', 'coordination')),
  CONSTRAINT valid_item_type CHECK (item_type IN ('claim', 'campaign', 'email', 'automation', 'brand_change', 'override')),
  CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_brand FOREIGN KEY (brand_id) REFERENCES brand_metadata(brand_id) ON DELETE RESTRICT
);

-- Founder audit log (comprehensive event tracking)
CREATE TABLE IF NOT EXISTS founder_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  event TEXT NOT NULL,
  actor TEXT NOT NULL,
  brand_id TEXT,
  item_id TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  data JSONB NOT NULL,
  CONSTRAINT valid_event CHECK (
    event IN (
      'agent_action',
      'approval_decision',
      'risk_assessment',
      'override_decision',
      'brand_change',
      'campaign_launch',
      'system_health_check'
    )
  ),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  CONSTRAINT valid_brand_log FOREIGN KEY (brand_id) REFERENCES brand_metadata(brand_id) ON DELETE SET NULL
);

-- Founder override decisions (for critical actions)
CREATE TABLE IF NOT EXISTS founder_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  override_type TEXT NOT NULL,
  approval_id UUID NOT NULL REFERENCES founder_approvals(id) ON DELETE RESTRICT,
  decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB,
  CONSTRAINT valid_override_type CHECK (override_type IN (
    'public_claims',
    'brand_position_changes',
    'high_risk_automation',
    'external_communications',
    'financial_estimates'
  ))
);

-- Enable RLS on all tables
ALTER TABLE founder_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Read-only for authenticated users
CREATE POLICY founder_approvals_authenticated_read ON founder_approvals
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.role() = 'authenticated');

CREATE POLICY founder_event_log_authenticated_read ON founder_event_log
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.role() = 'authenticated');

CREATE POLICY founder_overrides_authenticated_read ON founder_overrides
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.role() = 'authenticated');

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_founder_approvals_agent ON founder_approvals(agent);
CREATE INDEX IF NOT EXISTS idx_founder_approvals_risk ON founder_approvals(risk_level);
CREATE INDEX IF NOT EXISTS idx_founder_approvals_brand ON founder_approvals(brand_id);
CREATE INDEX IF NOT EXISTS idx_founder_approvals_status ON founder_approvals(approved);
CREATE INDEX IF NOT EXISTS idx_founder_approvals_created ON founder_approvals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_founder_event_log_event ON founder_event_log(event);
CREATE INDEX IF NOT EXISTS idx_founder_event_log_actor ON founder_event_log(actor);
CREATE INDEX IF NOT EXISTS idx_founder_event_log_brand ON founder_event_log(brand_id);
CREATE INDEX IF NOT EXISTS idx_founder_event_log_severity ON founder_event_log(severity);
CREATE INDEX IF NOT EXISTS idx_founder_event_log_created ON founder_event_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_founder_overrides_approval ON founder_overrides(approval_id);
CREATE INDEX IF NOT EXISTS idx_founder_overrides_type ON founder_overrides(override_type);

-- Comments for documentation
COMMENT ON TABLE founder_approvals IS 'Tracks approval requests and decisions for agent outputs. Risk-based routing determines if auto-approved or requires founder review.';
COMMENT ON TABLE founder_event_log IS 'Comprehensive audit trail of all founder-relevant system events. Used for transparency, debugging, compliance.';
COMMENT ON TABLE founder_overrides IS 'Records of founder override decisions on high-risk actions. Documents why founder chose alternative action.';

COMMENT ON COLUMN founder_approvals.risk_level IS 'Score-based risk: low (0-19), medium (20-39), high (40-69), critical (70+).';
COMMENT ON COLUMN founder_approvals.approved IS 'NULL until decision made, true if approved, false if rejected.';
COMMENT ON COLUMN founder_event_log.severity IS 'info (routine), warning (potential issue), error (system issue), critical (escalation).';
COMMENT ON COLUMN founder_overrides.reason IS 'Founder explanation for why they chose alternative action over recommendation.';
