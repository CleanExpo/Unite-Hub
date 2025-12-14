-- Phase 9 Week 1-2: Trusted Mode Foundation
-- Creates core tables for Hybrid Autonomy & Trusted Operations

-- =============================================================
-- Table: trusted_mode_requests
-- Tracks onboarding pipeline for Trusted Mode per client
-- =============================================================

CREATE TABLE IF NOT EXISTS trusted_mode_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,

  -- Onboarding status
  status TEXT NOT NULL DEFAULT 'PENDING_IDENTITY' CHECK (
    status IN (
      'PENDING_IDENTITY',
      'PENDING_OWNERSHIP',
      'PENDING_SIGNATURE',
      'ACTIVE',
      'REJECTED',
      'REVOKED'
    )
  ),

  -- Verification results
  identity_verification_result JSONB DEFAULT '{}',
  ownership_verification_result JSONB DEFAULT '{}',

  -- Signature tracking
  signature_document_id TEXT,
  signature_provider TEXT CHECK (signature_provider IN ('docusign', 'hellosign', 'manual')),
  signed_at TIMESTAMPTZ,
  signer_ip TEXT,
  signer_email TEXT,

  -- Scopes configuration (detailed in autonomy_scopes table)
  scopes_config_json JSONB DEFAULT '{}',

  -- Emergency contacts
  restore_email TEXT,
  emergency_phone TEXT,

  -- Backup settings
  nightly_backup_enabled BOOLEAN DEFAULT true,
  backup_retention_days INTEGER DEFAULT 30,

  -- Metadata
  initiated_by UUID NOT NULL,
  rejected_reason TEXT,
  revoked_reason TEXT,
  revoked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_trusted_mode_requests_org ON trusted_mode_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_trusted_mode_requests_status ON trusted_mode_requests(status);

-- =============================================================
-- Table: autonomy_scopes
-- Per-client allowed/forbidden autonomy domains & rules
-- =============================================================

CREATE TABLE IF NOT EXISTS autonomy_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,

  -- Domain-specific scope configurations
  seo_scope_json JSONB DEFAULT '{
    "enabled": false,
    "allowed_changes": [],
    "forbidden_changes": [],
    "max_title_change_percent": 20,
    "max_meta_change_percent": 30,
    "auto_fix_technical": false
  }',

  content_scope_json JSONB DEFAULT '{
    "enabled": false,
    "allowed_changes": [],
    "forbidden_changes": [],
    "auto_create_blogs": false,
    "auto_update_stats": false,
    "auto_add_faq": false
  }',

  ads_scope_json JSONB DEFAULT '{
    "enabled": false,
    "allowed_changes": [],
    "forbidden_changes": [],
    "max_bid_change_percent": 15,
    "draft_only": true
  }',

  cro_scope_json JSONB DEFAULT '{
    "enabled": false,
    "allowed_changes": [],
    "forbidden_changes": [],
    "auto_create_tests": false,
    "require_accessibility_check": true
  }',

  -- Global limits
  max_daily_actions INTEGER DEFAULT 10,
  max_risk_level_allowed TEXT DEFAULT 'LOW' CHECK (
    max_risk_level_allowed IN ('LOW', 'MEDIUM', 'HIGH')
  ),

  -- Execution window (e.g., only during business hours)
  execution_window_start TIME DEFAULT '09:00:00',
  execution_window_end TIME DEFAULT '17:00:00',
  execution_timezone TEXT DEFAULT 'Australia/Brisbane',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id)
);

-- =============================================================
-- Table: autonomy_proposals
-- Queue of proposed change-sets for human review or execution
-- =============================================================

CREATE TABLE IF NOT EXISTS autonomy_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,

  -- Source reference
  report_id UUID,
  audit_id UUID,
  recommendation_id UUID,

  -- Change details
  domain_scope TEXT NOT NULL CHECK (
    domain_scope IN ('SEO', 'CONTENT', 'ADS', 'CRO')
  ),
  change_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Risk assessment
  risk_level TEXT NOT NULL DEFAULT 'LOW' CHECK (
    risk_level IN ('LOW', 'MEDIUM', 'HIGH')
  ),
  risk_explanation TEXT,

  -- Change payload
  proposed_diff JSONB NOT NULL,
  proposed_diff_path TEXT,
  target_url TEXT,
  target_element TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTING', 'EXECUTED', 'FAILED', 'ROLLED_BACK')
  ),

  -- Approval workflow
  requires_approval BOOLEAN DEFAULT true,
  auto_approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Execution tracking
  executed_by TEXT,
  executed_at TIMESTAMPTZ,
  execution_error TEXT,

  -- Rollback support
  rollback_token_id UUID DEFAULT gen_random_uuid(),
  rollback_deadline TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID,

  -- Metadata
  created_by TEXT NOT NULL DEFAULT 'SYSTEM',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for proposals
