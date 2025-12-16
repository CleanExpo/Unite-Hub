-- Migration 169: Evolution Planner
-- Phase 126: Group, de-duplicate, and schedule micro-evolution tasks into weekly cycles

-- Evolution schedules table
CREATE TABLE IF NOT EXISTS evolution_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  cycle_start DATE NOT NULL,
  cycle_end DATE NOT NULL,
  task_ids UUID[] NOT NULL DEFAULT '{}',
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  priority_breakdown JSONB NOT NULL DEFAULT '{}',
  load_aware_adjustments JSONB,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'completed', 'cancelled')) DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evolution_schedules_tenant ON evolution_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evolution_schedules_cycle ON evolution_schedules(cycle_start, cycle_end);

-- RLS
ALTER TABLE evolution_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view evolution schedules" ON evolution_schedules;
CREATE POLICY "Users can view evolution schedules" ON evolution_schedules
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert evolution schedules" ON evolution_schedules;
CREATE POLICY "Users can insert evolution schedules" ON evolution_schedules
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update evolution schedules" ON evolution_schedules;
CREATE POLICY "Users can update evolution schedules" ON evolution_schedules
  FOR UPDATE USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
