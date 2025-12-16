-- Migration 170: Autonomous Adjustment Engine
-- Phase 127: Executes only low-risk micro-adjustments under strict guardrails

-- Autonomous adjustments table
CREATE TABLE IF NOT EXISTS autonomous_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  task_id UUID REFERENCES evolution_tasks(id) ON DELETE SET NULL,
  adjustment_type TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('minimal', 'low', 'medium')) DEFAULT 'low',
  safety_checks_passed JSONB NOT NULL DEFAULT '[]',
  vetoed_by TEXT,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'executing', 'completed', 'vetoed', 'rolled_back')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_autonomous_adjustments_tenant ON autonomous_adjustments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_adjustments_status ON autonomous_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_autonomous_adjustments_task ON autonomous_adjustments(task_id);

-- RLS
ALTER TABLE autonomous_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view autonomous adjustments" ON autonomous_adjustments;
CREATE POLICY "Users can view autonomous adjustments" ON autonomous_adjustments
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert autonomous adjustments" ON autonomous_adjustments;
CREATE POLICY "Users can insert autonomous adjustments" ON autonomous_adjustments
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update autonomous adjustments" ON autonomous_adjustments;
CREATE POLICY "Users can update autonomous adjustments" ON autonomous_adjustments
  FOR UPDATE USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