CREATE INDEX IF NOT EXISTS idx_autonomy_proposals_client ON autonomy_proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_proposals_org ON autonomy_proposals(organization_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_proposals_status ON autonomy_proposals(status);
CREATE INDEX IF NOT EXISTS idx_autonomy_proposals_domain ON autonomy_proposals(domain_scope);
CREATE INDEX IF NOT EXISTS idx_autonomy_proposals_rollback ON autonomy_proposals(rollback_token_id);

-- =============================================================
-- Table: autonomy_executions
-- Immutable record of all executed changes
-- =============================================================

CREATE TABLE IF NOT EXISTS autonomy_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES autonomy_proposals(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,

  -- Executor info
  executor_type TEXT NOT NULL CHECK (
    executor_type IN ('SYSTEM', 'HUMAN', 'HYBRID')
  ),
  executor_id TEXT,
  agent_name TEXT,

  -- Snapshots for rollback
  before_snapshot_path TEXT,
  after_snapshot_path TEXT,
  execution_logs_path TEXT,

  -- Change details
  change_summary TEXT,
  affected_urls TEXT[],
  affected_elements JSONB,

  -- Rollback info
  rollback_token_id UUID NOT NULL,
  rollback_type TEXT CHECK (
    rollback_type IN ('SOFT_UNDO', 'HARD_UNDO', 'ESCALATED_RESTORE')
  ),
  rollback_available_until TIMESTAMPTZ,

  -- Result
  success BOOLEAN NOT NULL,
  error_message TEXT,
  duration_ms INTEGER,

  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for executions
CREATE INDEX IF NOT EXISTS idx_autonomy_executions_proposal ON autonomy_executions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_executions_client ON autonomy_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_executions_rollback ON autonomy_executions(rollback_token_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_executions_date ON autonomy_executions(executed_at);

-- =============================================================
-- Table: autonomy_audit_log
-- Complete audit trail for all autonomy actions
-- =============================================================

CREATE TABLE IF NOT EXISTS autonomy_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,

  -- Action details
  action_type TEXT NOT NULL,
  domain_scope TEXT,
  source TEXT NOT NULL,

  -- Actor info
  actor_type TEXT NOT NULL CHECK (actor_type IN ('SYSTEM', 'HUMAN')),
  actor_id TEXT,

  -- Risk and approval
  risk_level TEXT,
  approval_status TEXT CHECK (
    approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'AUTO_APPROVED_TRUSTED_MODE')
  ),

  -- References
  proposal_id UUID,
  execution_id UUID,
  rollback_token_id UUID,

  -- Snapshots
  before_snapshot_path TEXT,
  after_snapshot_path TEXT,

  -- Metadata
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,

  timestamp_utc TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_autonomy_audit_client ON autonomy_audit_log(client_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_audit_org ON autonomy_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_audit_date ON autonomy_audit_log(timestamp_utc);
CREATE INDEX IF NOT EXISTS idx_autonomy_audit_action ON autonomy_audit_log(action_type);

-- =============================================================
-- RLS Policies
-- =============================================================

ALTER TABLE trusted_mode_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_audit_log ENABLE ROW LEVEL SECURITY;

-- Trusted Mode Requests policies
CREATE POLICY "Users can view trusted mode requests for their org"
  ON trusted_mode_requests FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can manage trusted mode requests"
  ON trusted_mode_requests FOR ALL
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Autonomy Scopes policies
CREATE POLICY "Users can view autonomy scopes for their clients"
  ON autonomy_scopes FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE org_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Org admins can manage autonomy scopes"
  ON autonomy_scopes FOR ALL
  USING (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- Autonomy Proposals policies
CREATE POLICY "Users can view proposals for their org"
  ON autonomy_proposals FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage proposals for their org"
  ON autonomy_proposals FOR ALL
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

-- Autonomy Executions policies
CREATE POLICY "Users can view executions for their clients"
  ON autonomy_executions FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE org_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- Audit Log policies
CREATE POLICY "Users can view audit logs for their org"
  ON autonomy_audit_log FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Service role can insert into all tables
CREATE POLICY "Service role can insert trusted mode requests"
  ON trusted_mode_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert autonomy scopes"
  ON autonomy_scopes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert proposals"
  ON autonomy_proposals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert executions"
  ON autonomy_executions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert audit logs"
  ON autonomy_audit_log FOR INSERT
  WITH CHECK (true);

-- =============================================================
-- Updated timestamp triggers
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trusted_mode_requests_updated_at
  BEFORE UPDATE ON trusted_mode_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_autonomy_scopes_updated_at
  BEFORE UPDATE ON autonomy_scopes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_autonomy_proposals_updated_at
  BEFORE UPDATE ON autonomy_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
