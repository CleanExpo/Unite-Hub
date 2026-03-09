-- Migration 173: Stability Enforcement Protocol (SEP-1)
-- Phase 130: The hard boundary preventing runaway evolution and system instability

-- Stability enforcement records table
CREATE TABLE IF NOT EXISTS stability_enforcement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  enforcement_type TEXT NOT NULL CHECK (enforcement_type IN ('oscillation_halt', 'cooling_mode', 'safe_mode', 'region_freeze', 'founder_lock')),
  trigger_reason TEXT NOT NULL,
  affected_systems JSONB NOT NULL DEFAULT '[]',
  previous_state JSONB,
  enforced_state JSONB,
  auto_recovery_eligible BOOLEAN DEFAULT false,
  founder_acknowledgement_required BOOLEAN DEFAULT true,
  acknowledged_by UUID,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'recovering', 'resolved', 'escalated')) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- System stability mode table
CREATE TABLE IF NOT EXISTS system_stability_mode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  current_mode TEXT NOT NULL CHECK (current_mode IN ('normal', 'cooling', 'safe', 'emergency')) DEFAULT 'normal',
  mode_reason TEXT,
  oscillation_count INTEGER DEFAULT 0,
  last_oscillation_at TIMESTAMPTZ,
  frozen_regions JSONB DEFAULT '[]',
  safeguards_active JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stability_enforcement_tenant ON stability_enforcement_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stability_enforcement_status ON stability_enforcement_records(status);
CREATE INDEX IF NOT EXISTS idx_system_stability_mode_tenant ON system_stability_mode(tenant_id);

-- RLS
ALTER TABLE stability_enforcement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_stability_mode ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view stability enforcement" ON stability_enforcement_records;
CREATE POLICY "Users can view stability enforcement" ON stability_enforcement_records
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert stability enforcement" ON stability_enforcement_records;
CREATE POLICY "Users can insert stability enforcement" ON stability_enforcement_records
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update stability enforcement" ON stability_enforcement_records;
CREATE POLICY "Users can update stability enforcement" ON stability_enforcement_records
  FOR UPDATE USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view stability mode" ON system_stability_mode;
CREATE POLICY "Users can view stability mode" ON system_stability_mode
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage stability mode" ON system_stability_mode;
CREATE POLICY "Users can manage stability mode" ON system_stability_mode
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
