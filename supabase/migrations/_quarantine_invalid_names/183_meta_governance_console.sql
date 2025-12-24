-- Migration 183: Meta-Governance Console
-- Phase 140: Central console for governance parameters

-- Governance profiles table
CREATE TABLE IF NOT EXISTS governance_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  truth_layer_strictness TEXT NOT NULL CHECK (truth_layer_strictness IN ('strict', 'standard', 'relaxed')) DEFAULT 'standard',
  evolution_aggressiveness TEXT NOT NULL CHECK (evolution_aggressiveness IN ('conservative', 'moderate', 'aggressive')) DEFAULT 'moderate',
  automation_level TEXT NOT NULL CHECK (automation_level IN ('minimal', 'standard', 'full')) DEFAULT 'standard',
  safety_threshold NUMERIC NOT NULL CHECK (safety_threshold >= 0.5 AND safety_threshold <= 1) DEFAULT 0.8,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Governance change logs table
CREATE TABLE IF NOT EXISTS governance_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  change_type TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_governance_profiles_tenant ON governance_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_governance_profiles_active ON governance_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_governance_logs_tenant ON governance_change_logs(tenant_id);

-- RLS
ALTER TABLE governance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_change_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view governance profiles" ON governance_profiles;
CREATE POLICY "Users can view governance profiles" ON governance_profiles
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage governance profiles" ON governance_profiles;
CREATE POLICY "Users can manage governance profiles" ON governance_profiles
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view governance logs" ON governance_change_logs;
CREATE POLICY "Users can view governance logs" ON governance_change_logs
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert governance logs" ON governance_change_logs;
CREATE POLICY "Users can insert governance logs" ON governance_change_logs
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
