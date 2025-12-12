-- Guardian H05: AI Governance Coach & Safe Enablement Wizard
-- Tenant-scoped coaching sessions for staged H01-H04 rollout planning
-- PII-free meta governance coaching with deterministic plans + optional AI narratives

-- Create ENUM types for coach status and modes
DO $$ BEGIN
  CREATE TYPE guardian_coach_status AS ENUM ('initial', 'plan_generated', 'approved', 'applied', 'failed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE guardian_coach_mode AS ENUM ('operator', 'leadership', 'cs_handoff');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE guardian_coach_action_status AS ENUM ('pending', 'approved', 'applied', 'failed', 'rolled_back');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Table 1: Governance Coach Sessions
-- Tracks coaching sessions for H01-H04 rollout planning
CREATE TABLE IF NOT EXISTS guardian_governance_coach_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Session identification
  status TEXT NOT NULL DEFAULT 'initial',  -- 'initial' | 'plan_generated' | 'approved' | 'applied' | 'failed' | 'archived'
  coach_mode TEXT NOT NULL DEFAULT 'operator',  -- 'operator' | 'leadership' | 'cs_handoff'

  -- Planning target (which H-series features to enable)
  target TEXT NOT NULL,  -- e.g., 'h01_h02_h03_h04', 'h01_h02_only', 'h04_only'

  -- Summary (human-readable, PII-free)
  summary TEXT NOT NULL,

  -- Inputs (PII-free metadata about current state)
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { guardianVersion, z10Flags, z13ScheduleCount, z14Status, z16ValidationStatus, h01Present, h02Present, h03Present, h04Present }

  -- Recommendations (PII-free advice)
  recommendations JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { nextStage, risks, warnings[], prerequisites }

  -- Proposed plan (7-stage deterministic plan)
  proposed_plan JSONB NULL,  -- { schemaVersion, stages[{index, name, prerequisites, actions[], riskNotes, rollbackPointers, expectedDuration}], totalDuration, warnings[] }

  -- Applied plan (filled when status='applied')
  applied_plan JSONB NULL,  -- Same structure as proposed_plan, but with execution timestamps

  -- Actor who initiated session
  created_by TEXT NULL,

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Validation
  CONSTRAINT status_valid CHECK (status IN ('initial', 'plan_generated', 'approved', 'applied', 'failed', 'archived')),
  CONSTRAINT coach_mode_valid CHECK (coach_mode IN ('operator', 'leadership', 'cs_handoff')),
  CONSTRAINT summary_not_empty CHECK (length(summary) > 0),
  CONSTRAINT target_not_empty CHECK (length(target) > 0)
);

CREATE INDEX IF NOT EXISTS idx_coach_sessions_tenant_created ON guardian_governance_coach_sessions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_tenant_status ON guardian_governance_coach_sessions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_tenant_mode ON guardian_governance_coach_sessions(tenant_id, coach_mode);

-- Table 2: Governance Coach Actions
-- Individual actions within a coaching session (allowlisted safe operations)
CREATE TABLE IF NOT EXISTS guardian_governance_coach_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES guardian_governance_coach_sessions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Action identification
  action_key TEXT NOT NULL,  -- e.g., 'enable_z10_ai_usage', 'create_z13_schedule', 'capture_z14_snapshot', 'run_z16_validation', 'trigger_z15_backup'
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'applied' | 'failed' | 'rolled_back'

  -- Description (PII-free, human-readable)
  description TEXT NOT NULL,

  -- Details (PII-free action parameters)
  details JSONB NOT NULL DEFAULT '{}'::jsonb,  -- e.g., { flagKey, targetValue, scheduleConfig, snapshotScope, validationLevel }

  -- Result (filled when status='applied')
  result JSONB NULL,  -- e.g., { flagsUpdated: 1, scheduleId: '...', snapshotId: '...', validationPassed: true }

  -- Error tracking (filled when status='failed')
  error_message TEXT NULL,

  -- Audit
  approved_by TEXT NULL,
  applied_by TEXT NULL,
  applied_at TIMESTAMPTZ NULL,

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Validation
  CONSTRAINT status_valid CHECK (status IN ('pending', 'approved', 'applied', 'failed', 'rolled_back')),
  CONSTRAINT action_key_not_empty CHECK (length(action_key) > 0),
  CONSTRAINT description_not_empty CHECK (length(description) > 0),
  CONSTRAINT unique_action_per_session UNIQUE (session_id, action_key)
);

