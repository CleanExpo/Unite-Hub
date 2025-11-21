-- Migration 090: Usage Lockouts
-- Required by Phase 38 - Voice/Text Usage Enforcement & Lockouts
-- Track lockouts and warnings when budgets exhausted

-- Usage lockouts table
CREATE TABLE IF NOT EXISTS usage_lockouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  lockout_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  unlocked_at TIMESTAMPTZ,
  unlocked_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Lockout type check
  CONSTRAINT usage_lockouts_type_check CHECK (
    lockout_type IN ('voice', 'text', 'both')
  ),

  -- Foreign keys
  CONSTRAINT usage_lockouts_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT usage_lockouts_user_fk
    FOREIGN KEY (unlocked_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_lockouts_org ON usage_lockouts(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_lockouts_type ON usage_lockouts(lockout_type);
CREATE INDEX IF NOT EXISTS idx_usage_lockouts_active
  ON usage_lockouts(org_id) WHERE unlocked_at IS NULL;

-- Enable RLS
ALTER TABLE usage_lockouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY usage_lockouts_select ON usage_lockouts
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY usage_lockouts_insert ON usage_lockouts
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY usage_lockouts_update ON usage_lockouts
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE usage_lockouts IS 'Track usage lockouts when budgets exhausted (Phase 38)';

-- Usage warnings table
CREATE TABLE IF NOT EXISTS usage_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  warning_type TEXT NOT NULL,
  threshold_percent INTEGER NOT NULL,
  message TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Warning type check
  CONSTRAINT usage_warnings_type_check CHECK (
    warning_type IN ('voice_low', 'text_low', 'voice_critical', 'text_critical')
  ),

  -- Foreign keys
  CONSTRAINT usage_warnings_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT usage_warnings_user_fk
    FOREIGN KEY (acknowledged_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_warnings_org ON usage_warnings(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_warnings_unack
  ON usage_warnings(org_id) WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_usage_warnings_created ON usage_warnings(created_at DESC);

-- Enable RLS
ALTER TABLE usage_warnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY usage_warnings_select ON usage_warnings
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY usage_warnings_insert ON usage_warnings
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY usage_warnings_update ON usage_warnings
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE usage_warnings IS 'Track low balance warnings for users (Phase 38)';
