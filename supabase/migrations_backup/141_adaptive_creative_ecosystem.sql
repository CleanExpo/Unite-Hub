-- Migration 141: Adaptive Creative Ecosystem (ACE)
-- Phase 98: Self-adjusting creative intelligence

-- Creative adaptive states table
CREATE TABLE IF NOT EXISTS creative_adaptive_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  fatigue_index NUMERIC NOT NULL CHECK (fatigue_index >= 0 AND fatigue_index <= 1),
  style_bias JSONB NOT NULL DEFAULT '{}',
  method_weights JSONB NOT NULL DEFAULT '{}',
  performance_overlays JSONB DEFAULT '{}',
  compliance_adjustments JSONB DEFAULT '{}',
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creative_adaptive_region ON creative_adaptive_states(region_id);
CREATE INDEX IF NOT EXISTS idx_creative_adaptive_tenant ON creative_adaptive_states(tenant_id);
CREATE INDEX IF NOT EXISTS idx_creative_adaptive_fatigue ON creative_adaptive_states(fatigue_index);
CREATE INDEX IF NOT EXISTS idx_creative_adaptive_created ON creative_adaptive_states(created_at DESC);

-- RLS
ALTER TABLE creative_adaptive_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant creative states"
  ON creative_adaptive_states FOR SELECT
  USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    OR tenant_id IS NULL
  );

CREATE POLICY "Users can insert creative states for their tenant"
  ON creative_adaptive_states FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    OR tenant_id IS NULL
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_creative_adaptive_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_creative_adaptive_updated_at
  BEFORE UPDATE ON creative_adaptive_states
  FOR EACH ROW
  EXECUTE FUNCTION update_creative_adaptive_updated_at();

COMMENT ON TABLE creative_adaptive_states IS 'Phase 98: Adaptive creative intelligence states';
COMMENT ON COLUMN creative_adaptive_states.fatigue_index IS 'Creative fatigue level 0.0-1.0';