CREATE INDEX IF NOT EXISTS idx_coach_actions_session ON guardian_governance_coach_actions(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_actions_tenant ON guardian_governance_coach_actions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_actions_tenant_status ON guardian_governance_coach_actions(tenant_id, status);

-- Enable Row Level Security
ALTER TABLE guardian_governance_coach_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_governance_coach_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Tenant isolation
DROP POLICY IF EXISTS "tenant_isolation_coach_sessions" ON guardian_governance_coach_sessions;
CREATE POLICY "tenant_isolation_coach_sessions" ON guardian_governance_coach_sessions
FOR ALL USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_coach_actions" ON guardian_governance_coach_actions;
CREATE POLICY "tenant_isolation_coach_actions" ON guardian_governance_coach_actions
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Table comments (documentation)
COMMENT ON TABLE guardian_governance_coach_sessions IS
  'Tenant-scoped governance coaching sessions for H01-H04 safe rollout planning. Generates 7-stage deterministic enablement plans with optional AI narratives (gated by Z10 governance). Advisory-only: admins explicitly approve and apply actions.';

COMMENT ON COLUMN guardian_governance_coach_sessions.coach_mode IS
  'Role-specific view: operator (technical details), leadership (business impact), cs_handoff (transfer kit). Determines what detail level is shown in recommendations.';

COMMENT ON COLUMN guardian_governance_coach_sessions.target IS
  'Specifies which H-series features are targets for enablement: h01_h02_h03_h04 (all), h01_h02_only (rules+anomalies), h04_only (incident scoring), etc.';

COMMENT ON COLUMN guardian_governance_coach_sessions.inputs IS
  'PII-free metadata about current state: Guardian version, Z10 governance flags (ai_usage_policy, external_sharing_policy, etc.), count of Z13 schedules, Z14 status, Z16 validation status, presence flags for H01-H04.';

COMMENT ON COLUMN guardian_governance_coach_sessions.proposed_plan IS
  'Deterministic 7-stage plan with prerequisites, rollback pointers at each stage. Structure: { schemaVersion, stages[{index, name, prerequisites[], actions[], riskNotes, rollbackPointers, expectedDuration}], totalDuration, warnings[] }. PII-free.';

COMMENT ON COLUMN guardian_governance_coach_sessions.applied_plan IS
  'Copy of proposed_plan after application, with added execution timestamps (applied_at, actor). Audit trail of what was actually applied.';

COMMENT ON TABLE guardian_governance_coach_actions IS
  'Individual actions within a coaching session. Allowlisted safe operations only: update Z10 flags, create Z13 schedules, capture Z14 snapshots, run Z16 validation (read-only), trigger Z15 backups. Each action requires approval before apply.';

COMMENT ON COLUMN guardian_governance_coach_actions.action_key IS
  'Allowlisted action type: enable_z10_ai_usage, disable_z10_ai_usage, enable_z10_external_sharing, create_z13_schedule, capture_z14_snapshot, run_z16_validation, trigger_z15_backup. Used for security allowlist enforcement.';

COMMENT ON COLUMN guardian_governance_coach_actions.details IS
  'PII-free action parameters: flagKey+targetValue (for Z10 updates), scheduleConfig (for Z13), snapshotScope (for Z14), validationLevel (for Z16). No secrets, no raw config, no identifiers.';

COMMENT ON COLUMN guardian_governance_coach_actions.result IS
  'Execution result (PII-free): counts (flagsUpdated, actionsApplied), IDs (scheduleId, snapshotId), status flags (validationPassed, backupTriggered). Audit trail of what actually happened.';
