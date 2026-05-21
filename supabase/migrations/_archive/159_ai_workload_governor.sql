-- Migration 159: AI Workload Governor (AIWG)
-- Phase 116: Controls AI spend and workload per tenant/region

CREATE TABLE IF NOT EXISTS ai_workload_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  monthly_budget_units NUMERIC NOT NULL CHECK (monthly_budget_units > 0),
  priority_rules JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_workload_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  usage_breakdown JSONB NOT NULL,
  remaining_budget_units NUMERIC NOT NULL,
  recommendations JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_workload_policies_tenant ON ai_workload_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_workload_snapshots_tenant ON ai_workload_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_workload_snapshots_created ON ai_workload_snapshots(created_at DESC);

ALTER TABLE ai_workload_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workload_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage workload policies" ON ai_workload_policies;
CREATE POLICY "Users can manage workload policies" ON ai_workload_policies FOR ALL
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view workload snapshots" ON ai_workload_snapshots;
CREATE POLICY "Users can view workload snapshots" ON ai_workload_snapshots FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

COMMENT ON TABLE ai_workload_policies IS 'Phase 116: AI workload budget policies';
COMMENT ON TABLE ai_workload_snapshots IS 'Phase 116: AI workload usage snapshots';
