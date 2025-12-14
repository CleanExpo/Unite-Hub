-- Migration 101: Self-Healing Workflows
-- Required by Phase 49 - Self-Healing Workflows (SHW)
-- Correction engine for broken workflows with auto-repair

-- Workflow failures table
CREATE TABLE IF NOT EXISTS workflow_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  workflow_name TEXT NOT NULL,
  failure_reason TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,

  -- Foreign key
  CONSTRAINT workflow_failures_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_failures_org ON workflow_failures(org_id);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_name ON workflow_failures(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_reason ON workflow_failures(failure_reason);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_detected ON workflow_failures(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_unresolved ON workflow_failures(resolved) WHERE resolved = false;

-- Enable RLS
ALTER TABLE workflow_failures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY workflow_failures_select ON workflow_failures
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY workflow_failures_insert ON workflow_failures
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY workflow_failures_update ON workflow_failures
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE workflow_failures IS 'Detected workflow failures for self-healing (Phase 49)';

-- Workflow heal attempts table
CREATE TABLE IF NOT EXISTS workflow_heal_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  failure_id UUID NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  strategy TEXT NOT NULL,
  result TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,

  -- Foreign key
  CONSTRAINT workflow_heal_attempts_failure_fk
    FOREIGN KEY (failure_id) REFERENCES workflow_failures(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_heal_attempts_failure ON workflow_heal_attempts(failure_id);
CREATE INDEX IF NOT EXISTS idx_workflow_heal_attempts_attempted ON workflow_heal_attempts(attempted_at DESC);

-- Enable RLS
ALTER TABLE workflow_heal_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY workflow_heal_attempts_select ON workflow_heal_attempts
  FOR SELECT TO authenticated
  USING (failure_id IN (
    SELECT id FROM workflow_failures
    WHERE org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  ));

CREATE POLICY workflow_heal_attempts_insert ON workflow_heal_attempts
  FOR INSERT TO authenticated
  WITH CHECK (failure_id IN (
    SELECT id FROM workflow_failures
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE workflow_heal_attempts IS 'Healing attempt log for workflow failures (Phase 49)';
