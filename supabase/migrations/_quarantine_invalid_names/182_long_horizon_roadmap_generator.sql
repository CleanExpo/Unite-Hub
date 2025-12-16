-- Migration 182: Long-Horizon Roadmap Generator
-- Phase 139: Creates 3-12 month advisory roadmaps

-- Roadmaps table
CREATE TABLE IF NOT EXISTS long_horizon_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  horizon_months INTEGER NOT NULL CHECK (horizon_months >= 3 AND horizon_months <= 12),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  milestones JSONB NOT NULL DEFAULT '[]',
  trends_considered JSONB DEFAULT '[]',
  constraints_applied JSONB DEFAULT '[]',
  budget_limits JSONB,
  workload_limits JSONB,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  is_advisory BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roadmaps_tenant ON long_horizon_roadmaps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON long_horizon_roadmaps(status);

-- RLS
ALTER TABLE long_horizon_roadmaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view roadmaps" ON long_horizon_roadmaps;
CREATE POLICY "Users can view roadmaps" ON long_horizon_roadmaps
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage roadmaps" ON long_horizon_roadmaps;
CREATE POLICY "Users can manage roadmaps" ON long_horizon_roadmaps
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
