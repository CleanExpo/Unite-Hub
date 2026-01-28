-- Migration 168: Evolution Kernel v1
-- Phase 125: Daily system-wide intelligence scan producing micro-evolution tasks

-- Evolution tasks table
CREATE TABLE IF NOT EXISTS evolution_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('optimization', 'cleanup', 'enhancement', 'monitoring', 'alert')),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  source_signal JSONB NOT NULL,
  description TEXT NOT NULL,
  recommended_action TEXT,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- Evolution kernel runs table
CREATE TABLE IF NOT EXISTS evolution_kernel_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  tasks_generated INTEGER NOT NULL DEFAULT 0,
  signals_processed INTEGER NOT NULL DEFAULT 0,
  run_duration_ms INTEGER,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evolution_tasks_tenant ON evolution_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evolution_tasks_status ON evolution_tasks(status);
CREATE INDEX IF NOT EXISTS idx_evolution_kernel_runs_tenant ON evolution_kernel_runs(tenant_id);

-- RLS
ALTER TABLE evolution_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_kernel_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view evolution tasks" ON evolution_tasks;
CREATE POLICY "Users can view evolution tasks" ON evolution_tasks
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert evolution tasks" ON evolution_tasks;
CREATE POLICY "Users can insert evolution tasks" ON evolution_tasks
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update evolution tasks" ON evolution_tasks;
CREATE POLICY "Users can update evolution tasks" ON evolution_tasks
  FOR UPDATE USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view kernel runs" ON evolution_kernel_runs;
CREATE POLICY "Users can view kernel runs" ON evolution_kernel_runs
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert kernel runs" ON evolution_kernel_runs;
CREATE POLICY "Users can insert kernel runs" ON evolution_kernel_runs
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
